import { TMDefinition, TMStep, TMTransition } from '../types/automata';

export interface TMSimulationResult {
  status: 'ACCEPTED' | 'REJECTED' | 'HALTED' | 'LOOP_DETECTED';
  reason: string;
  totalSteps: number;
  finalTape: string[];
  finalHeadIndex: number;
  finalStateId: string;
  steps: TMStep[];
}

export function simulateTuringMachine(
  tm: TMDefinition,
  input: string,
  maxSteps = 500
): TMSimulationResult {
  // Initialize tape with input string padded with blanks on left and right
  const blank = tm.blankSymbol || 'B';
  const leftPadding = 5;
  const rightPadding = 15;

  let tape: string[] = [
    ...Array(leftPadding).fill(blank),
    ...(input.length > 0 ? input.split('') : [blank]),
    ...Array(rightPadding).fill(blank),
  ];

  let head = leftPadding;
  let currentState = tm.startStateId;
  const steps: TMStep[] = [];

  const startStep: TMStep = {
    stepIndex: 0,
    stateId: currentState,
    headIndex: head,
    tape: [...tape],
    actionDescription: `Initialized at start state ${currentState}. Head positioned at symbol '${tape[head]}'.`,
  };
  steps.push(startStep);

  let stepCount = 0;

  while (stepCount < maxSteps) {
    // Check if accept or reject state reached
    if (currentState === tm.acceptStateId) {
      return {
        status: 'ACCEPTED',
        reason: `Reached designated ACCEPT state '${currentState}'. Computation succeeded!`,
        totalSteps: stepCount,
        finalTape: tape,
        finalHeadIndex: head,
        finalStateId: currentState,
        steps,
      };
    }

    if (tm.rejectStateId && currentState === tm.rejectStateId) {
      return {
        status: 'REJECTED',
        reason: `Entered designated REJECT state '${currentState}'.`,
        totalSteps: stepCount,
        finalTape: tape,
        finalHeadIndex: head,
        finalStateId: currentState,
        steps,
      };
    }

    const currentSym = tape[head] !== undefined ? tape[head] : blank;

    // Look for transition δ(currentState, currentSym)
    const trans = tm.transitions.find(
      t => t.from === currentState && t.readSymbol === currentSym
    );

    if (!trans) {
      // No transition defined: if current state is accept, accept; else reject
      const isAccept = currentState === tm.acceptStateId;
      return {
        status: isAccept ? 'ACCEPTED' : 'REJECTED',
        reason: isAccept
          ? `Halted in accept state ${currentState}.`
          : `No transition δ(${currentState}, '${currentSym}') defined. Machine halted and REJECTED.`,
        totalSteps: stepCount,
        finalTape: tape,
        finalHeadIndex: head,
        finalStateId: currentState,
        steps,
      };
    }

    stepCount++;
    // Write symbol
    tape[head] = trans.writeSymbol;

    // Move head
    if (trans.direction === 'L') {
      head--;
      if (head < 0) {
        // Expand tape left
        tape.unshift(blank);
        head = 0;
      }
    } else if (trans.direction === 'R') {
      head++;
      if (head >= tape.length) {
        // Expand tape right
        tape.push(blank);
      }
    }

    // Update state
    currentState = trans.to;

    steps.push({
      stepIndex: stepCount,
      stateId: currentState,
      headIndex: head,
      tape: [...tape],
      actionDescription: `Read '${currentSym}', wrote '${trans.writeSymbol}', moved ${trans.direction}, next state: ${currentState}.`,
      isAccept: currentState === tm.acceptStateId,
      isReject: currentState === tm.rejectStateId,
    });
  }

  return {
    status: 'LOOP_DETECTED',
    reason: `Simulation limit of ${maxSteps} steps reached. Possible infinite loop.`,
    totalSteps: stepCount,
    finalTape: tape,
    finalHeadIndex: head,
    finalStateId: currentState,
    steps,
  };
}

