import React, { useState } from 'react';
import { AutomatonDefinition } from '../../types/automata';
import { exploreLanguage, generateRandomTests, StringTestResult } from '../../algorithms/languageExplorer';
import { Compass, Sparkles, CheckCircle2, XCircle, Play, Sliders, ArrowRight } from 'lucide-react';

interface LanguageExplorerViewProps {
  machine: AutomatonDefinition;
}

export const LanguageExplorerView: React.FC<LanguageExplorerViewProps> = ({ machine }) => {
  const [maxLength, setMaxLength] = useState<number>(4);
  const [activeTab, setActiveTab] = useState<'SYSTEMATIC' | 'RANDOM'>('SYSTEMATIC');
  const [selectedResult, setSelectedResult] = useState<StringTestResult | null>(null);

  // Systematic exploration
  const exploration = exploreLanguage(machine, maxLength, 100);

  // Random tests
  const [randomCount, setRandomCount] = useState<number>(12);
  const [randomFilter, setRandomFilter] = useState<'MIXED' | 'ACCEPTED_ONLY' | 'REJECTED_ONLY'>('MIXED');
  const [randomTests, setRandomTests] = useState<StringTestResult[]>(() =>
    generateRandomTests(machine, 12, 6, 'MIXED')
  );

  const handleRegenerateRandom = () => {
    const tests = generateRandomTests(machine, randomCount, 6, randomFilter);
    setRandomTests(tests);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-['Outfit'] flex items-center gap-2">
            <Compass className="w-6 h-6 text-cyan-400" />
            <span>Language Explorer & Test Suite Generator</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Systematically enumerate the language of "{machine.name}" or generate randomized test suites
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl text-xs">
          <button
            onClick={() => setActiveTab('SYSTEMATIC')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
              activeTab === 'SYSTEMATIC'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Systematic Exploration
          </button>
          <button
            onClick={() => setActiveTab('RANDOM')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
              activeTab === 'RANDOM'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Random Test Suite
          </button>
        </div>
      </div>

      {activeTab === 'SYSTEMATIC' ? (
        /* SYSTEMATIC EXPLORATION */
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-400">Max String Length (L):</span>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map(len => (
                  <button
                    key={len}
                    onClick={() => setMaxLength(len)}
                    className={`w-8 h-8 rounded-xl font-mono text-xs font-bold transition-all ${
                      maxLength === len
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {len}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="text-slate-400">
                Tested: <strong className="text-white">{exploration.totalTested}</strong> strings
              </span>
              <span className="text-slate-400">
                Accepted: <strong className="text-emerald-400">{exploration.acceptedStrings.length}</strong>
              </span>
              <span className="text-slate-400">
                Acceptance Rate: <strong className="text-cyan-400">{exploration.acceptanceRate}%</strong>
              </span>
            </div>
          </div>

          {/* Two-Column Display: Accepted vs Rejected */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Accepted Strings Card */}
            <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Accepted Strings ({exploration.acceptedStrings.length})</span>
                </h3>
                <span className="text-xs text-slate-500 font-mono">w ∈ L(M)</span>
              </div>

              <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
                {exploration.acceptedStrings.length === 0 ? (
                  <div className="p-4 text-center text-slate-500 text-xs italic">
                    No strings accepted up to length {maxLength}.
                  </div>
                ) : (
                  exploration.acceptedStrings.map((res, i) => (
                    <div
                      key={i}
                      onClick={() => setSelectedResult(res)}
                      className={`p-2.5 rounded-xl border text-xs font-mono cursor-pointer transition-all flex items-center justify-between ${
                        selectedResult?.input === res.input
                          ? 'bg-emerald-950/60 border-emerald-500/80 text-emerald-300'
                          : 'bg-slate-950/70 hover:bg-slate-800/60 border-slate-800/80 text-slate-300'
                      }`}
                    >
                      <span>"{res.displayInput}"</span>
                      <span className="text-[10px] text-slate-500">|w| = {res.length}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Rejected Strings Card */}
            <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-rose-400" />
                  <span>Rejected Strings ({exploration.rejectedStrings.length})</span>
                </h3>
                <span className="text-xs text-slate-500 font-mono">w ∉ L(M)</span>
              </div>

              <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
                {exploration.rejectedStrings.map((res, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedResult(res)}
                    className={`p-2.5 rounded-xl border text-xs font-mono cursor-pointer transition-all flex items-center justify-between ${
                      selectedResult?.input === res.input
                        ? 'bg-rose-950/60 border-rose-500/80 text-rose-300'
                        : 'bg-slate-950/70 hover:bg-slate-800/60 border-slate-800/80 text-slate-300'
                    }`}
                  >
                    <span>"{res.displayInput}"</span>
                    <span className="text-[10px] text-slate-500">|w| = {res.length}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* RANDOM TEST SUITE */
        <div className="space-y-6">
          <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-400">Filter Mode:</span>
                <select
                  value={randomFilter}
                  onChange={e => setRandomFilter(e.target.value as any)}
                  className="px-3 py-1.5 bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl focus:outline-none"
                >
                  <option value="MIXED">Mixed (Accepted + Rejected)</option>
                  <option value="ACCEPTED_ONLY">Accepted Only</option>
                  <option value="REJECTED_ONLY">Rejected Only</option>
                </select>
              </div>

              <button
                onClick={handleRegenerateRandom}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Regenerate Test Cases</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {randomTests.map((t, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedResult(t)}
                className={`p-3.5 rounded-2xl border text-xs font-mono cursor-pointer transition-all space-y-1.5 ${
                  t.accepted
                    ? 'bg-emerald-950/20 border-emerald-900/40 hover:border-emerald-500/50 text-emerald-200'
                    : 'bg-rose-950/20 border-rose-900/40 hover:border-rose-500/50 text-rose-200'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="text-white">"{t.displayInput}"</span>
                  <span>{t.accepted ? 'ACCEPT ✓' : 'REJECT ✗'}</span>
                </div>
                <div className="text-[10px] text-slate-400 font-sans line-clamp-1">
                  {t.simulation.detailedReason}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected String Execution Trace Modal / Detail */}
      {selectedResult && (
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Simulation Trace for "{selectedResult.displayInput}"</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  selectedResult.accepted
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {selectedResult.accepted ? 'ACCEPTED ✓' : 'REJECTED ✗'}
              </span>
            </h3>

            <button
              onClick={() => setSelectedResult(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>

          <p className="text-xs text-slate-300 font-sans leading-relaxed">
            {selectedResult.simulation.detailedReason}
          </p>

          <div className="space-y-1 text-xs font-mono">
            {selectedResult.simulation.path.map(st => (
              <div
                key={st.stepIndex}
                className="p-2 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between"
              >
                <span>
                  Step {st.stepIndex}: {st.explanation}
                </span>
                <span className="text-[10px] text-slate-500">
                  Remaining: "{st.inputRemaining || 'ε'}"
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
