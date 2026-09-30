import { PDADefinition, PDAStep } from '../types/automata';
import { isEpsilon } from './dfaSimulation';

export interface PDASimulationResult {
  accepted: boolean;
  reason: string;
  steps: PDAStep[];
  finalStateId: string;
  finalStack: string[];
}

export function simulatePDA(pda: PDADefinition, input: string): PDASimulationResult {
  const steps: PDAStep[] = [];
  const maxSteps = 250;

  let currentState = pda.startStateId;
  let remainingInput = input;
  let stack = [pda.startStackSymbol];

  steps.push({
    stepIndex: 0,
    stateId: currentState,
    remainingInput,
    stack: [...stack],
    explanation: `PDA initialized at state ${currentState} with start stack symbol [${pda.startStackSymbol}].`,
  });

  let stepCount = 0;

  while (stepCount < maxSteps) {
    stepCount++;
    const stackTop = stack.length > 0 ? stack[stack.length - 1] : 'ε';
    const nextChar = remainingInput.length > 0 ? remainingInput[0] : 'ε';

    // 1. Try transition with next input character
    let candidate = pda.transitions.find(
      t =>
        t.from === currentState &&
        t.inputSymbol === nextChar &&
        (isEpsilon(t.popSymbol) || t.popSymbol === stackTop)
    );

    let consumedChar = false;

    // 2. If no transition on char, try ε-transition
    if (!candidate) {
      candidate = pda.transitions.find(
        t =>
          t.from === currentState &&
          isEpsilon(t.inputSymbol) &&
          (isEpsilon(t.popSymbol) || t.popSymbol === stackTop)
      );
    } else {
      consumedChar = true;
    }

    if (!candidate) {
      // No transition possible - check if current configuration accepts!
      break;
    }

    // Apply transition
    currentState = candidate.to;
    if (consumedChar) {
      remainingInput = remainingInput.slice(1);
    }

    // Stack mutation
    if (!isEpsilon(candidate.popSymbol) && stack.length > 0) {
      stack.pop();
    }

    // Push symbols (symbols pushed in reverse order if string, or as list)
    if (candidate.pushSymbols.length > 0 && !candidate.pushSymbols.some(isEpsilon)) {
      for (const sym of candidate.pushSymbols) {
        stack.push(sym);
      }
    }

    const actionDesc = `Read '${consumedChar ? nextChar : 'ε'}', popped '${
      candidate.popSymbol
    }', pushed [${candidate.pushSymbols.join(', ')}] -> State ${currentState}.`;

    steps.push({
      stepIndex: stepCount,
      stateId: currentState,
      remainingInput,
      stack: [...stack],
      appliedTransition: candidate,
      explanation: actionDesc,
    });

    // If input is completely consumed and in final state, we can halt and accept
    if (remainingInput.length === 0 && pda.finalStateIds.includes(currentState)) {
      break;
    }
  }

  // Acceptance check
  const inputEmpty = remainingInput.length === 0;
  const isFinalState = pda.finalStateIds.includes(currentState);
  const isStackEmpty = stack.length === 0 || (stack.length === 1 && stack[0] === pda.startStackSymbol);

  let accepted = false;
  let reason = '';

  if (pda.acceptMode === 'FINAL_STATE') {
    accepted = inputEmpty && isFinalState;
    reason = accepted
      ? `Input fully consumed and PDA halted in accepting final state ${currentState}.`
      : !inputEmpty
      ? `Rejected: Input not fully consumed (remaining: "${remainingInput}").`
      : `Rejected: PDA halted in non-accepting state ${currentState}.`;
  } else if (pda.acceptMode === 'EMPTY_STACK') {
    accepted = inputEmpty && stack.length === 0;
    reason = accepted
      ? 'Input fully consumed and stack is empty. ACCEPTED by empty stack.'
      : 'Rejected: Stack was not empty after consuming input.';
  } else {
    accepted = inputEmpty && (isFinalState || stack.length === 0);
    reason = accepted
      ? 'String accepted by final state / empty stack condition.'
      : 'String rejected: condition not met.';
  }

  return {
    accepted,
    reason,
    steps,
    finalStateId: currentState,
    finalStack: stack,
  };
}

// Predefined PDAs
export const samplePDAs: PDADefinition[] = [
  {
    id: 'pda-0n1n',
    name: 'PDA: {0^n 1^n | n ≥ 1}',
    description: 'Pushes 0 onto stack for every 0; pops 0 for every 1. Reaches final state when stack returns to Z0.',
    states: [
      { id: 'q0', label: 'q0', x: 150, y: 180, isStart: true, description: 'Push 0s' },
      { id: 'q1', label: 'q1', x: 350, y: 180, description: 'Pop 0s on 1s' },
      { id: 'q2', label: 'q2', x: 550, y: 180, isFinal: true, description: 'Accept' },
    ],
    inputAlphabet: ['0', '1'],
    stackAlphabet: ['0', 'Z0'],
    startStateId: 'q0',
    startStackSymbol: 'Z0',
    finalStateIds: ['q2'],
    acceptMode: 'FINAL_STATE',
    transitions: [
      // q0 read 0 with Z0 -> push 0, stay in q0
      { id: 't1', from: 'q0', to: 'q0', inputSymbol: '0', popSymbol: 'Z0', pushSymbols: ['0', 'Z0'] },
      // q0 read 0 with 0 on top -> push 0, stay in q0
      { id: 't2', from: 'q0', to: 'q0', inputSymbol: '0', popSymbol: '0', pushSymbols: ['0', '0'] },
      // q0 read 1 with 0 on top -> pop 0, move to q1
      { id: 't3', from: 'q0', to: 'q1', inputSymbol: '1', popSymbol: '0', pushSymbols: ['ε'] },
      // q1 read 1 with 0 on top -> pop 0, stay in q1
      { id: 't4', from: 'q1', to: 'q1', inputSymbol: '1', popSymbol: '0', pushSymbols: ['ε'] },
      // q1 on ε with Z0 -> move to q2 (accept)
      { id: 't5', from: 'q1', to: 'q2', inputSymbol: 'ε', popSymbol: 'Z0', pushSymbols: ['Z0'] },
    ],
  },
  {
    id: 'pda-balanced-parens',
    name: 'PDA: Balanced Parentheses ()',
    description: 'Pushes ( onto stack for each (, pops ( for each ). Reaches accepting state when stack is empty of parens.',
    states: [
      { id: 'q0', label: 'q0', x: 200, y: 180, isStart: true, isFinal: true, description: 'Process parens' },
    ],
    inputAlphabet: ['(', ')'],
    stackAlphabet: ['(', 'Z0'],
    startStateId: 'q0',
    startStackSymbol: 'Z0',
    finalStateIds: ['q0'],
    acceptMode: 'FINAL_STATE',
    transitions: [
      { id: 'bp1', from: 'q0', to: 'q0', inputSymbol: '(', popSymbol: 'Z0', pushSymbols: ['(', 'Z0'] },
      { id: 'bp2', from: 'q0', to: 'q0', inputSymbol: '(', popSymbol: '(', pushSymbols: ['(', '('] },
      { id: 'bp3', from: 'q0', to: 'q0', inputSymbol: ')', popSymbol: '(', pushSymbols: ['ε'] },
    ],
  },
];
