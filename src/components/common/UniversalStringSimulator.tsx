import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  Layers,
  ArrowRight,
  Sliders,
} from 'lucide-react';
import {
  AutomatonDefinition,
  PDADefinition,
  TMDefinition,
  SimulationResult,
} from '../../types/automata';
import { simulateAutomaton } from '../../algorithms/dfaSimulation';
import { simulateMooreMachine, simulateMealyMachine, MooreMealyResult } from '../../algorithms/mooreMealySimulation';
import { simulatePDA, PDASimulationResult } from '../../algorithms/pda';
import { simulateTuringMachine, TMSimulationResult } from '../../algorithms/turingMachine';

export type SimulatorModel =
  | { type: 'FA'; machine: AutomatonDefinition }
  | { type: 'PDA'; machine: PDADefinition }
  | { type: 'TM'; machine: TMDefinition };

interface UniversalStringSimulatorProps {
  model: SimulatorModel;
  title?: string;
  defaultInput?: string;
  onStateActive?: (stateId: string) => void;
}

export const UniversalStringSimulator: React.FC<UniversalStringSimulatorProps> = ({
  model,
  title = 'Interactive String Simulator',
  defaultInput = 'aabb',
  onStateActive,
}) => {
  const [inputString, setInputString] = useState<string>(defaultInput);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speedMs, setSpeedMs] = useState<number>(600);
  const [showWhyModal, setShowWhyModal] = useState<boolean>(false);

  // Compute simulation based on model type
  const computeSimulation = () => {
    if (model.type === 'FA') {
      if (model.machine.type === 'MOORE') {
        const res = simulateMooreMachine(model.machine, inputString);
        return { faMoore: res };
      }
      if (model.machine.type === 'MEALY') {
        const res = simulateMealyMachine(model.machine, inputString);
        return { faMealy: res };
      }
      const res = simulateAutomaton(model.machine, inputString);
      return { faStandard: res };
    }
    if (model.type === 'PDA') {
      const res = simulatePDA(model.machine, inputString);
      return { pda: res };
    }
    if (model.type === 'TM') {
      const res = simulateTuringMachine(model.machine, inputString, 1000);
      return { tm: res };
    }
    return {};
  };

  const simResult = computeSimulation();

  // Determine total steps
  let totalSteps = 1;
  let isAccepted = false;
  let detailedReason = '';
  let finalStateName = '';

  if (simResult.faStandard) {
    totalSteps = simResult.faStandard.path.length;
    isAccepted = simResult.faStandard.accepted;
    detailedReason = simResult.faStandard.detailedReason;
    finalStateName = simResult.faStandard.finalStateIds.join(', ');
  } else if (simResult.faMoore) {
    totalSteps = simResult.faMoore.steps.length;
    isAccepted = simResult.faMoore.valid;
    detailedReason = simResult.faMoore.error || `Completed Moore run. Emitted output: "${simResult.faMoore.output}"`;
    finalStateName = simResult.faMoore.steps[simResult.faMoore.steps.length - 1]?.stateLabel || '';
  } else if (simResult.faMealy) {
    totalSteps = simResult.faMealy.steps.length;
    isAccepted = simResult.faMealy.valid;
    detailedReason = simResult.faMealy.error || `Completed Mealy run. Emitted output: "${simResult.faMealy.output}"`;
    finalStateName = simResult.faMealy.steps[simResult.faMealy.steps.length - 1]?.stateLabel || '';
  } else if (simResult.pda) {
    totalSteps = simResult.pda.steps.length;
    isAccepted = simResult.pda.accepted;
    detailedReason = simResult.pda.reason;
    finalStateName = simResult.pda.finalStateId;
  } else if (simResult.tm) {
    totalSteps = simResult.tm.steps.length;
    isAccepted = simResult.tm.status === 'ACCEPTED';
    detailedReason = simResult.tm.reason;
    finalStateName = simResult.tm.finalStateId;
  }

  // Auto-play timer
  useEffect(() => {
    let timer: any;
    if (isPlaying && totalSteps > 0) {
      if (currentStepIdx < totalSteps - 1) {
        timer = setTimeout(() => {
          setCurrentStepIdx(prev => prev + 1);
        }, speedMs);
      } else {
        setIsPlaying(false);
      }
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIdx, totalSteps, speedMs]);

  // Notify parent of active state
  useEffect(() => {
    if (!onStateActive) return;
    if (simResult.faStandard && simResult.faStandard.path[currentStepIdx]) {
      const activeIds = simResult.faStandard.path[currentStepIdx].currentStateIds;
      if (activeIds.length > 0) onStateActive(activeIds[0]);
    }
  }, [currentStepIdx]);

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIdx(0);
  };

  const handleStepForward = () => {
    if (currentStepIdx < totalSteps - 1) {
      setCurrentStepIdx(prev => prev + 1);
    }
  };

  const isAtEnd = currentStepIdx >= totalSteps - 1;

  // Extract current step details
  let currentActiveState = '';
  let explanationText = '';
  let pdaStack: string[] = [];
  let tmTape: string[] = [];
  let tmHead = 0;
  let mooreMealyOutput = '';

  if (simResult.faStandard) {
    const s = simResult.faStandard.path[currentStepIdx] || simResult.faStandard.path[0];
    currentActiveState = s?.currentStateIds.join(', ') || '';
    explanationText = s?.explanation || '';
  } else if (simResult.faMoore) {
    const s = simResult.faMoore.steps[currentStepIdx] || simResult.faMoore.steps[0];
    currentActiveState = s?.stateLabel || '';
    explanationText = s?.explanation || '';
    mooreMealyOutput = s?.cumulativeOutput || '';
  } else if (simResult.faMealy) {
    const s = simResult.faMealy.steps[currentStepIdx] || simResult.faMealy.steps[0];
    currentActiveState = s?.stateLabel || '';
    explanationText = s?.explanation || '';
    mooreMealyOutput = s?.cumulativeOutput || '';
  } else if (simResult.pda) {
    const s = simResult.pda.steps[currentStepIdx] || simResult.pda.steps[0];
    currentActiveState = s?.stateId || '';
    explanationText = s?.explanation || '';
    pdaStack = s?.stack || [];
  } else if (simResult.tm) {
    const s = simResult.tm.steps[currentStepIdx] || simResult.tm.steps[0];
    currentActiveState = s?.stateId || '';
    explanationText = s?.actionDescription || '';
    tmTape = s?.tape || [];
    tmHead = s?.headIndex || 0;
  }

  return (
    <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-4 text-xs font-sans">
      {/* Header with Title and Input */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2 font-['Outfit']">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>{title}</span>
          </h3>
          <p className="text-slate-400 text-[11px]">
            Test any arbitrary string with live state execution trace
          </p>
        </div>

        {/* Input Form */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            value={inputString}
            onChange={e => {
              setInputString(e.target.value.trim());
              setCurrentStepIdx(0);
              setIsPlaying(false);
            }}
            placeholder="Enter test string (e.g. 101 or aabb)..."
            className="flex-1 sm:w-48 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500 shadow-inner"
          />
          <button
            onClick={() => {
              setCurrentStepIdx(0);
              setIsPlaying(true);
            }}
            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-xl transition-colors shadow-sm flex items-center gap-1 shrink-0"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Run</span>
          </button>
        </div>
      </div>

      {/* Tape Visualization for Input String */}
      <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Input Tape:</span>
          <span>
            Step {currentStepIdx + 1} of {Math.max(totalSteps, 1)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {inputString.length === 0 ? (
            <div className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-500 font-mono text-xs">
              ε (Empty String)
            </div>
          ) : (
            inputString.split('').map((char, idx) => {
              const isCurrent = idx === currentStepIdx - 1;
              const isPast = idx < currentStepIdx - 1;
              return (
                <div
                  key={idx}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs border transition-all ${
                    isCurrent
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20 scale-105'
                      : isPast
                      ? 'bg-slate-900 text-slate-500 border-slate-800/80'
                      : 'bg-slate-900/60 text-slate-200 border-slate-700'
                  }`}
                >
                  {char}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* PDA Stack Visual if model is PDA */}
      {model.type === 'PDA' && (
        <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-indigo-300 font-semibold">
            <span className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" /> Stack Memory (Top at Right):
            </span>
            <span className="text-slate-400 font-mono text-[10px]">
              Depth: {pdaStack.length}
            </span>
          </div>
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            {pdaStack.map((sym, idx) => {
              const isTop = idx === pdaStack.length - 1;
              return (
                <div
                  key={idx}
                  className={`px-2.5 py-1 rounded-md font-mono text-xs font-bold border ${
                    isTop
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-xs'
                      : 'bg-slate-900 text-slate-300 border-slate-800'
                  }`}
                >
                  {sym} {isTop && <span className="text-[9px] text-cyan-300">TOP</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Turing Machine Tape Visual if model is TM */}
      {model.type === 'TM' && tmTape.length > 0 && (
        <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-1.5">
          <div className="text-[11px] text-amber-300 font-semibold flex items-center justify-between">
            <span>Turing Machine Tape:</span>
            <span className="font-mono text-[10px] text-slate-400">Head at Cell {tmHead}</span>
          </div>
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            {tmTape.slice(Math.max(0, tmHead - 6), tmHead + 10).map((sym, idx) => {
              const actualIdx = Math.max(0, tmHead - 6) + idx;
              const isHead = actualIdx === tmHead;
              return (
                <div key={actualIdx} className="flex flex-col items-center">
                  <div
                    className={`w-7 h-7 rounded-md flex items-center justify-center font-mono font-bold text-xs border ${
                      isHead
                        ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-xs scale-105'
                        : 'bg-slate-900 text-slate-300 border-slate-800'
                    }`}
                  >
                    {sym}
                  </div>
                  {isHead && <span className="text-[9px] text-amber-400 font-bold">▲</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Moore / Mealy output ribbon */}
      {(model.type === 'FA' && (model.machine.type === 'MOORE' || model.machine.type === 'MEALY')) && (
        <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400 font-sans text-xs">Generated Output String:</span>
          <span className="text-cyan-300 font-bold tracking-wider">{mooreMealyOutput || 'ε'}</span>
        </div>
      )}

      {/* Current Step Status & Explanation Banner */}
      <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="space-y-0.5">
          <div className="text-[11px] font-semibold text-slate-400">
            Active State:{' '}
            <span className="text-cyan-300 font-mono font-bold text-xs">
              {currentActiveState || 'None'}
            </span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed font-mono text-[11px]">
            {explanationText || 'Simulation ready.'}
          </p>
        </div>

        {/* Completion Badge */}
        {isAtEnd && (
          <div className="flex items-center gap-2 shrink-0">
            {isAccepted ? (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ACCEPTED
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl font-bold text-xs">
                <XCircle className="w-4 h-4 text-rose-400" />
                REJECTED
              </span>
            )}

            <button
              onClick={() => setShowWhyModal(true)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors"
              title="Why was this result produced?"
            >
              <HelpCircle className="w-4 h-4 text-indigo-400" />
            </button>
          </div>
        )}
      </div>

      {/* Simulation Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={isAtEnd && !isPlaying}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          <button
            onClick={handleStepForward}
            disabled={isAtEnd || isPlaying}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl transition-colors flex items-center gap-1 border border-slate-700 disabled:opacity-40"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>Step</span>
          </button>

          <button
            onClick={handleReset}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors border border-slate-700"
            title="Reset to beginning"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Speed slider */}
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          <span>Speed:</span>
          <select
            value={speedMs}
            onChange={e => setSpeedMs(Number(e.target.value))}
            className="px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none"
          >
            <option value={1000}>Slow (1s)</option>
            <option value={600}>Normal (0.6s)</option>
            <option value={250}>Fast (0.25s)</option>
          </select>
        </div>
      </div>

      {/* "Why?" Explanation Modal */}
      {showWhyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 shadow-2xl relative space-y-4">
            <h4 className="text-base font-bold text-white flex items-center gap-2 font-['Outfit']">
              <HelpCircle className="w-5 h-5 text-indigo-400" />
              <span>Why was this string {isAccepted ? 'Accepted' : 'Rejected'}?</span>
            </h4>

            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs space-y-2 leading-relaxed text-slate-300">
              <p>
                <b>String:</b> <code className="text-cyan-300 font-mono">"{inputString || 'ε'}"</code>
              </p>
              <p>
                <b>Final Machine State:</b> <code className="text-indigo-300 font-mono">{finalStateName}</code>
              </p>
              <div className="pt-2 border-t border-slate-800 text-slate-300">
                {detailedReason}
              </div>
            </div>

            <button
              onClick={() => setShowWhyModal(false)}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
