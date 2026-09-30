import React, { useState } from 'react';
import { generateAutomatonFromNaturalLanguage, GeneratedMachineReport } from '../../algorithms/naturalLanguageDfa';
import { AutomatonDefinition } from '../../types/automata';
import { AutomataCanvas } from '../canvas/AutomataCanvas';
import { simulateAutomaton } from '../../algorithms/dfaSimulation';
import { Sparkles, ArrowRight, CheckCircle2, XCircle, BookOpen, Hammer, RefreshCw } from 'lucide-react';
import { NavigationTab } from '../layout/Sidebar';

interface GeneratorViewProps {
  onLoadIntoBuilder: (machine: AutomatonDefinition) => void;
  onNavigate: (tab: NavigationTab) => void;
}

export const GeneratorView: React.FC<GeneratorViewProps> = ({
  onLoadIntoBuilder,
  onNavigate,
}) => {
  const [promptInput, setPromptInput] = useState<string>('Accept binary strings ending with 01');
  const [report, setReport] = useState<GeneratedMachineReport>(() =>
    generateAutomatonFromNaturalLanguage('Accept binary strings ending with 01')
  );

  const samplePrompts = [
    'Accept binary strings ending with 01',
    'Accept strings containing 101',
    'Accept strings having an even number of 1s',
    'Accept binary numbers divisible by 3',
    'Accept strings starting with 10',
    'Accept binary numbers divisible by 4',
    'Accept strings with an odd number of 0s',
  ];

  const handleGenerate = (customPrompt?: string) => {
    const p = customPrompt || promptInput;
    const generated = generateAutomatonFromNaturalLanguage(p);
    setReport(generated);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white font-['Outfit'] flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-cyan-400" />
          <span>Natural Language to Automata Generator</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Enter an English language specification; our engine analyzes requirements, derives state invariants, and synthesizes a verified DFA
        </p>
      </div>

      {/* Input & Presets */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-4 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="text"
            value={promptInput}
            onChange={e => setPromptInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleGenerate()}
            placeholder="e.g. Accept binary strings ending with 01..."
            className="flex-1 px-4 py-3 bg-slate-950 border border-slate-700/80 rounded-2xl text-slate-100 text-sm font-sans focus:outline-none focus:border-cyan-500 shadow-inner"
          />

          <button
            onClick={() => handleGenerate()}
            className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-cyan-600/30 transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Automaton</span>
          </button>
        </div>

        {/* Preset prompt buttons */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Try standard problems:</span>
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                setPromptInput(p);
                handleGenerate(p);
              }}
              className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 rounded-xl transition-colors"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Synthesis Breakdown & Visual Automaton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Analysis & State Meanings (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Analysis Card */}
          <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-lg">
                Pattern: {report.patternType}
              </span>
              <span className="text-xs font-mono text-slate-400">
                Σ = {`{${report.identifiedAlphabet.join(', ')}}`}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300">
              <h4 className="font-bold text-white flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                <span>Mathematical Requirement Analysis</span>
              </h4>
              <p className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 leading-relaxed font-sans">
                {report.analysis}
              </p>
            </div>

            {/* State Meanings & Invariants */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Synthesized State Invariants:
              </h4>
              <div className="space-y-1.5">
                {report.stateExplanations.map((exp, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-850 flex items-start gap-2 text-xs"
                  >
                    <span className="px-2 py-0.5 font-mono font-bold bg-indigo-500/20 text-indigo-300 rounded shrink-0">
                      {exp.stateLabel}
                    </span>
                    <span className="text-slate-300 leading-relaxed font-sans">{exp.meaning}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Formal 5-Tuple Definition */}
            <div className="p-3.5 bg-slate-950 rounded-2xl border border-indigo-950/70 text-xs font-mono space-y-1 text-indigo-200">
              <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider mb-1">
                Formal 5-Tuple:
              </div>
              <div>Q = {report.formalTuple.Q}</div>
              <div>Σ = {report.formalTuple.Sigma}</div>
              <div>q0 = {report.formalTuple.q0}</div>
              <div>F = {report.formalTuple.F}</div>
            </div>
          </div>

          {/* Test Suite Verification Table */}
          <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Automated Acceptance Verification:
            </h4>
            <div className="space-y-1.5">
              {report.sampleTests.map((t, idx) => {
                const res = simulateAutomaton(report.machine, t.input);
                const passed = res.accepted === t.expected;

                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs font-mono"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-slate-300">
                        "{t.input === '' ? 'ε' : t.input}"
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Expected: {t.expected ? 'ACCEPT' : 'REJECT'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {passed ? (
                        <span className="flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>PASS</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-rose-400 font-bold text-[11px]">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>FAIL</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Graph & Transfer (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Synthesized Automaton Preview</h3>
            <button
              onClick={() => {
                onLoadIntoBuilder(report.machine);
                onNavigate('builder');
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
            >
              <Hammer className="w-3.5 h-3.5" />
              <span>Edit in Automata Builder</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-[520px] w-full">
            <AutomataCanvas
              machine={report.machine}
              onChangeMachine={updated => setReport({ ...report, machine: updated })}
              isEditable={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
