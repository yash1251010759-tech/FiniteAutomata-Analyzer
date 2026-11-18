import { describe, expect, test } from 'vitest';
import { predefinedAutomata } from '../src/data/predefinedExamples';
import { simulateAutomaton } from '../src/algorithms/dfaSimulation';
import {
  convertDfaToNfa,
  convertEnfaToNfa,
  convertNfaToDfa,
} from '../src/algorithms/subsetConstruction';
import { regexToENFA, testRegexString } from '../src/algorithms/regexToNfa';
import { convertFaToRegex } from '../src/algorithms/stateElimination';
import { minimizeDFA } from '../src/algorithms/dfaMinimization';
import { checkAutomatonEquivalence } from '../src/algorithms/automatonEquivalence';
import { completeDFA, validateAutomaton } from '../src/algorithms/automatonValidation';
import { convertCfgToPda } from '../src/algorithms/cfgToPda';
import { convertPdaToCfg } from '../src/algorithms/pdaToCfg';
import { convertCfgToCnf } from '../src/algorithms/cfgNormalForm';
import { deriveString } from '../src/algorithms/cfg';
import { simulatePDA } from '../src/algorithms/pda';
import { AutomatonDefinition, CFGDefinition } from '../src/types/automata';

const example = (id: string) => predefinedAutomata.find(machine => machine.id === id)!;
const enumerate = (alphabet: string[], maxLength: number): string[] => {
  const result = [''];
  let current = [''];
  for (let i = 1; i <= maxLength; i++) {
    current = current.flatMap(prefix => alphabet.map(symbol => prefix + symbol));
    result.push(...current);
  }
  return result;
};

describe('conversion algorithms and validation', () => {
  test.each([
    ['example-dfa-contains-101', ['101', '1101', '0010100'], ['1001', '1100']],
    ['example-nfa-third-from-end', ['100', '110', '01110'], ['000', '0001', '01010']],
    ['example-enfa-a-star-b-star', ['', 'a', 'aaabbb'], ['ba', 'aba']],
  ])('NFA subset construction preserves %s language', (id, accepts, rejects) => {
    const source = example(id);
    const converted = convertNfaToDfa(source).resultMachine;
    expect(checkAutomatonEquivalence(source, converted).equivalent).toBe(true);
    for (const input of accepts) expect(simulateAutomaton(converted, input).accepted, input).toBe(true);
    for (const input of rejects) expect(simulateAutomaton(converted, input).accepted, input).toBe(false);
  });

  test('epsilon removal, direct epsilon-NFA determinization, and DFA-to-NFA preserve languages', () => {
    const enfa = example('example-enfa-a-star-b-star');
    const epsilonFree = convertEnfaToNfa(enfa).resultMachine;
    const determinized = convertNfaToDfa(enfa).resultMachine;
    expect(checkAutomatonEquivalence(enfa, epsilonFree).equivalent).toBe(true);
    expect(checkAutomatonEquivalence(enfa, determinized).equivalent).toBe(true);
    const converted = convertDfaToNfa(example('example-dfa-ends-01')).resultMachine;
    expect(checkAutomatonEquivalence(example('example-dfa-ends-01'), converted).equivalent).toBe(true);
  });

  test.each([
    ['(a|b)*abb', ['abb', 'aabb', 'babb'], ['', 'ab', 'aba']],
    ['a*b*', ['', 'a', 'aaabbb'], ['ba', 'aba']],
    ['(ab)*', ['', 'ab', 'abab'], ['a', 'ba', 'aba']],
    ['a(b|c)*', ['a', 'ab', 'acb'], ['', 'b', 'ba']],
  ])('Thompson construction for %s', (regex, accepts, rejects) => {
    const machine = regexToENFA(regex);
    for (const input of accepts) expect(simulateAutomaton(machine, input).accepted, input).toBe(true);
    for (const input of rejects) expect(simulateAutomaton(machine, input).accepted, input).toBe(false);
  });

  test('state elimination returns a regex equivalent through length seven', () => {
    const dfa = example('example-dfa-contains-101');
    const regex = convertFaToRegex(dfa).finalRegex;
    for (const input of enumerate(dfa.alphabet, 7)) {
      expect(testRegexString(regex, input), `${regex} on ${input}`).toBe(simulateAutomaton(dfa, input).accepted);
    }
  });

  test('DFA equivalence returns a counterexample for distinct languages', () => {
    const result = checkAutomatonEquivalence(example('example-dfa-ends-01'), example('example-dfa-contains-101'));
    expect(result.equivalent).toBe(false);
    expect(result.counterexample).toBeDefined();
    expect(simulateAutomaton(example('example-dfa-ends-01'), result.counterexample!).accepted)
      .not.toBe(simulateAutomaton(example('example-dfa-contains-101'), result.counterexample!).accepted);
  });

  test('validation identifies missing start states, invalid symbols, duplicates, and incomplete DFAs', () => {
    const dfa = example('example-dfa-ends-01');
    const incomplete: AutomatonDefinition = {
      ...dfa,
      startStateId: 'missing',
      transitions: [...dfa.transitions, { id: 'bad', from: dfa.startStateId, to: dfa.startStateId, symbols: ['x'] }],
    };
    const errors = validateAutomaton(incomplete, true).errors.join(' ');
    expect(errors).toContain("Start state 'missing' does not exist.");
    expect(errors).toContain("Transition symbol 'x' is not in the input alphabet.");
    const partial = { ...dfa, transitions: dfa.transitions.slice(1) };
    expect(validateAutomaton(partial, true).missingTransitions.length).toBeGreaterThan(0);
    expect(completeDFA(partial).states.some(state => state.label === '∅')).toBe(true);
  });
});

