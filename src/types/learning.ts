// Learning, Quiz, Challenge, and Exam Types

export interface LearningTopic {
  id: string;
  order: number;
  title: string;
  category: 'Finite Automata' | 'Outputs' | 'Regular Languages' | 'CFL' | 'Turing';
  shortDesc: string;
  formalDefinition: string;
  explanation: string;
  keyProperties: string[];
  commonMistakes: string[];
  exampleMachineId?: string;
  interactiveLab?: string; // Link to specific lab view
}

export type QuizQuestionType = 
  | 'MCQ' 
  | 'TRUE_FALSE' 
  | 'PREDICT_ACCEPT' 
  | 'PREDICT_OUTPUT' 
  | 'IDENTIFY_TRANSITION' 
  | 'CONCEPT_MATCH';

export interface QuizQuestion {
  id: string;
  topicId: string;
  topicTitle: string;
  question: string;
  type: QuizQuestionType;
  options: string[];
  correctIndex: number; // 0-based
  explanation: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  sampleString?: string;
}

export interface ChallengeProblem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  alphabet: string[];
  targetType: 'DFA' | 'NFA' | 'MOORE' | 'MEALY' | 'PDA' | 'TM';
  hints: string[];
  testCases: { input: string; expected: boolean; description?: string }[];
  starterMachine?: any;
  explanation: string;
}

export interface ExamQuestion extends QuizQuestion {
  userAnswer?: number;
  isMarkedForReview?: boolean;
}

export interface ExamSession {
  id: string;
  title: string;
  durationMinutes: number;
  timeRemainingSeconds: number;
  questions: ExamQuestion[];
  isSubmitted: boolean;
  score?: number;
  totalScore?: number;
  topicBreakdown?: { topic: string; correct: number; total: number }[];
}
