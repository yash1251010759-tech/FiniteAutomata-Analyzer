import {
  AutomatonDefinition,
  CFGDefinition,
  PDADefinition,
  TMDefinition,
} from '../types/automata';
import { ChallengeProblem } from '../types/learning';
import { simulateAutomaton } from './dfaSimulation';
import { deriveString } from './cfg';
import { simulatePDA } from './pda';
import { simulateTuringMachine } from './turingMachine';
import { regexToENFA } from './regexToNfa';
import { minimizeDFA } from './dfaMinimization';

export interface ChallengeTestResult {
  input: string;
  expected: boolean;
  actual: boolean;
  passed: boolean;
}

export interface ChallengeCheckResult {
  results: ChallengeTestResult[];
  error?: string;
}

function isAutomaton(value: unknown): value is AutomatonDefinition {
  return Boolean(value && typeof value === 'object' && 'states' in value && 'transitions' in value && 'alphabet' in value);
}

function isCFG(value: unknown): value is CFGDefinition {
  return Boolean(value && typeof value === 'object' && 'productions' in value && 'startVariable' in value);
}

function isPDA(value: unknown): value is PDADefinition {
  return Boolean(value && typeof value === 'object' && 'inputAlphabet' in value && 'startStackSymbol' in value);
}

function isTM(value: unknown): value is TMDefinition {
  return Boolean(value && typeof value === 'object' && 'tapeAlphabet' in value && 'acceptStateId' in value);
}

function rejectedResults(challenge: ChallengeProblem): ChallengeCheckResult {
  return {
    error: 'Solution is missing or has the wrong format for this challenge.',
    results: challenge.testCases.map(test => ({
      input: test.input,
      expected: test.expected,
      actual: false,
      passed: false,
    })),
  };
}

export function checkChallengeSolution(
  challenge: ChallengeProblem,
  answer: unknown,
  canvasMachine?: AutomatonDefinition
): ChallengeCheckResult {
  let candidate: unknown = answer;
  if (challenge.targetType === 'DFA' || challenge.targetType === 'NFA' ||
      challenge.targetType === 'MOORE' || challenge.targetType === 'MEALY') {
    candidate = canvasMachine;
  } else if (typeof answer === 'string' && challenge.targetType !== 'REGEX') {
    try {
      candidate = JSON.parse(answer);
    } catch {
      return {
        error: 'Solution must be valid JSON matching the required machine definition.',
        results: challenge.testCases.map(test => ({
          input: test.input, expected: test.expected, actual: false, passed: false,
        })),
      };
    }
  }

  const actualFor = (input: string): boolean => {
    if (challenge.targetType === 'REGEX') {
      if (typeof candidate !== 'string' || !candidate.trim()) return false;
      return simulateAutomaton(regexToENFA(candidate), input).accepted;
    }
    if (challenge.targetType === 'CFG') {
      if (!isCFG(candidate)) return false;
      return deriveString(candidate, input).valid;
    }
    if (challenge.targetType === 'PDA') {
      if (!isPDA(candidate)) return false;
      return simulatePDA(candidate, input).accepted;
    }
    if (challenge.targetType === 'TM') {
      if (!isTM(candidate)) return false;
      return simulateTuringMachine(candidate, input).status === 'ACCEPTED';
    }
    if (!isAutomaton(candidate)) return false;
    return simulateAutomaton(candidate, input).accepted;
  };

  if (challenge.targetType !== 'REGEX' && challenge.targetType !== 'CFG' &&
      challenge.targetType !== 'PDA' && challenge.targetType !== 'TM' && !isAutomaton(candidate)) {
    return rejectedResults(challenge);
  }
  if (challenge.targetType === 'CFG' && !isCFG(candidate)) return rejectedResults(challenge);
  if (challenge.targetType === 'PDA' && !isPDA(candidate)) return rejectedResults(challenge);
  if (challenge.targetType === 'TM' && !isTM(candidate)) return rejectedResults(challenge);
  if (challenge.targetType === 'REGEX' && (typeof candidate !== 'string' || !candidate.trim())) {
    return rejectedResults(challenge);
  }

  const results: ChallengeTestResult[] = [];
  for (const test of challenge.testCases) {
    try {
      const actual = actualFor(test.input);
      results.push({ input: test.input, expected: test.expected, actual, passed: actual === test.expected });
    } catch (error) {
      return {
        error: `Could not simulate input '${test.input || 'ε'}': ${error instanceof Error ? error.message : String(error)}`,
        results: [...results, { input: test.input, expected: test.expected, actual: false, passed: false }],
      };
    }
  }

  if (challenge.category === 'Minimization' && isAutomaton(candidate)) {
    const reference = challenge.referenceSolution;
    if (isAutomaton(reference)) {
      const expectedMinimum = minimizeDFA(reference).statesAfter;
      if (candidate.states.length !== expectedMinimum) {
        return {
          error: `The equivalent DFA must be minimal (${expectedMinimum} states expected; your machine has ${candidate.states.length}).`,
          results,
        };
      }
    }
  }
  return { results };
}
