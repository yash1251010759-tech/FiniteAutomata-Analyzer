import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { challengeProblems } from '../../data/challengesData';
import { ChallengeProblem } from '../../types/learning';
import { AutomatonDefinition, StateNode, TransitionEdge } from '../../types/automata';
import { AutomataCanvas } from '../canvas/AutomataCanvas';
import { TransitionTable } from '../simulation/TransitionTable';
import { simulateAutomaton } from '../../algorithms/dfaSimulation';
import { checkChallengeSolution } from '../../algorithms/challengeChecking';
import {
  challengeAward,
  clearChallengeProgress,
  emptyChallengeProgress,
  loadChallengeProgress,
  saveChallengeProgress,
} from '../../algorithms/challengeProgress';
import {
  Trophy,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Play,
  RotateCcw,
  RotateCw,
  Plus,
  Trash2,
  ArrowRightCircle,
  Sparkles,
  Sliders,
  Table,
  Check,
  Link as LinkIcon,
  RefreshCw,
  PlaySquare,
  AlertTriangle,
} from 'lucide-react';

interface PracticeChallengeViewProps {
  onChallengeSolved: (challengeId: string) => void;
  solvedChallengeIds: string[];
  onResetProgress?: () => void;
}

type TabType = 'builder' | 'tests' | 'simulator' | 'table' | 'hints';

