import React, { useState, useEffect } from 'react';
import { NavigationTab, Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { DashboardView } from './components/views/DashboardView';
import { LearnView } from './components/views/LearnView';
import { BuilderView } from './components/views/BuilderView';
import { SimulatorView } from './components/views/SimulatorView';
import { GeneratorView } from './components/views/GeneratorView';
import { ConversionLabView } from './components/views/ConversionLabView';
import { MinimizationLabView } from './components/views/MinimizationLabView';
import { RegexLabView } from './components/views/RegexLabView';
import { CfgView } from './components/views/CfgView';
import { PdaView } from './components/views/PdaView';
import { TuringMachineView } from './components/views/TuringMachineView';
import { ComparatorView } from './components/views/ComparatorView';
import { LanguageExplorerView } from './components/views/LanguageExplorerView';
import { PracticeChallengeView } from './components/views/PracticeChallengeView';
import { QuizView } from './components/views/QuizView';
import { ExamView } from './components/views/ExamView';
import { SavedAutomataView } from './components/views/SavedAutomataView';
import { StatisticsView } from './components/views/StatisticsView';
import { SettingsView } from './components/views/SettingsView';

import { AiTutorModal } from './components/views/AiTutorModal';
import { TutorialModal } from './components/views/TutorialModal';
import { ShortcutsModal } from './components/views/ShortcutsModal';

import { AutomatonDefinition } from './types/automata';
import { predefinedAutomata } from './data/predefinedExamples';
import {
  getUserPreferences,
  saveUserPreferences,
  getUserStats,
  saveUserStats,
  saveAutomaton,
  UserPreferences,
  UserProgressStats,
} from './utils/storage';
import { exportAutomatonAsJSON, exportPNG, exportSVG } from './utils/exportUtils';
import {
  LayoutDashboard,
  Hammer,
  PlaySquare,
  Trophy,
  GraduationCap,
} from 'lucide-react';

export function App() {
  // Navigation
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Active Machine
  const [currentMachine, setCurrentMachine] = useState<AutomatonDefinition>(
    predefinedAutomata[1] // Strings ending with 01
  );

  // Modals
  const [isAiTutorOpen, setIsAiTutorOpen] = useState<boolean>(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);

  // Preferences & User Stats
  const [preferences, setPreferences] = useState<UserPreferences>(getUserPreferences);
  const [userStats, setUserStats] = useState<UserProgressStats>(getUserStats);

  // Synchronize Dark / Light mode class on <html> element
  useEffect(() => {
    const root = document.documentElement;
    if (preferences.theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }, [preferences.theme]);

  // Update preferences helper
  const handleUpdatePreferences = (updated: UserPreferences) => {
    setPreferences(updated);
    saveUserPreferences(updated);
  };

  // Update stats helper
  const handleUpdateStats = (newStats: Partial<UserProgressStats>) => {
    const updated = { ...userStats, ...newStats };
    setUserStats(updated);
    saveUserStats(updated);
  };

  // Toggle completed topic
  const handleToggleCompleteTopic = (topicId: string) => {
    const exists = userStats.topicsCompleted.includes(topicId);
    const updatedTopics = exists
      ? userStats.topicsCompleted.filter(id => id !== topicId)
      : [...userStats.topicsCompleted, topicId];
    handleUpdateStats({ topicsCompleted: updatedTopics });
  };

  // Challenge solved handler
  const handleChallengeSolved = (challengeId: string) => {
    if (!userStats.challengesSolved.includes(challengeId)) {
      handleUpdateStats({
        challengesSolved: [...userStats.challengesSolved, challengeId],
      });
    }
  };

  // Quiz score update
  const handleQuizScoreUpdate = (score: number, total: number) => {
    handleUpdateStats({
      quizzesAttempted: userStats.quizzesAttempted + total,
      quizzesCorrect: userStats.quizzesCorrect + score,
    });
  };

  // Exam score update
  const handleExamCompleted = (score: number, total: number) => {
    const percent = Math.round((score / total) * 100);
    handleUpdateStats({
      examsTaken: userStats.examsTaken + 1,
      bestExamScore: Math.max(userStats.bestExamScore, percent),
    });
  };

  // Reset progress
  const handleResetProgress = () => {
    const fresh: UserProgressStats = {
      topicsCompleted: ['topic-intro'],
      quizzesAttempted: 0,
      quizzesCorrect: 0,
      challengesSolved: [],
      examsTaken: 0,
      bestExamScore: 0,
      simulationsRun: 0,
    };
    setUserStats(fresh);
    saveUserStats(fresh);
  };

  // Export actions
  const handleExportPNG = () => {
    const svg = document.querySelector('svg.cursor-grab') as SVGSVGElement | null;
    if (svg) {
      exportPNG(svg, `${currentMachine.name.toLowerCase().replace(/\s+/g, '-')}.png`);
    } else {
      alert('Open the Automata Builder or Simulator tab first to export the visual canvas.');
    }
  };

  const handleExportSVG = () => {
    const svg = document.querySelector('svg.cursor-grab') as SVGSVGElement | null;
    if (svg) {
      exportSVG(svg, `${currentMachine.name.toLowerCase().replace(/\s+/g, '-')}.svg`);
    } else {
      alert('Open the Automata Builder or Simulator tab first to export the visual canvas.');
    }
  };

  const handleExportJSON = () => {
    exportAutomatonAsJSON(currentMachine);
  };

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if focus is in an input or textarea
      const targetTag = (e.target as HTMLElement).tagName;
      if (targetTag === 'INPUT' || targetTag === 'TEXTAREA' || targetTag === 'SELECT') {
        return;
      }

      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        setIsShortcutsOpen(true);
      } else if (e.key === 'Escape') {
        setIsAiTutorOpen(false);
        setIsTutorialOpen(false);
        setIsShortcutsOpen(false);
        setIsMobileSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      className={`min-h-screen ${
        preferences.theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      } flex flex-col font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-200`}
    >
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onOpenAiTutor={() => setIsAiTutorOpen(true)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Top Navbar */}
        <Navbar
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          currentMachine={currentMachine}
          onSelectMachine={setCurrentMachine}
          onOpenAiTutor={() => setIsAiTutorOpen(true)}
          onOpenTutorial={() => setIsTutorialOpen(true)}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
          onExportPNG={handleExportPNG}
          onExportSVG={handleExportSVG}
          onExportJSON={handleExportJSON}
          isAdvancedMode={preferences.mode === 'advanced'}
          onToggleAdvancedMode={() =>
            handleUpdatePreferences({
              ...preferences,
              mode: preferences.mode === 'advanced' ? 'beginner' : 'advanced',
            })
          }
          isDarkMode={preferences.theme === 'dark'}
          onToggleDarkMode={() =>
            handleUpdatePreferences({
              ...preferences,
              theme: preferences.theme === 'dark' ? 'light' : 'dark',
            })
          }
        />

        {/* View Switcher Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-12">
          {currentTab === 'dashboard' && (
            <DashboardView
              onNavigate={setCurrentTab}
              onSelectMachine={m => {
                setCurrentMachine(m);
                setCurrentTab('builder');
              }}
              userStats={userStats}
            />
          )}

          {currentTab === 'learn' && (
            <LearnView
              onNavigate={setCurrentTab}
              onSelectMachine={m => {
                setCurrentMachine(m);
                setCurrentTab('builder');
              }}
              completedTopicIds={userStats.topicsCompleted}
              onToggleCompleteTopic={handleToggleCompleteTopic}
            />
          )}

          {currentTab === 'builder' && (
            <BuilderView
              machine={currentMachine}
              onChangeMachine={updated => {
                setCurrentMachine(updated);
                saveAutomaton(updated);
              }}
              isAdvancedMode={preferences.mode === 'advanced'}
            />
          )}

          {currentTab === 'simulator' && (
            <SimulatorView
              machine={currentMachine}
              onChangeMachine={setCurrentMachine}
            />
          )}

          {currentTab === 'generator' && (
            <GeneratorView
              onLoadIntoBuilder={m => {
                setCurrentMachine(m);
                saveAutomaton(m);
              }}
              onNavigate={setCurrentTab}
            />
          )}

          {currentTab === 'conversion' && (
            <ConversionLabView
              currentMachine={currentMachine}
              onLoadIntoBuilder={m => {
                setCurrentMachine(m);
                saveAutomaton(m);
              }}
              onNavigate={setCurrentTab}
            />
          )}

          {currentTab === 'minimization' && (
            <MinimizationLabView
              currentMachine={currentMachine}
              onLoadIntoBuilder={m => {
                setCurrentMachine(m);
                saveAutomaton(m);
              }}
              onNavigate={setCurrentTab}
            />
          )}

          {currentTab === 'regex' && (
            <RegexLabView
              currentMachine={currentMachine}
              onLoadIntoBuilder={m => {
                setCurrentMachine(m);
                saveAutomaton(m);
              }}
              onNavigate={setCurrentTab}
            />
          )}

          {currentTab === 'cfg' && <CfgView />}

          {currentTab === 'pda' && <PdaView />}

          {currentTab === 'turing' && <TuringMachineView />}

          {currentTab === 'comparator' && (
            <ComparatorView currentMachine={currentMachine} />
          )}

          {currentTab === 'debugger' && (
            <BuilderView
              machine={currentMachine}
              onChangeMachine={setCurrentMachine}
              isAdvancedMode={preferences.mode === 'advanced'}
            />
          )}

          {currentTab === 'language' && (
            <LanguageExplorerView machine={currentMachine} />
          )}

          {currentTab === 'practice' && (
            <PracticeChallengeView
              onChallengeSolved={handleChallengeSolved}
              solvedChallengeIds={userStats.challengesSolved}
            />
          )}

          {currentTab === 'quiz' && (
            <QuizView onQuizScoreUpdate={handleQuizScoreUpdate} />
          )}

          {currentTab === 'exam' && (
            <ExamView onExamCompleted={handleExamCompleted} />
          )}

          {currentTab === 'saved' && (
            <SavedAutomataView
              onSelectMachine={m => {
                setCurrentMachine(m);
                setCurrentTab('builder');
              }}
              onNavigate={setCurrentTab}
            />
          )}

          {currentTab === 'statistics' && <StatisticsView stats={userStats} />}

          {currentTab === 'settings' && (
            <SettingsView
              preferences={preferences}
              onUpdatePreferences={handleUpdatePreferences}
              onResetProgress={handleResetProgress}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Quick Navigation Bar (Sticky Thumb Access) */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-slate-950/95 border-t border-slate-800 backdrop-blur-md px-3 py-2 flex items-center justify-around">
        <button
          onClick={() => setCurrentTab('dashboard')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
            currentTab === 'dashboard' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Home</span>
        </button>

        <button
          onClick={() => setCurrentTab('builder')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
            currentTab === 'builder' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Hammer className="w-4 h-4" />
          <span>Builder</span>
        </button>

        <button
          onClick={() => setCurrentTab('simulator')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
            currentTab === 'simulator' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          }`}
        >
          <PlaySquare className="w-4 h-4" />
          <span>Simulate</span>
        </button>

        <button
          onClick={() => setCurrentTab('practice')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
            currentTab === 'practice' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Practice</span>
        </button>

        <button
          onClick={() => setCurrentTab('learn')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
            currentTab === 'learn' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Learn</span>
        </button>
      </nav>

      {/* Global Modals */}
      <AiTutorModal
        isOpen={isAiTutorOpen}
        onClose={() => setIsAiTutorOpen(false)}
        currentMachine={currentMachine}
      />

      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        onLoadStarterDfa={() => {
          setCurrentMachine(predefinedAutomata[1]);
          setCurrentTab('builder');
        }}
        onNavigateTab={(tab) => {
          setCurrentTab(tab);
          setIsTutorialOpen(false);
        }}
      />

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}

export default App;
