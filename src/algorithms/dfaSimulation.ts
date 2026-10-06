import { AutomatonDefinition, SimulationResult, SimulationStep } from '../types/automata';

// Check if a symbol represents epsilon
export function isEpsilon(sym: string): boolean {
  if (!sym) return true;
  const s = sym.trim();
  return (
    s === 'ε' ||
    s === 'eps' ||
    s === 'lambda' ||
    s === 'λ' ||
    s === '' ||
    s.toLowerCase() === 'epsilon'
  );
}

// Check if a transition edge matches a symbol
export function transitionMatchesSymbol(edgeSymbols: string[], symbol: string): boolean {
  const target = symbol.trim();
  return edgeSymbols.some(s => {
    if (s.trim() === target) return true;
    const parts = s.split(/[, ]+/).map(x => x.trim()).filter(Boolean);
    return parts.includes(target);
  });
}

// Compute epsilon closure for a set of states
export function getEpsilonClosure(
  stateIds: string[],
  machine: AutomatonDefinition
): string[] {
  const closure = new Set<string>(stateIds);
  const queue = [...stateIds];

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const outgoing = machine.transitions.filter(t => t.from === curr);
    for (const trans of outgoing) {
      const hasEpsilonEdge = trans.symbols.some(s => {
        if (isEpsilon(s)) return true;
        const parts = s.split(/[, ]+/).map(x => x.trim()).filter(Boolean);
        return parts.some(isEpsilon);
      });
      if (hasEpsilonEdge) {
        if (!closure.has(trans.to)) {
          closure.add(trans.to);
          queue.push(trans.to);
        }
      }
    }
  }

  return Array.from(closure);
}

// Simulate input string on a DFA, NFA, or ε-NFA
export function simulateAutomaton(
  machine: AutomatonDefinition,
  input: string
): SimulationResult {
  const effectiveStartId =
    (machine.startStateId && machine.states.some(s => s.id === machine.startStateId))
      ? machine.startStateId
      : (machine.states.find(s => s.isStart)?.id || machine.states[0]?.id || '');

  if (!effectiveStartId) {
    return {
      accepted: false,
      status: 'REJECTED',
      finalStateIds: [],
      path: [],
      detailedReason: 'Error: No start state defined for this machine. Add a state and designate it as the Start state.',
      totalSteps: 0,
    };
  }

  const steps: SimulationStep[] = [];
  const isEpsilonNfa =
    machine.type === 'ENFA' ||
    machine.transitions.some(t =>
      t.symbols.some(s => {
        if (isEpsilon(s)) return true;
        const parts = s.split(/[, ]+/).map(x => x.trim()).filter(Boolean);
        return parts.some(isEpsilon);
      })
    );

  // Initial state(s)
  let currentStates = isEpsilonNfa
    ? getEpsilonClosure([effectiveStartId], machine)
    : [effectiveStartId];

  // Step 0
  const startLabels = currentStates
    .map(id => machine.states.find(s => s.id === id)?.label || id)
    .join(', ');

  steps.push({
    stepIndex: 0,
    symbol: null,
    currentStateIds: [...currentStates],
    inputRemaining: input,
    inputProcessed: '',
    explanation: `Machine initialized at start state(s): {${startLabels}}${isEpsilonNfa ? ' (including ε-closure)' : ''}.`,
  });

  let processed = '';

  for (let i = 0; i < input.length; i++) {
    const symbol = input[i];
    processed += symbol;
    const remaining = input.slice(i + 1);
    const nextStatesSet = new Set<string>();
    let activeTransitionId: string | undefined;

    // Check if symbol belongs to alphabet
    if (!machine.alphabet.includes(symbol)) {
      steps.push({
        stepIndex: i + 1,
        symbol,
        currentStateIds: [],
        previousStateIds: [...currentStates],
        inputRemaining: remaining,
        inputProcessed: processed,
        explanation: `Symbol '${symbol}' is not in the machine alphabet Σ = {${machine.alphabet.join(', ')}}. Execution halted.`,
      });
      return {
        accepted: false,
        status: 'HALTED',
        finalStateIds: currentStates,
        path: steps,
        detailedReason: `The input symbol '${symbol}' at position ${i + 1} does not belong to the alphabet Σ = {${machine.alphabet.join(', ')}}.`,
        totalSteps: steps.length,
      };
    }

    // Advance transitions for each active state
    for (const stateId of currentStates) {
      const transitions = machine.transitions.filter(
        t => t.from === stateId && transitionMatchesSymbol(t.symbols, symbol)
      );
      for (const t of transitions) {
        nextStatesSet.add(t.to);
        activeTransitionId = t.id;
      }
    }

    if (nextStatesSet.size === 0) {
      const prevLabels = currentStates
        .map(id => machine.states.find(s => s.id === id)?.label || id)
        .join(', ');
      steps.push({
        stepIndex: i + 1,
        symbol,
        currentStateIds: [],
        previousStateIds: [...currentStates],
        inputRemaining: remaining,
        inputProcessed: processed,
        explanation: `No transition defined from state(s) {${prevLabels}} on symbol '${symbol}'. Machine halted (trapped).`,
      });
      return {
        accepted: false,
        status: 'REJECTED',
        finalStateIds: [],
        path: steps,
        detailedReason: `No valid transition exists for input '${symbol}' from active state(s) {${prevLabels}}. The machine entered a trap and rejected the string.`,
        totalSteps: steps.length,
      };
    }

    // Apply ε-closure if needed
    const nextStatesArray = Array.from(nextStatesSet);
    const resolvedNextStates = isEpsilonNfa
      ? getEpsilonClosure(nextStatesArray, machine)
      : nextStatesArray;

    const fromLabels = currentStates
      .map(id => machine.states.find(s => s.id === id)?.label || id)
      .join(', ');
    const toLabels = resolvedNextStates
      .map(id => machine.states.find(s => s.id === id)?.label || id)
      .join(', ');

    steps.push({
      stepIndex: i + 1,
      symbol,
      currentStateIds: resolvedNextStates,
      previousStateIds: [...currentStates],
      activeTransitionId,
      inputRemaining: remaining,
      inputProcessed: processed,
      explanation: `Read '${symbol}': δ({${fromLabels}}, '${symbol}') -> {${toLabels}}${isEpsilonNfa ? ' (expanded via ε)' : ''}.`,
    });

    currentStates = resolvedNextStates;
  }

  // Check acceptance: does current active set intersect with final states?
  const allFinalStateIds = new Set<string>([
    ...(machine.finalStateIds || []),
    ...machine.states.filter(s => s.isFinal).map(s => s.id),
  ]);
  const acceptingReached = currentStates.filter(id => allFinalStateIds.has(id));
  const accepted = acceptingReached.length > 0;

  const finalStateLabels = currentStates
    .map(id => machine.states.find(s => s.id === id)?.label || id)
    .join(', ');
  const acceptingLabels = acceptingReached
    .map(id => machine.states.find(s => s.id === id)?.label || id)
    .join(', ');

  let detailedReason = '';
  if (accepted) {
    detailedReason = `The machine successfully consumed the entire input "${input || 'ε'}" and halted in accepting state(s) {${acceptingLabels}}. Therefore, the string is ACCEPTED ✓.`;
  } else {
    detailedReason = `The machine consumed the entire input "${input || 'ε'}" but ended in non-accepting state(s) {${finalStateLabels || 'none'}}. Therefore, the string is REJECTED ✗.`;
  }

  return {
    accepted,
    status: accepted ? 'ACCEPTED' : 'REJECTED',
    finalStateIds: currentStates,
    path: steps,
    detailedReason,
    totalSteps: steps.length,
  };
}
