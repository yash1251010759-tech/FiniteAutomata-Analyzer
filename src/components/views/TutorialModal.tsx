import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  Lightbulb,
  AlertTriangle,
  GraduationCap,
  Play,
  Search,
  ListOrdered,
  HelpCircle,
  ArrowRight,
  Layers,
  RotateCcw,
  Check,
  Cpu,
  FileCode,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { NavigationTab } from '../layout/Sidebar';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadStarterDfa?: () => void;
  onNavigateTab?: (tab: NavigationTab) => void;
}

interface StepBreakdown {
  stepNumber: number;
  title: string;
  explanation: string;
  tip?: string;
}

interface TraceStep {
  stepNum: number;
  readChar: string;
  fromState: string;
  toState: string;
  actionDescription: string;
  whyDecision: string;
}

interface ExecutionTrace {
  sampleString: string;
  steps: TraceStep[];
  verdict: 'ACCEPTED' | 'REJECTED';
  verdictExplanation: string;
}

interface QuickQuiz {
  question: string;
  options: string[];
  correctIdx: number;
  explanation: string;
}

interface TutorialChapter {
  id: string;
  number: number;
  title: string;
  badge: string;
  category: 'Foundation' | 'Finite Automata' | 'Conversions' | 'Optimization' | 'Higher Models';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  summary: string;
  conceptIntro: string;
  mathNotation?: string;
  realWorldAnalogy: string;
  keyPrinciples: string[];
  detailedSteps: StepBreakdown[];
  sampleExecutionTrace: ExecutionTrace;
  concreteExample: {
    title: string;
    description: string;
    sampleAccepted: string[];
    sampleRejected: string[];
  };
  commonPitfalls: string;
  quickQuiz: QuickQuiz;
  relatedLabTab?: NavigationTab;
  relatedLabLabel?: string;
}

