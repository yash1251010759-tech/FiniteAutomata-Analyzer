import React, { useState } from 'react';
import { AutomatonDefinition } from '../../types/automata';
import {
  convertNfaToDfa,
  convertEnfaToNfa,
  convertDfaToNfa,
  ConversionStepReport,
} from '../../algorithms/subsetConstruction';
import {
  convertMooreToMealy,
  convertMealyToMoore,
  MooreMealyConversionReport,
} from '../../algorithms/mooreMealySimulation';
import { AutomataCanvas } from '../canvas/AutomataCanvas';
import {
  GitFork,
  ArrowRight,
  CheckCircle2,
  Hammer,
  BookOpen,
  Layers,
  Sparkles,
  Play,
  RotateCcw,
  Sliders,
  HelpCircle,
  Minimize2,
} from 'lucide-react';
import { NavigationTab } from '../layout/Sidebar';
import { predefinedAutomata } from '../../data/predefinedExamples';
import { UniversalModelBuilder } from '../common/UniversalModelBuilder';
import { UniversalStringSimulator } from '../common/UniversalStringSimulator';
import { TermExplainerModal, TermKey } from '../common/TermExplainerModal';

interface ConversionLabViewProps {
  currentMachine: AutomatonDefinition;
  onLoadIntoBuilder: (machine: AutomatonDefinition) => void;
  onNavigate: (tab: NavigationTab) => void;
}

export type SupportedConversion =
  | 'NFA_TO_DFA'
  | 'ENFA_TO_DFA'
  | 'ENFA_TO_NFA'
  | 'DFA_TO_NFA'
  | 'MOORE_TO_MEALY'
  | 'MEALY_TO_MOORE';

