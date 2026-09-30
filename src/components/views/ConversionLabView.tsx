import React, { useState } from 'react';
import { AutomatonDefinition } from '../../types/automata';
import { convertNfaToDfa, convertEnfaToNfa, ConversionStepReport } from '../../algorithms/subsetConstruction';
import { AutomataCanvas } from '../canvas/AutomataCanvas';
import { GitFork, ArrowRight, CheckCircle2, Hammer, BookOpen, Layers } from 'lucide-react';
import { NavigationTab } from '../layout/Sidebar';
import { predefinedAutomata } from '../../data/predefinedExamples';

interface ConversionLabViewProps {
  currentMachine: AutomatonDefinition;
  onLoadIntoBuilder: (machine: AutomatonDefinition) => void;
  onNavigate: (tab: NavigationTab) => void;
}

export const ConversionLabView: React.FC<ConversionLabViewProps> = ({
  currentMachine,
  onLoadIntoBuilder,
  onNavigate,
}) => {
  // Use current machine or fallback to an NFA example
  const defaultNfa = predefinedAutomata.find(m => m.type === 'NFA') || currentMachine;
  const [sourceMachine, setSourceMachine] = useState<AutomatonDefinition>(defaultNfa);
  const [conversionType, setConversionType] = useState<'NFA_TO_DFA' | 'ENFA_TO_NFA'>('NFA_TO_DFA');

  // Compute conversion
  const report: ConversionStepReport =
    conversionType === 'ENFA_TO_NFA'
      ? convertEnfaToNfa(sourceMachine)
      : convertNfaToDfa(sourceMachine);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Header with Type selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-['Outfit'] flex items-center gap-2">
            <GitFork className="w-6 h-6 text-indigo-400" />
            <span>Automata Conversion Lab</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Step-by-step subset construction (Powerset algorithm) and ε-transition elimination
          </p>
        </div>

        <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-2xl text-xs">
          <button
            onClick={() => setConversionType('NFA_TO_DFA')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
              conversionType === 'NFA_TO_DFA'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            NFA → DFA (Subset Construction)
          </button>
          <button
            onClick={() => setConversionType('ENFA_TO_NFA')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
              conversionType === 'ENFA_TO_NFA'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ε-NFA → NFA (ε-Bypass)
          </button>
        </div>
      </div>

      {/* Overview & Algorithm Explanation */}
      <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-400" />
          <span>Algorithmic Transformation Steps:</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
          {report.explanation.map((stepText, idx) => (
            <div
              key={idx}
              className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-slate-300 leading-relaxed"
            >
              {stepText}
            </div>
          ))}
        </div>
      </div>

      {/* Subset Construction Table (if NFA -> DFA) */}
      {conversionType === 'NFA_TO_DFA' && report.subsetRows.length > 0 && (
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Subset Construction Table (Powerset States)</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">
              {report.subsetRows.length} deterministic states generated
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-300 font-sans">
                  <th className="py-2.5 px-3">DFA State</th>
                  <th className="py-2.5 px-3">NFA State Subset</th>
                  {report.resultMachine.alphabet.map(sym => (
                    <th key={sym} className="py-2.5 px-3 text-indigo-400">
                      δ_DFA(S, '{sym}')
                    </th>
                  ))}
                  <th className="py-2.5 px-3">Accepting?</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {report.subsetRows.map(row => (
                  <tr key={row.dfaStateName} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-indigo-400">
                      {row.isStart ? '→' : ''}
                      {row.isFinal ? '*' : ''}
                      {row.dfaStateName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-200">
                      {`{${row.nfaStates.join(', ') || '∅'}}`}
                    </td>
                    {report.resultMachine.alphabet.map(sym => {
                      const t = row.transitions[sym];
                      return (
                        <td key={sym} className="py-2.5 px-3 text-slate-300">
                          {t ? (
                            <span>
                              <strong className="text-white">{t.targetName}</strong>{' '}
                              <span className="text-slate-500 text-[10px]">
                                ({`{${t.targetSubset.join(',')}}`})
                              </span>
                            </span>
                          ) : (
                            '∅'
                          )}
                        </td>
                      );
                    })}
                    <td className="py-2.5 px-3 font-sans">
                      {row.isFinal ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-500/20 text-purple-300 rounded border border-purple-500/30">
                          FINAL (Contains NFA final)
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Non-final</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Side-by-Side Visual Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source Automaton */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Original Machine ({sourceMachine.type})</span>
              <span className="text-xs font-mono text-slate-500">
                {sourceMachine.states.length} states
              </span>
            </h3>
          </div>
          <div className="h-[400px] w-full">
            <AutomataCanvas
              machine={sourceMachine}
              onChangeMachine={setSourceMachine}
              isEditable={false}
            />
          </div>
        </div>

        {/* Converted Automaton */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="text-emerald-400">Converted Machine ({report.resultMachine.type})</span>
              <span className="text-xs font-mono text-slate-500">
                {report.resultMachine.states.length} states
              </span>
            </h3>

            <button
              onClick={() => {
                onLoadIntoBuilder(report.resultMachine);
                onNavigate('builder');
              }}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-1.5 transition-all"
            >
              <Hammer className="w-3.5 h-3.5" />
              <span>Load in Builder</span>
            </button>
          </div>
          <div className="h-[400px] w-full">
            <AutomataCanvas
              machine={report.resultMachine}
              onChangeMachine={() => {}}
              isEditable={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
