import { AutomatonDefinition } from '../types/automata';

export const predefinedAutomata: AutomatonDefinition[] = [
  // 1. DFA: Even number of 1s
  {
    id: 'example-dfa-even-1s',
    name: 'Even number of 1s',
    type: 'DFA',
    description: 'Accepts all binary strings containing an even number of 1s (including empty string ε).',
    alphabet: ['0', '1'],
    startStateId: 'q0',
    finalStateIds: ['q0'],
    states: [
      { id: 'q0', label: 'q0', x: 200, y: 200, isStart: true, isFinal: true, description: 'Even count of 1s' },
      { id: 'q1', label: 'q1', x: 450, y: 200, isStart: false, isFinal: false, description: 'Odd count of 1s' },
    ],
    transitions: [
      { id: 'e1', from: 'q0', to: 'q0', symbols: ['0'] },
      { id: 'e2', from: 'q0', to: 'q1', symbols: ['1'] },
      { id: 'e3', from: 'q1', to: 'q0', symbols: ['1'] },
      { id: 'e4', from: 'q1', to: 'q1', symbols: ['0'] },
    ],
    tags: ['Parity', 'DFA', 'Beginner'],
  },

  // 2. DFA: Binary strings ending with 01
  {
    id: 'example-dfa-ends-01',
    name: 'Strings ending with 01',
    type: 'DFA',
    description: 'Accepts binary strings whose last two characters are strictly "01".',
    alphabet: ['0', '1'],
    startStateId: 'q0',
    finalStateIds: ['q2'],
    states: [
      { id: 'q0', label: 'q0', x: 180, y: 200, isStart: true, isFinal: false, description: 'No matched suffix' },
      { id: 'q1', label: 'q1', x: 380, y: 200, isStart: false, isFinal: false, description: 'Last symbol was 0' },
      { id: 'q2', label: 'q2', x: 580, y: 200, isStart: false, isFinal: true, description: 'Ends with 01' },
    ],
    transitions: [
      { id: 't0_0', from: 'q0', to: 'q1', symbols: ['0'] },
      { id: 't0_1', from: 'q0', to: 'q0', symbols: ['1'] },
      { id: 't1_0', from: 'q1', to: 'q1', symbols: ['0'] },
      { id: 't1_1', from: 'q1', to: 'q2', symbols: ['1'] },
      { id: 't2_0', from: 'q2', to: 'q1', symbols: ['0'] },
      { id: 't2_1', from: 'q2', to: 'q0', symbols: ['1'] },
    ],
    tags: ['Suffix', 'DFA', 'Standard'],
  },

  // 3. DFA: Binary numbers divisible by 3
  {
    id: 'example-dfa-div-3',
    name: 'Binary numbers divisible by 3',
    type: 'DFA',
    description: 'Accepts binary representations of integers divisible by 3 (evaluated modulo 3).',
    alphabet: ['0', '1'],
    startStateId: 'q0',
    finalStateIds: ['q0'],
    states: [
      { id: 'q0', label: 'q0', x: 220, y: 150, isStart: true, isFinal: true, description: 'val mod 3 = 0' },
      { id: 'q1', label: 'q1', x: 440, y: 150, isStart: false, isFinal: false, description: 'val mod 3 = 1' },
      { id: 'q2', label: 'q2', x: 330, y: 320, isStart: false, isFinal: false, description: 'val mod 3 = 2' },
    ],
    transitions: [
      { id: 'd0_0', from: 'q0', to: 'q0', symbols: ['0'] },
      { id: 'd0_1', from: 'q0', to: 'q1', symbols: ['1'] },
      { id: 'd1_0', from: 'q1', to: 'q2', symbols: ['0'] },
      { id: 'd1_1', from: 'q1', to: 'q0', symbols: ['1'] },
      { id: 'd2_0', from: 'q2', to: 'q1', symbols: ['0'] },
      { id: 'd2_1', from: 'q2', to: 'q2', symbols: ['1'] },
    ],
    tags: ['Modulo', 'DFA', 'University Exam'],
  },

  // 4. DFA: Strings containing 101
  {
    id: 'example-dfa-contains-101',
    name: 'Strings containing 101',
    type: 'DFA',
    description: 'Accepts all binary strings that have "101" as a contiguous substring.',
    alphabet: ['0', '1'],
    startStateId: 'q0',
    finalStateIds: ['q3'],
    states: [
      { id: 'q0', label: 'q0', x: 140, y: 200, isStart: true, isFinal: false, description: 'No match' },
      { id: 'q1', label: 'q1', x: 300, y: 200, isStart: false, isFinal: false, description: 'Matched "1"' },
      { id: 'q2', label: 'q2', x: 460, y: 200, isStart: false, isFinal: false, description: 'Matched "10"' },
      { id: 'q3', label: 'q3', x: 620, y: 200, isStart: false, isFinal: true, description: 'Substring 101 found' },
    ],
    transitions: [
      { id: 'c0_0', from: 'q0', to: 'q0', symbols: ['0'] },
      { id: 'c0_1', from: 'q0', to: 'q1', symbols: ['1'] },
      { id: 'c1_0', from: 'q1', to: 'q2', symbols: ['0'] },
      { id: 'c1_1', from: 'q1', to: 'q1', symbols: ['1'] },
      { id: 'c2_0', from: 'q2', to: 'q0', symbols: ['0'] },
      { id: 'c2_1', from: 'q2', to: 'q3', symbols: ['1'] },
      { id: 'c3_both', from: 'q3', to: 'q3', symbols: ['0', '1'] },
    ],
    tags: ['Substring', 'DFA'],
  },

  // 5. NFA: Second symbol from the end is 1
  {
    id: 'example-nfa-2nd-from-end',
    name: 'NFA: 2nd symbol from end is 1',
    type: 'NFA',
    description: 'Non-deterministic automaton accepting strings whose second symbol from right is "1".',
    alphabet: ['0', '1'],
    startStateId: 'q0',
    finalStateIds: ['q2'],
    states: [
      { id: 'q0', label: 'q0', x: 180, y: 200, isStart: true, isFinal: false, description: 'Guess when 2nd symbol starts' },
      { id: 'q1', label: 'q1', x: 380, y: 200, isStart: false, isFinal: false, description: 'Saw 1, 1 symbol remains' },
      { id: 'q2', label: 'q2', x: 580, y: 200, isStart: false, isFinal: true, description: 'End of input' },
    ],
    transitions: [
      { id: 'nfa_loop', from: 'q0', to: 'q0', symbols: ['0', '1'] },
      { id: 'nfa_guess', from: 'q0', to: 'q1', symbols: ['1'] },
      { id: 'nfa_last', from: 'q1', to: 'q2', symbols: ['0', '1'] },
    ],
    tags: ['NFA', 'Non-deterministic'],
  },

  // 6. Moore Machine: Modulo 3 output
  {
    id: 'example-moore-mod3',
    name: 'Moore Machine: Binary Modulo 3 Output',
    type: 'MOORE',
    description: 'Outputs the remainder (0, 1, or 2) associated with each state on reading binary inputs.',
    alphabet: ['0', '1'],
    outputAlphabet: ['0', '1', '2'],
    startStateId: 'q0',
    finalStateIds: [],
    states: [
      { id: 'q0', label: 'q0', output: '0', x: 220, y: 160, isStart: true, description: 'Output: 0' },
      { id: 'q1', label: 'q1', output: '1', x: 440, y: 160, isStart: false, description: 'Output: 1' },
      { id: 'q2', label: 'q2', output: '2', x: 330, y: 320, isStart: false, description: 'Output: 2' },
    ],
    transitions: [
      { id: 'm0_0', from: 'q0', to: 'q0', symbols: ['0'] },
      { id: 'm0_1', from: 'q0', to: 'q1', symbols: ['1'] },
      { id: 'm1_0', from: 'q1', to: 'q2', symbols: ['0'] },
      { id: 'm1_1', from: 'q1', to: 'q0', symbols: ['1'] },
      { id: 'm2_0', from: 'q2', to: 'q1', symbols: ['0'] },
      { id: 'm2_1', from: 'q2', to: 'q2', symbols: ['1'] },
    ],
    tags: ['Moore', 'Output Machine'],
  },

  // 7. Mealy Machine: 1s Complement
  {
    id: 'example-mealy-1s-complement',
    name: 'Mealy Machine: 1s Complement',
    type: 'MEALY',
    description: 'Bitwise inverter: outputs 1 on input 0, and 0 on input 1 synchronously on transitions.',
    alphabet: ['0', '1'],
    outputAlphabet: ['0', '1'],
    startStateId: 'q0',
    finalStateIds: [],
    states: [
      { id: 'q0', label: 'q0', x: 350, y: 200, isStart: true, description: 'Bit inverter' },
    ],
    transitions: [
      { id: 'mealy_inv_0', from: 'q0', to: 'q0', symbols: ['0'], output: '1' },
      { id: 'mealy_inv_1', from: 'q0', to: 'q0', symbols: ['1'], output: '0' },
    ],
    tags: ['Mealy', 'Inverter'],
  },
];
