import React from 'react';
import {
  Sparkles,
  Hammer,
  GraduationCap,
  PlaySquare,
  Trophy,
  Clock,
  ArrowRight,
  GitFork,
  Minimize2,
  Workflow,
  Layers,
  Binary,
  CheckCircle2,
  Compass,
} from 'lucide-react';
import { NavigationTab } from '../layout/Sidebar';
import { AutomatonDefinition } from '../../types/automata';
import { predefinedAutomata } from '../../data/predefinedExamples';
import { learningTopics } from '../../data/curriculumData';

interface DashboardViewProps {
  onNavigate: (tab: NavigationTab) => void;
  onSelectMachine: (machine: AutomatonDefinition) => void;
  userStats: {
    topicsCompleted: string[];
    quizzesAttempted: number;
    challengesSolved: string[];
    examsTaken: number;
  };
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onSelectMachine,
  userStats,
}) => {
  const completedTopicsCount = userStats.topicsCompleted.length;
  const progressPercent = Math.round((completedTopicsCount / learningTopics.length) * 100);

  return (
    <div className="space-y-8 pb-12 animate-in fade-in">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-950 border border-indigo-900/40 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Interactive Theory of Computation Laboratory</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight font-['Outfit']">
            Master Automata Theory with Interactive Visual Simulations
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Construct state diagrams, simulate string traces, run real subset constructions,
            minimize DFAs, test PDA stacks, and trace Turing Machines with formal mathematical precision.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('builder')}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              <Hammer className="w-4 h-4" />
              <span>Launch Builder</span>
            </button>

            <button
              onClick={() => onNavigate('generator')}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs sm:text-sm font-semibold border border-slate-700 transition-all"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Natural Language Generator</span>
            </button>

            <button
              onClick={() => onNavigate('learn')}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs sm:text-sm font-semibold border border-slate-800 transition-all"
            >
              <GraduationCap className="w-4 h-4 text-indigo-400" />
              <span>Curriculum Path</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Action Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate('builder')}
          className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-indigo-500/60 hover:bg-slate-900 transition-all cursor-pointer group shadow-lg"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Hammer className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
            Automata Builder
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Drag, connect, and design DFA, NFA, ε-NFA, Moore, and Mealy machines on an infinite canvas.
          </p>
        </div>

        <div
          onClick={() => onNavigate('simulator')}
          className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-cyan-500/60 hover:bg-slate-900 transition-all cursor-pointer group shadow-lg"
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <PlaySquare className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
            String Simulator
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Step-by-step tape playback, instantaneous descriptions, and acceptance rationales.
          </p>
        </div>

        <div
          onClick={() => onNavigate('practice')}
          className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-amber-500/60 hover:bg-slate-900 transition-all cursor-pointer group shadow-lg"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Trophy className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
            Challenge Mode
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Solve construction challenges with automated test suites and counterexample search.
          </p>
        </div>

        <div
          onClick={() => onNavigate('exam')}
          className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-rose-500/60 hover:bg-slate-900 transition-all cursor-pointer group shadow-lg"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white group-hover:text-rose-400 transition-colors">
            Exam Simulator
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Timed university exam simulator with 20 questions and comprehensive topic reports.
          </p>
        </div>
      </div>

      {/* Learning Progress Section */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white font-['Outfit']">
              Your Learning Path Progress
            </h2>
            <p className="text-xs text-slate-400">
              {completedTopicsCount} of {learningTopics.length} formal topics completed
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-lg font-extrabold text-indigo-400 font-mono">
                {progressPercent}%
              </span>
              <span className="text-[10px] text-slate-500 block">Mastery</span>
            </div>
            <button
              onClick={() => onNavigate('learn')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <span>Continue Learning</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.max(5, progressPercent)}%` }}
          />
        </div>

        {/* Learning stages preview chips */}
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {learningTopics.slice(0, 7).map((t, idx) => {
            const isDone = userStats.topicsCompleted.includes(t.id);
            return (
              <div
                key={t.id}
                onClick={() => onNavigate('learn')}
                className={`px-3 py-1.5 rounded-xl border text-xs font-medium shrink-0 cursor-pointer transition-all flex items-center gap-1.5 ${
                  isDone
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <span className="w-3.5 h-3.5 rounded-full border border-slate-600 text-[9px] flex items-center justify-center font-mono">
                    {idx + 1}
                  </span>
                )}
                <span>{t.title.split('. ')[1] || t.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pre-built University Examples Showcase */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white font-['Outfit']">
              Featured Predefined Automata
            </h2>
            <p className="text-xs text-slate-400">
              Click any classic machine to immediately inspect, simulate, or edit it
            </p>
          </div>

          <button
            onClick={() => onNavigate('saved')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {predefinedAutomata.slice(0, 6).map(machine => (
            <div
              key={machine.id}
              onClick={() => {
                onSelectMachine(machine);
                onNavigate('builder');
              }}
              className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 transition-all cursor-pointer group space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg">
                  {machine.type}
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  {machine.states.length} states • Σ={machine.alphabet.join(',')}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                  {machine.name}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                  {machine.description}
                </p>
              </div>

              <div className="flex items-center justify-between text-xs text-indigo-400 font-semibold pt-1">
                <span>Load in Builder</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Advanced Formal Labs Showcase */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-bold text-white font-['Outfit']">
            Formal Labs & Visualizers
          </h2>
          <p className="text-xs text-slate-400">
            Dedicated algorithmic environments for advanced automata theory
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { id: 'conversion', title: 'Conversion Lab', desc: 'NFA to DFA', icon: GitFork, color: 'text-indigo-400' },
            { id: 'minimization', title: 'Minimization Lab', desc: 'Hopcroft Partitioning', icon: Minimize2, color: 'text-purple-400' },
            { id: 'regex', title: 'Regex Lab', desc: 'Thompson Construction', icon: Sparkles, color: 'text-pink-400' },
            { id: 'cfg', title: 'CFG Visualizer', desc: 'Parse Tree Builder', icon: Workflow, color: 'text-cyan-400' },
            { id: 'pda', title: 'PDA Visualizer', desc: 'Stack Operations', icon: Layers, color: 'text-emerald-400' },
            { id: 'turing', title: 'Turing Machine', desc: 'Infinite Tape Engine', icon: Binary, color: 'text-amber-400' },
          ].map(lab => {
            const Icon = lab.icon;
            return (
              <div
                key={lab.id}
                onClick={() => onNavigate(lab.id as NavigationTab)}
                className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 transition-all cursor-pointer text-center space-y-2 group"
              >
                <div className="w-9 h-9 mx-auto rounded-xl bg-slate-800/80 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icon className={`w-4 h-4 ${lab.color}`} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white truncate">{lab.title}</h4>
                  <p className="text-[10px] text-slate-500 truncate">{lab.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
