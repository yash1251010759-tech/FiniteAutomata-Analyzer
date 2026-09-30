# Universal Automata & Formal Language Visualizer (FiniteAutomata-Analyzer)

An interactive, modern, responsive digital laboratory for **Automata Theory and Formal Languages**. Built for computer science, AI, and engineering students to learn, construct, visualize, simulate, debug, convert, compare, and practice theoretical computation concepts.

---

## 🌟 Key Features

### 1. Interactive Automata Builder
* **Dynamic SVG Canvas**: Smooth state node dragging, zoom (mouse wheel/buttons), pan, initial state indicator ($\to$), double-ring final states ($\odot$), self-loops, and curved bidirectional transitions with symbol pills.
* **Two-Way Synchronized Transition Table**: Editing any cell in the transition table $\delta(q, \sigma)$ instantly mutates the visual graph and vice versa.
* **Full History**: Multi-level Undo (`Ctrl+Z`) and Redo (`Ctrl+Y`).
* **Real-time Diagnostic Debugger**: Automated checks for unreachable states, dead/trap states, missing DFA transitions, and duplicate non-deterministic branches.

### 2. Step-by-Step String Simulator
* **Interactive Tape Ribbon**: Highlights consumed, current, and upcoming characters.
* **Playback Controls**: Step Forward, Step Backward, Auto-Play with customizable playback speed, and Reset.
* **Human-Readable Acceptance Engine**: Explains formally *why* a string is accepted or rejected.
* **Moore vs. Mealy Laboratory**: Live comparative analysis comparing state outputs ($\lambda: Q \to \Delta$, length $|w| + 1$) vs transition outputs ($\lambda: Q \times \Sigma \to \Delta$, length $|w|$).

### 3. Natural Language $\to$ Automata Synthesizer
* Translates plain English requirements (e.g. *"Accept binary strings ending with 01"*, *"even number of 1s"*, *"divisible by 3"*, *"contains 101"*, *"starts with 10"*) into formal 5-tuples $M = (Q, \Sigma, \delta, q_0, F)$.
* Provides state invariant breakdowns, mathematical analysis, and automated test suite verification.

### 4. Conversion Lab
* **$\varepsilon\text{-NFA} \to \text{NFA}$**: Epsilon-bypass via $\varepsilon$-closure expansion.
* **$\text{NFA} \to \text{DFA}$**: True Subset Construction (Powerset construction algorithm) with full subset tracking table and side-by-side graph comparison.

### 5. DFA Minimization Lab
* **Hopcroft Partition Refinement Algorithm**:
  1. Elimination of unreachable states via BFS.
  2. Initial partition $P_0 = \{Q \setminus F, F\}$.
  3. Iterative partition refinement history table.
  4. Minimal state equivalence classes with before/after state reduction metrics.

### 6. Regular Expression Laboratory
* **Thompson’s Construction**: Inductive conversion of Regular Expressions (e.g. `(a+b)*abb`, `(0+1)*01`) to $\varepsilon$-NFA.
* **State Elimination Algorithm**: Algorithmic conversion of any finite automaton to a regular expression via Generalized NFA (GNFA).

### 7. Context-Free Grammars (CFG) & Parse Trees
* Production rule editor ($S \to aSb \mid \varepsilon$).
* Leftmost & rightmost derivation sequences.
* Hierarchical SVG Parse Tree visualization.

### 8. Pushdown Automata (PDA) Visualizer
* Animated LIFO Stack Tower with top-of-stack indicator, push/pop glow, and stack height.
* Instantaneous descriptions $(q, w, \gamma)$.
* Classic grammars: $\{0^n 1^n \mid n \ge 1\}$, Balanced Parentheses `(())`.

### 9. Turing Machine Simulator
* Infinite scrollable tape with $[HEAD]$ pointer.
* Directional head movement ($L, R, S$), read/write operations, and transition execution log.
* Classic algorithms: Binary Incrementer (+1), $\{0^n 1^n \mid n \ge 1\}$ recognizer.

### 10. Automata Equivalence Checker & Comparator
* Product automaton BFS reachability test to prove if $L(M_1) == L(M_2)$.
* Automatic Shortest Counterexample Finder with side-by-side simulation traces.

### 11. Practice, Quiz & University Exam Simulator
* **Challenge Mode**: Curated problem sets with automated hidden test cases and confetti rewards.
* **Quiz Mode**: Multiple-choice conceptual questions with instant theoretical rationales.
* **Timed Exam Simulator**: 20-minute exam with question navigation palette, review flags, and detailed grading report.

### 12. Repository, Import & Export
* Export to **JSON**, **PNG**, and **SVG**.
* Import custom machine definitions via JSON with schema validation.
* Preloaded with 10+ standard university automata examples.

---

## 💻 Tech Stack

* **Frontend**: React 19, TypeScript, Vite
* **Styling**: Tailwind CSS v4, Vanilla CSS design tokens, Glassmorphism
* **Icons**: Lucide React
* **Effects**: Canvas Confetti

---

## 🚀 Getting Started

### Prerequisites
* Node.js (v18 or higher recommended)
* npm or pnpm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yash1251010759-tech/FiniteAutomata-Analyzer.git
   cd FiniteAutomata-Analyzer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:5173/
   ```

### Building for Production

```bash
npm run build
npm run preview
```

---

## 📜 License
MIT License. Open-source educational project for computer science and formal language education.
