import React from 'react';
import {
  Menu,
  Sparkles,
  BookOpen,
  Keyboard,
  Download,
  Share2,
  FolderOpen,
  Eye,
  Sliders,
  Sun,
  Moon,
} from 'lucide-react';
import { AutomatonDefinition } from '../../types/automata';
import { predefinedAutomata } from '../../data/predefinedExamples';

interface NavbarProps {
  onOpenMobileSidebar: () => void;
  currentMachine: AutomatonDefinition;
  onSelectMachine: (machine: AutomatonDefinition) => void;
  onOpenAiTutor: () => void;
  onOpenTutorial: () => void;
  onOpenShortcuts: () => void;
  onExportPNG: () => void;
  onExportSVG: () => void;
  onExportJSON: () => void;
  isAdvancedMode: boolean;
  onToggleAdvancedMode: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenMobileSidebar,
  currentMachine,
  onSelectMachine,
  onOpenAiTutor,
  onOpenTutorial,
  onOpenShortcuts,
  onExportPNG,
  onExportSVG,
  onExportJSON,
  isAdvancedMode,
  onToggleAdvancedMode,
  isDarkMode,
  onToggleDarkMode,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 bg-slate-950/80 border-b border-slate-800 backdrop-blur-md">
      {/* Left items: Mobile menu button & Current machine badge */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl transition-colors"
          title="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Machine Switcher Pill */}
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-lg">
            {currentMachine.type}
          </span>

          <div className="relative group">
            <select
              value={currentMachine.id}
              onChange={e => {
                const found = predefinedAutomata.find(m => m.id === e.target.value);
                if (found) onSelectMachine(found);
              }}
              className="appearance-none bg-slate-900/90 border border-slate-700 hover:border-slate-600 text-slate-200 text-xs font-semibold rounded-xl pl-3 pr-8 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-sm truncate max-w-[200px] sm:max-w-xs"
            >
              {predefinedAutomata.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.type})
                </option>
              ))}
            </select>
            <FolderOpen className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Right items: Action buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Beginner / Advanced Mode Toggle */}
        <button
          onClick={onToggleAdvancedMode}
          className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${
            isAdvancedMode
              ? 'bg-purple-950/60 text-purple-300 border-purple-700/50'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
          title={isAdvancedMode ? 'Switch to Beginner Mode' : 'Switch to Advanced Mode'}
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden md:inline">{isAdvancedMode ? 'Advanced' : 'Beginner'}</span>
        </button>

        {/* Keyboard Shortcuts Button */}
        <button
          onClick={onOpenShortcuts}
          className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-900 border border-slate-800 rounded-xl transition-colors"
          title="Keyboard Shortcuts (Ctrl+Z, Space, etc.)"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        {/* Guided Tutorial Academy Button (Adjacent to Ask AI) */}
        <button
          onClick={onOpenTutorial}
          className="relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-200 bg-gradient-to-r from-indigo-950/80 to-purple-950/80 hover:from-indigo-900 hover:to-purple-900 border border-indigo-700/60 hover:border-indigo-500 rounded-xl transition-all shadow-md group"
          title="Interactive Automata Academy: Step-by-Step Curriculum, Examples & Deep Concept Guides"
        >
          <BookOpen className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
          <span>Tutorial</span>
          <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide bg-indigo-500/30 text-indigo-300 rounded border border-indigo-400/40">
            Academy
          </span>
        </button>

        {/* AI Tutor Button */}
        <button
          onClick={onOpenAiTutor}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/70 border border-cyan-700/60 hover:border-cyan-500 rounded-xl transition-all shadow-md"
          title="Open Automata AI Tutor (Gemini Powered)"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="hidden md:inline">Ask AI</span>
        </button>

        {/* Export Dropdown */}
        <div className="relative group">
          <button
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors"
            title="Export Automaton"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <div className="absolute right-0 top-full mt-1.5 w-40 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1.5 hidden group-hover:block group-focus-within:block z-50">
            <button
              onClick={onExportPNG}
              className="w-full px-3 py-1.5 text-left text-xs text-slate-300 hover:bg-slate-800 hover:text-white flex items-center justify-between"
            >
              <span>Export as PNG</span>
              <span className="text-[10px] text-slate-500 font-mono">.png</span>
            </button>
            <button
              onClick={onExportSVG}
              className="w-full px-3 py-1.5 text-left text-xs text-slate-300 hover:bg-slate-800 hover:text-white flex items-center justify-between"
            >
              <span>Export as SVG</span>
              <span className="text-[10px] text-slate-500 font-mono">.svg</span>
            </button>
            <button
              onClick={onExportJSON}
              className="w-full px-3 py-1.5 text-left text-xs text-slate-300 hover:bg-slate-800 hover:text-white flex items-center justify-between"
            >
              <span>Export as JSON</span>
              <span className="text-[10px] text-slate-500 font-mono">.json</span>
            </button>
          </div>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={onToggleDarkMode}
          className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-900 border border-slate-800 rounded-xl transition-colors"
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
        </button>
      </div>
    </header>
  );
};
