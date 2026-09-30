import { AutomatonDefinition, StateNode, TransitionEdge } from '../types/automata';
import { layoutNodes } from './subsetConstruction';

export interface MinimizationIteration {
  iterationNumber: number;
  partition: string[][]; // list of groups, where each group is state IDs
  splitOccurred: boolean;
  notes: string;
}

export interface MinimizationReport {
  originalMachine: AutomatonDefinition;
  minimizedMachine: AutomatonDefinition;
  unreachableStatesRemoved: string[];
  initialPartition: string[][];
  iterations: MinimizationIteration[];
  equivalentStateGroups: string[][];
  statesBefore: number;
  statesAfter: number;
  transitionsBefore: number;
  transitionsAfter: number;
  isAlreadyMinimal: boolean;
}

// Find all states reachable from start state via BFS
export function getReachableStates(machine: AutomatonDefinition): string[] {
  if (!machine.startStateId) return [];
  const visited = new Set<string>([machine.startStateId]);
  const queue = [machine.startStateId];

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const outgoing = machine.transitions.filter(t => t.from === curr);
    for (const t of outgoing) {
      if (!visited.has(t.to)) {
        visited.add(t.to);
        queue.push(t.to);
      }
    }
  }

  return Array.from(visited);
}

// DFA Minimization Algorithm (Hopcroft / Partition Refinement)
export function minimizeDFA(machine: AutomatonDefinition): MinimizationReport {
  const alphabet = machine.alphabet.filter(s => s !== 'ε' && s !== 'λ');

  // Step 1: Remove unreachable states
  const reachableIds = new Set(getReachableStates(machine));
  const unreachableStatesRemoved = machine.states
    .filter(s => !reachableIds.has(s.id))
    .map(s => s.label || s.id);

  // Filter machine to only reachable states
  const reachableStates = machine.states.filter(s => reachableIds.has(s.id));
  const reachableTransitions = machine.transitions.filter(
    t => reachableIds.has(t.from) && reachableIds.has(t.to)
  );
  const reachableFinals = machine.finalStateIds.filter(id => reachableIds.has(id));

  // Step 2: Initial partition P0 = { Non-Final, Final }
  const groupNonFinal = reachableStates.filter(s => !reachableFinals.includes(s.id)).map(s => s.id);
  const groupFinal = reachableStates.filter(s => reachableFinals.includes(s.id)).map(s => s.id);

  let currentPartition: string[][] = [];
  if (groupNonFinal.length > 0) currentPartition.push(groupNonFinal);
  if (groupFinal.length > 0) currentPartition.push(groupFinal);

  const initialPartition = currentPartition.map(g => [...g]);
  const iterations: MinimizationIteration[] = [];
  let iterationCount = 0;
  let changed = true;

  // Helper to find which group a state belongs to
  const findGroupIndex = (stateId: string, partition: string[][]): number => {
    return partition.findIndex(group => group.includes(stateId));
  };

  // Helper to find transition destination for (stateId, symbol)
  const getNextState = (stateId: string, sym: string): string | null => {
    const t = reachableTransitions.find(edge => edge.from === stateId && edge.symbols.includes(sym));
    return t ? t.to : null;
  };

  // Step 3: Partition Refinement Loop
  while (changed) {
    iterationCount++;
    changed = false;
    const nextPartition: string[][] = [];
    let splitInThisIteration = false;

    for (const group of currentPartition) {
      if (group.length <= 1) {
        nextPartition.push(group);
        continue;
      }

      // Group states by signature: [groupIndex_for_sym0, groupIndex_for_sym1, ...]
      const signatureMap = new Map<string, string[]>();

      for (const st of group) {
        const sig = alphabet
          .map(sym => {
            const nextSt = getNextState(st, sym);
            return nextSt ? findGroupIndex(nextSt, currentPartition) : -1;
          })
          .join('|');

        if (!signatureMap.has(sig)) {
          signatureMap.set(sig, []);
        }
        signatureMap.get(sig)!.push(st);
      }

      if (signatureMap.size > 1) {
        changed = true;
        splitInThisIteration = true;
        for (const subGroup of signatureMap.values()) {
          nextPartition.push(subGroup);
        }
      } else {
        nextPartition.push(group);
      }
    }

    iterations.push({
      iterationNumber: iterationCount,
      partition: nextPartition.map(g => [...g]),
      splitOccurred: splitInThisIteration,
      notes: splitInThisIteration
        ? `Iteration ${iterationCount}: Groups partitioned into ${nextPartition.length} sub-classes.`
        : `Iteration ${iterationCount}: Partition stabilized with ${nextPartition.length} equivalence classes.`,
    });

    currentPartition = nextPartition;
  }

  // Equivalent state groups (groups with >1 state)
  const equivalentStateGroups = currentPartition.filter(g => g.length > 1);

  // Step 4 & 5: Construct the Minimized DFA
  const newStates: StateNode[] = [];
  const stateToGroupMap = new Map<string, string>(); // oldStateId -> newGroupId
  let startGroupStateId = '';
  const finalGroupStateIds: string[] = [];

  currentPartition.forEach((group, idx) => {
    const groupId = `q${idx}`;
    const labels = group.map(id => machine.states.find(s => s.id === id)?.label || id).sort();
    const groupLabel = labels.length > 1 ? `[${labels.join(',')}]` : labels[0];
    const isStart = group.includes(machine.startStateId);
    const isFinal = group.some(id => machine.finalStateIds.includes(id));

    if (isStart) startGroupStateId = groupId;
    if (isFinal) finalGroupStateIds.push(groupId);

    for (const oldId of group) {
      stateToGroupMap.set(oldId, groupId);
    }

    newStates.push({
      id: groupId,
      label: groupLabel,
      x: 0,
      y: 0,
      isStart,
      isFinal,
      description: `Merged states: ${labels.join(', ')}`,
    });
  });

  // Build transitions between groups
  const newTransitions: TransitionEdge[] = [];
  const edgeSymbolMap = new Map<string, Set<string>>(); // `fromGroupId:toGroupId` -> Set<symbol>

  currentPartition.forEach(group => {
    const repState = group[0];
    const fromGroupId = stateToGroupMap.get(repState)!;

    for (const sym of alphabet) {
      const nextSt = getNextState(repState, sym);
      if (nextSt) {
        const toGroupId = stateToGroupMap.get(nextSt)!;
        const key = `${fromGroupId}:${toGroupId}`;
        if (!edgeSymbolMap.has(key)) {
          edgeSymbolMap.set(key, new Set());
        }
        edgeSymbolMap.get(key)!.add(sym);
      }
    }
  });

  let edgeCounter = 0;
  for (const [key, symSet] of edgeSymbolMap.entries()) {
    const [from, to] = key.split(':');
    newTransitions.push({
      id: `min-edge-${edgeCounter++}`,
      from,
      to,
      symbols: Array.from(symSet).sort(),
    });
  }

  const minimizedMachine: AutomatonDefinition = {
    id: `min-dfa-${Date.now()}`,
    name: `${machine.name} (Minimized)`,
    type: 'DFA',
    alphabet,
    states: layoutNodes(newStates),
    transitions: newTransitions,
    startStateId: startGroupStateId,
    finalStateIds: finalGroupStateIds,
  };

  const isAlreadyMinimal =
    unreachableStatesRemoved.length === 0 &&
    minimizedMachine.states.length === machine.states.length;

  return {
    originalMachine: machine,
    minimizedMachine,
    unreachableStatesRemoved,
    initialPartition,
    iterations,
    equivalentStateGroups,
    statesBefore: machine.states.length,
    statesAfter: minimizedMachine.states.length,
    transitionsBefore: machine.transitions.length,
    transitionsAfter: minimizedMachine.transitions.length,
    isAlreadyMinimal,
  };
}
