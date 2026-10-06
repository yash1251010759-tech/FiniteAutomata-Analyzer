import { AutomatonDefinition, StateNode, TransitionEdge } from '../types/automata';
import { getEpsilonClosure, isEpsilon } from './dfaSimulation';

export interface SubsetRow {
  step: number;
  dfaStateName: string;
  nfaStates: string[];
  transitions: { [symbol: string]: { targetName: string; targetSubset: string[] } };
  isFinal: boolean;
  isStart: boolean;
}

export interface ConversionStepReport {
  originalType: 'DFA' | 'ENFA' | 'NFA';
  targetType: 'NFA' | 'DFA';
  subsetRows: SubsetRow[];
  resultMachine: AutomatonDefinition;
  explanation: string[];
}

// Helper to get subset key for map
function getSubsetKey(stateIds: string[]): string {
  return [...stateIds].sort().join(',');
}

// Auto-layout helper for generated nodes
export function layoutNodes(states: StateNode[], width = 750, height = 400): StateNode[] {
  const n = states.length;
  if (n === 0) return [];
  if (n === 1) {
    return [{ ...states[0], x: width / 2, y: height / 2 }];
  }

  // Linear layout or circle layout
  if (n <= 4) {
    const spacing = width / (n + 1);
    return states.map((s, idx) => ({
      ...s,
      x: Math.round(spacing * (idx + 1)),
      y: Math.round(height / 2 + (idx % 2 === 1 ? 30 : -30)),
    }));
  }

  // Circular layout for 5+ states
  const radius = Math.min(width, height) * 0.36;
  const centerX = width / 2;
  const centerY = height / 2;

  return states.map((s, idx) => {
    const angle = (2 * Math.PI * idx) / n - Math.PI / 2;
    return {
      ...s,
      x: Math.round(centerX + radius * Math.cos(angle)),
      y: Math.round(centerY + radius * Math.sin(angle)),
    };
  });
}

// Convert ε-NFA to NFA (bypassing ε-transitions)
export function convertEnfaToNfa(machine: AutomatonDefinition): ConversionStepReport {
  const explanation: string[] = [
    'Step 1: Compute ε-closure for every state in Q.',
    'Step 2: For every state q and input symbol a ∈ Σ, δ_new(q, a) = ε-closure( δ( ε-closure(q), a ) ).',
    'Step 3: A state q is final in the new NFA if its ε-closure contains any original final state.',
  ];

  const epsilonClosures = new Map<string, string[]>();
  for (const st of machine.states) {
    epsilonClosures.set(st.id, getEpsilonClosure([st.id], machine));
  }

  // Compute new final states
  const newFinalStates: string[] = [];
  for (const st of machine.states) {
    const closure = epsilonClosures.get(st.id) || [];
    if (closure.some(id => machine.finalStateIds.includes(id))) {
      newFinalStates.push(st.id);
    }
  }

  // Compute new transitions
  const newTransitions: TransitionEdge[] = [];
  const transMap = new Map<string, Set<string>>(); // key: `from:to` -> Set<symbols>

  for (const st of machine.states) {
    const closure = epsilonClosures.get(st.id) || [];

    for (const sym of machine.alphabet) {
      if (isEpsilon(sym)) continue;

      // Find all states reachable on symbol from any state in closure
      const reachedOnSym = new Set<string>();
      for (const cState of closure) {
        const out = machine.transitions.filter(t => t.from === cState && t.symbols.includes(sym));
        for (const o of out) {
          reachedOnSym.add(o.to);
        }
      }

      // Then take epsilon closure of those reached states
      const fullTarget = getEpsilonClosure(Array.from(reachedOnSym), machine);

      for (const targetId of fullTarget) {
        const pairKey = `${st.id}:${targetId}`;
        if (!transMap.has(pairKey)) {
          transMap.set(pairKey, new Set<string>());
        }
        transMap.get(pairKey)!.add(sym);
      }
    }
  }

  let edgeIdx = 0;
  for (const [pairKey, symSet] of transMap.entries()) {
    const [from, to] = pairKey.split(':');
    newTransitions.push({
      id: `trans-nfa-${edgeIdx++}`,
      from,
      to,
      symbols: Array.from(symSet).sort(),
    });
  }

  const resultMachine: AutomatonDefinition = {
    id: `nfa-${Date.now()}`,
    name: `${machine.name} (Converted NFA)`,
    type: 'NFA',
    alphabet: machine.alphabet.filter(s => !isEpsilon(s)),
    states: layoutNodes(
      machine.states.map(s => ({
        ...s,
        isFinal: newFinalStates.includes(s.id),
      }))
    ),
    transitions: newTransitions,
    startStateId: machine.startStateId,
    finalStateIds: newFinalStates,
  };

  return {
    originalType: 'ENFA',
    targetType: 'NFA',
    subsetRows: [],
    resultMachine,
    explanation,
  };
}

