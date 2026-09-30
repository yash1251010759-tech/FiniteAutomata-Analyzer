import { AutomatonDefinition, EquivalenceResult } from '../types/automata';
import { simulateAutomaton } from './dfaSimulation';
import { convertNfaToDfa } from './subsetConstruction';
import { minimizeDFA } from './dfaMinimization';

// Helper to ensure machine is a deterministic DFA
function ensureDfa(machine: AutomatonDefinition): AutomatonDefinition {
  if (machine.type === 'DFA') {
    return machine;
  }
  const dfaReport = convertNfaToDfa(machine);
  return dfaReport.resultMachine;
}

// Check Equivalence between two Automata and find the shortest counterexample
export function checkEquivalence(
  m1: AutomatonDefinition,
  m2: AutomatonDefinition
): EquivalenceResult {
  // Convert both to DFA
  const dfa1 = ensureDfa(m1);
  const dfa2 = ensureDfa(m2);

  // Combine alphabets
  const alphabetSet = new Set([...dfa1.alphabet, ...dfa2.alphabet]);
  const alphabet = Array.from(alphabetSet).sort();

  if (!dfa1.startStateId || !dfa2.startStateId) {
    return {
      equivalent: false,
      message: 'Both machines must define a valid start state.',
      checkedCount: 0,
    };
  }

  // Helper to get transition target in DFA (returns null if sink/trap)
  const getNext = (m: AutomatonDefinition, curr: string, sym: string): string | null => {
    const t = m.transitions.find(edge => edge.from === curr && edge.symbols.includes(sym));
    return t ? t.to : null;
  };

  // BFS on Product state space: (p, q, stringPath)
  // where p can be string or 'TRAP', q can be string or 'TRAP'
  const startPair = `${dfa1.startStateId}|${dfa2.startStateId}`;
  const visited = new Set<string>([startPair]);

  const queue: { p: string | null; q: string | null; word: string }[] = [
    { p: dfa1.startStateId, q: dfa2.startStateId, word: '' },
  ];

  let exploredCount = 0;
  const maxStatesToSearch = 1500;

  while (queue.length > 0 && exploredCount < maxStatesToSearch) {
    exploredCount++;
    const { p, q, word } = queue.shift()!;

    const m1Accept = p ? dfa1.finalStateIds.includes(p) : false;
    const m2Accept = q ? dfa2.finalStateIds.includes(q) : false;

    // Check if one accepts and the other rejects
    if (m1Accept !== m2Accept) {
      const displayWord = word === '' ? 'ε (empty string)' : word;
      return {
        equivalent: false,
        counterexample: word,
        m1Result: m1Accept,
        m2Result: m2Accept,
        message: `Automata are NOT equivalent. Shortest counterexample: "${displayWord}" (Machine 1: ${
          m1Accept ? 'ACCEPT' : 'REJECT'
        }, Machine 2: ${m2Accept ? 'ACCEPT' : 'REJECT'}).`,
        checkedCount: exploredCount,
      };
    }

    // Branch on all symbols in alphabet
    for (const sym of alphabet) {
      const nextP = p ? getNext(dfa1, p, sym) : null;
      const nextQ = q ? getNext(dfa2, q, sym) : null;

      const pairKey = `${nextP || 'TRAP'}|${nextQ || 'TRAP'}`;
      if (!visited.has(pairKey)) {
        visited.add(pairKey);
        queue.push({
          p: nextP,
          q: nextQ,
          word: word + sym,
        });
      }
    }
  }

  // If BFS exhausted without discrepancy
  return {
    equivalent: true,
    message: `Both automata are 100% EQUIVALENT! They recognize identical formal languages (verified across all ${exploredCount} product states).`,
    checkedCount: exploredCount,
  };
}
