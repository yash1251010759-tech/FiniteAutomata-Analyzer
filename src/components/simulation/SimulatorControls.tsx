import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, FastForward, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { SimulationResult, SimulationStep } from '../../types/automata';

interface SimulatorControlsProps {
  inputString: string;
  onChangeInputString: (str: string) => void;
  onSimulate: () => void;
  simulationResult: SimulationResult | null;
  currentStepIndex: number;
  onStepChange: (index: number) => void;
  alphabet: string[];
}

export const SimulatorControls: React.FC<SimulatorControlsProps> = ({
  inputString,
  onChangeInputString,
  onSimulate,
  simulationResult,
  currentStepIndex,
  onStepChange,
  alphabet,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speedMs, setSpeedMs] = useState<number>(650);

  const totalSteps = simulationResult?.path.length || 0;
  const currentStep: SimulationStep | undefined = simulationResult?.path[currentStepIndex];

  // Auto-play loop
  useEffect(() => {
    let timer: any;
    if (isPlaying && simulationResult && totalSteps > 0) {
      if (currentStepIndex < totalSteps - 1) {
        timer = setTimeout(() => {
          onStepChange(currentStepIndex + 1);
        }, speedMs);
      } else {
        setIsPlaying(false);
      }
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, totalSteps, speedMs]);

  // Restart
  const handleReset = () => {
    setIsPlaying(false);
    onStepChange(0);
  };

  // Step next
  const handleNext = () => {
    if (currentStepIndex < totalSteps - 1) {
      onStepChange(currentStepIndex + 1);
    }
  };

  // Step prev
  const handlePrev = () => {
    if (currentStepIndex > 0) {
      onStepChange(currentStepIndex - 1);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md space-y-4">
      {/* Top Input Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={inputString}
            onChange={e => {
              onChangeInputString(e.target.value);
              setIsPlaying(false);
            }}
            placeholder="Enter input string (e.g. 1011 or ε)..."
            className="w-full pl-3.5 pr-20 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 font-mono text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
          />
          <div className="absolute right-2 top-2 flex items-center gap-1">
            <button
              type="button"
              onClick={() => onChangeInputString('')}
              className="px-2 py-0.5 text-xs font-mono text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors"
              title="Empty String ε"
            >
              ε
            </button>
          </div>
        </div>

        <button
          onClick={() => {
            onSimulate();
            onStepChange(0);
          }}
          className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/25 transition-all active:scale-95"
        >
          Simulate String
        </button>
      </div>

      {/* Quick sample chips */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-400 font-medium">Quick Test:</span>
        {['01', '101', '00101', '1100', '101101'].map(sample => (
          <button
            key={sample}
            onClick={() => {
              onChangeInputString(sample);
              setIsPlaying(false);
            }}
            className="px-2.5 py-1 bg-slate-800/80 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-200 border border-slate-700/60 rounded-lg font-mono transition-colors"
          >
            {sample}
          </button>
        ))}
      </div>

      {/* Ribbon Visualization of Tape Characters */}
      {simulationResult && (
        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Input String Tape:</span>
            <span>
              Step {currentStepIndex} of {totalSteps > 0 ? totalSteps - 1 : 0}
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {inputString.length === 0 ? (
              <div className="px-3 py-1.5 rounded-lg font-mono text-sm font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                ε (Empty String)
              </div>
            ) : (
              inputString.split('').map((char, idx) => {
                const isConsumed = idx < (currentStep?.inputProcessed.length || 0);
                const isCurrent = idx === (currentStep?.inputProcessed.length || 0) - 1;
                const isUpcoming = idx >= (currentStep?.inputProcessed.length || 0);

                return (
                  <div
                    key={idx}
                    className={`flex flex-col items-center justify-center w-8 h-9 rounded-lg font-mono text-sm font-bold transition-all ${
                      isCurrent
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/40 scale-105'
                        : isConsumed
                        ? 'bg-slate-800 text-slate-400 line-through opacity-60'
                        : 'bg-slate-900 text-slate-200 border border-slate-800'
                    }`}
                  >
                    {char}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Playback Controls & Result Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800/80">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={handleReset}
            disabled={!simulationResult || currentStepIndex === 0}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent rounded-lg transition-colors"
            title="Reset to Step 0"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handlePrev}
            disabled={!simulationResult || currentStepIndex === 0}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent rounded-lg transition-colors"
            title="Previous Step"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={!simulationResult || currentStepIndex >= totalSteps - 1}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white disabled:text-slate-500 rounded-lg text-xs font-semibold shadow-md transition-colors"
            title={isPlaying ? 'Pause' : 'Auto Play'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          <button
            onClick={handleNext}
            disabled={!simulationResult || currentStepIndex >= totalSteps - 1}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent rounded-lg transition-colors"
            title="Next Step"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Speed selector */}
          <div className="flex items-center gap-1.5 ml-2 text-xs text-slate-400">
            <span className="hidden sm:inline">Speed:</span>
            <select
              value={speedMs}
              onChange={e => setSpeedMs(Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 rounded-md px-1.5 py-1 text-slate-200 text-xs focus:outline-none"
            >
              <option value={1200}>0.5x</option>
              <option value={650}>1x</option>
              <option value={300}>2x</option>
              <option value={100}>4x</option>
            </select>
          </div>
        </div>

        {/* Acceptance Status Banner */}
        {simulationResult && (
          <div className="flex items-center gap-2">
            {simulationResult.status === 'ACCEPTED' ? (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>ACCEPT ✓</span>
              </div>
            ) : simulationResult.status === 'REJECTED' ? (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full text-xs font-bold shadow-sm">
                <XCircle className="w-3.5 h-3.5" />
                <span>REJECT ✗</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-bold shadow-sm">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>HALTED (Trap)</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Current Step Explanation Box */}
      {currentStep && (
        <div className="p-3 bg-slate-950 border border-indigo-950/60 rounded-xl text-xs text-slate-300 flex items-start gap-2.5">
          <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 font-mono font-semibold rounded shrink-0">
            Step {currentStep.stepIndex}
          </span>
          <p className="leading-relaxed">{currentStep.explanation}</p>
        </div>
      )}
    </div>
  );
};