export const PracticeChallengeView: React.FC<PracticeChallengeViewProps> = ({
  onChallengeSolved,
  solvedChallengeIds,
  onResetProgress,
}) => {
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeProblem>(
    challengeProblems[0]
  );
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchText, setSearchText] = useState('');
  const [solutionInput, setSolutionInput] = useState('');
  const [savedProgress, setSavedProgress] = useState(loadChallengeProgress);
  const { score: challengeScore, attempts: attemptCounts, hints: hintCounts, revealedSolutions } = savedProgress;
  useEffect(() => {
    saveChallengeProgress(savedProgress);
  }, [savedProgress]);
  const setAttemptCounts = (update: (previous: Record<string, number>) => Record<string, number>) =>
    setSavedProgress(previous => ({ ...previous, attempts: update(previous.attempts) }));
  const setHintCounts = (update: (previous: Record<string, number>) => Record<string, number>) =>
    setSavedProgress(previous => ({ ...previous, hints: update(previous.hints) }));

  const filteredChallenges = useMemo(() => challengeProblems.filter(challenge =>
    (categoryFilter === 'All' || challenge.category === categoryFilter) &&
    (difficultyFilter === 'All' || challenge.difficulty === difficultyFilter) &&
    (statusFilter === 'All' ||
      (statusFilter === 'Solved'
        ? solvedChallengeIds.includes(challenge.id)
        : !solvedChallengeIds.includes(challenge.id))) &&
    `${challenge.title} ${challenge.description}`.toLowerCase().includes(searchText.toLowerCase())
  ), [categoryFilter, difficultyFilter, statusFilter, searchText, solvedChallengeIds]);

  // Helper to generate starter machine for challenge
  const createStarterMachine = (c: ChallengeProblem): AutomatonDefinition => {
    let states: StateNode[] = [];
    let startStateId = 'q0';
    let finalStateIds: string[] = [];

    if (c.id === 'challenge-ends-01') {
      states = [
        { id: 'q0', label: 'q0', x: 200, y: 220, isStart: true, isFinal: false, description: 'No matched suffix' },
        { id: 'q1', label: 'q1', x: 390, y: 220, isStart: false, isFinal: false, description: 'Last symbol was 0' },
        { id: 'q2', label: 'q2', x: 580, y: 220, isStart: false, isFinal: true, description: 'Ends with 01 (Accept)' },
      ];
      startStateId = 'q0';
      finalStateIds = ['q2'];
    } else if (c.id === 'challenge-even-1s') {
      states = [
        { id: 'q0', label: 'q0', x: 260, y: 220, isStart: true, isFinal: true, description: 'Even count of 1s (Accept)' },
        { id: 'q1', label: 'q1', x: 480, y: 220, isStart: false, isFinal: false, description: 'Odd count of 1s' },
      ];
      startStateId = 'q0';
      finalStateIds = ['q0'];
    } else if (c.id === 'challenge-contains-101') {
      states = [
        { id: 'q0', label: 'q0', x: 170, y: 220, isStart: true, isFinal: false, description: 'Empty / searching' },
        { id: 'q1', label: 'q1', x: 330, y: 220, isStart: false, isFinal: false, description: 'Matched "1"' },
        { id: 'q2', label: 'q2', x: 490, y: 220, isStart: false, isFinal: false, description: 'Matched "10"' },
        { id: 'q3', label: 'q3', x: 650, y: 220, isStart: false, isFinal: true, description: 'Contains "101" (Accept)' },
      ];
      startStateId = 'q0';
      finalStateIds = ['q3'];
    } else if (c.id === 'challenge-div-3') {
      states = [
        { id: 'q0', label: 'q0', x: 220, y: 160, isStart: true, isFinal: true, description: 'Remainder 0 (Divisible)' },
        { id: 'q1', label: 'q1', x: 460, y: 160, isStart: false, isFinal: false, description: 'Remainder 1' },
        { id: 'q2', label: 'q2', x: 340, y: 320, isStart: false, isFinal: false, description: 'Remainder 2' },
      ];
      startStateId = 'q0';
      finalStateIds = ['q0'];
    } else {
      states = [
        { id: 'q0', label: 'q0', x: 250, y: 220, isStart: true, isFinal: false },
        { id: 'q1', label: 'q1', x: 450, y: 220, isStart: false, isFinal: true },
      ];
      startStateId = 'q0';
      finalStateIds = ['q1'];
    }

    return {
      id: `challenge-user-${c.id}`,
      name: c.title,
      type: (c.targetType || 'DFA') as any,
      alphabet: c.alphabet,
      states,
      transitions: [],
      startStateId,
      finalStateIds,
    };
  };

  const createCleanEmptyMachine = (c: ChallengeProblem): AutomatonDefinition => ({
    id: `challenge-user-${c.id}`,
    name: c.title,
    type: (c.targetType || 'DFA') as any,
    alphabet: c.alphabet,
    states: [
      { id: 'q0', label: 'q0', x: 250, y: 220, isStart: true, isFinal: false },
    ],
    transitions: [],
    startStateId: 'q0',
    finalStateIds: [],
  });

  // Machine state & undo/redo history
  const [machine, setMachine] = useState<AutomatonDefinition>(() =>
    createStarterMachine(challengeProblems[0])
  );
  const [history, setHistory] = useState<AutomatonDefinition[]>([
    createStarterMachine(challengeProblems[0]),
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Inspector & selection
  const [selectedState, setSelectedState] = useState<StateNode | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('builder');

  // New state form inputs
  const [newStateLabel, setNewStateLabel] = useState<string>('');
  const [newStateIsStart, setNewStateIsStart] = useState<boolean>(false);
  const [newStateIsFinal, setNewStateIsFinal] = useState<boolean>(false);

  // Quick connect form inputs
  const [connectFrom, setConnectFrom] = useState<string>('');
  const [connectTo, setConnectTo] = useState<string>('');
  const [connectSymbol, setConnectSymbol] = useState<string>('0');

  // Interactive Live String Simulator input
  const [liveTestInput, setLiveTestInput] = useState<string>('');
  const [liveTestResult, setLiveTestResult] = useState<any>(null);

  // Update machine with history tracking
  const updateMachineWithHistory = (newMachine: AutomatonDefinition) => {
    // Keep states and startStateId / finalStateIds synchronized
    const effectiveStartId =
      (newMachine.startStateId && newMachine.states.some(s => s.id === newMachine.startStateId))
        ? newMachine.startStateId
        : (newMachine.states.find(s => s.isStart)?.id || newMachine.states[0]?.id || '');

    const finalIds = new Set([
      ...(newMachine.finalStateIds || []),
      ...newMachine.states.filter(s => s.isFinal).map(s => s.id),
    ]);

    const synchronized: AutomatonDefinition = {
      ...newMachine,
      startStateId: effectiveStartId,
      finalStateIds: Array.from(finalIds),
      states: newMachine.states.map(s => ({
        ...s,
        isStart: s.id === effectiveStartId,
        isFinal: finalIds.has(s.id),
      })),
    };

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(synchronized);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setMachine(synchronized);

    // Keep selectedState updated with matching instance
    if (selectedState) {
      const match = synchronized.states.find(s => s.id === selectedState.id);
      setSelectedState(match || null);
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setMachine(prev);
      if (selectedState) {
        setSelectedState(prev.states.find(s => s.id === selectedState.id) || null);
      }
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setMachine(next);
      if (selectedState) {
        setSelectedState(next.states.find(s => s.id === selectedState.id) || null);
      }
    }
  };

  // Switch challenge
  const handleSelectChallenge = (c: ChallengeProblem) => {
    setSelectedChallenge(c);
    const starter = createStarterMachine(c);
    setMachine(starter);
    setHistory([starter]);
    setHistoryIndex(0);
    setSelectedState(starter.states[0] || null);
    setLiveTestResult(null);
    setSolutionInput('');
    setActiveTab(c.targetType === 'DFA' || c.targetType === 'NFA' ? 'builder' : 'tests');
  };

  // Set default connection dropdown states when machine changes
  useEffect(() => {
    if (machine.states.length > 0) {
      if (!connectFrom || !machine.states.some(s => s.id === connectFrom)) {
        setConnectFrom(machine.states[0].id);
      }
      if (!connectTo || !machine.states.some(s => s.id === connectTo)) {
        setConnectTo(machine.states[machine.states.length > 1 ? 1 : 0].id);
      }
    }
  }, [machine.states, connectFrom, connectTo]);

  // Add new state
  const handleAddNewState = () => {
    const nextIdx = machine.states.length;
    const label = newStateLabel.trim() || `q${nextIdx}`;
    const newId = `q${Date.now().toString(36).substr(-4)}_${nextIdx}`;

    const newState: StateNode = {
      id: newId,
      label,
      x: 220 + (nextIdx % 4) * 110,
      y: 180 + Math.floor(nextIdx / 4) * 90,
      isStart: newStateIsStart || machine.states.length === 0,
      isFinal: newStateIsFinal,
    };

    const newFinals = newStateIsFinal
      ? [...machine.finalStateIds, newId]
      : machine.finalStateIds;
    const newStart = newStateIsStart || !machine.startStateId
      ? newId
      : machine.startStateId;

    const updatedStates: StateNode[] = newStateIsStart
      ? [...machine.states.map(s => ({ ...s, isStart: false })), newState]
      : [...machine.states, newState];

    updateMachineWithHistory({
      ...machine,
      states: updatedStates,
      startStateId: newStart,
      finalStateIds: newFinals,
    });

    setSelectedState(newState);
    setNewStateLabel('');
    setNewStateIsStart(false);
    setNewStateIsFinal(false);
  };

  // Toggle or set start state
  const handleSetStartState = (stateId: string) => {
    const updatedStates = machine.states.map(s => ({
      ...s,
      isStart: s.id === stateId,
    }));
    updateMachineWithHistory({
      ...machine,
      startStateId: stateId,
      states: updatedStates,
    });
  };

  // Toggle final state
  const handleToggleFinalState = (stateId: string) => {
    const isFinalNow =
      machine.finalStateIds.includes(stateId) ||
      Boolean(machine.states.find(s => s.id === stateId)?.isFinal);

    const newFinals = isFinalNow
      ? machine.finalStateIds.filter(id => id !== stateId)
      : [...machine.finalStateIds, stateId];

    const updatedStates = machine.states.map(s => ({
      ...s,
      isFinal: newFinals.includes(s.id),
    }));

    updateMachineWithHistory({
      ...machine,
      finalStateIds: newFinals,
      states: updatedStates,
    });
  };

  // Rename state
  const handleRenameState = (stateId: string, newLabel: string) => {
    if (!newLabel.trim()) return;
    const updatedStates = machine.states.map(s =>
      s.id === stateId ? { ...s, label: newLabel.trim() } : s
    );
    updateMachineWithHistory({ ...machine, states: updatedStates });
  };

  // Delete state
  const handleDeleteState = (stateId: string) => {
    const remainingStates = machine.states.filter(s => s.id !== stateId);
    const remainingTransitions = machine.transitions.filter(
      t => t.from !== stateId && t.to !== stateId
    );
    const remainingFinals = machine.finalStateIds.filter(id => id !== stateId);
    const newStart =
      machine.startStateId === stateId
        ? remainingStates[0]?.id || ''
        : machine.startStateId;

    updateMachineWithHistory({
      ...machine,
      states: remainingStates.map(s => ({
        ...s,
        isStart: s.id === newStart,
      })),
      transitions: remainingTransitions,
      finalStateIds: remainingFinals,
      startStateId: newStart,
    });

    if (selectedState?.id === stateId) {
      setSelectedState(null);
    }
  };

  // Connect any two states
  const handleConnectStates = (fromId: string, toId: string, symbolsString: string) => {
    if (!fromId || !toId) return;

    const syms = symbolsString
      .split(/[, ]+/)
      .map(s => s.trim())
      .filter(Boolean);
    const cleanSyms = syms.length > 0 ? syms : [selectedChallenge.alphabet[0] || '0'];

    const existingIndex = machine.transitions.findIndex(
      t => t.from === fromId && t.to === toId
    );

    let newTransitions: TransitionEdge[];
    if (existingIndex >= 0) {
      const existing = machine.transitions[existingIndex];
      const mergedSymbols = Array.from(new Set([...existing.symbols, ...cleanSyms]));
      newTransitions = machine.transitions.map((t, idx) =>
        idx === existingIndex ? { ...t, symbols: mergedSymbols } : t
      );
    } else {
      const newEdge: TransitionEdge = {
        id: `edge-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        from: fromId,
        to: toId,
        symbols: cleanSyms,
      };
      newTransitions = [...machine.transitions, newEdge];
    }

    updateMachineWithHistory({
      ...machine,
      transitions: newTransitions,
    });
  };

  // Delete transition
  const handleDeleteTransition = (edgeId: string) => {
    const remaining = machine.transitions.filter(t => t.id !== edgeId);
    updateMachineWithHistory({ ...machine, transitions: remaining });
  };

  // Edit transition symbols inline
  const handleUpdateTransitionSymbols = (edgeId: string, newSymbolsString: string) => {
    const syms = newSymbolsString
      .split(/[, ]+/)
      .map(s => s.trim())
      .filter(Boolean);
    if (syms.length === 0) return;

    const updated = machine.transitions.map(t =>
      t.id === edgeId ? { ...t, symbols: syms } : t
    );
    updateMachineWithHistory({ ...machine, transitions: updated });
  };

  // Live test case evaluations
  const testResults = useMemo(() => {
    const answer = selectedChallenge.targetType === 'DFA' || selectedChallenge.targetType === 'NFA'
      ? machine
      : solutionInput;
    const checked = checkChallengeSolution(selectedChallenge, answer, machine);
    const passedCount = checked.results.filter(result => result.passed).length;
    const details = checked.results.map((result, index) => ({
      ...result,
      displayInput: result.input === '' ? 'ε (empty string)' : result.input,
      description: selectedChallenge.testCases[index]?.description,
      reason: checked.error || `${result.actual ? 'Accepted' : 'Rejected'} by the supplied solution.`,
    }));

    return {
      details,
      passedCount,
      totalCount: selectedChallenge.testCases.length,
      allPassed: !checked.error && passedCount === selectedChallenge.testCases.length,
      error: checked.error,
      failedCase: details.find(detail => !detail.passed),
    };
  }, [machine, selectedChallenge, solutionInput]);

  // Primary Check Solution trigger
  const handleCheckSolution = () => {
    if (!testResults.allPassed) {
      setAttemptCounts(previous => ({
        ...previous,
        [selectedChallenge.id]: (previous[selectedChallenge.id] || 0) + 1,
      }));
    }
    setActiveTab('tests');
    if (testResults.allPassed) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
      if (!solvedChallengeIds.includes(selectedChallenge.id) &&
          !revealedSolutions.includes(selectedChallenge.id)) {
        const earned = challengeAward(
          selectedChallenge,
          hintCounts[selectedChallenge.id] || 0,
          solvedChallengeIds.includes(selectedChallenge.id),
          revealedSolutions.includes(selectedChallenge.id)
        );
        setSavedProgress(previous => ({ ...previous, score: previous.score + earned }));
      }
      onChallengeSolved(selectedChallenge.id);
    }
  };

  const revealNextHint = () => {
    setHintCounts(previous => ({
      ...previous,
      [selectedChallenge.id]: Math.min(selectedChallenge.hints.length, (previous[selectedChallenge.id] || 0) + 1),
    }));
  };

  const revealSolution = () => {
    if ((attemptCounts[selectedChallenge.id] || 0) < 3 || selectedChallenge.referenceSolution === undefined) return;
    setSavedProgress(previous => ({
      ...previous,
      revealedSolutions: previous.revealedSolutions.includes(selectedChallenge.id)
        ? previous.revealedSolutions
        : [...previous.revealedSolutions, selectedChallenge.id],
    }));
    if (selectedChallenge.referenceSolution &&
        typeof selectedChallenge.referenceSolution === 'object' &&
        'states' in selectedChallenge.referenceSolution) {
      updateMachineWithHistory(selectedChallenge.referenceSolution as AutomatonDefinition);
    } else {
      setSolutionInput(typeof selectedChallenge.referenceSolution === 'string'
        ? selectedChallenge.referenceSolution
        : JSON.stringify(selectedChallenge.referenceSolution, null, 2));
    }
  };

  const resetChallengeProgress = () => {
    if (!confirm('Reset all challenge progress, hints, attempts, and score?')) return;
    setSavedProgress(emptyChallengeProgress());
    clearChallengeProgress();
    onResetProgress?.();
  };

  // Run live interactive test on custom string
  const handleRunLiveTest = () => {
    const res = simulateAutomaton(machine, liveTestInput.trim());
    setLiveTestResult(res);
  };

  const isSolved = solvedChallengeIds.includes(selectedChallenge.id);
  const supportsCanvas = selectedChallenge.targetType === 'DFA' || selectedChallenge.targetType === 'NFA';
  const solvedCount = challengeProblems.filter(challenge => solvedChallengeIds.includes(challenge.id)).length;

  return (
    <div className="space-y-6 pb-16 animate-in fade-in">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-['Outfit'] flex items-center gap-2">
                <span>Automata Challenge Mode</span>
                {isSolved && (
                  <span className="px-2 py-0.5 text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" /> Solved
                  </span>
                )}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Design and verify machines and language descriptions against behavioral test suites
              </p>
            </div>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Challenge Selector */}
          <select
            value={selectedChallenge.id}
            onChange={e => {
              const found = challengeProblems.find(c => c.id === e.target.value);
              if (found) handleSelectChallenge(found);
            }}
            className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-slate-950 border border-slate-700 text-slate-100 text-xs font-bold rounded-2xl focus:outline-none focus:border-amber-500 cursor-pointer shadow-md"
          >
            {filteredChallenges.map(c => (
              <option key={c.id} value={c.id}>
                {c.title} ({c.difficulty}) {solvedChallengeIds.includes(c.id) ? '✓' : ''}
              </option>
            ))}
          </select>

          {/* Check Solution Button */}
          <button
            onClick={handleCheckSolution}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold rounded-2xl text-xs sm:text-sm shadow-lg shadow-amber-500/30 transition-all flex items-center gap-2 active:scale-95 shrink-0"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>TEST ALL ({testResults.passedCount}/{testResults.totalCount})</span>
          </button>
        </div>
      </div>

      <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3 shadow-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          <input
            value={searchText}
            onChange={event => setSearchText(event.target.value)}
            placeholder="Search challenges"
            className="px-3 py-2 bg-slate-950 border border-slate-700 text-slate-100 text-xs rounded-xl"
          />
          <select value={categoryFilter} onChange={event => setCategoryFilter(event.target.value)} className="px-3 py-2 bg-slate-950 border border-slate-700 text-slate-100 text-xs rounded-xl">
            {['All', ...new Set(challengeProblems.map(challenge => challenge.category))].map(category => <option key={category}>{category}</option>)}
          </select>
          <select value={difficultyFilter} onChange={event => setDifficultyFilter(event.target.value)} className="px-3 py-2 bg-slate-950 border border-slate-700 text-slate-100 text-xs rounded-xl">
            {['All', 'Easy', 'Medium', 'Hard'].map(difficulty => <option key={difficulty}>{difficulty}</option>)}
          </select>
          <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className="px-3 py-2 bg-slate-950 border border-slate-700 text-slate-100 text-xs rounded-xl">
            {['All', 'Solved', 'Unsolved'].map(status => <option key={status}>{status}</option>)}
          </select>
          <div className="flex gap-1">
            <button onClick={() => handleSelectChallenge(filteredChallenges[Math.floor(Math.random() * filteredChallenges.length)] || selectedChallenge)} className="flex-1 px-2 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold rounded-xl">Random</button>
            <button onClick={() => {
              const dateKey = new Date().toISOString().slice(0, 10);
              const hash = [...dateKey].reduce((sum, char) => sum + char.charCodeAt(0), 0);
              handleSelectChallenge(challengeProblems[hash % challengeProblems.length]);
            }} className="flex-1 px-2 py-2 bg-cyan-700 hover:bg-cyan-600 text-white text-[11px] font-bold rounded-xl">Daily</button>
            <button onClick={() => {
              const index = challengeProblems.findIndex(challenge => challenge.id === selectedChallenge.id);
              handleSelectChallenge(challengeProblems[(index + 1) % challengeProblems.length]);
            }} className="flex-1 px-2 py-2 bg-slate-700 hover:bg-slate-600 text-white text-[11px] font-bold rounded-xl">Next</button>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
          <span>Score: <strong className="text-amber-300">{challengeScore}</strong></span>
          <span>Solved: <strong className="text-emerald-300">{solvedCount} / {challengeProblems.length}</strong> · {challengeProblems.length / 8} per category</span>
          <button onClick={resetChallengeProgress} className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 hover:bg-rose-500/20">Reset progress</button>
        </div>
        <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400" style={{ width: `${solvedCount / challengeProblems.length * 100}%` }} />
        </div>
        <div className="flex flex-wrap gap-2">
          {[...new Set(challengeProblems.map(challenge => challenge.category))].map(category => {
            const categoryChallenges = challengeProblems.filter(challenge => challenge.category === category);
            const solvedCount = categoryChallenges.filter(challenge => solvedChallengeIds.includes(challenge.id)).length;
            return (
              <span key={category} className="px-2 py-1 rounded-lg bg-slate-950 text-[10px] text-slate-400">
                {category}: {solvedCount}/{categoryChallenges.length}
              </span>
            );
          })}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2 max-h-64 overflow-y-auto pr-1">
          {filteredChallenges.map(challenge => (
            <button
              key={challenge.id}
              onClick={() => handleSelectChallenge(challenge)}
              className={`p-3 rounded-xl border text-left transition-colors ${
                selectedChallenge.id === challenge.id
                  ? 'bg-indigo-600/20 border-indigo-400/60'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-600'
              }`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-indigo-300">{challenge.category}</span>
                {solvedChallengeIds.includes(challenge.id) && <Check className="w-3.5 h-3.5 text-emerald-400" />}
              </span>
              <span className="block mt-1 text-xs font-bold text-slate-100">{challenge.title}</span>
              <span className="flex justify-between mt-2 text-[10px] text-slate-400">
                <span>{challenge.difficulty}</span><span>{challenge.points} pts</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Challenge Spec & Hints Banner */}
      <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-3.5 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-lg border bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                {selectedChallenge.category}
              </span>
              <span
                className={`px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-lg border ${
                  selectedChallenge.difficulty === 'Easy'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : selectedChallenge.difficulty === 'Medium'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                }`}
              >
                {selectedChallenge.difficulty}
              </span>
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg">
                Alphabet Σ = {`{${selectedChallenge.alphabet.join(', ')}}`}
              </span>
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg">
                Target: {selectedChallenge.targetType || 'DFA'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white font-['Outfit']">
              {selectedChallenge.title}
            </h3>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => {
                if (confirm('Load starter template states for this challenge?')) {
                  const starter = createStarterMachine(selectedChallenge);
                  updateMachineWithHistory(starter);
                }
              }}
              className="px-3 py-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-1.5"
              title="Preload scaffold states and labels"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              <span>Load Template</span>
            </button>

            <button
              onClick={() => {
                if (confirm('Reset to a single start state?')) {
                  const clean = createCleanEmptyMachine(selectedChallenge);
                  updateMachineWithHistory(clean);
                }
              }}
              className="px-3 py-1.5 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition-colors flex items-center gap-1.5"
              title="Reset machine canvas"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
          {selectedChallenge.description}
        </p>

        {/* Hints pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-slate-400 font-bold flex items-center gap-1 text-[11px]">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Hints:
          </span>
          {selectedChallenge.hints.slice(0, hintCounts[selectedChallenge.id] || 0).map((h, i) => (
            <span
              key={i}
              className="px-2.5 py-1 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-300 text-[11px]"
            >
              • {h}
            </span>
          ))}
          {(hintCounts[selectedChallenge.id] || 0) < selectedChallenge.hints.length && (
            <button onClick={revealNextHint} className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-[11px]">
              Reveal hint (-3 points)
            </button>
          )}
          <span className="text-slate-500">Potential points: {Math.max(0, selectedChallenge.points - (hintCounts[selectedChallenge.id] || 0) * 3)}</span>
          {(attemptCounts[selectedChallenge.id] || 0) >= 3 && (
            <button onClick={revealSolution} className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-[11px]">
              Show solution
            </button>
          )}
        </div>
      </div>

      {/* Main Interactive Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Center: Interactive Graph Canvas Area (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {Boolean(selectedChallenge.sourceMachine) && (
            <details className="p-4 bg-slate-900 border border-indigo-500/30 rounded-2xl text-xs text-slate-300">
              <summary className="cursor-pointer font-bold text-indigo-300">
                {selectedChallenge.category === 'Conversions' ? 'Source NFA' : 'Original DFA'} — view source definition
              </summary>
              <pre className="mt-2 max-h-56 overflow-auto p-3 bg-slate-950 rounded-xl">{String(JSON.stringify(selectedChallenge.sourceMachine, null, 2))}</pre>
            </details>
          )}
          {['REGEX', 'CFG', 'PDA', 'TM'].includes(selectedChallenge.targetType) && (
            <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-3xl space-y-3">
              <label className="block text-xs font-bold text-slate-200">
                {selectedChallenge.targetType === 'REGEX'
                  ? 'Regular expression'
                  : `${selectedChallenge.targetType} solution (JSON definition)`}
              </label>
              <textarea
                value={solutionInput}
                onChange={event => setSolutionInput(event.target.value)}
                rows={selectedChallenge.targetType === 'REGEX' ? 2 : 10}
                spellCheck={false}
                placeholder={selectedChallenge.targetType === 'REGEX'
                  ? 'Enter a regular expression, e.g. (0|1)*01'
                  : `Paste a ${selectedChallenge.targetType} definition as JSON.`}
                className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
              {selectedChallenge.category === 'Conversions' && Boolean(selectedChallenge.sourceMachine) && (
                <details className="text-xs text-slate-400">
                  <summary className="cursor-pointer">Source automaton JSON</summary>
                  <pre className="mt-2 max-h-48 overflow-auto p-3 bg-slate-950 rounded-xl">{String(JSON.stringify(selectedChallenge.sourceMachine, null, 2))}</pre>
                </details>
              )}
              {selectedChallenge.category === 'Minimization' && Boolean(selectedChallenge.sourceMachine) && (
                <details className="text-xs text-slate-400">
                  <summary className="cursor-pointer">Source DFA JSON</summary>
                  <pre className="mt-2 max-h-48 overflow-auto p-3 bg-slate-950 rounded-xl">{String(JSON.stringify(selectedChallenge.sourceMachine, null, 2))}</pre>
                </details>
              )}
            </div>
          )}
          {/* Canvas Card */}
          {['DFA', 'NFA'].includes(selectedChallenge.targetType) && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl backdrop-blur-md space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white font-['Outfit'] uppercase tracking-wider">
                  Automata Canvas
                </span>
                <span className="text-[11px] text-slate-400">
                  ({machine.states.length} states, {machine.transitions.length} transitions)
                </span>
              </div>

              {/* Undo / Redo controls */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-slate-800 transition-colors"
                  title="Undo"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                  className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-slate-800 transition-colors"
                  title="Redo"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* SVG Visual Automata Canvas */}
            <div className="h-[520px] w-full">
              <AutomataCanvas
                machine={machine}
                onChangeMachine={updateMachineWithHistory}
                onSelectState={setSelectedState}
                selectedStateId={selectedState?.id || null}
                isEditable={true}
              />
            </div>

            {/* State Chips Quick Bar */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-slate-400 font-semibold text-[11px] mr-1">States:</span>
                {machine.states.map(s => {
                  const isStart = s.id === machine.startStateId;
                  const isFinal = machine.finalStateIds.includes(s.id);
                  const isSelected = selectedState?.id === s.id;

                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedState(s)}
                      className={`px-2.5 py-1 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-1 ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-400'
                          : isFinal
                          ? 'bg-purple-900/40 text-purple-300 border border-purple-500/40 hover:bg-purple-800/40'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/60'
                      }`}
                    >
                      {isStart && <span className="text-indigo-400">→</span>}
                      <span>{s.label}</span>
                      {isFinal && <span className="text-purple-400 font-extrabold">◎</span>}
                    </button>
                  );
                })}
              </div>

              {/* Quick Add State inline */}
              <button
                onClick={handleAddNewState}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors shadow-sm ml-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add State</span>
              </button>
            </div>
          </div>
          )}
        </div>

        {/* Right Inspector & Multi-Tool Studio (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4 backdrop-blur-md">
          {/* Studio Navigation Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-2xl overflow-x-auto text-xs">
            {supportsCanvas && (
            <button
              onClick={() => setActiveTab('builder')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl font-bold transition-all ${
                activeTab === 'builder'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Builder</span>
            </button>
            )}

            <button
              onClick={() => setActiveTab('tests')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl font-bold transition-all relative ${
                activeTab === 'tests'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Tests</span>
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  testResults.allPassed
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-rose-500/30 text-rose-300'
                }`}
              >
                {testResults.passedCount}/{testResults.totalCount}
              </span>
            </button>

            {supportsCanvas && <button
              onClick={() => setActiveTab('simulator')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl font-bold transition-all ${
                activeTab === 'simulator'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <PlaySquare className="w-3.5 h-3.5" />
              <span>Live Test</span>
            </button>}

            {supportsCanvas && <button
              onClick={() => setActiveTab('table')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl font-bold transition-all ${
                activeTab === 'table'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>δ Table</span>
            </button>}
          </div>

          {/* TAB 1: BUILDER & STATE / TRANSITION CONTROLS */}
          {activeTab === 'builder' && (
            <div className="space-y-5 text-xs animate-in fade-in">
              {/* State Inspector / Editor */}
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                    <span>State Inspector</span>
                  </span>
                  {selectedState && (
                    <span className="font-mono text-[11px] text-indigo-400 font-bold">
                      Selected: {selectedState.label}
                    </span>
                  )}
                </div>

                {selectedState ? (
                  <div className="space-y-3">
                    {/* Rename state */}
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">State Label</label>
                      <input
                        type="text"
                        value={selectedState.label}
                        onChange={e => handleRenameState(selectedState.id, e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl font-mono text-white text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    {/* Start & Final Toggles */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => handleSetStartState(selectedState.id)}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          selectedState.id === machine.startStateId
                            ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                            : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                        }`}
                      >
                        <ArrowRightCircle className="w-3.5 h-3.5" />
                        <span>
                          {selectedState.id === machine.startStateId ? 'Start State ✓' : 'Set as Start'}
                        </span>
                      </button>

                      <button
                        onClick={() => handleToggleFinalState(selectedState.id)}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          machine.finalStateIds.includes(selectedState.id)
                            ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                            : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                          {machine.finalStateIds.includes(selectedState.id)
                            ? 'Final State (◎) ✓'
                            : 'Set as Final'}
                        </span>
                      </button>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => setConnectFrom(selectedState.id)}
                        className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
                      >
                        <LinkIcon className="w-3 h-3" />
                        <span>Connect from this state</span>
                      </button>

                      <button
                        onClick={() => handleDeleteState(selectedState.id)}
                        className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete State</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-900/60 rounded-xl text-center text-slate-400 text-xs">
                    Click any state node on the canvas to inspect, rename, set as start or final state.
                  </div>
                )}
              </div>

              {/* Connect Any States Panel */}
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3.5">
                <span className="font-bold text-slate-200 flex items-center gap-1.5 pb-2 border-b border-slate-800/80">
                  <LinkIcon className="w-3.5 h-3.5 text-amber-400" />
                  <span>Connect Any States (Add Transition)</span>
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">From State</label>
                    <select
                      value={connectFrom}
                      onChange={e => setConnectFrom(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl font-mono text-white text-xs focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      {machine.states.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.label} {s.id === machine.startStateId ? '(Start)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">To State (Target)</label>
                    <select
                      value={connectTo}
                      onChange={e => setConnectTo(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl font-mono text-white text-xs focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      {machine.states.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.label} {machine.finalStateIds.includes(s.id) ? '(Final)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Symbols Input & Clickable Chips */}
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">
                    Transition Symbol(s) (comma separated)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={connectSymbol}
                      onChange={e => setConnectSymbol(e.target.value)}
                      placeholder="e.g. 0, 1 or ε"
                      className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl font-mono text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                    <button
                      onClick={() => handleConnectStates(connectFrom, connectTo, connectSymbol)}
                      disabled={!connectFrom || !connectTo}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-40"
                    >
                      Connect
                    </button>
                  </div>

                  {/* Symbol Quick Chips */}
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-[10px] text-slate-500 mr-1">Quick Symbol:</span>
                    {selectedChallenge.alphabet.map(sym => (
                      <button
                        key={sym}
                        type="button"
                        onClick={() => {
                          setConnectSymbol(prev => {
                            if (!prev) return sym;
                            const parts = prev.split(/[, ]+/).map(x => x.trim()).filter(Boolean);
                            return parts.includes(sym) ? prev : `${prev}, ${sym}`;
                          });
                        }}
                        className="px-2 py-0.5 font-mono text-xs font-bold bg-slate-900 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-800 rounded-lg transition-colors"
                      >
                        +{sym}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setConnectSymbol(prev => (prev ? `${prev}, ε` : 'ε'));
                      }}
                      className="px-2 py-0.5 font-mono text-xs font-bold bg-slate-900 hover:bg-purple-500/20 text-purple-300 border border-slate-800 rounded-lg transition-colors"
                    >
                      +ε
                    </button>
                  </div>
                </div>
              </div>

              {/* Make New State Form */}
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
                <span className="font-bold text-slate-200 flex items-center gap-1.5 pb-2 border-b border-slate-800/80">
                  <Plus className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Create New State</span>
                </span>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newStateLabel}
                    onChange={e => setNewStateLabel(e.target.value)}
                    placeholder={`e.g. q${machine.states.length}`}
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl font-mono text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handleAddNewState}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-md active:scale-95"
                  >
                    Add State
                  </button>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-300 pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newStateIsStart}
                      onChange={e => setNewStateIsStart(e.target.checked)}
                      className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Make Start State (→)</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newStateIsFinal}
                      onChange={e => setNewStateIsFinal(e.target.checked)}
                      className="rounded border-slate-700 text-purple-600 focus:ring-purple-500"
                    />
                    <span>Make Final State (◎)</span>
                  </label>
                </div>
              </div>

              {/* Active Transitions List */}
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <span className="font-bold text-slate-200">
                    Existing Transitions ({machine.transitions.length})
                  </span>
                </div>

                {machine.transitions.length === 0 ? (
                  <div className="text-slate-500 text-xs text-center py-2">
                    No transitions yet. Connect any two states above or drag/click on canvas!
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {machine.transitions.map(edge => {
                      const fromLabel = machine.states.find(s => s.id === edge.from)?.label || edge.from;
                      const toLabel = machine.states.find(s => s.id === edge.to)?.label || edge.to;

                      return (
                        <div
                          key={edge.id}
                          className="flex items-center justify-between p-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono"
                        >
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-slate-800 text-slate-200 rounded font-semibold">
                              {fromLabel}
                            </span>
                            <span className="text-amber-400 font-bold">
                              ──({edge.symbols.join(', ')})──▶
                            </span>
                            <span className="px-2 py-0.5 bg-slate-800 text-slate-200 rounded font-semibold">
                              {toLabel}
                            </span>
                          </div>

                          <button
                            onClick={() => handleDeleteTransition(edge.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                            title="Delete transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: TEST CASES & SUITE EVALUATION */}
          {activeTab === 'tests' && (
            <div className="space-y-4 text-xs animate-in fade-in">
              {/* Overall status banner */}
              <div
                className={`p-4 rounded-2xl border shadow-md space-y-2 ${
                  testResults.allPassed
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                    : 'bg-slate-950 border-slate-800 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {testResults.allPassed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                    )}
                    <span className="font-bold text-sm">
                      {testResults.allPassed
                        ? 'ALL TEST CASES PASSED! ✓'
                        : `${testResults.passedCount} / ${testResults.totalCount} Test Cases Passed`}
                    </span>
                  </div>

                  <button
                    onClick={handleCheckSolution}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Re-evaluate</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-400">
                  {testResults.allPassed
                    ? 'Great work! Your finite automaton accepted every positive string and rejected all counterexamples.'
                    : 'Inspect individual test strings below to identify missing transitions or incorrect final states.'}
                </p>
                {testResults.error && <p className="text-[11px] text-rose-300">{testResults.error}</p>}
              </div>

              {/* Counterexample Highlight Card */}
              {!testResults.allPassed && testResults.failedCase && (
                <div className="p-3.5 bg-rose-950/30 border border-rose-900/60 rounded-2xl space-y-1.5 font-mono text-xs">
                  <span className="text-[10px] uppercase font-bold text-rose-400 block tracking-wider font-sans">
                    Counterexample / Failed Test Case:
                  </span>
                  <div>
                    Input: <strong className="text-white">"{testResults.failedCase.displayInput}"</strong>
                  </div>
                  <div>
                    Expected:{' '}
                    <strong className={testResults.failedCase.expected ? 'text-emerald-400' : 'text-rose-400'}>
                      {testResults.failedCase.expected ? 'ACCEPT' : 'REJECT'}
                    </strong>{' '}
                    | Machine Output:{' '}
                    <strong className={testResults.failedCase.actual ? 'text-emerald-400' : 'text-rose-400'}>
                      {testResults.failedCase.actual ? 'ACCEPT' : 'REJECT'}
                    </strong>
                  </div>
                  <div className="text-[11px] text-slate-400 font-sans pt-1">
                    Reason: {testResults.failedCase.reason}
                  </div>
                </div>
              )}

              {/* Test Cases Table */}
              <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
                {testResults.details.map((tc, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-2xl border transition-all space-y-1 ${
                      tc.passed
                        ? 'bg-slate-950/80 border-slate-800 text-slate-300'
                        : 'bg-rose-950/20 border-rose-900/50 text-rose-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono">
                      <div className="flex items-center gap-2">
                        {tc.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                        <span className="font-bold text-white">"{tc.displayInput}"</span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="text-slate-500 font-sans">Expected:</span>
                        <span
                          className={`font-bold ${
                            tc.expected ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {tc.expected ? 'ACCEPT' : 'REJECT'}
                        </span>
                        <span className="text-slate-500 font-sans">Actual:</span>
                        <span className={`font-bold ${tc.actual ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {tc.actual ? 'ACCEPT' : 'REJECT'}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            tc.passed
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {tc.passed ? 'PASSED' : 'FAILED'}
                        </span>
                      </div>
                    </div>

                    {tc.description && (
                      <div className="text-[11px] text-slate-400 font-sans">
                        • {tc.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: LIVE STRING SIMULATOR */}
          {activeTab === 'simulator' && (
            <div className="space-y-4 text-xs animate-in fade-in">
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
                <span className="font-bold text-slate-200 flex items-center gap-1.5 pb-2 border-b border-slate-800/80">
                  <PlaySquare className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Test Arbitrary String</span>
                </span>

                <p className="text-slate-400 text-[11px]">
                  Type any sequence over Σ = {`{${selectedChallenge.alphabet.join(', ')}}`} to step-trace execution on your machine.
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={liveTestInput}
                    onChange={e => setLiveTestInput(e.target.value)}
                    placeholder="Enter string (e.g. 01, 1101, or empty)"
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl font-mono text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    onClick={handleRunLiveTest}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all shadow-md active:scale-95"
                  >
                    Simulate
                  </button>
                </div>

                {/* Quick Test Samples */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-500 mr-1">Quick Inputs:</span>
                  {selectedChallenge.testCases.slice(0, 4).map((tc, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setLiveTestInput(tc.input);
                        const res = simulateAutomaton(machine, tc.input);
                        setLiveTestResult(res);
                      }}
                      className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono text-[11px] rounded border border-slate-800"
                    >
                      "{tc.input === '' ? 'ε' : tc.input}"
                    </button>
                  ))}
                </div>
              </div>

              {/* Simulation Result Output */}
              {liveTestResult && (
                <div
                  className={`p-4 rounded-2xl border space-y-2.5 animate-in fade-in ${
                    liveTestResult.accepted
                      ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                      : 'bg-rose-950/40 border-rose-800/60 text-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5 text-sm">
                      {liveTestResult.accepted ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>ACCEPTED ✓</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-rose-400" />
                          <span>REJECTED ✗</span>
                        </>
                      )}
                    </span>
                    <span className="font-mono text-xs opacity-80">
                      Total Steps: {liveTestResult.totalSteps}
                    </span>
                  </div>

                  <p className="text-xs opacity-90 leading-relaxed font-sans">
                    {liveTestResult.detailedReason}
                  </p>

                  {/* Execution Trace Steps */}
                  <div className="space-y-1 pt-2 border-t border-slate-800/60 text-[11px] font-mono max-h-40 overflow-y-auto">
                    {liveTestResult.path.map((step: any, i: number) => (
                      <div key={i} className="text-slate-300">
                        <span className="text-indigo-400 font-bold">Step {step.stepIndex}:</span>{' '}
                        {step.explanation}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: TRANSITION TABLE δ */}
          {activeTab === 'table' && (
            <div className="space-y-3 text-xs animate-in fade-in">
              <div className="flex items-center justify-between text-slate-400">
                <span>Transition Matrix δ: Q × Σ → Q</span>
                <span className="text-indigo-400 font-semibold text-[11px]">Click cells to edit</span>
              </div>
              <TransitionTable
                machine={machine}
                onChangeMachine={updateMachineWithHistory}
                isEditable={true}
              />
            </div>
          )}

          {/* TAB 5: HINTS & FORMAL SPECIFICATION */}
          {activeTab === 'hints' && (
            <div className="space-y-4 text-xs animate-in fade-in">
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
                <span className="font-bold text-amber-400 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4" />
                  <span>Hints & Solution Strategies</span>
                </span>
                <div className="space-y-2 text-slate-300">
                  {selectedChallenge.hints.slice(0, hintCounts[selectedChallenge.id] || 0).map((h, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{h}</span>
                    </div>
                  ))}
                  {(hintCounts[selectedChallenge.id] || 0) < selectedChallenge.hints.length && (
                    <button onClick={revealNextHint} className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300">
                      Reveal next hint (-3 points)
                    </button>
                  )}
                  {(attemptCounts[selectedChallenge.id] || 0) >= 3 && (
                    <button onClick={revealSolution} className="ml-2 px-3 py-1.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300">
                      Show solution
                    </button>
                  )}
                </div>
              </div>

              {selectedChallenge.explanation && (
                <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
                  <span className="font-bold text-indigo-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>Formal Language Breakdown</span>
                  </span>
                  <p className="text-slate-300 leading-relaxed font-sans">
                    {selectedChallenge.explanation}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
