import { describe, expect, test } from 'vitest';
import { challengeProblems } from '../src/data/challengesData';
import { checkChallengeSolution } from '../src/algorithms/challengeChecking';
import {
  challengeAward,
  clearChallengeProgress,
  loadChallengeProgress,
  saveChallengeProgress,
} from '../src/algorithms/challengeProgress';
import { AutomatonDefinition } from '../src/types/automata';

function isAutomaton(value: unknown): value is AutomatonDefinition {
  return Boolean(value && typeof value === 'object' && 'states' in value && 'transitions' in value);
}

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length(): number { return this.values.size; }
  clear(): void { this.values.clear(); }
  getItem(key: string): string | null { return this.values.get(key) || null; }
  key(index: number): string | null { return [...this.values.keys()][index] || null; }
  removeItem(key: string): void { this.values.delete(key); }
  setItem(key: string, value: string): void { this.values.set(key, String(value)); }
}

describe('Challenge Mode data and behavioral checking', () => {
  test('each category has eight unique challenges with complete, disjoint test suites', () => {
    expect(challengeProblems).toHaveLength(64);
    expect(new Set(challengeProblems.map(challenge => challenge.id)).size).toBe(64);
    for (const challenge of challengeProblems) {
      expect(challenge.solution.accepts.length).toBeGreaterThanOrEqual(8);
      expect(challenge.solution.rejects.length).toBeGreaterThanOrEqual(8);
      expect(new Set(challenge.solution.accepts).size).toBe(challenge.solution.accepts.length);
      expect(new Set(challenge.solution.rejects).size).toBe(challenge.solution.rejects.length);
      expect(challenge.solution.accepts.some(input => challenge.solution.rejects.includes(input))).toBe(false);
    }
  });

  test('every reference solution passes its full behavioral test suite', () => {
    for (const challenge of challengeProblems) {
      const reference = challenge.referenceSolution;
      const machine = isAutomaton(reference) ? reference : undefined;
      const check = checkChallengeSolution(challenge, reference, machine);
      expect(check.error, challenge.title).toBeUndefined();
      expect(check.results.filter(result => !result.passed), challenge.title).toEqual([]);
    }
  });

  test('a behaviorally equivalent non-minimal DFA passes', () => {
    const challenge = challengeProblems.find(item => item.id === 'dfa-design-ends-01')!;
    const reference = challenge.referenceSolution as AutomatonDefinition;
    const alternative: AutomatonDefinition = {
      ...reference,
      states: [
        ...reference.states,
        { id: 'unreachable', label: 'extra', x: 0, y: 0 },
      ],
      transitions: [
        ...reference.transitions,
        ...reference.alphabet.map((symbol, index) => ({
          id: `extra-${index}`,
          from: 'unreachable',
          to: 'unreachable',
          symbols: [symbol],
        })),
      ],
    };
    const check = checkChallengeSolution(challenge, alternative, alternative);
    expect(check.error).toBeUndefined();
    expect(check.results.every(result => result.passed)).toBe(true);
  });

  test('an incorrect machine reports all mismatching strings and expected outcomes', () => {
    const challenge = challengeProblems.find(item => item.id === 'dfa-design-ends-01')!;
    const incorrect: AutomatonDefinition = {
      id: 'wrong',
      name: 'Wrong',
      type: 'DFA',
      alphabet: challenge.alphabet,
      states: [{ id: 'q0', label: 'q0', x: 0, y: 0 }],
      transitions: [],
      startStateId: 'q0',
      finalStateIds: [],
    };
    const check = checkChallengeSolution(challenge, incorrect, incorrect);
    const failures = check.results.filter(result => !result.passed);
    expect(failures.length).toBeGreaterThan(0);
    expect(failures.every(result => result.actual !== result.expected)).toBe(true);
    expect(failures.map(result => [result.input, result.expected, result.actual])).toEqual(
      challenge.solution.accepts.map(input => [input, true, false])
    );
  });

  test('hint penalties apply and repeated solves/revealed solutions award no points', () => {
    const challenge = challengeProblems[0];
    expect(challengeAward(challenge, 0, false, false)).toBe(challenge.points);
    expect(challengeAward(challenge, 2, false, false)).toBe(challenge.points - 6);
    expect(challengeAward(challenge, 0, true, false)).toBe(0);
    expect(challengeAward(challenge, 0, false, true)).toBe(0);
  });

  test('progress persists through reload and reset clears it', () => {
    const storage = new MemoryStorage();
    const progress = { score: 25, attempts: { 'challenge-a': 2 }, hints: { 'challenge-a': 1 }, revealedSolutions: [] };
    saveChallengeProgress(progress, storage);
    expect(loadChallengeProgress(storage)).toEqual(progress);
    clearChallengeProgress(storage);
    expect(loadChallengeProgress(storage)).toEqual({
      score: 0, attempts: {}, hints: {}, revealedSolutions: [],
    });
  });
});
