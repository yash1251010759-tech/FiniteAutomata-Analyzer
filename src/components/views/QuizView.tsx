import React, { useState } from 'react';
import { quizQuestions } from '../../data/quizData';
import { QuizQuestion } from '../../types/learning';
import { HelpCircle, CheckCircle2, XCircle, RotateCcw, ArrowRight, Lightbulb, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuizViewProps {
  onQuizScoreUpdate?: (score: number, total: number) => void;
}

export const QuizView: React.FC<QuizViewProps> = ({ onQuizScoreUpdate }) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qId: string]: number }>({});
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const currentQ: QuizQuestion = quizQuestions[currentIndex];
  const totalQuestions = quizQuestions.length;

  const handleSelectOption = (optIndex: number) => {
    if (selectedAnswers[currentQ.id] !== undefined) return; // already answered
    setSelectedAnswers(prev => ({ ...prev, [currentQ.id]: optIndex }));
    setShowExplanation(true);
  };

  const handleNext = () => {
    setShowExplanation(false);
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsCompleted(true);
      // Calculate score
      let score = 0;
      quizQuestions.forEach(q => {
        if (selectedAnswers[q.id] === q.correctIndex) score++;
      });
      if (score >= totalQuestions * 0.7) {
        confetti({ particleCount: 80, spread: 60 });
      }
      if (onQuizScoreUpdate) onQuizScoreUpdate(score, totalQuestions);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedAnswers({});
    setShowExplanation(false);
    setIsCompleted(false);
  };

  const currentAnswer = selectedAnswers[currentQ.id];
  const isAnswered = currentAnswer !== undefined;
  const isCorrect = isAnswered && currentAnswer === currentQ.correctIndex;

  // Compute final score
  let correctCount = 0;
  quizQuestions.forEach(q => {
    if (selectedAnswers[q.id] === q.correctIndex) correctCount++;
  });

  return (
    <div className="space-y-6 pb-12 max-w-3xl mx-auto animate-in fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-['Outfit'] flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-indigo-400" />
            <span>Automata Theory Quiz</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Interactive multiple-choice & concept tests with instant theoretical explanations
          </p>
        </div>

        {!isCompleted && (
          <div className="text-right font-mono text-xs">
            <span className="text-slate-500 block text-[10px]">PROGRESS</span>
            <span className="text-indigo-400 font-bold">
              {currentIndex + 1} / {totalQuestions}
            </span>
          </div>
        )}
      </div>

      {!isCompleted ? (
        /* Active Question Card */
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-6 backdrop-blur-md">
          {/* Question Meta */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg">
              {currentQ.topicTitle}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              Difficulty: {currentQ.difficulty}
            </span>
          </div>

          {/* Question Text */}
          <h3 className="text-base sm:text-lg font-bold text-white font-['Outfit'] leading-relaxed">
            {currentQ.question}
          </h3>

          {currentQ.sampleString && (
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-indigo-300">
              Sample String under test: "{currentQ.sampleString}"
            </div>
          )}

          {/* Options List */}
          <div className="space-y-2.5">
            {currentQ.options.map((opt, idx) => {
              const isSelected = currentAnswer === idx;
              const isOptionCorrect = idx === currentQ.correctIndex;

              let btnStyle =
                'bg-slate-950/80 hover:bg-slate-800/80 text-slate-200 border-slate-800';

              if (isAnswered) {
                if (isOptionCorrect) {
                  btnStyle = 'bg-emerald-950/50 border-emerald-500/80 text-emerald-200 font-bold';
                } else if (isSelected) {
                  btnStyle = 'bg-rose-950/50 border-rose-500/80 text-rose-200 font-bold';
                } else {
                  btnStyle = 'bg-slate-950/40 opacity-50 border-slate-900 text-slate-400';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={isAnswered}
                  className={`w-full p-4 rounded-2xl border text-left text-xs sm:text-sm transition-all flex items-center justify-between ${btnStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-800/80 text-slate-300 flex items-center justify-center font-mono text-xs shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{opt}</span>
                  </div>

                  {isAnswered && (
                    <div className="shrink-0 ml-2">
                      {isOptionCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : isSelected ? (
                        <XCircle className="w-4 h-4 text-rose-400" />
                      ) : null}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation Box */}
          {showExplanation && (
            <div
              className={`p-4 rounded-2xl border space-y-2 text-xs leading-relaxed animate-in fade-in ${
                isCorrect
                  ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-200'
                  : 'bg-rose-950/30 border-rose-800/50 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span>Explanation & Rationale:</span>
              </div>
              <p className="font-sans">{currentQ.explanation}</p>
            </div>
          )}

          {/* Action Footer */}
          {isAnswered && (
            <div className="flex justify-end pt-2">
              <button
                onClick={handleNext}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5"
              >
                <span>{currentIndex < totalQuestions - 1 ? 'Next Question' : 'View Results'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Quiz Completion Card */
        <div className="p-8 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl text-center space-y-6 backdrop-blur-md">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Trophy className="w-8 h-8 text-amber-400" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-white font-['Outfit']">Quiz Completed!</h3>
            <p className="text-slate-400 text-xs">
              Here is your overall performance breakdown
            </p>
          </div>

          <div className="p-6 bg-slate-950 rounded-3xl border border-slate-800 inline-block px-12">
            <div className="text-4xl font-extrabold text-white font-mono">
              {correctCount} / {totalQuestions}
            </div>
            <div className="text-xs text-indigo-400 font-bold uppercase tracking-wider mt-1">
              {Math.round((correctCount / totalQuestions) * 100)}% Accuracy
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleRestart}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors inline-flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry Quiz</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
