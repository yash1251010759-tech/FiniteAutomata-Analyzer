import { AutomatonDefinition, StateNode, TransitionEdge } from '../types/automata';
import { layoutNodes } from './subsetConstruction';

export interface GeneratedMachineReport {
  prompt: string;
  identifiedAlphabet: string[];
  patternType: string;
  machine: AutomatonDefinition;
  analysis: string;
  stateExplanations: { stateLabel: string; meaning: string }[];
  formalTuple: {
    Q: string;
    Sigma: string;
    deltaTable: string[][];
    q0: string;
    F: string;
  };
  sampleTests: { input: string; expected: boolean }[];
}

export function generateAutomatonFromNaturalLanguage(rawPrompt: string): GeneratedMachineReport {
  const prompt = rawPrompt.trim().toLowerCase();

  // 1. Detect Alphabet
  let alphabet = ['0', '1'];
  if (prompt.includes('over {a, b}') || prompt.includes('over {a,b}') || prompt.includes('a and b') || prompt.includes('letters a and b') || prompt.includes('strings of a and b')) {
    alphabet = ['a', 'b'];
  }

  const [s0, s1] = alphabet;

  // Pattern 1: Divisible by N (e.g. "divisible by 3", "divisible by 2", "divisible by 5")
  const divMatch = prompt.match(/divisible\s+by\s+(\d+)/);
  if (divMatch) {
    const k = Math.max(2, Math.min(10, parseInt(divMatch[1], 10)));
    const states: StateNode[] = [];
    const transitions: TransitionEdge[] = [];
    const stateExplanations: { stateLabel: string; meaning: string }[] = [];

    for (let r = 0; r < k; r++) {
      const id = `q${r}`;
      states.push({
        id,
        label: id,
        x: 0,
        y: 0,
        isStart: r === 0,
        isFinal: r === 0,
        description: `Binary value mod ${k} == ${r}`,
      });
      stateExplanations.push({
        stateLabel: id,
        meaning: `The accumulated binary number modulo ${k} is currently ${r}.`,
      });

      // Transitions for binary: value * 2 + bit
      const to0 = (r * 2) % k;
      const to1 = (r * 2 + 1) % k;

      if (to0 === to1) {
        transitions.push({
          id: `t-${r}-both`,
          from: id,
          to: `q${to0}`,
          symbols: ['0', '1'],
        });
      } else {
        transitions.push({
          id: `t-${r}-0`,
          from: id,
          to: `q${to0}`,
          symbols: ['0'],
        });
        transitions.push({
          id: `t-${r}-1`,
          from: id,
          to: `q${to1}`,
          symbols: ['1'],
        });
      }
    }

    const machine: AutomatonDefinition = {
      id: `gen-div-${k}-${Date.now()}`,
      name: `DFA: Binary Divisible by ${k}`,
      type: 'DFA',
      alphabet: ['0', '1'],
      states: layoutNodes(states, 700, 380),
      transitions,
      startStateId: 'q0',
      finalStateIds: ['q0'],
    };

    return {
      prompt: rawPrompt,
      identifiedAlphabet: ['0', '1'],
      patternType: `Modulo Arithmetic (Divisible by ${k})`,
      machine,
      analysis: `To accept binary numbers divisible by ${k}, each state represents the remainder (modulo) when the current binary prefix is divided by ${k}. There are exactly ${k} possible remainders: {0, 1, ..., ${
        k - 1
      }}. When appending bit b to number N, the new value is 2*N + b, so the next state remainder is (2*r + b) mod ${k}.`,
      stateExplanations,
      formalTuple: {
        Q: `{${states.map(s => s.label).join(', ')}}`,
        Sigma: '{0, 1}',
        deltaTable: [
          ['State', '0', '1'],
          ...states.map(s => {
            const r = parseInt(s.id.slice(1), 10);
            return [`${r === 0 ? '→*' : ''}${s.label}`, `q${(r * 2) % k}`, `q${(r * 2 + 1) % k}`];
          }),
        ],
        q0: 'q0',
        F: '{q0}',
      },
      sampleTests: [
        { input: '', expected: true },
        { input: '0', expected: true },
        { input: (k * 1).toString(2), expected: true },
        { input: (k * 2).toString(2), expected: true },
        { input: (k * 3 + 1).toString(2), expected: false },
        { input: '1', expected: 1 % k === 0 },
      ],
    };
  }

  // Pattern 2: Even or Odd number of a specific symbol
  if (prompt.includes('even number of') || prompt.includes('odd number of')) {
    const isEven = prompt.includes('even');
    let targetSym = s1; // default '1'
    if (prompt.includes(' 0') || prompt.includes('0s')) targetSym = s0;
    if (prompt.includes(' a') || prompt.includes('as')) targetSym = 'a';
    if (prompt.includes(' b') || prompt.includes('bs')) targetSym = 'b';

    const otherSym = alphabet.find(s => s !== targetSym) || (targetSym === '0' ? '1' : '0');

    const states: StateNode[] = [
      {
        id: 'q0',
        label: 'q0',
        x: 200,
        y: 200,
        isStart: true,
        isFinal: isEven,
        description: `Even count of '${targetSym}'`,
      },
      {
        id: 'q1',
        label: 'q1',
        x: 450,
        y: 200,
        isStart: false,
        isFinal: !isEven,
        description: `Odd count of '${targetSym}'`,
      },
    ];

    const transitions: TransitionEdge[] = [
      // q0 on targetSym -> q1
      { id: 't0-target', from: 'q0', to: 'q1', symbols: [targetSym] },
      // q1 on targetSym -> q0
      { id: 't1-target', from: 'q1', to: 'q0', symbols: [targetSym] },
      // Self loops on otherSym
      { id: 't0-other', from: 'q0', to: 'q0', symbols: [otherSym] },
      { id: 't1-other', from: 'q1', to: 'q1', symbols: [otherSym] },
    ];

    const machine: AutomatonDefinition = {
      id: `gen-parity-${Date.now()}`,
      name: `DFA: ${isEven ? 'Even' : 'Odd'} number of ${targetSym}'s`,
      type: 'DFA',
      alphabet: [targetSym, otherSym].sort(),
      states,
      transitions,
      startStateId: 'q0',
      finalStateIds: [isEven ? 'q0' : 'q1'],
    };

    return {
      prompt: rawPrompt,
      identifiedAlphabet: machine.alphabet,
      patternType: `Parity Counting (${isEven ? 'Even' : 'Odd'} ${targetSym})`,
      machine,
      analysis: `We only need to track the parity (modulo 2 count) of symbol '${targetSym}'. State q0 represents an even count (0, 2, 4, ...), and state q1 represents an odd count (1, 3, 5, ...). Symbol '${otherSym}' does not affect the count, so it loops in place.`,
      stateExplanations: [
        { stateLabel: 'q0', meaning: `Even number of '${targetSym}'s read so far.` },
        { stateLabel: 'q1', meaning: `Odd number of '${targetSym}'s read so far.` },
      ],
      formalTuple: {
        Q: '{q0, q1}',
        Sigma: `{${machine.alphabet.join(', ')}}`,
        deltaTable: [
          ['State', targetSym, otherSym],
          [`${isEven ? '→*' : '→'}q0`, 'q1', 'q0'],
          [`${!isEven ? '*' : ''}q1`, 'q0', 'q1'],
        ],
        q0: 'q0',
        F: `{${isEven ? 'q0' : 'q1'}}`,
      },
      sampleTests: [
        { input: '', expected: isEven },
        { input: targetSym, expected: !isEven },
        { input: targetSym + targetSym, expected: isEven },
        { input: targetSym + otherSym + targetSym, expected: isEven },
        { input: targetSym + otherSym, expected: !isEven },
      ],
    };
  }

  // Pattern 3: Ending with a specific suffix (e.g., "ending with 01", "ends with 101", "ending in 10")
  const endMatch = prompt.match(/ending\s+(?:with|in)\s+([01ab]+)/) || prompt.match(/ends\s+with\s+([01ab]+)/);
  if (endMatch) {
    const targetSuffix = endMatch[1];
    const n = targetSuffix.length;
    const states: StateNode[] = [];
    const stateExplanations: { stateLabel: string; meaning: string }[] = [];

    for (let i = 0; i <= n; i++) {
      const id = `q${i}`;
      const prefixMatched = targetSuffix.slice(0, i);
      states.push({
        id,
        label: id,
        x: 0,
        y: 0,
        isStart: i === 0,
        isFinal: i === n,
        description: i === 0 ? 'No matched suffix' : `Matched suffix "${prefixMatched}"`,
      });
      stateExplanations.push({
        stateLabel: id,
        meaning:
          i === 0
            ? 'No useful prefix of the required ending has been matched.'
            : `The current input suffix matches "${prefixMatched}" (length ${i} of ${n}).`,
      });
    }

    // Build transitions by KMP-style suffix matching
    const transitions: TransitionEdge[] = [];
    let edgeIdx = 0;

    for (let i = 0; i <= n; i++) {
      const currentPrefix = targetSuffix.slice(0, i);

      for (const sym of alphabet) {
        const candidate = currentPrefix + sym;
        // Find longest suffix of candidate that matches targetSuffix prefix
        let nextStateIdx = 0;
        for (let len = Math.min(candidate.length, n); len > 0; len--) {
          const sub = candidate.slice(candidate.length - len);
          if (targetSuffix.slice(0, len) === sub) {
            nextStateIdx = len;
            break;
          }
        }

        transitions.push({
          id: `t-end-${edgeIdx++}`,
          from: `q${i}`,
          to: `q${nextStateIdx}`,
          symbols: [sym],
        });
      }
    }

    const machine: AutomatonDefinition = {
      id: `gen-end-${Date.now()}`,
      name: `DFA: Strings ending with "${targetSuffix}"`,
      type: 'DFA',
      alphabet,
      states: layoutNodes(states, 700, 360),
      transitions,
      startStateId: 'q0',
      finalStateIds: [`q${n}`],
    };

    return {
      prompt: rawPrompt,
      identifiedAlphabet: alphabet,
      patternType: `Suffix Matching (Ends with "${targetSuffix}")`,
      machine,
      analysis: `To accept strings ending with "${targetSuffix}", state q_k indicates that the longest suffix of the input read so far matching a prefix of "${targetSuffix}" has length k. When a new symbol arrives, the machine advances or falls back to the longest valid overlapping prefix.`,
      stateExplanations,
      formalTuple: {
        Q: `{${states.map(s => s.label).join(', ')}}`,
        Sigma: `{${alphabet.join(', ')}}`,
        deltaTable: [
          ['State', ...alphabet],
          ...states.map(s => {
            const row = [`${s.id === 'q0' ? '→' : ''}${s.id === `q${n}` ? '*' : ''}${s.label}`];
            for (const sym of alphabet) {
              const edge = transitions.find(t => t.from === s.id && t.symbols.includes(sym));
              row.push(edge ? edge.to : '-');
            }
            return row;
          }),
        ],
        q0: 'q0',
        F: `{q${n}}`,
      },
      sampleTests: [
        { input: targetSuffix, expected: true },
        { input: `${alphabet[0]}${targetSuffix}`, expected: true },
        { input: `${alphabet[1]}${targetSuffix}`, expected: true },
        { input: targetSuffix.slice(0, -1), expected: false },
        { input: `${targetSuffix}${alphabet[0]}`, expected: targetSuffix.endsWith(targetSuffix.slice(1) + alphabet[0]) },
      ],
    };
  }

  // Pattern 4: Starting with a specific prefix (e.g. "starting with 10", "starts with 01")
  const startMatch = prompt.match(/start(?:ing)?\s+with\s+([01ab]+)/);
  if (startMatch) {
    const targetPrefix = startMatch[1];
    const n = targetPrefix.length;
    const states: StateNode[] = [];
    const stateExplanations: { stateLabel: string; meaning: string }[] = [];

    for (let i = 0; i <= n; i++) {
      const id = `q${i}`;
      states.push({
        id,
        label: id,
        x: 0,
        y: 0,
        isStart: i === 0,
        isFinal: i === n,
        description: i === n ? 'Valid prefix matched' : `Matched initial ${i} characters`,
      });
      stateExplanations.push({
        stateLabel: id,
        meaning:
          i === n
            ? `Required prefix "${targetPrefix}" was matched. Any subsequent characters will remain accepted.`
            : `Reading prefix character #${i + 1}.`,
      });
    }

    // Add dead/trap state
    const trapId = `q_trap`;
    states.push({
      id: trapId,
      label: trapId,
      x: 0,
      y: 0,
      isStart: false,
      isFinal: false,
      description: 'Prefix mismatch trap state',
    });
    stateExplanations.push({
      stateLabel: trapId,
      meaning: 'Prefix did not match. String is rejected regardless of remaining symbols.',
    });

    const transitions: TransitionEdge[] = [];
    let edgeIdx = 0;

    for (let i = 0; i < n; i++) {
      const expectedChar = targetPrefix[i];
      for (const sym of alphabet) {
        transitions.push({
          id: `t-start-${edgeIdx++}`,
          from: `q${i}`,
          to: sym === expectedChar ? `q${i + 1}` : trapId,
          symbols: [sym],
        });
      }
    }

    // Success state self-loops on all symbols
    transitions.push({
      id: `t-start-success-loop`,
      from: `q${n}`,
      to: `q${n}`,
      symbols: [...alphabet],
    });

    // Trap state self-loops on all symbols
    transitions.push({
      id: `t-start-trap-loop`,
      from: trapId,
      to: trapId,
      symbols: [...alphabet],
    });

    const machine: AutomatonDefinition = {
      id: `gen-start-${Date.now()}`,
      name: `DFA: Strings starting with "${targetPrefix}"`,
      type: 'DFA',
      alphabet,
      states: layoutNodes(states, 700, 360),
      transitions,
      startStateId: 'q0',
      finalStateIds: [`q${n}`],
    };

    return {
      prompt: rawPrompt,
      identifiedAlphabet: alphabet,
      patternType: `Prefix Verification (Starts with "${targetPrefix}")`,
      machine,
      analysis: `The machine validates the initial characters symbol-by-symbol against "${targetPrefix}". If all ${n} characters match, it transitions to accepting state q${n} which loops forever. If any initial character mismatches, it transitions to trap state q_trap.`,
      stateExplanations,
      formalTuple: {
        Q: `{${states.map(s => s.label).join(', ')}}`,
        Sigma: `{${alphabet.join(', ')}}`,
        deltaTable: [
          ['State', ...alphabet],
          ...states.map(s => {
            const row = [`${s.id === 'q0' ? '→' : ''}${s.isFinal ? '*' : ''}${s.label}`];
            for (const sym of alphabet) {
              const edge = transitions.find(t => t.from === s.id && t.symbols.includes(sym));
              row.push(edge ? edge.to : '-');
            }
            return row;
          }),
        ],
        q0: 'q0',
        F: `{q${n}}`,
      },
      sampleTests: [
        { input: targetPrefix, expected: true },
        { input: `${targetPrefix}0`, expected: true },
        { input: `${targetPrefix}111`, expected: true },
        { input: '', expected: false },
        { input: `${alphabet[targetPrefix[0] === alphabet[0] ? 1 : 0]}${targetPrefix}`, expected: false },
      ],
    };
  }

  // Pattern 5: Containing substring (e.g. "containing 101", "contains 010")
  const containMatch = prompt.match(/contain(?:ing|s)?\s+([01ab]+)/);
  if (containMatch) {
    const sub = containMatch[1];
    const n = sub.length;
    const states: StateNode[] = [];
    const stateExplanations: { stateLabel: string; meaning: string }[] = [];

    for (let i = 0; i <= n; i++) {
      const id = `q${i}`;
      states.push({
        id,
        label: id,
        x: 0,
        y: 0,
        isStart: i === 0,
        isFinal: i === n,
        description: i === n ? 'Substring found!' : `Prefix of substring matched: "${sub.slice(0, i)}"`,
      });
      stateExplanations.push({
        stateLabel: id,
        meaning:
          i === n
            ? `Substring "${sub}" found in input! The machine stays in this accepting state forever.`
            : `Currently tracking progress: matched "${sub.slice(0, i)}".`,
      });
    }

    const transitions: TransitionEdge[] = [];
    let edgeIdx = 0;

    for (let i = 0; i < n; i++) {
      const currentPrefix = sub.slice(0, i);

      for (const sym of alphabet) {
        const candidate = currentPrefix + sym;
        let nextIdx = 0;
        for (let len = Math.min(candidate.length, n); len > 0; len--) {
          if (sub.slice(0, len) === candidate.slice(candidate.length - len)) {
            nextIdx = len;
            break;
          }
        }
        transitions.push({
          id: `t-contain-${edgeIdx++}`,
          from: `q${i}`,
          to: `q${nextIdx}`,
          symbols: [sym],
        });
      }
    }

    // Final state loops on all alphabet symbols
    transitions.push({
      id: `t-contain-final-loop`,
      from: `q${n}`,
      to: `q${n}`,
      symbols: [...alphabet],
    });

    const machine: AutomatonDefinition = {
      id: `gen-contain-${Date.now()}`,
      name: `DFA: Strings containing "${sub}"`,
      type: 'DFA',
      alphabet,
      states: layoutNodes(states, 700, 360),
      transitions,
      startStateId: 'q0',
      finalStateIds: [`q${n}`],
    };

    return {
      prompt: rawPrompt,
      identifiedAlphabet: alphabet,
      patternType: `Substring Search (Contains "${sub}")`,
      machine,
      analysis: `The DFA tracks consecutive character matches for substring "${sub}". State q_k indicates that a suffix of the text seen matches the first k characters of "${sub}". Once state q${n} is reached, the substring has occurred and the DFA remains in the accepting state for all future symbols.`,
      stateExplanations,
      formalTuple: {
        Q: `{${states.map(s => s.label).join(', ')}}`,
        Sigma: `{${alphabet.join(', ')}}`,
        deltaTable: [
          ['State', ...alphabet],
          ...states.map(s => {
            const row = [`${s.id === 'q0' ? '→' : ''}${s.isFinal ? '*' : ''}${s.label}`];
            for (const sym of alphabet) {
              const edge = transitions.find(t => t.from === s.id && t.symbols.includes(sym));
              row.push(edge ? edge.to : '-');
            }
            return row;
          }),
        ],
        q0: 'q0',
        F: `{q${n}}`,
      },
      sampleTests: [
        { input: sub, expected: true },
        { input: `00${sub}11`, expected: true },
        { input: `1${sub}0`, expected: true },
        { input: '', expected: false },
        { input: sub.slice(0, -1), expected: false },
      ],
    };
  }

  // Default fallback: binary strings ending with 01
  return generateAutomatonFromNaturalLanguage('Accept binary strings ending with 01');
}
