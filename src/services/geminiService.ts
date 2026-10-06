import { AutomatonDefinition, StateNode, TransitionEdge } from '../types/automata';
import { GeneratedMachineReport, buildFormalTuple } from '../algorithms/naturalLanguageDfa';
import { layoutNodes } from '../algorithms/subsetConstruction';
import { analyzeMachine, debugAutomaton } from '../algorithms/debugger';

const STORAGE_KEY = 'DSACT_GEMINI_API_KEY';

export function getStoredApiKey(): string {
  try {
    const fromStorage = localStorage.getItem(STORAGE_KEY);
    if (fromStorage && fromStorage.trim()) return fromStorage.trim();
  } catch {
    // localStorage might be unavailable in some sandboxes
  }

  // Fallback to Vite env variable if provided at build/runtime
  return (import.meta.env.VITE_GEMINI_API_KEY as string) || '';
}

export function setStoredApiKey(key: string): void {
  try {
    if (key.trim()) {
      localStorage.setItem(STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (err) {
    console.error('Failed to store Gemini API key in localStorage:', err);
  }
}

export function clearStoredApiKey(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear Gemini API key from localStorage:', err);
  }
}

const GEMINI_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.5-flash',
  'gemini-flash-latest',
];

export async function testGeminiApiKey(apiKey: string): Promise<{ success: boolean; message: string }> {
  const key = apiKey.trim();
  if (!key) {
    return { success: false, message: 'API key cannot be empty.' };
  }

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Respond with "OK"' }] }],
        }),
      });

      if (res.ok) {
        return { success: true, message: `Connected successfully with model ${model}!` };
      }

      if (res.status === 400 || res.status === 403) {
        const errorData = await res.json().catch(() => ({}));
        const msg = errorData?.error?.message || 'Invalid API key or insufficient permissions.';
        return { success: false, message: msg };
      }
    } catch (err: any) {
      return { success: false, message: err?.message || 'Network error connecting to Gemini API.' };
    }
  }

  return { success: false, message: 'Could not connect with available Gemini models.' };
}

interface RawGeminiDfaResponse {
  patternType?: string;
  identifiedAlphabet?: string[];
  name?: string;
  states?: {
    id: string;
    label?: string;
    isStart?: boolean;
    isFinal?: boolean;
    description?: string;
  }[];
  transitions?: {
    from: string;
    to: string;
    symbols: string[];
  }[];
  startStateId?: string;
  finalStateIds?: string[];
  analysis?: string;
  stateExplanations?: {
    stateLabel: string;
    meaning: string;
  }[];
  sampleTests?: {
    input: string;
    expected: boolean;
  }[];
}

