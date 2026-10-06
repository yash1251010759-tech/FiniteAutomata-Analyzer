import React, { useState } from 'react';
import {
  AutomatonDefinition,
  AutomatonType,
  StateNode,
  TransitionEdge,
} from '../../types/automata';
import {
  Sparkles,
  Layers,
  Plus,
  Trash2,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Send,
  Download,
  Upload,
  BookOpen,
  ArrowRight,
  Eye,
  Sliders,
  RotateCcw,
} from 'lucide-react';
import { TermExplainerModal, TermKey } from './TermExplainerModal';
import { layoutNodes } from '../../algorithms/subsetConstruction';
import { analyzeMachine } from '../../algorithms/debugger';

interface UniversalModelBuilderProps {
  initialMachine?: AutomatonDefinition;
  onSave: (machine: AutomatonDefinition) => void;
  onSendToConversion?: (machine: AutomatonDefinition) => void;
  onSendToMinimization?: (machine: AutomatonDefinition) => void;
  onSendToSimulator?: (machine: AutomatonDefinition) => void;
  onCancel?: () => void;
}

// Built-in starter templates for beginners
const STARTER_TEMPLATES: {
  name: string;
  badge: string;
  type: AutomatonType;
  description: string;
  alphabet: string[];
  outputAlphabet?: string[];
  states: { id: string; label: string; isStart: boolean; isFinal: boolean; output?: string; desc: string }[];
  transitions: { from: string; to: string; symbols: string[]; output?: string }[];
}[] = [
  {
    name: "Even number of b's",
    badge: 'Classic DFA',
    type: 'DFA',
    description: 'Accepts strings containing an even number of b\'s over {a, b}.',
    alphabet: ['a', 'b'],
    states: [
      { id: 'q_even', label: 'EVEN', isStart: true, isFinal: true, desc: 'Even number of b\'s seen' },
      { id: 'q_odd', label: 'ODD', isStart: false, isFinal: false, desc: 'Odd number of b\'s seen' },
    ],
    transitions: [
      { from: 'q_even', to: 'q_even', symbols: ['a'] },
      { from: 'q_even', to: 'q_odd', symbols: ['b'] },
      { from: 'q_odd', to: 'q_odd', symbols: ['a'] },
      { from: 'q_odd', to: 'q_even', symbols: ['b'] },
    ],
  },
  {
    name: 'Strings ending with 01',
    badge: 'Binary DFA',
    type: 'DFA',
    description: 'Accepts all binary strings that end with the suffix "01".',
    alphabet: ['0', '1'],
    states: [
      { id: 'q0', label: 'q0', isStart: true, isFinal: false, desc: 'Start / default state' },
      { id: 'q1', label: 'q1', isStart: false, isFinal: false, desc: 'Last symbol was 0' },
      { id: 'q2', label: 'q2', isStart: false, isFinal: true, desc: 'Last symbols were 01 (Accept)' },
    ],
    transitions: [
      { from: 'q0', to: 'q1', symbols: ['0'] },
      { from: 'q0', to: 'q0', symbols: ['1'] },
      { from: 'q1', to: 'q1', symbols: ['0'] },
      { from: 'q1', to: 'q2', symbols: ['1'] },
      { from: 'q2', to: 'q1', symbols: ['0'] },
      { from: 'q2', to: 'q0', symbols: ['1'] },
    ],
  },
  {
    name: 'NFA for (a|b)*abb',
    badge: 'Substring NFA',
    type: 'NFA',
    description: 'Nondeterministic automaton guessing when "abb" starts.',
    alphabet: ['a', 'b'],
    states: [
      { id: 's0', label: 's0', isStart: true, isFinal: false, desc: 'Reading prefix or searching' },
      { id: 's1', label: 's1', isStart: false, isFinal: false, desc: 'Matched "a"' },
      { id: 's2', label: 's2', isStart: false, isFinal: false, desc: 'Matched "ab"' },
      { id: 's3', label: 's3', isStart: false, isFinal: true, desc: 'Matched "abb" (Accept)' },
    ],
    transitions: [
      { from: 's0', to: 's0', symbols: ['a', 'b'] },
      { from: 's0', to: 's1', symbols: ['a'] },
      { from: 's1', to: 's2', symbols: ['b'] },
      { from: 's2', to: 's3', symbols: ['b'] },
    ],
  },
  {
    name: 'Moore Machine: Parity Detector',
    badge: 'Transducer',
    type: 'MOORE',
    description: 'Outputs 1 when the count of 1s is even, 0 when odd.',
    alphabet: ['0', '1'],
    outputAlphabet: ['0', '1'],
    states: [
      { id: 'm_even', label: 'EVEN', isStart: true, isFinal: false, output: '1', desc: 'Emits 1' },
      { id: 'm_odd', label: 'ODD', isStart: false, isFinal: false, output: '0', desc: 'Emits 0' },
    ],
    transitions: [
      { from: 'm_even', to: 'm_even', symbols: ['0'] },
      { from: 'm_even', to: 'm_odd', symbols: ['1'] },
      { from: 'm_odd', to: 'm_odd', symbols: ['0'] },
      { from: 'm_odd', to: 'm_even', symbols: ['1'] },
    ],
  },
  {
    name: "Mealy Machine: 1's Complement",
    badge: 'Transducer',
    type: 'MEALY',
    description: 'Inverts each binary bit on the fly: 0 -> 1, 1 -> 0.',
    alphabet: ['0', '1'],
    outputAlphabet: ['0', '1'],
    states: [
      { id: 'c0', label: 'COMP', isStart: true, isFinal: false, desc: 'Complement state' },
    ],
    transitions: [
      { from: 'c0', to: 'c0', symbols: ['0'], output: '1' },
      { from: 'c0', to: 'c0', symbols: ['1'], output: '0' },
    ],
  },
];

