import { TMDefinition, TMStep, TMTransition } from '../types/automata';

export interface TMSimulationResult {
  status: 'ACCEPTED' | 'REJECTED' | 'LOOP_DETECTED' | 'INVALID_INPUT' | 'INVALID_MACHINE';
  reason: string;
  totalSteps: number;
  finalTape: string[];
  finalHeadIndex: number;
  finalStateId: string;
  steps: TMStep[];
}

export interface TMValidationResult {
  errors: string[];
  duplicateTransitions: Array<{ stateId: string; symbol: string }>;
}

export function validateTuringMachine(tm: TMDefinition): TMValidationResult {
  const errors: string[] = [];
  const stateIds = new Set(tm.states.map(state => state.id));
  const duplicateTransitions: Array<{ stateId: string; symbol: string }> = [];
  const seenTransitions = new Set<string>();

  if (!stateIds.has(tm.startStateId)) {
    errors.push(`Start state '${tm.startStateId}' does not exist.`);
  }
  if (!tm.acceptStateId || !stateIds.has(tm.acceptStateId)) {
    errors.push('At least one accepting state must exist and be selected.');
  }
  if (tm.rejectStateId && !stateIds.has(tm.rejectStateId)) {
    errors.push(`Reject state '${tm.rejectStateId}' does not exist.`);
  }
  if (!tm.blankSymbol || tm.inputAlphabet.includes(tm.blankSymbol)) {
    errors.push('The blank symbol must be defined and must not be in the input alphabet.');
  }
  if (!tm.tapeAlphabet.includes(tm.blankSymbol)) {
    errors.push(`Blank symbol '${tm.blankSymbol}' must be included in the tape alphabet.`);
  }
  for (const symbol of tm.inputAlphabet) {
    if (!tm.tapeAlphabet.includes(symbol)) {
      errors.push(`Input symbol '${symbol}' is not in the tape alphabet.`);
    }
  }

  for (const transition of tm.transitions) {
    const key = JSON.stringify([transition.from, transition.readSymbol]);
    if (seenTransitions.has(key)) {
      duplicateTransitions.push({ stateId: transition.from, symbol: transition.readSymbol });
    }
    seenTransitions.add(key);

    if (!stateIds.has(transition.from)) {
      errors.push(`Transition source state '${transition.from}' does not exist.`);
    }
    if (!stateIds.has(transition.to)) {
      errors.push(`Transition destination state '${transition.to}' does not exist.`);
    }
    if (!['L', 'R', 'S'].includes(transition.direction)) {
      errors.push(`Transition move '${transition.direction}' is invalid; use L, R, or S.`);
    }
    if (!tm.tapeAlphabet.includes(transition.readSymbol)) {
      errors.push(`Read symbol '${transition.readSymbol}' is not in the tape alphabet.`);
    }
    if (!tm.tapeAlphabet.includes(transition.writeSymbol)) {
      errors.push(`Write symbol '${transition.writeSymbol}' is not in the tape alphabet.`);
    }
  }

  for (const duplicate of duplicateTransitions) {
    errors.push(`Duplicate transition for (${duplicate.stateId}, ${duplicate.symbol}); TM must be deterministic.`);
  }

  return { errors, duplicateTransitions };
}

function makeResult(
  status: TMSimulationResult['status'],
  reason: string,
  totalSteps: number,
  tape: string[],
  head: number,
  stateId: string,
  steps: TMStep[]
): TMSimulationResult {
  return {
    status,
    reason,
    totalSteps,
    finalTape: tape,
    finalHeadIndex: head,
    finalStateId: stateId,
    steps,
  };
}

