import React, { useState } from 'react';
import { BookOpen, CheckCircle2, ChevronRight, ChevronLeft, X, Sparkles } from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadStarterDfa?: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({
  isOpen,
  onClose,
  onLoadStarterDfa,
}) => {
  if (!isOpen) return null;

  const [step, setStep] = useState<number>(0);

  const tutorialSteps = [
    {
      title: 'Welcome to the Automata Lab!',
      badge: 'Getting Started',
      instruction:
        'This interactive laboratory is designed to help you construct, simulate, convert, compare, and master all concepts from Automata Theory and Formal Languages.',
      details: [
        'Explore 21 integrated environments: DFA, NFA, Moore, Mealy, Regex, CFG, PDA, and Turing Machines.',
        'Use the top menu to quickly select from curated university exam examples or build your own from scratch.',
        'All conversion and minimization algorithms are 100% genuine and verified.',
      ],
    },
    {
      title: 'Step 1: Creating State Nodes',
      badge: 'Canvas Builder',
      instruction:
        'In the Automata Builder canvas, click the "+ Add State" button to create new state circles (q0, q1, etc.).',
      details: [
        'Drag state nodes freely to reposition them on the 2D infinite grid.',
        'Click any node to reveal the action bar at the bottom-left of the canvas.',
        'You can rename states or specify custom descriptions at any time.',
      ],
    },
    {
      title: 'Step 2: Designating Start & Final States',
      badge: 'State Semantics',
      instruction:
        'Every valid automaton requires an initial Start State and usually one or more Accepting (Final) States.',
      details: [
        'Select a state and click "Set as Start": a bold incoming arrow (→) indicates the entry point.',
        'Click "Set as Final": the standard double concentric circle (◎) indicates acceptance.',
        'For Moore machines, you can also define the state output symbol (e.g. q0 / 0).',
      ],
    },
    {
      title: 'Step 3: Connecting Directed Transitions',
      badge: 'Transition Function',
      instruction:
        'Connect states by clicking "Connect" (or clicking source then target node).',
      details: [
        'Specify alphabet symbols separated by commas (e.g. "0, 1" or "ε").',
        'Self-loops (q0 → q0) automatically arc gracefully over the top of the node.',
        'Bidirectional paths (q0 ⇄ q1) curve smoothly so transitions never overlap or obscure each other.',
      ],
    },
    {
      title: 'Step 4: Step-by-Step String Simulation',
      badge: 'Execution Trace',
      instruction:
        'Switch to the Simulator tab, enter any test string (e.g. "1011"), and run the engine.',
      details: [
        'Use Play, Pause, Previous, and Next buttons to step through the computation.',
        'The tape ribbon highlights the current character, and the canvas pulses the active state.',
        'Check the "Why Accepted / Why Rejected" panel for complete formal rationales.',
      ],
    },
    {
      title: 'Step 5: Conversion, Minimization & Practice',
      badge: 'Advanced Mastery',
      instruction:
        'Take your learning further with dedicated algorithmic labs and assessment modes.',
      details: [
        'Conversion Lab: Inspect NFA → DFA Subset Construction step-by-step.',
        'Minimization Lab: Run Hopcroft table partitioning with side-by-side state reduction.',
        'Challenge Mode & Exam Simulator: Test your knowledge under timed exam conditions with automated grading!',
      ],
    },
  ];

  const current = tutorialSteps[step];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative space-y-5">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step progress pills */}
        <div className="flex items-center gap-1.5">
          {tutorialSteps.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                idx === step ? 'bg-indigo-500' : idx < step ? 'bg-indigo-800' : 'bg-slate-800'
              }`}
            />
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg">
              {current.badge}
            </span>
            <span className="text-xs text-slate-500">
              {step + 1} of {tutorialSteps.length}
            </span>
          </div>
          <h3 className="text-lg font-bold text-white font-['Outfit']">{current.title}</h3>
          <p className="text-xs text-slate-300 leading-relaxed">{current.instruction}</p>
        </div>

        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2 text-xs text-slate-300">
          {current.details.map((d, i) => (
            <div key={i} className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
              <span>{d}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            Skip Tutorial
          </button>

          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            {step < tutorialSteps.length - 1 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors flex items-center gap-1 shadow-md shadow-indigo-600/30"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => {
                  if (onLoadStarterDfa) onLoadStarterDfa();
                  onClose();
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl transition-all shadow-lg shadow-indigo-600/30"
              >
                Start Exploring!
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