const CHAPTERS: TutorialChapter[] = [
  {
    id: 'ch-intro',
    number: 1,
    title: 'Automata 101: What is Computation? Mental Models',
    badge: 'Core Foundation',
    category: 'Foundation',
    difficulty: 'Beginner',
    summary:
      'An automaton is an abstract mathematical machine that reads an input sequence symbol-by-symbol, transitioning between internal states to decide whether the input is ACCEPTED or REJECTED.',
    conceptIntro:
      'In computer science, before we write code in C++, Python, or JavaScript, we must understand the fundamental limits of computation: what problems can a machine solve, and how much memory does it need? A finite automaton has a strictly fixed, finite amount of memory represented as states. It cannot store arbitrarily large numbers, but it excels at pattern recognition, validation, lexical analysis, and syntax parsing with guaranteed O(n) linear speed.',
    realWorldAnalogy:
      'Think of an automatic supermarket sliding door: It has two states: [CLOSED] and [OPEN]. When the motion sensor detects "Person Approaching" (input symbol), it transitions to [OPEN]. When it detects "Timer Expired & No Person", it transitions back to [CLOSED]. The door does not need an entire supercomputer; a simple 2-state finite automaton runs it reliably 24/7.',
    mathNotation: 'L(M) = { w ∈ Σ* | δ*(q0, w) ∈ F }',
    keyPrinciples: [
      'Sequential Consumption: The input string is read strictly from left to right, one character at a time.',
      'No Reversals / No Backtracking: Once a symbol is consumed, the reading head moves forward and cannot look back.',
      'Finite State Space: The machine can only be in one state at any instant (for DFAs), chosen from a fixed set Q.',
      'Binary Verdict: After the entire input string is read, if the machine is standing in an ACCEPTING state (double circle), the string is ACCEPTED; otherwise, REJECTED.',
    ],
    detailedSteps: [
      {
        stepNumber: 1,
        title: 'Initialize Machine State',
        explanation:
          'Place the machine at the designated start state q0. The input string tape holds the characters w = a1 a2 ... an.',
        tip: 'Look for the incoming arrow from nowhere pointing to q0.',
      },
      {
        stepNumber: 2,
        title: 'Fetch Next Input Symbol',
        explanation:
          'Read the leftmost unprocessed character from the string. If no characters remain, proceed to Step 4.',
      },
      {
        stepNumber: 3,
        title: 'Execute State Transition (δ)',
        explanation:
          'Lookup the transition function rule δ(current_state, symbol). Move the machine to the resulting state and repeat Step 2.',
        tip: 'In a DFA, there is always exactly one deterministic destination.',
      },
      {
        stepNumber: 4,
        title: 'Evaluate Acceptance Condition',
        explanation:
          'The entire string has been consumed. Check if current_state ∈ F (the set of final/accepting states). If yes -> ACCEPT; otherwise -> REJECT.',
      },
    ],
    sampleExecutionTrace: {
      sampleString: 'PUSH, COIN, PUSH',
      steps: [
        {
          stepNum: 1,
          readChar: 'PUSH',
          fromState: 'Locked',
          toState: 'Locked',
          actionDescription: 'Turnstile is locked; pushing the arm without paying keeps it locked.',
          whyDecision: 'Rule δ(Locked, PUSH) = Locked. String remains valid so far.',
        },
        {
          stepNum: 2,
          readChar: 'COIN',
          fromState: 'Locked',
          toState: 'Unlocked',
          actionDescription: 'Inserting a valid token unlocks the barrier.',
          whyDecision: 'Rule δ(Locked, COIN) = Unlocked. Machine memory updates.',
        },
        {
          stepNum: 3,
          readChar: 'PUSH',
          fromState: 'Unlocked',
          toState: 'Locked',
          actionDescription: 'User pushes through the arm; turnstile rotates and locks behind them.',
          whyDecision: 'Rule δ(Unlocked, PUSH) = Locked. All symbols consumed.',
        },
      ],
      verdict: 'ACCEPTED',
      verdictExplanation:
        'All inputs processed cleanly and machine reached a safe, valid operational state.',
    },
    concreteExample: {
      title: 'Subway Turnstile Controller',
      description: 'Q = {Locked, Unlocked}, Σ = {COIN, PUSH}, Start = Locked, Final = {Locked}',
      sampleAccepted: ['COIN, PUSH', 'PUSH, COIN, PUSH', 'COIN, COIN, PUSH'],
      sampleRejected: ['COIN (leaves gate open)', 'COIN, PUSH, PUSH (blocked second push)'],
    },
    commonPitfalls:
      'Beginners frequently confuse the states of the machine with the input symbols. States are internal memory nodes (like Locked or Unlocked); symbols are external events fed into the machine (like COIN or PUSH).',
    quickQuiz: {
      question: 'When is an input string formally ACCEPTED by a Finite Automaton?',
      options: [
        'A. As soon as the machine visits any accepting state at any point.',
        'B. When the entire string is read AND the final resting state is an accepting state (∈ F).',
        'C. When the machine visits all states in the diagram at least once.',
        'D. Only if the input string contains an even number of characters.',
      ],
      correctIdx: 1,
      explanation:
        'Correct! A finite automaton must consume the entire input string from left to right. Only the state where the machine stops after the final character determines acceptance.',
    },
    relatedLabTab: 'builder',
    relatedLabLabel: 'Open Automata Builder',
  },
  {
    id: 'ch-5tuple',
    number: 2,
    title: 'The Formal 5-Tuple Model: (Q, Σ, δ, q0, F)',
    badge: 'Mathematical Rigor',
    category: 'Foundation',
    difficulty: 'Beginner',
    summary:
      'Every Finite State Machine is formally specified by five mathematical components known as the 5-tuple: M = (Q, Σ, δ, q0, F).',
    conceptIntro:
      'While visual bubble-and-arrow diagrams are great for intuition, computer algorithms and proofs require mathematical precision. The 5-tuple standardizes the definition across all textbooks, compilers, and formal verification tools.',
    mathNotation: 'M = (Q, Σ, δ, q0, F)',
    realWorldAnalogy:
      'Imagine a board game: Q is the list of squares on the board; Σ is the allowed dice numbers or move cards; δ is the official rulebook dictating where each card moves you; q0 is the "START" square; and F is the set of winning squares.',
    keyPrinciples: [
      'Q (Set of States): A finite, non-empty set of state labels, e.g. {q0, q1, q2}.',
      'Σ (Input Alphabet): A finite, non-empty set of valid characters, e.g. {0, 1} or {a, b}.',
      'δ (Transition Function): The map defining next states. For DFA: δ: Q × Σ → Q.',
      'q0 (Initial State): Exactly ONE designated starting state, q0 ∈ Q.',
      'F (Final / Accepting States): A subset of states where strings are accepted: F ⊆ Q (can be empty, single, or multiple).',
    ],
    detailedSteps: [
      {
        stepNumber: 1,
        title: 'Define the Alphabet (Σ)',
        explanation: 'Identify all allowed input characters. For binary, Σ = {0, 1}.',
      },
      {
        stepNumber: 2,
        title: 'Enumerate Memory States (Q)',
        explanation:
          'Determine what past information the machine needs to remember. For parity, we only need 2 states: {Even, Odd}.',
      },
      {
        stepNumber: 3,
        title: 'Pick the Start State (q0)',
        explanation:
          'Choose the initial state before reading any characters. For empty string parity, start in Even.',
      },
      {
        stepNumber: 4,
        title: 'Formulate Transitions (δ)',
        explanation:
          'Fill the transition table matrix: for every state q ∈ Q and symbol a ∈ Σ, define δ(q, a).',
      },
      {
        stepNumber: 5,
        title: 'Designate Accepting Set (F)',
        explanation:
          'Select which states represent successful conditions. Mark them with double circles.',
      },
    ],
    sampleExecutionTrace: {
      sampleString: '101',
      steps: [
        {
          stepNum: 1,
          readChar: '1',
          fromState: 'q_even',
          toState: 'q_odd',
          actionDescription: 'Encountered odd count of 1s (count = 1).',
          whyDecision: 'δ(q_even, 1) = q_odd.',
        },
        {
          stepNum: 2,
          readChar: '0',
          fromState: 'q_odd',
          toState: 'q_odd',
          actionDescription: 'Reading a 0 does not alter the parity of 1s.',
          whyDecision: 'δ(q_odd, 0) = q_odd.',
        },
        {
          stepNum: 3,
          readChar: '1',
          fromState: 'q_odd',
          toState: 'q_even',
          actionDescription: 'Encountered second 1; parity returns to even (count = 2).',
          whyDecision: 'δ(q_odd, 1) = q_even.',
        },
      ],
      verdict: 'ACCEPTED',
      verdictExplanation: 'End state is q_even, which belongs to F = {q_even}. String is accepted!',
    },
    concreteExample: {
      title: 'Even Number of 1s Machine',
      description: 'Q = {q_even, q_odd}, Σ = {0, 1}, q0 = q_even, F = {q_even}',
      sampleAccepted: ['ε (zero 1s)', '11', '0101', '110011', '000'],
      sampleRejected: ['1', '10', '111', '010'],
    },
    commonPitfalls:
      'Notice that F is a SET, not a single state! An automaton can have zero accepting states (accepts nothing), one accepting state, or multiple accepting states. Also, q0 is a single element, NOT a set.',
    quickQuiz: {
      question: 'Which component of the 5-tuple M = (Q, Σ, δ, q0, F) can legally be an empty set ∅?',
      options: [
        'A. Q (Set of states)',
        'B. Σ (Alphabet)',
        'C. q0 (Initial state)',
        'D. F (Set of accepting states)',
      ],
      correctIdx: 3,
      explanation:
        'Correct! F ⊆ Q, so F can be the empty set ∅ (meaning the automaton rejects all strings). Q and Σ must be non-empty, and q0 must be an existing state in Q.',
    },
    relatedLabTab: 'simulator',
    relatedLabLabel: 'Open Simulator',
  },
  {
    id: 'ch-dfa',
    number: 3,
    title: 'Deterministic Finite Automata (DFA): Design from Scratch',
    badge: 'Strict Determinism',
    category: 'Finite Automata',
    difficulty: 'Beginner',
    summary:
      'In a DFA, for EVERY state and EVERY symbol in the alphabet, there is EXACTLY ONE destination state. No guessing, no ambiguities, no epsilon shortcuts.',
    conceptIntro:
      'The word deterministic means predictable and certain. If you are in state q and see symbol a, there is never any question or choice about where to go. Because of this property, DFAs are directly synthesizable into hardware chips and compile into blazing-fast O(1) table lookups in software.',
    mathNotation: 'δ: Q × Σ → Q (Total Function)',
    realWorldAnalogy:
      'A digital lock with buttons [A, B, C]. Entering "B-A-C" step-by-step shifts internal tumbler pins. There is no guessing; each button press triggers one exact mechanical shift.',
    keyPrinciples: [
      'Completeness: Every single state MUST have an outgoing transition arrow for EVERY symbol in Σ.',
      'Uniqueness: A state CANNOT have two different outgoing arrows labeled with the same symbol.',
      'No Epsilon (ε): A DFA cannot move or change state without consuming an input character.',
      'Trap / Dead States: If an input pattern becomes permanently unrecoverable, direct transitions to a non-accepting trap state that loops on all symbols.',
    ],
    detailedSteps: [
      {
        stepNumber: 1,
        title: 'Identify the Required Language Property',
        explanation: 'State clearly what patterns are valid (e.g. "Strings ending in 01").',
      },
      {
        stepNumber: 2,
        title: 'Establish Meaning for Each State',
        explanation:
          'Create states representing progress: q0 = "Nothing matched yet", q1 = "Last saw 0", q2 = "Last saw 01 (Accepting)".',
      },
      {
        stepNumber: 3,
        title: 'Connect the Forward Progress Transitions',
        explanation: 'From q0 on 0 -> go to q1. From q1 on 1 -> go to q2.',
      },
      {
        stepNumber: 4,
        title: 'Complete All Remaining / Backtrack Transitions',
        explanation:
          'Ensure every state has transitions for both 0 and 1. What happens if q2 sees 0? It has just seen "0", so backtrack to q1!',
        tip: 'Never leave missing transitions in a DFA! Missing transitions violate determinism.',
      },
    ],
    sampleExecutionTrace: {
      sampleString: '1001',
      steps: [
        {
          stepNum: 1,
          readChar: '1',
          fromState: 'q0',
          toState: 'q0',
          actionDescription: 'Leading 1 does not help create "01"; stay in start state q0.',
          whyDecision: 'δ(q0, 1) = q0.',
        },
        {
          stepNum: 2,
          readChar: '0',
          fromState: 'q0',
          toState: 'q1',
          actionDescription: 'First "0" seen! Moving to progress state q1.',
          whyDecision: 'δ(q0, 0) = q1.',
        },
        {
          stepNum: 3,
          readChar: '0',
          fromState: 'q1',
          toState: 'q1',
          actionDescription: 'Saw another "0". The most recent character is still "0"; remain in q1.',
          whyDecision: 'δ(q1, 0) = q1.',
        },
        {
          stepNum: 4,
          readChar: '1',
          fromState: 'q1',
          toState: 'q2',
          actionDescription: 'Saw "1" following "0"! Target suffix "01" achieved.',
          whyDecision: 'δ(q1, 1) = q2.',
        },
      ],
      verdict: 'ACCEPTED',
      verdictExplanation: 'Execution finishes in q2 ∈ F. String ends in 01!',
    },
    concreteExample: {
      title: 'Binary Strings Ending in "01"',
      description: 'Alphabet Σ = {0, 1}. Start = q0, States = {q0, q1, q2}, Final = {q2}',
      sampleAccepted: ['01', '101', '0001', '11101', '0101'],
      sampleRejected: ['ε', '0', '1', '10', '010', '1100'],
    },
    commonPitfalls:
      'The #1 mistake students make on DFA exams is omitting transitions. If Σ = {0, 1} and your state only has an arrow for "0", your diagram is an NFA or incomplete, NOT a valid DFA.',
    quickQuiz: {
      question: 'If a DFA has |Q| = 4 states and alphabet |Σ| = 3 symbols, how many total transitions must exist?',
      options: ['A. Exactly 4 transitions', 'B. Exactly 7 transitions', 'C. Exactly 12 transitions', 'D. At most 64 transitions'],
      correctIdx: 2,
      explanation:
        'Correct! By definition of a total function δ: Q × Σ → Q, every state must have exactly one outgoing transition per alphabet symbol. 4 states × 3 symbols = 12 total transitions.',
    },
    relatedLabTab: 'builder',
    relatedLabLabel: 'Build Custom DFA',
  },
  {
    id: 'ch-nfa',
    number: 4,
    title: 'Nondeterministic Finite Automata (NFA): Power of Branching',
    badge: 'Parallel Universes',
    category: 'Finite Automata',
    difficulty: 'Beginner',
    summary:
      'An NFA can transition to zero, one, or multiple states simultaneously on the same input symbol, intuitively "guessing" the optimal path.',
    conceptIntro:
      'Nondeterminism is one of the most powerful theoretical concepts in computer science. Instead of committing to a single path, think of an NFA as branching into multiple parallel universes. If even ONE branch lands in an accepting state at the end of the string, the string is ACCEPTED!',
    mathNotation: 'δ: Q × Σ → 2^Q (Power Set of States)',
    realWorldAnalogy:
      'A GPS navigation system calculating routes: Instead of driving down one highway and hoping for no traffic, the GPS computes every possible turn and shortcut simultaneously across the entire map.',
    keyPrinciples: [
      'Multi-Destination Branching: On state q and symbol a, δ(q, a) can equal {q1, q2, q3}. The machine clones itself.',
      'Missing Transitions Allowed: If δ(q, b) = ∅, that specific branch simply terminates without crashing the whole machine.',
      'Acceptance by Any Valid Path: A string is accepted if there exists at least one computation path ending in an accepting state.',
      'Equal Expressive Power: NFAs and DFAs recognize the EXACT same set of languages (Regular Languages). NFAs are often vastly smaller and simpler to draw.',
    ],
    detailedSteps: [
      {
        stepNumber: 1,
        title: 'Use Self-Loops for Unrestricted Prefixes',
        explanation: 'Loop on all symbols (a, b) at the start state until the target pattern appears.',
      },
      {
        stepNumber: 2,
        title: 'Non-deterministically Branch on Target Start',
        explanation:
          'When the key character arrives, branch into the pattern-matching pipeline while also keeping the loop active.',
      },
      {
        stepNumber: 3,
        title: 'Chain States to Complete the Pattern',
        explanation: 'Create sequential forward states for each remaining character of the substring.',
      },
      {
        stepNumber: 4,
        title: 'Linger in Final State',
        explanation: 'Once accepted, loop on all characters to accept any arbitrary suffix.',
      },
    ],
    sampleExecutionTrace: {
      sampleString: 'abb',
      steps: [
        {
          stepNum: 1,
          readChar: 'a',
          fromState: '{q0}',
          toState: '{q0, q1}',
          actionDescription: 'Machine branches! One branch stays in q0, another guesses "abb" has started and moves to q1.',
          whyDecision: 'δ(q0, a) = {q0, q1}. Both paths remain active.',
        },
        {
          stepNum: 2,
          readChar: 'b',
          fromState: '{q0, q1}',
          toState: '{q0, q2}',
          actionDescription: 'q0 loops to q0; q1 moves to q2. Branch set is now {q0, q2}.',
          whyDecision: 'δ(q0, b) = {q0}, δ(q1, b) = {q2}.',
        },
        {
          stepNum: 3,
          readChar: 'b',
          fromState: '{q0, q2}',
          toState: '{q0, q3}',
          actionDescription: 'q2 advances to accepting state q3! q0 stays in q0.',
          whyDecision: 'δ(q2, b) = {q3}. Current active states: {q0, q3}.',
        },
      ],
      verdict: 'ACCEPTED',
      verdictExplanation: 'Active state set {q0, q3} contains accepting state q3. String is accepted!',
    },
    concreteExample: {
      title: 'Strings Containing Substring "abb"',
      description: 'Alphabet Σ = {a, b}. q0 loops on a,b. On \'a\', branches to q1 -> q2 (\'b\') -> q3 (\'b\').',
      sampleAccepted: ['abb', 'aabb', 'babb', 'bbabbba', 'abbb'],
      sampleRejected: ['ab', 'aba', 'bba', 'bab', 'a', 'b'],
    },
    commonPitfalls:
      'Students often assume that because NFAs can branch non-deterministically, they can recognize non-regular languages like {0^n 1^n}. This is FALSE: NFAs have finite memory and have the exact same computational power as DFAs.',
    quickQuiz: {
      question: 'In an NFA, what happens if an active branch encounters a symbol for which no transition is defined?',
      options: [
        'A. The entire machine crashes and rejects the string immediately.',
        'B. That specific branch dies (terminates), but other active branches continue processing.',
        'C. The machine is forced to rewind to the beginning.',
        'D. The missing symbol is automatically converted to an epsilon move.',
      ],
      correctIdx: 1,
      explanation:
        'Correct! In an NFA, transitions map to sets of states. If δ(q, a) = ∅, that single execution branch is pruned, while any other parallel branches proceed normally.',
    },
    relatedLabTab: 'conversion',
    relatedLabLabel: 'Open Conversion Lab',
  },
  {
    id: 'ch-enfa',
    number: 5,
    title: 'Epsilon Transitions (ε-NFA) & Computing ε-Closures',
    badge: 'Spontaneous Leaps',
    category: 'Finite Automata',
    difficulty: 'Intermediate',
    summary:
      'An ε-NFA allows transitions labeled with epsilon (ε), enabling the machine to jump between states for free without reading any input symbol.',
    conceptIntro:
      'Epsilon moves represent instantaneous state teleports. They are indispensable when combining smaller automata into larger ones (such as in regular expression compilation). To analyze an ε-NFA, we compute the ε-closure: the set of all states reachable by following zero or more consecutive ε transitions.',
    mathNotation: 'ECLOSE(q) = { p ∈ Q | q ⇝_ε p }',
    realWorldAnalogy:
      'Airport moving walkways or express elevators: Entering one instantly teleports you to another gate without expending your own walking energy (consuming input symbols).',
    keyPrinciples: [
      'Self-Inclusion: Every state is always in its own ε-closure: q ∈ ECLOSE(q) (following zero ε moves).',
      'Transitive Reachability: If q →ε p and p →ε r, then both p and r belong to ECLOSE(q).',
      'No Symbol Consumption: You do not advance the input tape when executing an ε transition.',
      'Conversion: Every ε-NFA can be converted to an equivalent standard NFA or DFA without epsilon transitions.',
    ],
    detailedSteps: [
      {
        stepNumber: 1,
        title: 'Start with the Source State Set',
        explanation: 'Initialize ECLOSE(S) = S. Add all states in S to a processing queue.',
      },
      {
        stepNumber: 2,
        title: 'Traverse Outgoing ε Transitions',
        explanation:
          'For each state u popped from the queue, find all states v such that u →ε v.',
      },
      {
        stepNumber: 3,
        title: 'Add Newly Discovered States',
        explanation:
          'If v is not yet in ECLOSE(S), add v to the set and push v onto the queue to inspect its outgoing ε moves.',
      },
      {
        stepNumber: 4,
        title: 'Halt on Fixed Point',
        explanation: 'When the queue is empty, ECLOSE(S) contains all transitively reachable states.',
      },
    ],
    sampleExecutionTrace: {
      sampleString: 'a',
      steps: [
        {
          stepNum: 1,
          readChar: 'ε (Initial closure)',
          fromState: 'q0',
          toState: '{q0, q1}',
          actionDescription: 'Before reading any input, machine takes ε transition from q0 to q1.',
          whyDecision: 'ECLOSE(q0) = {q0, q1}.',
        },
        {
          stepNum: 2,
          readChar: 'a',
          fromState: '{q0, q1}',
          toState: '{q2}',
          actionDescription: 'State q1 reads "a" and transitions to q2.',
          whyDecision: 'δ(q1, a) = {q2}.',
        },
        {
          stepNum: 3,
          readChar: 'ε (Post-closure)',
          fromState: '{q2}',
          toState: '{q2, q3}',
          actionDescription: 'State q2 has an ε transition to accepting state q3.',
          whyDecision: 'ECLOSE(q2) = {q2, q3}. Current active states: {q2, q3}.',
        },
      ],
      verdict: 'ACCEPTED',
      verdictExplanation: 'State q3 is an accepting state. String "a" is accepted!',
    },
    concreteExample: {
      title: 'Regex Union: a | b using ε Transitions',
      description: 'q0 branches to q1 via ε (handles "a") and q2 via ε (handles "b"). Both merge to q_final via ε.',
      sampleAccepted: ['a', 'b'],
      sampleRejected: ['ε', 'ab', 'ba', 'c'],
    },
    commonPitfalls:
      'Students frequently forget that ECLOSE(q) always includes state q itself! Even if a state has zero outgoing ε arrows, its ε-closure is {q}, never empty.',
    quickQuiz: {
      question: 'If q0 has an ε-transition to q1, and q1 has an ε-transition to q2, what is ECLOSE(q0)?',
      options: ['A. {q1}', 'B. {q1, q2}', 'C. {q0, q1, q2}', 'D. {q2}'],
      correctIdx: 2,
      explanation:
        'Correct! ECLOSE(q0) includes q0 itself, plus q1 (1 step), plus q2 (transitively 2 steps): {q0, q1, q2}.',
    },
    relatedLabTab: 'conversion',
    relatedLabLabel: 'Test ε-NFA Conversion',
  },
  {
    id: 'ch-subset',
    number: 6,
    title: 'Subset Construction (Powerset Algorithm): NFA → DFA',
    badge: 'Core Algorithmic Bridge',
    category: 'Conversions',
    difficulty: 'Intermediate',
    summary:
      'The Powerset Construction algorithm converts any NFA with N states into an equivalent deterministic DFA with at most 2^N states.',
    conceptIntro:
      'Because an NFA can be in multiple states simultaneously, we create DFA states where each DFA state represents a SUBSET of original NFA states. By tracking all possible active states as a single composite state, we eliminate nondeterminism entirely.',
    mathNotation: 'Q_DFA ⊆ P(Q_NFA) = 2^{Q_NFA}',
    realWorldAnalogy:
      'Tracking multiple squad members on a battlefield radar: Instead of monitoring soldier A and soldier B independently, the command center groups them as "Squad Alpha = {Soldier A, Soldier B}".',
    keyPrinciples: [
      'Initial DFA State: The ε-closure of the NFA start state: S0 = ECLOSE({q0}).',
      'Composite State Moves: For each discovered subset S and input symbol a: Move(S, a) = ECLOSE( ⋃_{p ∈ S} δ(p, a) ).',
      'Accepting Condition: Any DFA subset containing at least ONE original NFA accepting state becomes an accepting DFA state.',
      'Dead State Handling: If a subset yields ∅ on a symbol, it points to the empty/trap state { }.',
    ],
    detailedSteps: [
      {
        stepNumber: 1,
        title: 'Compute Initial State',
        explanation: 'Calculate S0 = ECLOSE({q0}). Add S0 as the first unvisited state in our DFA table.',
      },
      {
        stepNumber: 2,
        title: 'Pick an Unvisited DFA State (S)',
        explanation: 'Select any subset S from our DFA states list that has not yet been processed.',
      },
      {
        stepNumber: 3,
        title: 'Compute Transitions for All Alphabet Symbols',
        explanation:
          'For each symbol a ∈ Σ, compute Next_S = ECLOSE( ⋃_{q ∈ S} δ(q, a) ). Record transition S --a--> Next_S.',
      },
      {
        stepNumber: 4,
        title: 'Discover New States',
        explanation: 'If Next_S has never been seen before, add it to the list of DFA states to visit.',
      },
      {
        stepNumber: 5,
        title: 'Repeat Until Fixed Point & Mark Final States',
        explanation:
          'Repeat Steps 2-4 until no unvisited subsets remain. Any subset S where S ∩ F_NFA ≠ ∅ is marked as a Final State.',
      },
    ],
    sampleExecutionTrace: {
      sampleString: '01',
      steps: [
        {
          stepNum: 1,
          readChar: 'Start',
          fromState: '∅',
          toState: '{q0}',
          actionDescription: 'Initial DFA state formed from NFA start state {q0}.',
          whyDecision: 'ECLOSE(q0) = {q0}.',
        },
        {
          stepNum: 2,
          readChar: '0',
          fromState: '{q0}',
          toState: '{q0, q1}',
          actionDescription: 'In NFA, q0 on 0 goes to q0 and q1. Composite DFA state is {q0, q1}.',
          whyDecision: 'δ({q0}, 0) = {q0, q1}.',
        },
        {
          stepNum: 3,
          readChar: '1',
          fromState: '{q0, q1}',
          toState: '{q0, q2}',
          actionDescription: 'From {q0, q1} on 1: q0 goes to q0, q1 goes to q2. Result: {q0, q2}.',
          whyDecision: 'δ({q0, q1}, 1) = {q0, q2}.',
        },
      ],
      verdict: 'ACCEPTED',
      verdictExplanation:
        'State {q0, q2} contains NFA accepting state q2. DFA accepts the string 01!',
    },
    concreteExample: {
      title: 'Subset Construction on 3-State NFA',
      description: 'NFA states {q0, q1, q2} converted into DFA with subsets: {q0}, {q0,q1}, {q0,q2}.',
      sampleAccepted: ['01', '001', '101', '1101'],
      sampleRejected: ['0', '1', '10', '00'],
    },
    commonPitfalls:
      'Worst-case state explosion: An NFA with N states can produce a DFA with up to 2^N states. However, in practice, only reachable subsets are kept, keeping the resulting DFA compact.',
    quickQuiz: {
      question: 'When is a subset state {q1, q3, q5} marked as an ACCEPTING state in the converted DFA?',
      options: [
        'A. Only if ALL states q1, q3, and q5 were accepting states in the original NFA.',
        'B. If at least ONE state among q1, q3, or q5 was an accepting state in the original NFA.',
        'C. Only if q1 was the initial start state.',
        'D. Only if the subset contains an even number of states.',
      ],
      correctIdx: 1,
      explanation:
        'Correct! If any branch of the NFA lands in an accepting state, the NFA accepts. Therefore, any composite subset containing at least one original accepting state is an accepting DFA state.',
    },
    relatedLabTab: 'conversion',
    relatedLabLabel: 'Run Subset Construction Lab',
  },
  {
    id: 'ch-minimization',
    number: 7,
    title: "Hopcroft's DFA Minimization: Table-Filling & Partitions",
    badge: 'State Optimization',
    category: 'Optimization',
    difficulty: 'Intermediate',
    summary:
      'DFA Minimization merges equivalent, redundant states to produce the unique minimum-state DFA recognizing the exact same language (Myhill-Nerode Theorem).',
    conceptIntro:
      'Why waste memory and silicon on redundant states? If two states behave identically for every conceivable input suffix, they are indistinguishable and can be collapsed into a single state. Hopcroft\'s algorithm efficiently partitions states until all distinguishable pairs are separated.',
    mathNotation: 'P_0 = { F, Q \\ F } → Refine until P_{k+1} = P_k',
    realWorldAnalogy:
      'Simplifying algebraic fractions: 4/8 is mathematically accurate, but 1/2 is the canonical simplest form. Minimization produces the canonical irreducible automaton.',
    keyPrinciples: [
      'Myhill-Nerode Equivalence: Two states p, q are equivalent if for all strings w ∈ Σ*, δ*(p, w) ∈ F ⇔ δ*(q, w) ∈ F.',
      'Initial Partition P0: Split states into two primary groups: Accepting states (F) and Non-accepting states (Q \\ F).',
      'Split Condition: A group G splits on symbol a if its members transition to two different partition groups on a.',
      'Uniqueness: The minimal DFA for any regular language is mathematically unique up to state renaming (isomorphism).',
    ],
    detailedSteps: [
      {
        stepNumber: 1,
        title: 'Prune Unreachable States',
        explanation:
          'Run BFS/DFS from the start state q0. Any state that cannot be reached from q0 is deleted immediately.',
        tip: 'Unreachable states can skew partition refinement if not eliminated first.',
      },
      {
        stepNumber: 2,
        title: 'Construct Initial Partition (P0)',
        explanation: 'Create two groups: Group 1 = Non-accepting (Q \\ F); Group 2 = Accepting (F).',
      },
      {
        stepNumber: 3,
        title: 'Iterative Partition Refinement',
        explanation:
          'For each group G in current partition and each symbol a ∈ Σ, check if all members of G transition to the same group. If not, split G into sub-groups.',
      },
      {
        stepNumber: 4,
        title: 'Halt on Stability',
        explanation: 'When a full pass over all symbols produces zero splits (Pk+1 == Pk), stop.',
      },
      {
        stepNumber: 5,
        title: 'Construct Minimal Machine',
        explanation:
          'Each partition group becomes a single state in the new minimal DFA. Re-link transitions accordingly.',
      },
    ],
    sampleExecutionTrace: {
      sampleString: '10',
      steps: [
        {
          stepNum: 1,
          readChar: 'Partition P0',
          fromState: 'All States',
          toState: '{q0, q1, q2} | {q3, q4}',
          actionDescription: 'States split into Non-Accepting {q0, q1, q2} and Accepting {q3, q4}.',
          whyDecision: 'P0 = { Q \\ F, F }.',
        },
        {
          stepNum: 2,
          readChar: 'Refine on 0',
          fromState: '{q0, q1, q2}',
          toState: '{q0} | {q1, q2}',
          actionDescription: 'q0 transitions to {q1, q2}, while q1, q2 transition elsewhere. Group splits.',
          whyDecision: 'Distinct behavior on symbol 0.',
        },
        {
          stepNum: 3,
          readChar: 'Check {q3, q4}',
          fromState: '{q3, q4}',
          toState: '{q3, q4} (Merged)',
          actionDescription: 'States q3 and q4 transition to identical groups on both 0 and 1. They merge!',
          whyDecision: 'q3 and q4 are proven indistinguishable.',
        },
      ],
      verdict: 'ACCEPTED',
      verdictExplanation: 'States q3 and q4 collapse into a single compound state [q3,q4].',
    },
    concreteExample: {
      title: 'Minimizing a 5-State DFA to 3 States',
      description: 'Original DFA had 5 states. States q1 and q2 merge, and q3 and q4 merge.',
      sampleAccepted: ['10', '010', '110'],
      sampleRejected: ['1', '0', '00'],
    },
    commonPitfalls:
      'Never attempt to apply Hopcroft\'s minimization directly to an NFA! Hopcroft relies on deterministic single-path transitions. Always convert NFA to DFA first, then minimize.',
    quickQuiz: {
      question: 'Why are accepting states (F) and non-accepting states (Q \\ F) placed in different groups in P0?',
      options: [
        'A. Because accepting states have higher numerical IDs.',
        'B. Because they are immediately distinguished by the empty string ε (one accepts, the other rejects).',
        'C. Because non-accepting states cannot have outgoing transitions.',
        'D. To make the alphabet size smaller.',
      ],
      correctIdx: 1,
      explanation:
        'Correct! If w = ε, feeding w to an accepting state yields ACCEPT, but feeding w to a non-accepting state yields REJECT. Thus they are fundamentally distinguishable by string length 0.',
    },
    relatedLabTab: 'minimization',
    relatedLabLabel: 'Open Minimization Lab',
  },
  {
    id: 'ch-transducers',
    number: 8,
    title: 'Transducers: Moore & Mealy State Machines',
    badge: 'Digital Circuit Control',
    category: 'Finite Automata',
    difficulty: 'Intermediate',
    summary:
      'Unlike standard automata that merely accept or reject, Transducers emit output characters as they run, making them the standard architecture for digital circuits and controllers.',
    conceptIntro:
      'In digital logic design and embedded firmware, computers must generate output signals (like motor speeds, audio tones, or encrypted bytes). Finite State Transducers map an input sequence to an output sequence.',
    mathNotation: 'Moore: λ: Q → Δ  |  Mealy: λ: Q × Σ → Δ',
    realWorldAnalogy:
      'Moore: An elevator chime that dings whenever you arrive on Floor 3 (output is bound to the state/floor). Mealy: A turnstile mechanical click that sounds while you push through the arm (output is bound to the transition action).',
    keyPrinciples: [
      'Moore Machine: Output symbol λ(q) is attached directly to the STATE. Total output length = |input| + 1.',
      'Mealy Machine: Output symbol λ(q, a) is attached to the TRANSITION arrow. Total output length = |input|.',
      'Mealy Responsiveness: Mealy machines react one clock cycle earlier than Moore machines because output changes with inputs immediately.',
      'Equivalence: Any Moore machine can be converted into an equivalent Mealy machine and vice-versa.',
    ],
    detailedSteps: [
      {
        stepNumber: 1,
        title: 'Identify Inputs and Outputs',
        explanation: 'Define input alphabet Σ (e.g. {0, 1}) and output alphabet Δ (e.g. {A, B} or {0, 1}).',
      },
      {
        stepNumber: 2,
        title: 'Choose Moore vs Mealy Architecture',
        explanation:
          'If output depends only on memory state, choose Moore. If output depends on both current state and incoming input, choose Mealy.',
      },
      {
        stepNumber: 3,
        title: 'Assign State Outputs (Moore) or Edge Outputs (Mealy)',
        explanation:
          'For Moore: annotate each state node with "State / Output" (e.g. q0 / 0). For Mealy: annotate transitions with "input / output" (e.g. 1 / Z).',
      },
      {
        stepNumber: 4,
        title: 'Simulation & Trace',
        explanation: 'Feed input characters and emit the generated output stream step-by-step.',
      },
    ],
    sampleExecutionTrace: {
      sampleString: '1010',
      steps: [
        {
          stepNum: 1,
          readChar: '1',
          fromState: 'q0',
          toState: 'q0',
          actionDescription: "Mealy 1's Complement: Read bit 1, emit inverted bit 0.",
          whyDecision: 'λ(q0, 1) = 0.',
        },
        {
          stepNum: 2,
          readChar: '0',
          fromState: 'q0',
          toState: 'q0',
          actionDescription: "Read bit 0, emit inverted bit 1.",
          whyDecision: 'λ(q0, 0) = 1.',
        },
        {
          stepNum: 3,
          readChar: '1',
          fromState: 'q0',
          toState: 'q0',
          actionDescription: "Read bit 1, emit inverted bit 0.",
          whyDecision: 'λ(q0, 1) = 0.',
        },
        {
          stepNum: 4,
          readChar: '0',
          fromState: 'q0',
          toState: 'q0',
          actionDescription: "Read bit 0, emit inverted bit 1.",
          whyDecision: 'λ(q0, 0) = 1.',
        },
      ],
      verdict: 'ACCEPTED',
      verdictExplanation: 'Input 1010 produced inverted output sequence 0101.',
    },
    concreteExample: {
      title: "Binary 1's Complement Inverter",
      description: 'Single-state Mealy machine: on input 0 outputs 1; on input 1 outputs 0.',
      sampleAccepted: ['Input: 1100 → Output: 0011', 'Input: 10101 → Output: 01010'],
      sampleRejected: ['All valid alphabet strings produce an output'],
    },
    commonPitfalls:
      'Output length mismatch: A Moore machine outputs a symbol from the start state before any character is read! Thus for input length N, Moore produces N+1 outputs, whereas Mealy produces exactly N outputs.',
    quickQuiz: {
      question: 'For an input string of length 5, how many output characters will a Moore machine emit?',
      options: ['A. Exactly 4', 'B. Exactly 5', 'C. Exactly 6', 'D. It depends on the number of states'],
      correctIdx: 2,
      explanation:
        'Correct! A Moore machine outputs a character from the start state at time t=0 before consuming any input, followed by 1 output for each of the 5 input symbols. Total = 5 + 1 = 6.',
    },
    relatedLabTab: 'conversion',
    relatedLabLabel: 'Moore ⇄ Mealy Converter',
  },
  {
    id: 'ch-regex',
    number: 9,
    title: "Regular Expressions & Thompson's Construction",
    badge: 'Algebraic Languages',
    category: 'Conversions',
    difficulty: 'Intermediate',
    summary:
      'Regular Expressions (Regex) provide an algebraic formula to describe regular languages, compiling into automata via Thompson’s Construction algorithm.',
    conceptIntro:
      'Kleene\'s Theorem is one of the pillars of computer science: it proves that Regular Expressions, DFAs, and NFAs are all mathematically equivalent. Any language describable by a regex can be built as a finite automaton, and vice-versa.',
    mathNotation: 'R = a | (R1 · R2) | (R1 ∪ R2) | R1*',
    realWorldAnalogy:
      'Lego building blocks: You have elementary bricks (single characters like \'a\'). You have three connection rules: stacking bricks in a row (concatenation), choosing between two colored bricks (union), and repeating identical bricks infinitely (Kleene star).',
    keyPrinciples: [
      'Base Symbol (a): Two states connected by a single transition labeled \'a\'.',
      'Concatenation (AB): Connect the final state of machine A to the start state of machine B using an ε transition.',
      'Union / OR (A|B): Create a new start state that ε-branches to both A and B, merging their outputs to a shared new final state.',
      'Kleene Star (A*): Create a bypass ε-transition for zero occurrences, plus an ε-loopback from end to start for repetitions.',
    ],
    detailedSteps: [
      {
        stepNumber: 1,
        title: 'Parse Regex Syntax Tree',
        explanation: 'Convert infix regex into an abstract syntax tree adhering to operator precedence (* > · > |).',
      },
      {
        stepNumber: 2,
        title: 'Build Base Character Automata',
        explanation: 'Create minimal 2-state fragments for each literal symbol.',
      },
      {
        stepNumber: 3,
        title: 'Apply Inductive Thompson Templates',
        explanation:
          'Wrap fragments inside standard Thompson gadgets for Concatenation, Union, or Star using ε-transitions.',
      },
      {
        stepNumber: 4,
        title: 'Connect to Unified Start & Final States',
        explanation:
          'Ensure the final ε-NFA has exactly ONE unique initial state and ONE unique final accepting state.',
      },
    ],
    sampleExecutionTrace: {
      sampleString: 'abb',
      steps: [
        {
          stepNum: 1,
          readChar: 'Template: a',
          fromState: 'q0',
          toState: 'q1',
          actionDescription: 'Literal fragment consumes \'a\'.',
          whyDecision: 'Base symbol transition.',
        },
        {
          stepNum: 2,
          readChar: 'Concatenation (·)',
          fromState: 'q1',
          toState: 'q2',
          actionDescription: 'Bridge ε transition connects fragment a to fragment b.',
          whyDecision: 'Thompson concatenation rule.',
        },
        {
          stepNum: 3,
          readChar: 'Template: b',
          fromState: 'q2',
          toState: 'q3',
          actionDescription: 'Literal fragment consumes first \'b\'.',
          whyDecision: 'Base symbol transition.',
        },
        {
          stepNum: 4,
          readChar: 'Concatenation to second b',
          fromState: 'q3',
          toState: 'q4',
          actionDescription: 'Second \'b\' consumed, reaching unified final state q4.',
          whyDecision: 'All regex tokens matched.',
        },
      ],
      verdict: 'ACCEPTED',
      verdictExplanation: 'Matches the exact regular expression pattern "abb".',
    },
    concreteExample: {
      title: 'Regex (0|1)*01',
      description: 'Matches all binary strings that end with the suffix "01".',
      sampleAccepted: ['01', '001', '101', '11001', '0101'],
      sampleRejected: ['ε', '0', '1', '10', '00'],
    },
    commonPitfalls:
      'Operator precedence confusion: In regex, * has higher precedence than concatenation, which has higher precedence than union (|). Thus ab* means a followed by (b*), NOT (ab)*!',
    quickQuiz: {
      question: 'Which of the following strings is NOT matched by the regex (a|b)*a?',
      options: ['A. a', 'B. ba', 'C. abba', 'D. ab'],
      correctIdx: 3,
      explanation:
        'Correct! The regex (a|b)*a specifies that the string can have any combination of a and b, but it MUST end with an \'a\'. The string "ab" ends with \'b\', so it is rejected.',
    },
    relatedLabTab: 'regex',
    relatedLabLabel: 'Open 4-Stage Regex Lab',
  },
  {
    id: 'ch-state-elim',
    number: 10,
    title: 'State Elimination Method: DFA to Regular Expression',
    badge: 'Reverse Engineering',
    category: 'Conversions',
    difficulty: 'Intermediate',
    summary:
      'The State Elimination algorithm converts any DFA into an equivalent Regular Expression by eliminating internal states one by one while preserving path regexes.',
    conceptIntro:
      'We know how to compile Regex into Automata, but how do we reverse the process to extract a regular expression from an existing DFA diagram? The State Elimination method treats transitions as generalized regular expressions, removing states until only start and accept remain.',
    mathNotation: 'R_{ik}^{new} = R_{ik} \\cup (R_{iq} \\cdot (R_{qq})^* \\cdot R_{qk})',
    realWorldAnalogy:
      'Solving a system of linear equations by Gaussian Elimination: You eliminate variables x, y, z one at a time by substitution until only the final answer remains.',
    keyPrinciples: [
      'Generalized NFA (GNFA): Transitions are labeled with full regular expressions instead of single characters.',
      'Unique Start & Accept: Add a new start state q_start with an ε transition to q0, and ε transitions from all final states to a new unique q_accept.',
      'Bypass Formula: When eliminating state q, any path from state i to state k through q is replaced with: R_ik | (R_iq · (R_qq)* · R_qk).',
      'Termination: When all intermediate states are eliminated, the label on the single transition from q_start to q_accept is the final Regular Expression!',
    ],
    detailedSteps: [
      {
        stepNumber: 1,
        title: 'Normalize into a GNFA',
        explanation:
          'Add a new single start state with ε arrow to original start, and new single accept state with ε arrows from all original final states.',
      },
      {
        stepNumber: 2,
        title: 'Pick an Intermediate State to Eliminate (q)',
        explanation: 'Choose any state q other than the new start and new accept states.',
      },
      {
        stepNumber: 3,
        title: 'Update All Predecessor-Successor Pairs',
        explanation:
          'For every incoming state i and outgoing state k, replace the direct edge with: R_ik | R_iq (R_qq)* R_qk.',
      },
      {
        stepNumber: 4,
        title: 'Remove State q and Repeat',
        explanation:
          'Delete state q and all its incident edges. Repeat until only q_start and q_accept remain.',
      },
    ],
    sampleExecutionTrace: {
      sampleString: 'Formula Reduction',
      steps: [
        {
          stepNum: 1,
          readChar: 'Identify q1',
          fromState: 'q0',
          toState: 'q2 via q1',
          actionDescription: 'Incoming edge R_01 = a, self loop R_11 = b, outgoing edge R_12 = c.',
          whyDecision: 'Path through q1.',
        },
        {
          stepNum: 2,
          readChar: 'Apply Bypass',
          fromState: 'q0',
          toState: 'q2',
          actionDescription: 'Bypass formula yields composite expression: a · b* · c.',
          whyDecision: 'R_01 · (R_11)* · R_12.',
        },
        {
          stepNum: 3,
          readChar: 'Eliminate q1',
          fromState: 'Diagram',
          toState: 'Reduced GNFA',
          actionDescription: 'State q1 deleted. Direct edge q0 -> q2 now labeled (a b* c).',
          whyDecision: 'State count decreased by 1.',
        },
      ],
      verdict: 'ACCEPTED',
      verdictExplanation: 'Resulting regular expression exactly captures all paths through eliminated state.',
    },
    concreteExample: {
      title: 'Eliminating Mid-State in 2-State Loop',
      description: 'q0 -> 0 -> q1; q1 -> 1 -> q0. Eliminating q1 gives regular expression (01)* on q0.',
      sampleAccepted: ['(01)* matches ε, 01, 0101, 010101'],
      sampleRejected: ['0, 1, 011'],
    },
    commonPitfalls:
      'Do not forget the self-loop term (R_qq)*! If the state being eliminated has a loop back to itself, failing to include the Kleene star will miss an infinite family of valid strings.',
    quickQuiz: {
      question: 'When state q is eliminated, what happens to paths that looped from q back to q?',
      options: [
        'A. They are discarded because loops are not allowed in regular expressions.',
        'B. They are wrapped in a Kleene star: (R_qq)*.',
        'C. They are replaced with an empty string ε unconditionally.',
        'D. They cause the algorithm to fail.',
      ],
      correctIdx: 1,
      explanation:
        'Correct! Any transitions from q back to itself can be traversed 0, 1, 2, or more times before leaving q, which corresponds precisely to the Kleene star operation (R_qq)*.',
    },
    relatedLabTab: 'regex',
    relatedLabLabel: 'Inspect State Elimination',
  },
  {
    id: 'ch-pumping',
    number: 11,
    title: 'The Pumping Lemma for Regular Languages',
    badge: 'Proving Non-Regularity',
    category: 'Foundation',
    difficulty: 'Advanced',
    summary:
      'The Pumping Lemma uses the Pigeonhole Principle to prove that certain languages (like {0^n 1^n}) CANNOT be recognized by any finite automaton.',
    conceptIntro:
      'How do we know when a problem is impossible for a Finite Automaton to solve? Because a finite automaton has a limited number of states p, any string with length ≥ p MUST revisit at least one state twice (a loop). If a language requires unbounded counting, the loop breaks the required pattern!',
    mathNotation: 'w = xyz,  |y| ≥ 1,  |xy| ≤ p,  ∀i ≥ 0 : xy^i z ∈ L',
    realWorldAnalogy:
      'The Pigeonhole Principle: If you have 5 pigeonholes and 6 pigeons, at least one hole must contain more than one pigeon. Similarly, if an automaton has p states and reads p+1 symbols, it MUST repeat a state.',
    keyPrinciples: [
      'Pumping Length p: An integer guaranteed to exist for every regular language.',
      'Decomposition: Any string w ∈ L with |w| ≥ p can be split into three parts: w = x y z.',
      'Conditions: 1) |y| ≥ 1 (middle part is non-empty); 2) |xy| ≤ p (loop occurs early).',
      'Pumping Property: For ALL integers i ≥ 0, the pumped string x y^i z must also belong to L.',
      'Proof by Contradiction: If we can find a single string w that fails to pump for any choice of y, the language CANNOT be regular!',
    ],
    detailedSteps: [
      {
        stepNumber: 1,
        title: 'Assume L is Regular (for Contradiction)',
        explanation: 'Assume there exists a DFA with pumping length p recognizing language L.',
      },
      {
        stepNumber: 2,
        title: 'Choose a Crafty String w ∈ L',
        explanation: 'Select a string defined in terms of p, such that |w| ≥ p (e.g. w = 0^p 1^p).',
      },
      {
        stepNumber: 3,
        title: 'Analyze the Decomposition w = xyz',
        explanation:
          'Since |xy| ≤ p, the substring y must consist entirely of the first character type (e.g. y = 0^k where k ≥ 1).',
      },
      {
        stepNumber: 4,
        title: 'Pump with i ≠ 1 and Reveal Contradiction',
        explanation:
          'Consider i = 2 (xy^2z) or i = 0 (xz). The number of 0s no longer matches the number of 1s! The pumped string ∉ L. Contradiction! L is not regular.',
      },
    ],
    sampleExecutionTrace: {
      sampleString: '0^p 1^p',
      steps: [
        {
          stepNum: 1,
          readChar: 'Select w',
          fromState: 'Assumption',
          toState: 'w = 0^p 1^p',
          actionDescription: 'Length |w| = 2p ≥ p. Belongs to L = {0^n 1^n}.',
          whyDecision: 'Valid test candidate.',
        },
        {
          stepNum: 2,
          readChar: 'Locate y',
          fromState: 'Constraint',
          toState: 'y = 0^k (k ≥ 1)',
          actionDescription: 'Because |xy| ≤ p, y lies entirely within the leading 0s.',
          whyDecision: 'Pumping lemma condition 2.',
        },
        {
          stepNum: 3,
          readChar: 'Pump i = 2',
          fromState: 'xy^2z',
          toState: '0^{p+k} 1^p',
          actionDescription: 'Number of 0s is now p+k, but number of 1s is still p.',
          whyDecision: '0^{p+k} 1^p ∉ L because p+k ≠ p.',
        },
      ],
      verdict: 'REJECTED',
      verdictExplanation: 'Contradiction proven! {0^n 1^n} cannot be recognized by any finite automaton.',
    },
    concreteExample: {
      title: 'Famous Non-Regular Languages',
      description: 'Languages requiring unbounded memory or balanced counting.',
      sampleAccepted: ['Not applicable (proof technique)'],
      sampleRejected: ['L = {0^n 1^n | n ≥ 0}', 'L = {w w^R | palindromes}', 'L = {a^p | p is prime}'],
    },
    commonPitfalls:
      'The Pumping Lemma CANNOT be used to prove that a language IS regular! It is strictly an adversarial tool used to prove that a language is NOT regular by contradiction.',
    quickQuiz: {
      question: 'Can the Pumping Lemma be used to prove that a language is regular?',
      options: [
        'A. Yes, if you can pump every string successfully, the language is proven regular.',
        'B. No, the pumping lemma is only a necessary condition, not a sufficient one. It only proves non-regularity.',
        'C. Yes, but only for finite languages.',
        'D. Only if the alphabet has at most 2 symbols.',
      ],
      correctIdx: 1,
      explanation:
        'Correct! Some non-regular languages can also satisfy the pumping lemma conditions. It is a one-way test: failing it proves non-regularity; passing it proves nothing.',
    },
    relatedLabTab: 'learn',
    relatedLabLabel: 'Explore Language Classes',
  },
  {
    id: 'ch-cfg',
    number: 12,
    title: 'Context-Free Grammars (CFG) & Parse Trees',
    badge: 'Grammars & Syntax',
    category: 'Higher Models',
    difficulty: 'Intermediate',
    summary:
      'Context-Free Grammars (CFGs) use recursive production rules to generate nested hierarchical languages like programming code blocks and arithmetic expressions.',
    conceptIntro:
      'How does a JavaScript or Python compiler verify your code syntax? Regular expressions cannot handle nested curly braces {} or balanced parentheses. Context-Free Grammars introduce non-terminal variables that expand recursively to define syntax trees.',
    mathNotation: 'G = (V, Σ, R, S) where R: V → (V ∪ Σ)*',
    realWorldAnalogy:
      'English sentence syntax: A Sentence → NounPhrase + VerbPhrase. A NounPhrase → Adjective + Noun. Variables represent grammar parts; terminals are the actual spoken words.',
    keyPrinciples: [
      'Variables (V): Non-terminal placeholder symbols, usually uppercase: {S, A, B}.',
      'Terminals (Σ): The final alphabet characters appearing in strings: {a, b, (, )}.',
      'Start Variable (S): The top-level symbol where all derivations commence: S ∈ V.',
      'Productions (R): Rewrite rules specifying how variables expand: S → 0S1 | ε.',
      'Parse Tree: A hierarchical tree where root is S, internal nodes are variables, and leaves are terminals.',
    ],
    detailedSteps: [
      {
        stepNumber: 1,
        title: 'Identify Variables and Terminals',
        explanation: 'Terminals are literal characters. Variables represent syntactic sub-structures.',
      },
      {
        stepNumber: 2,
        title: 'Write Recursive Production Rules',
        explanation:
          'To generate balanced pairs like 0^n 1^n, write S → 0S1. For base case, add S → ε.',
      },
      {
        stepNumber: 3,
        title: 'Perform Leftmost Derivation',
        explanation:
          'At each step, replace the leftmost non-terminal variable with one of its production bodies.',
      },
      {
        stepNumber: 4,
        title: 'Construct the SVG Parse Tree',
        explanation:
          'Visualize parent-child derivations to verify syntax structure and operator precedence.',
      },
    ],
    sampleExecutionTrace: {
      sampleString: '0011',
      steps: [
        {
          stepNum: 1,
          readChar: 'Derivation Step 1',
          fromState: 'S',
          toState: '0S1',
          actionDescription: 'Apply production rule S → 0S1.',
          whyDecision: 'Leftmost variable S expanded.',
        },
        {
          stepNum: 2,
          readChar: 'Derivation Step 2',
          fromState: '0S1',
          toState: '00S11',
          actionDescription: 'Apply production rule S → 0S1 again.',
          whyDecision: 'Produces second pair of 0 and 1.',
        },
        {
          stepNum: 3,
          readChar: 'Derivation Step 3',
          fromState: '00S11',
          toState: '0011',
          actionDescription: 'Apply base case production rule S → ε.',
          whyDecision: 'All variables eliminated; pure terminals remain.',
        },
      ],
      verdict: 'ACCEPTED',
      verdictExplanation: 'Valid terminal string 0011 derived in 3 steps from start variable S.',
    },
    concreteExample: {
      title: 'Balanced Parentheses Grammar',
      description: 'S → (S) | SS | ε generates all well-formed parentheses strings.',
      sampleAccepted: ['()', '(())', '()()', '((()()))', 'ε'],
      sampleRejected: ['(', ')', ')(', '(()', '())('],
    },
    commonPitfalls:
      'Ambiguity: A grammar is ambiguous if a single string has two DIFFERENT parse trees (different derivations). In compilers, ambiguity is dangerous because arithmetic expressions like 2 + 3 * 4 could evaluate in different orders.',
    quickQuiz: {
      question: 'What is the base case production needed in the grammar S → aSb to stop infinite recursion?',
      options: ['A. S → SS', 'B. S → a', 'C. S → ε', 'D. S → b'],
      correctIdx: 2,
      explanation:
        'Correct! The rule S → ε allows the recursive variable S to terminate into an empty string, yielding balanced strings like a^n b^n.',
    },
    relatedLabTab: 'cfg',
    relatedLabLabel: 'Open CFG & Parse Tree Lab',
  },
  {
    id: 'ch-pda',
    number: 13,
    title: 'Pushdown Automata (PDA): The LIFO Stack Engine',
    badge: 'Stack Memory',
    category: 'Higher Models',
    difficulty: 'Advanced',
    summary:
      'A Pushdown Automaton augments a finite state machine with an unbounded Last-In, First-Out (LIFO) stack, enabling recognition of Context-Free Languages.',
    conceptIntro:
      'Finite automata fail at counting beyond their fixed number of states. By connecting a simple stack where characters can be PUSHed and POPped, a PDA can match opening and closing brackets, count balanced characters, and parse programming languages.',
    mathNotation: 'M = (Q, Σ, Γ, δ, q0, Z0, F)',
    realWorldAnalogy:
      'A spring-loaded cafeteria plate dispenser: You can push clean plates onto the top of the stack, and you can only remove the top plate. This allows you to match items in reverse order (LIFO).',
    keyPrinciples: [
      'Stack Alphabet (Γ): The set of allowed symbols stored on the stack (e.g. {Z0, 0, 1}).',
      'Transition Signature: δ(current_state, input_char, stack_top) → (next_state, push_symbols).',
      'Stack Actions: 1) Push (write new symbol on top); 2) Pop (remove top symbol using ε); 3) Replace / No-op.',
      'Acceptance Modes: 1) Acceptance by Final State (q ∈ F); 2) Acceptance by Empty Stack (stack is completely empty).',
    ],
    detailedSteps: [
      {
        stepNumber: 1,
        title: 'Initialize Stack with Bottom Marker',
        explanation: 'The stack begins containing initial symbol Z0 to detect when the stack is empty.',
      },
      {
        stepNumber: 2,
        title: 'Push Symbols during First Phase',
        explanation: 'For every \'0\' read from the input, push a marker symbol \'X\' onto the stack.',
      },
      {
        stepNumber: 3,
        title: 'Pop Symbols during Matching Phase',
        explanation:
          'When input shifts to \'1\', switch states and pop one \'X\' for every \'1\' consumed from the input.',
      },
      {
        stepNumber: 4,
        title: 'Verify Bottom Marker at EOF',
        explanation:
          'When input reaches end-of-string, pop Z0 or transition to accepting state if stack top is Z0.',
      },
    ],
    sampleExecutionTrace: {
      sampleString: '0011',
      steps: [
        {
          stepNum: 1,
          readChar: '0',
          fromState: 'q0 [Z0]',
          toState: 'q0 [0, Z0]',
          actionDescription: 'Read 0; pushed 0 onto stack.',
          whyDecision: 'Stack height = 2.',
        },
        {
          stepNum: 2,
          readChar: '0',
          fromState: 'q0 [0, Z0]',
          toState: 'q0 [0, 0, Z0]',
          actionDescription: 'Read 0; pushed second 0 onto stack.',
          whyDecision: 'Stack height = 3.',
        },
        {
          stepNum: 3,
          readChar: '1',
          fromState: 'q0 [0, 0, Z0]',
          toState: 'q1 [0, Z0]',
          actionDescription: 'Read 1; popped one 0 off the stack.',
          whyDecision: 'Matched first 1 with 0.',
        },
        {
          stepNum: 4,
          readChar: '1',
          fromState: 'q1 [0, Z0]',
          toState: 'q1 [Z0]',
          actionDescription: 'Read 1; popped second 0 off the stack.',
          whyDecision: 'Matched second 1 with 0. Stack back at Z0.',
        },
        {
          stepNum: 5,
          readChar: 'ε (EOF)',
          fromState: 'q1 [Z0]',
          toState: 'q_accept [Z0]',
          actionDescription: 'Reached end of input with Z0 on stack top. Transition to final state.',
          whyDecision: 'Balanced count verified!',
        },
      ],
      verdict: 'ACCEPTED',
      verdictExplanation: 'String 0011 has equal 0s and 1s; accepted cleanly by PDA!',
    },
    concreteExample: {
      title: 'Language L = {0^n 1^n | n ≥ 1}',
      description: 'Pushes a 0 for every 0; pops a 0 for every 1. Accepts if stack returns to Z0 at EOF.',
      sampleAccepted: ['01', '0011', '000111', '00001111'],
      sampleRejected: ['0', '1', '001', '011', '0101', '10'],
    },
    commonPitfalls:
      'Deterministic PDAs (DPDAs) are strictly LESS powerful than Non-deterministic PDAs (NPDAs)! For example, palindromes with no middle marker like w w^R require an NPDA to "guess" where the middle of the string is.',
    quickQuiz: {
      question: 'Why can a PDA recognize {0^n 1^n}, but a DFA cannot?',
      options: [
        'A. PDAs run faster than DFAs.',
        'B. PDAs have an auxiliary LIFO stack memory that can grow unbounded to count the number of 0s.',
        'C. PDAs have infinite states.',
        'D. PDAs can look ahead into future characters on the input tape.',
      ],
      correctIdx: 1,
      explanation:
        'Correct! A DFA has a fixed number of states and cannot count arbitrarily large values of n. A PDA pushes symbols onto an unbounded stack and matches them when popping.',
    },
    relatedLabTab: 'pda',
    relatedLabLabel: 'Open PDA Lab',
  },
  {
    id: 'ch-turing',
    number: 14,
    title: 'Turing Machines: Universal Computation & Chomsky Hierarchy',
    badge: 'Apex of Computation',
    category: 'Higher Models',
    difficulty: 'Advanced',
    summary:
      'Invented by Alan Turing in 1936, the Turing Machine features an infinite two-way tape and represents the universal theoretical model for all modern digital computers.',
    conceptIntro:
      'According to the Church-Turing Thesis, any computational algorithm that can be carried out mechanically by any modern computer, supercomputer, or programming language can be executed on a Turing Machine. It sits at the top of the Chomsky Hierarchy.',
    mathNotation: 'δ: Q × Γ → Q × Γ × {L, R, S}',
    realWorldAnalogy:
      'A mathematician working on an infinite roll of graph paper with a pencil and eraser: they can read the symbol in a box, erase and write a replacement, and slide their paper left or right.',
    keyPrinciples: [
      'Infinite Tape: Divided into discrete cells holding symbols from tape alphabet Γ, padded with blanks (␣).',
      'Read-Write Head: Can read the current cell, overwrite it with a new symbol, and move Left (L) or Right (R).',
      'Decidability: A language is Decidable (Turing-Decidable) if the machine halts and gives a verdict on EVERY input.',
      'Halting Problem: Proven by Alan Turing to be undecidable—no general algorithm can determine if an arbitrary program will halt or loop forever.',
    ],
    detailedSteps: [
      {
        stepNumber: 1,
        title: 'Initialize Tape with Input String',
        explanation: 'Input string w is written on tape cells 0 to |w|-1. All other cells contain blank (␣).',
      },
      {
        stepNumber: 2,
        title: 'Position Head at Leftmost Cell',
        explanation: 'The head starts at cell 0 in initial state q0.',
      },
      {
        stepNumber: 3,
        title: 'Execute Step: Read, Write, Move',
        explanation:
          'Consult transition rule δ(q, tape_symbol) = (q_next, write_symbol, direction L/R). Update state, write symbol, and shift head.',
      },
      {
        stepNumber: 4,
        title: 'Check for Halting States',
        explanation:
          'If the machine reaches q_accept -> string ACCEPTED. If it reaches q_reject -> string REJECTED. If neither, it continues running.',
        tip: 'Because of the infinite tape, a Turing Machine can loop indefinitely!',
      },
    ],
    sampleExecutionTrace: {
      sampleString: 'aabbcc',
      steps: [
        {
          stepNum: 1,
          readChar: 'Cross first a',
          fromState: 'q0',
          toState: 'q1',
          actionDescription: 'Head reads \'a\', overwrites with \'X\', moves Right.',
          whyDecision: 'Marking \'a\' to match with \'b\' and \'c\'.',
        },
        {
          stepNum: 2,
          readChar: 'Cross first b',
          fromState: 'q1',
          toState: 'q2',
          actionDescription: 'Scans past remaining \'a\'s, finds first \'b\', overwrites with \'Y\', moves Right.',
          whyDecision: 'Matched first \'b\'.',
        },
        {
          stepNum: 3,
          readChar: 'Cross first c',
          fromState: 'q2',
          toState: 'q3',
          actionDescription: 'Scans past remaining \'b\'s, finds first \'c\', overwrites with \'Z\', moves Left.',
          whyDecision: 'Matched first \'c\'. One complete triple accounted for.',
        },
        {
          stepNum: 4,
          readChar: 'Rewind to next a',
          fromState: 'q3',
          toState: 'q0',
          actionDescription: 'Moves head left until finding \'X\', steps right to repeat process on second \'a\'.',
          whyDecision: 'Iterative round robin.',
        },
      ],
      verdict: 'ACCEPTED',
      verdictExplanation: 'All a, b, c symbols matched evenly. Head reaches blank in q_accept!',
    },
    concreteExample: {
      title: 'Language L = {a^n b^n c^n | n ≥ 0}',
      description: 'Beyond context-free power! A PDA fails because a stack cannot count three distinct groups. A TM solves it easily.',
      sampleAccepted: ['abc', 'aabbcc', 'aaabbbccc', 'ε'],
      sampleRejected: ['ab', 'aabbc', 'abcc', 'ba'],
    },
    commonPitfalls:
      'Infinite Loops: Unlike DFAs which are guaranteed to halt after N steps, a Turing Machine can loop forever. In our simulator, we set a safety limit (e.g. 1000 steps) to prevent freezing.',
    quickQuiz: {
      question: 'What makes a language Decidable (as opposed to merely Turing-Recognizable)?',
      options: [
        'A. It can be simulated on a regular DFA.',
        'B. The Turing Machine is GUARANTEED to halt on EVERY input string (either accepting or rejecting).',
        'C. The alphabet size must be strictly binary {0, 1}.',
        'D. The tape must be finite.',
      ],
      correctIdx: 1,
      explanation:
        'Correct! A language is Decidable (Recursive) if a Turing Machine always halts with a definite Yes or No answer. If it may loop forever on strings not in the language, it is only Recognizable.',
    },
    relatedLabTab: 'turing',
    relatedLabLabel: 'Open Turing Machine Lab',
  },
];