export function simulateTuringMachine(
  tm: TMDefinition,
  input: string,
  maxSteps = 10_000
): TMSimulationResult {
  const blank = tm.blankSymbol || '⊔';
  const tape = input.length > 0 ? [...input] : [blank];
  let head = 0;
  let currentState = tm.startStateId;
  const steps: TMStep[] = [];
  const pushStep = (
    stepIndex: number,
    actionDescription: string,
    details?: Pick<TMStep, 'readSymbol' | 'writtenSymbol' | 'direction'>
  ) => {
    steps.push({
      stepIndex,
      stateId: currentState,
      headIndex: head,
      tape: [...tape],
      actionDescription,
      ...details,
      isAccept: currentState === tm.acceptStateId,
      isReject: currentState === tm.rejectStateId,
    });
  };
  const invalidSymbol = [...input].find(symbol =>
    symbol === blank || !tm.inputAlphabet.includes(symbol)
  );

  pushStep(
    0,
    `Initialized at start state ${currentState}; head at cell 0 reading '${tape[0]}'.`
  );

  if (invalidSymbol !== undefined) {
    return makeResult(
      'INVALID_INPUT',
      `Symbol '${invalidSymbol}' is not in Σ = {${tm.inputAlphabet.join(', ')}}.`,
      0,
      tape,
      head,
      currentState,
      steps
    );
  }

  const validation = validateTuringMachine(tm);
  if (validation.errors.length > 0) {
    return makeResult(
      'INVALID_MACHINE',
      validation.errors.join(' '),
      0,
      tape,
      head,
      currentState,
      steps
    );
  }

  if (!Number.isInteger(maxSteps) || maxSteps < 0) {
    return makeResult(
      'INVALID_MACHINE',
      'The step limit must be a non-negative integer.',
      0,
      tape,
      head,
      currentState,
      steps
    );
  }

  let stepCount = 0;
  while (true) {
    if (currentState === tm.acceptStateId) {
      return makeResult(
        'ACCEPTED',
        'ACCEPTED (reached accept state)',
        stepCount,
        tape,
        head,
        currentState,
        steps
      );
    }
    if (currentState === tm.rejectStateId) {
      return makeResult(
        'REJECTED',
        'REJECTED (reached reject state)',
        stepCount,
        tape,
        head,
        currentState,
        steps
      );
    }
    if (stepCount >= maxSteps) {
      return makeResult(
        'LOOP_DETECTED',
        `No halt within ${maxSteps} steps (possibly looping)`,
        stepCount,
        tape,
        head,
        currentState,
        steps
      );
    }

    const readSymbol = tape[head] ?? blank;
    const transition: TMTransition | undefined = tm.transitions.find(
      candidate => candidate.from === currentState && candidate.readSymbol === readSymbol
    );
    if (!transition) {
      return makeResult(
        'REJECTED',
        `REJECTED (no transition for (${currentState}, ${readSymbol}))`,
        stepCount,
        tape,
        head,
        currentState,
        steps
      );
    }

    tape[head] = transition.writeSymbol;
    if (transition.direction === 'L') {
      head--;
      if (head < 0) {
        tape.unshift(blank);
        head = 0;
      }
    } else if (transition.direction === 'R') {
      head++;
      if (head >= tape.length) tape.push(blank);
    }
    currentState = transition.to;
    stepCount++;
    pushStep(
      stepCount,
      `Step ${stepCount}: state ${currentState}; head at cell ${head}; read '${readSymbol}', wrote '${transition.writeSymbol}', moved ${transition.direction}.`,
      {
        readSymbol,
        writtenSymbol: transition.writeSymbol,
        direction: transition.direction,
      }
    );
  }
}

function makeStates(
  ids: string[],
  finalStateId: string,
  descriptions: string[] = []
): TMDefinition['states'] {
  return ids.map((id, index) => ({
    id,
    label: id,
    x: 100 + index * 150,
    y: 180,
    isStart: index === 0,
    isFinal: id === finalStateId,
    description: descriptions[index],
  }));
}

function identifyTransitions(transitions: Omit<TMTransition, 'id'>[]): TMTransition[] {
  return transitions.map((transition, index) => ({
    ...transition,
    id: `transition-${index + 1}`,
  }));
}

