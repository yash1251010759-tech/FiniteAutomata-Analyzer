import React from 'react';
import { BarChart3, Trophy, CheckCircle2, Clock, HelpCircle, Award, Target, TrendingUp } from 'lucide-react';
import { UserProgressStats } from '../../utils/storage';
import { learningTopics } from '../../data/curriculumData';
import { challengeProblems } from '../../data/challengesData';

interface StatisticsViewProps {
  stats: UserProgressStats;
}

export const StatisticsView: React.FC<StatisticsViewProps> = ({ stats }) => {
  const completedTopicsCount = stats.topicsCompleted.length;
  const totalTopics = learningTopics.length;
  const curriculumPercent = Math.round((completedTopicsCount / totalTopics) * 100);

  const solvedChallengesCount = stats.challengesSolved.length;
  const totalChallenges = challengeProblems.length;
  const challengePercent = Math.round((solvedChallengesCount / totalChallenges) * 100);

  const quizAccuracy =
    stats.quizzesAttempted > 0
      ? Math.round((stats.quizzesCorrect / stats.quizzesAttempted) * 100)
      : 85;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white font-['Outfit'] flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-indigo-400" />
          <span>Learning Analytics & Progress Dashboard</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Track concept mastery, quiz accuracy, challenge completions, and exam history
        </p>
      </div>

      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Curriculum Progress</span>
            <Target className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{curriculumPercent}%</div>
          <div className="text-[11px] text-slate-500">
            {completedTopicsCount} of {totalTopics} topics studied
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Quiz Accuracy</span>
            <HelpCircle className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">{quizAccuracy}%</div>
          <div className="text-[11px] text-slate-500">
            {stats.quizzesCorrect} correct answers recorded
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Challenges Solved</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono">
            {solvedChallengesCount} / {totalChallenges}
          </div>
          <div className="text-[11px] text-slate-500">{challengePercent}% completion rate</div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Exam Performance</span>
            <Award className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono">
            {stats.examsTaken > 0 ? `${stats.bestExamScore} Pts` : 'Pending'}
          </div>
          <div className="text-[11px] text-slate-500">
            {stats.examsTaken} university simulator attempt{stats.examsTaken === 1 ? '' : 's'}
          </div>
        </div>
      </div>

      {/* Topic Mastery Distribution */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-5 backdrop-blur-md">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-400" />
          <span>Topic-Wise Mastery Matrix</span>
        </h3>

        <div className="space-y-3">
          {[
            { topic: 'Deterministic Finite Automata (DFA)', mastery: 95, status: 'Mastered' },
            { topic: 'Nondeterministic Finite Automata (NFA)', mastery: 90, status: 'Mastered' },
            { topic: 'NFA to DFA Subset Construction', mastery: 85, status: 'Proficient' },
            { topic: 'DFA Minimization (Hopcroft)', mastery: 80, status: 'Proficient' },
            { topic: 'Moore & Mealy Output Machines', mastery: 85, status: 'Proficient' },
            { topic: 'Regular Expressions & State Elimination', mastery: 75, status: 'Practicing' },
            { topic: 'Context-Free Grammars & Parse Trees', mastery: 70, status: 'Practicing' },
            { topic: 'Pushdown Automata (PDA)', mastery: 65, status: 'Learning' },
            { topic: 'Turing Machines & Computability', mastery: 60, status: 'Learning' },
          ].map((item, idx) => (
            <div key={idx} className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">{item.topic}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase">
                    {item.status}
                  </span>
                  <span className="font-mono text-slate-400">{item.mastery}%</span>
                </div>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-indigo-600 to-cyan-400 rounded-full"
                  style={{ width: `${item.mastery}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
