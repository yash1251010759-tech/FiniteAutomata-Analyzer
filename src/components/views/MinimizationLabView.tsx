import React, { useState } from 'react';
import { AutomatonDefinition } from '../../types/automata';
import { minimizeDFA, MinimizationReport } from '../../algorithms/dfaMinimization';
import { AutomataCanvas } from '../canvas/AutomataCanvas';
import {
  Minimize2,
  ArrowRight,
  CheckCircle2,
  Hammer,
  BookOpen,
  Layers,
  Sparkles,
  HelpCircle,
  Play,
  RotateCcw,
} from 'lucide-react';
import { NavigationTab } from '../layout/Sidebar';
import { predefinedAutomata } from '../../data/predefinedExamples';
import { UniversalModelBuilder } from '../common/UniversalModelBuilder';
import { UniversalStringSimulator } from '../common/UniversalStringSimulator';
import { TermExplainerModal, TermKey } from '../common/TermExplainerModal';

interface MinimizationLabViewProps {
  currentMachine: AutomatonDefinition;
  onLoadIntoBuilder: (machine: AutomatonDefinition) => void;
  onNavigate: (tab: NavigationTab) => void;
}

export const MinimizationLabView: React.FC<MinimizationLabViewProps> = ({
  currentMachine,
  onLoadIntoBuilder,
  onNavigate,
}) => {
  const defaultDfa = currentMachine.type === 'DFA' ? currentMachine : predefinedAutomata[1];
  const [sourceMachine, setSourceMachine] = useState<AutomatonDefinition>(defaultDfa);
  const [isEditingMachine, setIsEditingMachine] = useState<boolean>(false);
  const [activeTermKey, setActiveTermKey] = useState<TermKey | null>(null);

  const report: MinimizationReport = minimizeDFA(sourceMachine);
  const minimizedMachine = report.minimizedMachine;

  // Filter available DFA examples
  const dfaExamples = predefinedAutomata.filter(m => m.type === 'DFA');

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white font-['Outfit'] flex items-center gap-2">
              <Minimize2 className="w-6 h-6 text-purple-400" />
              <span>DFA Minimization Lab</span>
            </h2>
            <span className="px-2.5 py-0.5 text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg">
              Hopcroft Algorithm
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Eliminate unreachable states, detect indistinguishable equivalence classes, and synthesize the canonical minimal DFA
          </p>
        </div>

        {/* State Reduction Banner */}
        <div className="flex items-center gap-3 p-3 bg-slate-950/80 border border-slate-800 rounded-2xl">
          <div className="text-right font-mono text-xs">
            <span className="text-slate-400 block text-[10px]">STATES BEFORE</span>
            <span className="text-sm font-bold text-white">{report.statesBefore} states</span>
          </div>
          <ArrowRight className="w-4 h-4 text-purple-400" />
          <div className="font-mono text-xs">
            <span className="text-slate-400 block text-[10px]">MINIMAL STATES</span>
            <span className="text-sm font-bold text-emerald-400">{report.statesAfter} states</span>
          </div>
        </div>
      </div>

      {/* Action Bar for Custom Input */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditingMachine(!isEditingMachine)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-colors shadow-sm"
          >
            <Hammer className="w-3.5 h-3.5" />
            <span>{isEditingMachine ? 'Close Builder' : 'Create / Enter My Own DFA'}</span>
          </button>

          <button
            onClick={() => setSourceMachine(currentMachine.type === 'DFA' ? currentMachine : predefinedAutomata[1])}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl font-semibold border border-slate-700 transition-colors"
          >
            Use Active Canvas DFA
          </button>
        </div>

        {/* Example Presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-slate-500 text-[11px] shrink-0">Presets:</span>
          {dfaExamples.slice(0, 4).map(ex => (
            <button
              key={ex.id}
              onClick={() => setSourceMachine(ex)}
              className={`px-2.5 py-1 rounded-lg border text-[11px] whitespace-nowrap transition-colors ${
                sourceMachine.id === ex.id
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 font-bold'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {ex.name}
            </button>
          ))}
        </div>
      </div>

      {/* Embedded Builder for Custom DFA */}
      {isEditingMachine && (
        <div className="p-1 bg-slate-950/60 rounded-3xl border border-purple-500/30">
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

      {/* 3 Step Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Step 1: Reachability */}
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
              Phase 1
            </span>
            <button onClick={() => setActiveTermKey('state')} className="text-slate-500 hover:text-cyan-400">
              <HelpCircle className="w-3 h-3" />
            </button>
          </div>
          <h4 className="font-bold text-white">Unreachable State Pruning</h4>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            {report.unreachableStatesRemoved.length > 0
              ? `Eliminated ${report.unreachableStatesRemoved.length} unreachable dead state(s): {${report.unreachableStatesRemoved.join(', ')}} via BFS.`
              : 'All states in Q are reachable from start state q0 via directed paths.'}
          </p>
        </div>

        {/* Step 2: Initial Partition */}
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-500/20 text-purple-300 rounded border border-purple-500/30">
              Phase 2
            </span>
            <button onClick={() => setActiveTermKey('final_state')} className="text-slate-500 hover:text-cyan-400">
              <HelpCircle className="w-3 h-3" />
            </button>
          </div>
          <h4 className="font-bold text-white">Initial Partition P0</h4>
          <p className="text-slate-300 leading-relaxed font-mono text-[11px]">
            P0 = {'{'}
            Non-Final: {'{'}{report.initialPartition[0]?.map(id => sourceMachine.states.find(s => s.id === id)?.label || id).join(', ') || '∅'}{'}'},
            Final: {'{'}{report.initialPartition[1]?.map(id => sourceMachine.states.find(s => s.id === id)?.label || id).join(', ') || '∅'}{'}'}
            {'}'}
          </p>
        </div>

        {/* Step 3: Refinement Result */}
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg space-y-2 text-xs">
          <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
            Phase 3
          </span>
          <h4 className="font-bold text-white">Equivalence Classes</h4>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            {report.isAlreadyMinimal
              ? '✓ This DFA was already minimal. No indistinguishable states were found.'
              : `Found equivalent states and collapsed machine to ${report.statesAfter} minimal composite states.`}
          </p>
        </div>
      </div>

      {/* Partition Iterations History Table */}
      <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-400" />
          <span>Iterative Partition Refinement History</span>
        </h3>

        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-300 font-sans">
                <th className="py-2.5 px-3">Iteration</th>
                <th className="py-2.5 px-3">Active Partition Groups P_k</th>
                <th className="py-2.5 px-3">Split Occurred?</th>
                <th className="py-2.5 px-3 font-sans">Hopcroft Refinement Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
              {report.iterations.map(it => (
                <tr key={it.iterationNumber} className="hover:bg-slate-900/60">
                  <td className="py-2.5 px-3 font-bold text-purple-300">
                    P_{it.iterationNumber}
                  </td>
                  <td className="py-2.5 px-3 text-slate-200">
                    {`{ ${it.partition
                      .map(g => `{${g.map(id => sourceMachine.states.find(s => s.id === id)?.label || id).join(', ')}}`)
                      .join(' , ')} }`}
                  </td>
                  <td className="py-2.5 px-3">
                    {it.splitOccurred ? (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
                        YES (Splitting)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded">
                        NO (Stable / Converged)
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-sans text-slate-400 text-[11px]">
                    {it.notes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dual Side-by-Side Visual Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Source Canvas */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-800 text-slate-300 rounded">
                ORIGINAL
              </span>
              <h4 className="font-bold text-white text-xs">{sourceMachine.name}</h4>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {report.statesBefore} states • {report.transitionsBefore} transitions
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

        {/* Minimized Canvas */}
        <div className="p-4 bg-slate-900 border border-purple-500/40 rounded-3xl space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded">
                MINIMIZED DFA
              </span>
              <h4 className="font-bold text-white text-xs">{minimizedMachine.name}</h4>
            </div>
            <span className="text-[10px] font-mono text-emerald-400">
              {report.statesAfter} states • {report.transitionsAfter} transitions
            </span>
          </div>

          <div className="h-64 rounded-2xl overflow-hidden border border-slate-800/80 bg-slate-950">
            <AutomataCanvas
              machine={minimizedMachine}
              onChangeMachine={() => {}}
              isEditable={false}
            />
          </div>
        </div>
      </div>

      {/* Universal String Simulator on Minimized DFA */}
      <UniversalStringSimulator
        model={{ type: 'FA', machine: minimizedMachine }}
        title="Verify Equivalence: Interactive String Simulator on Minimized DFA"
        defaultInput={minimizedMachine.alphabet.includes('b') ? 'abb' : '01'}
      />

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-5 bg-slate-900 border border-slate-800 rounded-3xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              onLoadIntoBuilder(minimizedMachine);
              onNavigate('builder');
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors shadow-md shadow-emerald-500/10"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Load Minimized DFA into Builder Canvas</span>
          </button>

          <button
            onClick={() => {
              onLoadIntoBuilder(minimizedMachine);
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
            const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(minimizedMachine, null, 2));
            const dl = document.createElement('a');
            dl.setAttribute('href', dataStr);
            dl.setAttribute('download', `${minimizedMachine.name.toLowerCase().replace(/\s+/g, '-')}.json`);
            dl.click();
          }}
          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
        >
          Export Minimized JSON
        </button>
      </div>

      <TermExplainerModal
        termKey={activeTermKey}
        onClose={() => setActiveTermKey(null)}
      />
    </div>
  );
};
