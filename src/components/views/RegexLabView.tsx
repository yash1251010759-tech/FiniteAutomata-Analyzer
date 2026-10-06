import React, { useState } from 'react';
import { regexToENFA, testRegexString } from '../../algorithms/regexToNfa';
import { convertFaToRegex, StateEliminationReport } from '../../algorithms/stateElimination';
import { convertEnfaToNfa, convertNfaToDfa } from '../../algorithms/subsetConstruction';
import { minimizeDFA } from '../../algorithms/dfaMinimization';
import { AutomatonDefinition } from '../../types/automata';
import { AutomataCanvas } from '../canvas/AutomataCanvas';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Hammer,
  BookOpen,
  Layers,
  HelpCircle,
  Play,
  RotateCcw,
  Sliders,
  Plus,
} from 'lucide-react';
import { NavigationTab } from '../layout/Sidebar';
import { UniversalStringSimulator } from '../common/UniversalStringSimulator';
import { TermExplainerModal, TermKey } from '../common/TermExplainerModal';

interface RegexLabViewProps {
  currentMachine: AutomatonDefinition;
  onLoadIntoBuilder: (machine: AutomatonDefinition) => void;
  onNavigate: (tab: NavigationTab) => void;
}

export type RegexTargetModel = 'ENFA' | 'NFA' | 'DFA' | 'MIN_DFA';

