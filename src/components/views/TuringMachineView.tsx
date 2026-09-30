import React, { useState, useEffect } from 'react';
import { sampleTuringMachines, simulateTuringMachine } from '../../algorithms/turingMachine';
import { TMDefinition, TMStep } from '../../types/automata';
import { Binary, Play, Pause, RotateCcw, SkipBack, SkipForward, CheckCircle2, XCircle, ArrowUp } from 'lucide-react';

export const TuringMachineView: React.FC = () => {
  const [selectedTm, setSelectedTm] = useState<TMDefinition>(sampleTuringMachines[0]);
  const [inputTape, setInputTape] = useState<string>('1011');
  const [simResult, setSimResult] = useState<any>(() =>
    simulateTuringMachine(sampleTuringMachines[0], '1011')
  );
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speedMs, setSpeedMs] = useState<number>(500);

  const totalSteps = simResult?.steps.length || 0;
  const currentStep: TMStep | undefined = simResult?.steps[currentStepIdx];

  // Auto-play loop
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

  const handleRunSim = (str?: string, tm?: TMDefinition) => {
    const s = str !== undefined ? str : inputTape;
    const m = tm || selectedTm;
    const res = simulateTuringMachine(m, s);
    setSimResult(res);
    setCurrentStepIdx(0);
    setIsPlaying(false);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-['Outfit'] flex items-center gap-2">
            <Binary className="w-6 h-6 text-amber-400" />
            <span>Turing Machine Simulator</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Infinite tape Turing computation: read/write head, directional movement (L/R/S), and transition tracing
          </p>
        </div>

        {/* Machine Selector */}
        <div className="flex items-center gap-2">
          <select
            value={selectedTm.id}
            onChange={e => {
              const found = sampleTuringMachines.find(m => m.id === e.target.value);
              if (found) {
                setSelectedTm(found);
                const defaultStr = found.id === 'tm-binary-inc' ? '1011' : '0011';
                setInputTape(defaultStr);
                handleRunSim(defaultStr, found);
              }
            }}
            className="px-3 py-2 bg-slate-900 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl focus:outline-none focus:border-amber-500 cursor-pointer shadow-sm"
          >
            {sampleTuringMachines.map(m => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Description & Input Ribbon */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-4 backdrop-blur-md">
        <p className="text-xs text-slate-300 leading-relaxed font-sans">
          {selectedTm.description}
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="text"
            value={inputTape}
            onChange={e => setInputTape(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRunSim()}
            placeholder="Enter initial tape symbols..."
            className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-2xl text-slate-100 font-mono text-sm focus:outline-none focus:border-amber-500 shadow-inner"
          />

          <button
            onClick={() => handleRunSim()}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-2xl text-xs sm:text-sm shadow-lg shadow-amber-500/30 transition-all active:scale-95"
          >
            Simulate Turing Machine
          </button>
        </div>

        {/* Quick test buttons */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="text-slate-500 text-[11px] font-sans">Quick test:</span>
          {(selectedTm.id === 'tm-binary-inc'
            ? ['0', '1', '101', '1011', '1111']
            : ['01', '0011', '000111', '001', '011']
          ).map(sample => (
            <button
              key={sample}
              onClick={() => {
                setInputTape(sample);
                handleRunSim(sample);
              }}
              className="px-2.5 py-1 bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-700"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Infinite Tape Display */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-6 backdrop-blur-md">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Infinite Tape Window
            </span>
            {currentStep && (
              <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                State: {currentStep.stateId}
              </span>
            )}
          </div>

          <span className="text-xs font-mono text-slate-400">
            Head Index: {currentStep?.headIndex}
          </span>
        </div>

        {/* Tape Cells Grid with Head Indicator */}
        <div className="space-y-2 py-4">
          <div className="overflow-x-auto p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner">
            <div className="inline-flex items-center gap-1.5 min-w-full justify-center">
              {currentStep &&
                currentStep.tape.map((cell, idx) => {
                  const isHeadHere = idx === currentStep.headIndex;

                  return (
                    <div key={idx} className="flex flex-col items-center gap-2 shrink-0">
                      {/* Cell Box */}
                      <div
                        className={`w-11 h-12 rounded-xl flex items-center justify-center font-mono text-sm font-bold border transition-all ${
                          isHeadHere
                            ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-lg shadow-amber-500/40 scale-105'
                            : 'bg-slate-900 text-slate-200 border-slate-800'
                        }`}
                      >
                        {cell === 'B' ? '␣' : cell}
                      </div>

                      {/* Head Arrow */}
                      <div className="h-6 flex items-center justify-center">
                        {isHeadHere && (
                          <div className="flex flex-col items-center text-amber-400 animate-bounce">
                            <ArrowUp className="w-4 h-4" />
                            <span className="text-[9px] font-mono font-bold uppercase tracking-tighter">
                              HEAD
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Playback Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentStepIdx(0)}
              disabled={currentStepIdx === 0}
              className="p-2 text-slate-400 hover:text-white disabled:opacity-40 rounded-lg"
              title="Reset"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => currentStepIdx > 0 && setCurrentStepIdx(currentStepIdx - 1)}
              disabled={currentStepIdx === 0}
              className="p-2 text-slate-400 hover:text-white disabled:opacity-40 rounded-lg"
              title="Previous"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>
            <button
              onClick={() =>
                currentStepIdx < totalSteps - 1 && setCurrentStepIdx(currentStepIdx + 1)
              }
              disabled={currentStepIdx >= totalSteps - 1}
              className="p-2 text-slate-400 hover:text-white disabled:opacity-40 rounded-lg"
              title="Next"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Speed selector */}
            <div className="flex items-center gap-1.5 ml-2 text-xs text-slate-400 font-sans">
              <span>Speed:</span>
              <select
                value={speedMs}
                onChange={e => setSpeedMs(Number(e.target.value))}
                className="bg-slate-800 border border-slate-700 rounded-md px-1.5 py-1 text-slate-200 text-xs focus:outline-none"
              >
                <option value={900}>Slow</option>
                <option value={500}>Normal</option>
                <option value={200}>Fast</option>
                <option value={50}>Turbo</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {simResult && (
              <div
                className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                  simResult.status === 'ACCEPTED'
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                    : simResult.status === 'REJECTED'
                    ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                    : 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                }`}
              >
                {simResult.status === 'ACCEPTED' ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <XCircle className="w-3.5 h-3.5" />
                )}
                <span>{simResult.status}</span>
              </div>
            )}

            <span className="text-xs font-mono text-slate-400">
              Step {currentStepIdx} / {totalSteps > 0 ? totalSteps - 1 : 0}
            </span>
          </div>
        </div>

        {/* Current Step Description Box */}
        {currentStep && (
          <div className="p-3 bg-slate-950 border border-amber-950/60 rounded-xl text-xs text-slate-300 font-mono">
            {currentStep.actionDescription}
          </div>
        )}
      </div>

      {/* Transition History Step Log */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-3 backdrop-blur-md">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Transition History Log ({totalSteps} Steps)
        </h3>

        <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1 text-xs font-mono">
          {simResult.steps.map((st: any, idx: number) => {
            const isSelected = idx === currentStepIdx;

            return (
              <div
                key={idx}
                onClick={() => setCurrentStepIdx(idx)}
                className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-amber-950/60 border-amber-500/80 text-amber-200'
                    : 'bg-slate-950/60 hover:bg-slate-800/50 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-[11px]">
                    Step {st.stepIndex}
                  </span>
                  <span>{st.actionDescription}</span>
                </div>

                <span className="text-[11px] text-slate-500">
                  Head @ {st.headIndex}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
