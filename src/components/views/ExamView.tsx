import React, { useState, useEffect } from 'react';
import { universityExamQuestions } from '../../data/examData';
import { ExamQuestion } from '../../types/learning';
import { Clock, CheckCircle2, XCircle, Bookmark, ArrowRight, ArrowLeft, Trophy, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ExamViewProps {
  onExamCompleted?: (score: number, total: number) => void;
}

export const ExamView: React.FC<ExamViewProps> = ({ onExamCompleted }) => {
  const [examStarted, setExamStarted] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<{ [qId: string]: number }>({});
  const [markedForReview, setMarkedForReview] = useState<string[]>([]);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(20 * 60); // 20 minutes
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const totalQuestions = universityExamQuestions.length;
  const currentQ: ExamQuestion = universityExamQuestions[currentIndex];

  // Timer countdown
  useEffect(() => {
    let timer: any;
    if (examStarted && !isSubmitted && timeRemainingSeconds > 0) {
      timer = setInterval(() => {
        setTimeRemainingSeconds(prev => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [examStarted, isSubmitted, timeRemainingSeconds]);

  const handleStartExam = () => {
    setExamStarted(true);
    setCurrentIndex(0);
    setUserAnswers({});
    setMarkedForReview([]);
    setTimeRemainingSeconds(20 * 60);
    setIsSubmitted(false);
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    let score = 0;
    universityExamQuestions.forEach(q => {
      if (userAnswers[q.id] === q.correctIndex) score++;
    });
    if (score >= totalQuestions * 0.7) {
      confetti({ particleCount: 90, spread: 70 });
    }
    if (onExamCompleted) onExamCompleted(score, totalQuestions);
  };

  const toggleMarkForReview = (qId: string) => {
    setMarkedForReview(prev =>
      prev.includes(qId) ? prev.filter(id => id !== qId) : [...prev, qId]
    );
  };

  // Format time MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Calculate final score
  let totalScore = 0;
  universityExamQuestions.forEach(q => {
    if (userAnswers[q.id] === q.correctIndex) totalScore++;
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {!examStarted ? (
        /* Exam Intro Card */
        <div className="max-w-2xl mx-auto p-8 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl text-center space-y-6 backdrop-blur-md">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
            <Clock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white font-['Outfit']">
              Formal Languages University Exam Simulator
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
              Experience authentic university exam conditions covering DFA, NFA, Moore, Mealy, Regex, CFG, PDA, and Turing Machines.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto font-mono text-xs">
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
              <span className="text-slate-500 text-[10px] block font-sans">DURATION</span>
              <strong className="text-white">20 Mins</strong>
            </div>
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
              <span className="text-slate-500 text-[10px] block font-sans">QUESTIONS</span>
              <strong className="text-indigo-400">{totalQuestions} Items</strong>
            </div>
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
              <span className="text-slate-500 text-[10px] block font-sans">PASS MARK</span>
              <strong className="text-emerald-400">70%</strong>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleStartExam}
              className="px-8 py-3 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold rounded-2xl text-sm shadow-xl shadow-rose-600/30 transition-all active:scale-95"
            >
              Begin Examination
            </button>
          </div>
        </div>
      ) : !isSubmitted ? (
        /* Active Exam Arena */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Question View (8 cols) */}
          <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 backdrop-blur-md">
            {/* Question Top Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
                  Question {currentIndex + 1} of {totalQuestions}
                </span>
                <span className="text-xs text-slate-400">{currentQ.topicTitle}</span>
              </div>

              <button
                onClick={() => toggleMarkForReview(currentQ.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-colors ${
                  markedForReview.includes(currentQ.id)
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Mark for Review</span>
              </button>
            </div>

            {/* Question Body */}
            <h3 className="text-base sm:text-lg font-bold text-white font-['Outfit'] leading-relaxed">
              {currentQ.question}
            </h3>

            {/* Options */}
            <div className="space-y-3">
              {currentQ.options.map((opt, idx) => {
                const isSelected = userAnswers[currentQ.id] === idx;

                return (
                  <button
                    key={idx}
                    onClick={() =>
                      setUserAnswers(prev => ({ ...prev, [currentQ.id]: idx }))
                    }
                    className={`w-full p-4 rounded-2xl border text-left text-xs sm:text-sm transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-600/30 border-indigo-500'
                        : 'bg-slate-950/70 hover:bg-slate-800/80 text-slate-300 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{opt}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bottom Nav Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                onClick={() => currentIndex > 0 && setCurrentIndex(currentIndex - 1)}
                disabled={currentIndex === 0}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <button
                onClick={() =>
                  currentIndex < totalQuestions - 1 && setCurrentIndex(currentIndex + 1)
                }
                disabled={currentIndex >= totalQuestions - 1}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right Question Palette & Timer (4 cols) */}
          <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-5 backdrop-blur-md">
            {/* Timer Box */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center space-y-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                Time Remaining
              </span>
              <div
                className={`text-2xl font-mono font-extrabold ${
                  timeRemainingSeconds < 300 ? 'text-rose-400 animate-pulse' : 'text-cyan-400'
                }`}
              >
                {formatTime(timeRemainingSeconds)}
              </div>
            </div>

            {/* Questions Grid Palette */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Question Palette:
              </span>
              <div className="grid grid-cols-5 gap-2">
                {universityExamQuestions.map((q, idx) => {
                  const isAnswered = userAnswers[q.id] !== undefined;
                  const isMarked = markedForReview.includes(q.id);
                  const isCurrent = currentIndex === idx;

                  let badgeColor = 'bg-slate-950 text-slate-400 border-slate-800';
                  if (isMarked) {
                    badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
                  } else if (isAnswered) {
                    badgeColor = 'bg-indigo-600 text-white border-indigo-500';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-9 rounded-xl font-mono text-xs font-bold border transition-all ${badgeColor} ${
                        isCurrent ? 'ring-2 ring-cyan-400 scale-105' : ''
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="text-[11px] text-slate-400 space-y-1 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-indigo-600" />
                <span>Answered ({Object.keys(userAnswers).length})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-amber-500/40 border border-amber-500" />
                <span>Marked for Review ({markedForReview.length})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-slate-950 border border-slate-800" />
                <span>Unattempted ({totalQuestions - Object.keys(userAnswers).length})</span>
              </div>
            </div>

            {/* Submit Exam Button */}
            <div className="pt-2">
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to submit your exam now? Answers cannot be changed.')) {
                    handleSubmit();
                  }
                }}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
              >
                Submit Examination
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Exam Results Report Card */
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="p-8 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl text-center space-y-6 backdrop-blur-md">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-amber-400" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-white font-['Outfit']">
                Examination Evaluation Report
              </h2>
              <p className="text-xs text-slate-400">
                Official grading breakdown and solution review
              </p>
            </div>

            <div className="p-6 bg-slate-950 rounded-3xl border border-slate-800 inline-block px-12">
              <div className="text-4xl font-extrabold text-white font-mono">
                {totalScore} / {totalQuestions}
              </div>
              <div
                className={`text-xs font-bold uppercase tracking-wider mt-1 ${
                  totalScore >= totalQuestions * 0.7 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {Math.round((totalScore / totalQuestions) * 100)}% •{' '}
                {totalScore >= totalQuestions * 0.7 ? 'PASSED ✓' : 'NEEDS PRACTICE ✗'}
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleStartExam}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors inline-flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retake Exam</span>
              </button>
            </div>
          </div>

          {/* Detailed Question Review */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider px-2">
              Question-by-Question Review & Rationales:
            </h3>

            {universityExamQuestions.map((q, idx) => {
              const userAns = userAnswers[q.id];
              const isCorrect = userAns === q.correctIndex;

              return (
                <div
                  key={q.id}
                  className={`p-5 rounded-2xl border space-y-3 text-xs ${
                    isCorrect
                      ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-200'
                      : 'bg-rose-950/20 border-rose-900/40 text-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="font-mono text-white">
                      Question {idx + 1}: {q.topicTitle}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                        isCorrect
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {isCorrect ? 'Correct ✓' : 'Incorrect ✗'}
                    </span>
                  </div>

                  <p className="font-semibold text-slate-200 text-sm leading-relaxed">
                    {q.question}
                  </p>

                  <div className="space-y-1 font-mono text-xs">
                    <div>
                      Your answer:{' '}
                      <strong className={isCorrect ? 'text-emerald-400' : 'text-rose-400'}>
                        {userAns !== undefined ? q.options[userAns] : 'None (Skipped)'}
                      </strong>
                    </div>
                    <div>
                      Correct answer:{' '}
                      <strong className="text-emerald-400">{q.options[q.correctIndex]}</strong>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/60 font-sans leading-relaxed">
                    💡 <strong>Explanation:</strong> {q.explanation}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
