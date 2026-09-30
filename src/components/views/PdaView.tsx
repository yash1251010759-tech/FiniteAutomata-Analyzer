import React, { useState, useEffect } from 'react';
import { samplePDAs, simulatePDA } from '../../algorithms/pda';
import { PDADefinition, PDAStep } from '../../types/automata';
import { Layers, Play, Pause, RotateCcw, SkipBack, SkipForward, CheckCircle2, XCircle, ArrowUp } from 'lucide-react';

export const PdaView: React.FC = () => {
  const [selectedPda, setSelectedPda] = useState<PDADefinition>(samplePDAs[0]);
  const [inputString, setInputString] = useState<string>('0011');
  const [simResult, setSimResult] = useState<any>(() =>
    simulatePDA(samplePDAs[0], '0011')
  );
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const totalSteps = simResult?.steps.length || 0;
  const currentStep: PDAStep | undefined = simResult?.steps[currentStepIdx];

  // Auto-play loop
  useEffect(() => {
    let timer: any;
    if (isPlaying && totalSteps > 0) {
      if (currentStepIdx < totalSteps - 1) {
        timer = setTimeout(() => {
          setCurrentStepIdx(prev => prev + 1);
        }, 800);
      } else {
        setIsPlaying(false);
      }
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIdx, totalSteps]);

  const handleRunSim = (str?: string, pda?: PDADefinition) => {
    const s = str !== undefined ? str : inputString;
    const p = pda || selectedPda;
    const res = simulatePDA(p, s);
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
            <Layers className="w-6 h-6 text-emerald-400" />
            <span>Pushdown Automata (PDA) Visualizer</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Interactive LIFO stack memory visualizer with instantaneous descriptions (q, w, γ)
          </p>
        </div>

        {/* PDA Selector */}
        <div className="flex items-center gap-2">
          <select
            value={selectedPda.id}
            onChange={e => {
              const found = samplePDAs.find(p => p.id === e.target.value);
              if (found) {
                setSelectedPda(found);
                const defaultStr = found.id === 'pda-0n1n' ? '0011' : '((()))';
                setInputString(defaultStr);
                handleRunSim(defaultStr, found);
              }
            }}
            className="px-3 py-2 bg-slate-900 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl focus:outline-none focus:border-emerald-500 cursor-pointer shadow-sm"
          >
            {samplePDAs.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Input Ribbon & Description */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-4 backdrop-blur-md">
        <p className="text-xs text-slate-300 leading-relaxed font-sans">
          {selectedPda.description}
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="text"
            value={inputString}
            onChange={e => setInputString(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRunSim()}
            placeholder="Enter input string (e.g. 0011 or (()))..."
            className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-2xl text-slate-100 font-mono text-sm focus:outline-none focus:border-emerald-500 shadow-inner"
          />

          <button
            onClick={() => handleRunSim()}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-2xl text-xs sm:text-sm shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
          >
            Simulate PDA
          </button>
        </div>

        {/* Quick test buttons */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="text-slate-500 text-[11px] font-sans">Quick test:</span>
          {(selectedPda.id === 'pda-0n1n'
            ? ['01', '0011', '000111', '011', '001']
            : ['()', '(())', '()()', '((()))', '(()']
          ).map(sample => (
            <button
              key={sample}
              onClick={() => {
                setInputString(sample);
                handleRunSim(sample);
              }}
              className="px-2.5 py-1 bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-700"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {/* Main Execution Arena (Stack Visualizer & Step Log) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Animated Stack Tower & Instantaneous State (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Current Configuration: (q, w, γ)</span>
            </h3>

            {currentStep && (
              <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
                State: {currentStep.stateId}
              </span>
            )}
          </div>

          {/* Instantaneous Description Pill */}
          {currentStep && (
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-mono text-center space-y-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                Instantaneous Description (ID)
              </span>
              <div className="text-sm font-bold text-emerald-400">
                ({currentStep.stateId}, "{currentStep.remainingInput || 'ε'}", [
                {currentStep.stack.join(', ')}])
              </div>
            </div>
          )}

          {/* Visual Stack Tower */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-2">
              <span>Stack Top (LIFO)</span>
              <span>Height: {currentStep?.stack.length || 0}</span>
            </div>

            <div className="w-48 mx-auto h-[280px] bg-slate-950/90 border-x-2 border-b-2 border-emerald-500/60 rounded-b-2xl p-2 flex flex-col-reverse gap-1.5 overflow-hidden shadow-inner relative">
              {currentStep && currentStep.stack.length > 0 ? (
                currentStep.stack.map((sym, idx) => {
                  const isTop = idx === currentStep.stack.length - 1;
                  return (
                    <div
                      key={idx}
                      className={`h-9 rounded-xl flex items-center justify-between px-4 font-mono text-xs font-bold transition-all ${
                        isTop
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30 animate-pulse'
                          : 'bg-slate-850 text-slate-200 border border-slate-750'
                      }`}
                    >
                      <span>[{sym}]</span>
                      {isTop && <span className="text-[10px] uppercase font-bold">TOP</span>}
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex items-center justify-center text-slate-600 text-xs italic">
                  Stack Empty
                </div>
              )}
            </div>
          </div>

          {/* Step Controls */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentStepIdx(0)}
                disabled={currentStepIdx === 0}
                className="p-2 text-slate-400 hover:text-white disabled:opacity-40 rounded-lg"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => currentStepIdx > 0 && setCurrentStepIdx(currentStepIdx - 1)}
                disabled={currentStepIdx === 0}
                className="p-2 text-slate-400 hover:text-white disabled:opacity-40 rounded-lg"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>
              <button
                onClick={() =>
                  currentStepIdx < totalSteps - 1 && setCurrentStepIdx(currentStepIdx + 1)
                }
                disabled={currentStepIdx >= totalSteps - 1}
                className="p-2 text-slate-400 hover:text-white disabled:opacity-40 rounded-lg"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            <span className="text-xs font-mono text-slate-400">
              Step {currentStepIdx} / {totalSteps > 0 ? totalSteps - 1 : 0}
            </span>
          </div>
        </div>

        {/* Right: Step Explanation Log & Acceptance Status (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 backdrop-blur-md">
          {/* Acceptance Outcome Banner */}
          <div
            className={`p-4 rounded-2xl border ${
              simResult.accepted
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                : 'bg-rose-950/40 border-rose-800/60 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm">
              {simResult.accepted ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-400" />
              )}
              <span>{simResult.accepted ? 'STRING ACCEPTED ✓' : 'STRING REJECTED ✗'}</span>
            </div>
            <p className="text-xs leading-relaxed mt-1 opacity-90">{simResult.reason}</p>
          </div>

          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Step-by-Step Transition Log:
          </h3>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {simResult.steps.map((st: any, idx: number) => {
              const isSelected = idx === currentStepIdx;

              return (
                <div
                  key={idx}
                  onClick={() => setCurrentStepIdx(idx)}
                  className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-emerald-950/60 border-emerald-500/80 shadow-md'
                      : 'bg-slate-950/60 hover:bg-slate-800/50 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                        isSelected
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      Step {st.stepIndex}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      Remaining: "{st.remainingInput || 'ε'}"
                    </span>
                  </div>
                  <p className="leading-relaxed font-sans">{st.explanation}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
