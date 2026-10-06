import React, { useState, useEffect, useRef } from 'react';
import { generateAutomatonFromNaturalLanguage, GeneratedMachineReport } from '../../algorithms/naturalLanguageDfa';
import { generateAutomatonWithGemini, getStoredApiKey } from '../../services/geminiService';
import { AutomatonDefinition } from '../../types/automata';
import { AutomataCanvas } from '../canvas/AutomataCanvas';
import { simulateAutomaton } from '../../algorithms/dfaSimulation';
import { Sparkles, ArrowRight, CheckCircle2, XCircle, BookOpen, Hammer, Zap, X, Key, Bot, Cpu, AlertTriangle } from 'lucide-react';
import { NavigationTab } from '../layout/Sidebar';
import { GeminiSettingsModal } from '../modals/GeminiSettingsModal';

interface GeneratorViewProps {
  onLoadIntoBuilder: (machine: AutomatonDefinition) => void;
  onNavigate: (tab: NavigationTab) => void;
}

export const GeneratorView: React.FC<GeneratorViewProps> = ({
  onLoadIntoBuilder,
  onNavigate,
}) => {
  const [promptInput, setPromptInput] = useState<string>('Accept strings starting with 1');
  const [report, setReport] = useState<GeneratedMachineReport>(() =>
    generateAutomatonFromNaturalLanguage('Accept strings starting with 1')
  );
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [lastGeneratedPrompt, setLastGeneratedPrompt] = useState<string>('Accept strings starting with 1');
  const [engineMode, setEngineMode] = useState<'local' | 'gemini'>('local');
  const [apiKey, setApiKey] = useState<string>(() => getStoredApiKey());
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const samplePrompts = [
    'Accept strings starting with 1',
    'Accept strings starting with 0 and ending with 1',
    'Accept binary strings ending with 01',
    'Accept strings containing 101',
    'Accept strings not containing 00',
    'Accept strings having an even number of 1s',
    'Accept strings with both even 0s and even 1s',
    'Accept binary numbers divisible by 3',
    'Accept alternating 0s and 1s',
  ];

  const handleGenerate = async (customPrompt?: string, forceMode?: 'local' | 'gemini') => {
    const p = (customPrompt !== undefined ? customPrompt : promptInput).trim();
    if (!p) return;

    const currentMode = forceMode || engineMode;
    setIsGenerating(true);
    setGenerationError(null);

    try {
      if (currentMode === 'gemini') {
        if (!apiKey.trim()) {
          setIsSettingsModalOpen(true);
          setIsGenerating(false);
          return;
        }

        const aiReport = await generateAutomatonWithGemini(p, apiKey);
        setReport(aiReport);
        setLastGeneratedPrompt(p);
      } else {
        const localReport = generateAutomatonFromNaturalLanguage(p);
        setReport(localReport);
        setLastGeneratedPrompt(p);
      }
    } catch (err: any) {
      console.error('Generation error:', err);
      setGenerationError(err?.message || 'Error synthesizing automaton.');
      // Graceful fallback to local engine if Gemini fails
      if (currentMode === 'gemini') {
        try {
          const fallback = generateAutomatonFromNaturalLanguage(p);
          setReport(fallback);
          setLastGeneratedPrompt(p);
        } catch {
          // ignore
        }
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Real-time automatic generation as user types
  useEffect(() => {
    const trimmed = promptInput.trim();
    if (!trimmed || trimmed === lastGeneratedPrompt) {
      return;
    }

    if (trimmed.length < 3) {
      return;
    }

    setIsGenerating(true);
    // For local engine: fast 250ms debounce; for Gemini AI: 600ms debounce to avoid spamming API
    const debounceTime = engineMode === 'gemini' ? 650 : 250;

    const timer = setTimeout(() => {
      handleGenerate(trimmed);
    }, debounceTime);

    return () => clearTimeout(timer);
  }, [promptInput, lastGeneratedPrompt, engineMode, apiKey]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-bold text-white font-['Outfit'] flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-cyan-400" />
              <span>Natural Language to Automata Generator</span>
            </h2>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 rounded-full text-xs font-semibold">
              <Zap className="w-3 h-3 text-cyan-400 animate-pulse" />
              <span>Real-Time Synthesis</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Type any DFA requirement in plain English; our engine analyzes requirements and synthesizes a verified automaton live as you type.
          </p>
        </div>

        {/* Engine Selector & API Key Settings */}
        <div className="flex items-center gap-2 self-start md:self-center shrink-0">
          <div className="flex items-center bg-slate-950 p-1 border border-slate-800 rounded-2xl">
            <button
              onClick={() => setEngineMode('local')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                engineMode === 'local'
                  ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Local Engine</span>
            </button>

            <button
              onClick={() => {
                setEngineMode('gemini');
                if (!apiKey.trim()) {
                  setIsSettingsModalOpen(true);
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                engineMode === 'gemini'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Gemini AI</span>
            </button>
          </div>

          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className={`p-2 rounded-2xl border transition-all flex items-center gap-1.5 text-xs font-medium cursor-pointer ${
              apiKey
                ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-300 hover:bg-emerald-900/50'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
            }`}
            title={apiKey ? 'Gemini API Key configured' : 'Configure Gemini API Key'}
          >
            <Key className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{apiKey ? 'Key Set' : 'Set Key'}</span>
            <span
              className={`w-2 h-2 rounded-full ${apiKey ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-amber-400'}`}
            />
          </button>
        </div>
      </div>

      {/* Error alert banner */}
      {generationError && (
        <div className="p-3.5 bg-rose-950/60 border border-rose-800/80 rounded-2xl text-xs text-rose-200 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{generationError}</span>
            {engineMode === 'gemini' && (
              <span className="text-slate-400">(Switched to local algorithmic fallback)</span>
            )}
          </div>
          <button
            onClick={() => setGenerationError(null)}
            className="p-1 text-rose-300 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Input & Presets */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-4 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={promptInput}
              onChange={e => setPromptInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleGenerate()}
              placeholder={
                engineMode === 'gemini'
                  ? 'e.g. Accept strings that starts with 1 or any complex requirement...'
                  : 'e.g. Accept strings that starts with 1...'
              }
              className="w-full pl-4 pr-10 py-3 bg-slate-950 border border-slate-700/80 rounded-2xl text-slate-100 text-sm font-sans focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 shadow-inner transition-all"
            />
            {promptInput && (
              <button
                type="button"
                onClick={() => {
                  setPromptInput('');
                  inputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={() => handleGenerate()}
            className={`px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95 cursor-pointer text-white ${
              engineMode === 'gemini'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-purple-600/30'
                : 'bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 shadow-cyan-600/30'
            }`}
          >
            {isGenerating ? (
              <Zap className="w-4 h-4 animate-spin text-cyan-200" />
            ) : engineMode === 'gemini' ? (
              <Bot className="w-4 h-4" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>{isGenerating ? 'Synthesizing...' : engineMode === 'gemini' ? 'Gemini AI Generate' : 'Generate Automaton'}</span>
          </button>
        </div>

        {/* Status line */}
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block w-2 h-2 rounded-full animate-pulse ${
                engineMode === 'gemini' ? 'bg-purple-400' : 'bg-emerald-400'
              }`}
            />
            <span>
              {isGenerating ? (
                <span className="text-cyan-300 font-medium">
                  {engineMode === 'gemini' ? 'Gemini AI is analyzing and synthesizing DFA...' : 'Auto-synthesizing automaton live...'}
                </span>
              ) : (
                <span>
                  Using <b>{engineMode === 'gemini' ? 'Gemini AI Engine' : 'Local Algorithmic Engine'}</b> • Real-time updates active
                </span>
              )}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 hidden md:inline">
            Press <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-300">Enter</kbd> to force regenerate
          </span>
        </div>

        {/* Preset prompt buttons */}
        <div className="flex flex-wrap items-center gap-2 text-xs pt-1 border-t border-slate-800/60">
          <span className="text-slate-500 font-medium">Quick examples:</span>
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                setPromptInput(p);
                handleGenerate(p);
              }}
              className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 rounded-xl transition-colors cursor-pointer"
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
                Formal 5-Tuple Definition:
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
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
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

      {/* Gemini Settings Modal */}
      <GeminiSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentApiKey={apiKey}
        onApiKeySaved={newKey => {
          setApiKey(newKey);
          if (newKey) {
            setEngineMode('gemini');
          }
        }}
      />
    </div>
  );
};
