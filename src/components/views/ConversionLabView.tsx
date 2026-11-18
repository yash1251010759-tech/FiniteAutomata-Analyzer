import React, { useEffect, useRef, useState } from 'react';
import { AutomatonDefinition } from '../../types/automata';
import {
  convertNfaToDfa,
  convertEnfaToNfa,
  convertDfaToNfa,
  ConversionStepReport,
} from '../../algorithms/subsetConstruction';
import {
  convertMooreToMealy,
  convertMealyToMoore,
  MooreMealyConversionReport,
} from '../../algorithms/mooreMealySimulation';
import { AutomataCanvas } from '../canvas/AutomataCanvas';
import {
  GitFork,
  CheckCircle2,
  Hammer,
  BookOpen,
  Layers,
  Play,
  Sliders,
  HelpCircle,
  Minimize2,
} from 'lucide-react';
import { NavigationTab } from '../layout/Sidebar';
import { predefinedAutomata } from '../../data/predefinedExamples';
import { UniversalModelBuilder } from '../common/UniversalModelBuilder';
import { UniversalStringSimulator } from '../common/UniversalStringSimulator';
import { TermExplainerModal, TermKey } from '../common/TermExplainerModal';
import { regexToENFA, testRegexString } from '../../algorithms/regexToNfa';
import { convertFaToRegex } from '../../algorithms/stateElimination';
import { validateAutomaton, completeDFA } from '../../algorithms/automatonValidation';
import { checkAutomatonEquivalence } from '../../algorithms/automatonEquivalence';
import { simulateAutomaton } from '../../algorithms/dfaSimulation';
import { minimizeDFA } from '../../algorithms/dfaMinimization';
import { generateAutomatonFromNaturalLanguage } from '../../algorithms/naturalLanguageDfa';
import { convertCfgToPda } from '../../algorithms/cfgToPda';
import { convertCfgToCnf } from '../../algorithms/cfgNormalForm';
import { convertPdaToCfg } from '../../algorithms/pdaToCfg';
import { CFGDefinition, PDADefinition } from '../../types/automata';
import { exportSVG } from '../../utils/exportUtils';
import { deriveString, getCFGSymbols } from '../../algorithms/cfg';
import { simulatePDA } from '../../algorithms/pda';

interface ConversionLabViewProps {
  currentMachine: AutomatonDefinition;
  onLoadIntoBuilder: (machine: AutomatonDefinition) => void;
  onNavigate: (tab: NavigationTab) => void;
}

export type SupportedConversion =
  | 'NFA_TO_DFA'
  | 'ENFA_TO_DFA'
  | 'ENFA_TO_NFA'
  | 'DFA_TO_NFA'
  | 'REGEX_TO_ENFA'
  | 'DFA_TO_REGEX'
  | 'DFA_TO_MIN_DFA'
  | 'MOORE_TO_MEALY'
  | 'MEALY_TO_MOORE';

