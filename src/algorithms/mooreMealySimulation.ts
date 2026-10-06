import { AutomatonDefinition, SimulationStep, StateNode, TransitionEdge } from '../types/automata';
import { layoutNodes } from './subsetConstruction';

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

export interface MooreMealyConversionReport {
  originalMachine: AutomatonDefinition;
  resultMachine: AutomatonDefinition;
  conversionType: 'MOORE_TO_MEALY' | 'MEALY_TO_MOORE';
  explanation: string[];
  mappingRows: {
    source: string;
    target: string;
    output: string;
    rule: string;
  }[];
}

// Convert Moore Machine to Mealy Machine
export function convertMooreToMealy(moore: AutomatonDefinition): MooreMealyConversionReport {
  const mealyStates: StateNode[] = moore.states.map(s => ({
    ...s,
    output: undefined,
  }));

  const stateOutputMap = new Map<string, string>();
  for (const s of moore.states) {
    stateOutputMap.set(s.id, s.output || '0');
  }

  const mappingRows: { source: string; target: string; output: string; rule: string }[] = [];
  const mealyTransitions: TransitionEdge[] = moore.transitions.map((t, idx) => {
    const targetState = moore.states.find(s => s.id === t.to);
    const targetLabel = targetState?.label || t.to;
    const fromState = moore.states.find(s => s.id === t.from);
    const fromLabel = fromState?.label || t.from;
    const output = stateOutputMap.get(t.to) || '0';

    mappingRows.push({
      source: `${fromLabel} --(${t.symbols.join(',')})--> ${targetLabel}`,
      target: `${fromLabel} --(${t.symbols.join(',')}/${output})--> ${targetLabel}`,
      output,
      rule: `Transition entering state ${targetLabel} inherits Moore output '${output}'`,
    });

    return {
      ...t,
      id: `mealy-edge-${idx}`,
      output,
    };
  });

  const resultMachine: AutomatonDefinition = {
    ...moore,
    id: `mealy-${Date.now()}`,
    name: `${moore.name} (Converted Mealy)`,
    type: 'MEALY',
    states: mealyStates,
    transitions: mealyTransitions,
  };

  const explanation = [
    `1. Preserved all ${moore.states.length} state nodes: Q_Mealy = Q_Moore.`,
    `2. Transferred state outputs to incoming transitions: for every transition δ(p, a) = q, the Mealy transition output becomes λ(p, a) = λ_Moore(q).`,
    `3. Removed outputs from states because Mealy machines emit outputs strictly on transitions.`,
  ];

  return {
    originalMachine: moore,
    resultMachine,
    conversionType: 'MOORE_TO_MEALY',
    explanation,
    mappingRows,
  };
}

// Convert Mealy Machine to Moore Machine
export function convertMealyToMoore(mealy: AutomatonDefinition): MooreMealyConversionReport {
  const incomingOutputs = new Map<string, Set<string>>();
  for (const s of mealy.states) {
    incomingOutputs.set(s.id, new Set());
  }

  if (mealy.startStateId && incomingOutputs.has(mealy.startStateId)) {
    incomingOutputs.get(mealy.startStateId)!.add('0');
  }

  for (const t of mealy.transitions) {
    const out = t.output !== undefined && t.output !== '' ? t.output : '0';
    if (incomingOutputs.has(t.to)) {
      incomingOutputs.get(t.to)!.add(out);
    }
  }

  for (const s of mealy.states) {
    const outs = incomingOutputs.get(s.id)!;
    if (outs.size === 0) {
      outs.add('0');
    }
  }

  const mooreStates: StateNode[] = [];
  const stateSplitMap = new Map<string, Map<string, string>>();
  const mappingRows: { source: string; target: string; output: string; rule: string }[] = [];

  for (const s of mealy.states) {
    const outs = Array.from(incomingOutputs.get(s.id)!);
    const subMap = new Map<string, string>();

    for (const out of outs) {
      const newId = `${s.id}_${out}`;
      const newLabel = outs.length === 1 ? s.label : `${s.label}/${out}`;
      subMap.set(out, newId);

      mooreStates.push({
        id: newId,
        label: newLabel,
        x: s.x,
        y: s.y,
        output: out,
        isStart: s.id === mealy.startStateId && out === '0',
        isFinal: mealy.finalStateIds.includes(s.id),
        description: `State ${s.label} with entry output '${out}'`,
      });

      mappingRows.push({
        source: `Mealy State ${s.label}`,
        target: `Moore State ${newLabel}`,
        output: out,
        rule: `Split state ${s.label} for transition output '${out}'`,
      });
    }
    stateSplitMap.set(s.id, subMap);
  }

  const mooreTransitions: TransitionEdge[] = [];
  let edgeCounter = 0;

  for (const t of mealy.transitions) {
    const out = t.output !== undefined && t.output !== '' ? t.output : '0';
    const targetMap = stateSplitMap.get(t.to);
    const targetMooreId = targetMap ? (targetMap.get(out) || Array.from(targetMap.values())[0]) : t.to;

    const fromMap = stateSplitMap.get(t.from);
    if (fromMap) {
      for (const fromMooreId of fromMap.values()) {
        mooreTransitions.push({
          id: `moore-conv-edge-${edgeCounter++}`,
          from: fromMooreId,
          to: targetMooreId,
          symbols: [...t.symbols],
        });
      }
    }
  }

  const startMap = stateSplitMap.get(mealy.startStateId);
  const startStateId = startMap ? (startMap.get('0') || Array.from(startMap.values())[0]) : mealy.startStateId;
  const finalStateIds = mooreStates.filter(s => s.isFinal).map(s => s.id);
  const positionedStates = layoutNodes(mooreStates);

  const resultMachine: AutomatonDefinition = {
    ...mealy,
    id: `moore-${Date.now()}`,
    name: `${mealy.name} (Converted Moore)`,
    type: 'MOORE',
    states: positionedStates,
    transitions: mooreTransitions,
    startStateId,
    finalStateIds,
  };

  const explanation = [
    `1. Analyzed all outputs on transitions entering each Mealy state.`,
    `2. Split states that receive multiple distinct outputs: generated ${mooreStates.length} Moore states from ${mealy.states.length} Mealy states.`,
    `3. Assigned each transition output as the static output of the newly partitioned Moore state.`,
    `4. Rewired all transitions to land on the specific state variant corresponding to their emitted output.`,
  ];

  return {
    originalMachine: mealy,
    resultMachine,
    conversionType: 'MEALY_TO_MOORE',
    explanation,
    mappingRows,
  };
}
