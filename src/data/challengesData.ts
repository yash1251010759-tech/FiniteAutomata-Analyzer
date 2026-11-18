import {
  AutomatonDefinition,
  CFGDefinition,
  PDADefinition,
  StateNode,
  TMDefinition,
  TMTransition,
} from '../types/automata';
import { ChallengeProblem } from '../types/learning';
import { convertNfaToDfa } from '../algorithms/subsetConstruction';
import { minimizeDFA } from '../algorithms/dfaMinimization';
import { regexToENFA } from '../algorithms/regexToNfa';
import { simulateAutomaton } from '../algorithms/dfaSimulation';
import { sampleGrammars } from '../algorithms/cfg';
import { samplePDAs } from '../algorithms/pda';
import { sampleTuringMachines } from '../algorithms/turingMachine';

const categories: ChallengeProblem['category'][] = [
  'DFA design',
  'NFA design',
  'Regular expressions',
  'Context-free grammars',
  'Pushdown automata',
  'Turing machines',
  'Conversions',
  'Minimization',
];

const languages = [
  { slug: 'ends-01', name: 'Strings ending in 01', regex: '(0|1)*01', alphabet: ['0', '1'] },
  { slug: 'contains-101', name: 'Strings containing 101', regex: '(0|1)*101(0|1)*', alphabet: ['0', '1'] },
  { slug: 'starts-1', name: 'Strings starting with 1', regex: '1(0|1)*', alphabet: ['0', '1'] },
  { slug: 'contains-00', name: 'Strings containing 00', regex: '(0|1)*00(0|1)*', alphabet: ['0', '1'] },
  { slug: 'even-ones', name: 'An even number of 1s', regex: '(0|10*1)*0*', alphabet: ['0', '1'] },
  { slug: 'even-length', name: 'Strings of even length', regex: '((0|1)(0|1))*', alphabet: ['0', '1'] },
  { slug: 'ends-0', name: 'Strings ending in 0', regex: '(0|1)*0', alphabet: ['0', '1'] },
  { slug: 'no-11', name: 'Strings with no consecutive 1s', regex: '(0|10)*(ε|1)', alphabet: ['0', '1'] },
];

const enumerateStrings = (alphabet: string[], maxLength: number): string[] => {
  const result = [''];
  let frontier = [''];
  for (let length = 1; length <= maxLength; length++) {
    frontier = frontier.flatMap(prefix => alphabet.map(symbol => prefix + symbol));
    result.push(...frontier);
  }
  return result;
};

function withId(machine: AutomatonDefinition, id: string, name: string): AutomatonDefinition {
  return { ...machine, id, name };
}

function toGrammar(machine: AutomatonDefinition, id: string): CFGDefinition {
  const variables = machine.states.map((_, index) => String.fromCharCode(65 + index));
  const variableForState = new Map(machine.states.map((state, index) => [state.id, variables[index]]));
  const productions: CFGDefinition['productions'] = [];
  let productionIndex = 0;
  for (const transition of machine.transitions) {
    for (const symbol of transition.symbols) {
      productions.push({
        id: `p${productionIndex++}`,
        variable: variableForState.get(transition.from) || 'S',
        replacement: `${symbol}${variableForState.get(transition.to) || ''}`,
      });
    }
  }
  for (const finalId of machine.finalStateIds) {
    productions.push({
      id: `p${productionIndex++}`,
      variable: variableForState.get(finalId) || 'S',
      replacement: 'ε',
    });
  }
  return {
    id,
    name: machine.name,
    variables,
    terminals: machine.alphabet,
    startVariable: variableForState.get(machine.startStateId) || 'S',
    productions,
  };
}

function toPda(machine: AutomatonDefinition, id: string): PDADefinition {
  let transitionIndex = 0;
  return {
    id,
    name: machine.name,
    description: 'A PDA simulation of the reference finite automaton.',
    states: machine.states,
    inputAlphabet: machine.alphabet,
    stackAlphabet: ['Z0'],
    startStateId: machine.startStateId,
    startStackSymbol: 'Z0',
    finalStateIds: machine.finalStateIds,
    acceptMode: 'FINAL_STATE',
    transitions: machine.transitions.flatMap(edge =>
      edge.symbols.map(inputSymbol => ({
        id: `pda-${transitionIndex++}`,
        from: edge.from,
        to: edge.to,
        inputSymbol,
        popSymbol: 'ε',
        pushSymbols: [],
      }))
    ),
  };
}

