import { AutomatonDefinition, SimulationResult } from '../types/automata';
import { simulateAutomaton } from './dfaSimulation';

export interface StringTestResult {
  input: string;
  displayInput: string;
  length: number;
  accepted: boolean;
  simulation: SimulationResult;
}

export interface LanguageExplorationResult {
  alphabet: string[];
  maxLength: number;
  totalTested: number;
  acceptedStrings: StringTestResult[];
  rejectedStrings: StringTestResult[];
  acceptanceRate: number;
}

// Generate all combinations of alphabet strings up to maxLength
export function exploreLanguage(
  machine: AutomatonDefinition,
  maxLength = 4,
  maxResults = 100
): LanguageExplorationResult {
  const alphabet = machine.alphabet.filter(s => s !== 'ε' && s !== 'λ');
  const tested: StringTestResult[] = [];
  const accepted: StringTestResult[] = [];
  const rejected: StringTestResult[] = [];

  // Generate strings in breadth-first length order: "", symbols, combinations
  const queue: string[] = [''];

  while (queue.length > 0 && tested.length < maxResults) {
    const current = queue.shift()!;
    const sim = simulateAutomaton(machine, current);
    const item: StringTestResult = {
      input: current,
      displayInput: current === '' ? 'ε (empty string)' : current,
      length: current.length,
      accepted: sim.accepted,
      simulation: sim,
    };

    tested.push(item);
    if (sim.accepted) {
      accepted.push(item);
    } else {
      rejected.push(item);
    }

    if (current.length < maxLength) {
      for (const sym of alphabet) {
        queue.push(current + sym);
      }
    }
  }

  const acceptanceRate = tested.length > 0 ? (accepted.length / tested.length) * 100 : 0;

  return {
    alphabet,
    maxLength,
    totalTested: tested.length,
    acceptedStrings: accepted,
    rejectedStrings: rejected,
    acceptanceRate: Math.round(acceptanceRate * 10) / 10,
  };
}

// Generate random string tests
export function generateRandomTests(
  machine: AutomatonDefinition,
  count = 10,
  maxLength = 6,
  filter: 'MIXED' | 'ACCEPTED_ONLY' | 'REJECTED_ONLY' = 'MIXED'
): StringTestResult[] {
  const alphabet = machine.alphabet.filter(s => s !== 'ε' && s !== 'λ');
  if (alphabet.length === 0) return [];

  const results: StringTestResult[] = [];
  let attempts = 0;
  const maxAttempts = count * 25;

  while (results.length < count && attempts < maxAttempts) {
    attempts++;
    const length = Math.floor(Math.random() * (maxLength + 1));
    let str = '';
    for (let i = 0; i < length; i++) {
      const sym = alphabet[Math.floor(Math.random() * alphabet.length)];
      str += sym;
    }

    // Check duplicate
    if (results.some(r => r.input === str)) continue;

    const sim = simulateAutomaton(machine, str);

    if (filter === 'ACCEPTED_ONLY' && !sim.accepted) continue;
    if (filter === 'REJECTED_ONLY' && sim.accepted) continue;

    results.push({
      input: str,
      displayInput: str === '' ? 'ε (empty string)' : str,
      length: str.length,
      accepted: sim.accepted,
      simulation: sim,
    });
  }

  return results;
}