export const UniversalModelBuilder: React.FC<UniversalModelBuilderProps> = ({
  initialMachine,
  onSave,
  onSendToConversion,
  onSendToMinimization,
  onSendToSimulator,
  onCancel,
}) => {
  // Mode: Beginner (guided) vs Advanced (matrix & JSON)
  const [builderMode, setBuilderMode] = useState<'beginner' | 'advanced'>('beginner');
  const [activeTermKey, setActiveTermKey] = useState<TermKey | null>(null);

  // Machine Attributes
  const [machineType, setMachineType] = useState<AutomatonType>(initialMachine?.type || 'DFA');
  const [machineName, setMachineName] = useState<string>(initialMachine?.name || 'My Custom Automaton');
  const [alphabetStr, setAlphabetStr] = useState<string>(
    initialMachine?.alphabet.join(', ') || 'a, b'
  );
  const [outputAlphabetStr, setOutputAlphabetStr] = useState<string>(
    initialMachine?.outputAlphabet?.join(', ') || '0, 1'
  );

  // State Nodes
  const [states, setStates] = useState<StateNode[]>(
    initialMachine?.states && initialMachine.states.length > 0
      ? initialMachine.states
      : [
          { id: 'q0', label: 'q0', x: 200, y: 180, isStart: true, isFinal: false, description: 'Initial state' },
          { id: 'q1', label: 'q1', x: 420, y: 180, isStart: false, isFinal: true, description: 'Accepting state' },
        ]
  );

  const [startStateId, setStartStateId] = useState<string>(
    initialMachine?.startStateId || 'q0'
  );

  const [finalStateIds, setFinalStateIds] = useState<string[]>(
    initialMachine?.finalStateIds || ['q1']
  );

  // Transitions List
  const [transitions, setTransitions] = useState<TransitionEdge[]>(
    initialMachine?.transitions || [
      { id: 't0', from: 'q0', to: 'q0', symbols: ['a'] },
      { id: 't1', from: 'q0', to: 'q1', symbols: ['b'] },
      { id: 't2', from: 'q1', to: 'q1', symbols: ['a'] },
      { id: 't3', from: 'q1', to: 'q0', symbols: ['b'] },
    ]
  );

  // Derived Alphabet
  const alphabet = alphabetStr
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  // Load a starter template
  const handleApplyTemplate = (tmpl: typeof STARTER_TEMPLATES[0]) => {
    setMachineName(tmpl.name);
    setMachineType(tmpl.type);
    setAlphabetStr(tmpl.alphabet.join(', '));
    if (tmpl.outputAlphabet) {
      setOutputAlphabetStr(tmpl.outputAlphabet.join(', '));
    }

    const newStates: StateNode[] = tmpl.states.map((st, idx) => ({
      id: st.id,
      label: st.label,
      x: 180 + idx * 200,
      y: 180,
      isStart: st.isStart,
      isFinal: st.isFinal,
      output: st.output,
      description: st.desc,
    }));

    const positioned = layoutNodes(newStates);
    setStates(positioned);

    const startSt = tmpl.states.find(s => s.isStart)?.id || tmpl.states[0].id;
    setStartStateId(startSt);

    const finalSts = tmpl.states.filter(s => s.isFinal).map(s => s.id);
    setFinalStateIds(finalSts);

    const newTransitions: TransitionEdge[] = tmpl.transitions.map((t, idx) => ({
      id: `tmpl-edge-${idx}`,
      from: t.from,
      to: t.to,
      symbols: [...t.symbols],
      output: t.output,
    }));

    setTransitions(newTransitions);
  };

  // State Management
  const handleAddState = () => {
    const nextIdx = states.length;
    const newId = `q${nextIdx}`;
    const newState: StateNode = {
      id: newId,
      label: newId,
      x: 180 + (nextIdx % 4) * 160,
      y: 180 + Math.floor(nextIdx / 4) * 120,
      isStart: states.length === 0,
      isFinal: false,
      output: '0',
      description: `State ${newId}`,
    };
    const updated = [...states, newState];
    setStates(updated);
    if (states.length === 0) setStartStateId(newId);
  };

  const handleRemoveState = (idToRemove: string) => {
    if (states.length <= 1) return;
    const updated = states.filter(s => s.id !== idToRemove);
    setStates(updated);
    if (startStateId === idToRemove) {
      setStartStateId(updated[0]?.id || '');
    }
    setFinalStateIds(prev => prev.filter(id => id !== idToRemove));
    setTransitions(prev => prev.filter(t => t.from !== idToRemove && t.to !== idToRemove));
  };

  const handleToggleFinalState = (stateId: string) => {
    if (finalStateIds.includes(stateId)) {
      setFinalStateIds(prev => prev.filter(id => id !== stateId));
    } else {
      setFinalStateIds(prev => [...prev, stateId]);
    }
  };

  // Transition Matrix helpers for Advanced mode
  const getDfaTarget = (fromStateId: string, symbol: string): string => {
    const edge = transitions.find(t => t.from === fromStateId && t.symbols.includes(symbol));
    return edge ? edge.to : '';
  };

  const setDfaTarget = (fromStateId: string, symbol: string, toStateId: string) => {
    if (!toStateId) {
      // Remove symbol from transitions
      setTransitions(prev =>
        prev
          .map(t => {
            if (t.from === fromStateId && t.symbols.includes(symbol)) {
              return { ...t, symbols: t.symbols.filter(s => s !== symbol) };
            }
            return t;
          })
          .filter(t => t.symbols.length > 0)
      );
      return;
    }

    setTransitions(prev => {
      // Clean old occurrence of symbol from this state
      const cleaned = prev
        .map(t => {
          if (t.from === fromStateId && t.symbols.includes(symbol)) {
            return { ...t, symbols: t.symbols.filter(s => s !== symbol) };
          }
          return t;
        })
        .filter(t => t.symbols.length > 0);

      // Check if edge from -> to already exists
      const existing = cleaned.find(t => t.from === fromStateId && t.to === toStateId);
      if (existing) {
        return cleaned.map(t =>
          t.id === existing.id
            ? { ...t, symbols: Array.from(new Set([...t.symbols, symbol])) }
            : t
        );
      } else {
        return [
          ...cleaned,
          {
            id: `edge-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            from: fromStateId,
            to: toStateId,
            symbols: [symbol],
          },
        ];
      }
    });
  };

  // NFA / multi-destination transitions
  const getNfaTargets = (fromStateId: string, symbol: string): string[] => {
    const matching = transitions.filter(t => t.from === fromStateId && t.symbols.includes(symbol));
    return matching.map(t => t.to);
  };

  const toggleNfaTarget = (fromStateId: string, symbol: string, targetStateId: string) => {
    const isPresent = transitions.some(
      t => t.from === fromStateId && t.to === targetStateId && t.symbols.includes(symbol)
    );

    if (isPresent) {
      setTransitions(prev =>
        prev
          .map(t => {
            if (t.from === fromStateId && t.to === targetStateId && t.symbols.includes(symbol)) {
              return { ...t, symbols: t.symbols.filter(s => s !== symbol) };
            }
            return t;
          })
          .filter(t => t.symbols.length > 0)
      );
    } else {
      setTransitions(prev => {
        const existing = prev.find(t => t.from === fromStateId && t.to === targetStateId);
        if (existing) {
          return prev.map(t =>
            t.id === existing.id
              ? { ...t, symbols: Array.from(new Set([...t.symbols, symbol])) }
              : t
          );
        } else {
          return [
            ...prev,
            {
              id: `edge-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              from: fromStateId,
              to: targetStateId,
              symbols: [symbol],
            },
          ];
        }
      });
    }
  };

  // Construct complete machine definition
  const buildCurrentMachine = (): AutomatonDefinition => {
    const finalStatesWithFlags = states.map(s => ({
      ...s,
      isStart: s.id === startStateId,
      isFinal: finalStateIds.includes(s.id),
    }));

    return {
      id: initialMachine?.id || `user-machine-${Date.now()}`,
      name: machineName.trim() || 'Custom Automaton',
      type: machineType,
      alphabet,
      outputAlphabet:
        machineType === 'MOORE' || machineType === 'MEALY'
          ? outputAlphabetStr.split(',').map(s => s.trim()).filter(Boolean)
          : undefined,
      states: finalStatesWithFlags,
      transitions,
      startStateId,
      finalStateIds,
      updatedAt: new Date().toISOString(),
    };
  };

  const currentMachineDef = buildCurrentMachine();
  const stats = analyzeMachine(currentMachineDef);

  // Validation warnings
  const validationWarnings: string[] = [];
  if (states.length === 0) {
    validationWarnings.push('At least one state must exist.');
  }
  if (!startStateId) {
    validationWarnings.push('Please designate an initial start state (→).');
  }
  if (finalStateIds.length === 0 && machineType !== 'MOORE' && machineType !== 'MEALY') {
    validationWarnings.push('No accepting (final) states selected: this machine currently rejects all input strings.');
  }
  if (machineType === 'DFA' && stats.missingTransitions.length > 0) {
    validationWarnings.push(
      `DFA Incompleteness: ${stats.missingTransitions.length} transitions are missing (e.g. state ${
        stats.missingTransitions[0].stateId
      } on '${stats.missingTransitions[0].symbol}'). In a DFA, every state needs exactly one transition per alphabet character.`
    );
  }
  if (machineType === 'DFA' && !stats.isDeterministic) {
    validationWarnings.push('Multiple transitions or ε-moves found for the same symbol. Convert to NFA or resolve duplicates.');
  }

  // Handle Export / Import JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentMachineDef, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${machineName.toLowerCase().replace(/\s+/g, '-')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (parsed.states && parsed.transitions) {
          setMachineName(parsed.name || 'Imported Machine');
          setMachineType(parsed.type || 'DFA');
          setAlphabetStr(parsed.alphabet?.join(', ') || 'a, b');
          setStates(parsed.states);
          setStartStateId(parsed.startStateId || parsed.states[0]?.id || 'q0');
          setFinalStateIds(parsed.finalStateIds || []);
          setTransitions(parsed.transitions);
        }
      } catch (err) {
        alert('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-10">
      {/* Top Banner: Mode & Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white font-['Outfit'] flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <span>Universal Automata Builder</span>
            </h2>
            <span
              className={`px-2.5 py-0.5 text-[10px] font-bold rounded-lg border ${
                builderMode === 'beginner'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
              }`}
            >
              {builderMode === 'beginner' ? '🟢 Beginner Guided Mode' : '🔵 Advanced Tabular Mode'}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Construct arbitrary finite state machines through interactive visual controls
          </p>
        </div>

        {/* Mode Toggle & Term Helper */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setBuilderMode(builderMode === 'beginner' ? 'advanced' : 'beginner')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors shadow-sm"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Switch to {builderMode === 'beginner' ? 'Advanced' : 'Beginner'}</span>
          </button>

          <button
            onClick={() => setActiveTermKey('state')}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors border border-slate-700"
            title="Concepts & Terminology Guide"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </div>

      {/* Starter Templates Bar */}
      <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-2xl space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 font-semibold text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Quick Starter Templates (Beginner Friendly):
          </span>
          <span className="text-[11px] text-slate-500">Click to instantly populate</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {STARTER_TEMPLATES.map((tmpl, idx) => (
            <button
              key={idx}
              onClick={() => handleApplyTemplate(tmpl)}
              className="px-3 py-1.5 bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-xs whitespace-nowrap transition-colors flex items-center gap-2 shrink-0 group"
            >
              <span className="font-semibold">{tmpl.name}</span>
              <span className="px-1.5 py-0.2 text-[9px] bg-slate-800 group-hover:bg-slate-700 text-cyan-300 rounded">
                {tmpl.badge}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Step 1 & 2: Machine Definition Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Machine Type & Name */}
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Step 1: Machine Type & Name</span>
              <button
                onClick={() => setActiveTermKey('state')}
                className="text-slate-500 hover:text-cyan-400"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </label>
            <span className="text-[10px] text-slate-500 font-mono">Formal Model</span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
            {(['DFA', 'NFA', 'ENFA', 'MOORE', 'MEALY'] as AutomatonType[]).map(t => (
              <button
                key={t}
                onClick={() => setMachineType(t)}
                className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-all ${
                  machineType === t
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                    : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                }`}
              >
                {t === 'ENFA' ? 'ε-NFA' : t}
              </button>
            ))}
          </div>

          <div>
            <label className="text-[11px] text-slate-400 mb-1 block">Machine Title / Problem:</label>
            <input
              type="text"
              value={machineName}
              onChange={e => setMachineName(e.target.value)}
              placeholder="e.g., Even number of b's"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500 shadow-inner"
            />
          </div>
        </div>

        {/* Alphabet & Symbols */}
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Step 2: Input Alphabet (Σ)</span>
              <button
                onClick={() => setActiveTermKey('alphabet')}
                className="text-slate-500 hover:text-cyan-400"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </label>
            <span className="text-[10px] text-cyan-400 font-mono">
              {alphabet.length} symbols: {'{' + alphabet.join(', ') + '}'}
            </span>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 mb-1 block">
              Allowed Characters (comma separated):
            </label>
            <input
              type="text"
              value={alphabetStr}
              onChange={e => setAlphabetStr(e.target.value)}
              placeholder="a, b (or 0, 1)"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-cyan-300 font-mono text-xs focus:outline-none focus:border-indigo-500 shadow-inner"
            />
          </div>

          {(machineType === 'MOORE' || machineType === 'MEALY') && (
            <div>
              <label className="text-[11px] text-slate-400 mb-1 flex items-center justify-between">
                <span>Output Alphabet (Δ):</span>
                <button
                  onClick={() => setActiveTermKey(machineType === 'MOORE' ? 'moore_output' : 'mealy_output')}
                  className="text-slate-500 hover:text-cyan-400"
                >
                  <HelpCircle className="w-3 h-3" />
                </button>
              </label>
              <input
                type="text"
                value={outputAlphabetStr}
                onChange={e => setOutputAlphabetStr(e.target.value)}
                placeholder="0, 1"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-purple-300 font-mono text-xs focus:outline-none focus:border-indigo-500 shadow-inner"
              />
            </div>
          )}
        </div>
      </div>

      {/* Step 3: States Configuration */}
      <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Step 3: State Management (Q)</span>
              <button
                onClick={() => setActiveTermKey('state')}
                className="text-slate-500 hover:text-cyan-400"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </h3>
            <p className="text-[11px] text-slate-400">
              Create memory states. Click <span className="text-cyan-300">Start (→)</span> or{' '}
              <span className="text-purple-300">Final (◎)</span> to configure roles.
            </p>
          </div>

          <button
            onClick={handleAddState}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add State</span>
          </button>
        </div>

        {/* State Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {states.map(st => {
            const isStart = st.id === startStateId;
            const isFinal = finalStateIds.includes(st.id);

            return (
              <div
                key={st.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isStart
                    ? 'bg-slate-950 border-cyan-500/60 shadow-md shadow-cyan-500/5'
                    : isFinal
                    ? 'bg-slate-950 border-purple-500/60 shadow-md shadow-purple-500/5'
                    : 'bg-slate-950/80 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white text-xs font-mono">{st.label || st.id}</span>
                    {isStart && (
                      <span className="px-1.5 py-0.2 text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded">
                        START
                      </span>
                    )}
                    {isFinal && (
                      <span className="px-1.5 py-0.2 text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded">
                        FINAL
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleRemoveState(st.id)}
                    disabled={states.length <= 1}
                    className="p-1 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-20"
                    title="Delete state"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* State Label & Description */}
                <div className="space-y-1.5 text-[11px]">
                  <input
                    type="text"
                    value={st.label}
                    onChange={e => {
                      const newLabel = e.target.value;
                      setStates(prev => prev.map(s => (s.id === st.id ? { ...s, label: newLabel } : s)));
                    }}
                    placeholder="State name"
                    className="w-full px-2 py-1 bg-slate-900 border border-slate-700/80 rounded-lg text-slate-200 font-mono text-xs focus:outline-none focus:border-indigo-500"
                  />

                  {machineType === 'MOORE' && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 text-[10px]">Output:</span>
                      <input
                        type="text"
                        value={st.output || '0'}
                        onChange={e => {
                          const val = e.target.value;
                          setStates(prev => prev.map(s => (s.id === st.id ? { ...s, output: val } : s)));
                        }}
                        className="w-12 px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-purple-300 font-mono text-xs text-center"
                      />
                    </div>
                  )}

                  {/* Actions: Start & Final Toggles */}
                  <div className="flex items-center gap-1 pt-1">
                    <button
                      onClick={() => setStartStateId(st.id)}
                      className={`flex-1 py-1 text-[10px] font-semibold rounded-lg border transition-colors ${
                        isStart
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {isStart ? '✓ Start State' : 'Set Start'}
                    </button>

                    <button
                      onClick={() => handleToggleFinalState(st.id)}
                      className={`flex-1 py-1 text-[10px] font-semibold rounded-lg border transition-colors ${
                        isFinal
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {isFinal ? '✓ Final' : 'Set Final'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 4: Interactive Transition Matrix / Builder */}
      <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Step 4: Transition Table (δ)</span>
              <button
                onClick={() => setActiveTermKey('transition')}
                className="text-slate-500 hover:text-cyan-400"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </h3>
            <p className="text-[11px] text-slate-400">
              {machineType === 'DFA'
                ? 'Select destination state for each symbol. In a DFA, every state needs exactly one target.'
                : machineType === 'MOORE'
                ? 'Specify target state for each state and alphabet input.'
                : machineType === 'MEALY'
                ? 'Specify target state and transition output (NextState / Output).'
                : 'Choose one or more target states for each transition (Nondeterminism supported).'}
            </p>
          </div>

          <span className="text-[10px] font-mono text-cyan-400">
            {transitions.length} transitions registered
          </span>
        </div>

        {/* Transition Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-300 font-sans">
                <th className="py-2.5 px-3 font-semibold">Current State (q)</th>
                {alphabet.map(sym => (
                  <th key={sym} className="py-2.5 px-3 font-semibold text-cyan-300">
                    Input '{sym}'
                  </th>
                ))}
                {machineType === 'ENFA' && (
                  <th className="py-2.5 px-3 font-semibold text-amber-300">
                    Epsilon 'ε'
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
              {states.map(st => {
                const isStart = st.id === startStateId;
                const isFinal = finalStateIds.includes(st.id);

                return (
                  <tr key={st.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-2 px-3 font-bold text-slate-200">
                      <span className="text-cyan-400">{isStart ? '→ ' : ''}</span>
                      <span className="text-purple-400">{isFinal ? '* ' : ''}</span>
                      {st.label}
                    </td>

                    {/* Alphabet columns */}
                    {alphabet.map(sym => {
                      if (machineType === 'DFA' || machineType === 'MOORE') {
                        const target = getDfaTarget(st.id, sym);
                        return (
                          <td key={sym} className="py-2 px-3">
                            <select
                              value={target}
                              onChange={e => setDfaTarget(st.id, sym, e.target.value)}
                              className={`px-2.5 py-1.5 rounded-xl border text-xs font-mono focus:outline-none ${
                                target
                                  ? 'bg-slate-900 border-slate-700 text-white font-semibold'
                                  : 'bg-rose-950/30 border-rose-800 text-rose-300'
                              }`}
                            >
                              <option value="">-- Missing --</option>
                              {states.map(tgt => (
                                <option key={tgt.id} value={tgt.id}>
                                  {tgt.label}
                                </option>
                              ))}
                            </select>
                          </td>
                        );
                      }

                      if (machineType === 'MEALY') {
                        const edge = transitions.find(t => t.from === st.id && t.symbols.includes(sym));
                        const target = edge?.to || '';
                        const out = edge?.output || '0';

                        return (
                          <td key={sym} className="py-2 px-3">
                            <div className="flex items-center gap-1.5">
                              <select
                                value={target}
                                onChange={e => {
                                  const newTarget = e.target.value;
                                  setDfaTarget(st.id, sym, newTarget);
                                }}
                                className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs font-mono"
                              >
                                <option value="">--</option>
                                {states.map(tgt => (
                                  <option key={tgt.id} value={tgt.id}>
                                    {tgt.label}
                                  </option>
                                ))}
                              </select>
                              <span className="text-slate-500 font-bold">/</span>
                              <input
                                type="text"
                                value={out}
                                onChange={e => {
                                  const newOut = e.target.value;
                                  setTransitions(prev =>
                                    prev.map(t =>
                                      t.from === st.id && t.symbols.includes(sym)
                                        ? { ...t, output: newOut }
                                        : t
                                    )
                                  );
                                }}
                                placeholder="out"
                                className="w-10 px-1.5 py-1 bg-slate-900 border border-slate-700 rounded text-purple-300 text-center text-xs font-mono"
                              />
                            </div>
                          </td>
                        );
                      }

                      // NFA / ENFA: multiple destinations
                      const targets = getNfaTargets(st.id, sym);
                      return (
                        <td key={sym} className="py-2 px-3">
                          <div className="flex flex-wrap items-center gap-1">
                            {states.map(tgt => {
                              const selected = targets.includes(tgt.id);
                              return (
                                <button
                                  key={tgt.id}
                                  onClick={() => toggleNfaTarget(st.id, sym, tgt.id)}
                                  className={`px-1.5 py-0.5 rounded text-[11px] font-bold border transition-colors ${
                                    selected
                                      ? 'bg-indigo-600 text-white border-indigo-400'
                                      : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
                                  }`}
                                >
                                  {tgt.label}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      );
                    })}

                    {/* Epsilon Column for ENFA */}
                    {machineType === 'ENFA' && (
                      <td className="py-2 px-3">
                        <div className="flex flex-wrap items-center gap-1">
                          {states.map(tgt => {
                            const selected = getNfaTargets(st.id, 'ε').includes(tgt.id);
                            return (
                              <button
                                key={tgt.id}
                                onClick={() => toggleNfaTarget(st.id, 'ε', tgt.id)}
                                className={`px-1.5 py-0.5 rounded text-[11px] font-bold border transition-colors ${
                                  selected
                                    ? 'bg-amber-600 text-white border-amber-400'
                                    : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
                                }`}
                              >
                                {tgt.label}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Validation Banner if warnings exist */}
      {validationWarnings.length > 0 && (
        <div className="p-4 bg-amber-950/40 border border-amber-800/60 rounded-2xl space-y-1.5 text-xs text-amber-200">
          <div className="font-bold flex items-center gap-1.5 text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Machine Validation Feedback:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-amber-200/90 text-[11px]">
            {validationWarnings.map((warn, i) => (
              <li key={i}>{warn}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons Toolbar */}
      <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSave(currentMachineDef)}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-500/10"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Apply Machine to Lab</span>
          </button>

          {onSendToConversion && (
            <button
              onClick={() => onSendToConversion(currentMachineDef)}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition-colors shadow-sm"
            >
              <span>Send to Conversion Lab</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {onSendToMinimization && (
            <button
              onClick={() => onSendToMinimization(currentMachineDef)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-colors border border-slate-700"
            >
              <span>Minimize DFA</span>
            </button>
          )}

          {onSendToSimulator && (
            <button
              onClick={() => onSendToSimulator(currentMachineDef)}
              className="flex items-center gap-1.5 px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded-xl transition-colors"
            >
              <span>Test in Simulator</span>
            </button>
          )}
        </div>

        {/* JSON Import / Export */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors border border-slate-700">
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Import JSON</span>
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>

          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-colors border border-slate-700"
            title="Download JSON definition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Term Explainer Modal */}
      <TermExplainerModal
        termKey={activeTermKey}
        onClose={() => setActiveTermKey(null)}
      />
    </div>
  );
};
