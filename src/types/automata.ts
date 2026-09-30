// Universal Automata & Formal Languages Data Models

export type AutomatonType = 'DFA' | 'NFA' | 'ENFA' | 'MOORE' | 'MEALY';

export interface StateNode {
  id: string;
  label: string;
  x: number;
  y: number;
  isStart?: boolean;
  isFinal?: boolean;
  output?: string; // For Moore machine: output associated with this state
  description?: string; // Meaning of state (e.g., "ends with 0", "even 1s")
}

export interface TransitionEdge {
  id: string;
  from: string; // state id
  to: string;   // state id
  symbols: string[]; // e.g. ['0', '1'] or ['ε']
  output?: string; // For Mealy machine: output on this transition (e.g. '0/A')
  curveOffset?: number; // Visual curve offset if multiple/reverse transitions
}

export interface AutomatonDefinition {
  id: string;
  name: string;
  type: AutomatonType;
  description?: string;
  alphabet: string[]; // e.g. ['0', '1'] or ['a', 'b']
  outputAlphabet?: string[]; // for Moore/Mealy
  states: StateNode[];
  transitions: TransitionEdge[];
  startStateId: string;
  finalStateIds: string[];
  createdAt?: string;
  updatedAt?: string;
  tags?: string[];
}

export interface SimulationStep {
  stepIndex: number;
  symbol: string | null; // null for step 0
  currentStateIds: string[]; // Set of active states (singleton for DFA, multiple for NFA)
  previousStateIds?: string[];
  activeTransitionId?: string;
  inputRemaining: string;
  inputProcessed: string;
  outputProduced?: string; // for Moore or Mealy
  explanation: string;
}

export interface SimulationResult {
  accepted: boolean;
  status: 'ACCEPTED' | 'REJECTED' | 'HALTED' | 'RUNNING';
  finalStateIds: string[];
  path: SimulationStep[];
  detailedReason: string;
  totalSteps: number;
  totalOutput?: string;
}

export interface MachineStatistics {
  numStates: number;
  numTransitions: number;
  numFinalStates: number;
  alphabetSize: number;
  reachableStates: string[];
  unreachableStates: string[];
  deadStates: string[]; // cannot reach any final state
  missingTransitions: { stateId: string; symbol: string }[];
  isDeterministic: boolean;
  epsilonCount: number;
}

export interface DebugIssue {
  id: string;
  severity: 'ERROR' | 'WARNING' | 'INFO';
  title: string;
  message: string;
  suggestion?: string;
  affectedStates?: string[];
  affectedTransitions?: string[];
  autoFixable?: boolean;
  fixAction?: string;
}

// CFG Definitions
export interface CFGProduction {
  id: string;
  variable: string;
  replacement: string; // e.g., "aSb" or "ε"
}

export interface CFGDefinition {
  id: string;
  name: string;
  variables: string[]; // e.g., ["S", "A", "B"]
  terminals: string[]; // e.g., ["a", "b"]
  startVariable: string;
  productions: CFGProduction[];
}

export interface ParseTreeNode {
  id: string;
  symbol: string;
  children: ParseTreeNode[];
}

export interface CFGDerivationStep {
  step: number;
  sententialForm: string;
  appliedProduction?: CFGProduction;
  replacedIndex?: number;
  explanation: string;
}

// Pushdown Automaton Definitions
export interface PDATransition {
  id: string;
  from: string;
  to: string;
  inputSymbol: string; // '0', '1', or 'ε'
  popSymbol: string;   // stack symbol to pop or 'ε'
  pushSymbols: string[]; // stack symbols to push, e.g. ['0', 'Z0'] or ['ε']
}

export interface PDADefinition {
  id: string;
  name: string;
  description?: string;
  states: StateNode[];
  inputAlphabet: string[];
  stackAlphabet: string[];
  startStateId: string;
  startStackSymbol: string; // e.g. 'Z0'
  finalStateIds: string[];
  transitions: PDATransition[];
  acceptMode: 'FINAL_STATE' | 'EMPTY_STACK' | 'BOTH';
}

export interface PDAStep {
  stepIndex: number;
  stateId: string;
  remainingInput: string;
  stack: string[]; // top of stack is stack[0] or stack[stack.length - 1]
  appliedTransition?: PDATransition;
  explanation: string;
}

// Turing Machine Definitions
export interface TMTransition {
  id: string;
  from: string;
  to: string;
  readSymbol: string;
  writeSymbol: string;
  direction: 'L' | 'R' | 'S'; // Left, Right, Stay
}

export interface TMDefinition {
  id: string;
  name: string;
  description?: string;
  states: StateNode[];
  inputAlphabet: string[];
  tapeAlphabet: string[]; // includes Blank symbol 'B'
  blankSymbol: string; // usually 'B' or '␣'
  startStateId: string;
  acceptStateId: string;
  rejectStateId?: string;
  transitions: TMTransition[];
}

export interface TMStep {
  stepIndex: number;
  stateId: string;
  headIndex: number;
  tape: string[];
  actionDescription: string;
  isAccept?: boolean;
  isReject?: boolean;
}

// Equivalence Check Result
export interface EquivalenceResult {
  equivalent: boolean;
  counterexample?: string;
  m1Result?: boolean;
  m2Result?: boolean;
  message: string;
  checkedCount: number;
}