export const sampleTuringMachines: TMDefinition[] = [
  {
    id: 'tm-binary-inc',
    name: 'TM: Binary Incrementer (+1)',
    description: 'Adds one to the binary number on the tape and halts in the accept state.',
    states: makeStates(
      ['q_start', 'q_end', 'q_carry', 'q_accept'],
      'q_accept',
      ['Handle empty input', 'Find the right end', 'Propagate the carry', 'Accept']
    ),
    inputAlphabet: ['0', '1'],
    tapeAlphabet: ['0', '1', '_'],
    blankSymbol: '_',
    startStateId: 'q_start',
    acceptStateId: 'q_accept',
    transitions: [
      { id: 'inc0', from: 'q_start', to: 'q_end', readSymbol: '0', writeSymbol: '0', direction: 'R' },
      { id: 'inc1', from: 'q_start', to: 'q_end', readSymbol: '1', writeSymbol: '1', direction: 'R' },
      { id: 'incEmpty', from: 'q_start', to: 'q_accept', readSymbol: '_', writeSymbol: '1', direction: 'S' },
      { id: 'inc2', from: 'q_end', to: 'q_end', readSymbol: '0', writeSymbol: '0', direction: 'R' },
      { id: 'inc3', from: 'q_end', to: 'q_end', readSymbol: '1', writeSymbol: '1', direction: 'R' },
      { id: 'inc4', from: 'q_end', to: 'q_carry', readSymbol: '_', writeSymbol: '_', direction: 'L' },
      { id: 'inc5', from: 'q_carry', to: 'q_carry', readSymbol: '1', writeSymbol: '0', direction: 'L' },
      { id: 'inc6', from: 'q_carry', to: 'q_accept', readSymbol: '0', writeSymbol: '1', direction: 'S' },
      { id: 'inc7', from: 'q_carry', to: 'q_accept', readSymbol: '_', writeSymbol: '1', direction: 'S' },
    ],
  },
  {
    id: 'tm-0n1n',
    name: 'TM: Language {0^n 1^n | n ≥ 1}',
    description: 'Marks matching 0 and 1 pairs, then verifies every 1 was matched.',
    states: makeStates(['q0', 'q1', 'q2', 'q3', 'q_acc'], 'q_acc'),
    inputAlphabet: ['0', '1'],
    tapeAlphabet: ['0', '1', 'X', 'Y', '_'],
    blankSymbol: '_',
    startStateId: 'q0',
    acceptStateId: 'q_acc',
    transitions: [
      { id: 'anbn1', from: 'q0', to: 'q1', readSymbol: '0', writeSymbol: 'X', direction: 'R' },
      { id: 'anbn2', from: 'q0', to: 'q3', readSymbol: 'Y', writeSymbol: 'Y', direction: 'R' },
      { id: 'anbn3', from: 'q1', to: 'q1', readSymbol: '0', writeSymbol: '0', direction: 'R' },
      { id: 'anbn4', from: 'q1', to: 'q1', readSymbol: 'Y', writeSymbol: 'Y', direction: 'R' },
      { id: 'anbn5', from: 'q1', to: 'q2', readSymbol: '1', writeSymbol: 'Y', direction: 'L' },
      { id: 'anbn6', from: 'q2', to: 'q2', readSymbol: '0', writeSymbol: '0', direction: 'L' },
      { id: 'anbn7', from: 'q2', to: 'q2', readSymbol: 'Y', writeSymbol: 'Y', direction: 'L' },
      { id: 'anbn8', from: 'q2', to: 'q0', readSymbol: 'X', writeSymbol: 'X', direction: 'R' },
      { id: 'anbn9', from: 'q3', to: 'q3', readSymbol: 'Y', writeSymbol: 'Y', direction: 'R' },
      { id: 'anbn10', from: 'q3', to: 'q_acc', readSymbol: '_', writeSymbol: '_', direction: 'S' },
    ],
  },
  {
    id: 'tm-anbncn',
    name: 'TM: Language {a^n b^n c^n | n ≥ 1}',
    description: 'Marks a matching a, b, c triple and verifies all marked symbols are balanced.',
    states: makeStates(['q0', 'q1', 'q2', 'q3', 'q4', 'q_acc'], 'q_acc'),
    inputAlphabet: ['a', 'b', 'c'],
    tapeAlphabet: ['a', 'b', 'c', 'X', 'Y', 'Z', '_'],
    blankSymbol: '_',
    startStateId: 'q0',
    acceptStateId: 'q_acc',
    transitions: [
      { id: 'abc1', from: 'q0', to: 'q1', readSymbol: 'a', writeSymbol: 'X', direction: 'R' },
      { id: 'abc2', from: 'q0', to: 'q4', readSymbol: 'Y', writeSymbol: 'Y', direction: 'R' },
      { id: 'abc3', from: 'q1', to: 'q1', readSymbol: 'a', writeSymbol: 'a', direction: 'R' },
      { id: 'abc4', from: 'q1', to: 'q1', readSymbol: 'Y', writeSymbol: 'Y', direction: 'R' },
      { id: 'abc5', from: 'q1', to: 'q2', readSymbol: 'b', writeSymbol: 'Y', direction: 'R' },
      { id: 'abc6', from: 'q2', to: 'q2', readSymbol: 'b', writeSymbol: 'b', direction: 'R' },
      { id: 'abc7', from: 'q2', to: 'q2', readSymbol: 'Z', writeSymbol: 'Z', direction: 'R' },
      { id: 'abc8', from: 'q2', to: 'q3', readSymbol: 'c', writeSymbol: 'Z', direction: 'L' },
      { id: 'abc9', from: 'q3', to: 'q3', readSymbol: 'Z', writeSymbol: 'Z', direction: 'L' },
      { id: 'abc10', from: 'q3', to: 'q3', readSymbol: 'b', writeSymbol: 'b', direction: 'L' },
      { id: 'abc11', from: 'q3', to: 'q3', readSymbol: 'Y', writeSymbol: 'Y', direction: 'L' },
      { id: 'abc12', from: 'q3', to: 'q3', readSymbol: 'a', writeSymbol: 'a', direction: 'L' },
      { id: 'abc13', from: 'q3', to: 'q0', readSymbol: 'X', writeSymbol: 'X', direction: 'R' },
      { id: 'abc14', from: 'q4', to: 'q4', readSymbol: 'Y', writeSymbol: 'Y', direction: 'R' },
      { id: 'abc15', from: 'q4', to: 'q4', readSymbol: 'Z', writeSymbol: 'Z', direction: 'R' },
      { id: 'abc16', from: 'q4', to: 'q_acc', readSymbol: '_', writeSymbol: '_', direction: 'S' },
    ],
  },
  {
    id: 'tm-palindrome',
    name: 'TM: Palindromes over {a, b}',
    description: 'Marks matching outer symbols until the remaining center is empty or a single symbol.',
    states: makeStates(['q_scan', 'q_seek_a', 'q_seek_b', 'q_check_a', 'q_check_b', 'q_return', 'q_acc'], 'q_acc'),
    inputAlphabet: ['a', 'b'],
    tapeAlphabet: ['a', 'b', 'X', '_'],
    blankSymbol: '_',
    startStateId: 'q_scan',
    acceptStateId: 'q_acc',
    transitions: identifyTransitions([
      { from: 'q_scan', to: 'q_scan', readSymbol: 'X', writeSymbol: 'X', direction: 'R' },
      { from: 'q_scan', to: 'q_seek_a', readSymbol: 'a', writeSymbol: 'X', direction: 'R' },
      { from: 'q_scan', to: 'q_seek_b', readSymbol: 'b', writeSymbol: 'X', direction: 'R' },
      { from: 'q_scan', to: 'q_acc', readSymbol: '_', writeSymbol: '_', direction: 'S' },
      { from: 'q_seek_a', to: 'q_seek_a', readSymbol: 'a', writeSymbol: 'a', direction: 'R' },
      { from: 'q_seek_a', to: 'q_seek_a', readSymbol: 'b', writeSymbol: 'b', direction: 'R' },
      { from: 'q_seek_a', to: 'q_seek_a', readSymbol: 'X', writeSymbol: 'X', direction: 'R' },
      { from: 'q_seek_a', to: 'q_check_a', readSymbol: '_', writeSymbol: '_', direction: 'L' },
      { from: 'q_seek_b', to: 'q_seek_b', readSymbol: 'a', writeSymbol: 'a', direction: 'R' },
      { from: 'q_seek_b', to: 'q_seek_b', readSymbol: 'b', writeSymbol: 'b', direction: 'R' },
      { from: 'q_seek_b', to: 'q_seek_b', readSymbol: 'X', writeSymbol: 'X', direction: 'R' },
      { from: 'q_seek_b', to: 'q_check_b', readSymbol: '_', writeSymbol: '_', direction: 'L' },
      { from: 'q_check_a', to: 'q_check_a', readSymbol: 'X', writeSymbol: 'X', direction: 'L' },
      { from: 'q_check_a', to: 'q_return', readSymbol: 'a', writeSymbol: 'X', direction: 'L' },
      { from: 'q_check_a', to: 'q_acc', readSymbol: '_', writeSymbol: '_', direction: 'S' },
      { from: 'q_check_b', to: 'q_check_b', readSymbol: 'X', writeSymbol: 'X', direction: 'L' },
      { from: 'q_check_b', to: 'q_return', readSymbol: 'b', writeSymbol: 'X', direction: 'L' },
      { from: 'q_check_b', to: 'q_acc', readSymbol: '_', writeSymbol: '_', direction: 'S' },
      { from: 'q_return', to: 'q_return', readSymbol: 'a', writeSymbol: 'a', direction: 'L' },
      { from: 'q_return', to: 'q_return', readSymbol: 'b', writeSymbol: 'b', direction: 'L' },
      { from: 'q_return', to: 'q_return', readSymbol: 'X', writeSymbol: 'X', direction: 'L' },
      { from: 'q_return', to: 'q_scan', readSymbol: '_', writeSymbol: '_', direction: 'R' },
    ]),
  },
  {
    id: 'tm-ww',
    name: 'TM: Language {w#w}',
    description: 'Marks the left half and checks each corresponding symbol in the right half.',
    states: makeStates(['q_scan', 'q_seek_a', 'q_seek_b', 'q_match_a', 'q_match_b', 'q_rewind', 'q_verify', 'q_acc'], 'q_acc'),
    inputAlphabet: ['a', 'b', '#'],
    tapeAlphabet: ['a', 'b', '#', 'X', '_'],
    blankSymbol: '_',
    startStateId: 'q_scan',
    acceptStateId: 'q_acc',
    transitions: identifyTransitions([
      { from: 'q_scan', to: 'q_scan', readSymbol: 'X', writeSymbol: 'X', direction: 'R' },
      { from: 'q_scan', to: 'q_seek_a', readSymbol: 'a', writeSymbol: 'X', direction: 'R' },
      { from: 'q_scan', to: 'q_seek_b', readSymbol: 'b', writeSymbol: 'X', direction: 'R' },
      { from: 'q_scan', to: 'q_verify', readSymbol: '#', writeSymbol: '#', direction: 'R' },
      { from: 'q_seek_a', to: 'q_seek_a', readSymbol: 'a', writeSymbol: 'a', direction: 'R' },
      { from: 'q_seek_a', to: 'q_seek_a', readSymbol: 'b', writeSymbol: 'b', direction: 'R' },
      { from: 'q_seek_a', to: 'q_seek_a', readSymbol: 'X', writeSymbol: 'X', direction: 'R' },
      { from: 'q_seek_a', to: 'q_match_a', readSymbol: '#', writeSymbol: '#', direction: 'R' },
      { from: 'q_seek_b', to: 'q_seek_b', readSymbol: 'a', writeSymbol: 'a', direction: 'R' },
      { from: 'q_seek_b', to: 'q_seek_b', readSymbol: 'b', writeSymbol: 'b', direction: 'R' },
      { from: 'q_seek_b', to: 'q_seek_b', readSymbol: 'X', writeSymbol: 'X', direction: 'R' },
      { from: 'q_seek_b', to: 'q_match_b', readSymbol: '#', writeSymbol: '#', direction: 'R' },
      { from: 'q_match_a', to: 'q_match_a', readSymbol: 'X', writeSymbol: 'X', direction: 'R' },
      { from: 'q_match_a', to: 'q_rewind', readSymbol: 'a', writeSymbol: 'X', direction: 'L' },
      { from: 'q_match_b', to: 'q_match_b', readSymbol: 'X', writeSymbol: 'X', direction: 'R' },
      { from: 'q_match_b', to: 'q_rewind', readSymbol: 'b', writeSymbol: 'X', direction: 'L' },
      { from: 'q_rewind', to: 'q_rewind', readSymbol: 'a', writeSymbol: 'a', direction: 'L' },
      { from: 'q_rewind', to: 'q_rewind', readSymbol: 'b', writeSymbol: 'b', direction: 'L' },
      { from: 'q_rewind', to: 'q_rewind', readSymbol: '#', writeSymbol: '#', direction: 'L' },
      { from: 'q_rewind', to: 'q_rewind', readSymbol: 'X', writeSymbol: 'X', direction: 'L' },
      { from: 'q_rewind', to: 'q_scan', readSymbol: '_', writeSymbol: '_', direction: 'R' },
      { from: 'q_verify', to: 'q_verify', readSymbol: 'X', writeSymbol: 'X', direction: 'R' },
      { from: 'q_verify', to: 'q_acc', readSymbol: '_', writeSymbol: '_', direction: 'S' },
    ]),
  },
  {
    id: 'tm-even-ones',
    name: 'TM: Even number of 1s',
    description: 'Tracks the parity of 1 symbols and accepts at the right-end blank in the even state.',
    states: makeStates(['q_even', 'q_odd', 'q_acc'], 'q_acc'),
    inputAlphabet: ['0', '1'],
    tapeAlphabet: ['0', '1', '_'],
    blankSymbol: '_',
    startStateId: 'q_even',
    acceptStateId: 'q_acc',
    transitions: identifyTransitions([
      { from: 'q_even', to: 'q_even', readSymbol: '0', writeSymbol: '0', direction: 'R' },
      { from: 'q_even', to: 'q_odd', readSymbol: '1', writeSymbol: '1', direction: 'R' },
      { from: 'q_even', to: 'q_acc', readSymbol: '_', writeSymbol: '_', direction: 'S' },
      { from: 'q_odd', to: 'q_odd', readSymbol: '0', writeSymbol: '0', direction: 'R' },
      { from: 'q_odd', to: 'q_even', readSymbol: '1', writeSymbol: '1', direction: 'R' },
    ]),
  },
];
