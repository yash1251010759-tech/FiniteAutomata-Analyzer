import React, { useState } from 'react';
import { learningTopics } from '../../data/curriculumData';
import { LearningTopic } from '../../types/learning';
import { CheckCircle2, Circle, ArrowRight, ExternalLink, AlertTriangle, BookOpen, Lightbulb } from 'lucide-react';
import { NavigationTab } from '../layout/Sidebar';
import { AutomatonDefinition } from '../../types/automata';
import { predefinedAutomata } from '../../data/predefinedExamples';

interface LearnViewProps {
  onNavigate: (tab: NavigationTab) => void;
  onSelectMachine: (machine: AutomatonDefinition) => void;
  completedTopicIds: string[];
  onToggleCompleteTopic: (topicId: string) => void;
}

export const LearnView: React.FC<LearnViewProps> = ({
  onNavigate,
  onSelectMachine,
  completedTopicIds,
  onToggleCompleteTopic,
}) => {
  const [selectedTopicId, setSelectedTopicId] = useState<string>(learningTopics[0].id);

  const currentTopic: LearningTopic =
    learningTopics.find(t => t.id === selectedTopicId) || learningTopics[0];
  const isCompleted = completedTopicIds.includes(currentTopic.id);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* View Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white font-['Outfit']">
          Curriculum & Concept Guide
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          A structured 13-stage learning path from foundational finite state machines to universal Turing computability
        </p>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Topics List (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-3xl p-3 space-y-1.5 shadow-xl max-h-[720px] overflow-y-auto">
          <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Learning Stages ({completedTopicIds.length} / {learningTopics.length} Done)
          </div>

          {learningTopics.map(topic => {
            const isDone = completedTopicIds.includes(topic.id);
            const isSelected = topic.id === selectedTopicId;

            return (
              <button
                key={topic.id}
                onClick={() => setSelectedTopicId(topic.id)}
                className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-950/60 hover:bg-slate-800/80 text-slate-300 border border-slate-900'
                }`}
              >
                <div className="space-y-0.5 overflow-hidden pr-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-indigo-500/20 text-indigo-400'
                      }`}
                    >
                      {topic.category}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold truncate">{topic.title}</h4>
                </div>

                <div className="shrink-0">
                  {isDone ? (
                    <CheckCircle2
                      className={`w-4 h-4 ${
                        isSelected ? 'text-white' : 'text-emerald-400'
                      }`}
                    />
                  ) : (
                    <Circle
                      className={`w-4 h-4 ${
                        isSelected ? 'text-white/40' : 'text-slate-600'
                      }`}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Column: Active Topic Deep Dive (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-6 backdrop-blur-md">
            {/* Header & Toggle Complete */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="space-y-1">
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-lg">
                  {currentTopic.category} • Stage {currentTopic.order}
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-white font-['Outfit']">
                  {currentTopic.title}
                </h3>
                <p className="text-xs text-slate-400">{currentTopic.shortDesc}</p>
              </div>

              <button
                onClick={() => onToggleCompleteTopic(currentTopic.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
                  isCompleted
                    ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/30'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isCompleted ? 'Completed ✓' : 'Mark as Completed'}</span>
              </button>
            </div>

            {/* Formal Mathematical Definition Box */}
            <div className="p-4 bg-slate-950 border border-indigo-950 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold">
                <BookOpen className="w-4 h-4" />
                <span>Formal Mathematical Definition</span>
              </div>
              <p className="text-xs font-mono text-indigo-200 leading-relaxed bg-indigo-950/30 p-3 rounded-xl border border-indigo-900/40">
                {currentTopic.formalDefinition}
              </p>
            </div>

            {/* Conceptual Plain-English Explanation */}
            <div className="space-y-2 text-xs leading-relaxed text-slate-300">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span>Concept Explanation</span>
              </h4>
              <p className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                {currentTopic.explanation}
              </p>
            </div>

            {/* Key Properties & Invariants */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Key Mathematical Properties:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {currentTopic.keyProperties.map((prop, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/70 flex items-start gap-2"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span className="text-slate-300">{prop}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Common Mistakes & Misconceptions */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Common Student Mistakes:</span>
              </h4>
              <div className="space-y-1.5 text-xs">
                {currentTopic.commonMistakes.map((mistake, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-rose-950/20 border border-rose-900/40 rounded-xl text-rose-200"
                  >
                    • {mistake}
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Lab Link & Example Action */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
              <div className="text-xs text-slate-400">
                Practice this concept in the dedicated visual lab:
              </div>

              <div className="flex items-center gap-2">
                {currentTopic.exampleMachineId && (
                  <button
                    onClick={() => {
                      const match = predefinedAutomata.find(
                        m => m.id === currentTopic.exampleMachineId
                      );
                      if (match) {
                        onSelectMachine(match);
                        onNavigate('builder');
                      }
                    }}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
                  >
                    Load Topic Example
                  </button>
                )}

                {currentTopic.interactiveLab && (
                  <button
                    onClick={() => onNavigate(currentTopic.interactiveLab as NavigationTab)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
                  >
                    <span>Launch {currentTopic.category} Lab</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
