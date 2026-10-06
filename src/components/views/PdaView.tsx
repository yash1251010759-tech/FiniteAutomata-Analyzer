import React, { useState, useEffect } from 'react';
import { samplePDAs, simulatePDA, PDASimulationResult } from '../../algorithms/pda';
import { PDADefinition, PDAStep, PDATransition, StateNode } from '../../types/automata';
import {
  Layers,
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Sliders,
  ArrowRight,
} from 'lucide-react';

const EXTENDED_SAMPLE_PDAS: PDADefinition[] = [
  ...samplePDAs,
  {
    id: 'pda-wcwR',
    name: 'PDA: Palindromes with Center Marker (w c w^R)',
    description: 'Pushes symbols before marker "c" onto stack; pops and verifies matching symbols in reverse after "c".',
    states: [
      { id: 'q0', label: 'q0', x: 100, y: 150, isStart: true },
      { id: 'q1', label: 'q1', x: 260, y: 150 },
      { id: 'q2', label: 'q2', x: 420, y: 150, isFinal: true },
    ],
    inputAlphabet: ['a', 'b', 'c'],
    stackAlphabet: ['Z0', 'A', 'B'],
    startStateId: 'q0',
    startStackSymbol: 'Z0',
    finalStateIds: ['q2'],
    acceptMode: 'FINAL_STATE',
    transitions: [
      { id: 't1', from: 'q0', to: 'q0', inputSymbol: 'a', popSymbol: 'ε', pushSymbols: ['A'] },
      { id: 't2', from: 'q0', to: 'q0', inputSymbol: 'b', popSymbol: 'ε', pushSymbols: ['B'] },
      { id: 't3', from: 'q0', to: 'q1', inputSymbol: 'c', popSymbol: 'ε', pushSymbols: ['ε'] },
      { id: 't4', from: 'q1', to: 'q1', inputSymbol: 'a', popSymbol: 'A', pushSymbols: ['ε'] },
      { id: 't5', from: 'q1', to: 'q1', inputSymbol: 'b', popSymbol: 'B', pushSymbols: ['ε'] },
      { id: 't6', from: 'q1', to: 'q2', inputSymbol: 'ε', popSymbol: 'Z0', pushSymbols: ['Z0'] },
    ],
  },
  {
    id: 'pda-anb2n',
    name: 'PDA: {a^n b^{2n} | n ≥ 1}',
    description: 'For every "a" read, pushes TWO markers onto stack; pops one marker for each "b" read.',
    states: [
      { id: 'q0', label: 'q0', x: 100, y: 150, isStart: true },
      { id: 'q1', label: 'q1', x: 260, y: 150 },
      { id: 'q2', label: 'q2', x: 420, y: 150, isFinal: true },
    ],
    inputAlphabet: ['a', 'b'],
    stackAlphabet: ['Z0', 'X'],
    startStateId: 'q0',
    startStackSymbol: 'Z0',
    finalStateIds: ['q2'],
    acceptMode: 'FINAL_STATE',
    transitions: [
      { id: 't1', from: 'q0', to: 'q0', inputSymbol: 'a', popSymbol: 'ε', pushSymbols: ['X', 'X'] },
      { id: 't2', from: 'q0', to: 'q1', inputSymbol: 'b', popSymbol: 'X', pushSymbols: ['ε'] },
      { id: 't3', from: 'q1', to: 'q1', inputSymbol: 'b', popSymbol: 'X', pushSymbols: ['ε'] },
      { id: 't4', from: 'q1', to: 'q2', inputSymbol: 'ε', popSymbol: 'Z0', pushSymbols: ['Z0'] },
    ],
  },
];

