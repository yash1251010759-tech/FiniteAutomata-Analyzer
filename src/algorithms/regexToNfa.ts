import { AutomatonDefinition, StateNode, TransitionEdge } from '../types/automata';
import { layoutNodes } from './subsetConstruction';

interface NFAFragment {
  start: string;
  end: string;
  states: StateNode[];
  transitions: TransitionEdge[];
}

// Format and insert explicit concatenation operator '.'
export function insertConcatOperators(regex: string): string {
  let output = '';
  // Clean spaces
  const s = regex.replace(/\s+/g, '');
  const operators = new Set(['*', '+', '?', '|']);

  for (let i = 0; i < s.length; i++) {
    const c1 = s[i];
    output += c1;

    if (i + 1 < s.length) {
      const c2 = s[i + 1];

      // Insert '.' if:
      // c1 is char or ')' or '*' or '?' and c2 is char or '('
      const isC1Valid = c1 !== '(' && c1 !== '|';
      const isC2Valid = c2 !== ')' && c2 !== '*' && c2 !== '?' && c2 !== '|';

      if (isC1Valid && isC2Valid) {
        output += '.';
      }
    }
  }

  return output;
}

// Convert Infix Regex to Postfix using Shunting-Yard
export function infixToPostfix(regex: string): string {
  const formatted = insertConcatOperators(regex);
  const precedence: { [op: string]: number } = {
    '*': 3,
    '?': 3,
    '.': 2,
    '|': 1,
    '+': 1, // union if binary, or handled
  };

  let postfix = '';
  const stack: string[] = [];

  for (let i = 0; i < formatted.length; i++) {
    const c = formatted[i];

    if (c === '(') {
      stack.push(c);
    } else if (c === ')') {
      while (stack.length > 0 && stack[stack.length - 1] !== '(') {
        postfix += stack.pop();
      }
      stack.pop(); // discard '('
    } else if (precedence[c]) {
      while (
        stack.length > 0 &&
        stack[stack.length - 1] !== '(' &&
        precedence[stack[stack.length - 1]] >= precedence[c]
      ) {
        postfix += stack.pop();
      }
      stack.push(c);
    } else {
      postfix += c;
    }
  }

  while (stack.length > 0) {
    postfix += stack.pop();
  }

  return postfix;
}

