import React, { useState } from 'react';
import { AutomatonDefinition } from '../../types/automata';
import { minimizeDFA, MinimizationReport } from '../../algorithms/dfaMinimization';
import { AutomataCanvas } from '../canvas/AutomataCanvas';
import { Minimize2, ArrowRight, CheckCircle2, Hammer, BookOpen, Layers } from 'lucide-react';
import { NavigationTab } from '../layout/Sidebar';
import { predefinedAutomata } from '../../data/predefinedExamples';

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
  // Use current machine or a suitable DFA
  const defaultDfa = currentMachine.type === 'DFA' ? currentMachine : predefinedAutomata[1];
  const [sourceMachine, setSourceMachine] = useState<AutomatonDefinition>(defaultDfa);

  const report: MinimizationReport = minimizeDFA(sourceMachine);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-['Outfit'] flex items-center gap-2">
            <Minimize2 className="w-6 h-6 text-purple-400" />
            <span>DFA Minimization Lab</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Hopcroft partition refinement algorithm: eliminate unreachable states, detect equivalence classes, and merge indistinguishable states
          </p>
        </div>

        {/* State Reduction Banner */}
        <div className="flex items-center gap-3 p-3 bg-slate-900 border border-slate-800 rounded-2xl">
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

      {/* Step Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Step 1: Reachability */}
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg space-y-2 text-xs">
          <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
            Phase 1
          </span>
          <h4 className="font-bold text-white">Unreachable State Elimination</h4>
          <p className="text-slate-400 leading-relaxed">
            {report.unreachableStatesRemoved.length > 0
              ? `Discarded ${report.unreachableStatesRemoved.length} unreachable state(s): {${report.unreachableStatesRemoved.join(', ')}}`
              : 'All states in Q are reachable from start state q0 via BFS traversal.'}
          </p>
        </div>

        {/* Step 2: Initial Partition */}
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg space-y-2 text-xs">
          <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-500/20 text-purple-300 rounded border border-purple-500/30">
            Phase 2
          </span>
          <h4 className="font-bold text-white">Initial Partition P0</h4>
          <p className="text-slate-400 leading-relaxed font-mono">
            P0 = {`{ Non-Final: {${report.initialPartition[0]?.map(id => sourceMachine.states.find(s => s.id === id)?.label || id).join(', ') || '∅'}}, Final: {${report.initialPartition[1]?.map(id => sourceMachine.states.find(s => s.id === id)?.label || id).join(', ') || '∅'}} }`}
          </p>
        </div>

        {/* Step 3: Refinement Result */}
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg space-y-2 text-xs">
          <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
            Phase 3
          </span>
          <h4 className="font-bold text-white">Equivalence Classes</h4>
          <p className="text-slate-400 leading-relaxed">
            {report.isAlreadyMinimal
              ? '✓ This DFA was already in its unique minimal form.'
              : `Successfully collapsed indistinguishable states into ${report.statesAfter} minimal equivalence classes.`}
          </p>
        </div>
      </div>

      {/* Partition Iterations History Table */}
      <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-400" />
          <span>Iterative Partition Refinement History</span>
        </h3>

        <div className="space-y-2 text-xs font-mono">
          {report.iterations.map(iter => (
            <div
              key={iter.iterationNumber}
              className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-slate-800 text-purple-300 font-bold rounded">
                  Iter {iter.iterationNumber}
                </span>
                <span className="text-slate-200">
                  {iter.partition
                    .map(
                      group =>
                        `{${group
                          .map(id => sourceMachine.states.find(s => s.id === id)?.label || id)
                          .join(', ')}}`
                    )
                    .join(' | ')}
                </span>
              </div>

              <span className="text-slate-400 font-sans text-[11px]">{iter.notes}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Side-by-Side Visual Canvas Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Original DFA */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">
              Original DFA ({sourceMachine.states.length} states)
            </h3>
          </div>
          <div className="h-[400px] w-full">
            <AutomataCanvas
              machine={sourceMachine}
              onChangeMachine={setSourceMachine}
              isEditable={false}
            />
          </div>
        </div>

        {/* Minimized DFA */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-emerald-400">
              Minimized DFA ({report.minimizedMachine.states.length} states)
            </h3>

            <button
              onClick={() => {
                onLoadIntoBuilder(report.minimizedMachine);
                onNavigate('builder');
              }}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-1.5 transition-all"
            >
              <Hammer className="w-3.5 h-3.5" />
              <span>Load in Builder</span>
            </button>
          </div>
          <div className="h-[400px] w-full">
            <AutomataCanvas
              machine={report.minimizedMachine}
              onChangeMachine={() => {}}
              isEditable={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
