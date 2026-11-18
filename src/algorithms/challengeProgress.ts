import { ChallengeProblem } from '../types/learning';

export interface SavedChallengeProgress {
  score: number;
  attempts: Record<string, number>;
  hints: Record<string, number>;
  revealedSolutions: string[];
}

export const CHALLENGE_PROGRESS_KEY = 'universal_automata_challenge_progress';
export const emptyChallengeProgress = (): SavedChallengeProgress => ({
  score: 0,
  attempts: {},
  hints: {},
  revealedSolutions: [],
});

export function loadChallengeProgress(storage: Storage = localStorage): SavedChallengeProgress {
  try {
    const raw = storage.getItem(CHALLENGE_PROGRESS_KEY);
    if (!raw) return emptyChallengeProgress();
    const progress = JSON.parse(raw) as Partial<SavedChallengeProgress>;
    return {
      score: Number.isFinite(progress.score) ? Number(progress.score) : 0,
      attempts: progress.attempts || {},
      hints: progress.hints || {},
      revealedSolutions: progress.revealedSolutions || [],
    };
  } catch (error) {
    console.error('Unable to read saved challenge progress.', error);
    return emptyChallengeProgress();
  }
}

export function saveChallengeProgress(
  progress: SavedChallengeProgress,
  storage: Storage = localStorage
): void {
  try {
    storage.setItem(CHALLENGE_PROGRESS_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Unable to persist challenge progress.', error);
  }
}

export function clearChallengeProgress(storage: Storage = localStorage): void {
  try {
    storage.removeItem(CHALLENGE_PROGRESS_KEY);
  } catch (error) {
    console.error('Unable to clear persisted challenge progress.', error);
  }
}

export function challengeAward(
  challenge: ChallengeProblem,
  hintsUsed: number,
  alreadySolved: boolean,
  solutionRevealed: boolean
): number {
  if (alreadySolved || solutionRevealed) return 0;
  return Math.max(0, challenge.points - hintsUsed * 3);
}
