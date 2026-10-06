import React from 'react';
import { X, HelpCircle, Lightbulb, BookOpen } from 'lucide-react';

export type TermKey =
  | 'state'
  | 'alphabet'
  | 'start_state'
  | 'final_state'
  | 'transition'
  | 'epsilon'
  | 'moore_output'
  | 'mealy_output'
  | 'stack'
  | 'tape'
  | 'production'
  | 'variable'
  | 'terminal'
  | 'derivation'
  | 'pumping_lemma';

export interface TermDefinition {
  title: string;
  badge: string;
  simpleDefinition: string;
  intuition: string;
  example: string;
  formalNotation?: string;
  commonMistake?: string;
}

export const TERMS_DATABASE: Record<TermKey, TermDefinition> = {
  state: {
    title: 'State (q ∈ Q)',
    badge: 'Core Concept',
    simpleDefinition: 'A state represents the current memory condition or "mood" of the machine at any moment.',
    intuition: 'Think of states like the gear of a bicycle or the mode of an elevator (Floor 1, Floor 2, Moving Up). The machine uses states to remember what it has seen so far.',
    example: 'In an "even number of b\'s" machine, state q0 remembers "we have seen an EVEN number of b\'s", and state q1 remembers "we have seen an ODD number of b\'s".',
    formalNotation: 'Q = {q0, q1, q2, ...}',
    commonMistake: 'States are not characters! Characters come from the alphabet; states are internal memory positions.',
  },
  alphabet: {
    title: 'Alphabet (Σ)',
    badge: 'Input Symbols',
    simpleDefinition: 'The set of all allowed characters that can appear in the input strings.',
    intuition: 'Just like the English alphabet consists of letters A through Z, an automaton has a finite alphabet of allowable symbols.',
    example: 'For binary strings, Σ = {0, 1}. For DNA sequences, Σ = {A, C, G, T}.',
    formalNotation: 'Σ (Greek capital letter Sigma)',
    commonMistake: 'Epsilon (ε) is NOT a member of the alphabet! Epsilon means "empty string" (no character).',
  },
  start_state: {
    title: 'Start / Initial State (q0)',
    badge: 'Entry Point',
    simpleDefinition: 'The single state where the machine begins its execution before reading any input characters.',
    intuition: 'When you turn on a computer, it boots to the home screen. The start state is the machine\'s home screen.',
    example: 'Drawn with a bold incoming arrow pointing at the state: → (q0)',
    formalNotation: 'q0 ∈ Q',
    commonMistake: 'A standard DFA or NFA can have ONLY ONE start state.',
  },
  final_state: {
    title: 'Final / Accepting State (F ⊆ Q)',
    badge: 'Success Condition',
    simpleDefinition: 'States that signify the string was valid, satisfied the pattern, and is ACCEPTED.',
    intuition: 'Think of final states like the green checkmark at the finish line. If the machine runs out of characters and is standing in an accepting state, the string wins!',
    example: 'Drawn with a double concentric circle: ((q1))',
    formalNotation: 'F ⊆ Q',
    commonMistake: 'A machine can have zero, one, or multiple accepting states! If it has 0 accepting states, it rejects all strings.',
  },
  transition: {
    title: 'Transition (δ)',
    badge: 'Movement Rule',
    simpleDefinition: 'A rule that tells the machine: "If you are in state X and see symbol Y, move to state Z".',
    intuition: 'Think of transitions as one-way roads with signs. When the machine reads a symbol, it drives along the matching road to the next state.',
    example: 'From q0, on symbol "a", stay in q0: q0 --a--> q0. On symbol "b", move to q1: q0 --b--> q1.',
    formalNotation: 'DFA: δ(q, a) = q\'. NFA: δ(q, a) = {q1, q2}.',
    commonMistake: 'In a DFA, every state MUST have exactly one transition for every symbol in the alphabet!',
  },
  epsilon: {
    title: 'Epsilon Transition (ε or λ)',
    badge: 'Spontaneous Jump',
    simpleDefinition: 'A "free jump" transition that the machine can take without reading or consuming any input symbol.',
    intuition: 'Like a teleportation portal! If the machine is at state q0 and there is an ε-transition to q1, the machine is instantly in BOTH q0 and q1 without reading a letter.',
    example: 'q0 --ε--> q1 means the machine can move from q0 to q1 for free.',
    formalNotation: 'δ(q, ε) ⊆ 2^Q',
    commonMistake: 'Epsilon transitions are ONLY allowed in NFAs (ε-NFAs) and PDAs. DFAs NEVER allow ε-transitions!',
  },
  moore_output: {
    title: 'Moore Machine Output',
    badge: 'State-Bound Output',
    simpleDefinition: 'In a Moore machine, output characters are printed directly by the STATES, regardless of how you got there.',
    intuition: 'Think of rooms in a museum where every room has a light color. Entering Room A emits Green; entering Room B emits Red.',
    example: 'State q0 has output "0", state q1 has output "1". For input "b", sequence is q0 -> q1, emitting "0" then "1" (length |w| + 1).',
    formalNotation: 'λ: Q → Δ (Output function maps states to outputs)',
    commonMistake: 'The total output of a Moore machine is always 1 longer than the input string because the initial state emits its output first.',
  },
  mealy_output: {
    title: 'Mealy Machine Output',
    badge: 'Transition-Bound Output',
    simpleDefinition: 'In a Mealy machine, output characters are emitted directly on the TRANSITIONS as they are crossed.',
    intuition: 'Think of a turnstile or doorbell: the sound (output) only happens while you are turning the gate or pressing the switch (transition).',
    example: 'Transition written as "a / 1" means when you read "a", emit output "1". Total output length is exactly |input|.',
    formalNotation: 'λ: Q × Σ → Δ (Output function maps state and input symbol to output)',
    commonMistake: 'Mealy machines do NOT emit any output before the first input character is read.',
  },
  stack: {
    title: 'Stack Memory (PDA)',
    badge: 'LIFO Memory',
    simpleDefinition: 'A Last-In, First-Out (LIFO) storage column where you can only PUSH onto the top or POP from the top.',
    intuition: 'Think of a spring-loaded stack of cafeteria plates. You can put a new plate on top (PUSH) or take the top plate off (POP). You cannot reach plates at the bottom directly.',
    example: 'Used to count and match brackets: Push "(" when seen, and Pop "(" when matching ")" is seen.',
    formalNotation: 'Stack alphabet Γ = {Z0, A, B}',
    commonMistake: 'You can only inspect the TOP of the stack; the rest of the stack is hidden until top items are popped.',
  },
  tape: {
    title: 'Turing Machine Tape',
    badge: 'Universal Memory',
    simpleDefinition: 'An infinite one-dimensional strip of memory cells with a read/write head that can move Left or Right.',
    intuition: 'Think of an infinite film strip or notebook. The head is your magnifying glass and pencil: you can read the current box, erase and write a new symbol, and slide one step left or right.',
    example: '| a | b | b | _ | _ | with head at cell 0 reading \'a\'.',
    formalNotation: 'δ(q, a) = (q\', X, R) -> read \'a\', write \'X\', move Right, switch to state q\'.',
    commonMistake: 'The tape is unbounded (infinite). If an algorithm never reaches an accept or reject state, it may loop infinitely!',
  },
  production: {
    title: 'CFG Production Rule',
    badge: 'Grammar Rule',
    simpleDefinition: 'A replacement recipe that says: "You can replace variable A with the string α".',
    intuition: 'Like substituting ingredients in a recipe: "Sandwich -> Bread Filling Bread".',
    example: 'S -> a S b | ε means S can expand to a S b, or to nothing (ε).',
    formalNotation: 'A → α where A ∈ V and α ∈ (V ∪ Σ)*',
    commonMistake: 'In Context-Free Grammars, the left-hand side MUST be a single variable (e.g., S -> ...), not a combination of characters.',
  },
  variable: {
    title: 'Variable / Non-terminal (V)',
    badge: 'Grammar Placeholder',
    simpleDefinition: 'Uppercase symbols in a grammar that represent intermediate syntactic placeholders that must be expanded.',
    intuition: 'Think of variables as fill-in-the-blank placeholders like `<Noun>` or `<Verb>` in sentence mad-libs.',
    example: 'V = {S, A, B}. S is the main starting variable.',
    formalNotation: 'V ∩ Σ = ∅ (Variables are distinct from terminals)',
    commonMistake: 'Variables cannot appear in the final generated string; they must all be replaced by terminals.',
  },
  terminal: {
    title: 'Terminal Symbol (Σ)',
    badge: 'Final Character',
    simpleDefinition: 'The lowercase characters or alphabet symbols that make up the actual final output string.',
    intuition: 'Terminal means "end of the line" — these characters can never be expanded or replaced further.',
    example: 'Σ = {a, b, 0, 1}.',
    formalNotation: 'w ∈ Σ*',
    commonMistake: 'Terminals never appear on the left-hand side of a production rule in a CFG.',
  },
  derivation: {
    title: 'Grammar Derivation',
    badge: 'Step-by-step Generation',
    simpleDefinition: 'The sequence of rule replacements starting from the start symbol S that produces a string.',
    intuition: 'Like walking through a family tree or expanding mathematical terms step-by-step.',
    example: 'S ⇒ aSb ⇒ aaSbb ⇒ aaaSbbb ⇒ aaabbb',
    formalNotation: 'α ⇒* w (derives in zero or more steps)',
    commonMistake: 'Leftmost derivation always expands the leftmost variable first; rightmost expands the rightmost first.',
  },
  pumping_lemma: {
    title: 'The Pumping Lemma',
    badge: 'Non-regularity Proof',
    simpleDefinition: 'A mathematical theorem used to prove by contradiction that a language is NOT regular.',
    intuition: 'If a machine has only 5 states, any string with 6+ characters MUST repeat a state (Pigeonhole Principle). That loop can be "pumped" (repeated) forever. If repeating the loop breaks the language rule, the language can\'t be regular!',
    example: 'Proves that L = {0^n 1^n} is not regular because you would need infinite states to count 0s and 1s.',
    formalNotation: 's = xyz with |y| > 0 and |xy| ≤ p, such that xy^i z ∈ L for all i ≥ 0.',
    commonMistake: 'The Pumping Lemma CANNOT be used to prove a language IS regular; it can only prove a language is NOT regular.',
  },
};

