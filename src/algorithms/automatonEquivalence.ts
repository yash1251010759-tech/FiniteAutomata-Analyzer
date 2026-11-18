import { AutomatonDefinition } from '../types/automata';
import { convertNfaToDfa } from './subsetConstruction';
import { completeDFA } from './automatonValidation';

export interface AutomatonEquivalenceResult {
  equivalent: boolean;
  counterexample?: string;
  checkedConfigurations: number;
}

function asDFA(machine: AutomatonDefinition): AutomatonDefinition {
  if (machine.type === 'DFA') return machine;
  if (machine.type === 'NFA' || machine.type === 'ENFA') {
    return convertNfaToDfa(machine).resultMachine;
  }
  throw new Error(`Language equivalence is not defined for ${machine.type} machines.`);
}

function transitionTarget(machine: AutomatonDefinition, stateId: string, symbol: string): string {
  const edge = machine.transitions.find(item => item.from === stateId && item.symbols.includes(symbol));
  if (!edge) throw new Error(`DFA completion failed for (${stateId}, '${symbol}').`);
  return edge.to;
}

export function checkAutomatonEquivalence(
  source: AutomatonDefinition,
  target: AutomatonDefinition
): AutomatonEquivalenceResult {
  const sourceDfa = asDFA(source);
  const targetDfa = asDFA(target);
  const alphabet = [...new Set([...sourceDfa.alphabet, ...targetDfa.alphabet])];
  const left = completeDFA({ ...sourceDfa, alphabet });
  const right = completeDFA({ ...targetDfa, alphabet });
  const leftFinals = new Set([...left.finalStateIds, ...left.states.filter(state => state.isFinal).map(state => state.id)]);
  const rightFinals = new Set([...right.finalStateIds, ...right.states.filter(state => state.isFinal).map(state => state.id)]);
  const initial = { left: left.startStateId, right: right.startStateId, word: '' };
  const queue = [initial];
  const visited = new Set([JSON.stringify([initial.left, initial.right])]);

  for (let index = 0; index < queue.length; index++) {
    const current = queue[index];
    const leftAccepts = leftFinals.has(current.left);
    const rightAccepts = rightFinals.has(current.right);
    if (leftAccepts !== rightAccepts) {
      return { equivalent: false, counterexample: current.word, checkedConfigurations: visited.size };
    }
    for (const symbol of alphabet) {
      const next = {
        left: transitionTarget(left, current.left, symbol),
        right: transitionTarget(right, current.right, symbol),
        word: current.word + symbol,
      };
      const key = JSON.stringify([next.left, next.right]);
      if (visited.has(key)) continue;
      visited.add(key);
      queue.push(next);
    }
  }
  return { equivalent: true, checkedConfigurations: visited.size };
}
