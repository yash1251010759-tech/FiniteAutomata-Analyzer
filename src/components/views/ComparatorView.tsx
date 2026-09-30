import React, { useState } from 'react';
import { AutomatonDefinition, EquivalenceResult } from '../../types/automata';
import { checkEquivalence } from '../../algorithms/equivalence';
import { simulateAutomaton } from '../../algorithms/dfaSimulation';
import { predefinedAutomata } from '../../data/predefinedExamples';
import { Scale, CheckCircle2, XCircle, ArrowRight, BookOpen, Layers } from 'lucide-react';
import { AutomataCanvas } from '../canvas/AutomataCanvas';

interface ComparatorViewProps {
  currentMachine: AutomatonDefinition;
}

export const ComparatorView: React.FC<ComparatorViewProps> = ({ currentMachine }) => {
  const [machineA, setMachineA] = useState<AutomatonDefinition>(currentMachine);
  const [machineB, setMachineB] = useState<AutomatonDefinition>(predefinedAutomata[1]);
  const [result, setResult] = useState<EquivalenceResult | null>(() =>
    checkEquivalence(currentMachine, predefinedAutomata[1])
  );

  const handleCompare = () => {
    const res = checkEquivalence(machineA, machineB);
    setResult(res);
  };

  // Trace simulation for counterexample if found
  const simA = result?.counterexample !== undefined ? simulateAutomaton(machineA, result.counterexample) : null;
  const simB = result?.counterexample !== undefined ? simulateAutomaton(machineB, result.counterexample) : null;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white font-['Outfit'] flex items-center gap-2">
          <Scale className="w-6 h-6 text-indigo-400" />
          <span>Automata Equivalence Checker & Comparator</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Formally verify whether two finite automata recognize the exact same language L(M1) == L(M2), or find the shortest counterexample
        </p>
      </div>

      {/* Machine Selectors & Compare CTA */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-4 backdrop-blur-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Machine A Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">
              Select Automaton A:
            </label>
            <select
              value={machineA.id}
              onChange={e => {
                const found = predefinedAutomata.find(m => m.id === e.target.value);
                if (found) setMachineA(found);
              }}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {predefinedAutomata.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.type}, {m.states.length} states)
                </option>
              ))}
            </select>
          </div>

          {/* Machine B Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">
              Select Automaton B:
            </label>
            <select
              value={machineB.id}
              onChange={e => {
                const found = predefinedAutomata.find(m => m.id === e.target.value);
                if (found) setMachineB(found);
              }}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {predefinedAutomata.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.type}, {m.states.length} states)
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleCompare}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 active:scale-95"
          >
            <Scale className="w-4 h-4" />
            <span>Check Formal Equivalence</span>
          </button>
        </div>
      </div>

      {/* Comparison Outcome Banner */}
      {result && (
        <div
          className={`p-6 rounded-3xl border shadow-xl space-y-3 ${
            result.equivalent
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
              : 'bg-rose-950/40 border-rose-800/60 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {result.equivalent ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
            )}
            <div>
              <h3 className="text-base font-bold">
                {result.equivalent ? 'AUTOMATA ARE 100% EQUIVALENT' : 'AUTOMATA ARE NOT EQUIVALENT'}
              </h3>
              <p className="text-xs leading-relaxed opacity-90">{result.message}</p>
            </div>
          </div>

          {!result.equivalent && result.counterexample !== undefined && (
            <div className="p-4 bg-slate-950/90 rounded-2xl border border-rose-900/40 space-y-2 text-xs font-mono text-slate-200">
              <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block font-sans">
                Shortest Distinguishing Counterexample String:
              </span>
              <div className="text-sm font-bold text-white bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                w = "{result.counterexample === '' ? 'ε (empty string)' : result.counterexample}"
              </div>
              <div className="flex items-center gap-4 text-xs pt-1">
                <span>
                  Machine A ({machineA.name}):{' '}
                  <strong className={result.m1Result ? 'text-emerald-400' : 'text-rose-400'}>
                    {result.m1Result ? 'ACCEPT' : 'REJECT'}
                  </strong>
                </span>
                <span>
                  Machine B ({machineB.name}):{' '}
                  <strong className={result.m2Result ? 'text-emerald-400' : 'text-rose-400'}>
                    {result.m2Result ? 'ACCEPT' : 'REJECT'}
                  </strong>
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Side-by-Side Canvas Visuals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white">Automaton A: {machineA.name}</h3>
          <div className="h-[380px] w-full">
            <AutomataCanvas
              machine={machineA}
              onChangeMachine={setMachineA}
              isEditable={false}
            />
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white">Automaton B: {machineB.name}</h3>
          <div className="h-[380px] w-full">
            <AutomataCanvas
              machine={machineB}
              onChangeMachine={setMachineB}
              isEditable={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
