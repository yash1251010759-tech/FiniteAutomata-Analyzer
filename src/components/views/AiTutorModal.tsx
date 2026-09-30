import React, { useState } from 'react';
import { Bot, Send, X, Sparkles, AlertCircle, CheckCircle, Lightbulb } from 'lucide-react';
import { AutomatonDefinition } from '../../types/automata';
import { analyzeMachine, debugAutomaton } from '../../algorithms/debugger';

interface AiTutorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMachine: AutomatonDefinition;
}

interface Message {
  id: string;
  sender: 'user' | 'tutor';
  text: string;
  timestamp: string;
}

export const AiTutorModal: React.FC<AiTutorModalProps> = ({
  isOpen,
  onClose,
  currentMachine,
}) => {
  if (!isOpen) return null;

  const [inputQuestion, setInputQuestion] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      sender: 'tutor',
      text: `Hello! I am your AI Automata Tutor. I can explain theoretical concepts (DFA, NFA, PDA, Turing Machines), explain conversion algorithms (Subset Construction, Minimization), or inspect and debug your active machine "${currentMachine.name}". What would you like to explore today?`,
      timestamp: 'Just now',
    },
  ]);

  // Quick query suggestions
  const suggestions = [
    `Analyze my current machine "${currentMachine.name}"`,
    'What is the difference between DFA and NFA?',
    'Explain how NFA to DFA subset construction works',
    'Why is epsilon-closure important?',
    'What makes a DFA minimal?',
    'What is the difference between Moore and Mealy machines?',
  ];

  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputQuestion).trim();
    if (!query) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: 'Just now',
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuestion('');

    // Answer generation
    setTimeout(() => {
      let reply = '';
      const q = query.toLowerCase();

      if (q.includes('analyze') || q.includes('current machine') || q.includes('my machine') || q.includes('issue')) {
        const stats = analyzeMachine(currentMachine);
        const issues = debugAutomaton(currentMachine);

        reply = `Here is my structural analysis of your active machine "${currentMachine.name}" (${currentMachine.type}):\n\n` +
          `• Total States: ${stats.numStates} (Start: ${currentMachine.startStateId || 'None'}, Final: ${stats.numFinalStates})\n` +
          `• Alphabet: Σ = {${currentMachine.alphabet.join(', ')}}\n` +
          `• Reachable States: ${stats.reachableStates.length} / ${stats.numStates}\n` +
          `• Deterministic: ${stats.isDeterministic ? 'Yes (Strictly Deterministic)' : 'No (Non-deterministic branches or ε-moves detected)'}\n\n`;

        if (issues.length > 0 && issues[0].severity !== 'INFO') {
          reply += `Key Issues Identified:\n` +
            issues.map(iss => `⚠️ [${iss.severity}] ${iss.title}: ${iss.message}\n💡 Recommendation: ${iss.suggestion}`).join('\n\n');
        } else {
          reply += `✓ Great work! No structural defects were detected in this machine. It is fully defined and ready for simulation.`;
        }
      } else if (q.includes('difference between dfa and nfa') || q.includes('dfa vs nfa')) {
        reply = `DFA vs. NFA Comparison:\n\n` +
          `1. Determinism: In a DFA, reading a symbol from any state leads to EXACTLY ONE unique next state: δ(q, a) ∈ Q. In an NFA, it can lead to ZERO, ONE, or MULTIPLE states: δ(q, a) ⊆ 2^Q.\n` +
          `2. Epsilon Transitions: NFAs can make spontaneous transitions without consuming symbols (ε-transitions); DFAs cannot.\n` +
          `3. Computational Power: Both DFAs and NFAs recognize the EXACT SAME CLASS of languages (Regular Languages). Neither can solve non-regular problems like {0^n 1^n}.\n` +
          `4. State Complexity: An NFA with N states can produce a DFA with up to 2^N states upon subset construction.`;
      } else if (q.includes('subset construction') || q.includes('nfa to dfa')) {
        reply = `NFA → DFA Subset Construction Algorithm:\n\n` +
          `1. Start State: The initial DFA state is the ε-closure of the NFA start state {q0}.\n` +
          `2. For each discovered subset of NFA states S and each symbol a ∈ Σ:\n` +
          `   • Compute move(S, a) = union of δ(p, a) for all p ∈ S.\n` +
          `   • Compute ε-closure of that union. This forms the destination DFA state.\n` +
          `3. Final States: Any DFA state containing at least ONE original NFA accepting state becomes a DFA accepting state.\n` +
          `4. Repeat until no new subsets are discovered. Visit our 'Conversion Lab' in the sidebar to view this step-by-step!`;
      } else if (q.includes('epsilon') || q.includes('closure')) {
        reply = `Epsilon Closure (ε-closure):\n\n` +
          `The ε-closure of a state q is the set of all states that can be reached from q by following ONLY ε-transitions (including q itself).\n\n` +
          `Why it matters:\n` +
          `When an ε-NFA is in state q, it is simultaneously in all states in ε-closure(q) before any input character is consumed!`;
      } else if (q.includes('moore') || q.includes('mealy')) {
        reply = `Moore vs. Mealy Machines:\n\n` +
          `• Moore Machine: Outputs are bound directly to STATES: λ: Q → Δ. For input of length N, total output length is N + 1 (emits output of initial state immediately).\n` +
          `• Mealy Machine: Outputs are bound to TRANSITIONS: λ: Q × Σ → Δ. For input of length N, total output length is exactly N.\n\n` +
          `Both models are computationally equivalent and can be converted into each other. Try testing them side-by-side in our Simulator!`;
      } else if (q.includes('minimal') || q.includes('minimization')) {
        reply = `DFA Minimization (Hopcroft Algorithm):\n\n` +
          `A DFA is minimal when no two states are indistinguishable (Myhill-Nerode theorem).\n\n` +
          `Steps:\n` +
          `1. Discard unreachable states from q0 via BFS.\n` +
          `2. Form initial partition P0 = { Non-Final States, Final States }.\n` +
          `3. Iteratively split groups whose states transition to different groups on some alphabet symbol.\n` +
          `4. Merge equivalent states into single composite states.\n\n` +
          `Check out our 'Minimization Lab' in the sidebar for animated partition tables!`;
      } else {
        reply = `Automata Theory Concept Overview:\n\n` +
          `In formal language theory, the Chomsky Hierarchy organizes computation models:\n` +
          `• Regular Languages (Type 3) -> Recognized by DFA, NFA, and described by Regular Expressions.\n` +
          `• Context-Free Languages (Type 2) -> Generated by CFG and recognized by Pushdown Automata (PDA).\n` +
          `• Recursively Enumerable Languages (Type 0) -> Recognized by Turing Machines.\n\n` +
          `Feel free to click any of the suggested prompts below or ask a specific question about your machine!`;
      }

      const botMsg: Message = {
        id: `msg-${Date.now() + 1}`,
        sender: 'tutor',
        text: reply,
        timestamp: 'Just now',
      };
      setMessages(prev => [...prev, botMsg]);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl h-[620px] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Automata AI Tutor & Advisor</span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/30">
                  Interactive Assistant
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Ask theoretical questions or get instant machine diagnostics
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 font-sans text-xs">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                msg.sender === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                }`}
              >
                {msg.sender === 'user' ? 'U' : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] p-3.5 rounded-2xl whitespace-pre-line leading-relaxed shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none font-mono text-xs'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* Suggestions chips */}
        <div className="px-5 py-2 border-t border-slate-800/80 bg-slate-950/40 flex items-center gap-1.5 overflow-x-auto text-[11px]">
          <span className="text-slate-500 flex items-center gap-1 shrink-0">
            <Lightbulb className="w-3 h-3 text-amber-400" /> Prompts:
          </span>
          {suggestions.slice(0, 3).map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(s)}
              className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg whitespace-nowrap transition-colors border border-slate-700/60"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuestion}
              onChange={e => setInputQuestion(e.target.value)}
              placeholder="Ask anything about DFA, NFA, PDA, Turing Machines or your machine..."
              className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-cyan-500 shadow-inner"
            />
            <button
              type="submit"
              className="p-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-xl transition-colors shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
