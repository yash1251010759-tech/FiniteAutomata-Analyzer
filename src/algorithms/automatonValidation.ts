import { AutomatonDefinition, TransitionEdge } from '../types/automata';

export interface AutomatonValidation {
  errors: string[];
  warnings: string[];
  missingTransitions: Array<{ stateId: string; symbol: string }>;
  duplicateTransitions: Array<{ stateId: string; symbol: string }>;
}

const isEpsilon = (symbol: string): boolean => ['ε', 'eps', 'lambda', 'λ', 'epsilon'].includes(symbol.trim().toLowerCase());

export function validateAutomaton(machine: AutomatonDefinition, requireCompleteDfa = false): AutomatonValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const stateIds = new Set(machine.states.map(state => state.id));
  const finals = machine.finalStateIds || [];
  const seen = new Set<string>();
  const duplicateTransitions: AutomatonValidation['duplicateTransitions'] = [];
  const missingTransitions: AutomatonValidation['missingTransitions'] = [];

  if (!machine.startStateId || !stateIds.has(machine.startStateId)) {
    errors.push(`Start state '${machine.startStateId || '(unset)'}' does not exist.`);
  }
  if (finals.some(id => !stateIds.has(id))) {
    errors.push(`Final state(s) do not exist: ${finals.filter(id => !stateIds.has(id)).join(', ')}.`);
  }
  if (machine.type === 'DFA' && machine.alphabet.some(isEpsilon)) {
    errors.push('A DFA input alphabet cannot contain ε.');
  }
  if (finals.length === 0 && !machine.states.some(state => state.isFinal)) {
    warnings.push('The machine has no final states and accepts no strings.');
  }

  for (const transition of machine.transitions) {
    if (!stateIds.has(transition.from)) errors.push(`Transition source '${transition.from}' does not exist.`);
    if (!stateIds.has(transition.to)) errors.push(`Transition destination '${transition.to}' does not exist.`);
    for (const symbol of transition.symbols) {
      if (isEpsilon(symbol) && machine.type === 'DFA') {
        errors.push('A DFA cannot contain ε-transitions.');
      } else if (!isEpsilon(symbol) && !machine.alphabet.includes(symbol)) {
        errors.push(`Transition symbol '${symbol}' is not in the input alphabet.`);
      }
      const key = JSON.stringify([transition.from, symbol]);
      if (machine.type === 'DFA' && seen.has(key)) {
        duplicateTransitions.push({ stateId: transition.from, symbol });
      }
      seen.add(key);
    }
  }
  for (const duplicate of duplicateTransitions) {
    errors.push(`Duplicate DFA transition for (${duplicate.stateId}, '${duplicate.symbol}').`);
  }
  if (machine.type === 'DFA') {
    for (const state of machine.states) {
      for (const symbol of machine.alphabet) {
        if (!machine.transitions.some(edge => edge.from === state.id && edge.symbols.includes(symbol))) {
          missingTransitions.push({ stateId: state.id, symbol });
        }
      }
    }
    if (requireCompleteDfa && missingTransitions.length > 0) {
      warnings.push(`DFA is incomplete: ${missingTransitions.length} transition(s) are missing.`);
    }
  }
  return { errors, warnings, missingTransitions, duplicateTransitions };
}

export function completeDFA(machine: AutomatonDefinition): AutomatonDefinition {
  if (machine.type !== 'DFA') throw new Error('Only a deterministic finite automaton can be completed.');
  const validation = validateAutomaton(machine);
  if (validation.duplicateTransitions.length > 0) {
    throw new Error(validation.duplicateTransitions.map(item => `Duplicate transition for (${item.stateId}, '${item.symbol}').`).join(' '));
  }
  if (validation.errors.length > 0) throw new Error(validation.errors.join(' '));

  const missing = validation.missingTransitions;
  if (missing.length === 0) return machine;

  let trapId = 'trap';
  let suffix = 1;
  while (machine.states.some(state => state.id === trapId)) trapId = `trap-${suffix++}`;
  const trapState = { id: trapId, label: '∅', x: 0, y: 0, isStart: false, isFinal: false };
  const missingEdges: TransitionEdge[] = missing.map(({ stateId, symbol }, index) => ({
    id: `complete-${index}`,
    from: stateId,
    to: trapId,
    symbols: [symbol],
  }));
  missingEdges.push(...machine.alphabet.map((symbol, index) => ({
    id: `complete-trap-${index}`,
    from: trapId,
    to: trapId,
    symbols: [symbol],
  })));
  return {
    ...machine,
    states: [...machine.states, trapState],
    transitions: [...machine.transitions, ...missingEdges],
  };
}
