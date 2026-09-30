import { AutomatonDefinition, SimulationStep } from '../types/automata';

export interface MooreMealyStep {
  stepIndex: number;
  symbol: string | null;
  stateId: string;
  stateLabel: string;
  outputProduced: string;
  cumulativeOutput: string;
  explanation: string;
}

export interface MooreMealyResult {
  machineType: 'MOORE' | 'MEALY';
  valid: boolean;
  error?: string;
  input: string;
  output: string;
  steps: MooreMealyStep[];
  stateSequence: string[];
}

export interface MooreVsMealyComparison {
  input: string;
  mooreResult: MooreMealyResult;
  mealyResult: MooreMealyResult;
  mooreOutputLength: number;
  mealyOutputLength: number;
  outputTimingDifference: string;
  stateCountDifference: { moore: number; mealy: number };
}

// Simulate Moore Machine
export function simulateMooreMachine(
  machine: AutomatonDefinition,
  input: string
): MooreMealyResult {
  if (!machine.startStateId) {
    return {
      machineType: 'MOORE',
      valid: false,
      error: 'No start state defined.',
      input,
      output: '',
      steps: [],
      stateSequence: [],
    };
  }

  const startState = machine.states.find(s => s.id === machine.startStateId);
  if (!startState) {
    return {
      machineType: 'MOORE',
      valid: false,
      error: 'Start state not found in states list.',
      input,
      output: '',
      steps: [],
      stateSequence: [],
    };
  }

  const steps: MooreMealyStep[] = [];
  const stateSequence: string[] = [startState.label];
  let currentState = startState;
  let cumulativeOutput = startState.output || 'ε';

  steps.push({
    stepIndex: 0,
    symbol: null,
    stateId: currentState.id,
    stateLabel: currentState.label,
    outputProduced: currentState.output || 'ε',
    cumulativeOutput,
    explanation: `Initial state ${currentState.label} emits state output '${currentState.output || 'ε'}'.`,
  });

  for (let i = 0; i < input.length; i++) {
    const symbol = input[i];
    const trans = machine.transitions.find(
      t => t.from === currentState.id && t.symbols.includes(symbol)
    );

    if (!trans) {
      return {
        machineType: 'MOORE',
        valid: false,
        error: `No transition from state ${currentState.label} on input '${symbol}'. Machine halted.`,
        input,
        output: cumulativeOutput,
        steps,
        stateSequence,
      };
    }

    const nextState = machine.states.find(s => s.id === trans.to);
    if (!nextState) {
      return {
        machineType: 'MOORE',
        valid: false,
        error: `Destination state ${trans.to} not found.`,
        input,
        output: cumulativeOutput,
        steps,
        stateSequence,
      };
    }

    currentState = nextState;
    stateSequence.push(currentState.label);
    const outChar = currentState.output || '';
    if (outChar && outChar !== 'ε') {
      cumulativeOutput += outChar;
    }

    steps.push({
      stepIndex: i + 1,
      symbol,
      stateId: currentState.id,
      stateLabel: currentState.label,
      outputProduced: outChar,
      cumulativeOutput,
      explanation: `Read '${symbol}': moved to state ${currentState.label}, producing output '${outChar}'.`,
    });
  }

  return {
    machineType: 'MOORE',
    valid: true,
    input,
    output: cumulativeOutput,
    steps,
    stateSequence,
  };
}

// Simulate Mealy Machine
export function simulateMealyMachine(
  machine: AutomatonDefinition,
  input: string
): MooreMealyResult {
  if (!machine.startStateId) {
    return {
      machineType: 'MEALY',
      valid: false,
      error: 'No start state defined.',
      input,
      output: '',
      steps: [],
      stateSequence: [],
    };
  }

  const startState = machine.states.find(s => s.id === machine.startStateId);
  if (!startState) {
    return {
      machineType: 'MEALY',
      valid: false,
      error: 'Start state not found.',
      input,
      output: '',
      steps: [],
      stateSequence: [],
    };
  }

  const steps: MooreMealyStep[] = [];
  const stateSequence: string[] = [startState.label];
  let currentState = startState;
  let cumulativeOutput = '';

  steps.push({
    stepIndex: 0,
    symbol: null,
    stateId: currentState.id,
    stateLabel: currentState.label,
    outputProduced: '',
    cumulativeOutput: '',
    explanation: `Machine initialized at state ${currentState.label}. (Mealy machines emit output strictly on transitions).`,
  });

  for (let i = 0; i < input.length; i++) {
    const symbol = input[i];
    const trans = machine.transitions.find(
      t => t.from === currentState.id && t.symbols.includes(symbol)
    );

    if (!trans) {
      return {
        machineType: 'MEALY',
        valid: false,
        error: `No transition from state ${currentState.label} on input '${symbol}'. Machine halted.`,
        input,
        output: cumulativeOutput,
        steps,
        stateSequence,
      };
    }

    const nextState = machine.states.find(s => s.id === trans.to);
    if (!nextState) {
      return {
        machineType: 'MEALY',
        valid: false,
        error: `Destination state ${trans.to} not found.`,
        input,
        output: cumulativeOutput,
        steps,
        stateSequence,
      };
    }

    const outChar = trans.output || '';
    cumulativeOutput += outChar;
    currentState = nextState;
    stateSequence.push(currentState.label);

    steps.push({
      stepIndex: i + 1,
      symbol,
      stateId: currentState.id,
      stateLabel: currentState.label,
      outputProduced: outChar,
      cumulativeOutput,
      explanation: `Read '${symbol}': transitioned from previous state to ${currentState.label} emitting output '${outChar}'.`,
    });
  }

  return {
    machineType: 'MEALY',
    valid: true,
    input,
    output: cumulativeOutput,
    steps,
    stateSequence,
  };
}

// Compare Moore and Mealy side-by-side
export function compareMooreVsMealy(
  mooreMachine: AutomatonDefinition,
  mealyMachine: AutomatonDefinition,
  input: string
): MooreVsMealyComparison {
  const mooreResult = simulateMooreMachine(mooreMachine, input);
  const mealyResult = simulateMealyMachine(mealyMachine, input);

  return {
    input,
    mooreResult,
    mealyResult,
    mooreOutputLength: mooreResult.output.length,
    mealyOutputLength: mealyResult.output.length,
    outputTimingDifference:
      'Moore machine outputs on state entry (total output length = |input| + 1 for initial state output), whereas Mealy machine outputs synchronously with transitions (total output length = |input|).',
    stateCountDifference: {
      moore: mooreMachine.states.length,
      mealy: mealyMachine.states.length,
    },
  };
}