interface TermExplainerModalProps {
  termKey: TermKey | null;
  onClose: () => void;
}

export const TermExplainerModal: React.FC<TermExplainerModalProps> = ({ termKey, onClose }) => {
  if (!termKey) return null;
  const term = TERMS_DATABASE[termKey];
  if (!term) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative space-y-4">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white font-['Outfit']">{term.title}</h3>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
                {term.badge}
              </span>
            </div>
            <p className="text-xs text-slate-400">Beginner-Friendly Theoretical Concept</p>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl space-y-1">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" /> What is it?
            </div>
            <p className="text-slate-300 leading-relaxed">{term.simpleDefinition}</p>
          </div>

          <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl space-y-1">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Plain English Intuition
            </div>
            <p className="text-slate-300 leading-relaxed">{term.intuition}</p>
          </div>

          <div className="p-3 bg-indigo-950/30 border border-indigo-800/40 rounded-2xl space-y-1">
            <div className="font-semibold text-indigo-300">Concrete Example:</div>
            <p className="text-indigo-200/90 leading-relaxed font-mono text-[11px]">{term.example}</p>
          </div>

          {term.formalNotation && (
            <div className="flex items-center justify-between px-3 py-2 bg-slate-950/50 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-400">
              <span className="text-slate-500 font-sans text-xs">Formal Math:</span>
              <span className="text-cyan-300 font-semibold">{term.formalNotation}</span>
            </div>
          )}

          {term.commonMistake && (
            <div className="p-2.5 bg-amber-950/30 border border-amber-800/40 rounded-xl text-amber-200 text-[11px] leading-relaxed">
              ⚠️ <b>Common Beginner Mistake:</b> {term.commonMistake}
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-sm"
        >
          Got It! Back to Lab
        </button>
      </div>
    </div>
  );
};
