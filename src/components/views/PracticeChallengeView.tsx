import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { challengeProblems } from '../../data/challengesData';
import { ChallengeProblem } from '../../types/learning';
import { AutomatonDefinition, StateNode } from '../../types/automata';
import { AutomataCanvas } from '../canvas/AutomataCanvas';
import { simulateAutomaton } from '../../algorithms/dfaSimulation';
import { Trophy, CheckCircle2, XCircle, Lightbulb, Play, ArrowRight, RotateCcw } from 'lucide-react';

interface PracticeChallengeViewProps {
  onChallengeSolved: (challengeId: string) => void;
  solvedChallengeIds: string[];
}

export const PracticeChallengeView: React.FC<PracticeChallengeViewProps> = ({
  onChallengeSolved,
  solvedChallengeIds,
}) => {
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeProblem>(
    challengeProblems[0]
  );

  // Editable machine for solving the challenge
  const createEmptyMachine = (c: ChallengeProblem): AutomatonDefinition => ({
    id: `challenge-user-${c.id}`,
    name: c.title,
    type: c.targetType as any,
    alphabet: c.alphabet,
    states: [
      { id: 'q0', label: 'q0', x: 250, y: 220, isStart: true, isFinal: false },
      { id: 'q1', label: 'q1', x: 450, y: 220, isStart: false, isFinal: false },
    ],
    transitions: [],
    startStateId: 'q0',
    finalStateIds: [],
  });

  const [machine, setMachine] = useState<AutomatonDefinition>(() =>
    createEmptyMachine(challengeProblems[0])
  );

  const [testResults, setTestResults] = useState<{
    tested: boolean;
    allPassed: boolean;
    passCount: number;
    totalCount: number;
    failedCase?: { input: string; expected: boolean; actual: boolean; reason: string };
  }>({
    tested: false,
    allPassed: false,
    passCount: 0,
    totalCount: 0,
  });

  const handleSelectChallenge = (c: ChallengeProblem) => {
    setSelectedChallenge(c);
    setMachine(createEmptyMachine(c));
    setTestResults({ tested: false, allPassed: false, passCount: 0, totalCount: 0 });
  };

  const handleCheckSolution = () => {
    let passed = 0;
    let failedCase: any = null;

    for (const tc of selectedChallenge.testCases) {
      const res = simulateAutomaton(machine, tc.input);
      if (res.accepted === tc.expected) {
        passed++;
      } else if (!failedCase) {
        failedCase = {
          input: tc.input === '' ? 'ε (empty string)' : tc.input,
          expected: tc.expected,
          actual: res.accepted,
          reason: res.detailedReason,
        };
      }
    }

    const allPassed = passed === selectedChallenge.testCases.length;

    setTestResults({
      tested: true,
      allPassed,
      passCount: passed,
      totalCount: selectedChallenge.testCases.length,
      failedCase,
    });

    if (allPassed) {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
      });
      onChallengeSolved(selectedChallenge.id);
    }
  };

  const isSolved = solvedChallengeIds.includes(selectedChallenge.id);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-['Outfit'] flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            <span>Automata Builder Challenge Mode</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Construct machines satisfying formal specifications; test solutions against automated hidden test suites
          </p>
        </div>

        {/* Challenge selector dropdown */}
        <select
          value={selectedChallenge.id}
          onChange={e => {
            const found = challengeProblems.find(c => c.id === e.target.value);
            if (found) handleSelectChallenge(found);
          }}
          className="px-3 py-2 bg-slate-900 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl focus:outline-none focus:border-amber-500 cursor-pointer shadow-sm"
        >
          {challengeProblems.map(c => (
            <option key={c.id} value={c.id}>
              {c.title} ({c.difficulty}) {solvedChallengeIds.includes(c.id) ? '✓' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Challenge Description & Hints Card */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-4 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
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
              <span className="text-xs font-mono text-slate-400">
                Alphabet Σ = {`{${selectedChallenge.alphabet.join(', ')}}`}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white font-['Outfit']">
              {selectedChallenge.title}
            </h3>
          </div>

          <button
            onClick={handleCheckSolution}
            className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-2xl text-xs sm:text-sm shadow-lg shadow-amber-500/30 transition-all flex items-center gap-2 active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>CHECK SOLUTION</span>
          </button>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
          {selectedChallenge.description}
        </p>

        {/* Hints accordion */}
        <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2 text-xs">
          <span className="text-slate-400 font-bold flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span>Hints & Guidance:</span>
          </span>
          <div className="space-y-1 text-slate-300">
            {selectedChallenge.hints.map((h, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span>{h}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Test Evaluation Feedback */}
      {testResults.tested && (
        <div
          className={`p-6 rounded-3xl border shadow-xl space-y-3 animate-in fade-in ${
            testResults.allPassed
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
              : 'bg-rose-950/40 border-rose-800/60 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {testResults.allPassed ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
            )}
            <div>
              <h3 className="text-base font-bold">
                {testResults.allPassed
                  ? 'CHALLENGE COMPLETED! ALL TEST CASES PASSED ✓'
                  : `SOLUTION FAILED (${testResults.passCount} / ${testResults.totalCount} Passed)`}
              </h3>
              <p className="text-xs opacity-90">
                {testResults.allPassed
                  ? 'Congratulations! Your machine recognized the formal language correctly across all edge cases.'
                  : 'Your automaton failed on one or more test strings. Check the counterexample below.'}
              </p>
            </div>
          </div>

          {!testResults.allPassed && testResults.failedCase && (
            <div className="p-4 bg-slate-950/90 rounded-2xl border border-rose-900/50 space-y-1.5 text-xs font-mono text-slate-200">
              <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block font-sans">
                Failed Test Case / Counterexample:
              </span>
              <div>Input String: <strong className="text-white">"{testResults.failedCase.input}"</strong></div>
              <div>
                Expected Result:{' '}
                <strong className={testResults.failedCase.expected ? 'text-emerald-400' : 'text-rose-400'}>
                  {testResults.failedCase.expected ? 'ACCEPT' : 'REJECT'}
                </strong>{' '}
                | Your Machine:{' '}
                <strong className={testResults.failedCase.actual ? 'text-emerald-400' : 'text-rose-400'}>
                  {testResults.failedCase.actual ? 'ACCEPT' : 'REJECT'}
                </strong>
              </div>
              <div className="text-[11px] text-slate-400 font-sans pt-1">
                Reason: {testResults.failedCase.reason}
              </div>
            </div>
          )}

          {testResults.allPassed && (
            <div className="p-4 bg-slate-950/90 rounded-2xl border border-emerald-900/40 text-xs text-slate-300 space-y-1 font-sans">
              <span className="font-bold text-emerald-400 block">Formal Solution Breakdown:</span>
              <p>{selectedChallenge.explanation}</p>
            </div>
          )}
        </div>
      )}

      {/* Interactive Builder Canvas for this challenge */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center justify-between">
          <span>Construct Your Solution Machine:</span>
          <span className="text-xs text-slate-400 font-normal">
            Click "+ Add State", connect transitions, set start/final states
          </span>
        </h3>
        <div className="h-[480px] w-full">
          <AutomataCanvas
            machine={machine}
            onChangeMachine={setMachine}
            isEditable={true}
          />
        </div>
      </div>
    </div>
  );
};
