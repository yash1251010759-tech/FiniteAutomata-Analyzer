import React from 'react';
import { SimulationResult } from '../../types/automata';
import { CheckCircle2, XCircle, ArrowRight, Info } from 'lucide-react';

interface SimulationPathTraceProps {
  simulationResult: SimulationResult | null;
  currentStepIndex: number;
  onSelectStep: (stepIndex: number) => void;
}

export const SimulationPathTrace: React.FC<SimulationPathTraceProps> = ({
  simulationResult,
  currentStepIndex,
  onSelectStep,
}) => {
  if (!simulationResult) {
    return (
      <div className="p-6 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">
        Enter an input string and click "Simulate String" to view the detailed step-by-step trace.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Detailed Explanation Banner */}
      <div
        className={`p-4 rounded-2xl border ${
          simulationResult.accepted
            ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-200'
            : 'bg-rose-950/30 border-rose-800/40 text-rose-200'
        }`}
      >
        <div className="flex items-start gap-3">
          {simulationResult.accepted ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <h4 className="text-sm font-bold flex items-center gap-2">
              <span>{simulationResult.accepted ? 'STRING ACCEPTED ✓' : 'STRING REJECTED ✗'}</span>
              <span className="text-xs font-normal opacity-80">
                ({simulationResult.totalSteps} computation step{simulationResult.totalSteps === 1 ? '' : 's'})
              </span>
            </h4>
            <p className="text-xs leading-relaxed opacity-90">{simulationResult.detailedReason}</p>
          </div>
        </div>
      </div>

      {/* Step by Step Execution Path List */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
          Computation Steps:
        </h4>
        <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
          {simulationResult.path.map((step, idx) => {
            const isCurrent = currentStepIndex === idx;

            return (
              <div
                key={idx}
                onClick={() => onSelectStep(idx)}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  isCurrent
                    ? 'bg-indigo-950/60 border-indigo-500/80 shadow-md shadow-indigo-950/50'
                    : 'bg-slate-900/60 hover:bg-slate-800/60 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                        isCurrent
                          ? 'bg-indigo-500 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      Step {step.stepIndex}
                    </span>
                    {step.symbol && (
                      <span className="text-slate-400 flex items-center gap-1 font-mono">
                        Read: <strong className="text-cyan-400">'{step.symbol}'</strong>
                      </span>
                    )}
                  </div>

                  <span className="font-mono text-[11px] text-slate-400">
                    Remaining: "{step.inputRemaining || 'ε'}"
                  </span>
                </div>

                <p className="text-slate-300 leading-relaxed font-sans">{step.explanation}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