export const ConversionLabView: React.FC<ConversionLabViewProps> = ({
  currentMachine,
  onLoadIntoBuilder,
  onNavigate,
}) => {
  const defaultNfa = predefinedAutomata.find(m => m.type === 'NFA') || currentMachine;
  const [sourceMachine, setSourceMachine] = useState<AutomatonDefinition>(defaultNfa);
  const [conversionType, setConversionType] = useState<SupportedConversion>('NFA_TO_DFA');
  const [isEditingMachine, setIsEditingMachine] = useState<boolean>(false);
  const [activeTermKey, setActiveTermKey] = useState<TermKey | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  const [regexInput, setRegexInput] = useState('');
  const [naturalPrompt, setNaturalPrompt] = useState('');
  const [sourceError, setSourceError] = useState('');
  const [testInput, setTestInput] = useState('');
  const [sourceTestResult, setSourceTestResult] = useState<boolean | null>(null);
  const [convertedTestResult, setConvertedTestResult] = useState<boolean | null>(null);
  const [grammarJson, setGrammarJson] = useState('');
  const [convertedPda, setConvertedPda] = useState<PDADefinition | null>(null);
  const [grammarConversionError, setGrammarConversionError] = useState('');
  const [grammarVerification, setGrammarVerification] = useState('');
  const [cnfResult, setCnfResult] = useState<CFGDefinition | null>(null);
  const [cnfError, setCnfError] = useState('');
  const [pdaJson, setPdaJson] = useState('');
  const [pdaCfgResult, setPdaCfgResult] = useState<CFGDefinition | null>(null);
  const [pdaConversionError, setPdaConversionError] = useState('');
  const [pdaVerification, setPdaVerification] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [isPlayingSteps, setIsPlayingSteps] = useState(false);
  const convertedCanvasRef = useRef<HTMLDivElement>(null);

  // Compute conversion result dynamically based on selection
  let subsetReport: ConversionStepReport | null = null;
  let transducerReport: MooreMealyConversionReport | null = null;
  let convertedMachine: AutomatonDefinition = sourceMachine;
  let stateEliminationReport: ReturnType<typeof convertFaToRegex> | null = null;
  const sourceTypeRequirement: Partial<Record<SupportedConversion, AutomatonDefinition['type'][]>> = {
    NFA_TO_DFA: ['NFA', 'ENFA'],
    ENFA_TO_DFA: ['ENFA'],
    ENFA_TO_NFA: ['ENFA'],
    DFA_TO_NFA: ['DFA'],
    DFA_TO_REGEX: ['DFA'],
    DFA_TO_MIN_DFA: ['DFA'],
    MOORE_TO_MEALY: ['MOORE'],
    MEALY_TO_MOORE: ['MEALY'],
  };
  const allowedSourceTypes = sourceTypeRequirement[conversionType];
  const sourceTypeError = allowedSourceTypes && !allowedSourceTypes.includes(sourceMachine.type)
    ? `${conversionType.replace(/_/g, ' ')} requires ${allowedSourceTypes.join(' or ')} input; the current source is ${sourceMachine.type}.`
    : '';
  let conversionError = sourceError || sourceTypeError ||
    (conversionType === 'REGEX_TO_ENFA' && !regexInput.trim() ? 'Enter a regular expression before converting.' : '');
  const sourceValidation = validateAutomaton(sourceMachine, sourceMachine.type === 'DFA');

  if (sourceValidation.errors.length === 0 && !sourceTypeError &&
      (conversionType === 'NFA_TO_DFA' || conversionType === 'ENFA_TO_DFA')) {
    subsetReport = convertNfaToDfa(sourceMachine);
    convertedMachine = subsetReport.resultMachine;
  } else if (sourceValidation.errors.length === 0 && !sourceTypeError && conversionType === 'ENFA_TO_NFA') {
    subsetReport = convertEnfaToNfa(sourceMachine);
    convertedMachine = subsetReport.resultMachine;
  } else if (sourceValidation.errors.length === 0 && !sourceTypeError && conversionType === 'DFA_TO_NFA') {
    subsetReport = convertDfaToNfa(sourceMachine);
    convertedMachine = subsetReport.resultMachine;
  } else if (sourceValidation.errors.length === 0 && !sourceTypeError && conversionType === 'MOORE_TO_MEALY') {
    transducerReport = convertMooreToMealy(sourceMachine);
    convertedMachine = transducerReport.resultMachine;
  } else if (sourceValidation.errors.length === 0 && !sourceTypeError && conversionType === 'MEALY_TO_MOORE') {
    transducerReport = convertMealyToMoore(sourceMachine);
    convertedMachine = transducerReport.resultMachine;
  } else if (conversionType === 'REGEX_TO_ENFA' && regexInput.trim()) {
    try {
      convertedMachine = regexToENFA(regexInput);
    } catch (error) {
      conversionError = error instanceof Error ? error.message : String(error);
    }
  } else if (sourceValidation.errors.length === 0 && !sourceTypeError && conversionType === 'DFA_TO_REGEX') {
    stateEliminationReport = convertFaToRegex(sourceMachine);
  } else if (sourceValidation.errors.length === 0 && !sourceTypeError && conversionType === 'DFA_TO_MIN_DFA') {
    convertedMachine = minimizeDFA(sourceMachine).minimizedMachine;
  }
  let equivalenceResult: ReturnType<typeof checkAutomatonEquivalence> | null = null;
  let equivalenceError = '';
  if (sourceValidation.errors.length === 0 &&
      !['REGEX_TO_ENFA', 'DFA_TO_REGEX', 'MOORE_TO_MEALY', 'MEALY_TO_MOORE'].includes(conversionType)) {
    try {
      equivalenceResult = checkAutomatonEquivalence(sourceMachine, convertedMachine);
    } catch (error) {
      equivalenceError = error instanceof Error ? error.message : String(error);
    }
  }
  let sampledCounterexample: string | undefined;
  if (conversionType === 'REGEX_TO_ENFA' && regexInput.trim()) {
    const tested = enumerateStrings(convertedMachine.alphabet, 8);
    sampledCounterexample = tested.find(input =>
      testRegexString(regexInput, input) !== simulateAutomaton(convertedMachine, input).accepted
    );
  } else if (conversionType === 'DFA_TO_REGEX' && stateEliminationReport) {
    const tested = enumerateStrings(sourceMachine.alphabet, 8);
    sampledCounterexample = tested.find(input =>
      testRegexString(stateEliminationReport.finalRegex, input) !== simulateAutomaton(sourceMachine, input).accepted
    );
  }

  // Pre-filter examples appropriate for the selected conversion
  const getRelevantExamples = () => {
    return predefinedAutomata;
  };

  const relevantExamples = getRelevantExamples();
  const walkthroughSteps = subsetReport?.explanation ||
    transducerReport?.explanation ||
    stateEliminationReport?.steps.map(step => step.explanation) ||
    (conversionType === 'REGEX_TO_ENFA'
      ? ['Tokenize the expression and insert explicit concatenation operators.', "Build Thompson fragments for symbols, union, concatenation, and Kleene star.", `Connect the fragments with ε-transitions; ${convertedMachine.states.length} states are produced.`]
      : conversionType === 'DFA_TO_MIN_DFA'
        ? ['Complete the DFA with a trap state if needed.', 'Remove states unreachable from the start.', 'Refine state partitions until no further split is possible.', `Merge equivalent states into ${convertedMachine.states.length} state(s).`]
        : []);
  const currentStepIndex = Math.min(activeStep, Math.max(0, walkthroughSteps.length - 1));

  useEffect(() => {
    if (!isPlayingSteps || walkthroughSteps.length < 2) return;
    const timer = window.setInterval(() => {
      setActiveStep(index => (index + 1) % walkthroughSteps.length);
    }, 1800);
    return () => window.clearInterval(timer);
  }, [isPlayingSteps, walkthroughSteps.length]);

  function enumerateStrings(alphabet: string[], maxLength: number): string[] {
    const result = [''];
    let layer = [''];
    for (let length = 1; length <= maxLength; length++) {
      layer = layer.flatMap(prefix => alphabet.map(symbol => prefix + symbol));
      result.push(...layer);
    }
    return result;
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white font-['Outfit'] flex items-center gap-2">
              <GitFork className="w-6 h-6 text-indigo-400" />
              <span>Automata Conversion Lab</span>
            </h2>
            <span className="px-2.5 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg">
              User-Driven Laboratory
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Convert user-defined finite automata and transducers mathematically using step-by-step algorithms
          </p>
        </div>

        {/* Source machine actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditingMachine(!isEditingMachine)}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
          >
            <Hammer className="w-4 h-4" />
            <span>{isEditingMachine ? 'Close Builder' : 'Create / Edit Machine'}</span>
          </button>

          <button
            onClick={() => { setSourceMachine(currentMachine); setSourceError(''); }}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
            title="Use machine currently on your canvas"
          >
            Use Active Machine
          </button>
        </div>
      </div>

      {/* Embedded Model Builder if user toggles custom creation */}
      {isEditingMachine && (
        <div className="p-1 bg-slate-950/60 rounded-3xl border border-indigo-500/30">
          <UniversalModelBuilder
            initialMachine={sourceMachine}
            onSave={newMachine => {
              setSourceMachine(newMachine);
              setSourceError('');
              setIsEditingMachine(false);
            }}
            onCancel={() => setIsEditingMachine(false)}
          />
        </div>
      )}

      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setJsonInput(JSON.stringify(sourceMachine, null, 2))}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
          >
            Copy source JSON into editor
          </button>
          <button
            onClick={() => {
              try {
                const parsed: unknown = JSON.parse(jsonInput);
                if (!parsed || typeof parsed !== 'object' ||
                    !('type' in parsed) || !('alphabet' in parsed) || !('states' in parsed) ||
                    !('transitions' in parsed) || !('startStateId' in parsed) || !('finalStateIds' in parsed) ||
                    !Array.isArray(parsed.alphabet) || !Array.isArray(parsed.states) ||
                    !Array.isArray(parsed.transitions) || !Array.isArray(parsed.finalStateIds) ||
                    typeof parsed.startStateId !== 'string') {
                  throw new Error('JSON must contain type, alphabet, states, transitions, startStateId, and finalStateIds.');
                }
                const imported = parsed as AutomatonDefinition;
                const validation = validateAutomaton(imported);
                if (validation.errors.length > 0) {
                  setSourceError(validation.errors.join(' '));
                  return;
                }
                setSourceMachine(imported);
                setSourceError('');
              } catch (error) {
                setSourceError(error instanceof Error ? error.message : String(error));
              }
            }}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-bold"
          >
            Import JSON
          </button>
          <button
            onClick={() => {
              const link = document.createElement('a');
              link.href = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(sourceMachine, null, 2))}`;
              link.download = `${sourceMachine.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.json`;
              link.click();
            }}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
          >
            Export source JSON
          </button>
          <input
            value={regexInput}
            onChange={event => setRegexInput(event.target.value)}
            placeholder="Regular expression, e.g. (a|b)*abb"
            className="min-w-56 flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono"
          />
          <button onClick={() => { setConversionType('REGEX_TO_ENFA'); setSourceError(''); }} className="px-3 py-1.5 bg-cyan-700 hover:bg-cyan-600 rounded-lg text-white font-bold">
            Convert regex
          </button>
          <input value={naturalPrompt} onChange={event => setNaturalPrompt(event.target.value)} placeholder="Describe a DFA in plain English" className="min-w-56 flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100" />
          <button onClick={() => {
            try {
              const generated = generateAutomatonFromNaturalLanguage(naturalPrompt);
              setSourceMachine(generated.machine);
              setSourceError('');
              setIsEditingMachine(true);
            } catch (error) {
              setSourceError(error instanceof Error ? error.message : String(error));
            }
          }} disabled={!naturalPrompt.trim()} className="px-3 py-1.5 bg-violet-700 hover:bg-violet-600 disabled:opacity-50 rounded-lg text-white font-bold">
            Generate & edit
          </button>
        </div>
        <textarea
          value={jsonInput}
          onChange={event => setJsonInput(event.target.value)}
          rows={5}
          spellCheck={false}
          placeholder="Paste an AutomatonDefinition JSON object to import it."
          className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-slate-200"
        />
        {(sourceError || sourceValidation.errors.length > 0 || sourceValidation.warnings.length > 0) && (
          <div className="space-y-1">
            {sourceError && <p className="text-rose-300">{sourceError}</p>}
            {sourceValidation.errors.map((error, index) => <p key={`error-${index}`} className="text-rose-300">{error}</p>)}
            {sourceValidation.warnings.map((warning, index) => <p key={`warning-${index}`} className="text-amber-300">{warning}</p>)}
            {sourceValidation.missingTransitions.length > 0 && sourceMachine.type === 'DFA' && (
              <button
                onClick={() => {
                  try {
                    setSourceMachine(completeDFA(sourceMachine));
                    setSourceError('');
                  } catch (error) {
                    setSourceError(error instanceof Error ? error.message : String(error));
                  }
                }}
                className="mt-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 rounded-lg text-slate-950 font-bold"
              >
                Auto-add dead/trap state
              </button>
            )}
          </div>
        )}
      </div>

      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 text-xs">
        <h3 className="font-bold text-white">CFG → PDA</h3>
        <p className="text-slate-400">Paste a CFG JSON definition to construct an equivalent nondeterministic PDA.</p>
        <textarea value={grammarJson} onChange={event => setGrammarJson(event.target.value)} rows={5} spellCheck={false} placeholder='{"id":"g","name":"Grammar","variables":["S"],"terminals":["a","b"],"startVariable":"S","productions":[{"id":"r1","variable":"S","replacement":"aSb"},{"id":"r2","variable":"S","replacement":"ε"}]}' className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-slate-200" />
        <button onClick={() => {
          try {
            const cfg: unknown = JSON.parse(grammarJson);
            if (!cfg || typeof cfg !== 'object' || !('productions' in cfg) ||
                !('startVariable' in cfg) || !Array.isArray(cfg.productions) ||
                typeof cfg.startVariable !== 'string') {
              throw new Error('JSON must define a startVariable and a productions array.');
            }
            const grammar = cfg as CFGDefinition;
            const pda = convertCfgToPda(grammar);
            const terminals = getCFGSymbols(grammar).terminals;
            const samples = enumerateStrings(terminals, 8);
            const mismatch = samples.find(input =>
              deriveString(grammar, input).valid !== simulatePDA(pda, input).accepted
            );
            setConvertedPda(pda);
            setGrammarVerification(mismatch === undefined
              ? 'Verified equivalent for all strings up to length 8.'
              : `Counterexample found: "${mismatch || 'ε'}".`);
            setGrammarConversionError('');
          } catch (error) {
            setConvertedPda(null);
            setGrammarVerification('');
            setGrammarConversionError(error instanceof Error ? error.message : String(error));
          }
        }} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-bold">Convert grammar to PDA</button>
        <button onClick={() => {
          try {
            const cfg: unknown = JSON.parse(grammarJson);
            if (!cfg || typeof cfg !== 'object' || !('productions' in cfg) ||
                !('startVariable' in cfg) || !Array.isArray(cfg.productions) ||
                typeof cfg.startVariable !== 'string') {
              throw new Error('JSON must define a startVariable and a productions array.');
            }
            setCnfResult(convertCfgToCnf(cfg as CFGDefinition).grammar);
            setCnfError('');
          } catch (error) {
            setCnfResult(null);
            setCnfError(error instanceof Error ? error.message : String(error));
          }
        }} className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 rounded-lg text-white font-bold">Convert CFG to CNF</button>
        {grammarConversionError && <p className="text-rose-300">{grammarConversionError}</p>}
        {convertedPda && <details className="text-slate-300">
          <summary className="cursor-pointer">Equivalent PDA definition and rule mapping</summary>
          <p className="my-2">Each production becomes an ε-transition that replaces its left-side variable with the right side; terminal stack symbols are consumed by matching input transitions. Acceptance is by empty stack.</p>
          <pre className="max-h-72 overflow-auto p-3 bg-slate-950 rounded-xl">{JSON.stringify(convertedPda, null, 2)}</pre>
        </details>}
        {cnfError && <p className="text-rose-300">{cnfError}</p>}
        {cnfResult && <details className="text-slate-300">
          <summary className="cursor-pointer">Chomsky Normal Form grammar</summary>
          <pre className="max-h-72 overflow-auto p-3 bg-slate-950 rounded-xl">{JSON.stringify(cnfResult, null, 2)}</pre>
        </details>}
        <h3 className="pt-2 font-bold text-white">PDA → CFG</h3>
        <textarea value={pdaJson} onChange={event => setPdaJson(event.target.value)} rows={5} spellCheck={false} placeholder="Paste a PDA JSON definition (state list, inputAlphabet, stackAlphabet, startStackSymbol, transitions, and acceptMode)." className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-slate-200" />
        <button onClick={() => {
          try {
            const parsed: unknown = JSON.parse(pdaJson);
            if (!parsed || typeof parsed !== 'object' || !('states' in parsed) ||
                !('inputAlphabet' in parsed) || !('stackAlphabet' in parsed) ||
                !('transitions' in parsed) || !('startStackSymbol' in parsed) ||
                !('startStateId' in parsed) || !('acceptMode' in parsed) ||
                !Array.isArray(parsed.states) || !Array.isArray(parsed.inputAlphabet) ||
                !Array.isArray(parsed.stackAlphabet) || !Array.isArray(parsed.transitions)) {
              throw new Error('JSON is missing required PDA fields.');
            }
            const pda = parsed as PDADefinition;
            const grammar = convertPdaToCfg(pda);
            const mismatch = enumerateStrings(pda.inputAlphabet, 8).find(input =>
              simulatePDA(pda, input).accepted !== deriveString(grammar, input).valid
            );
            setPdaCfgResult(grammar);
            setPdaVerification(mismatch === undefined
              ? 'Verified equivalent for all strings up to length 8.'
              : `Counterexample found: "${mismatch || 'ε'}".`);
            setPdaConversionError('');
          } catch (error) {
            setPdaCfgResult(null);
            setPdaVerification('');
            setPdaConversionError(error instanceof Error ? error.message : String(error));
          }
        }} className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 rounded-lg text-white font-bold">Convert PDA to CFG</button>
        {pdaConversionError && <p className="text-rose-300">{pdaConversionError}</p>}
        {pdaVerification && <p className={pdaVerification.startsWith('Verified') ? 'text-emerald-300' : 'text-rose-300'}>{pdaVerification}</p>}
        {pdaCfgResult && <details className="text-slate-300">
          <summary className="cursor-pointer">Equivalent CFG definition</summary>
          <pre className="max-h-72 overflow-auto p-3 bg-slate-950 rounded-xl">{JSON.stringify(pdaCfgResult, null, 2)}</pre>
        </details>}
        {grammarVerification && <p className={grammarVerification.startsWith('Verified') ? 'text-emerald-300' : 'text-rose-300'}>{grammarVerification}</p>}
      </div>

      {/* Conversion Type Selector Menu */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 text-xs">
        <div className="flex items-center justify-between text-slate-400">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-cyan-400" /> Select Mathematical Conversion:
          </span>
          <button
            onClick={() => setActiveTermKey('transition')}
            className="text-slate-500 hover:text-cyan-400 flex items-center gap-1 text-[11px]"
          >
            <HelpCircle className="w-3.5 h-3.5" /> What are these?
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {[
            { id: 'NFA_TO_DFA', label: 'NFA → DFA', desc: 'Subset Construction' },
            { id: 'ENFA_TO_DFA', label: 'ε-NFA → DFA', desc: 'ε-Closure Powerset' },
            { id: 'ENFA_TO_NFA', label: 'ε-NFA → NFA', desc: 'ε-Bypass Mapping' },
            { id: 'DFA_TO_NFA', label: 'DFA → NFA', desc: 'Formal Embedding' },
            { id: 'REGEX_TO_ENFA', label: 'Regex → ε-NFA', desc: "Thompson's construction" },
            { id: 'DFA_TO_REGEX', label: 'DFA → Regex', desc: 'State elimination' },
            { id: 'DFA_TO_MIN_DFA', label: 'DFA → Minimal DFA', desc: 'Minimize this input' },
            { id: 'MOORE_TO_MEALY', label: 'Moore → Mealy', desc: 'State to Transition' },
            { id: 'MEALY_TO_MOORE', label: 'Mealy → Moore', desc: 'State Splitting' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setConversionType(item.id as SupportedConversion)}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                conversionType === item.id
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-md scale-[1.02]'
                  : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
              }`}
            >
              <div className="font-bold text-xs">{item.label}</div>
              <div className="text-[10px] opacity-80 truncate">{item.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Examples Library Bar */}
      {relevantExamples.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto text-xs py-1">
          <span className="text-slate-400 shrink-0 font-medium">Load Preset Example:</span>
          {relevantExamples.map(ex => (
            <button
              key={ex.id}
              onClick={() => { setSourceMachine(ex); setSourceError(''); }}
              className={`px-3 py-1 rounded-xl border whitespace-nowrap transition-colors ${
                sourceMachine.id === ex.id
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
              }`}
            >
              {ex.name}
            </button>
          ))}
        </div>
      )}

      <div className={`p-3 rounded-xl border text-xs ${
        sourceValidation.errors.length === 0 && !conversionError &&
        sampledCounterexample === undefined && !equivalenceError &&
        (equivalenceResult === null || equivalenceResult.equivalent)
          ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300'
          : 'bg-amber-950/30 border-amber-800/50 text-amber-300'
      }`}>
        {conversionError ? `Conversion error: ${conversionError}` :
          equivalenceError ? `Could not verify equivalence: ${equivalenceError}` :
            sampledCounterexample !== undefined ? `Counterexample found: "${sampledCounterexample || 'ε'}" has different acceptance results.` :
              equivalenceResult?.equivalent ? `Verified equivalent by product construction (${equivalenceResult.checkedConfigurations} state pairs).` :
                equivalenceResult && !equivalenceResult.equivalent ? `Not equivalent; counterexample: "${equivalenceResult.counterexample || 'ε'}".` :
                  conversionType === 'REGEX_TO_ENFA' || conversionType === 'DFA_TO_REGEX'
                    ? 'Verified equivalent for all strings up to length 8.'
                    : 'Conversion output is ready.'}
      </div>

      {/* Algorithmic Transformation Explanation Steps */}
      <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span>Algorithmic Transformation Steps ({conversionType}):</span>
          </h3>
          {walkthroughSteps.length > 0 && <div className="flex gap-1">
            <button onClick={() => setActiveStep(index => Math.max(0, index - 1))} className="px-2 py-1 bg-slate-800 rounded-lg text-slate-200">Prev</button>
            <button onClick={() => setIsPlayingSteps(value => !value)} className="px-2 py-1 bg-indigo-700 rounded-lg text-white">{isPlayingSteps ? 'Pause' : 'Play'}</button>
            <button onClick={() => setActiveStep(index => Math.min(walkthroughSteps.length - 1, index + 1))} className="px-2 py-1 bg-slate-800 rounded-lg text-slate-200">Next</button>
          </div>}
        </div>
        {walkthroughSteps.length > 0
          ? <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800 text-slate-300 text-xs leading-relaxed">
            <span className="font-bold text-cyan-300 font-mono">Step {currentStepIndex + 1} / {walkthroughSteps.length}</span>
            <p className="mt-2">{walkthroughSteps[currentStepIndex]}</p>
          </div>
          : <p className="text-xs text-slate-400">Choose a compatible source machine and conversion to see its walkthrough.</p>}
        {stateEliminationReport && (
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-cyan-200 text-sm break-all">
            Resulting regular expression: {stateEliminationReport.finalRegex}
          </div>
        )}
      </div>

      {/* Subset Construction Table (for NFA / ENFA -> DFA) */}
      {subsetReport && subsetReport.subsetRows.length > 0 && (
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Subset Construction Table (Powerset Representation)</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">
              {subsetReport.subsetRows.length} deterministic states generated
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-300 font-sans">
                  <th className="py-2.5 px-3">DFA State</th>
                  <th className="py-2.5 px-3">NFA Subset</th>
                  {convertedMachine.alphabet.map(sym => (
                    <th key={sym} className="py-2.5 px-3 text-indigo-400">
                      δ_DFA(S, '{sym}')
                    </th>
                  ))}
                  <th className="py-2.5 px-3">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {subsetReport.subsetRows.map(row => (
                  <tr key={row.dfaStateName} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-indigo-400">
                      {row.isStart ? '→ ' : ''}
                      {row.isFinal ? '* ' : ''}
                      {row.dfaStateName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-200">
                      {`{${row.nfaStates.join(', ') || '∅'}}`}
                    </td>
                    {convertedMachine.alphabet.map(sym => {
                      const t = row.transitions[sym];
                      return (
                        <td key={sym} className="py-2.5 px-3 text-slate-300">
                          {t ? (
                            <span>
                              <strong className="text-white">{t.targetName}</strong>{' '}
                              <span className="text-slate-500 text-[10px]">
                                ({`{${t.targetSubset.join(',')}}`})
                              </span>
                            </span>
                          ) : (
                            '∅'
                          )}
                        </td>
                      );
                    })}
                    <td className="py-2.5 px-3 font-sans">
                      {row.isFinal ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-500/20 text-purple-300 rounded border border-purple-500/30">
                          FINAL
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Non-final</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Moore/Mealy Mapping Table */}
      {transducerReport && transducerReport.mappingRows.length > 0 && (
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <span>Transducer Mapping Table ({conversionType.replace(/_/g, ' ')})</span>
          </h3>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-300 font-sans">
                  <th className="py-2 px-3">Original Element</th>
                  <th className="py-2 px-3">Mapped Converted Element</th>
                  <th className="py-2 px-3">Output Produced</th>
                  <th className="py-2 px-3 font-sans">Rule Explanation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {transducerReport.mappingRows.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-900/60">
                    <td className="py-2 px-3 text-slate-300 font-semibold">{r.source}</td>
                    <td className="py-2 px-3 text-cyan-300 font-bold">{r.target}</td>
                    <td className="py-2 px-3 text-purple-300 font-bold">{r.output}</td>
                    <td className="py-2 px-3 text-slate-400 font-sans text-[11px]">{r.rule}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-3">
        <h3 className="text-sm font-bold text-white">Converted transition table</h3>
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-300">
              <tr><th className="p-2">State</th>{convertedMachine.alphabet.map(symbol => <th className="p-2" key={symbol}>{symbol}</th>)}<th className="p-2">Role</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {convertedMachine.states.map(state => (
                <tr key={state.id} className="text-slate-300">
                  <td className="p-2">{state.id === convertedMachine.startStateId ? '→ ' : ''}{state.isFinal || convertedMachine.finalStateIds.includes(state.id) ? '* ' : ''}{state.label || state.id}</td>
                  {convertedMachine.alphabet.map(symbol => {
                    const targets = convertedMachine.transitions
                      .filter(edge => edge.from === state.id && edge.symbols.includes(symbol))
                      .map(edge => convertedMachine.states.find(target => target.id === edge.to)?.label || edge.to);
                    return <td className="p-2" key={symbol}>{targets.length ? [...new Set(targets)].join(', ') : '∅'}</td>;
                  })}
                  <td className="p-2">{state.id === convertedMachine.startStateId ? 'start ' : ''}{state.isFinal || convertedMachine.finalStateIds.includes(state.id) ? 'final' : ''}</td>
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
                BEFORE
              </span>
              <h4 className="font-bold text-white text-xs">{conversionType === 'REGEX_TO_ENFA' ? 'Regular expression source' : sourceMachine.name}</h4>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {conversionType === 'REGEX_TO_ENFA' ? 'Regex' : `${sourceMachine.states.length} states • ${sourceMachine.type}`}
            </span>
          </div>

          {conversionType === 'REGEX_TO_ENFA' ? (
            <div className="h-64 flex items-center p-5 rounded-2xl border border-slate-800/80 bg-slate-950 font-mono text-lg text-cyan-300 break-all">
              {regexInput || 'Enter a regex above to generate its ε-NFA.'}
            </div>
          ) : (
            <div className="h-64 rounded-2xl overflow-hidden border border-slate-800/80 bg-slate-950">
              <AutomataCanvas machine={sourceMachine} onChangeMachine={() => {}} isEditable={false} />
            </div>
          )}
        </div>

        {/* Converted Canvas */}
        <div className="p-4 bg-slate-900 border border-indigo-500/40 rounded-3xl space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded">
                AFTER (CONVERTED)
              </span>
              <h4 className="font-bold text-white text-xs">{convertedMachine.name}</h4>
            </div>
            <span className="text-[10px] font-mono text-cyan-400">
              {convertedMachine.states.length} states • {convertedMachine.type}
            </span>
          </div>

          <div ref={convertedCanvasRef} className="h-64 rounded-2xl overflow-hidden border border-slate-800/80 bg-slate-950">
            <AutomataCanvas
              machine={convertedMachine}
              onChangeMachine={() => {}}
              isEditable={false}
            />
          </div>
        </div>
      </div>

      {/* Universal String Simulator on Converted Machine */}
      <UniversalStringSimulator
        model={{ type: 'FA', machine: convertedMachine }}
        title={`Interactive String Simulator on Converted ${convertedMachine.type}`}
        defaultInput={convertedMachine.alphabet.includes('b') ? 'abb' : '01'}
      />

      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
        <div className="flex gap-2">
          <input value={testInput} onChange={event => setTestInput(event.target.value)} placeholder="Test the same string on both sides" className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white font-mono" />
          <button onClick={() => {
            const sourceAccepted = conversionType === 'REGEX_TO_ENFA'
              ? testRegexString(regexInput, testInput)
              : simulateAutomaton(sourceMachine, testInput).accepted;
            const resultAccepted = conversionType === 'DFA_TO_REGEX'
              ? testRegexString(stateEliminationReport?.finalRegex || '', testInput)
              : simulateAutomaton(convertedMachine, testInput).accepted;
            setSourceTestResult(sourceAccepted);
            setConvertedTestResult(resultAccepted);
          }} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl">Compare</button>
        </div>
        {sourceTestResult !== null && convertedTestResult !== null && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <p className="p-3 bg-slate-950 rounded-xl text-slate-200">Source: <strong>{sourceTestResult ? 'ACCEPT' : 'REJECT'}</strong></p>
            <p className="p-3 bg-slate-950 rounded-xl text-slate-200">Result: <strong>{convertedTestResult ? 'ACCEPT' : 'REJECT'}</strong></p>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-5 bg-slate-900 border border-slate-800 rounded-3xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              onLoadIntoBuilder(convertedMachine);
              onNavigate('builder');
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors shadow-md shadow-emerald-500/10"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Load Converted Machine into Builder</span>
          </button>

          {convertedMachine.type === 'DFA' && (
            <button
              onClick={() => {
                onLoadIntoBuilder(convertedMachine);
                onNavigate('minimization');
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition-colors shadow-sm"
            >
              <Minimize2 className="w-4 h-4" />
              <span>Send to Minimization Lab</span>
            </button>
          )}

          <button
            onClick={() => {
              onLoadIntoBuilder(convertedMachine);
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
            const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(convertedMachine, null, 2));
            const dl = document.createElement('a');
            dl.setAttribute('href', dataStr);
            dl.setAttribute('download', `${convertedMachine.name.toLowerCase().replace(/\s+/g, '-')}.json`);
            dl.click();
          }}
          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
        >
          Export Converted JSON
        </button>
        <button
          onClick={() => {
            const svg = convertedCanvasRef.current?.querySelector('svg');
            if (!svg) {
              setSourceError('The result diagram is not available for SVG export.');
              return;
            }
            exportSVG(svg, `${convertedMachine.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.svg`);
          }}
          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700"
        >
          Export diagram as SVG
        </button>
        {stateEliminationReport && (
          <button
            onClick={() => {
              const link = document.createElement('a');
              link.href = `data:text/plain;charset=utf-8,${encodeURIComponent(stateEliminationReport.finalRegex)}`;
              link.download = 'converted-regular-expression.txt';
              link.click();
            }}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700"
          >
            Export regex
          </button>
        )}
      </div>

      <TermExplainerModal
        termKey={activeTermKey}
        onClose={() => setActiveTermKey(null)}
      />
    </div>
  );
};