export async function generateAutomatonWithGemini(
  userPrompt: string,
  apiKey: string
): Promise<GeneratedMachineReport> {
  const key = apiKey.trim();
  if (!key) {
    throw new Error('Gemini API key is required.');
  }

  const systemInstruction = `You are a Theoretical Computer Science and Automata Theory expert specializing in Formal Languages.
Your job is to synthesize a mathematically sound, complete Deterministic Finite Automaton (DFA) based on the user's natural language specification.

DFA Requirements:
1. The machine MUST be a strictly deterministic finite automaton (DFA):
   - Exactly one transition for every symbol in the alphabet from every state.
   - No epsilon transitions (ε).
   - If an invalid path or reject branch occurs, lead to an explicit dead/trap state (e.g. "q_trap") with self-loops.
2. Standard state naming: "q0", "q1", "q2", etc. (q0 is almost always the start state).
3. The alphabet should be correctly identified (e.g. ["0", "1"] for binary languages, or ["a", "b"] if characters are letters).
4. Provide a clear, rigorous analysis of the mathematical requirement and state invariants.
5. Provide a clear description for each state's meaning.
6. Provide at least 5-6 sample test inputs with boolean "expected" (true if string should be accepted by the language, false if rejected). Include the empty string "" if appropriate.

You must respond ONLY with a valid JSON object (no markdown, no backticks, no comments) adhering to this structure:
{
  "patternType": "Short category description, e.g. Prefix Verification / Parity / Substring Search",
  "identifiedAlphabet": ["0", "1"],
  "name": "DFA: Concise title of language",
  "states": [
    { "id": "q0", "label": "q0", "isStart": true, "isFinal": false, "description": "Short state role" }
  ],
  "transitions": [
    { "from": "q0", "to": "q1", "symbols": ["1"] }
  ],
  "startStateId": "q0",
  "finalStateIds": ["q1"],
  "analysis": "Detailed theoretical analysis...",
  "stateExplanations": [
    { "stateLabel": "q0", "meaning": "Formal invariant for state q0" }
  ],
  "sampleTests": [
    { "input": "1", "expected": true },
    { "input": "0", "expected": false }
  ]
}`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: `Specification: "${userPrompt}"\nSynthesize the complete DFA JSON as instructed.`,
          },
        ],
      },
    ],
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
    },
  };

  let lastError: Error | null = null;
  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg = errorData?.error?.message || `Gemini API returned HTTP ${response.status}`;
        throw new Error(msg);
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error('Gemini API returned an empty response.');
      }

      // Strip potential markdown code fences if present
      const cleanJson = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed: RawGeminiDfaResponse = JSON.parse(cleanJson);

      // Validate parsed content
      if (!parsed.states || parsed.states.length === 0) {
        throw new Error('Invalid DFA: No states returned from Gemini.');
      }

      const alphabet = parsed.identifiedAlphabet && parsed.identifiedAlphabet.length > 0
        ? parsed.identifiedAlphabet
        : ['0', '1'];

      // Assign IDs to transitions and normalize
      let edgeIdx = 0;
      const transitions: TransitionEdge[] = (parsed.transitions || []).map(t => ({
        id: `t-gemini-${edgeIdx++}`,
        from: t.from,
        to: t.to,
        symbols: t.symbols || [],
      }));

      // Normalize state nodes
      const rawStates: StateNode[] = parsed.states.map(s => ({
        id: s.id,
        label: s.label || s.id,
        x: 0,
        y: 0,
        isStart: Boolean(s.isStart),
        isFinal: Boolean(s.isFinal),
        description: s.description || '',
      }));

      // Lay out the nodes cleanly for the 2D canvas
      const positionedStates = layoutNodes(rawStates, 700, 380);

      const startStateId = parsed.startStateId || positionedStates.find(s => s.isStart)?.id || positionedStates[0].id;
      const finalStateIds = parsed.finalStateIds || positionedStates.filter(s => s.isFinal).map(s => s.id);

      const machine: AutomatonDefinition = {
        id: `gemini-dfa-${Date.now()}`,
        name: parsed.name || `DFA for "${userPrompt}"`,
        type: 'DFA',
        alphabet,
        states: positionedStates,
        transitions,
        startStateId,
        finalStateIds,
      };

      const formalTuple = buildFormalTuple(machine);

      const stateExplanations = parsed.stateExplanations || positionedStates.map(s => ({
        stateLabel: s.label || s.id,
        meaning: s.description || (s.isFinal ? 'Accepting state' : 'Processing state'),
      }));

      const sampleTests = parsed.sampleTests && parsed.sampleTests.length > 0
        ? parsed.sampleTests
        : [
            { input: alphabet[0] || '0', expected: false },
            { input: alphabet[1] || '1', expected: true },
          ];

      return {
        prompt: userPrompt,
        identifiedAlphabet: alphabet,
        patternType: `Gemini AI (${parsed.patternType || 'Synthesized Language'})`,
        machine,
        analysis: parsed.analysis || `Synthesized using Gemini AI for requirement: "${userPrompt}".`,
        stateExplanations,
        formalTuple,
        sampleTests,
      };
    } catch (err: any) {
      lastError = err;
      // Try fallback model if first model failed
      continue;
    }
  }

  throw lastError || new Error('Failed to generate automaton with Gemini.');
}

export interface ChatHistoryMessage {
  sender: 'user' | 'tutor';
  text: string;
}