export const ConversionLabView: React.FC<ConversionLabViewProps> = ({
  currentMachine,
  onLoadIntoBuilder,
  onNavigate,
}) => {
  const defaultNfa = predefinedAutomata.find(m => m.type === 'NFA') || currentMachine;
  const [sourceMachine, setSourceMachine] = useState<AutomatonDefinition>(defaultNfa);
  const [conversionType, setConversionType] = useState<SupportedConversion>('NFA_TO_DFA');
  const [isEditingMachine, setIsEditingMachine] = useState<boolean>(false);
  const [activeTermKey, setActiveTermKey] = useState<TermKey | null>(null);

  // Compute conversion result dynamically based on selection
  let subsetReport: ConversionStepReport | null = null;
  let transducerReport: MooreMealyConversionReport | null = null;
  let convertedMachine: AutomatonDefinition = sourceMachine;

  if (conversionType === 'NFA_TO_DFA' || conversionType === 'ENFA_TO_DFA') {
    subsetReport = convertNfaToDfa(sourceMachine);
    convertedMachine = subsetReport.resultMachine;
  } else if (conversionType === 'ENFA_TO_NFA') {
    subsetReport = convertEnfaToNfa(sourceMachine);
    convertedMachine = subsetReport.resultMachine;
  } else if (conversionType === 'DFA_TO_NFA') {
    subsetReport = convertDfaToNfa(sourceMachine);
    convertedMachine = subsetReport.resultMachine;
  } else if (conversionType === 'MOORE_TO_MEALY') {
    transducerReport = convertMooreToMealy(sourceMachine);
    convertedMachine = transducerReport.resultMachine;
  } else if (conversionType === 'MEALY_TO_MOORE') {
    transducerReport = convertMealyToMoore(sourceMachine);
    convertedMachine = transducerReport.resultMachine;
  }

  // Pre-filter examples appropriate for the selected conversion
  const getRelevantExamples = () => {
    if (conversionType === 'MOORE_TO_MEALY') {
      return predefinedAutomata.filter(m => m.type === 'MOORE');
    }
    if (conversionType === 'MEALY_TO_MOORE') {
      return predefinedAutomata.filter(m => m.type === 'MEALY');
    }
    if (conversionType === 'DFA_TO_NFA') {
      return predefinedAutomata.filter(m => m.type === 'DFA');
    }
    return predefinedAutomata.filter(m => m.type === 'NFA' || m.type === 'ENFA');
  };

  const relevantExamples = getRelevantExamples();

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white font-['Outfit'] flex items-center gap-2">
              <GitFork className="w-6 h-6 text-indigo-400" />
              <span>Automata Conversion Lab</span>
            </h2>
            <span className="px-2.5 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg">
              User-Driven Laboratory
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Convert user-defined finite automata and transducers mathematically using step-by-step algorithms
          </p>
        </div>

        {/* Source machine actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditingMachine(!isEditingMachine)}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
          >
            <Hammer className="w-4 h-4" />
            <span>{isEditingMachine ? 'Close Builder' : 'Create / Edit Machine'}</span>
          </button>

          <button
            onClick={() => setSourceMachine(currentMachine)}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
            title="Use machine currently on your canvas"
          >
            Use Active Machine
          </button>
        </div>
      </div>

      {/* Embedded Model Builder if user toggles custom creation */}
      {isEditingMachine && (
        <div className="p-1 bg-slate-950/60 rounded-3xl border border-indigo-500/30">
          <UniversalModelBuilder
            initialMachine={sourceMachine}
            onSave={newMachine => {
              setSourceMachine(newMachine);
              setIsEditingMachine(false);
            }}
            onCancel={() => setIsEditingMachine(false)}
          />
        </div>
      )}

      {/* Conversion Type Selector Menu */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 text-xs">
        <div className="flex items-center justify-between text-slate-400">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-cyan-400" /> Select Mathematical Conversion:
          </span>
          <button
            onClick={() => setActiveTermKey('transition')}
            className="text-slate-500 hover:text-cyan-400 flex items-center gap-1 text-[11px]"
          >
            <HelpCircle className="w-3.5 h-3.5" /> What are these?
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {[
            { id: 'NFA_TO_DFA', label: 'NFA → DFA', desc: 'Subset Construction' },
            { id: 'ENFA_TO_DFA', label: 'ε-NFA → DFA', desc: 'ε-Closure Powerset' },
            { id: 'ENFA_TO_NFA', label: 'ε-NFA → NFA', desc: 'ε-Bypass Mapping' },
            { id: 'DFA_TO_NFA', label: 'DFA → NFA', desc: 'Formal Embedding' },
            { id: 'MOORE_TO_MEALY', label: 'Moore → Mealy', desc: 'State to Transition' },
            { id: 'MEALY_TO_MOORE', label: 'Mealy → Moore', desc: 'State Splitting' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setConversionType(item.id as SupportedConversion)}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                conversionType === item.id
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-md scale-[1.02]'
                  : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
              }`}
            >
              <div className="font-bold text-xs">{item.label}</div>
              <div className="text-[10px] opacity-80 truncate">{item.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Examples Library Bar */}
      {relevantExamples.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto text-xs py-1">
          <span className="text-slate-400 shrink-0 font-medium">Load Preset Example:</span>
          {relevantExamples.map(ex => (
            <button
              key={ex.id}
              onClick={() => setSourceMachine(ex)}
              className={`px-3 py-1 rounded-xl border whitespace-nowrap transition-colors ${
                sourceMachine.id === ex.id
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
              }`}
            >
              {ex.name}
            </button>
          ))}
        </div>
      )}

      {/* Algorithmic Transformation Explanation Steps */}
      <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-400" />
          <span>Algorithmic Transformation Steps ({conversionType}):</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
          {(subsetReport?.explanation || transducerReport?.explanation || []).map((stepText, idx) => (
            <div
              key={idx}
              className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800 text-slate-300 leading-relaxed space-y-1"
            >
              <div className="font-bold text-cyan-300 font-mono text-[11px]">Step {idx + 1}</div>
              <div>{stepText}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Subset Construction Table (for NFA / ENFA -> DFA) */}
      {subsetReport && subsetReport.subsetRows.length > 0 && (
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Subset Construction Table (Powerset Representation)</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">
              {subsetReport.subsetRows.length} deterministic states generated
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-300 font-sans">
                  <th className="py-2.5 px-3">DFA State</th>
                  <th className="py-2.5 px-3">NFA Subset</th>
                  {convertedMachine.alphabet.map(sym => (
                    <th key={sym} className="py-2.5 px-3 text-indigo-400">
                      δ_DFA(S, '{sym}')
                    </th>
                  ))}
                  <th className="py-2.5 px-3">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {subsetReport.subsetRows.map(row => (
                  <tr key={row.dfaStateName} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-indigo-400">
                      {row.isStart ? '→ ' : ''}
                      {row.isFinal ? '* ' : ''}
                      {row.dfaStateName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-200">
                      {`{${row.nfaStates.join(', ') || '∅'}}`}
                    </td>
                    {convertedMachine.alphabet.map(sym => {
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
                          FINAL
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

      {/* Moore/Mealy Mapping Table */}
      {transducerReport && transducerReport.mappingRows.length > 0 && (
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <span>Transducer Mapping Table ({conversionType.replace(/_/g, ' ')})</span>
          </h3>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-300 font-sans">
                  <th className="py-2 px-3">Original Element</th>
                  <th className="py-2 px-3">Mapped Converted Element</th>
                  <th className="py-2 px-3">Output Produced</th>
                  <th className="py-2 px-3 font-sans">Rule Explanation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {transducerReport.mappingRows.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-900/60">
                    <td className="py-2 px-3 text-slate-300 font-semibold">{r.source}</td>
                    <td className="py-2 px-3 text-cyan-300 font-bold">{r.target}</td>
                    <td className="py-2 px-3 text-purple-300 font-bold">{r.output}</td>
                    <td className="py-2 px-3 text-slate-400 font-sans text-[11px]">{r.rule}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dual Side-by-Side Visual Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Source Canvas */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-800 text-slate-300 rounded">
                BEFORE
              </span>
              <h4 className="font-bold text-white text-xs">{sourceMachine.name}</h4>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {sourceMachine.states.length} states • {sourceMachine.type}
            </span>
          </div>

          <div className="h-64 rounded-2xl overflow-hidden border border-slate-800/80 bg-slate-950">
            <AutomataCanvas
              machine={sourceMachine}
              onChangeMachine={() => {}}
              isEditable={false}
            />
          </div>
        </div>

        {/* Converted Canvas */}
        <div className="p-4 bg-slate-900 border border-indigo-500/40 rounded-3xl space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded">
                AFTER (CONVERTED)
              </span>
              <h4 className="font-bold text-white text-xs">{convertedMachine.name}</h4>
            </div>
            <span className="text-[10px] font-mono text-cyan-400">
              {convertedMachine.states.length} states • {convertedMachine.type}
            </span>
          </div>

          <div className="h-64 rounded-2xl overflow-hidden border border-slate-800/80 bg-slate-950">
            <AutomataCanvas
              machine={convertedMachine}
              onChangeMachine={() => {}}
              isEditable={false}
            />
          </div>
        </div>
      </div>

      {/* Universal String Simulator on Converted Machine */}
      <UniversalStringSimulator
        model={{ type: 'FA', machine: convertedMachine }}
        title={`Interactive String Simulator on Converted ${convertedMachine.type}`}
        defaultInput={convertedMachine.alphabet.includes('b') ? 'abb' : '01'}
      />

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-5 bg-slate-900 border border-slate-800 rounded-3xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              onLoadIntoBuilder(convertedMachine);
              onNavigate('builder');
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors shadow-md shadow-emerald-500/10"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Load Converted Machine into Builder</span>
          </button>

          {convertedMachine.type === 'DFA' && (
            <button
              onClick={() => {
                onLoadIntoBuilder(convertedMachine);
                onNavigate('minimization');
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition-colors shadow-sm"
            >
              <Minimize2 className="w-4 h-4" />
              <span>Send to Minimization Lab</span>
            </button>
          )}

          <button
            onClick={() => {
              onLoadIntoBuilder(convertedMachine);
              onNavigate('simulator');
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-colors border border-slate-700"
          >
            <Play className="w-4 h-4 text-cyan-400" />
            <span>Open in Full Simulator</span>
          </button>
        </div>

        <button
          onClick={() => {
            const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(convertedMachine, null, 2));
            const dl = document.createElement('a');
            dl.setAttribute('href', dataStr);
            dl.setAttribute('download', `${convertedMachine.name.toLowerCase().replace(/\s+/g, '-')}.json`);
            dl.click();
          }}
          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
        >
          Export Converted JSON
        </button>
      </div>

      <TermExplainerModal
        termKey={activeTermKey}
        onClose={() => setActiveTermKey(null)}
      />
    </div>
  );
};