// Sample Turing Machines
export const sampleTuringMachines: TMDefinition[] = [
  {
    id: 'tm-binary-inc',
    name: 'TM: Binary Incrementer (+1)',
    description: 'Increments an arbitrary binary integer by 1. Traverses to the right end, flips trailing 1s to 0s, changes first 0 to 1, and halts.',
    states: [
      { id: 'q_find_end', label: 'q_find_end', x: 150, y: 180, isStart: true, description: 'Move head to end of input' },
      { id: 'q_add_carry', label: 'q_add_carry', x: 380, y: 180, description: 'Add 1 and propagate carry' },
      { id: 'q_accept', label: 'q_accept', x: 620, y: 180, isFinal: true, description: 'Halt and accept' },
    ],
    inputAlphabet: ['0', '1'],
    tapeAlphabet: ['0', '1', 'B'],
    blankSymbol: 'B',
    startStateId: 'q_find_end',
    acceptStateId: 'q_accept',
    transitions: [
      // q_find_end: move right over 0s and 1s until blank
      { id: 't1', from: 'q_find_end', to: 'q_find_end', readSymbol: '0', writeSymbol: '0', direction: 'R' },
      { id: 't2', from: 'q_find_end', to: 'q_find_end', readSymbol: '1', writeSymbol: '1', direction: 'R' },
      { id: 't3', from: 'q_find_end', to: 'q_add_carry', readSymbol: 'B', writeSymbol: 'B', direction: 'L' },

      // q_add_carry: if 1, change to 0 and move left (carry); if 0, change to 1 and accept; if blank, write 1 and accept
      { id: 't4', from: 'q_add_carry', to: 'q_add_carry', readSymbol: '1', writeSymbol: '0', direction: 'L' },
      { id: 't5', from: 'q_add_carry', to: 'q_accept', readSymbol: '0', writeSymbol: '1', direction: 'S' },
      { id: 't6', from: 'q_add_carry', to: 'q_accept', readSymbol: 'B', writeSymbol: '1', direction: 'S' },
    ],
  },
  {
    id: 'tm-0n1n',
    name: 'TM: Language {0^n 1^n | n ≥ 1}',
    description: 'Crosses off 0 with X, traverses right to cross off matching 1 with Y, and repeats. Halts in accept state when all symbols match.',
    states: [
      { id: 'q0', label: 'q0', x: 120, y: 180, isStart: true, description: 'Mark 0 as X' },
      { id: 'q1', label: 'q1', x: 280, y: 180, description: 'Look for matching 1' },
      { id: 'q2', label: 'q2', x: 440, y: 180, description: 'Return left to next 0' },
      { id: 'q3', label: 'q3', x: 600, y: 180, description: 'Verify all symbols matched' },
      { id: 'q_acc', label: 'q_acc', x: 750, y: 180, isFinal: true, description: 'Accept' },
    ],
    inputAlphabet: ['0', '1'],
    tapeAlphabet: ['0', '1', 'X', 'Y', 'B'],
    blankSymbol: 'B',
    startStateId: 'q0',
    acceptStateId: 'q_acc',
    transitions: [
      // q0: replace 0 with X -> move to q1; if Y, move to q3
      { id: 'tm1', from: 'q0', to: 'q1', readSymbol: '0', writeSymbol: 'X', direction: 'R' },
      { id: 'tm2', from: 'q0', to: 'q3', readSymbol: 'Y', writeSymbol: 'Y', direction: 'R' },

      // q1: move right past 0s and Ys to find 1
      { id: 'tm3', from: 'q1', to: 'q1', readSymbol: '0', writeSymbol: '0', direction: 'R' },
      { id: 'tm4', from: 'q1', to: 'q1', readSymbol: 'Y', writeSymbol: 'Y', direction: 'R' },
      { id: 'tm5', from: 'q1', to: 'q2', readSymbol: '1', writeSymbol: 'Y', direction: 'L' },

      // q2: move left past Ys and 0s back to X
      { id: 'tm6', from: 'q2', to: 'q2', readSymbol: '0', writeSymbol: '0', direction: 'L' },
      { id: 'tm7', from: 'q2', to: 'q2', readSymbol: 'Y', writeSymbol: 'Y', direction: 'L' },
      { id: 'tm8', from: 'q2', to: 'q0', readSymbol: 'X', writeSymbol: 'X', direction: 'R' },

      // q3: verify rest of tape is all Ys until blank
      { id: 'tm9', from: 'q3', to: 'q3', readSymbol: 'Y', writeSymbol: 'Y', direction: 'R' },
      { id: 'tm10', from: 'q3', to: 'q_acc', readSymbol: 'B', writeSymbol: 'B', direction: 'S' },
    ],
  },
];
