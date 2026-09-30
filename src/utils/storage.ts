import { AutomatonDefinition } from '../types/automata';
import { predefinedAutomata } from '../data/predefinedExamples';

const STORAGE_KEY_AUTOMATA = 'universal_automata_saved';
const STORAGE_KEY_PREFS = 'universal_automata_prefs';
const STORAGE_KEY_STATS = 'universal_automata_user_stats';

export interface UserPreferences {
  theme: 'dark' | 'light';
  mode: 'beginner' | 'advanced';
  soundEnabled: boolean;
  simulationSpeedMs: number;
}

export interface UserProgressStats {
  topicsCompleted: string[];
  quizzesAttempted: number;
  quizzesCorrect: number;
  challengesSolved: string[];
  examsTaken: number;
  bestExamScore: number;
  simulationsRun: number;
}

// Get saved automata or initialize with predefined examples
export function getSavedAutomata(): AutomatonDefinition[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTOMATA);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_AUTOMATA, JSON.stringify(predefinedAutomata));
      return predefinedAutomata;
    }
    return JSON.parse(raw);
  } catch {
    return predefinedAutomata;
  }
}

// Save an automaton
export function saveAutomaton(machine: AutomatonDefinition): void {
  try {
    const all = getSavedAutomata();
    const existingIdx = all.findIndex(m => m.id === machine.id);
    const updated = {
      ...machine,
      updatedAt: new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      all[existingIdx] = updated;
    } else {
      all.unshift(updated);
    }

    localStorage.setItem(STORAGE_KEY_AUTOMATA, JSON.stringify(all));
  } catch (err) {
    console.error('Failed to save automaton', err);
  }
}

// Delete an automaton
export function deleteAutomaton(id: string): void {
  try {
    const all = getSavedAutomata().filter(m => m.id !== id);
    localStorage.setItem(STORAGE_KEY_AUTOMATA, JSON.stringify(all));
  } catch (err) {
    console.error('Failed to delete automaton', err);
  }
}

// User preferences
export function getUserPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    theme: 'dark',
    mode: 'beginner',
    soundEnabled: true,
    simulationSpeedMs: 650,
  };
}

export function saveUserPreferences(prefs: UserPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(prefs));
  } catch {}
}

// User progress stats
export function getUserStats(): UserProgressStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STATS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    topicsCompleted: ['topic-intro'],
    quizzesAttempted: 0,
    quizzesCorrect: 0,
    challengesSolved: [],
    examsTaken: 0,
    bestExamScore: 0,
    simulationsRun: 0,
  };
}

export function saveUserStats(stats: UserProgressStats): void {
  try {
    localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats));
  } catch {}
}