export const RegexLabView: React.FC<RegexLabViewProps> = ({
  currentMachine,
  onLoadIntoBuilder,
  onNavigate,
}) => {
  const [labMode, setLabMode] = useState<'REGEX_TO_FA' | 'FA_TO_REGEX'>('REGEX_TO_FA');
  const [regexInput, setRegexInput] = useState<string>('(a+b)*abb');
  const [targetModel, setTargetModel] = useState<RegexTargetModel>('ENFA');
  const [activeTermKey, setActiveTermKey] = useState<TermKey | null>(null);

  // State Elimination for FA -> Regex
  const [sourceFa, setSourceFa] = useState<AutomatonDefinition>(currentMachine);
  const [eliminationReport, setEliminationReport] = useState<StateEliminationReport>(() =>
    convertFaToRegex(currentMachine)
  );

  // Dynamically compute automaton across the entire pipeline:
  // Regex -> ε-NFA -> NFA -> DFA -> Minimized DFA
  const enfaMachine = regexToENFA(regexInput);
  const nfaReport = convertEnfaToNfa(enfaMachine);
  const dfaReport = convertNfaToDfa(enfaMachine);
  const minDfaReport = minimizeDFA(dfaReport.resultMachine);

  let activeGeneratedMachine: AutomatonDefinition = enfaMachine;
  let pipelineDescription = '';

  if (targetModel === 'ENFA') {
    activeGeneratedMachine = enfaMachine;
    pipelineDescription =
      "Thompson's Construction: Translates basic regex operations (literals, union |, concatenation ·, and Kleene star *) into ε-NFA fragments.";
  } else if (targetModel === 'NFA') {
    activeGeneratedMachine = nfaReport.resultMachine;
    pipelineDescription =
      'Epsilon Elimination: Bypasses spontaneous ε-transitions by taking ε-closures and computing direct character transitions.';
  } else if (targetModel === 'DFA') {
    activeGeneratedMachine = dfaReport.resultMachine;
    pipelineDescription =
      'Subset Construction (Powerset Algorithm): Converts nondeterministic branching subsets into deterministic DFA states.';
  } else if (targetModel === 'MIN_DFA') {
    activeGeneratedMachine = minDfaReport.minimizedMachine;
    pipelineDescription =
      'Hopcroft DFA Minimization: Detects indistinguishable equivalent states and produces the unique minimum canonical DFA.';
  }

  // Visual Regex helper buttons for beginners
  const handleAppendSymbol = (symbol: string) => {
    setRegexInput(prev => prev + symbol);
  };

  const handleRunStateElimination = () => {
    const rep = convertFaToRegex(sourceFa);
    setEliminationReport(rep);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white font-['Outfit'] flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-pink-400" />
              <span>Regular Expression Laboratory</span>
            </h2>
            <span className="px-2.5 py-0.5 text-[10px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30 rounded-lg">
              Kleene's Theorem Engine
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Bi-directional synthesis: Regex → ε-NFA → NFA → DFA → Minimized DFA & State Elimination (FA → Regex)
          </p>
        </div>

        {/* Direction Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-2xl text-xs">
          <button
            onClick={() => setLabMode('REGEX_TO_FA')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
              labMode === 'REGEX_TO_FA'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Regex → Automaton (Thompson)
          </button>
          <button
            onClick={() => {
              setLabMode('FA_TO_REGEX');
              handleRunStateElimination();
            }}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
              labMode === 'FA_TO_REGEX'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            FA → Regex (Arden's Rule)
          </button>
        </div>
      </div>

      {labMode === 'REGEX_TO_FA' ? (
        /* MODE 1: USER REGEX -> AUTOMATA PIPELINE */
        <div className="space-y-6">
          {/* Regex Input & Visual Helper Palette */}
          <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Enter Any Regular Expression:</span>
                <button
                  onClick={() => setActiveTermKey('alphabet')}
                  className="text-slate-500 hover:text-cyan-400"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                Supports: | or + (Union), * (Star), () (Grouping)
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                type="text"
                value={regexInput}
                onChange={e => setRegexInput(e.target.value)}
                placeholder="e.g. (a+b)*abb or (0|1)*01"
                className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-pink-500 shadow-inner"
              />
            </div>

            {/* Beginner Quick Insert Helper Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
              <span className="text-slate-400 font-medium mr-1">Visual Builder Chips:</span>
              <button
                onClick={() => handleAppendSymbol('a')}
                className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-lg font-mono"
              >
                + symbol 'a'
              </button>
              <button
                onClick={() => handleAppendSymbol('b')}
                className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-lg font-mono"
              >
                + symbol 'b'
              </button>
              <button
                onClick={() => handleAppendSymbol('|')}
                className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-purple-300 border border-slate-700/80 rounded-lg font-mono font-bold"
                title="Union (OR)"
              >
                + OR '|'
              </button>
              <button
                onClick={() => handleAppendSymbol('*')}
                className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-amber-300 border border-slate-700/80 rounded-lg font-mono font-bold"
                title="Kleene Star (0 or more times)"
              >
                + Star '*'
              </button>
              <button
                onClick={() => handleAppendSymbol('(a|b)*')}
                className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-slate-700/80 rounded-lg font-mono"
              >
                + '(a|b)*'
              </button>
              <button
                onClick={() => setRegexInput('')}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg text-[10px] ml-auto"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Pipeline Stage Selector */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-pink-400" /> Select Pipeline Stage Output:
              </span>
              <span className="text-[11px] text-cyan-400 font-mono">
                {activeGeneratedMachine.states.length} states • {activeGeneratedMachine.type}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'ENFA', label: '1. ε-NFA', sub: "Thompson's Construction" },
                { id: 'NFA', label: '2. NFA', sub: 'ε-Transition Elimination' },
                { id: 'DFA', label: '3. DFA', sub: 'Subset Construction' },
                { id: 'MIN_DFA', label: '4. Minimized DFA', sub: 'Hopcroft Reduction' },
              ].map(stg => (
                <button
                  key={stg.id}
                  onClick={() => setTargetModel(stg.id as RegexTargetModel)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    targetModel === stg.id
                      ? 'bg-pink-600 text-white border-pink-400 shadow-md scale-[1.02]'
                      : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <div className="font-bold text-xs">{stg.label}</div>
                  <div className="text-[10px] opacity-80 truncate">{stg.sub}</div>
                </button>
              ))}
            </div>

            <p className="text-[11px] text-slate-400 pt-1 leading-relaxed">
              💡 <span className="text-slate-300 font-semibold">Algorithm Note: </span>
              {pipelineDescription}
            </p>
          </div>

          {/* Canvas of Generated Automaton */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30 rounded">
                  {targetModel} VISUALIZATION
                </span>
                <h4 className="font-bold text-white text-xs">{activeGeneratedMachine.name}</h4>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Alphabet: {'{' + activeGeneratedMachine.alphabet.join(', ') + '}'}
              </span>
            </div>

            <div className="h-72 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
              <AutomataCanvas
                machine={activeGeneratedMachine}
                onChangeMachine={() => {}}
                isEditable={false}
              />
            </div>
          </div>

          {/* Universal String Simulator */}
          <UniversalStringSimulator
            model={{ type: 'FA', machine: activeGeneratedMachine }}
            title={`Test Strings against Generated ${targetModel}`}
            defaultInput={activeGeneratedMachine.alphabet.includes('b') ? 'abb' : '01'}
          />

          {/* Action Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-5 bg-slate-900 border border-slate-800 rounded-3xl">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onLoadIntoBuilder(activeGeneratedMachine);
                  onNavigate('builder');
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors shadow-md shadow-emerald-500/10"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Load {targetModel} into Builder Canvas</span>
              </button>

              <button
                onClick={() => {
                  onLoadIntoBuilder(activeGeneratedMachine);
                  onNavigate('conversion');
                }}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition-colors shadow-sm"
              >
                Send to Conversion Lab
              </button>
            </div>

            <button
              onClick={() => {
                const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(activeGeneratedMachine, null, 2));
                const dl = document.createElement('a');
                dl.setAttribute('href', dataStr);
                dl.setAttribute('download', `${activeGeneratedMachine.name.toLowerCase().replace(/\s+/g, '-')}.json`);
                dl.click();
              }}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700"
            >
              Export JSON
            </button>
          </div>
        </div>
      ) : (
        /* MODE 2: FA -> REGEX (STATE ELIMINATION) */
        <div className="space-y-6">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 font-['Outfit']">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span>State Elimination Algorithm (GNFA / Arden's Rule)</span>
              </h3>
              <button
                onClick={() => {
                  setSourceFa(currentMachine);
                  handleRunStateElimination();
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Re-calculate on Active Machine
              </button>
            </div>

            {/* Resulting Regex Callout */}
            <div className="p-5 bg-slate-950 border border-pink-500/30 rounded-2xl space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                Derived Equivalent Regular Expression:
              </span>
              <div className="text-lg font-bold text-pink-300 font-mono break-all">
                {eliminationReport.finalRegex}
              </div>
            </div>

            {/* Step-by-step Elimination Sequence */}
            <div className="space-y-2 pt-2 text-xs">
              <h4 className="font-bold text-slate-300 text-xs">Elimination Step Trace:</h4>
              <div className="space-y-2">
                {eliminationReport.steps.map((st, i) => (
                  <div key={i} className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                    <div className="font-bold text-cyan-300 font-mono text-[11px]">
                      Step {st.step}: Eliminate State '{st.eliminatedState}'
                    </div>
                    <p className="text-slate-300 leading-relaxed font-mono text-[11px]">
                      {st.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <TermExplainerModal
        termKey={activeTermKey}
        onClose={() => setActiveTermKey(null)}
      />
    </div>
  );
};
