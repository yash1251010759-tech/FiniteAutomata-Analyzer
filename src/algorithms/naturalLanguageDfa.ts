import { AutomatonDefinition, StateNode, TransitionEdge } from '../types/automata';
import { layoutNodes, convertNfaToDfa } from './subsetConstruction';
import { regexToENFA } from './regexToNfa';
import { simulateAutomaton } from './dfaSimulation';

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

/**
 * Normalizes input natural language text and fixes common typos/variations.
 */
export function normalizePrompt(raw: string): string {
  let p = raw.trim().toLowerCase();

  // Fix common typos and abbreviations
  p = p.replace(/\bhat\b/g, 'that');
  p = p.replace(/\btyhen\b/g, 'then');
  p = p.replace(/\bwih\b/g, 'with');
  p = p.replace(/\bwit\b/g, 'with');
  p = p.replace(/\bstartwith\b/g, 'starts with');
  p = p.replace(/\bstartswith\b/g, 'starts with');
  p = p.replace(/\bendwith\b/g, 'ends with');
  p = p.replace(/\bendswith\b/g, 'ends with');
  p = p.replace(/\bdivisble\b/g, 'divisible');
  p = p.replace(/\bbegining\b/g, 'beginning');
  p = p.replace(/\bbegings\b/g, 'begins');
  p = p.replace(/\bconsecutive\b/g, 'consecutive');
  p = p.replace(/\bsubtring\b/g, 'substring');
  p = p.replace(/\bdoesnt\b/g, "doesn't");
  p = p.replace(/\bdont\b/g, "don't");

  // Normalize synonyms for starting
  p = p.replace(/\bbegins?\b/g, 'starts');
  p = p.replace(/\bbeginning\b/g, 'starting');
  p = p.replace(/\bcommencing\b/g, 'starting');

  // Normalize synonyms for ending
  p = p.replace(/\bterminat(?:es|ing|e)\b/g, 'ends');
  p = p.replace(/\bfinish(?:es|ing)?\b/g, 'ends');

  // Normalize prepositional patterns: "1 at the start" -> "starts with 1"
  p = p.replace(/(?:with|having)\s+["'‘“]?([0-9a-zA-Z]+)["'’”]?\s+at\s+(?:the\s+)?(?:start|beginning)/g, 'starts with $1');
  p = p.replace(/first\s+(?:symbol|character|char|bit|letter|digit)?\s*(?:is|=|:)?\s*["'‘“]?([0-9a-zA-Z]+)["'’”]?/g, 'starts with $1');
  p = p.replace(/last\s+(?:symbol|character|char|bit|letter|digit)?\s*(?:is|=|:)?\s*["'‘“]?([0-9a-zA-Z]+)["'’”]?/g, 'ends with $1');
  p = p.replace(/(?:with|having)\s+["'‘“]?([0-9a-zA-Z]+)["'’”]?\s+at\s+(?:the\s+)?end/g, 'ends with $1');

  return p;
}

/**
 * Detects the alphabet (e.g. {'0','1'} or {'a','b'}) from the prompt and extracted tokens.
 */
function detectAlphabet(prompt: string, ...extraTokens: string[]): string[] {
  if (
    prompt.includes('{a, b}') ||
    prompt.includes('{a,b}') ||
    prompt.includes('over {a, b}') ||
    prompt.includes('over {a,b}') ||
    prompt.includes('a and b') ||
    prompt.includes('letters a and b') ||
    prompt.includes('alphabet a, b') ||
    prompt.includes('alphabet {a, b}')
  ) {
    return ['a', 'b'];
  }

  const allTokens = extraTokens.join('');
  if (allTokens.length > 0 && /^[ab]+$/i.test(allTokens) && !/[01]/.test(prompt)) {
    return ['a', 'b'];
  }

  return ['0', '1'];
}

/**
 * Builds standard 5-tuple formal definition from an automaton.
 */
export function buildFormalTuple(machine: AutomatonDefinition) {
  const alphabet = machine.alphabet;
  const states = machine.states;
  const deltaTable = [
    ['State', ...alphabet],
    ...states.map(s => {
      const isStart = s.id === machine.startStateId;
      const isFinal = machine.finalStateIds.includes(s.id);
      const prefix = (isStart ? '→' : '') + (isFinal ? '*' : '');
      const row = [`${prefix}${s.label || s.id}`];
      for (const sym of alphabet) {
        const edge = machine.transitions.find(t => t.from === s.id && t.symbols.includes(sym));
        if (edge) {
          const target = states.find(st => st.id === edge.to);
          row.push(target ? target.label || target.id : edge.to);
        } else {
          row.push('∅');
        }
      }
      return row;
    }),
  ];

  return {
    Q: `{${states.map(s => s.label || s.id).join(', ')}}`,
    Sigma: `{${alphabet.join(', ')}}`,
    deltaTable,
    q0: states.find(s => s.id === machine.startStateId)?.label || machine.startStateId || 'q0',
    F: `{${machine.finalStateIds.map(id => states.find(s => s.id === id)?.label || id).join(', ')}}`,
  };
}

/**
 * Synthesizes DFA from Natural Language specifications.
 */
export function generateAutomatonFromNaturalLanguage(rawPrompt: string): GeneratedMachineReport {
  const prompt = normalizePrompt(rawPrompt);

  // ==========================================
  // Pattern 1: Compound "Starts with X and ends with Y"
  // ==========================================
  const compoundMatch = prompt.match(
    /(?:starts?|starting)\s+(?:off\s+)?(?:with|in)?\s*(?:the\s+)?(?:symbols?|characters?|char|strings?|letters?|bits?|digits?)?\s*["'‘“]?([0-9a-zA-Z]+)["'’”]?\s*(?:and|but)\s*(?:ends?|ending)\s+(?:with|in)?\s*(?:the\s+)?(?:symbols?|characters?|char|strings?|letters?|bits?|digits?)?\s*["'‘“]?([0-9a-zA-Z]+)["'’”]?/
  );
  if (compoundMatch) {
    const startPrefix = compoundMatch[1];
    const endSuffix = compoundMatch[2];
    const alphabet = detectAlphabet(prompt, startPrefix, endSuffix);
    const [s0, s1] = alphabet;

    // Single-char start & end optimization: 4/5 state DFA
    if (startPrefix.length === 1 && endSuffix.length === 1) {
      const pX = startPrefix;
      const sY = endSuffix;
      const otherStart = alphabet.find(s => s !== pX) || s0;

      const states: StateNode[] = [
        {
          id: 'q0',
          label: 'q0',
          x: 140,
          y: 200,
          isStart: true,
          isFinal: false,
          description: `Initial state (expecting start symbol '${pX}')`,
        },
        {
          id: 'q_acc',
          label: 'q_acc',
          x: 480,
          y: 130,
          isStart: false,
          isFinal: true,
          description: `Started with '${pX}' and currently ends with '${sY}' (Accepted)`,
        },
        {
          id: 'q_mid',
          label: 'q_mid',
          x: 480,
          y: 270,
          isStart: false,
          isFinal: false,
          description: `Started with '${pX}' but currently does not end with '${sY}'`,
        },
        {
          id: 'q_trap',
          label: 'q_trap',
          x: 140,
          y: 350,
          isStart: false,
          isFinal: false,
          description: `Prefix mismatch trap state (did not start with '${pX}')`,
        },
      ];

      const transitions: TransitionEdge[] = [
        // From q0:
        { id: 't-q0-pX', from: 'q0', to: pX === sY ? 'q_acc' : 'q_mid', symbols: [pX] },
        { id: 't-q0-trap', from: 'q0', to: 'q_trap', symbols: [otherStart] },
        // From q_acc:
        { id: 't-acc-sY', from: 'q_acc', to: 'q_acc', symbols: [sY] },
        {
          id: 't-acc-other',
          from: 'q_acc',
          to: 'q_mid',
          symbols: alphabet.filter(s => s !== sY),
        },
        // From q_mid:
        { id: 't-mid-sY', from: 'q_mid', to: 'q_acc', symbols: [sY] },
        {
          id: 't-mid-other',
          from: 'q_mid',
          to: 'q_mid',
          symbols: alphabet.filter(s => s !== sY),
        },
        // Trap loop:
        { id: 't-trap-loop', from: 'q_trap', to: 'q_trap', symbols: [...alphabet] },
      ];

      const machine: AutomatonDefinition = {
        id: `gen-start-end-${Date.now()}`,
        name: `DFA: Starts with "${pX}" and ends with "${sY}"`,
        type: 'DFA',
        alphabet,
        states,
        transitions,
        startStateId: 'q0',
        finalStateIds: ['q_acc'],
      };

      return {
        prompt: rawPrompt,
        identifiedAlphabet: alphabet,
        patternType: `Compound Boundary (Starts with "${pX}" & Ends with "${sY}")`,
        machine,
        analysis: `The automaton verifies that the first character is '${pX}'. If not, it transitions to a permanent trap state. Once validly started, state q_acc tracks whether the most recent symbol matches '${sY}'. Only strings that both started with '${pX}' and end with '${sY}' reside in q_acc.`,
        stateExplanations: [
          { stateLabel: 'q0', meaning: `Start state. Awaiting first symbol (must be '${pX}').` },
          { stateLabel: 'q_acc', meaning: `Valid string: started with '${pX}' and currently ends with '${sY}'.` },
          { stateLabel: 'q_mid', meaning: `Valid prefix: started with '${pX}', but current suffix is not '${sY}'.` },
          { stateLabel: 'q_trap', meaning: `Dead state: first character was '${otherStart}' instead of '${pX}'.` },
        ],
        formalTuple: buildFormalTuple(machine),
        sampleTests: [
          { input: `${pX}${sY}`, expected: true },
          { input: `${pX}${s0}${sY}`, expected: true },
          { input: `${pX}${s1}${sY}`, expected: true },
          { input: `${pX}`, expected: pX === sY },
          { input: `${otherStart}${sY}`, expected: false },
          { input: '', expected: false },
        ],
      };
    }
  }

  // ==========================================
  // Pattern 2: Starts and ends with the SAME symbol
  // ==========================================
  const sameStartEnd =
    prompt.includes('same') &&
    (prompt.includes('start and end') ||
      prompt.includes('beginning and end') ||
      prompt.includes('starts and ends') ||
      prompt.includes('first and last'));
  if (sameStartEnd) {
    const alphabet = detectAlphabet(prompt);
    const [s0, s1] = alphabet;

    const states: StateNode[] = [
      { id: 'q0', label: 'q0', x: 150, y: 220, isStart: true, isFinal: false, description: 'Initial state' },
      { id: 'q00', label: 'q0_0', x: 380, y: 130, isStart: false, isFinal: true, description: `Starts with ${s0}, ends with ${s0} (Accepted)` },
      { id: 'q01', label: 'q0_1', x: 600, y: 130, isStart: false, isFinal: false, description: `Starts with ${s0}, ends with ${s1}` },
      { id: 'q11', label: 'q1_1', x: 380, y: 310, isStart: false, isFinal: true, description: `Starts with ${s1}, ends with ${s1} (Accepted)` },
      { id: 'q10', label: 'q1_0', x: 600, y: 310, isStart: false, isFinal: false, description: `Starts with ${s1}, ends with ${s0}` },
    ];

    const transitions: TransitionEdge[] = [
      { id: 't0-s0', from: 'q0', to: 'q00', symbols: [s0] },
      { id: 't0-s1', from: 'q0', to: 'q11', symbols: [s1] },
      // Branch s0
      { id: 't00-s0', from: 'q00', to: 'q00', symbols: [s0] },
      { id: 't00-s1', from: 'q00', to: 'q01', symbols: [s1] },
      { id: 't01-s0', from: 'q01', to: 'q00', symbols: [s0] },
      { id: 't01-s1', from: 'q01', to: 'q01', symbols: [s1] },
      // Branch s1
      { id: 't11-s1', from: 'q11', to: 'q11', symbols: [s1] },
      { id: 't11-s0', from: 'q11', to: 'q10', symbols: [s0] },
      { id: 't10-s1', from: 'q10', to: 'q11', symbols: [s1] },
      { id: 't10-s0', from: 'q10', to: 'q10', symbols: [s0] },
    ];

    const machine: AutomatonDefinition = {
      id: `gen-same-${Date.now()}`,
      name: `DFA: Starts and ends with same symbol`,
      type: 'DFA',
      alphabet,
      states,
      transitions,
      startStateId: 'q0',
      finalStateIds: ['q00', 'q11'],
    };

    return {
      prompt: rawPrompt,
      identifiedAlphabet: alphabet,
      patternType: 'Boundary Invariance (Same Start and End Symbol)',
      machine,
      analysis: `The machine remembers the very first symbol read (branching to top row if '${s0}' or bottom row if '${s1}'). Within each branch, states oscillate depending on the latest symbol seen. The string is accepted if the latest symbol matches the initial symbol.`,
      stateExplanations: [
        { stateLabel: 'q0', meaning: 'Empty string / Start state.' },
        { stateLabel: 'q0_0', meaning: `Started with '${s0}' and latest symbol is '${s0}'. (Accepted)` },
        { stateLabel: 'q0_1', meaning: `Started with '${s0}' and latest symbol is '${s1}'.` },
        { stateLabel: 'q1_1', meaning: `Started with '${s1}' and latest symbol is '${s1}'. (Accepted)` },
        { stateLabel: 'q1_0', meaning: `Started with '${s1}' and latest symbol is '${s0}'.` },
      ],
      formalTuple: buildFormalTuple(machine),
      sampleTests: [
        { input: s0, expected: true },
        { input: s1, expected: true },
        { input: `${s0}${s1}${s0}`, expected: true },
        { input: `${s1}${s0}${s0}${s1}`, expected: true },
        { input: `${s0}${s1}`, expected: false },
        { input: `${s1}${s0}`, expected: false },
        { input: '', expected: false },
      ],
    };
  }

  // ==========================================
  // Pattern 3: Starts and ends with DIFFERENT symbols
  // ==========================================
  const diffStartEnd =
    (prompt.includes('different') || prompt.includes('differ')) &&
    (prompt.includes('start and end') ||
      prompt.includes('beginning and end') ||
      prompt.includes('starts and ends') ||
      prompt.includes('first and last'));
  if (diffStartEnd) {
    const alphabet = detectAlphabet(prompt);
    const [s0, s1] = alphabet;

    const states: StateNode[] = [
      { id: 'q0', label: 'q0', x: 150, y: 220, isStart: true, isFinal: false, description: 'Initial state' },
      { id: 'q00', label: 'q0_0', x: 380, y: 130, isStart: false, isFinal: false, description: `Starts with ${s0}, ends with ${s0}` },
      { id: 'q01', label: 'q0_1', x: 600, y: 130, isStart: false, isFinal: true, description: `Starts with ${s0}, ends with ${s1} (Accepted)` },
      { id: 'q11', label: 'q1_1', x: 380, y: 310, isStart: false, isFinal: false, description: `Starts with ${s1}, ends with ${s1}` },
      { id: 'q10', label: 'q1_0', x: 600, y: 310, isStart: false, isFinal: true, description: `Starts with ${s1}, ends with ${s0} (Accepted)` },
    ];

    const transitions: TransitionEdge[] = [
      { id: 't0-s0', from: 'q0', to: 'q00', symbols: [s0] },
      { id: 't0-s1', from: 'q0', to: 'q11', symbols: [s1] },
      { id: 't00-s0', from: 'q00', to: 'q00', symbols: [s0] },
      { id: 't00-s1', from: 'q00', to: 'q01', symbols: [s1] },
      { id: 't01-s0', from: 'q01', to: 'q00', symbols: [s0] },
      { id: 't01-s1', from: 'q01', to: 'q01', symbols: [s1] },
      { id: 't11-s1', from: 'q11', to: 'q11', symbols: [s1] },
      { id: 't11-s0', from: 'q11', to: 'q10', symbols: [s0] },
      { id: 't10-s1', from: 'q10', to: 'q11', symbols: [s1] },
      { id: 't10-s0', from: 'q10', to: 'q10', symbols: [s0] },
    ];

    const machine: AutomatonDefinition = {
      id: `gen-diff-${Date.now()}`,
      name: `DFA: Starts and ends with different symbols`,
      type: 'DFA',
      alphabet,
      states,
      transitions,
      startStateId: 'q0',
      finalStateIds: ['q01', 'q10'],
    };

    return {
      prompt: rawPrompt,
      identifiedAlphabet: alphabet,
      patternType: 'Boundary Disparity (Different Start and End Symbol)',
      machine,
      analysis: `The machine branches based on the initial symbol, then accepts when the current ending symbol is distinct from the start symbol.`,
      stateExplanations: [
        { stateLabel: 'q0', meaning: 'Empty string / Start state.' },
        { stateLabel: 'q0_0', meaning: `Starts with '${s0}' and currently ends with '${s0}'.` },
        { stateLabel: 'q0_1', meaning: `Starts with '${s0}' and currently ends with '${s1}'. (Accepted)` },
        { stateLabel: 'q1_1', meaning: `Starts with '${s1}' and currently ends with '${s1}'.` },
        { stateLabel: 'q1_0', meaning: `Starts with '${s1}' and currently ends with '${s0}'. (Accepted)` },
      ],
      formalTuple: buildFormalTuple(machine),
      sampleTests: [
        { input: `${s0}${s1}`, expected: true },
        { input: `${s1}${s0}`, expected: true },
        { input: `${s0}${s0}${s1}`, expected: true },
        { input: s0, expected: false },
        { input: s1, expected: false },
        { input: `${s0}${s1}${s0}`, expected: false },
        { input: '', expected: false },
      ],
    };
  }

  // ==========================================
  // Pattern 4: Starting with a specific prefix (e.g. "starts with 1", "starting with 10")
  // ==========================================
  const isNegatedStart =
    prompt.includes('not start') ||
    prompt.includes("doesn't start") ||
    prompt.includes('does not start') ||
    prompt.includes('never start');

  const startMatch = prompt.match(
    /(?:starts?|starting)\s+(?:off\s+)?(?:with|in|by)?\s*(?:the\s+)?(?:symbols?|characters?|char|strings?|letters?|bits?|digits?)?\s*["'‘“]?([0-9a-zA-Z]+)["'’”]?/
  );

  if (startMatch) {
    const targetPrefix = startMatch[1];
    const n = targetPrefix.length;
    const alphabet = detectAlphabet(prompt, targetPrefix);

    const states: StateNode[] = [];
    const stateExplanations: { stateLabel: string; meaning: string }[] = [];

    // Prefix progression states: q0, q1, ..., qn
    for (let i = 0; i <= n; i++) {
      const id = `q${i}`;
      const isFinal = isNegatedStart ? false : i === n;
      states.push({
        id,
        label: id,
        x: 0,
        y: 0,
        isStart: i === 0,
        isFinal,
        description:
          i === n
            ? `${isNegatedStart ? 'Rejected' : 'Accepted'}: prefix "${targetPrefix}" matched`
            : `Reading prefix character #${i + 1}`,
      });
      stateExplanations.push({
        stateLabel: id,
        meaning:
          i === n
            ? isNegatedStart
              ? `Prefix "${targetPrefix}" was matched, so string is permanently REJECTED.`
              : `Prefix "${targetPrefix}" was matched! All subsequent symbols remain ACCEPTED.`
            : `Matched initial ${i} symbol(s) of prefix "${targetPrefix}".`,
      });
    }

    // Trap / Mismatch state
    const trapId = 'q_trap';
    const isTrapFinal = isNegatedStart; // If negated, mismatch means valid (does not start with prefix)
    states.push({
      id: trapId,
      label: trapId,
      x: 0,
      y: 0,
      isStart: false,
      isFinal: isTrapFinal,
      description: isTrapFinal ? 'Accepted (does not start with prefix)' : 'Prefix mismatch trap state',
    });
    stateExplanations.push({
      stateLabel: trapId,
      meaning: isTrapFinal
        ? `First symbols differed from "${targetPrefix}". String is successfully ACCEPTED.`
        : `Prefix mismatch. String rejected regardless of remaining symbols.`,
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

    // Success state loops on all symbols
    transitions.push({
      id: `t-start-success-loop`,
      from: `q${n}`,
      to: `q${n}`,
      symbols: [...alphabet],
    });

    // Trap state loops on all symbols
    transitions.push({
      id: `t-start-trap-loop`,
      from: trapId,
      to: trapId,
      symbols: [...alphabet],
    });

    // Custom layout for optimal aesthetics (especially n=1 like "starts with 1")
    let laidStates: StateNode[];
    if (n === 1) {
      laidStates = states.map(s => {
        if (s.id === 'q0') return { ...s, x: 160, y: 200 };
        if (s.id === 'q1') return { ...s, x: 440, y: 140 };
        return { ...s, x: 440, y: 280 };
      });
    } else {
      laidStates = layoutNodes(states, 700, 360);
    }

    const machine: AutomatonDefinition = {
      id: `gen-start-${Date.now()}`,
      name: `DFA: Strings ${isNegatedStart ? 'not ' : ''}starting with "${targetPrefix}"`,
      type: 'DFA',
      alphabet,
      states: laidStates,
      transitions,
      startStateId: 'q0',
      finalStateIds: isNegatedStart ? [trapId] : [`q${n}`],
    };

    const otherChar = alphabet.find(s => s !== targetPrefix[0]) || (targetPrefix[0] === '0' ? '1' : '0');

    return {
      prompt: rawPrompt,
      identifiedAlphabet: alphabet,
      patternType: `Prefix Verification (${isNegatedStart ? 'Not ' : ''}Starts with "${targetPrefix}")`,
      machine,
      analysis: isNegatedStart
        ? `The machine validates the initial symbols against "${targetPrefix}". If the input diverges, it transitions to accepting state q_trap. If it matches "${targetPrefix}", it enters rejection state q${n}.`
        : `The automaton inspects initial symbols character-by-character against prefix "${targetPrefix}". If matched, it moves to accepting state q${n} which loops unconditionally. Any initial character divergence branches to trap state q_trap.`,
      stateExplanations,
      formalTuple: buildFormalTuple(machine),
      sampleTests: [
        { input: targetPrefix, expected: !isNegatedStart },
        { input: `${targetPrefix}${alphabet[0]}`, expected: !isNegatedStart },
        { input: `${targetPrefix}${alphabet[1]}`, expected: !isNegatedStart },
        { input: `${otherChar}${targetPrefix}`, expected: isNegatedStart },
        { input: `${otherChar}`, expected: isNegatedStart },
        { input: '', expected: false },
      ],
    };
  }

  // ==========================================
  // Pattern 5: Ending with a specific suffix (e.g. "ends with 01", "ending in 1")
  // ==========================================
  const isNegatedEnd =
    prompt.includes('not end') ||
    prompt.includes("doesn't end") ||
    prompt.includes('does not end') ||
    prompt.includes('never end');

  const endMatch = prompt.match(
    /(?:ends?|ending)\s+(?:with|in|by)?\s*(?:the\s+)?(?:symbols?|characters?|char|strings?|letters?|bits?|digits?)?\s*["'‘“]?([0-9a-zA-Z]+)["'’”]?/
  );

  if (endMatch) {
    const targetSuffix = endMatch[1];
    const n = targetSuffix.length;
    const alphabet = detectAlphabet(prompt, targetSuffix);
    const states: StateNode[] = [];
    const stateExplanations: { stateLabel: string; meaning: string }[] = [];

    for (let i = 0; i <= n; i++) {
      const id = `q${i}`;
      const prefixMatched = targetSuffix.slice(0, i);
      const isFinal = isNegatedEnd ? i !== n : i === n;
      states.push({
        id,
        label: id,
        x: 0,
        y: 0,
        isStart: i === 0,
        isFinal,
        description: i === 0 ? 'No matched suffix' : `Matched suffix "${prefixMatched}"`,
      });
      stateExplanations.push({
        stateLabel: id,
        meaning:
          i === 0
            ? 'No useful prefix of the required suffix is currently matched.'
            : `Longest suffix matching required pattern "${targetSuffix}" is "${prefixMatched}" (length ${i}/${n}).`,
      });
    }

    // Build transitions by KMP-style suffix matching
    const transitions: TransitionEdge[] = [];
    let edgeIdx = 0;

    for (let i = 0; i <= n; i++) {
      const currentPrefix = targetSuffix.slice(0, i);

      for (const sym of alphabet) {
        const candidate = currentPrefix + sym;
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

    const finalStateIds = states.filter(s => s.isFinal).map(s => s.id);

    const machine: AutomatonDefinition = {
      id: `gen-end-${Date.now()}`,
      name: `DFA: Strings ${isNegatedEnd ? 'not ' : ''}ending with "${targetSuffix}"`,
      type: 'DFA',
      alphabet,
      states: layoutNodes(states, 700, 360),
      transitions,
      startStateId: 'q0',
      finalStateIds,
    };

    return {
      prompt: rawPrompt,
      identifiedAlphabet: alphabet,
      patternType: `Suffix Matching (${isNegatedEnd ? 'Not ' : ''}Ends with "${targetSuffix}")`,
      machine,
      analysis: `The machine tracks the longest suffix of input read so far matching a prefix of "${targetSuffix}". On every incoming symbol, it advances or rolls back to the longest overlapping match prefix.`,
      stateExplanations,
      formalTuple: buildFormalTuple(machine),
      sampleTests: [
        { input: targetSuffix, expected: !isNegatedEnd },
        { input: `${alphabet[0]}${targetSuffix}`, expected: !isNegatedEnd },
        { input: `${alphabet[1]}${targetSuffix}`, expected: !isNegatedEnd },
        { input: targetSuffix.slice(0, -1), expected: targetSuffix.length === 1 ? false : isNegatedEnd },
      ],
    };
  }

  // ==========================================
  // Pattern 6: Substring Matching (Contains / Does NOT contain)
  // ==========================================
  const notContainMatch =
    prompt.match(
      /(?:does\s+not|doesn't|not|without|free\s+of|never)\s+(?:contain(?:s|ing)?|hav(?:e|ing)|includ(?:es?|ing)|with)\s*(?:the\s+)?(?:substring\s+)?["'‘“]?([0-9a-zA-Z]+)["'’”]?/
    ) ||
    prompt.match(/(?:no|without|zero)\s+consecutive\s+([01ab]+)/) ||
    prompt.match(/(?:no|without)\s+two\s+consecutive\s+([01ab]+)/) ||
    prompt.match(/no\s+([01ab]{2,})/);

  const containMatch = prompt.match(
    /(?:contain(?:s|ing)?|includ(?:es?|ing)|hav(?:e|ing)|has\s+substring|with\s+substring)\s*["'‘“]?([0-9a-zA-Z]+)["'’”]?/
  );

  if (notContainMatch || containMatch) {
    const isNegated = Boolean(notContainMatch);
    let sub = notContainMatch ? notContainMatch[1] : containMatch![1];

    // Handle "no consecutive 0s" -> "00", "no consecutive 1s" -> "11"
    if (sub === '0' || sub === '0s') sub = '00';
    if (sub === '1' || sub === '1s') sub = '11';
    if (sub === 'a' || sub === 'as') sub = 'aa';
    if (sub === 'b' || sub === 'bs') sub = 'bb';

    const n = sub.length;
    const alphabet = detectAlphabet(prompt, sub);
    const states: StateNode[] = [];
    const stateExplanations: { stateLabel: string; meaning: string }[] = [];

    for (let i = 0; i <= n; i++) {
      const id = `q${i}`;
      const isFinal = isNegated ? i < n : i === n;
      states.push({
        id,
        label: id,
        x: 0,
        y: 0,
        isStart: i === 0,
        isFinal,
        description:
          i === n
            ? `Substring "${sub}" found (${isNegated ? 'Rejected trap' : 'Accepted'})`
            : `Matched substring prefix "${sub.slice(0, i)}"`,
      });
      stateExplanations.push({
        stateLabel: id,
        meaning:
          i === n
            ? isNegated
              ? `Forbidden substring "${sub}" was found. String permanently rejected.`
              : `Substring "${sub}" has occurred! Remains accepted forever.`
            : `Currently tracking progress: matched "${sub.slice(0, i)}" of forbidden/target pattern.`,
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

    // Match state loops unconditionally on all symbols
    transitions.push({
      id: `t-contain-final-loop`,
      from: `q${n}`,
      to: `q${n}`,
      symbols: [...alphabet],
    });

    const finalStateIds = states.filter(s => s.isFinal).map(s => s.id);

    const machine: AutomatonDefinition = {
      id: `gen-contain-${Date.now()}`,
      name: `DFA: Strings ${isNegated ? 'not ' : ''}containing "${sub}"`,
      type: 'DFA',
      alphabet,
      states: layoutNodes(states, 700, 360),
      transitions,
      startStateId: 'q0',
      finalStateIds,
    };

    return {
      prompt: rawPrompt,
      identifiedAlphabet: alphabet,
      patternType: `Substring Search (${isNegated ? 'Excludes' : 'Contains'} "${sub}")`,
      machine,
      analysis: isNegated
        ? `The machine monitors for substring "${sub}". State q${n} acts as a dead trap reached as soon as "${sub}" occurs. All states before q${n} are accepting.`
        : `The DFA tracks consecutive matches for substring "${sub}". Once reached, state q${n} permanently traps and accepts.`,
      stateExplanations,
      formalTuple: buildFormalTuple(machine),
      sampleTests: [
        { input: sub, expected: !isNegated },
        { input: `${alphabet[0]}${sub}${alphabet[1]}`, expected: !isNegated },
        { input: '', expected: isNegated },
        { input: sub.slice(0, -1), expected: isNegated },
      ],
    };
  }

  // ==========================================
  // Pattern 7: Alternating 0s and 1s
  // ==========================================
  if (prompt.includes('alternating') || prompt.includes('no two adjacent equal') || prompt.includes('no consecutive equal')) {
    const alphabet = detectAlphabet(prompt);
    const [s0, s1] = alphabet;

    const states: StateNode[] = [
      { id: 'q0', label: 'q0', x: 150, y: 200, isStart: true, isFinal: true, description: 'Empty string (Accepted)' },
      { id: 'q_s0', label: `q_${s0}`, x: 380, y: 130, isStart: false, isFinal: true, description: `Ends with '${s0}' (Accepted)` },
      { id: 'q_s1', label: `q_${s1}`, x: 380, y: 270, isStart: false, isFinal: true, description: `Ends with '${s1}' (Accepted)` },
      { id: 'q_trap', label: 'q_trap', x: 600, y: 200, isStart: false, isFinal: false, description: 'Consecutive duplicate trap' },
    ];

    const transitions: TransitionEdge[] = [
      { id: 't0-s0', from: 'q0', to: 'q_s0', symbols: [s0] },
      { id: 't0-s1', from: 'q0', to: 'q_s1', symbols: [s1] },
      { id: 'ts0-s1', from: 'q_s0', to: 'q_s1', symbols: [s1] },
      { id: 'ts0-trap', from: 'q_s0', to: 'q_trap', symbols: [s0] },
      { id: 'ts1-s0', from: 'q_s1', to: 'q_s0', symbols: [s0] },
      { id: 'ts1-trap', from: 'q_s1', to: 'q_trap', symbols: [s1] },
      { id: 'ttrap-loop', from: 'q_trap', to: 'q_trap', symbols: [...alphabet] },
    ];

    const machine: AutomatonDefinition = {
      id: `gen-alt-${Date.now()}`,
      name: `DFA: Alternating ${s0}s and ${s1}s`,
      type: 'DFA',
      alphabet,
      states,
      transitions,
      startStateId: 'q0',
      finalStateIds: ['q0', 'q_s0', 'q_s1'],
    };

    return {
      prompt: rawPrompt,
      identifiedAlphabet: alphabet,
      patternType: 'Alternation (No Consecutive Identical Symbols)',
      machine,
      analysis: `The machine ensures symbols alternate strictly without repetition. An identical adjacent symbol triggers transition to q_trap.`,
      stateExplanations: [
        { stateLabel: 'q0', meaning: 'Start state (empty string is valid).' },
        { stateLabel: `q_${s0}`, meaning: `Most recent symbol was '${s0}'. Expecting '${s1}' next.` },
        { stateLabel: `q_${s1}`, meaning: `Most recent symbol was '${s1}'. Expecting '${s0}' next.` },
        { stateLabel: 'q_trap', meaning: 'Saw two identical symbols consecutively. Reject forever.' },
      ],
      formalTuple: buildFormalTuple(machine),
      sampleTests: [
        { input: '', expected: true },
        { input: `${s0}${s1}${s0}`, expected: true },
        { input: `${s1}${s0}${s1}${s0}`, expected: true },
        { input: `${s0}${s0}`, expected: false },
        { input: `${s1}${s1}`, expected: false },
      ],
    };
  }

  // ==========================================
  // Pattern 8: Both Even number of 0s and Even number of 1s (Product Automaton)
  // ==========================================
  if (
    prompt.includes('both') &&
    (prompt.includes('even number of 0') || prompt.includes('even 0') || prompt.includes('even number of 1'))
  ) {
    const alphabet = detectAlphabet(prompt);
    const [s0, s1] = alphabet;

    const states: StateNode[] = [
      { id: 'q_ee', label: 'q_ee', x: 220, y: 150, isStart: true, isFinal: true, description: `Even ${s0}s, Even ${s1}s (Accepted)` },
      { id: 'q_oe', label: 'q_oe', x: 480, y: 150, isStart: false, isFinal: false, description: `Odd ${s0}s, Even ${s1}s` },
      { id: 'q_eo', label: 'q_eo', x: 220, y: 310, isStart: false, isFinal: false, description: `Even ${s0}s, Odd ${s1}s` },
      { id: 'q_oo', label: 'q_oo', x: 480, y: 310, isStart: false, isFinal: false, description: `Odd ${s0}s, Odd ${s1}s` },
    ];

    const transitions: TransitionEdge[] = [
      { id: 'tee-s0', from: 'q_ee', to: 'q_oe', symbols: [s0] },
      { id: 'tee-s1', from: 'q_ee', to: 'q_eo', symbols: [s1] },
      { id: 'toe-s0', from: 'q_oe', to: 'q_ee', symbols: [s0] },
      { id: 'toe-s1', from: 'q_oe', to: 'q_oo', symbols: [s1] },
      { id: 'teo-s0', from: 'q_eo', to: 'q_oo', symbols: [s0] },
      { id: 'teo-s1', from: 'q_eo', to: 'q_ee', symbols: [s1] },
      { id: 'too-s0', from: 'q_oo', to: 'q_eo', symbols: [s0] },
      { id: 'too-s1', from: 'q_oo', to: 'q_oe', symbols: [s1] },
    ];

    const machine: AutomatonDefinition = {
      id: `gen-both-parity-${Date.now()}`,
      name: `DFA: Even ${s0}'s and Even ${s1}'s`,
      type: 'DFA',
      alphabet,
      states,
      transitions,
      startStateId: 'q_ee',
      finalStateIds: ['q_ee'],
    };

    return {
      prompt: rawPrompt,
      identifiedAlphabet: alphabet,
      patternType: 'Joint Parity (Even 0s and Even 1s)',
      machine,
      analysis: `Classic 4-state product DFA. The two parity coordinates (modulo 2 for '${s0}' and modulo 2 for '${s1}') form four distinct states {q_ee, q_oe, q_eo, q_oo}. Symbol '${s0}' toggles the first component; symbol '${s1}' toggles the second.`,
      stateExplanations: [
        { stateLabel: 'q_ee', meaning: `Both count of '${s0}' and count of '${s1}' are even (including 0). Accepted.` },
        { stateLabel: 'q_oe', meaning: `Count of '${s0}' is odd, count of '${s1}' is even.` },
        { stateLabel: 'q_eo', meaning: `Count of '${s0}' is even, count of '${s1}' is odd.` },
        { stateLabel: 'q_oo', meaning: `Both counts are odd.` },
      ],
      formalTuple: buildFormalTuple(machine),
      sampleTests: [
        { input: '', expected: true },
        { input: `${s0}${s0}`, expected: true },
        { input: `${s1}${s1}`, expected: true },
        { input: `${s0}${s1}${s0}${s1}`, expected: true },
        { input: s0, expected: false },
        { input: s1, expected: false },
      ],
    };
  }

  // ==========================================
  // Pattern 9: Divisible by N (Binary Modulo Arithmetic)
  // ==========================================
  const divMatch = prompt.match(/(?:divisible\s+by|multiple\s+of)\s+(\d+)/);
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
      analysis: `To accept binary numbers divisible by ${k}, states represent the remainder modulo ${k} ({0, ..., ${k - 1}}). When appending bit b to number N, the new value is 2*N + b, so the next state remainder is (2*r + b) mod ${k}.`,
      stateExplanations,
      formalTuple: buildFormalTuple(machine),
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

  // ==========================================
  // Pattern 10: Even or Odd number of a specific symbol
  // ==========================================
  if (prompt.includes('even number of') || prompt.includes('odd number of') || prompt.includes('even count of') || prompt.includes('odd count of')) {
    const isEven = prompt.includes('even');
    let targetSym = '1';
    if (/\b0s?\b|['"]0['"]|symbol\s*0|bit\s*0/.test(prompt)) targetSym = '0';
    else if (/\b1s?\b|['"]1['"]|symbol\s*1|bit\s*1/.test(prompt)) targetSym = '1';
    else if (/\bas?\b|['"]a['"]|symbol\s*a|letter\s*a/.test(prompt)) targetSym = 'a';
    else if (/\bbs?\b|['"]b['"]|symbol\s*b|letter\s*b/.test(prompt)) targetSym = 'b';

    const alphabet = detectAlphabet(prompt, targetSym);
    const otherSym = alphabet.find(s => s !== targetSym) || (targetSym === '0' ? '1' : '0');

    const states: StateNode[] = [
      {
        id: 'q0',
        label: 'q0',
        x: 220,
        y: 200,
        isStart: true,
        isFinal: isEven,
        description: `Even count of '${targetSym}'`,
      },
      {
        id: 'q1',
        label: 'q1',
        x: 480,
        y: 200,
        isStart: false,
        isFinal: !isEven,
        description: `Odd count of '${targetSym}'`,
      },
    ];

    const transitions: TransitionEdge[] = [
      { id: 't0-target', from: 'q0', to: 'q1', symbols: [targetSym] },
      { id: 't1-target', from: 'q1', to: 'q0', symbols: [targetSym] },
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
      analysis: `We only need to track the parity (modulo 2 count) of symbol '${targetSym}'. State q0 represents an even count (0, 2, 4, ...), and state q1 represents an odd count (1, 3, 5, ...). Symbol '${otherSym}' does not affect the count and loops in place.`,
      stateExplanations: [
        { stateLabel: 'q0', meaning: `Even number of '${targetSym}'s read so far.` },
        { stateLabel: 'q1', meaning: `Odd number of '${targetSym}'s read so far.` },
      ],
      formalTuple: buildFormalTuple(machine),
      sampleTests: [
        { input: '', expected: isEven },
        { input: targetSym, expected: !isEven },
        { input: targetSym + targetSym, expected: isEven },
        { input: targetSym + otherSym + targetSym, expected: isEven },
        { input: targetSym + otherSym, expected: !isEven },
      ],
    };
  }

  // ==========================================
  // Pattern 11: Length Constraints (Even length, Odd length, Length divisible by k)
  // ==========================================
  if (prompt.includes('length') || prompt.includes('even number of symbols') || prompt.includes('odd number of symbols')) {
    const alphabet = detectAlphabet(prompt);
    const isOdd = prompt.includes('odd');
    const isEven = prompt.includes('even');

    if (isOdd || isEven) {
      const states: StateNode[] = [
        { id: 'q0', label: 'q0', x: 220, y: 200, isStart: true, isFinal: isEven, description: 'Even length' },
        { id: 'q1', label: 'q1', x: 480, y: 200, isStart: false, isFinal: isOdd, description: 'Odd length' },
      ];
      const transitions: TransitionEdge[] = [
        { id: 't0-all', from: 'q0', to: 'q1', symbols: [...alphabet] },
        { id: 't1-all', from: 'q1', to: 'q0', symbols: [...alphabet] },
      ];

      const machine: AutomatonDefinition = {
        id: `gen-len-${Date.now()}`,
        name: `DFA: ${isEven ? 'Even' : 'Odd'} Length Strings`,
        type: 'DFA',
        alphabet,
        states,
        transitions,
        startStateId: 'q0',
        finalStateIds: [isEven ? 'q0' : 'q1'],
      };

      return {
        prompt: rawPrompt,
        identifiedAlphabet: alphabet,
        patternType: `Length Parity (${isEven ? 'Even' : 'Odd'} Length)`,
        machine,
        analysis: `State oscillates on every incoming character regardless of symbol identity. q0 is reached on even lengths; q1 on odd lengths.`,
        stateExplanations: [
          { stateLabel: 'q0', meaning: `String length is even (0, 2, 4, ...).` },
          { stateLabel: 'q1', meaning: `String length is odd (1, 3, 5, ...).` },
        ],
        formalTuple: buildFormalTuple(machine),
        sampleTests: [
          { input: '', expected: isEven },
          { input: alphabet[0], expected: isOdd },
          { input: alphabet[0] + alphabet[1], expected: isEven },
          { input: alphabet[0] + alphabet[1] + alphabet[0], expected: isOdd },
        ],
      };
    }
  }

  // ==========================================
  // Pattern 12: Direct Regular Expression Synthesis
  // ==========================================
  const looksLikeRegex = /[\*\+\|\(\)]/.test(prompt) || prompt.startsWith('regex:');
  if (looksLikeRegex) {
    try {
      const cleanRegex = prompt.replace(/^regex:\s*/, '').trim();
      const nfa = regexToENFA(cleanRegex);
      const conversion = convertNfaToDfa(nfa);
      const machine = conversion.resultMachine;

      return {
        prompt: rawPrompt,
        identifiedAlphabet: machine.alphabet,
        patternType: `Regular Expression Synthesis ("${cleanRegex}")`,
        machine,
        analysis: `Synthesized directly via Thompson's Construction (Regex → ε-NFA) followed by the Subset Powerset Construction algorithm to eliminate non-determinism.`,
        stateExplanations: machine.states.map(s => ({
          stateLabel: s.label || s.id,
          meaning: s.isFinal ? 'Accepting DFA state subset' : 'Intermediate DFA state subset',
        })),
        formalTuple: buildFormalTuple(machine),
        sampleTests: [
          { input: '', expected: machine.finalStateIds.includes(machine.startStateId) },
          { input: machine.alphabet[0] || '0', expected: simulateAutomaton(machine, machine.alphabet[0] || '0').accepted },
        ],
      };
    } catch {
      // Fall through to default if regex parse fails
    }
  }

  // ==========================================
  // Pattern 13: Universal Default / Fallback
  // ==========================================
  // Default fallback: binary strings ending with 01
  return generateAutomatonFromNaturalLanguage('Accept binary strings ending with 01');
}
