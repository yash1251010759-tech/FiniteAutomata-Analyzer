import { PDADefinition, PDAStep, PDATransition } from '../types/automata';
import { isEpsilon } from './dfaSimulation';

export interface PDASimulationResult {
  accepted: boolean;
  reason: string;
  steps: PDAStep[];
  finalStateId: string;
  finalStack: string[];
}

interface PDAConfiguration {
  stateId: string;
  inputIndex: number;
  stack: string[];
  previous?: PDAConfiguration;
  step: PDAStep;
}

const MAX_STEPS = 1000;
const MAX_CONFIGURATIONS = 10000;

function getRemainingInput(inputSymbols: string[], inputIndex: number): string {
  return inputSymbols.slice(inputIndex).join('');
}

function configurationKey(configuration: PDAConfiguration): string {
  return JSON.stringify([
    configuration.stateId,
    configuration.inputIndex,
    configuration.stack,
  ]);
}

function getConfigurationSteps(configuration: PDAConfiguration): PDAStep[] {
  const steps: PDAStep[] = [];
  let current: PDAConfiguration | undefined = configuration;

  while (current) {
    steps.push(current.step);
    current = current.previous;
  }

  return steps.reverse();
}

function canApplyTransition(
  transition: PDATransition,
  stateId: string,
  nextInputSymbol: string | undefined,
  stackTop: string | undefined
): boolean {
  if (transition.from !== stateId) return false;
  if (!isEpsilon(transition.inputSymbol) && transition.inputSymbol !== nextInputSymbol) {
    return false;
  }
  return isEpsilon(transition.popSymbol) || transition.popSymbol === stackTop;
}

function isAcceptingConfiguration(
  pda: PDADefinition,
  configuration: PDAConfiguration,
  inputLength: number
): boolean {
  const hasConsumedInput = configuration.inputIndex === inputLength;
  const isFinalState = pda.finalStateIds.includes(configuration.stateId);
  const isStackEmpty = configuration.stack.length === 0;

  if (!hasConsumedInput) return false;
  if (pda.acceptMode === 'FINAL_STATE') return isFinalState;
  if (pda.acceptMode === 'EMPTY_STACK') return isStackEmpty;
  return isFinalState && isStackEmpty;
}