// Convert NFA or ε-NFA to DFA using Subset Construction (Powerset construction)
export function convertNfaToDfa(machine: AutomatonDefinition): ConversionStepReport {
  const isEpsilonNfa = machine.type === 'ENFA' || machine.transitions.some(t => t.symbols.some(isEpsilon));
  const alphabet = machine.alphabet.filter(s => !isEpsilon(s));

  // Step 1: Initial subset = ε-closure({startState})
  const initialSubset = isEpsilonNfa
    ? getEpsilonClosure([machine.startStateId], machine)
    : [machine.startStateId];

  const subsetRows: SubsetRow[] = [];
  const subsetToDfaName = new Map<string, string>();
  const subsetList: { name: string; subset: string[] }[] = [];

  const initialKey = getSubsetKey(initialSubset);
  const startName = 'q0';
  subsetToDfaName.set(initialKey, startName);
  subsetList.push({ name: startName, subset: initialSubset });

  const dfaTransitions: TransitionEdge[] = [];
  const dfaStates: StateNode[] = [];
  const dfaFinalStateIds: string[] = [];

  let stateCounter = 0;
  let queueHead = 0;

  while (queueHead < subsetList.length) {
    const current = subsetList[queueHead++];
    const currentName = current.name;
    const currentSubset = current.subset;

    // Check if this subset contains any original final state
    const isFinal = currentSubset.some(id => machine.finalStateIds.includes(id));
    const isStart = currentName === startName;

    if (isFinal) {
      dfaFinalStateIds.push(currentName);
    }

    // Friendly label like [q0, q1]
    const stateLabels = currentSubset
      .map(id => machine.states.find(s => s.id === id)?.label || id)
      .sort();
    const friendlyLabel = stateLabels.length === 0 ? '∅ (Trap)' : `[${stateLabels.join(',')}]`;

    dfaStates.push({
      id: currentName,
      label: friendlyLabel,
      x: 0,
      y: 0,
      isStart,
      isFinal,
      description: `Represents NFA subset {${stateLabels.join(', ')}}`,
    });

    const rowTransitions: { [sym: string]: { targetName: string; targetSubset: string[] } } = {};

    for (const sym of alphabet) {
      // Find move(currentSubset, sym)
      const moveSet = new Set<string>();
      for (const stId of currentSubset) {
        const out = machine.transitions.filter(t => t.from === stId && t.symbols.includes(sym));
        for (const o of out) {
          moveSet.add(o.to);
        }
      }

      // Compute ε-closure of moveSet
      const targetSubset = isEpsilonNfa
        ? getEpsilonClosure(Array.from(moveSet), machine)
        : Array.from(moveSet);

      const targetKey = getSubsetKey(targetSubset);
      let targetName = subsetToDfaName.get(targetKey);

      if (!targetName) {
        stateCounter++;
        targetName = `q${stateCounter}`;
        subsetToDfaName.set(targetKey, targetName);
        subsetList.push({ name: targetName, subset: targetSubset });
      }

      rowTransitions[sym] = {
        targetName,
        targetSubset,
      };

      // Register transition
      // Check if existing edge from currentName to targetName
      const existingEdge = dfaTransitions.find(
        t => t.from === currentName && t.to === targetName
      );
      if (existingEdge) {
        if (!existingEdge.symbols.includes(sym)) {
          existingEdge.symbols.push(sym);
        }
      } else {
        dfaTransitions.push({
          id: `dfa-edge-${dfaTransitions.length}`,
          from: currentName,
          to: targetName,
          symbols: [sym],
        });
      }
    }

    subsetRows.push({
      step: queueHead,
      dfaStateName: currentName,
      nfaStates: currentSubset,
      transitions: rowTransitions,
      isFinal,
      isStart,
    });
  }

  // Layout states
  const positionedStates = layoutNodes(dfaStates);

  const resultMachine: AutomatonDefinition = {
    id: `dfa-${Date.now()}`,
    name: `${machine.name} (Converted DFA)`,
    type: 'DFA',
    alphabet,
    states: positionedStates,
    transitions: dfaTransitions,
    startStateId: startName,
    finalStateIds: dfaFinalStateIds,
  };

  const explanation = [
    `Initial State: ε-closure({${machine.startStateId}}) = {${initialSubset.join(', ')}} mapped to ${startName}.`,
    `Discovered ${dfaStates.length} deterministic states using Subset Construction.`,
    `Final states marked for any subset containing original final states: {${machine.finalStateIds.join(', ')}}.`,
  ];

  return {
    originalType: isEpsilonNfa ? 'ENFA' : 'NFA',
    targetType: 'DFA',
    subsetRows,
    resultMachine,
    explanation,
  };
}

// Convert DFA to NFA (trivial formal embedding)
export function convertDfaToNfa(dfa: AutomatonDefinition): ConversionStepReport {
  const resultMachine: AutomatonDefinition = {
    ...dfa,
    id: `nfa-${Date.now()}`,
    name: `${dfa.name} (as NFA)`,
    type: 'NFA',
    states: dfa.states.map(s => ({ ...s })),
    transitions: dfa.transitions.map(t => ({ ...t })),
  };

  return {
    originalType: 'DFA',
    targetType: 'NFA',
    subsetRows: [],
    resultMachine,
    explanation: [
      '1. Every DFA is mathematically already a valid NFA with a deterministic branching factor of exactly 1.',
      '2. The transition function δ: Q × Σ → Q is formally re-mapped to singleton sets: δ: Q × Σ → 2^Q where δ(q, a) = {q\u0027}.',
      '3. No state modification or powerset expansion is required; the recognized language is identical.',
    ],
  };
}