export const PdaView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'PRESETS' | 'CUSTOM_BUILDER'>('PRESETS');
  const [selectedPda, setSelectedPda] = useState<PDADefinition>(EXTENDED_SAMPLE_PDAS[0]);
  const [customPda, setCustomPda] = useState<PDADefinition>({
    id: 'custom-pda',
    name: 'My Custom Pushdown Automaton',
    description: 'User-defined Pushdown Automaton with custom states and stack rules.',
    states: [
      { id: 'q0', label: 'q0', x: 100, y: 150, isStart: true },
      { id: 'q1', label: 'q1', x: 260, y: 150 },
      { id: 'q2', label: 'q2', x: 420, y: 150, isFinal: true },
    ],
    inputAlphabet: ['0', '1'],
    stackAlphabet: ['Z0', '0'],
    startStateId: 'q0',
    startStackSymbol: 'Z0',
    finalStateIds: ['q2'],
    acceptMode: 'FINAL_STATE',
    transitions: [
      { id: 't1', from: 'q0', to: 'q0', inputSymbol: '0', popSymbol: 'ε', pushSymbols: ['0'] },
      { id: 't2', from: 'q0', to: 'q1', inputSymbol: '1', popSymbol: '0', pushSymbols: ['ε'] },
      { id: 't3', from: 'q1', to: 'q1', inputSymbol: '1', popSymbol: '0', pushSymbols: ['ε'] },
      { id: 't4', from: 'q1', to: 'q2', inputSymbol: 'ε', popSymbol: 'Z0', pushSymbols: ['Z0'] },
    ],
  });

  const activePda = activeTab === 'PRESETS' ? selectedPda : customPda;

  const [inputString, setInputString] = useState<string>('0011');
  const [simResult, setSimResult] = useState<PDASimulationResult>(() =>
    simulatePDA(EXTENDED_SAMPLE_PDAS[0], '0011')
  );
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // New transition form state
  const [newTransFrom, setNewTransFrom] = useState<string>('q0');
  const [newTransInput, setNewTransInput] = useState<string>('0');
  const [newTransPop, setNewTransPop] = useState<string>('ε');
  const [newTransTo, setNewTransTo] = useState<string>('q0');
  const [newTransPush, setNewTransPush] = useState<string>('0');

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

  const handleRunSim = (str?: string, pdaToUse?: PDADefinition) => {
    const s = str !== undefined ? str : inputString;
    const p = pdaToUse || activePda;
    const res = simulatePDA(p, s);
    setSimResult(res);
    setCurrentStepIdx(0);
    setIsPlaying(false);
  };

  const handleAddTransition = () => {
    const pushArr = newTransPush
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    const newTrans: PDATransition = {
      id: `t_${Date.now()}`,
      from: newTransFrom,
      to: newTransTo,
      inputSymbol: newTransInput.trim() || 'ε',
      popSymbol: newTransPop.trim() || 'ε',
      pushSymbols: pushArr.length > 0 ? pushArr : ['ε'],
    };

    const updated = {
      ...customPda,
      transitions: [...customPda.transitions, newTrans],
    };
    setCustomPda(updated);
    handleRunSim(inputString, updated);
  };

  const handleDeleteTransition = (index: number) => {
    const updated = {
      ...customPda,
      transitions: customPda.transitions.filter((_, i) => i !== index),
    };
    setCustomPda(updated);
    handleRunSim(inputString, updated);
  };

  const handleToggleFinalState = (stateId: string) => {
    const exists = customPda.finalStateIds.includes(stateId);
    const updatedFinal = exists
      ? customPda.finalStateIds.filter(s => s !== stateId)
      : [...customPda.finalStateIds, stateId];
    const updated = { ...customPda, finalStateIds: updatedFinal };
    setCustomPda(updated);
    handleRunSim(inputString, updated);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-['Outfit'] flex items-center gap-2">
            <Layers className="w-6 h-6 text-emerald-400" />
            <span>Pushdown Automata (PDA) Laboratory</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Design custom PDAs with LIFO stack operations (Push, Pop, No-op) and trace instantaneous descriptions (q, w, γ).
          </p>
        </div>

        {/* Tab switch: Presets vs Custom Builder */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl text-xs">
          <button
            onClick={() => {
              setActiveTab('PRESETS');
              handleRunSim(inputString, selectedPda);
            }}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
              activeTab === 'PRESETS'
                ? 'bg-emerald-600 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Curated Presets
          </button>
          <button
            onClick={() => {
              setActiveTab('CUSTOM_BUILDER');
              handleRunSim(inputString, customPda);
            }}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
              activeTab === 'CUSTOM_BUILDER'
                ? 'bg-indigo-600 text-white font-bold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Custom PDA Builder
          </button>
        </div>
      </div>

      {/* Preset Selector or Custom Builder Form */}
      {activeTab === 'PRESETS' ? (
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400">Choose Standard PDA:</span>
              <select
                value={selectedPda.id}
                onChange={e => {
                  const found = EXTENDED_SAMPLE_PDAS.find(p => p.id === e.target.value);
                  if (found) {
                    setSelectedPda(found);
                    let def = '0011';
                    if (found.id.includes('paren')) def = '((()))';
                    if (found.id.includes('wcwR')) def = 'abcba';
                    if (found.id.includes('anb2n')) def = 'abbbb';
                    setInputString(def);
                    handleRunSim(def, found);
                  }
                }}
                className="px-3 py-1.5 bg-slate-950 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl focus:outline-none focus:border-emerald-500 cursor-pointer shadow-sm"
              >
                {EXTENDED_SAMPLE_PDAS.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-800/40">
              Accept Mode: {selectedPda.acceptMode}
            </div>
          </div>

          <p className="text-xs text-slate-300 font-sans leading-relaxed">
            {selectedPda.description}
          </p>
        </div>
      ) : (
        /* CUSTOM PDA BUILDER */
        <div className="p-6 bg-slate-900/90 border border-indigo-900/50 rounded-3xl shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white font-['Outfit']">
                Define Your Custom Pushdown Automaton
              </h3>
            </div>
            <span className="text-[11px] text-indigo-300 font-mono">
              States: {customPda.states.map(s => s.id).join(', ')} | Σ: {customPda.inputAlphabet.join(', ')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-sans">
            {/* States */}
            <div className="space-y-1">
              <label className="text-slate-400 font-semibold">States (comma-separated):</label>
              <input
                type="text"
                value={customPda.states.map(s => s.id).join(', ')}
                onChange={e => {
                  const arr = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                  const newStates: StateNode[] = (arr.length > 0 ? arr : ['q0']).map((id, idx) => ({
                    id,
                    label: id,
                    x: 100 + idx * 150,
                    y: 150,
                  }));
                  const updated = { ...customPda, states: newStates };
                  setCustomPda(updated);
                  handleRunSim(inputString, updated);
                }}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Input Alphabet */}
            <div className="space-y-1">
              <label className="text-slate-400 font-semibold">Input Alphabet Σ:</label>
              <input
                type="text"
                value={customPda.inputAlphabet.join(', ')}
                onChange={e => {
                  const arr = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                  const updated = { ...customPda, inputAlphabet: arr };
                  setCustomPda(updated);
                  handleRunSim(inputString, updated);
                }}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Stack Alphabet */}
            <div className="space-y-1">
              <label className="text-slate-400 font-semibold">Stack Alphabet Γ:</label>
              <input
                type="text"
                value={customPda.stackAlphabet.join(', ')}
                onChange={e => {
                  const arr = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                  const updated = { ...customPda, stackAlphabet: arr };
                  setCustomPda(updated);
                  handleRunSim(inputString, updated);
                }}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Acceptance Mode */}
            <div className="space-y-1">
              <label className="text-slate-400 font-semibold">Acceptance Criterion:</label>
              <select
                value={customPda.acceptMode}
                onChange={e => {
                  const updated = { ...customPda, acceptMode: e.target.value as any };
                  setCustomPda(updated);
                  handleRunSim(inputString, updated);
                }}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="FINAL_STATE">Final State (q ∈ F)</option>
                <option value="EMPTY_STACK">Empty Stack (stack = ∅)</option>
              </select>
            </div>
          </div>

          {/* Start State, Start Stack, Final States */}
          <div className="flex flex-wrap items-center gap-6 pt-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold">Start State q0:</span>
              <select
                value={customPda.startStateId}
                onChange={e => {
                  const updated = { ...customPda, startStateId: e.target.value };
                  setCustomPda(updated);
                  handleRunSim(inputString, updated);
                }}
                className="px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg font-mono text-slate-200"
              >
                {customPda.states.map(s => (
                  <option key={s.id} value={s.id}>{s.id}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold">Initial Stack Symbol Z0:</span>
              <input
                type="text"
                value={customPda.startStackSymbol}
                onChange={e => {
                  const updated = { ...customPda, startStackSymbol: e.target.value.trim() || 'Z0' };
                  setCustomPda(updated);
                  handleRunSim(inputString, updated);
                }}
                className="w-16 px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg font-mono text-slate-200 text-center"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold">Accepting States (F):</span>
              <div className="flex items-center gap-1.5">
                {customPda.states.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleToggleFinalState(s.id)}
                    className={`px-2 py-0.5 rounded-md font-mono text-xs font-bold border transition-colors ${
                      customPda.finalStateIds.includes(s.id)
                        ? 'bg-emerald-500/30 text-emerald-300 border-emerald-500/60'
                        : 'bg-slate-950 text-slate-500 border-slate-800'
                    }`}
                  >
                    {s.id}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Transitions Table & Add Row */}
          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-slate-300 text-xs flex items-center justify-between">
              <span>Transition Rules δ(state, input, stack_top) → (next_state, push):</span>
              <span className="text-slate-500 font-mono text-[11px] font-normal">
                {customPda.transitions.length} Rules Defined
              </span>
            </h4>

            {/* List of transitions */}
            <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/60">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">From State</th>
                    <th className="py-2 px-3">Read Symbol</th>
                    <th className="py-2 px-3">Pop Stack</th>
                    <th className="py-2 px-3">Next State</th>
                    <th className="py-2 px-3">Push Stack</th>
                    <th className="py-2 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {customPda.transitions.map((t, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40">
                      <td className="py-2 px-3 text-indigo-400 font-bold">{t.from}</td>
                      <td className="py-2 px-3 text-cyan-300">'{t.inputSymbol}'</td>
                      <td className="py-2 px-3 text-amber-300">'{t.popSymbol}'</td>
                      <td className="py-2 px-3 text-emerald-400 font-bold">{t.to}</td>
                      <td className="py-2 px-3 text-purple-300">[{t.pushSymbols.join(', ')}]</td>
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => handleDeleteTransition(idx)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Delete Transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add New Transition Form Row */}
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex flex-wrap items-center gap-2 text-xs font-mono">
              <div className="flex items-center gap-1">
                <span className="text-slate-500 text-[10px]">From:</span>
                <select
                  value={newTransFrom}
                  onChange={e => setNewTransFrom(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200"
                >
                  {customPda.states.map(s => (
                    <option key={s.id} value={s.id}>{s.id}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-slate-500 text-[10px]">Read:</span>
                <input
                  type="text"
                  value={newTransInput}
                  onChange={e => setNewTransInput(e.target.value)}
                  placeholder="0 or ε"
                  className="w-14 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 text-center"
                />
              </div>

              <div className="flex items-center gap-1">
                <span className="text-slate-500 text-[10px]">Pop:</span>
                <input
                  type="text"
                  value={newTransPop}
                  onChange={e => setNewTransPop(e.target.value)}
                  placeholder="Z0 or ε"
                  className="w-14 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 text-center"
                />
              </div>

              <ArrowRight className="w-3.5 h-3.5 text-slate-600" />

              <div className="flex items-center gap-1">
                <span className="text-slate-500 text-[10px]">To:</span>
                <select
                  value={newTransTo}
                  onChange={e => setNewTransTo(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200"
                >
                  {customPda.states.map(s => (
                    <option key={s.id} value={s.id}>{s.id}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-slate-500 text-[10px]">Push:</span>
                <input
                  type="text"
                  value={newTransPush}
                  onChange={e => setNewTransPush(e.target.value)}
                  placeholder="0, Z0 or ε"
                  className="w-20 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 text-center"
                />
              </div>

              <button
                onClick={handleAddTransition}
                className="ml-auto px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold font-sans flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Rule</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input Ribbon & Simulator Execution */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-4 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="text"
            value={inputString}
            onChange={e => setInputString(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRunSim()}
            placeholder="Enter input string to test with PDA..."
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
          <span className="text-slate-500 text-[11px] font-sans">Suggested Tests:</span>
          {(activePda.id.includes('paren')
            ? ['()', '(())', '()()', '((()))', '(()']
            : activePda.id.includes('wcwR')
            ? ['aca', 'abcba', 'abbcbba', 'abb', 'abacaba']
            : activePda.id.includes('anb2n')
            ? ['abb', 'aabbbb', 'aaabbbbbb', 'ab', 'abbb']
            : ['01', '0011', '000111', '011', '001', '10']
          ).map(sample => (
            <button
              key={sample}
              onClick={() => {
                setInputString(sample);
                handleRunSim(sample);
              }}
              className="px-2.5 py-1 bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {/* Main Execution Arena: LIFO Stack Visualizer & Trace Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Animated Stack Tower & Instantaneous State (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Instantaneous Description: (q, w, γ)</span>
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
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-sans">
                Configuration (State, Remaining Input, Stack)
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

            <div className="w-56 mx-auto h-[280px] bg-slate-950/90 border-x-2 border-b-2 border-emerald-500/60 rounded-b-2xl p-2 flex flex-col-reverse gap-1.5 overflow-hidden shadow-inner relative">
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
                title="Reset to Step 0"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => currentStepIdx > 0 && setCurrentStepIdx(currentStepIdx - 1)}
                disabled={currentStepIdx === 0}
                className="p-2 text-slate-400 hover:text-white disabled:opacity-40 rounded-lg"
                title="Step Backward"
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
                title="Step Forward"
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
            Step-by-Step Transition Log ({totalSteps} Steps):
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
