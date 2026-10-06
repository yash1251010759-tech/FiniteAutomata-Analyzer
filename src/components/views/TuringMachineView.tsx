import React, { useState, useEffect } from 'react';
import { sampleTuringMachines, simulateTuringMachine, TMSimulationResult } from '../../algorithms/turingMachine';
import { TMDefinition, TMStep, TMTransition, StateNode } from '../../types/automata';
import {
  Binary,
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  CheckCircle2,
  XCircle,
  ArrowUp,
  Plus,
  Trash2,
  Sliders,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';

const EXTENDED_SAMPLE_TMS: TMDefinition[] = [
  ...sampleTuringMachines,
  {
    id: 'tm-anbncn',
    name: 'TM: Language {a^n b^n c^n | n ≥ 1}',
    description: 'Crosses off an "a" with X, moves right to cross a matching "b" with Y, moves right to cross a matching "c" with Z, and returns to repeat.',
    states: [
      { id: 'q0', label: 'q0', x: 100, y: 150, isStart: true, description: 'Find next a' },
      { id: 'q1', label: 'q1', x: 260, y: 150, description: 'Find matching b' },
      { id: 'q2', label: 'q2', x: 420, y: 150, description: 'Find matching c' },
      { id: 'q3', label: 'q3', x: 580, y: 150, description: 'Rewind to start' },
      { id: 'q4', label: 'q4', x: 740, y: 150, description: 'Verify all crossed' },
      { id: 'q_acc', label: 'q_acc', x: 900, y: 150, isFinal: true, description: 'Accept' },
    ],
    inputAlphabet: ['a', 'b', 'c'],
    tapeAlphabet: ['a', 'b', 'c', 'X', 'Y', 'Z', 'B'],
    blankSymbol: 'B',
    startStateId: 'q0',
    acceptStateId: 'q_acc',
    transitions: [
      { id: 'tm1', from: 'q0', to: 'q1', readSymbol: 'a', writeSymbol: 'X', direction: 'R' },
      { id: 'tm2', from: 'q0', to: 'q4', readSymbol: 'Y', writeSymbol: 'Y', direction: 'R' },
      { id: 'tm3', from: 'q1', to: 'q1', readSymbol: 'a', writeSymbol: 'a', direction: 'R' },
      { id: 'tm4', from: 'q1', to: 'q1', readSymbol: 'Y', writeSymbol: 'Y', direction: 'R' },
      { id: 'tm5', from: 'q1', to: 'q2', readSymbol: 'b', writeSymbol: 'Y', direction: 'R' },
      { id: 'tm6', from: 'q2', to: 'q2', readSymbol: 'b', writeSymbol: 'b', direction: 'R' },
      { id: 'tm7', from: 'q2', to: 'q2', readSymbol: 'Z', writeSymbol: 'Z', direction: 'R' },
      { id: 'tm8', from: 'q2', to: 'q3', readSymbol: 'c', writeSymbol: 'Z', direction: 'L' },
      { id: 'tm9', from: 'q3', to: 'q3', readSymbol: 'Z', writeSymbol: 'Z', direction: 'L' },
      { id: 'tm10', from: 'q3', to: 'q3', readSymbol: 'b', writeSymbol: 'b', direction: 'L' },
      { id: 'tm11', from: 'q3', to: 'q3', readSymbol: 'Y', writeSymbol: 'Y', direction: 'L' },
      { id: 'tm12', from: 'q3', to: 'q3', readSymbol: 'a', writeSymbol: 'a', direction: 'L' },
      { id: 'tm13', from: 'q3', to: 'q0', readSymbol: 'X', writeSymbol: 'X', direction: 'R' },
      { id: 'tm14', from: 'q4', to: 'q4', readSymbol: 'Y', writeSymbol: 'Y', direction: 'R' },
      { id: 'tm15', from: 'q4', to: 'q4', readSymbol: 'Z', writeSymbol: 'Z', direction: 'R' },
      { id: 'tm16', from: 'q4', to: 'q_acc', readSymbol: 'B', writeSymbol: 'B', direction: 'S' },
    ],
  },
];

export const TuringMachineView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'PRESETS' | 'CUSTOM_BUILDER'>('PRESETS');
  const [selectedTm, setSelectedTm] = useState<TMDefinition>(EXTENDED_SAMPLE_TMS[0]);
  const [customTm, setCustomTm] = useState<TMDefinition>({
    id: 'custom-tm',
    name: 'My Custom Turing Machine',
    description: 'User-designed single-tape Turing machine with custom transition rules.',
    states: [
      { id: 'q0', label: 'q0', x: 100, y: 150, isStart: true },
      { id: 'q1', label: 'q1', x: 260, y: 150 },
      { id: 'q_accept', label: 'q_accept', x: 420, y: 150, isFinal: true },
    ],
    inputAlphabet: ['0', '1'],
    tapeAlphabet: ['0', '1', 'X', 'B'],
    blankSymbol: 'B',
    startStateId: 'q0',
    acceptStateId: 'q_accept',
    transitions: [
      { id: 't1', from: 'q0', to: 'q1', readSymbol: '0', writeSymbol: 'X', direction: 'R' },
      { id: 't2', from: 'q1', to: 'q_accept', readSymbol: 'B', writeSymbol: 'B', direction: 'S' },
    ],
  });

  const activeTm = activeTab === 'PRESETS' ? selectedTm : customTm;

  const [inputTape, setInputTape] = useState<string>('1011');
  const [maxSteps, setMaxSteps] = useState<number>(500);
  const [simResult, setSimResult] = useState<TMSimulationResult>(() =>
    simulateTuringMachine(EXTENDED_SAMPLE_TMS[0], '1011', 500)
  );
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speedMs, setSpeedMs] = useState<number>(500);

  // New transition form state
  const [newTransFrom, setNewTransFrom] = useState<string>('q0');
  const [newTransRead, setNewTransRead] = useState<string>('0');
  const [newTransWrite, setNewTransWrite] = useState<string>('0');
  const [newTransDir, setNewTransDir] = useState<'L' | 'R' | 'S'>('R');
  const [newTransTo, setNewTransTo] = useState<string>('q0');

  const totalSteps = simResult?.steps.length || 0;
  const currentStep: TMStep | undefined = simResult?.steps[currentStepIdx];

  // Auto-play loop
  useEffect(() => {
    let timer: any;
    if (isPlaying && totalSteps > 0) {
      if (currentStepIdx < totalSteps - 1) {
        timer = setTimeout(() => {
          setCurrentStepIdx(prev => prev + 1);
        }, speedMs);
      } else {
        setIsPlaying(false);
      }
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIdx, totalSteps, speedMs]);

  const handleRunSim = (str?: string, tmToUse?: TMDefinition, limit?: number) => {
    const s = str !== undefined ? str : inputTape;
    const m = tmToUse || activeTm;
    const l = limit || maxSteps;
    const res = simulateTuringMachine(m, s, l);
    setSimResult(res);
    setCurrentStepIdx(0);
    setIsPlaying(false);
  };

  const handleAddTransition = () => {
    const newTrans: TMTransition = {
      id: `t_${Date.now()}`,
      from: newTransFrom,
      to: newTransTo,
      readSymbol: newTransRead.trim() || 'B',
      writeSymbol: newTransWrite.trim() || 'B',
      direction: newTransDir,
    };

    const updated = {
      ...customTm,
      transitions: [...customTm.transitions, newTrans],
    };
    setCustomTm(updated);
    handleRunSim(inputTape, updated);
  };

  const handleDeleteTransition = (id: string) => {
    const updated = {
      ...customTm,
      transitions: customTm.transitions.filter(t => t.id !== id),
    };
    setCustomTm(updated);
    handleRunSim(inputTape, updated);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-['Outfit'] flex items-center gap-2">
            <Binary className="w-6 h-6 text-amber-400" />
            <span>Turing Machine Laboratory</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Universal computation on an infinite two-way tape: read/write head, directional movement (L/R/S), and state transitions.
          </p>
        </div>

        {/* Tab Switch: Presets vs Custom Builder */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl text-xs">
          <button
            onClick={() => {
              setActiveTab('PRESETS');
              handleRunSim(inputTape, selectedTm);
            }}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
              activeTab === 'PRESETS'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Curated Presets
          </button>
          <button
            onClick={() => {
              setActiveTab('CUSTOM_BUILDER');
              handleRunSim(inputTape, customTm);
            }}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
              activeTab === 'CUSTOM_BUILDER'
                ? 'bg-indigo-600 text-white font-bold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Custom TM Builder
          </button>
        </div>
      </div>

      {/* Preset Selector or Custom Builder Form */}
      {activeTab === 'PRESETS' ? (
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400">Choose Standard TM:</span>
              <select
                value={selectedTm.id}
                onChange={e => {
                  const found = EXTENDED_SAMPLE_TMS.find(m => m.id === e.target.value);
                  if (found) {
                    setSelectedTm(found);
                    let def = '1011';
                    if (found.id.includes('0n1n')) def = '0011';
                    if (found.id.includes('anbncn')) def = 'aabbcc';
                    setInputTape(def);
                    handleRunSim(def, found);
                  }
                }}
                className="px-3 py-1.5 bg-slate-950 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl focus:outline-none focus:border-amber-500 cursor-pointer shadow-sm"
              >
                {EXTENDED_SAMPLE_TMS.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-[11px] font-mono text-amber-400 bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-800/40">
              Blank Symbol: '{selectedTm.blankSymbol}'
            </div>
          </div>

          <p className="text-xs text-slate-300 font-sans leading-relaxed">
            {selectedTm.description}
          </p>
        </div>
      ) : (
        /* CUSTOM TM BUILDER */
        <div className="p-6 bg-slate-900/90 border border-indigo-900/50 rounded-3xl shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white font-['Outfit']">
                Define Your Custom Turing Machine
              </h3>
            </div>
            <span className="text-[11px] text-indigo-300 font-mono">
              States: {customTm.states.map(s => s.id).join(', ')} | Blank: '{customTm.blankSymbol}'
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-sans">
            {/* States */}
            <div className="space-y-1">
              <label className="text-slate-400 font-semibold">States (comma-separated):</label>
              <input
                type="text"
                value={customTm.states.map(s => s.id).join(', ')}
                onChange={e => {
                  const arr = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                  const newStates: StateNode[] = arr.map((id, idx) => ({
                    id,
                    label: id,
                    x: 100 + idx * 150,
                    y: 150,
                    isStart: id === customTm.startStateId,
                    isFinal: id === customTm.acceptStateId,
                  }));
                  const updated = { ...customTm, states: newStates };
                  setCustomTm(updated);
                  handleRunSim(inputTape, updated);
                }}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Input Alphabet */}
            <div className="space-y-1">
              <label className="text-slate-400 font-semibold">Input Alphabet Σ:</label>
              <input
                type="text"
                value={customTm.inputAlphabet.join(', ')}
                onChange={e => {
                  const arr = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                  const updated = { ...customTm, inputAlphabet: arr };
                  setCustomTm(updated);
                  handleRunSim(inputTape, updated);
                }}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Tape Alphabet */}
            <div className="space-y-1">
              <label className="text-slate-400 font-semibold">Tape Alphabet Γ:</label>
              <input
                type="text"
                value={customTm.tapeAlphabet.join(', ')}
                onChange={e => {
                  const arr = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                  const updated = { ...customTm, tapeAlphabet: arr };
                  setCustomTm(updated);
                  handleRunSim(inputTape, updated);
                }}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Blank Symbol */}
            <div className="space-y-1">
              <label className="text-slate-400 font-semibold">Blank Symbol:</label>
              <input
                type="text"
                value={customTm.blankSymbol}
                onChange={e => {
                  const updated = { ...customTm, blankSymbol: e.target.value.trim() || 'B' };
                  setCustomTm(updated);
                  handleRunSim(inputTape, updated);
                }}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-slate-200 focus:outline-none focus:border-indigo-500 text-center"
              />
            </div>
          </div>

          {/* Start State, Accept State, Max Steps */}
          <div className="flex flex-wrap items-center gap-6 pt-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold">Start State q0:</span>
              <select
                value={customTm.startStateId}
                onChange={e => {
                  const updated = { ...customTm, startStateId: e.target.value };
                  setCustomTm(updated);
                  handleRunSim(inputTape, updated);
                }}
                className="px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg font-mono text-slate-200"
              >
                {customTm.states.map(s => (
                  <option key={s.id} value={s.id}>{s.id}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold">Accept State (q_acc):</span>
              <select
                value={customTm.acceptStateId}
                onChange={e => {
                  const updated = { ...customTm, acceptStateId: e.target.value };
                  setCustomTm(updated);
                  handleRunSim(inputTape, updated);
                }}
                className="px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg font-mono text-emerald-300 font-bold"
              >
                {customTm.states.map(s => (
                  <option key={s.id} value={s.id}>{s.id}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold">Safety Step Limit:</span>
              <select
                value={maxSteps}
                onChange={e => {
                  const limit = Number(e.target.value);
                  setMaxSteps(limit);
                  handleRunSim(inputTape, customTm, limit);
                }}
                className="px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg font-mono text-amber-300"
              >
                <option value={200}>200 Steps</option>
                <option value={500}>500 Steps</option>
                <option value={1000}>1,000 Steps</option>
                <option value={3000}>3,000 Steps</option>
              </select>
            </div>
          </div>

          {/* Transitions Table & Add Row */}
          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-slate-300 text-xs flex items-center justify-between">
              <span>Transition Rules δ(state, read) → (write, direction, next_state):</span>
              <span className="text-slate-500 font-mono text-[11px] font-normal">
                {customTm.transitions.length} Rules Defined
              </span>
            </h4>

            {/* List of transitions */}
            <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/60">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">From State</th>
                    <th className="py-2 px-3">Read Tape</th>
                    <th className="py-2 px-3">Write Tape</th>
                    <th className="py-2 px-3">Move Head</th>
                    <th className="py-2 px-3">Next State</th>
                    <th className="py-2 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {customTm.transitions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-900/40">
                      <td className="py-2 px-3 text-indigo-400 font-bold">{t.from}</td>
                      <td className="py-2 px-3 text-cyan-300 font-bold">'{t.readSymbol}'</td>
                      <td className="py-2 px-3 text-amber-300 font-bold">'{t.writeSymbol}'</td>
                      <td className="py-2 px-3 font-bold text-purple-300">{t.direction}</td>
                      <td className="py-2 px-3 text-emerald-400 font-bold">{t.to}</td>
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => handleDeleteTransition(t.id)}
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
                  {customTm.states.map(s => (
                    <option key={s.id} value={s.id}>{s.id}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-slate-500 text-[10px]">Read:</span>
                <input
                  type="text"
                  value={newTransRead}
                  onChange={e => setNewTransRead(e.target.value)}
                  placeholder="0, 1 or B"
                  className="w-14 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 text-center"
                />
              </div>

              <ArrowRight className="w-3.5 h-3.5 text-slate-600" />

              <div className="flex items-center gap-1">
                <span className="text-slate-500 text-[10px]">Write:</span>
                <input
                  type="text"
                  value={newTransWrite}
                  onChange={e => setNewTransWrite(e.target.value)}
                  placeholder="0, 1 or B"
                  className="w-14 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 text-center"
                />
              </div>

              <div className="flex items-center gap-1">
                <span className="text-slate-500 text-[10px]">Move:</span>
                <select
                  value={newTransDir}
                  onChange={e => setNewTransDir(e.target.value as any)}
                  className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200"
                >
                  <option value="R">R (Right)</option>
                  <option value="L">L (Left)</option>
                  <option value="S">S (Stay)</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-slate-500 text-[10px]">To:</span>
                <select
                  value={newTransTo}
                  onChange={e => setNewTransTo(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200"
                >
                  {customTm.states.map(s => (
                    <option key={s.id} value={s.id}>{s.id}</option>
                  ))}
                </select>
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

      {/* Description & Input Ribbon */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-4 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="text"
            value={inputTape}
            onChange={e => setInputTape(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRunSim()}
            placeholder="Enter initial tape symbols..."
            className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-2xl text-slate-100 font-mono text-sm focus:outline-none focus:border-amber-500 shadow-inner"
          />

          <button
            onClick={() => handleRunSim()}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-2xl text-xs sm:text-sm shadow-lg shadow-amber-500/30 transition-all active:scale-95"
          >
            Simulate Turing Machine
          </button>
        </div>

        {/* Quick test buttons */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="text-slate-500 text-[11px] font-sans">Quick test:</span>
          {(activeTm.id.includes('anbncn')
            ? ['abc', 'aabbcc', 'aaabbbccc', 'ab', 'aabbc', 'abcde']
            : activeTm.id.includes('binary-inc')
            ? ['0', '1', '101', '1011', '1111', '10011']
            : ['01', '0011', '000111', '001', '011', '10']
          ).map(sample => (
            <button
              key={sample}
              onClick={() => {
                setInputTape(sample);
                handleRunSim(sample);
              }}
              className="px-2.5 py-1 bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Infinite Tape Display */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-6 backdrop-blur-md">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Infinite Tape Window
            </span>
            {currentStep && (
              <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                State: {currentStep.stateId}
              </span>
            )}
          </div>

          <span className="text-xs font-mono text-slate-400">
            Head Index: {currentStep?.headIndex}
          </span>
        </div>

        {/* Tape Cells Grid with Head Indicator */}
        <div className="space-y-2 py-4">
          <div className="overflow-x-auto p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner">
            <div className="inline-flex items-center gap-1.5 min-w-full justify-center">
              {currentStep &&
                currentStep.tape.map((cell, idx) => {
                  const isHeadHere = idx === currentStep.headIndex;

                  return (
                    <div key={idx} className="flex flex-col items-center gap-2 shrink-0">
                      {/* Cell Box */}
                      <div
                        className={`w-11 h-12 rounded-xl flex items-center justify-center font-mono text-sm font-bold border transition-all ${
                          isHeadHere
                            ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-lg shadow-amber-500/40 scale-105'
                            : 'bg-slate-900 text-slate-200 border-slate-800'
                        }`}
                      >
                        {cell === activeTm.blankSymbol ? '␣' : cell}
                      </div>

                      {/* Head Arrow */}
                      <div className="h-6 flex items-center justify-center">
                        {isHeadHere && (
                          <div className="flex flex-col items-center text-amber-400 animate-bounce">
                            <ArrowUp className="w-4 h-4" />
                            <span className="text-[9px] font-mono font-bold uppercase tracking-tighter">
                              HEAD
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Playback Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentStepIdx(0)}
              disabled={currentStepIdx === 0}
              className="p-2 text-slate-400 hover:text-white disabled:opacity-40 rounded-lg"
              title="Reset"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => currentStepIdx > 0 && setCurrentStepIdx(currentStepIdx - 1)}
              disabled={currentStepIdx === 0}
              className="p-2 text-slate-400 hover:text-white disabled:opacity-40 rounded-lg"
              title="Previous"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>
            <button
              onClick={() =>
                currentStepIdx < totalSteps - 1 && setCurrentStepIdx(currentStepIdx + 1)
              }
              disabled={currentStepIdx >= totalSteps - 1}
              className="p-2 text-slate-400 hover:text-white disabled:opacity-40 rounded-lg"
              title="Next"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Speed selector */}
            <div className="flex items-center gap-1.5 ml-2 text-xs text-slate-400 font-sans">
              <span>Speed:</span>
              <select
                value={speedMs}
                onChange={e => setSpeedMs(Number(e.target.value))}
                className="bg-slate-800 border border-slate-700 rounded-md px-1.5 py-1 text-slate-200 text-xs focus:outline-none"
              >
                <option value={900}>Slow</option>
                <option value={500}>Normal</option>
                <option value={200}>Fast</option>
                <option value={50}>Turbo</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {simResult && (
              <div
                className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                  simResult.status === 'ACCEPTED'
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                    : simResult.status === 'REJECTED'
                    ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                    : 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                }`}
              >
                {simResult.status === 'ACCEPTED' ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <XCircle className="w-3.5 h-3.5" />
                )}
                <span>{simResult.status}</span>
              </div>
            )}

            <span className="text-xs font-mono text-slate-400">
              Step {currentStepIdx} / {totalSteps > 0 ? totalSteps - 1 : 0}
            </span>
          </div>
        </div>

        {/* Current Step Description Box */}
        {currentStep && (
          <div className="p-3 bg-slate-950 border border-amber-950/60 rounded-xl text-xs text-slate-300 font-mono">
            {currentStep.actionDescription}
          </div>
        )}
      </div>

      {/* Transition History Step Log */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-3 backdrop-blur-md">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Transition History Log ({totalSteps} Steps)
        </h3>

        <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1 text-xs font-mono">
          {simResult.steps.map((st: any, idx: number) => {
            const isSelected = idx === currentStepIdx;

            return (
              <div
                key={idx}
                onClick={() => setCurrentStepIdx(idx)}
                className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-amber-950/60 border-amber-500/80 text-amber-200'
                    : 'bg-slate-950/60 hover:bg-slate-800/50 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-[11px]">
                    Step {st.stepIndex}
                  </span>
                  <span>{st.actionDescription}</span>
                </div>

                <span className="text-[11px] text-slate-500">
                  Head @ {st.headIndex}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