export async function askGeminiTutor(
  userQuestion: string,
  history: ChatHistoryMessage[] = [],
  currentMachine?: AutomatonDefinition,
  customApiKey?: string
): Promise<string> {
  const key = (customApiKey || getStoredApiKey()).trim();
  if (!key) {
    throw new Error('No Gemini API key found.');
  }

  let machineContext = '';
  if (currentMachine && currentMachine.states && currentMachine.states.length > 0) {
    const stats = analyzeMachine(currentMachine);
    machineContext = `
ACTIVE AUTOMATON CONTEXT ON USER'S SCREEN:
- Machine Name: "${currentMachine.name}"
- Formal Model: ${currentMachine.type}
- Alphabet Σ: {${currentMachine.alphabet.join(', ')}}
- Start State: ${currentMachine.startStateId || 'None'}
- Accept / Final States: ${currentMachine.finalStateIds.join(', ') || 'None'}
- Total States: ${currentMachine.states.length} (${currentMachine.states.map(s => `${s.label || s.id}${s.id === currentMachine.startStateId ? ' [START]' : ''}${currentMachine.finalStateIds.includes(s.id) ? ' [ACCEPT]' : ''}`).join(', ')})
- Deterministic: ${stats.isDeterministic ? 'Yes' : 'No (NFA branching or ε-moves present)'}
- Reachable States: ${stats.reachableStates.length}/${stats.numStates}
- Transitions (${currentMachine.transitions.length} total): ${currentMachine.transitions.map(t => `${t.from} --[${t.symbols.join(',')}]--> ${t.to}`).slice(0, 20).join('; ')}${currentMachine.transitions.length > 20 ? '...' : ''}
`;
  }

  const systemInstruction = `You are an elite, pedagogically gifted Theoretical Computer Science and Automata Theory Professor and interactive AI Tutor.
You provide clear, accurate, mathematically sound, engaging, and easy-to-understand explanations for any student query about formal languages, automata, computation theory, and grammar designs.

Your core expertise includes:
- Finite State Machines: DFA (Deterministic Finite Automata), NFA (Nondeterministic Finite Automata), ε-NFA (Epsilon-NFA), Moore and Mealy Machines.
- Higher Computation Models: Pushdown Automata (PDA), Turing Machines (Single-tape, Multi-tape, Non-deterministic, Universal TM), Linear Bounded Automata (LBA).
- Grammars & Languages: Regular Expressions (Regex), Context-Free Grammars (CFG), Ambiguity, Chomsky Hierarchy (Types 0, 1, 2, 3), Normal Forms (CNF, GNF).
- Fundamental Algorithms & Proofs: Subset Construction (NFA to DFA), DFA Minimization (Hopcroft, Table-filling / Myhill-Nerode equivalence theorem), Pumping Lemma for Regular and Context-Free languages, State Elimination (Arden's Theorem), Decidability, Halting Problem.
- Active Visualizer Diagnostics: When asked about the user's active machine, refer specifically to its states, transitions, alphabet, and behavior.

${machineContext}

Formatting Guidelines:
- Respond in clear, beautifully formatted Markdown.
- Use bold text for key terms.
- Use bullet points and numbered steps for structured explanations.
- Use backticks for symbols, states (e.g., \`q0\`, \`q1\`), transitions (e.g., \`δ(q0, 0) = q1\`), and expressions.
- Always answer directly, thoroughly, and warmly to any general question (e.g., "what is nfa", "what is dfa", "what is pda", "compare dfa and nfa", "pumping lemma", "regular vs context-free", etc.).`;

  const contents: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];

  // Include recent conversation turns for conversational continuity
  const recentHistory = history.slice(-6);
  for (const item of recentHistory) {
    contents.push({
      role: item.sender === 'user' ? 'user' : 'model',
      parts: [{ text: item.text }],
    });
  }

  contents.push({
    role: 'user',
    parts: [{ text: userQuestion }],
  });

  const requestBody = {
    contents,
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
    generationConfig: {
      temperature: 0.25,
      maxOutputTokens: 2048,
    },
  };

  let lastError: Error | null = null;
  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg = errorData?.error?.message || `Gemini API HTTP ${response.status}`;
        throw new Error(msg);
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error('Gemini API returned an empty response.');
      }

      return rawText.trim();
    } catch (err: any) {
      lastError = err;
      continue;
    }
  }

  throw lastError || new Error('Failed to get response from Gemini.');
}

/**
 * Built-in comprehensive knowledge base fallback for theoretical queries
 * used if offline, network fails, or no API key is set.
 */