export function simulatePDA(pda: PDADefinition, input: string): PDASimulationResult {
  const inputSymbols = [...input];
  const invalidSymbol = inputSymbols.find(symbol => !pda.inputAlphabet.includes(symbol));
  const initialConfiguration: PDAConfiguration = {
    stateId: pda.startStateId,
    inputIndex: 0,
    stack: [pda.startStackSymbol],
    step: {
      stepIndex: 0,
      stateId: pda.startStateId,
      remainingInput: input,
      stack: [pda.startStackSymbol],
      explanation: `PDA initialized at state ${pda.startStateId} with start stack symbol [${pda.startStackSymbol}].`,
    },
  };

  if (invalidSymbol !== undefined) {
    return {
      accepted: false,
      reason: `Warning: Symbol '${invalidSymbol}' is not in Σ = {${pda.inputAlphabet.join(', ')}}.`,
      steps: getConfigurationSteps(initialConfiguration),
      finalStateId: initialConfiguration.stateId,
      finalStack: initialConfiguration.stack,
    };
  }

  const queue: PDAConfiguration[] = [initialConfiguration];
  const visited = new Set([configurationKey(initialConfiguration)]);
  let queueIndex = 0;
  let exploredConfigurations = 0;
  let longestConfiguration = initialConfiguration;
  let longestDeadEnd: PDAConfiguration | undefined;
  let acceptingConfiguration: PDAConfiguration | undefined;
  let reachedLimit = false;

  while (queueIndex < queue.length) {
    if (exploredConfigurations >= MAX_CONFIGURATIONS) {
      reachedLimit = true;
      break;
    }

    const current = queue[queueIndex++];
    exploredConfigurations++;

    if (isAcceptingConfiguration(pda, current, inputSymbols.length)) {
      acceptingConfiguration = current;
      break;
    }

    const nextInputSymbol = inputSymbols[current.inputIndex];
    const stackTop = current.stack[current.stack.length - 1];
    const applicableTransitions = pda.transitions.filter(transition =>
      canApplyTransition(transition, current.stateId, nextInputSymbol, stackTop)
    );

    if (applicableTransitions.length === 0) {
      if (
        !longestDeadEnd ||
        current.step.stepIndex > longestDeadEnd.step.stepIndex ||
        (current.step.stepIndex === longestDeadEnd.step.stepIndex &&
          current.inputIndex > longestDeadEnd.inputIndex)
      ) {
        longestDeadEnd = current;
      }
      continue;
    }

    for (const transition of applicableTransitions) {
      if (current.step.stepIndex >= MAX_STEPS) {
        reachedLimit = true;
        continue;
      }

      const nextStack = [...current.stack];
      if (!isEpsilon(transition.popSymbol)) nextStack.pop();

      const pushedSymbols = transition.pushSymbols.filter(symbol => !isEpsilon(symbol));
      for (let index = pushedSymbols.length - 1; index >= 0; index--) {
        nextStack.push(pushedSymbols[index]);
      }

      const consumesInput = !isEpsilon(transition.inputSymbol);
      const nextInputIndex = current.inputIndex + (consumesInput ? 1 : 0);
      const nextStateId = transition.to;
      const nextRemainingInput = getRemainingInput(inputSymbols, nextInputIndex);
      const nextStep: PDAStep = {
        stepIndex: current.step.stepIndex + 1,
        stateId: nextStateId,
        remainingInput: nextRemainingInput,
        stack: nextStack,
        appliedTransition: transition,
        explanation: `Read '${consumesInput ? nextInputSymbol : 'ε'}', popped '${
          isEpsilon(transition.popSymbol) ? 'ε' : transition.popSymbol
        }', pushed [${pushedSymbols.join(', ')}] -> State ${nextStateId}.`,
      };
      const nextConfiguration: PDAConfiguration = {
        stateId: nextStateId,
        inputIndex: nextInputIndex,
        stack: nextStack,
        previous: current,
        step: nextStep,
      };
      const key = configurationKey(nextConfiguration);

      if (visited.has(key)) continue;
      visited.add(key);
      queue.push(nextConfiguration);

      if (
        nextConfiguration.step.stepIndex > longestConfiguration.step.stepIndex ||
        (nextConfiguration.step.stepIndex === longestConfiguration.step.stepIndex &&
          nextConfiguration.inputIndex > longestConfiguration.inputIndex)
      ) {
        longestConfiguration = nextConfiguration;
      }
    }
  }

  const finalConfiguration = acceptingConfiguration || longestDeadEnd || longestConfiguration;
  const inputConsumed = finalConfiguration.inputIndex === inputSymbols.length;
  const isFinalState = pda.finalStateIds.includes(finalConfiguration.stateId);
  const isStackEmpty = finalConfiguration.stack.length === 0;

  if (acceptingConfiguration) {
    const reason =
      pda.acceptMode === 'FINAL_STATE'
        ? `Accepted: input fully consumed in final state ${finalConfiguration.stateId}.`
        : pda.acceptMode === 'EMPTY_STACK'
        ? 'Accepted: input fully consumed and stack is empty.'
        : 'Accepted: input fully consumed in a final state with an empty stack.';
    return {
      accepted: true,
      reason,
      steps: getConfigurationSteps(finalConfiguration),
      finalStateId: finalConfiguration.stateId,
      finalStack: finalConfiguration.stack,
    };
  }

  let reason: string;
  if (reachedLimit) {
    reason = `Rejected: simulation reached its safety limit of ${MAX_STEPS} steps or ${MAX_CONFIGURATIONS} configurations before finding an accepting path.`;
  } else if (!inputConsumed) {
    const noTransition = longestDeadEnd !== undefined;
    reason = noTransition
      ? `Rejected: no valid transition; input not fully consumed (remaining: "${getRemainingInput(
          inputSymbols,
          finalConfiguration.inputIndex
        )}").`
      : `Rejected: input not fully consumed (remaining: "${getRemainingInput(
          inputSymbols,
          finalConfiguration.inputIndex
        )}").`;
  } else if (pda.acceptMode === 'EMPTY_STACK') {
    reason = `Rejected: stack not empty after consuming input${longestDeadEnd ? ' (no valid transition).' : '.'}`;
  } else if (pda.acceptMode === 'FINAL_STATE') {
    reason = `Rejected: not in final state${longestDeadEnd ? ' (no valid transition).' : '.'}`;
  } else {
    const unmetConditions = [
      !isFinalState && 'not in final state',
      !isStackEmpty && 'stack not empty',
    ].filter(Boolean);
    reason = `Rejected: ${unmetConditions.join(' and ')}${longestDeadEnd ? ' (no valid transition).' : '.'}`;
  }

  return {
    accepted: false,
    reason,
    steps: getConfigurationSteps(finalConfiguration),
    finalStateId: finalConfiguration.stateId,
    finalStack: finalConfiguration.stack,
  };
}