describe('DFA minimization', () => {
  test('redundant and unreachable states are removed and ending 01 minimizes to three', () => {
    const dfa = example('example-dfa-ends-01');
    const redundant: AutomatonDefinition = {
      ...dfa,
      states: [...dfa.states, { id: 'extra', label: 'extra', x: 0, y: 0 }],
      transitions: [...dfa.transitions, ...dfa.alphabet.map((symbol, i) => ({
        id: `extra-${i}`, from: 'extra', to: 'extra', symbols: [symbol],
      }))],
    };
    const report = minimizeDFA(redundant);
    expect(report.statesAfter).toBe(3);
    expect(report.unreachableStatesRemoved).toContain('extra');
    expect(checkAutomatonEquivalence(redundant, report.minimizedMachine).equivalent).toBe(true);
  });

  test('divisible-by-three DFA stays at three states and minimal DFA is unchanged', () => {
    const dfa = example('example-dfa-div-3');
    const report = minimizeDFA(dfa);
    expect(report.statesAfter).toBe(3);
    expect(report.isAlreadyMinimal).toBe(true);
  });

  test('incomplete DFA is completed with a trap state and minimized safely', () => {
    const dfa = example('example-dfa-ends-01');
    const partial = { ...dfa, transitions: dfa.transitions.slice(1) };
    const result = minimizeDFA(partial);
    expect(result.minimizedMachine.type).toBe('DFA');
    expect(result.statesAfter).toBeGreaterThan(0);
    expect(checkAutomatonEquivalence(partial, result.minimizedMachine).equivalent).toBe(true);
  });
});

test('CFG to PDA conversion accepts aabb and rejects aab', () => {
  const cfg: CFGDefinition = {
    id: 'anbn',
    name: 'a^n b^n',
    variables: ['S'],
    terminals: ['a', 'b'],
    startVariable: 'S',
    productions: [
      { id: 'recursive', variable: 'S', replacement: 'aSb' },
      { id: 'empty', variable: 'S', replacement: 'ε' },
    ],
  };
  const pda = convertCfgToPda(cfg);
  expect(simulatePDA(pda, 'aabb').accepted).toBe(true);
  expect(simulatePDA(pda, 'aab').accepted).toBe(false);
});

test('PDA to CFG conversion preserves an empty-stack PDA language', () => {
  const cfg: CFGDefinition = {
    id: 'anbn',
    name: 'a^n b^n',
    variables: ['S'],
    terminals: ['a', 'b'],
    startVariable: 'S',
    productions: [
      { id: 'recursive', variable: 'S', replacement: 'aSb' },
      { id: 'empty', variable: 'S', replacement: 'ε' },
    ],
  };
  const converted = convertPdaToCfg(convertCfgToPda(cfg));
  for (const input of ['', 'ab', 'aabb', 'aaabbb']) {
    expect(deriveString(converted, input).valid, input || 'ε').toBe(true);
  }
  for (const input of ['a', 'aab', 'abb', 'ba']) {
    expect(deriveString(converted, input).valid, input).toBe(false);
  }
});

test('CFG to CNF handles epsilon and unit productions while preserving tested language', () => {
  const cfg: CFGDefinition = {
    id: 'cnf-test',
    name: 'CNF conversion test',
    variables: ['S', 'A', 'B'],
    terminals: ['a', 'b'],
    startVariable: 'S',
    productions: [
      { id: 's-a', variable: 'S', replacement: 'A' },
      { id: 'a-rec', variable: 'A', replacement: 'aAb' },
      { id: 'a-empty', variable: 'A', replacement: 'ε' },
      { id: 'dead', variable: 'B', replacement: 'Bb' },
    ],
  };
  const cnf = convertCfgToCnf(cfg).grammar;
  for (const input of ['', 'ab', 'aabb', 'aaabbb']) {
    expect(deriveString(cnf, input).valid, input || 'ε').toBe(true);
  }
  for (const input of ['a', 'aab', 'abb', 'ba']) {
    expect(deriveString(cnf, input).valid, input).toBe(false);
  }
  for (const production of cnf.productions) {
    if (production.replacement === 'ε') {
      expect(production.variable).toBe(cnf.startVariable);
    } else if (production.replacement.length === 1) {
      expect(cnf.terminals).toContain(production.replacement);
    } else {
      expect(production.replacement).toMatch(/^[A-Z]{2}$/);
    }
  }
});