type ChapterTab = 'concept' | 'steps' | 'trace' | 'examples' | 'quiz';

export const TutorialModal: React.FC<TutorialModalProps> = ({
  isOpen,
  onClose,
  onLoadStarterDfa,
  onNavigateTab,
}) => {
  const [activeChapterIdx, setActiveChapterIdx] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<ChapterTab>('concept');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [completedChapters, setCompletedChapters] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const currentChapter = CHAPTERS[activeChapterIdx];

  const filteredChapters = CHAPTERS.filter(c => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.badge.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || c.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', 'Foundation', 'Finite Automata', 'Conversions', 'Higher Models'];

  const handleSelectQuizAnswer = (optionIdx: number) => {
    setQuizAnswers(prev => ({ ...prev, [currentChapter.id]: optionIdx }));
    if (optionIdx === currentChapter.quickQuiz.correctIdx) {
      setCompletedChapters(prev => ({ ...prev, [currentChapter.id]: true }));
    }
  };

  const handleLabJump = (tab?: NavigationTab) => {
    if (tab && onNavigateTab) {
      onNavigateTab(tab);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-5xl h-[92vh] max-h-[820px] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30 shadow-md">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-['Outfit']">
                  Interactive Automata Theory Academy & Concept Guide
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 rounded-md border border-emerald-500/30">
                  14 Lessons
                </span>
                <span className="hidden sm:inline-flex px-2 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-300 rounded-md border border-indigo-500/30">
                  Beginner to Advanced
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Step-by-step curriculum with real-world analogies, algorithm procedures, live string traces, and interactive quizzes.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            title="Close Academy"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content Area: Left Chapter Browser + Right Interactive Curriculum */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Sidebar: Chapters Index */}
          <div className="w-full md:w-80 border-r border-slate-800 bg-slate-950/60 flex flex-col p-3 space-y-2.5 shrink-0">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search concepts, algorithms..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] scrollbar-none">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2 py-1 rounded-lg font-semibold shrink-0 transition-colors ${
                    categoryFilter === cat
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Progress Bar Summary */}
            <div className="px-2 py-1.5 bg-slate-900/60 rounded-xl border border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span>Academy Progress:</span>
              <span className="font-mono text-indigo-300 font-bold">
                {Object.keys(completedChapters).length} / {CHAPTERS.length} Done
              </span>
            </div>

            {/* Chapters Scrollable List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
              {filteredChapters.map(ch => {
                const isSelected = ch.id === currentChapter.id;
                const isCompleted = completedChapters[ch.id];
                return (
                  <button
                    key={ch.id}
                    onClick={() => {
                      const originalIdx = CHAPTERS.findIndex(c => c.id === ch.id);
                      setActiveChapterIdx(originalIdx);
                      setActiveTab('concept');
                    }}
                    className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-start gap-2.5 border ${
                      isSelected
                        ? 'bg-gradient-to-r from-indigo-950/80 to-purple-950/60 text-white border-indigo-500/80 shadow-md font-semibold'
                        : 'bg-slate-900/50 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border-slate-800/80'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : isCompleted
                          ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isCompleted ? <Check className="w-3 h-3" /> : ch.number}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium">{ch.title}</div>
                      <div className="flex items-center gap-1.5 text-[10px] opacity-75 font-mono">
                        <span>{ch.badge}</span>
                        <span>•</span>
                        <span
                          className={
                            ch.difficulty === 'Beginner'
                              ? 'text-emerald-400'
                              : ch.difficulty === 'Intermediate'
                              ? 'text-amber-400'
                              : 'text-purple-400'
                          }
                        >
                          {ch.difficulty}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Main Body: In-Depth Curriculum Engine */}
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-900/90">
            {/* Chapter Header Banner */}
            <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-950/40 space-y-2 shrink-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg">
                    Lesson {currentChapter.number} • {currentChapter.category}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-mono text-cyan-300 bg-cyan-950/40 border border-cyan-800/40 rounded-md">
                    {currentChapter.badge}
                  </span>
                </div>

                {currentChapter.relatedLabTab && onNavigateTab && (
                  <button
                    onClick={() => handleLabJump(currentChapter.relatedLabTab)}
                    className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 rounded-xl text-xs font-bold transition-all shadow-sm group"
                  >
                    <span>{currentChapter.relatedLabLabel || 'Try in Lab'}</span>
                    <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}
              </div>

              <h2 className="text-xl font-bold text-white font-['Outfit']">
                {currentChapter.title}
              </h2>

              <p className="text-slate-300 text-xs leading-relaxed font-normal">
                {currentChapter.summary}
              </p>

              {/* Segmented Chapter Tabs */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60 overflow-x-auto text-xs font-semibold">
                <button
                  onClick={() => setActiveTab('concept')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors shrink-0 ${
                    activeTab === 'concept'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Concept & Analogy</span>
                </button>

                <button
                  onClick={() => setActiveTab('steps')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors shrink-0 ${
                    activeTab === 'steps'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <ListOrdered className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Step-by-Step Procedure ({currentChapter.detailedSteps.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('trace')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors shrink-0 ${
                    activeTab === 'trace'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Live String Trace</span>
                </button>

                <button
                  onClick={() => setActiveTab('examples')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors shrink-0 ${
                    activeTab === 'examples'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Accepted vs Rejected</span>
                </button>

                <button
                  onClick={() => setActiveTab('quiz')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors shrink-0 ${
                    activeTab === 'quiz'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
                  <span>Practice Quiz</span>
                </button>
              </div>
            </div>

            {/* Scrollable Chapter Body Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-300 font-sans">
              {/* TAB 1: CONCEPT & ANALOGY */}
              {activeTab === 'concept' && (
                <div className="space-y-4 animate-in fade-in">
                  {/* Detailed Concept Box */}
                  <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2">
                    <h4 className="font-bold text-white flex items-center gap-2 text-xs">
                      <BookOpen className="w-4 h-4 text-cyan-400" />
                      <span>Deep Dive: The Core Idea</span>
                    </h4>
                    <p className="leading-relaxed text-slate-300">
                      {currentChapter.conceptIntro}
                    </p>

                    {currentChapter.mathNotation && (
                      <div className="mt-3 p-2.5 bg-slate-900 border border-slate-800 rounded-xl font-mono text-cyan-300 text-[11px] flex flex-wrap items-center justify-between gap-2">
                        <span className="text-slate-500 font-sans text-xs">Formal Mathematical Definition:</span>
                        <span className="font-bold text-xs">{currentChapter.mathNotation}</span>
                      </div>
                    )}
                  </div>

                  {/* Real-World Everyday Analogy */}
                  <div className="p-4 bg-amber-950/20 border border-amber-800/40 rounded-2xl space-y-2">
                    <h4 className="font-bold text-amber-300 flex items-center gap-2 text-xs">
                      <Lightbulb className="w-4 h-4 text-amber-400" />
                      <span>Intuitive Everyday Analogy (How to Picture It)</span>
                    </h4>
                    <p className="leading-relaxed text-amber-100/90 italic">
                      "{currentChapter.realWorldAnalogy}"
                    </p>
                  </div>

                  {/* Key Principles & Golden Rules */}
                  <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2.5">
                    <h4 className="font-bold text-slate-200 flex items-center gap-2 text-xs">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span>Fundamental Rules & Principles</span>
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {currentChapter.keyPrinciples.map((point, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{point}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: STEP-BY-STEP PROCEDURE */}
              {activeTab === 'steps' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between pb-1">
                    <h4 className="font-bold text-white text-xs flex items-center gap-2">
                      <ListOrdered className="w-4 h-4 text-cyan-400" />
                      <span>Algorithmic Execution Steps</span>
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      Follow these steps in order when designing or verifying this model
                    </span>
                  </div>

                  <div className="space-y-3">
                    {currentChapter.detailedSteps.map(step => (
                      <div
                        key={step.stepNumber}
                        className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-start gap-3 hover:border-slate-700 transition-colors"
                      >
                        <div className="w-7 h-7 rounded-xl bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 flex items-center justify-center font-bold font-mono shrink-0 text-xs">
                          {step.stepNumber}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="font-bold text-slate-200 text-xs">{step.title}</div>
                          <div className="text-slate-300 leading-relaxed">{step.explanation}</div>
                          {step.tip && (
                            <div className="mt-1.5 p-2 bg-indigo-950/30 rounded-xl border border-indigo-800/40 text-[11px] text-indigo-300 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
                              <span>{step.tip}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: LIVE STRING TRACE */}
              {activeTab === 'trace' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-slate-400">Sample String under Test:</div>
                      <div className="font-mono text-sm font-bold text-cyan-300">
                        w = "{currentChapter.sampleExecutionTrace.sampleString}"
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">Result:</span>
                      <span
                        className={`px-2.5 py-0.5 text-xs font-bold rounded-lg border ${
                          currentChapter.sampleExecutionTrace.verdict === 'ACCEPTED'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        }`}
                      >
                        {currentChapter.sampleExecutionTrace.verdict}
                      </span>
                    </div>
                  </div>

                  {/* Trace Table */}
                  <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/60">
                    <table className="w-full text-left font-mono text-[11px]">
                      <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px] uppercase font-semibold">
                        <tr>
                          <th className="py-2.5 px-3">Step</th>
                          <th className="py-2.5 px-3">Read Symbol</th>
                          <th className="py-2.5 px-3">From State</th>
                          <th className="py-2.5 px-3">Next State</th>
                          <th className="py-2.5 px-3">Micro-Action & Rationale</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {currentChapter.sampleExecutionTrace.steps.map(step => (
                          <tr key={step.stepNum} className="hover:bg-slate-900/40 transition-colors">
                            <td className="py-2.5 px-3 font-bold text-slate-400">{step.stepNum}</td>
                            <td className="py-2.5 px-3 text-cyan-300 font-bold">{step.readChar}</td>
                            <td className="py-2.5 px-3 text-indigo-300">{step.fromState}</td>
                            <td className="py-2.5 px-3 text-emerald-300 font-bold">{step.toState}</td>
                            <td className="py-2.5 px-3 font-sans text-xs">
                              <span className="text-slate-200">{step.actionDescription} </span>
                              <span className="text-slate-400 text-[11px] italic">({step.whyDecision})</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
                    <span className="font-bold text-white">Verdict Explanation: </span>
                    {currentChapter.sampleExecutionTrace.verdictExplanation}
                  </div>
                </div>
              )}

              {/* TAB 4: EXAMPLES & PITFALLS */}
              {activeTab === 'examples' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="p-4 bg-indigo-950/30 border border-indigo-800/40 rounded-2xl space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <h4 className="font-bold text-indigo-300 text-xs">
                        {currentChapter.concreteExample.title}
                      </h4>
                      <span className="text-[11px] text-indigo-400 font-mono">
                        {currentChapter.concreteExample.description}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 font-mono text-[11px]">
                      {/* Accepted Samples */}
                      <div className="p-3 bg-slate-950/80 rounded-xl border border-emerald-900/40 space-y-1.5">
                        <div className="text-emerald-400 font-bold flex items-center gap-1.5 font-sans text-xs">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Accepted Strings (In Language L):</span>
                        </div>
                        <div className="space-y-1 text-slate-300">
                          {currentChapter.concreteExample.sampleAccepted.map((s, idx) => (
                            <div key={idx} className="flex items-center gap-1.5">
                              <span className="text-emerald-500 font-bold">✓</span>
                              <span>{s}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Rejected Samples */}
                      <div className="p-3 bg-slate-950/80 rounded-xl border border-rose-900/40 space-y-1.5">
                        <div className="text-rose-400 font-bold flex items-center gap-1.5 font-sans text-xs">
                          <X className="w-4 h-4" />
                          <span>Rejected Strings (Not in L):</span>
                        </div>
                        <div className="space-y-1 text-slate-300">
                          {currentChapter.concreteExample.sampleRejected.map((s, idx) => (
                            <div key={idx} className="flex items-center gap-1.5">
                              <span className="text-rose-500 font-bold">✗</span>
                              <span>{s}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Common Pitfalls & Mistakes Box */}
                  <div className="p-4 bg-amber-950/30 border border-amber-800/40 rounded-2xl flex items-start gap-3 text-amber-200">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs">
                      <div className="font-bold text-amber-300">Common Beginner Mistake to Avoid on Exams:</div>
                      <div className="leading-relaxed text-amber-100/90">{currentChapter.commonPitfalls}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: PRACTICE QUIZ */}
              {activeTab === 'quiz' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-purple-400" />
                      <h4 className="font-bold text-white text-xs">Interactive Concept Check</h4>
                    </div>

                    <p className="text-slate-200 text-xs font-medium leading-relaxed">
                      {currentChapter.quickQuiz.question}
                    </p>

                    <div className="space-y-2 pt-1">
                      {currentChapter.quickQuiz.options.map((opt, idx) => {
                        const isAnswered = quizAnswers[currentChapter.id] !== undefined;
                        const isChosen = quizAnswers[currentChapter.id] === idx;
                        const isCorrect = idx === currentChapter.quickQuiz.correctIdx;

                        let buttonStyles =
                          'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-850';
                        if (isAnswered) {
                          if (isCorrect) {
                            buttonStyles = 'bg-emerald-950/50 border-emerald-500/80 text-emerald-200 font-semibold';
                          } else if (isChosen && !isCorrect) {
                            buttonStyles = 'bg-rose-950/50 border-rose-500/80 text-rose-200 line-through';
                          } else {
                            buttonStyles = 'bg-slate-900/40 border-slate-800/40 text-slate-500 opacity-60';
                          }
                        }

                        return (
                          <button
                            key={idx}
                            onClick={() => handleSelectQuizAnswer(idx)}
                            disabled={isAnswered}
                            className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between ${buttonStyles}`}
                          >
                            <span>{opt}</span>
                            {isAnswered && isCorrect && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
                            )}
                            {isAnswered && isChosen && !isCorrect && (
                              <X className="w-4 h-4 text-rose-400 shrink-0 ml-2" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {quizAnswers[currentChapter.id] !== undefined && (
                      <div className="mt-3 p-3 bg-indigo-950/40 border border-indigo-800/50 rounded-xl space-y-1 text-xs">
                        <div className="font-bold text-indigo-300">
                          {quizAnswers[currentChapter.id] === currentChapter.quickQuiz.correctIdx
                            ? '🎉 Correct! Well done!'
                            : '💡 Concept Clarification:'}
                        </div>
                        <p className="text-slate-300 leading-relaxed">
                          {currentChapter.quickQuiz.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom Footer Navigation */}
            <div className="px-6 py-3.5 border-t border-slate-800/80 bg-slate-950/90 flex items-center justify-between text-xs shrink-0">
              <div className="flex items-center gap-2">
                {onLoadStarterDfa && (
                  <button
                    onClick={() => {
                      onLoadStarterDfa();
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold transition-colors flex items-center gap-1.5 border border-slate-700 shadow-sm"
                  >
                    <Play className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Load Starter to Canvas</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setActiveChapterIdx(prev => Math.max(0, prev - 1));
                    setActiveTab('concept');
                  }}
                  disabled={activeChapterIdx === 0}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl font-semibold transition-colors flex items-center gap-1 disabled:opacity-40"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                <button
                  onClick={() => {
                    if (activeChapterIdx < CHAPTERS.length - 1) {
                      setActiveChapterIdx(prev => prev + 1);
                      setActiveTab('concept');
                    } else {
                      onClose();
                    }
                  }}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-colors flex items-center gap-1 shadow-md"
                >
                  <span>{activeChapterIdx < CHAPTERS.length - 1 ? 'Next Lesson' : 'Finish Academy'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
