import React, { useState } from 'react';
import { AutomatonDefinition } from '../../types/automata';
import { AutomataCanvas } from '../canvas/AutomataCanvas';
import { SimulatorControls } from '../simulation/SimulatorControls';
import { SimulationPathTrace } from '../simulation/SimulationPathTrace';
import { simulateAutomaton } from '../../algorithms/dfaSimulation';
import { simulateMooreMachine, simulateMealyMachine, compareMooreVsMealy } from '../../algorithms/mooreMealySimulation';
import { predefinedAutomata } from '../../data/predefinedExamples';
import { PlaySquare, Sparkles, Scale, Info, CheckCircle2, ArrowRight } from 'lucide-react';

interface SimulatorViewProps {
  machine: AutomatonDefinition;
  onChangeMachine: (updated: AutomatonDefinition) => void;
}

export const SimulatorView: React.FC<SimulatorViewProps> = ({
  machine,
  onChangeMachine,
}) => {
  const [inputString, setInputString] = useState<string>('1011');
  const [simResult, setSimResult] = useState<any>(null);
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [mode, setMode] = useState<'STANDARD' | 'MOORE_MEALY_COMPARE'>('STANDARD');

  // Handle standard simulation
  const handleSimulate = () => {
    const res = simulateAutomaton(machine, inputString);
    setSimResult(res);
    setStepIndex(0);
  };

  const activeStateIds = simResult?.path[stepIndex]?.currentStateIds || [];
  const activeTransitionId = simResult?.path[stepIndex]?.activeTransitionId;

  // Moore vs Mealy sample machines for comparison tab
  const sampleMoore = predefinedAutomata.find(m => m.id === 'example-moore-mod3') || machine;
  const sampleMealy = predefinedAutomata.find(m => m.id === 'example-mealy-1s-complement') || machine;
  const comparisonData = compareMooreVsMealy(sampleMoore, sampleMealy, inputString);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* View Header with Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-['Outfit'] flex items-center gap-2">
            <PlaySquare className="w-6 h-6 text-indigo-400" />
            <span>Step-by-Step String Simulator</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Trace computation paths, inspect state changes, and examine detailed formal acceptance rationales
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl text-xs">
          <button
            onClick={() => setMode('STANDARD')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
              mode === 'STANDARD'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Machine Simulation
          </button>
          <button
            onClick={() => setMode('MOORE_MEALY_COMPARE')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 ${
              mode === 'MOORE_MEALY_COMPARE'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Moore vs Mealy Lab</span>
          </button>
        </div>
      </div>

      {mode === 'STANDARD' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Visual Graph Area (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="h-[460px] w-full">
              <AutomataCanvas
                machine={machine}
                onChangeMachine={onChangeMachine}
                activeStateIds={activeStateIds}
                activeTransitionId={activeTransitionId}
                isEditable={false}
              />
            </div>

            <SimulatorControls
              inputString={inputString}
              onChangeInputString={setInputString}
              onSimulate={handleSimulate}
              simulationResult={simResult}
              currentStepIndex={stepIndex}
              onStepChange={setStepIndex}
              alphabet={machine.alphabet}
            />
          </div>

          {/* Trace and Formal Explanation Panel (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4 backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Simulation Diagnostic Panel</span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
                  {machine.type}
                </span>
              </h3>
            </div>

            <SimulationPathTrace
              simulationResult={simResult}
              currentStepIndex={stepIndex}
              onSelectStep={setStepIndex}
            />
          </div>
        </div>
      ) : (
        /* Moore vs Mealy Comparison Lab */
        <div className="space-y-6">
          <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
              <Scale className="w-5 h-5" />
              <span>Comparative Analysis: Moore Machine vs. Mealy Machine</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Moore machines bind output strictly to <strong>States</strong> (output emitted on state entry).
              Mealy machines bind output directly to <strong>Transitions</strong> (output emitted simultaneously with the input symbol).
            </p>

            <div className="flex items-center gap-3">
              <input
                type="text"
                value={inputString}
                onChange={e => setInputString(e.target.value)}
                placeholder="Enter input string..."
                className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-slate-100 focus:outline-none focus:border-indigo-500 max-w-sm"
              />
              <span className="text-xs text-slate-400 font-mono">
                Input Length: {inputString.length}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Moore Machine Card */}
            <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 text-xs font-bold bg-indigo-500/20 text-indigo-300 rounded-lg border border-indigo-500/30">
                  Moore Machine
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Output Length = |w| + 1
                </span>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 font-mono text-xs">
                <div>Input: "{inputString}"</div>
                <div className="text-indigo-300 font-bold">
                  Generated Output: "{comparisonData.mooreResult.output}"
                </div>
                <div className="text-slate-400 text-[11px]">
                  State Path: {comparisonData.mooreResult.stateSequence.join(' → ')}
                </div>
              </div>

              <div className="text-xs text-slate-400 leading-relaxed">
                Initial state emitted '{comparisonData.mooreResult.steps[0]?.outputProduced || '0'}' before reading any input, followed by 1 output for each subsequent character.
              </div>
            </div>

            {/* Mealy Machine Card */}
            <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 text-xs font-bold bg-cyan-500/20 text-cyan-300 rounded-lg border border-cyan-500/30">
                  Mealy Machine
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Output Length = |w|
                </span>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 font-mono text-xs">
                <div>Input: "{inputString}"</div>
                <div className="text-cyan-300 font-bold">
                  Generated Output: "{comparisonData.mealyResult.output}"
                </div>
                <div className="text-slate-400 text-[11px]">
                  State Path: {comparisonData.mealyResult.stateSequence.join(' → ')}
                </div>
              </div>

              <div className="text-xs text-slate-400 leading-relaxed">
                Output was produced synchronously with each transition. Total outputs strictly match the number of characters read.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