export function getFallbackTutorResponse(
  query: string,
  currentMachine?: AutomatonDefinition
): string {
  const q = query.toLowerCase().trim();

  // Machine analysis
  if (
    q.includes('analyze') ||
    q.includes('current machine') ||
    q.includes('my machine') ||
    q.includes('diagnos') ||
    q.includes('defect') ||
    q.includes('bug') ||
    q.includes('issue')
  ) {
    if (!currentMachine) {
      return 'No active automaton is currently loaded on the canvas. Open or design a machine in the Builder to run diagnostics!';
    }
    const stats = analyzeMachine(currentMachine);
    const issues = debugAutomaton(currentMachine);

    let reply = `### Structural Analysis: **"${currentMachine.name}"** (${currentMachine.type})\n\n` +
      `• **Total States:** ${stats.numStates} (Start: \`${currentMachine.startStateId || 'None'}\`, Final: ${stats.numFinalStates})\n` +
      `• **Alphabet:** Σ = {${currentMachine.alphabet.join(', ')}}\n` +
      `• **Reachable States:** ${stats.reachableStates.length} / ${stats.numStates}\n` +
      `• **Deterministic:** ${stats.isDeterministic ? '✓ Yes (Strictly Deterministic DFA)' : '⚠️ No (Contains non-deterministic branches or ε-moves)'}\n\n`;

    if (issues.length > 0 && issues[0].severity !== 'INFO') {
      reply += `#### Issues Identified:\n` +
        issues.map(iss => `⚠️ **[${iss.severity}] ${iss.title}:** ${iss.message}\n💡 *Recommendation:* ${iss.suggestion}`).join('\n\n');
    } else {
      reply += `✓ **Great work!** No structural defects or unreachable dead states were detected in this machine.`;
    }
    return reply;
  }

  // DFA vs NFA comparison
  if (
    q.includes('dfa vs nfa') ||
    q.includes('nfa vs dfa') ||
    (q.includes('difference') && (q.includes('dfa') || q.includes('nfa'))) ||
    (q.includes('compare') && (q.includes('dfa') || q.includes('nfa')))
  ) {
    return `### Comparison: DFA vs. NFA

| Feature | Deterministic Finite Automaton (DFA) | Nondeterministic Finite Automaton (NFA) |
|---|---|---|
| **Transitions** | Exactly **one** transition for every symbol: \`δ: Q × Σ → Q\` | **Zero, one, or multiple** transitions per symbol: \`δ: Q × Σ → 2^Q\` |
| **Epsilon Moves (ε)** | **Not allowed**; must consume an input character to move | **Allowed** (can transition without consuming input) |
| **Execution Path** | Single, linear computational trace | Multi-branching tree of parallel possibilities |
| **Acceptance** | Reaches a final state at the end of input | At least **one** branch reaches a final state |
| **Expressive Power** | Recognizes **Regular Languages** | Recognizes **Regular Languages** (Exact same power!) |
| **Implementation** | Trivial in hardware/software (fast $O(n)$) | Requires backtracking or subset conversion |

**Key Theorem:** Every NFA can be converted to an equivalent DFA using the **Subset Construction Algorithm** (with up to $2^n$ states in the worst case).`;
  }

  // What is DFA?
  if (
    q.includes('what is dfa') ||
    q === 'dfa' ||
    q.includes('define dfa') ||
    q.includes('explain dfa') ||
    q.includes('deterministic finite automaton') ||
    q.includes('deterministic finite automata')
  ) {
    return `### Deterministic Finite Automaton (DFA)

A **Deterministic Finite Automaton (DFA)** is a theoretical model of computation with a finite number of states that processes strings of symbols from an alphabet. The term *deterministic* means that for every state and each input symbol, there is **exactly one unique transition** to a next state.

#### Formal 5-Tuple Definition:
A DFA is mathematically formalized as a 5-tuple:
$$M = (Q, \\Sigma, \\delta, q_0, F)$$

- **$Q$:** A finite set of states (e.g., \`{q0, q1, q2}\`).
- **$\\Sigma$:** A finite alphabet of input symbols (e.g., \`{0, 1}\` or \`{a, b}\`).
- **$\\delta$:** The transition function $\\delta: Q \\times \\Sigma \\to Q$ mapping a current state and symbol to a single next state.
- **$q_0 \\in Q$:** The unique initial/start state.
- **$F \\subseteq Q$:** The set of accepting (or final) states.

#### Core Characteristics:
1. **Unambiguous Execution:** For any input string of length $n$, the DFA executes exactly $n$ state transitions in $O(n)$ time.
2. **Trap / Dead States:** If a string can never be accepted after a certain prefix, a DFA explicitly directs execution to a rejecting sink state (trap state) that loops on all alphabet symbols.
3. **Language Class:** DFAs recognize **Regular Languages** (Chomsky Type 3).`;
  }

  // What is NFA?
  if (
    q.includes('what is nfa') ||
    q === 'nfa' ||
    q.includes('define nfa') ||
    q.includes('explain nfa') ||
    q.includes('nondeterministic finite automaton') ||
    q.includes('nondeterministic finite automata')
  ) {
    return `### Nondeterministic Finite Automaton (NFA)

A **Nondeterministic Finite Automaton (NFA)** is a finite state machine where, for a given state and input symbol, the machine may transition to **zero, one, or multiple states simultaneously**, effectively exploring multiple execution paths in parallel.

#### Formal 5-Tuple Definition:
An NFA is mathematically formalized as:
$$M = (Q, \\Sigma, \\delta, q_0, F)$$

- **$Q$:** A finite set of states.
- **$\\Sigma$:** A finite alphabet of input symbols.
- **$\\delta$:** Transition function $\\delta: Q \\times (\\Sigma \\cup \\{\\epsilon\\}) \\to 2^Q$ mapping to a *subset* (the power set) of states.
- **$q_0 \\in Q$:** The start state.
- **$F \\subseteq Q$:** The set of accepting / final states.

#### Key Features:
1. **Branching Computation:** The machine can be thought of as "guessing" the correct path or cloning itself along all valid branches.
2. **Epsilon (ε) Transitions:** An NFA can spontaneously jump between states without consuming any symbol from the input tape.
3. **Acceptance Criterion:** An input string $w$ is accepted if **at least one** of the branches terminates in an accepting state $q_f \\in F$ after reading all of $w$.
4. **Computational Equivalence:** Despite the apparent power of non-determinism, NFAs recognize the **exact same family of languages** as DFAs (Regular Languages). Any NFA can be compiled into an equivalent DFA via **Subset Construction**.`;
  }

  // Pushdown Automata
  if (q.includes('pda') || q.includes('pushdown')) {
    return `### Pushdown Automaton (PDA)

A **Pushdown Automaton (PDA)** is an automaton that augments a finite state control with an auxiliary **infinite Stack memory** operating in Last-In, First-Out (LIFO) order.

#### Formal 7-Tuple Definition:
$$M = (Q, \\Sigma, \\Gamma, \\delta, q_0, Z_0, F)$$
- **$Q$:** Finite set of states.
- **$\\Sigma$:** Input alphabet.
- **$\\Gamma$:** Stack alphabet (symbols that can be pushed/popped).
- **$\\delta$:** Transition function: $\\delta: Q \\times (\\Sigma \\cup \\{\\epsilon\\}) \\times \\Gamma \\to 2^{Q \\times \\Gamma^*}$.
- **$q_0 \\in Q$:** Initial state.
- **$Z_0 \\in \\Gamma$:** Initial stack bottom marker.
- **$F \\subseteq Q$:** Final accepting states.

#### Why PDAs Matter:
- Standard DFAs cannot count unbounded quantities because their memory is finite. For example, the language $L = \\{0^n 1^n \\mid n \\ge 0\\}$ is non-regular.
- A PDA can push $0$'s onto the stack and pop them upon reading $1$'s, matching their counts.
- PDAs recognize **Context-Free Languages (Type 2)**, which form the syntactic foundation for parsing source code in compilers!`;
  }

  // Turing Machines
  if (q.includes('turing') || q.includes(' tm ') || q === 'tm' || q.includes('turing machine')) {
    return `### Turing Machine (TM)

Formulated by Alan Turing in 1936, a **Turing Machine** is the mathematical standard for general-purpose computation. It consists of an infinite one-dimensional tape partitioned into cells and a read/write head.

#### Formal 7-Tuple:
$$M = (Q, \\Sigma, \\Gamma, \\delta, q_0, q_{accept}, q_{reject})$$
- **$Q$:** Finite set of states.
- **$\\Sigma$:** Input alphabet (does not contain the blank symbol $\\sqcup$).
- **$\\Gamma$:** Tape alphabet (where $\\Sigma \\subset \\Gamma$ and $\\sqcup \\in \\Gamma$).
- **$\\delta$:** Transition function: $\\delta: Q \\times \\Gamma \\to Q \\times \\Gamma \\times \\{L, R\\}$.
- **$q_0$:** Initial state.
- **$q_{accept}$ / $q_{reject}$:** Distinct halting states.

#### Core Insights:
- **Church-Turing Thesis:** Any function computable by an effective algorithm can be computed by a Turing Machine.
- **Decidability:** A language is *decidable* if a TM halts on every input (accept or reject). It is *Turing-recognizable* (Recursively Enumerable) if the TM accepts strings in $L$ but may loop infinitely on strings outside $L$.
- **Halting Problem:** Proven by Alan Turing to be undecidable—no general algorithm can determine if an arbitrary TM halts on a given input.`;
  }

  // CFG
  if (q.includes('cfg') || q.includes('context free') || q.includes('context-free') || q.includes('grammar')) {
    return `### Context-Free Grammar (CFG)

A **Context-Free Grammar (CFG)** is a 4-tuple $G = (V, \\Sigma, R, S)$ that recursively defines the syntax of a Context-Free Language.

- **$V$:** Finite set of nonterminal variables (e.g., \`{S, A, B}\`).
- **$\\Sigma$:** Finite set of terminal symbols (e.g., \`{a, b}\`).
- **$R$:** Production rules of the form $A \\to \\alpha$, where $A \\in V$ and $\\alpha \\in (V \\cup \\Sigma)^*$.
- **$S \\in V$:** The designated start symbol.

#### Example ($L = \\{a^n b^n \\mid n \\ge 0\\}$):
\`\`\`
S -> a S b | ε
\`\`\`

#### Key Concepts:
- **Derivations:** Leftmost and rightmost derivations expand non-terminals sequentially into terminal strings.
- **Ambiguity:** A CFG is *ambiguous* if there exists at least one string with two distinct parse trees.
- **Chomsky Normal Form (CNF):** Every rule has the form $A \\to BC$ or $A \\to a$, enabling $O(n^3)$ CYK parsing.`;
  }

  // Pumping Lemma
  if (q.includes('pumping')) {
    return `### The Pumping Lemma for Regular Languages

The **Pumping Lemma** is a mathematical tool used to prove by contradiction that a specific language $L$ is **NOT regular**.

#### Theorem Statement:
If $L$ is a regular language, then there exists an integer $p \\ge 1$ (the pumping length) such that any string $s \\in L$ with $|s| \\ge p$ can be written as $s = xyz$ satisfying three conditions:
1. $|y| > 0$ (the pumped substring $y$ is not empty)
2. $|xy| \\le p$ (the repeating part occurs within the first $p$ characters)
3. For all $i \\ge 0$, $x y^i z \\in L$ (we can repeat or remove $y$ and the string must still belong to $L$)

#### How to use it in a Proof:
1. Assume $L$ is regular to seek a contradiction.
2. Let $p$ be the pumping length given by the lemma.
3. Choose an adversarial string $s \\in L$ whose length is at least $p$ (e.g., $s = 0^p 1^p$).
4. Analyze all possible decompositions $s = xyz$ where $|xy| \\le p$ and $|y| > 0$.
5. Show that for some choice of $i$ (often $i=2$ or $i=0$), $x y^i z \\notin L$.
6. Conclude that $L$ cannot be regular.`;
  }

  // Chomsky Hierarchy
  if (q.includes('chomsky') || q.includes('hierarchy')) {
    return `### The Chomsky Hierarchy

Introduced by Noam Chomsky in 1956, this hierarchy categorizes formal languages and their computing automata:

| Type | Language Class | Machine Model | Production Rule Restriction |
|---|---|---|---|
| **Type 3** | **Regular Languages** | Finite Automaton (DFA / NFA) | $A \\to aB$ or $A \\to a$ (Right-linear) |
| **Type 2** | **Context-Free Languages** | Pushdown Automaton (PDA) | $A \\to \\gamma$ ($A$ is a single variable) |
| **Type 1** | **Context-Sensitive Languages** | Linear Bounded Automaton (LBA) | $\\alpha A \\beta \\to \\alpha \\gamma \\beta$ ($|\\gamma| \\ge |A|$) |
| **Type 0** | **Recursively Enumerable** | Turing Machine (TM) | $\\alpha \\to \\beta$ (No restrictions) |

Every Regular language is Context-Free; every Context-Free language is Context-Sensitive; and every Context-Sensitive language is Turing-recognizable:
$$\\text{Regular} \\subset \\text{CFL} \\subset \\text{CSL} \\subset \\text{Recursively Enumerable}$$`;
  }

  // Subset Construction
  if (q.includes('subset') || q.includes('nfa to dfa')) {
    return `### NFA → DFA Subset Construction (Powerset Algorithm)

The **Subset Construction Algorithm** systematically converts any NFA with $n$ states into an equivalent DFA with up to $2^n$ states.

#### Algorithm Steps:
1. **Initial State:** Compute the $\\epsilon$-closure of the NFA start state: $q_0^{DFA} = \\text{ε-closure}(q_0^{NFA})$.
2. **Worklist Loop:** Maintain a queue of discovered subsets of states. For each subset $S$ and each alphabet symbol $a \\in \\Sigma$:
   - Find all states reachable on $a$: $\\text{move}(S, a) = \\bigcup_{p \\in S} \\delta(p, a)$.
   - Compute its epsilon closure: $T = \\text{ε-closure}(\\text{move}(S, a))$.
   - If $T$ is non-empty and not yet in the DFA, add $T$ to the DFA states and the worklist.
   - Add transition: $\\delta_{DFA}(S, a) = T$.
3. **Accepting States:** Any DFA subset state $S$ that contains **at least one** original accepting state of the NFA ($S \\cap F_{NFA} \\neq \\emptyset$) is marked as a DFA accepting state.

*Try testing this live in our **Conversion Lab** tab in the sidebar!*`;
  }

  // Minimization
  if (q.includes('minimal') || q.includes('minimization') || q.includes('hopcroft')) {
    return `### DFA Minimization (Hopcroft Algorithm)

A DFA is minimal if it contains no unreachable states and no two distinct states are equivalent (indistinguishable according to the Myhill-Nerode theorem).

#### Algorithm Outline:
1. **Eliminate Dead/Unreachable States:** Use BFS/DFS starting from $q_0$ to discard states that can never be reached.
2. **Initial Partition:** Divide the states into two groups:
   $$P_0 = \\{ F, \\; Q \\setminus F \\} \\quad (\\text{Accepting vs. Non-accepting})$$
3. **Refinement:** Iteratively split partitions. Two states $p, q$ within group $G$ are split if for some symbol $a \\in \\Sigma$, $\\delta(p, a)$ and $\\delta(q, a)$ land in different groups.
4. **Convergence:** When no further splits occur, collapse each group of equivalent states into a single merged DFA state.

*Visit our **Minimization Lab** to watch step-by-step partition animations!*`;
  }

  // Moore vs Mealy
  if (q.includes('moore') || q.includes('mealy')) {
    return `### Moore vs. Mealy Finite State Transducers

Both models extend finite state automata by producing output strings:

- **Moore Machine:** Output depends **only on the current state**: $\\lambda: Q \\to \\Delta$.
  - Output length for input of length $n$ is $n + 1$ (emits initial state's output upon start).
  - Clean state diagrams and easier to synchronize in synchronous hardware logic.
- **Mealy Machine:** Output depends on **both the current state and the current input symbol**: $\\lambda: Q \\times \\Sigma \\to \\Delta$.
  - Output length for input of length $n$ is exactly $n$.
  - Typically requires fewer states than an equivalent Moore machine because outputs can change during the transition.`;
  }

  // Greetings
  if (q === 'hi' || q === 'hello' || q === 'hey' || q.startsWith('hi ') || q.startsWith('hello ')) {
    return `Hello! I am your **Automata Theory AI Tutor**. I'm here to explain concepts, guide you through proofs, and analyze your active machines.

You can ask me anything, such as:
- *"What is an NFA?"* or *"What is a DFA?"*
- *"Explain the difference between DFA and NFA"*
- *"How does Pushdown Automata work?"*
- *"Explain the Pumping Lemma with an example"*
- *"What is a Turing Machine?"*
- *"Analyze my current machine"*

What topic would you like to explore?`;
  }

  // Default fallback
  return `### Automata & Formal Languages Tutor

I can help you master any theoretical or practical concept in Automata Theory! Here is a quick reference to popular topics:

- **Finite Automata:** DFA, NFA, ε-NFA, Moore & Mealy Machines.
- **Algorithms:** Subset Construction (NFA to DFA), Hopcroft DFA Minimization, State Elimination (Arden's Theorem).
- **Higher Models:** Pushdown Automata (PDA for Context-Free Languages), Turing Machines (Type 0 Recursively Enumerable).
- **Grammars:** Regular Expressions, Context-Free Grammars (CFG), Chomsky Hierarchy.
- **Proofs & Theorems:** Pumping Lemma for Regular & CF Languages, Myhill-Nerode Theorem, Halting Problem.

💡 *Feel free to ask a specific question like **"What is NFA?"**, **"How to minimize a DFA"**, or **"Analyze my machine"**!*`;
}

