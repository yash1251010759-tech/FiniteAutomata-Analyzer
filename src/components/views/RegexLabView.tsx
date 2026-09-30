import React, { useState } from 'react';
import { regexToENFA, testRegexString } from '../../algorithms/regexToNfa';
import { convertFaToRegex, StateEliminationReport } from '../../algorithms/stateElimination';
import { AutomatonDefinition } from '../../types/automata';
import { AutomataCanvas } from '../canvas/AutomataCanvas';
import { simulateAutomaton } from '../../algorithms/dfaSimulation';
import { Sparkles, ArrowRight, CheckCircle2, XCircle, Hammer, BookOpen, Layers } from 'lucide-react';
import { NavigationTab } from '../layout/Sidebar';

interface RegexLabViewProps {
  currentMachine: AutomatonDefinition;
  onLoadIntoBuilder: (machine: AutomatonDefinition) => void;
  onNavigate: (tab: NavigationTab) => void;
}

export const RegexLabView: React.FC<RegexLabViewProps> = ({
  currentMachine,
  onLoadIntoBuilder,
  onNavigate,
}) => {
  const [labMode, setLabMode] = useState<'REGEX_TO_FA' | 'FA_TO_REGEX'>('REGEX_TO_FA');

  // Mode 1: Regex -> FA state
  const [regexInput, setRegexInput] = useState<string>('(0+1)*01');
  const [generatedEnfa, setGeneratedEnfa] = useState<AutomatonDefinition>(() =>
    regexToENFA('(0+1)*01')
  );
  const [testString, setTestString] = useState<string>('00101');

  // Mode 2: FA -> Regex state
  const [eliminationReport, setEliminationReport] = useState<StateEliminationReport>(() =>
    convertFaToRegex(currentMachine)
  );

  const handleRunThompson = (r?: string) => {
    const val = r || regexInput;
    const nfa = regexToENFA(val);
    setGeneratedEnfa(nfa);
  };

  const handleRunStateElimination = () => {
    const rep = convertFaToRegex(currentMachine);
    setEliminationReport(rep);
  };

  const regexTestMatch = testRegexString(regexInput, testString);
  const nfaSimResult = simulateAutomaton(generatedEnfa, testString);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-['Outfit'] flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-pink-400" />
            <span>Regular Expression Laboratory</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Bi-directional synthesis: Thompson’s Construction (Regex → ε-NFA) & State Elimination (FA → Regex)
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl text-xs">
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
            FA → Regex (State Elimination)
          </button>
        </div>
      </div>

      {labMode === 'REGEX_TO_FA' ? (
        /* MODE 1: REGEX -> AUTOMATON */
        <div className="space-y-6">
          {/* Input & Presets */}
          <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-4 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                type="text"
                value={regexInput}
                onChange={e => setRegexInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRunThompson()}
                placeholder="Enter regex (e.g. (a+b)*abb or (0+1)*01)..."
                className="flex-1 px-4 py-3 bg-slate-950 border border-slate-700/80 rounded-2xl text-slate-100 font-mono text-sm focus:outline-none focus:border-pink-500 shadow-inner"
              />

              <button
                onClick={() => handleRunThompson()}
                className="px-6 py-3 bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-pink-600/30 transition-all shrink-0 active:scale-95"
              >
                Synthesize ε-NFA
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Standard Regex Examples:</span>
              {[
                '(0+1)*01',
                '(a+b)*abb',
                '0*1(01*0)*1',
                '(00+11)*',
                'a(b|c)*a',
              ].map(rx => (
                <button
                  key={rx}
                  onClick={() => {
                    setRegexInput(rx);
                    handleRunThompson(rx);
                  }}
                  className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 rounded-xl font-mono transition-colors"
                >
                  {rx}
                </button>
              ))}
            </div>
          </div>

          {/* Canvas & Live String Testing */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Generated Thompson ε-NFA</h3>
                <button
                  onClick={() => {
                    onLoadIntoBuilder(generatedEnfa);
                    onNavigate('builder');
                  }}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-1.5 transition-all"
                >
                  <Hammer className="w-3.5 h-3.5" />
                  <span>Edit in Builder</span>
                </button>
              </div>

              <div className="h-[480px] w-full">
                <AutomataCanvas
                  machine={generatedEnfa}
                  onChangeMachine={setGeneratedEnfa}
                  isEditable={false}
                />
              </div>
            </div>

            <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4 backdrop-blur-md">
              <h3 className="text-sm font-bold text-white">Live String Tester</h3>
              <p className="text-xs text-slate-400">
                Tests input against both the Regular Expression and generated ε-NFA
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Test String
                </label>
                <input
                  type="text"
                  value={testString}
                  onChange={e => setTestString(e.target.value)}
                  placeholder="Enter test string..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Regex Match:</span>
                  <span
                    className={`font-bold ${
                      regexTestMatch ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {regexTestMatch ? 'MATCHES ✓' : 'NO MATCH ✗'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">ε-NFA Simulation:</span>
                  <span
                    className={`font-bold ${
                      nfaSimResult.accepted ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {nfaSimResult.accepted ? 'ACCEPTED ✓' : 'REJECTED ✗'}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-950/70 border border-indigo-950 rounded-xl text-xs text-slate-400 leading-relaxed font-sans">
                💡 <strong>Thompson Construction Invariant:</strong> Every regex operator is translated into an atomic ε-NFA module with single entry and exit points, guaranteeing equivalence to the regular expression language.
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* MODE 2: FA -> REGEX (STATE ELIMINATION) */
        <div className="space-y-6">
          <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">
                  State Elimination Result for "{currentMachine.name}"
                </h3>
                <p className="text-xs text-slate-400">
                  Transformed into Generalized NFA (GNFA) and eliminated all intermediate states
                </p>
              </div>

              <button
                onClick={handleRunStateElimination}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
              >
                Recompute Elimination
              </button>
            </div>

            {/* Final Regular Expression Output Card */}
            <div className="p-5 bg-slate-950 border border-pink-900/50 rounded-2xl space-y-2">
              <span className="text-[11px] font-bold text-pink-400 uppercase tracking-wider block">
                Derived Regular Expression R:
              </span>
              <div className="text-lg sm:text-xl font-bold font-mono text-white p-3 bg-pink-950/20 rounded-xl border border-pink-900/30 overflow-x-auto">
                {eliminationReport.finalRegex || 'ε'}
              </div>
            </div>
          </div>

          {/* Elimination Steps Table */}
          <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-pink-400" />
              <span>Step-by-Step State Elimination Process</span>
            </h3>

            <div className="space-y-3">
              {eliminationReport.steps.map(step => (
                <div
                  key={step.step}
                  className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-pink-400 font-mono">
                      Step {step.step}: Eliminated State {step.eliminatedState}
                    </span>
                    <span className="text-slate-500 text-[10px]">
                      {step.transitionsUpdated.length} path(s) updated
                    </span>
                  </div>

                  <p className="text-slate-300 leading-relaxed font-sans">{step.explanation}</p>

                  {step.transitionsUpdated.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1 font-mono text-[11px]">
                      {step.transitionsUpdated.slice(0, 4).map((up, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-slate-900 text-slate-300 rounded border border-slate-800"
                        >
                          {up.from} → {up.to}: "{up.regex}"
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