// In stack arrays the bottom is index 0 and the top is the final element.
export const samplePDAs: PDADefinition[] = [
  {
    id: 'pda-0n1n',
    name: 'PDA: {0^n 1^n | n ≥ 1}',
    description: 'Pushes one stack marker for each 0, then pops one for each 1; accepts when the input and stack are empty.',
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
    acceptMode: 'EMPTY_STACK',
    transitions: [
      { id: 't1', from: 'q0', to: 'q0', inputSymbol: '0', popSymbol: 'Z0', pushSymbols: ['0', 'Z0'] },
      { id: 't2', from: 'q0', to: 'q0', inputSymbol: '0', popSymbol: '0', pushSymbols: ['0', '0'] },
      { id: 't3', from: 'q0', to: 'q1', inputSymbol: '1', popSymbol: '0', pushSymbols: ['ε'] },
      { id: 't4', from: 'q1', to: 'q1', inputSymbol: '1', popSymbol: '0', pushSymbols: ['ε'] },
      { id: 't5', from: 'q1', to: 'q2', inputSymbol: 'ε', popSymbol: 'Z0', pushSymbols: ['ε'] },
    ],
  },
  {
    id: 'pda-equal-zeros-ones',
    name: 'PDA: Equal number of 0s and 1s',
    description: 'Keeps the unmatched excess of 0s or 1s on the stack and accepts when their counts balance.',
    states: [
      { id: 'q0', label: 'q0', x: 200, y: 180, isStart: true },
      { id: 'qf', label: 'qf', x: 420, y: 180, isFinal: true },
    ],
    inputAlphabet: ['0', '1'],
    stackAlphabet: ['Z0', '0', '1'],
    startStateId: 'q0',
    startStackSymbol: 'Z0',
    finalStateIds: ['qf'],
    acceptMode: 'EMPTY_STACK',
    transitions: [
      { from: 'q0', to: 'q0', inputSymbol: '0', popSymbol: 'Z0', pushSymbols: ['0', 'Z0'] },
      { from: 'q0', to: 'q0', inputSymbol: '0', popSymbol: '0', pushSymbols: ['0', '0'] },
      { from: 'q0', to: 'q0', inputSymbol: '0', popSymbol: '1', pushSymbols: ['ε'] },
      { from: 'q0', to: 'q0', inputSymbol: '1', popSymbol: 'Z0', pushSymbols: ['1', 'Z0'] },
      { from: 'q0', to: 'q0', inputSymbol: '1', popSymbol: '1', pushSymbols: ['1', '1'] },
      { from: 'q0', to: 'q0', inputSymbol: '1', popSymbol: '0', pushSymbols: ['ε'] },
      { from: 'q0', to: 'qf', inputSymbol: 'ε', popSymbol: 'Z0', pushSymbols: ['ε'] },
    ],
  },
  {
    id: 'pda-balanced-parens',
    name: 'PDA: Balanced Parentheses ()',
    description: 'Pushes ( for every opening parenthesis and pops one for every closing parenthesis; accepts by empty stack.',
    states: [
      { id: 'q0', label: 'q0', x: 200, y: 180, isStart: true },
      { id: 'qf', label: 'qf', x: 420, y: 180, isFinal: true },
    ],
    inputAlphabet: ['(', ')'],
    stackAlphabet: ['(', 'Z0'],
    startStateId: 'q0',
    startStackSymbol: 'Z0',
    finalStateIds: ['qf'],
    acceptMode: 'EMPTY_STACK',
    transitions: [
      { id: 'bp1', from: 'q0', to: 'q0', inputSymbol: '(', popSymbol: 'Z0', pushSymbols: ['(', 'Z0'] },
      { id: 'bp2', from: 'q0', to: 'q0', inputSymbol: '(', popSymbol: '(', pushSymbols: ['(', '('] },
      { id: 'bp3', from: 'q0', to: 'q0', inputSymbol: ')', popSymbol: '(', pushSymbols: ['ε'] },
      { id: 'bp4', from: 'q0', to: 'qf', inputSymbol: 'ε', popSymbol: 'Z0', pushSymbols: ['ε'] },
    ],
  },
  {
    id: 'pda-palindrome',
    name: 'PDA: Palindromes over {a, b}',
    description: 'Nondeterministically guesses the center, including a single middle symbol for odd-length palindromes.',
    states: [
      { id: 'q0', label: 'q0', x: 100, y: 180, isStart: true, description: 'Push first half' },
      { id: 'q1', label: 'q1', x: 300, y: 180, description: 'Match second half' },
      { id: 'qf', label: 'qf', x: 500, y: 180, isFinal: true, description: 'Accept' },
    ],
    inputAlphabet: ['a', 'b'],
    stackAlphabet: ['Z0', 'A', 'B'],
    startStateId: 'q0',
    startStackSymbol: 'Z0',
    finalStateIds: ['qf'],
    acceptMode: 'EMPTY_STACK',
    transitions: [
      { from: 'q0', to: 'q0', inputSymbol: 'a', popSymbol: 'ε', pushSymbols: ['A'] },
      { from: 'q0', to: 'q0', inputSymbol: 'b', popSymbol: 'ε', pushSymbols: ['B'] },
      { from: 'q0', to: 'q1', inputSymbol: 'ε', popSymbol: 'ε', pushSymbols: ['ε'] },
      { from: 'q0', to: 'q1', inputSymbol: 'a', popSymbol: 'ε', pushSymbols: ['ε'] },
      { from: 'q0', to: 'q1', inputSymbol: 'b', popSymbol: 'ε', pushSymbols: ['ε'] },
      { from: 'q1', to: 'q1', inputSymbol: 'a', popSymbol: 'A', pushSymbols: ['ε'] },
      { from: 'q1', to: 'q1', inputSymbol: 'b', popSymbol: 'B', pushSymbols: ['ε'] },
      { from: 'q1', to: 'qf', inputSymbol: 'ε', popSymbol: 'Z0', pushSymbols: ['ε'] },
    ],
  },
  {
    id: 'pda-even-palindrome',
    name: 'PDA: Even Palindromes {w w^R}',
    description: 'Nondeterministically guesses the midpoint of an even-length palindrome, then matches symbols in reverse.',
    states: [
      { id: 'q0', label: 'q0', x: 100, y: 180, isStart: true, description: 'Push first half' },
      { id: 'q1', label: 'q1', x: 300, y: 180, description: 'Match reverse half' },
      { id: 'qf', label: 'qf', x: 500, y: 180, isFinal: true, description: 'Accept' },
    ],
    inputAlphabet: ['a', 'b'],
    stackAlphabet: ['Z0', 'A', 'B'],
    startStateId: 'q0',
    startStackSymbol: 'Z0',
    finalStateIds: ['qf'],
    acceptMode: 'EMPTY_STACK',
    transitions: [
      { from: 'q0', to: 'q0', inputSymbol: 'a', popSymbol: 'ε', pushSymbols: ['A'] },
      { from: 'q0', to: 'q0', inputSymbol: 'b', popSymbol: 'ε', pushSymbols: ['B'] },
      { from: 'q0', to: 'q1', inputSymbol: 'ε', popSymbol: 'ε', pushSymbols: ['ε'] },
      { from: 'q1', to: 'q1', inputSymbol: 'a', popSymbol: 'A', pushSymbols: ['ε'] },
      { from: 'q1', to: 'q1', inputSymbol: 'b', popSymbol: 'B', pushSymbols: ['ε'] },
      { from: 'q1', to: 'qf', inputSymbol: 'ε', popSymbol: 'Z0', pushSymbols: ['ε'] },
    ],
  },
  {
    id: 'pda-wcwR',
    name: 'PDA: Palindromes with Center Marker (w c w^R)',
    description: 'Pushes symbols before the center marker c, then matches and pops them in reverse after c.',
    states: [
      { id: 'q0', label: 'q0', x: 100, y: 150, isStart: true },
      { id: 'q1', label: 'q1', x: 260, y: 150 },
      { id: 'q2', label: 'q2', x: 420, y: 150, isFinal: true },
    ],
    inputAlphabet: ['a', 'b', 'c'],
    stackAlphabet: ['Z0', 'A', 'B'],
    startStateId: 'q0',
    startStackSymbol: 'Z0',
    finalStateIds: ['q2'],
    acceptMode: 'EMPTY_STACK',
    transitions: [
      { id: 't1', from: 'q0', to: 'q0', inputSymbol: 'a', popSymbol: 'ε', pushSymbols: ['A'] },
      { id: 't2', from: 'q0', to: 'q0', inputSymbol: 'b', popSymbol: 'ε', pushSymbols: ['B'] },
      { id: 't3', from: 'q0', to: 'q1', inputSymbol: 'c', popSymbol: 'ε', pushSymbols: ['ε'] },
      { id: 't4', from: 'q1', to: 'q1', inputSymbol: 'a', popSymbol: 'A', pushSymbols: ['ε'] },
      { id: 't5', from: 'q1', to: 'q1', inputSymbol: 'b', popSymbol: 'B', pushSymbols: ['ε'] },
      { id: 't6', from: 'q1', to: 'q2', inputSymbol: 'ε', popSymbol: 'Z0', pushSymbols: ['ε'] },
    ],
  },
  {
    id: 'pda-anb2n',
    name: 'PDA: {a^n b^{2n} | n ≥ 1}',
    description: 'Pushes two markers for every a and pops one for every b; accepts by empty stack after all input is consumed.',
    states: [
      { id: 'q0', label: 'q0', x: 100, y: 150, isStart: true },
      { id: 'q1', label: 'q1', x: 260, y: 150 },
      { id: 'q2', label: 'q2', x: 420, y: 150, isFinal: true },
    ],
    inputAlphabet: ['a', 'b'],
    stackAlphabet: ['Z0', 'X'],
    startStateId: 'q0',
    startStackSymbol: 'Z0',
    finalStateIds: ['q2'],
    acceptMode: 'EMPTY_STACK',
    transitions: [
      { id: 't1', from: 'q0', to: 'q0', inputSymbol: 'a', popSymbol: 'ε', pushSymbols: ['X', 'X'] },
      { id: 't2', from: 'q0', to: 'q1', inputSymbol: 'b', popSymbol: 'X', pushSymbols: ['ε'] },
      { id: 't3', from: 'q1', to: 'q1', inputSymbol: 'b', popSymbol: 'X', pushSymbols: ['ε'] },
      { id: 't4', from: 'q1', to: 'q2', inputSymbol: 'ε', popSymbol: 'Z0', pushSymbols: ['ε'] },
    ],
  },
];