function toTm(machine: AutomatonDefinition, id: string): TMDefinition {
  const acceptStateId = `${id}-accept`;
  const rejectStateId = `${id}-reject`;
  const terminalStates: StateNode[] = [
    { id: acceptStateId, label: 'accept', x: 0, y: 0 },
    { id: rejectStateId, label: 'reject', x: 0, y: 0 },
  ];
  const transitions: TMTransition[] = machine.transitions.flatMap((edge, edgeIndex) =>
    edge.symbols.map((readSymbol, symbolIndex) => ({
      id: `${id}-read-${edgeIndex}-${symbolIndex}`,
      from: edge.from,
      to: edge.to,
      readSymbol,
      writeSymbol: readSymbol,
      direction: 'R' as const,
    }))
  );
  machine.states.forEach(state => transitions.push({
    id: `${id}-blank-${state.id}`,
    from: state.id,
    to: machine.finalStateIds.includes(state.id) ? acceptStateId : rejectStateId,
    readSymbol: '_',
    writeSymbol: '_',
    direction: 'S',
  }));
  return {
    id,
    name: machine.name,
    states: [...machine.states, ...terminalStates],
    inputAlphabet: machine.alphabet,
    tapeAlphabet: [...machine.alphabet, '_'],
    blankSymbol: '_',
    startStateId: machine.startStateId,
    acceptStateId,
    rejectStateId,
    transitions,
  };
}

function makeChallenge(category: ChallengeProblem['category'], language: typeof languages[number], index: number): ChallengeProblem {
  const id = `${category.toLowerCase().replace(/[^a-z]+/g, '-')}-${language.slug}`;
  const enfa = withId(regexToENFA(language.regex), `${id}-enfa`, language.name);
  const dfa = withId(convertNfaToDfa(enfa).resultMachine, `${id}-dfa`, language.name);
  const minimized = minimizeDFA(dfa).minimizedMachine;
  const allStrings = enumerateStrings(language.alphabet, 8);
  const accepts = allStrings.filter(input => simulateAutomaton(dfa, input).accepted).slice(0, 8);
  const rejects = allStrings.filter(input => !simulateAutomaton(dfa, input).accepted).slice(0, 8);
  const difficulty: ChallengeProblem['difficulty'] = index < 3 ? 'Easy' : index < 6 ? 'Medium' : 'Hard';
  const targetType: ChallengeProblem['targetType'] =
    category === 'Regular expressions' ? 'REGEX' :
      category === 'Context-free grammars' ? 'CFG' :
        category === 'Pushdown automata' ? 'PDA' :
          category === 'Turing machines' ? 'TM' :
            category === 'NFA design' ? 'NFA' : 'DFA';
  let referenceSolution: unknown = dfa;
  if (category === 'DFA design') referenceSolution = dfa;
  if (category === 'NFA design') referenceSolution = enfa;
  if (category === 'Regular expressions') referenceSolution = language.regex;
  if (category === 'Context-free grammars') referenceSolution = toGrammar(dfa, `${id}-cfg`);
  if (category === 'Pushdown automata') referenceSolution = toPda(dfa, `${id}-pda`);
  if (category === 'Turing machines') referenceSolution = toTm(dfa, `${id}-tm`);
  if (category === 'Conversions') {
    referenceSolution = dfa;
  }
  if (category === 'Minimization') referenceSolution = withId(minimized, `${id}-min`, language.name);

  return {
    id,
    category,
    title: `${category}: ${language.name}`,
    difficulty,
    description: `Build a ${category === 'Regular expressions' ? 'regular expression' : targetType} over Σ = {${language.alphabet.join(', ')}} that accepts exactly ${language.name.toLowerCase()}.`,
    alphabet: language.alphabet,
    targetType,
    points: difficulty === 'Easy' ? 10 : difficulty === 'Medium' ? 25 : 50,
    hints: [
      `Start by deciding what information about the prefix is needed to recognize ${language.name.toLowerCase()}.`,
      'Test the empty string and the shortest matching and non-matching strings.',
      'Check transitions after a match as well as before it; accepted prefixes do not always imply acceptance.',
    ],
    solution: { accepts, rejects },
    testCases: [
      ...accepts.map(input => ({ input, expected: true })),
      ...rejects.map(input => ({ input, expected: false })),
    ],
    referenceSolution,
    sourceMachine: category === 'Conversions' ? enfa : category === 'Minimization' ? dfa : undefined,
    starterMachine: dfa,
    explanation: `The reference language is ${language.name.toLowerCase()}. The reference implementation is generated from ${language.regex}.`,
  };
}

const generatedChallenges: ChallengeProblem[] = categories.flatMap(category =>
  languages.map((language, index) => makeChallenge(category, language, index))
);

interface SpecializedChallenge {
  category: ChallengeProblem['category'];
  index: number;
  title: string;
  alphabet: string[];
  reference: unknown;
  accepts: string[];
  rejects: string[];
  targetType: ChallengeProblem['targetType'];
  description: string;
}

