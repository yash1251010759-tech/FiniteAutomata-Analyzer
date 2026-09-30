import React, { useState } from 'react';
import { AutomatonDefinition, AutomatonType, StateNode } from '../../types/automata';
import { AutomataCanvas } from '../canvas/AutomataCanvas';
import { TransitionTable } from '../simulation/TransitionTable';
import { SimulatorControls } from '../simulation/SimulatorControls';
import { SimulationPathTrace } from '../simulation/SimulationPathTrace';
import { simulateAutomaton } from '../../algorithms/dfaSimulation';
import { analyzeMachine, debugAutomaton } from '../../algorithms/debugger';
import {
  Table,
  BarChart3,
  Bug,
  Sliders,
  PlaySquare,
  BookOpen,
  RotateCcw,
  RotateCw,
  Plus,
  Trash2,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface BuilderViewProps {
  machine: AutomatonDefinition;
  onChangeMachine: (updated: AutomatonDefinition) => void;
  isAdvancedMode?: boolean;
}

type TabType = 'properties' | 'table' | 'statistics' | 'debugger' | 'formal' | 'explanation';

export const BuilderView: React.FC<BuilderViewProps> = ({
  machine,
  onChangeMachine,
  isAdvancedMode = false,
}) => {
  // History for Undo / Redo
  const [history, setHistory] = useState<AutomatonDefinition[]>([machine]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const [activeTab, setActiveTab] = useState<TabType>('properties');
  const [selectedState, setSelectedState] = useState<StateNode | null>(null);

  // Inline simulation state
  const [inputString, setInputString] = useState<string>('01');
  const [simResult, setSimResult] = useState<any>(null);
  const [stepIndex, setStepIndex] = useState<number>(0);

  // Update machine with undo history recording
  const handleUpdateWithHistory = (newMachine: AutomatonDefinition) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newMachine);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    onChangeMachine(newMachine);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      onChangeMachine(prev);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      onChangeMachine(next);
    }
  };

  // Run simulation
  const handleRunSimulate = () => {
    const res = simulateAutomaton(machine, inputString);
    setSimResult(res);
    setStepIndex(0);
  };

  const activeStateIds = simResult?.path[stepIndex]?.currentStateIds || [];
  const activeTransitionId = simResult?.path[stepIndex]?.activeTransitionId;

  // Real-time analysis and debugger
  const stats = analyzeMachine(machine);
  const issues = debugAutomaton(machine);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Top Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={machine.name}
            onChange={e =>
              handleUpdateWithHistory({ ...machine, name: e.target.value })
            }
            className="text-base sm:text-lg font-bold text-white bg-transparent border-b border-transparent hover:border-slate-700 focus:border-indigo-500 focus:outline-none px-1 py-0.5 font-['Outfit']"
            placeholder="Automaton Name"
          />

          <select
            value={machine.type}
            onChange={e =>
              handleUpdateWithHistory({
                ...machine,
                type: e.target.value as AutomatonType,
              })
            }
            className="px-2.5 py-1 text-xs font-extrabold uppercase tracking-wide bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded-xl focus:outline-none cursor-pointer"
          >
            <option value="DFA">DFA</option>
            <option value="NFA">NFA</option>
            <option value="ENFA">ε-NFA</option>
            <option value="MOORE">Moore Machine</option>
            <option value="MEALY">Mealy Machine</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {/* Undo / Redo Buttons */}
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent rounded-xl transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent rounded-xl transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Clear Canvas */}
          <button
            onClick={() => {
              if (confirm('Clear all states and transitions from this machine?')) {
                handleUpdateWithHistory({
                  ...machine,
                  states: [],
                  transitions: [],
                  startStateId: '',
                  finalStateIds: [],
                });
                setSelectedState(null);
                setSimResult(null);
              }
            }}
            className="px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear Canvas</span>
          </button>
        </div>
      </div>

      {/* Main Workspace (Graph Canvas & Right Inspector) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Center Canvas Area (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="h-[520px] w-full">
            <AutomataCanvas
              machine={machine}
              onChangeMachine={handleUpdateWithHistory}
              activeStateIds={activeStateIds}
              activeTransitionId={activeTransitionId}
              onSelectState={setSelectedState}
              selectedStateId={selectedState?.id || null}
              isEditable={true}
            />
          </div>

          {/* Integrated Simulation Controls Strip */}
          <SimulatorControls
            inputString={inputString}
            onChangeInputString={setInputString}
            onSimulate={handleRunSimulate}
            simulationResult={simResult}
            currentStepIndex={stepIndex}
            onStepChange={setStepIndex}
            alphabet={machine.alphabet}
          />
        </div>

        {/* Right Inspector & Tabs Panel (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-5 backdrop-blur-md">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-2xl overflow-x-auto text-xs">
            <button
              onClick={() => setActiveTab('properties')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all ${
                activeTab === 'properties'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Properties</span>
            </button>

            <button
              onClick={() => setActiveTab('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all ${
                activeTab === 'table'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>

            <button
              onClick={() => setActiveTab('statistics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all ${
                activeTab === 'statistics'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Stats</span>
            </button>

            <button
              onClick={() => setActiveTab('debugger')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all relative ${
                activeTab === 'debugger'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bug className="w-3.5 h-3.5" />
              <span>Debug</span>
              {issues.length > 0 && issues[0].severity !== 'INFO' && (
                <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1 right-1" />
              )}
            </button>

            {isAdvancedMode && (
              <button
                onClick={() => setActiveTab('formal')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all ${
                  activeTab === 'formal'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Formal</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('explanation')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all ${
                activeTab === 'explanation'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Expl.</span>
            </button>
          </div>

          {/* TAB 1: PROPERTIES */}
          {activeTab === 'properties' && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Alphabet Σ (comma separated)
                </label>
                <input
                  type="text"
                  value={machine.alphabet.join(', ')}
                  onChange={e => {
                    const syms = e.target.value
                      .split(/[, ]+/)
                      .map(s => s.trim())
                      .filter(Boolean);
                    handleUpdateWithHistory({
                      ...machine,
                      alphabet: syms.length > 0 ? syms : ['0', '1'],
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Start State (q0)
                </label>
                <select
                  value={machine.startStateId}
                  onChange={e => {
                    const stId = e.target.value;
                    const updated = machine.states.map(s => ({
                      ...s,
                      isStart: s.id === stId,
                    }));
                    handleUpdateWithHistory({
                      ...machine,
                      startStateId: stId,
                      states: updated,
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="">None selected</option>
                  {machine.states.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.label} ({s.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Accepting / Final States F
                </label>
                <div className="flex flex-wrap gap-1.5 p-2 bg-slate-950 border border-slate-800 rounded-xl min-h-[44px]">
                  {machine.states.map(s => {
                    const isF = machine.finalStateIds.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          const newF = isF
                            ? machine.finalStateIds.filter(id => id !== s.id)
                            : [...machine.finalStateIds, s.id];
                          const updated = machine.states.map(state => ({
                            ...state,
                            isFinal: newF.includes(state.id),
                          }));
                          handleUpdateWithHistory({
                            ...machine,
                            finalStateIds: newF,
                            states: updated,
                          });
                        }}
                        className={`px-2.5 py-1 rounded-lg font-mono text-xs font-semibold transition-all ${
                          isF
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {isF ? `*${s.label}` : s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Machine Description
                </label>
                <textarea
                  value={machine.description || ''}
                  onChange={e =>
                    handleUpdateWithHistory({ ...machine, description: e.target.value })
                  }
                  placeholder="Explain what language this automaton recognizes..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
            </div>
          )}

          {/* TAB 2: TRANSITION TABLE */}
          {activeTab === 'table' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Transition Table δ: Q × Σ → Q</span>
                <span className="text-[10px] text-indigo-400">Editable cells</span>
              </div>
              <TransitionTable
                machine={machine}
                onChangeMachine={handleUpdateWithHistory}
                activeStateIds={activeStateIds}
                isEditable={true}
              />
            </div>
          )}

          {/* TAB 3: MACHINE STATISTICS */}
          {activeTab === 'statistics' && (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 font-mono">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[10px]">TOTAL STATES</span>
                  <div className="text-base font-bold text-white">{stats.numStates}</div>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[10px]">TRANSITIONS</span>
                  <div className="text-base font-bold text-white">{stats.numTransitions}</div>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[10px]">FINAL STATES</span>
                  <div className="text-base font-bold text-purple-400">{stats.numFinalStates}</div>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[10px]">ALPHABET |Σ|</span>
                  <div className="text-base font-bold text-cyan-400">{stats.alphabetSize}</div>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Deterministic:</span>
                  <span
                    className={`font-bold ${
                      stats.isDeterministic ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {stats.isDeterministic ? 'Yes' : 'No (Non-deterministic)'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Reachable States:</span>
                  <span className="font-mono text-indigo-400">
                    {stats.reachableStates.length} / {stats.numStates}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Unreachable States:</span>
                  <span
                    className={`font-mono ${
                      stats.unreachableStates.length > 0 ? 'text-rose-400' : 'text-slate-500'
                    }`}
                  >
                    {stats.unreachableStates.length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Dead / Trap States:</span>
                  <span
                    className={`font-mono ${
                      stats.deadStates.length > 0 ? 'text-amber-400' : 'text-slate-500'
                    }`}
                  >
                    {stats.deadStates.length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>ε-Transitions:</span>
                  <span className="font-mono text-slate-400">{stats.epsilonCount}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AUTOMATA DEBUGGER */}
          {activeTab === 'debugger' && (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300">Diagnostic Validator</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {issues.length} check{issues.length === 1 ? '' : 's'}
                </span>
              </div>

              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {issues.map(iss => (
                  <div
                    key={iss.id}
                    className={`p-3 rounded-xl border space-y-1.5 ${
                      iss.severity === 'ERROR'
                        ? 'bg-rose-950/20 border-rose-800/40 text-rose-200'
                        : iss.severity === 'WARNING'
                        ? 'bg-amber-950/20 border-amber-800/40 text-amber-200'
                        : 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold">
                      {iss.severity === 'ERROR' ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      ) : iss.severity === 'WARNING' ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                      <span>{iss.title}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed opacity-90">{iss.message}</p>
                    {iss.suggestion && (
                      <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800/50">
                        💡 Suggestion: {iss.suggestion}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: FORMAL 5-TUPLE */}
          {activeTab === 'formal' && (
            <div className="space-y-3 text-xs font-mono">
              <h4 className="text-xs font-bold text-white font-sans uppercase tracking-wider">
                Formal Machine Definition
              </h4>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-indigo-300">
                <div>
                  <strong className="text-slate-400 font-sans">M = </strong>
                  (Q, Σ, δ, q0, F)
                </div>
                <div>
                  <span className="text-slate-400 font-sans">Q = </span>
                  {`{${machine.states.map(s => s.label).join(', ')}}`}
                </div>
                <div>
                  <span className="text-slate-400 font-sans">Σ = </span>
                  {`{${machine.alphabet.join(', ')}}`}
                </div>
                <div>
                  <span className="text-slate-400 font-sans">q0 = </span>
                  {machine.startStateId
                    ? machine.states.find(s => s.id === machine.startStateId)?.label ||
                      machine.startStateId
                    : 'None'}
                </div>
                <div>
                  <span className="text-slate-400 font-sans">F = </span>
                  {`{${machine.finalStateIds
                    .map(id => machine.states.find(s => s.id === id)?.label || id)
                    .join(', ')}}`}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: STATE EXPLANATIONS */}
          {activeTab === 'explanation' && (
            <div className="space-y-3 text-xs">
              <h4 className="text-xs font-bold text-white font-sans uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>State Meanings & Invariants</span>
              </h4>

              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {machine.states.map(st => (
                  <div
                    key={st.id}
                    className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1"
                  >
                    <div className="flex items-center justify-between font-mono font-bold">
                      <span className="text-indigo-400">{st.label}</span>
                      <span className="text-[10px] text-slate-500">
                        {st.id === machine.startStateId ? 'Start' : ''}{' '}
                        {machine.finalStateIds.includes(st.id) ? 'Final (Accept)' : ''}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {st.description ||
                        `Represents an internal computational state for strings processed so far.`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trace view tab when simulation has run */}
          {simResult && (
            <div className="pt-2 border-t border-slate-800">
              <SimulationPathTrace
                simulationResult={simResult}
                currentStepIndex={stepIndex}
                onSelectStep={setStepIndex}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
