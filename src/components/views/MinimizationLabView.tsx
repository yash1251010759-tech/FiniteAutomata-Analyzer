import React, { useEffect, useState } from 'react';
import { AutomatonDefinition } from '../../types/automata';
import { minimizeDFA, MinimizationReport } from '../../algorithms/dfaMinimization';
import { AutomataCanvas } from '../canvas/AutomataCanvas';
import {
  Minimize2,
  ArrowRight,
  CheckCircle2,
  Hammer,
  Layers,
  HelpCircle,
  Play,
} from 'lucide-react';
import { NavigationTab } from '../layout/Sidebar';
import { predefinedAutomata } from '../../data/predefinedExamples';
import { UniversalModelBuilder } from '../common/UniversalModelBuilder';
import { UniversalStringSimulator } from '../common/UniversalStringSimulator';
import { TermExplainerModal, TermKey } from '../common/TermExplainerModal';
import { validateAutomaton } from '../../algorithms/automatonValidation';
import { convertNfaToDfa } from '../../algorithms/subsetConstruction';
import { regexToENFA } from '../../algorithms/regexToNfa';
import { checkAutomatonEquivalence } from '../../algorithms/automatonEquivalence';
import { simulateAutomaton } from '../../algorithms/dfaSimulation';
import { generateAutomatonFromNaturalLanguage } from '../../algorithms/naturalLanguageDfa';

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
  const [jsonInput, setJsonInput] = useState('');
  const [regexInput, setRegexInput] = useState('');
  const [naturalPrompt, setNaturalPrompt] = useState('');
  const [sourceError, setSourceError] = useState('');
  const [testInput, setTestInput] = useState('');
  const [testResults, setTestResults] = useState<{ original: boolean; minimized: boolean } | null>(null);
  const [activePhase, setActivePhase] = useState(0);
  const [isPlayingPhases, setIsPlayingPhases] = useState(false);

  const sourceValidation = validateAutomaton(sourceMachine);
  const dfaForMinimization = sourceValidation.errors.length > 0
    ? defaultDfa
    : sourceMachine.type === 'DFA'
      ? sourceMachine
      : convertNfaToDfa(sourceMachine).resultMachine;
  const report: MinimizationReport = minimizeDFA(dfaForMinimization);
  const minimizedMachine = report.minimizedMachine;
  const minimizationSteps = [
    ...(sourceMachine.type !== 'DFA' ? [`Convert ${sourceMachine.type} to a DFA using subset construction; ${dfaForMinimization.states.length} DFA states result.`] : []),
    sourceValidation.missingTransitions.length > 0
      ? `Complete the DFA by adding a trap state for ${sourceValidation.missingTransitions.length} missing transition(s).`
      : 'The DFA is complete; no trap state is needed.',
    report.unreachableStatesRemoved.length > 0
      ? `Remove unreachable states: ${report.unreachableStatesRemoved.join(', ')}.`
      : 'All states are reachable from the start state.',
    `Initialize partition P0 into final and non-final states (${report.initialPartition.length} blocks).`,
    ...report.iterations.map(iteration => iteration.notes),
    `Merge equivalent states into ${report.statesAfter} state(s).`,
  ];
  const currentPhase = Math.min(activePhase, minimizationSteps.length - 1);
  let equivalenceResult: ReturnType<typeof checkAutomatonEquivalence> | null = null;
  let equivalenceError = '';
  if (sourceValidation.errors.length === 0) {
    try {
      equivalenceResult = checkAutomatonEquivalence(sourceMachine, minimizedMachine);
    } catch (error) {
      equivalenceError = error instanceof Error ? error.message : String(error);
    }
  }

  useEffect(() => {
    if (!isPlayingPhases || minimizationSteps.length < 2) return;
    const timer = window.setInterval(() => {
      setActivePhase(index => (index + 1) % minimizationSteps.length);
    }, 1800);
    return () => window.clearInterval(timer);
  }, [isPlayingPhases, minimizationSteps.length]);

  const dfaExamples = predefinedAutomata.filter(m => ['DFA', 'NFA', 'ENFA'].includes(m.type));

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
          {dfaExamples.map(ex => (
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

      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 text-xs">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setJsonInput(JSON.stringify(sourceMachine, null, 2))} className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200">Copy source JSON</button>
          <button onClick={() => {
            try {
              const parsed: unknown = JSON.parse(jsonInput);
              if (!parsed || typeof parsed !== 'object' ||
                  !('type' in parsed) || !('alphabet' in parsed) || !('states' in parsed) ||
                  !('transitions' in parsed) || !('startStateId' in parsed) || !('finalStateIds' in parsed) ||
                  !Array.isArray(parsed.alphabet) || !Array.isArray(parsed.states) ||
                  !Array.isArray(parsed.transitions) || !Array.isArray(parsed.finalStateIds) ||
                  typeof parsed.startStateId !== 'string') {
                throw new Error('JSON must define type, alphabet, states, transitions, startStateId, and finalStateIds.');
              }
              const imported = parsed as AutomatonDefinition;
              if (!['DFA', 'NFA', 'ENFA'].includes(imported.type)) {
                throw new Error('Minimization accepts DFA, NFA, or ε-NFA input.');
              }
              const validation = validateAutomaton(imported);
              if (validation.errors.length > 0) throw new Error(validation.errors.join(' '));
              setSourceMachine(imported);
              setSourceError('');
            } catch (error) {
              setSourceError(error instanceof Error ? error.message : String(error));
            }
          }} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-bold">Import JSON</button>
          <button onClick={() => {
            const link = document.createElement('a');
            link.href = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(sourceMachine, null, 2))}`;
            link.download = `${sourceMachine.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.json`;
            link.click();
          }} className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200">Export source JSON</button>
          <input value={regexInput} onChange={event => setRegexInput(event.target.value)} placeholder="Regex, e.g. (a|b)*abb" className="min-w-56 flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono" />
          <button onClick={() => {
            try {
              const generated = regexToENFA(regexInput);
              const validation = validateAutomaton(generated);
              if (validation.errors.length > 0) throw new Error(validation.errors.join(' '));
              setSourceMachine(generated);
              setSourceError('');
            } catch (error) {
              setSourceError(error instanceof Error ? error.message : String(error));
            }
          }} className="px-3 py-1.5 bg-cyan-700 hover:bg-cyan-600 rounded-lg text-white font-bold">Load regex</button>
          <input value={naturalPrompt} onChange={event => setNaturalPrompt(event.target.value)} placeholder="Describe an automaton in plain English" className="min-w-56 flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100" />
          <button onClick={() => {
            try {
              const generated = generateAutomatonFromNaturalLanguage(naturalPrompt);
              setSourceMachine(generated.machine);
              setSourceError('');
              setIsEditingMachine(true);
            } catch (error) {
              setSourceError(error instanceof Error ? error.message : String(error));
            }
          }} disabled={!naturalPrompt.trim()} className="px-3 py-1.5 bg-violet-700 hover:bg-violet-600 disabled:opacity-50 rounded-lg text-white font-bold">Generate & edit</button>
        </div>
        <textarea value={jsonInput} onChange={event => setJsonInput(event.target.value)} rows={4} spellCheck={false} placeholder="Paste a DFA, NFA, or ε-NFA JSON definition." className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-slate-200" />
        {(sourceError || sourceValidation.errors.length > 0 || sourceValidation.warnings.length > 0) && (
          <div className="space-y-1">
            {sourceError && <p className="text-rose-300">{sourceError}</p>}
            {sourceValidation.errors.map((error, index) => <p key={`err-${index}`} className="text-rose-300">{error}</p>)}
            {sourceValidation.warnings.map((warning, index) => <p key={`warn-${index}`} className="text-amber-300">{warning}</p>)}
            {sourceValidation.missingTransitions.length > 0 && sourceMachine.type === 'DFA' && <p className="text-amber-300">Missing transitions will be completed with an implicit dead state before minimization.</p>}
          </div>
        )}
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

      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-white">Minimization walkthrough</h3>
          <div className="flex gap-1">
            <button onClick={() => setActivePhase(index => Math.max(0, index - 1))} className="px-2 py-1 bg-slate-800 rounded-lg text-xs text-slate-200">Prev</button>
            <button onClick={() => setIsPlayingPhases(value => !value)} className="px-2 py-1 bg-purple-700 rounded-lg text-xs text-white">{isPlayingPhases ? 'Pause' : 'Play'}</button>
            <button onClick={() => setActivePhase(index => Math.min(minimizationSteps.length - 1, index + 1))} className="px-2 py-1 bg-slate-800 rounded-lg text-xs text-slate-200">Next</button>
          </div>
        </div>
        <p className="p-3 bg-slate-950 rounded-xl text-xs text-slate-300">
          <strong className="text-purple-300">Step {currentPhase + 1} / {minimizationSteps.length}:</strong> {minimizationSteps[currentPhase]}
        </p>
      </div>

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
            Non-Final: {'{'}{report.initialPartition[0]?.map(id => dfaForMinimization.states.find(s => s.id === id)?.label || id).join(', ') || '∅'}{'}'},
            Final: {'{'}{report.initialPartition[1]?.map(id => dfaForMinimization.states.find(s => s.id === id)?.label || id).join(', ') || '∅'}{'}'}
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

      <div className={`p-3 rounded-xl border text-xs ${
        sourceValidation.errors.length === 0 && !sourceError && equivalenceResult?.equivalent
          ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300'
          : 'bg-rose-950/30 border-rose-800/50 text-rose-300'
      }`}>
        {sourceError ? `Input error: ${sourceError}` :
          sourceValidation.errors.length > 0 ? `Cannot minimize invalid input: ${sourceValidation.errors.join(' ')}` :
          equivalenceError ? `Could not verify: ${equivalenceError}` :
            equivalenceResult?.equivalent
              ? `Verified: minimized DFA is equivalent to the original (${equivalenceResult.checkedConfigurations} product states checked).`
              : `Equivalence counterexample: "${equivalenceResult?.counterexample || 'ε'}".`}
        {sourceMachine.type !== 'DFA' && sourceValidation.errors.length === 0 &&
          <span className="block mt-1 text-slate-300">Input was first converted from {sourceMachine.type} to a DFA using subset construction.</span>}
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
                      .map(g => `{${g.map(id => dfaForMinimization.states.find(s => s.id === id)?.label || id).join(', ')}}`)
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <h3 className="text-sm font-bold text-white">Equivalent state classes</h3>
          <p className="text-xs text-slate-400">States in each class are merged into one minimal DFA state.</p>
          <div className="flex flex-wrap gap-2">
            {report.minimizedMachine.states.map(state => (
              <span key={state.id} className="px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-purple-200">
                {state.label}
              </span>
            ))}
          </div>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <h3 className="text-sm font-bold text-white">Distinguishability table witnesses</h3>
          <p className="text-xs text-slate-400">Each pair from different equivalence classes has a shortest string that distinguishes it.</p>
          <div className="max-h-36 overflow-auto space-y-1">
            {report.distinguishingStrings.map(({ stateIds, string }) => (
              <p key={`${stateIds[0]}:${stateIds[1]}`} className="text-xs font-mono text-slate-300">
                ({dfaForMinimization.states.find(state => state.id === stateIds[0])?.label || stateIds[0]}, {dfaForMinimization.states.find(state => state.id === stateIds[1])?.label || stateIds[1]}) → "{string || 'ε'}"
              </p>
            ))}
            {report.distinguishingStrings.length === 0 && <p className="text-xs text-emerald-300">No distinct state pairs; the quotient has one state.</p>}
          </div>
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

      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
        <div className="flex gap-2">
          <input value={testInput} onChange={event => setTestInput(event.target.value)} placeholder="Test the same string on the original and minimized machines" className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white font-mono" />
          <button onClick={() => setTestResults({
            original: simulateAutomaton(sourceMachine, testInput).accepted,
            minimized: simulateAutomaton(minimizedMachine, testInput).accepted,
          })} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl">Compare</button>
        </div>
        {testResults && <div className="grid grid-cols-2 gap-2 text-xs">
          <p className="p-3 bg-slate-950 rounded-xl text-slate-200">Original: <strong>{testResults.original ? 'ACCEPT' : 'REJECT'}</strong></p>
          <p className="p-3 bg-slate-950 rounded-xl text-slate-200">Minimized: <strong>{testResults.minimized ? 'ACCEPT' : 'REJECT'}</strong></p>
        </div>}
      </div>

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