const specialized: SpecializedChallenge[] = [
  {
    category: 'Context-free grammars', index: 0, title: 'CFG: aⁿbⁿ, n ≥ 0', alphabet: ['a', 'b'],
    reference: sampleGrammars[0], targetType: 'CFG',
    accepts: ['', 'ab', 'aabb', 'aaabbb', 'aaaabbbb', 'aaaaabbbbb', 'aaaaaabbbbbb', 'aaaaaaabbbbbbb'],
    rejects: ['a', 'b', 'aab', 'abb', 'ba', 'abab', 'aaabb', 'aaabbbb'],
    description: 'Write a CFG generating exactly {aⁿbⁿ | n ≥ 0}.',
  },
  {
    category: 'Context-free grammars', index: 1, title: 'CFG: aⁿb, n ≥ 1', alphabet: ['a', 'b'],
    reference: sampleGrammars[1], targetType: 'CFG',
    accepts: ['ab', 'aab', 'aaab', 'aaaab', 'aaaaab', 'aaaaaab', 'aaaaaaab', 'aaaaaaaab'],
    rejects: ['', 'a', 'b', 'aa', 'bb', 'aba', 'aabb', 'ba'],
    description: 'Write a CFG for one or more a symbols followed by exactly one b.',
  },
  {
    category: 'Context-free grammars', index: 2, title: 'CFG: balanced parentheses', alphabet: ['(', ')'],
    reference: sampleGrammars[2], targetType: 'CFG',
    accepts: ['', '()', '()()', '(())', '(()())', '()(())', '((()))', '(()()())'],
    rejects: ['(', ')', ')(', '(()', '())', '())(', '(()))', '())()'],
    description: 'Write a CFG generating all balanced parenthesis strings.',
  },
  {
    category: 'Context-free grammars', index: 3, title: 'CFG: palindromes over {a,b}', alphabet: ['a', 'b'],
    reference: sampleGrammars[3], targetType: 'CFG',
    accepts: ['', 'a', 'b', 'aa', 'bb', 'aba', 'abba', 'baab'],
    rejects: ['ab', 'abb', 'abab', 'aab', 'baa', 'abbb', 'baba', 'baaba'],
    description: 'Write a CFG for all palindromes over {a,b}, including ε.',
  },
  {
    category: 'Pushdown automata', index: 0, title: 'PDA: 0ⁿ1ⁿ, n ≥ 1', alphabet: ['0', '1'],
    reference: samplePDAs[0], targetType: 'PDA',
    accepts: ['01', '0011', '000111', '00001111', '0000011111', '000000111111', '00000001111111', '0000000011111111'],
    rejects: ['', '0', '1', '10', '011', '001', '0101', '00111'],
    description: 'Design a PDA that matches each 0 with one later 1; n must be positive.',
  },
  {
    category: 'Pushdown automata', index: 1, title: 'PDA: equal numbers of 0s and 1s', alphabet: ['0', '1'],
    reference: samplePDAs[1], targetType: 'PDA',
    accepts: ['', '01', '10', '0011', '0101', '1100', '1010', '000111'],
    rejects: ['0', '1', '001', '111', '0001', '011', '00111', '1110'],
    description: 'Design a PDA that accepts exactly when the input has equally many 0s and 1s.',
  },
  {
    category: 'Pushdown automata', index: 2, title: 'PDA: balanced parentheses', alphabet: ['(', ')'],
    reference: samplePDAs[2], targetType: 'PDA',
    accepts: ['', '()', '()()', '(())', '(()())', '()(())', '((()))', '(()()())'],
    rejects: ['(', ')', ')(', '(()', '())', '())(', '(()))', '())()'],
    description: 'Use the stack to ensure every closing parenthesis matches an earlier opening one.',
  },
  {
    category: 'Pushdown automata', index: 3, title: 'PDA: palindromes over {a,b}', alphabet: ['a', 'b'],
    reference: samplePDAs[3], targetType: 'PDA',
    accepts: ['', 'a', 'b', 'aa', 'bb', 'aba', 'abba', 'baab'],
    rejects: ['ab', 'abb', 'abab', 'aab', 'baa', 'abbb', 'baba', 'baaba'],
    description: 'Nondeterministically guess the center, then match the remaining symbols in reverse.',
  },
  {
    category: 'Pushdown automata', index: 4, title: 'PDA: even palindromes w wᴿ', alphabet: ['a', 'b'],
    reference: samplePDAs[4], targetType: 'PDA',
    accepts: ['', 'aa', 'bb', 'aaaa', 'bbbb', 'abba', 'baab', 'aabbaa'],
    rejects: ['a', 'b', 'ab', 'aba', 'aab', 'abb', 'baba', 'ba'],
    description: 'Accept exactly even-length palindromes by guessing the midpoint between the two halves.',
  },
  {
    category: 'Pushdown automata', index: 5, title: 'PDA: marked palindrome w c wᴿ', alphabet: ['a', 'b', 'c'],
    reference: samplePDAs[5], targetType: 'PDA',
    accepts: ['c', 'aca', 'bcb', 'abcba', 'bacab', 'aabcbaa', 'abbcbba', 'bbcbb'],
    rejects: ['', 'a', 'b', 'ac', 'ca', 'abca', 'abc', 'abccba'],
    description: 'Accept strings w c wᴿ with exactly one center marker c.',
  },
  {
    category: 'Pushdown automata', index: 6, title: 'PDA: aⁿb²ⁿ, n ≥ 1', alphabet: ['a', 'b'],
    reference: samplePDAs[6], targetType: 'PDA',
    accepts: ['abb', 'aabbbb', 'aaabbbbbb', 'aaaabbbbbbbb', 'aaaaabbbbbbbbbb', 'aaaaaabbbbbbbbbbbb', 'aaaaaaabbbbbbbbbbbbbb', 'aaaaaaaabbbbbbbbbbbbbbbb'],
    rejects: ['', 'a', 'ab', 'abbb', 'aab', 'ba', 'bbaa', 'aabbba'],
    description: 'Push two stack markers per a and pop one marker per b.',
  },
  {
    category: 'Turing machines', index: 0, title: 'TM: 0ⁿ1ⁿ, n ≥ 1', alphabet: ['0', '1'],
    reference: sampleTuringMachines[1], targetType: 'TM',
    accepts: ['01', '0011', '000111', '00001111', '0000011111', '000000111111', '00000001111111', '0000000011111111'],
    rejects: ['', '0', '1', '10', '011', '001', '0101', '00111'],
    description: 'Mark matching 0/1 pairs and reject malformed ordering or unequal counts.',
  },
  {
    category: 'Turing machines', index: 1, title: 'TM: aⁿbⁿcⁿ, n ≥ 1', alphabet: ['a', 'b', 'c'],
    reference: sampleTuringMachines[2], targetType: 'TM',
    accepts: ['abc', 'aabbcc', 'aaabbbccc', 'aaaabbbbcccc', 'aaaaabbbbbccccc', 'aaaaaabbbbbbcccccc', 'aaaaaaabbbbbbbccccccc', 'aaaaaaaabbbbbbbbcccccccc'],
    rejects: ['', 'ab', 'abcc', 'aabbc', 'acb', 'abcabc', 'aabbccccc', 'aaabbbcc'],
    description: 'Match equal positive counts of a, b, and c in that order.',
  },
  {
    category: 'Turing machines', index: 2, title: 'TM: palindromes over {a,b}', alphabet: ['a', 'b'],
    reference: sampleTuringMachines[3], targetType: 'TM',
    accepts: ['', 'a', 'b', 'aa', 'bb', 'aba', 'abba', 'babab'],
    rejects: ['ab', 'abb', 'abab', 'aab', 'baa', 'abbb', 'baba', 'baaa'],
    description: 'Mark matching outer symbols until the tape contains only a center or marked cells.',
  },
  {
    category: 'Turing machines', index: 3, title: 'TM: w#w', alphabet: ['a', 'b', '#'],
    reference: sampleTuringMachines[4], targetType: 'TM',
    accepts: ['#', 'a#a', 'ab#ab', 'abb#abb', 'ba#ba', 'aa#aa', 'b#b', 'abba#abba'],
    rejects: ['a#b', 'ab#ba', 'a#', 'ab#a', '#a', 'a##a', 'a#bb', 'abb#bab'],
    description: 'Accept strings with exactly one # separating two identical words.',
  },
  {
    category: 'Turing machines', index: 4, title: 'TM: even number of 1s', alphabet: ['0', '1'],
    reference: sampleTuringMachines[5], targetType: 'TM',
    accepts: ['', '0', '11', '1010', '0110', '1111', '000', '1100'],
    rejects: ['1', '111', '10', '01', '100', '11111', '0001', '01000'],
    description: 'Accept binary strings containing an even number of 1s.',
  },
];

export const challengeProblems: ChallengeProblem[] = generatedChallenges.map(challenge => {
  const special = specialized.find(item => item.category === challenge.category &&
    item.index === languages.findIndex(language => challenge.id.endsWith(language.slug)));
  if (!special) return challenge;
  return {
    ...challenge,
    title: special.title,
    alphabet: special.alphabet,
    targetType: special.targetType,
    description: special.description,
    referenceSolution: special.reference,
    solution: { accepts: special.accepts, rejects: special.rejects },
    testCases: [
      ...special.accepts.map(input => ({ input, expected: true })),
      ...special.rejects.map(input => ({ input, expected: false })),
    ],
  };
});