// Thompson's Construction Algorithm
export function regexToENFA(regex: string): AutomatonDefinition {
  const clean = regex.trim();
  if (!clean) {
    // Empty machine
    return {
      id: `regex-enfa-${Date.now()}`,
      name: 'Empty NFA',
      type: 'ENFA',
      alphabet: [],
      states: [{ id: 'q0', label: 'q0', x: 200, y: 150, isStart: true, isFinal: true }],
      transitions: [],
      startStateId: 'q0',
      finalStateIds: ['q0'],
    };
  }

  const postfix = infixToPostfix(clean);
  const stack: NFAFragment[] = [];
  let stateIdCounter = 0;
  let edgeIdCounter = 0;

  const createState = (): string => `q${stateIdCounter++}`;
  const alphabetSet = new Set<string>();

  for (let i = 0; i < postfix.length; i++) {
    const token = postfix[i];

    if (token === '*') {
      // Kleene Star
      const frag = stack.pop();
      if (!frag) continue;

      const newStart = createState();
      const newEnd = createState();

      const newTransitions: TransitionEdge[] = [
        ...frag.transitions,
        // newStart -> frag.start (ε)
        { id: `e-${edgeIdCounter++}`, from: newStart, to: frag.start, symbols: ['ε'] },
        // newStart -> newEnd (ε) (bypass)
        { id: `e-${edgeIdCounter++}`, from: newStart, to: newEnd, symbols: ['ε'] },
        // frag.end -> frag.start (ε) (loopback)
        { id: `e-${edgeIdCounter++}`, from: frag.end, to: frag.start, symbols: ['ε'] },
        // frag.end -> newEnd (ε)
        { id: `e-${edgeIdCounter++}`, from: frag.end, to: newEnd, symbols: ['ε'] },
      ];

      const newStates: StateNode[] = [
        ...frag.states,
        { id: newStart, label: newStart, x: 0, y: 0 },
        { id: newEnd, label: newEnd, x: 0, y: 0 },
      ];

      stack.push({
        start: newStart,
        end: newEnd,
        states: newStates,
        transitions: newTransitions,
      });
    } else if (token === '|' || token === '+') {
      // Union
      const frag2 = stack.pop();
      const frag1 = stack.pop();
      if (!frag1 || !frag2) continue;

      const newStart = createState();
      const newEnd = createState();

      const newTransitions: TransitionEdge[] = [
        ...frag1.transitions,
        ...frag2.transitions,
        { id: `e-${edgeIdCounter++}`, from: newStart, to: frag1.start, symbols: ['ε'] },
        { id: `e-${edgeIdCounter++}`, from: newStart, to: frag2.start, symbols: ['ε'] },
        { id: `e-${edgeIdCounter++}`, from: frag1.end, to: newEnd, symbols: ['ε'] },
        { id: `e-${edgeIdCounter++}`, from: frag2.end, to: newEnd, symbols: ['ε'] },
      ];

      const newStates: StateNode[] = [
        ...frag1.states,
        ...frag2.states,
        { id: newStart, label: newStart, x: 0, y: 0 },
        { id: newEnd, label: newEnd, x: 0, y: 0 },
      ];

      stack.push({
        start: newStart,
        end: newEnd,
        states: newStates,
        transitions: newTransitions,
      });
    } else if (token === '.') {
      // Concatenation
      const frag2 = stack.pop();
      const frag1 = stack.pop();
      if (!frag1 || !frag2) continue;

      const bridgeTransition: TransitionEdge = {
        id: `e-${edgeIdCounter++}`,
        from: frag1.end,
        to: frag2.start,
        symbols: ['ε'],
      };

      stack.push({
        start: frag1.start,
        end: frag2.end,
        states: [...frag1.states, ...frag2.states],
        transitions: [...frag1.transitions, ...frag2.transitions, bridgeTransition],
      });
    } else {
      // Literal character or epsilon
      const sym = token === 'ε' || token === 'λ' ? 'ε' : token;
      if (sym !== 'ε') alphabetSet.add(sym);

      const s = createState();
      const e = createState();

      stack.push({
        start: s,
        end: e,
        states: [
          { id: s, label: s, x: 0, y: 0 },
          { id: e, label: e, x: 0, y: 0 },
        ],
        transitions: [{ id: `e-${edgeIdCounter++}`, from: s, to: e, symbols: [sym] }],
      });
    }
  }

  const finalFrag = stack.pop() || {
    start: 'q0',
    end: 'q0',
    states: [{ id: 'q0', label: 'q0', x: 200, y: 150 }],
    transitions: [],
  };

  // Configure start and final states
  const statesWithFlags = finalFrag.states.map(st => ({
    ...st,
    isStart: st.id === finalFrag.start,
    isFinal: st.id === finalFrag.end,
  }));

  const positionedStates = layoutNodes(statesWithFlags, 800, 420);

  return {
    id: `re-enfa-${Date.now()}`,
    name: `Regex [${clean}] to ε-NFA`,
    type: 'ENFA',
    alphabet: Array.from(alphabetSet).sort(),
    states: positionedStates,
    transitions: finalFrag.transitions,
    startStateId: finalFrag.start,
    finalStateIds: [finalFrag.end],
  };
}

// Convert user regex string to standard JS RegExp for quick evaluation
export function testRegexString(regex: string, input: string): boolean {
  try {
    let standard = regex
      .replace(/\+/g, '|')
      .replace(/ε|λ/g, '');
    const reg = new RegExp(`^(${standard})$`);
    return reg.test(input);
  } catch {
    return false;
  }
}
