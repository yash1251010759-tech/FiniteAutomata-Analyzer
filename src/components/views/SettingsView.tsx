import React from 'react';
import { Settings as SettingsIcon, Sun, Moon, Eye, RotateCcw, Volume2, VolumeX, ShieldCheck, Check } from 'lucide-react';
import { UserPreferences, UserProgressStats } from '../../utils/storage';

interface SettingsViewProps {
  preferences: UserPreferences;
  onUpdatePreferences: (updated: UserPreferences) => void;
  onResetProgress: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  preferences,
  onUpdatePreferences,
  onResetProgress,
}) => {
  return (
    <div className="space-y-6 pb-12 max-w-2xl mx-auto animate-in fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white font-['Outfit'] flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-indigo-400" />
          <span>Platform Settings & Preferences</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Customize visual theme, level of mathematical detail, and local storage state
        </p>
      </div>

      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-6 backdrop-blur-md">
        {/* Appearance: Dark / Light Mode */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Color Theme</span>
            </h4>
            <p className="text-xs text-slate-400">
              Toggle between modern dark lab palette and high-contrast light theme
            </p>
          </div>

          <button
            onClick={() =>
              onUpdatePreferences({
                ...preferences,
                theme: preferences.theme === 'dark' ? 'light' : 'dark',
              })
            }
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
          >
            {preferences.theme === 'dark' ? (
              <>
                <Moon className="w-4 h-4 text-indigo-400" />
                <span>Dark Mode</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Light Mode</span>
              </>
            )}
          </button>
        </div>

        {/* Interface Mode: Beginner vs Advanced */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-purple-400" />
              <span>Interface Complexity Mode</span>
            </h4>
            <p className="text-xs text-slate-400">
              Beginner mode simplifies diagrams; Advanced mode exposes full formal 5-tuples & algorithmic matrices
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl text-xs font-semibold">
            <button
              onClick={() => onUpdatePreferences({ ...preferences, mode: 'beginner' })}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                preferences.mode === 'beginner'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Beginner
            </button>
            <button
              onClick={() => onUpdatePreferences({ ...preferences, mode: 'advanced' })}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                preferences.mode === 'advanced'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Advanced
            </button>
          </div>
        </div>

        {/* Default Simulation Speed */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold text-white">Default Simulation Step Duration</h4>
            <p className="text-xs text-slate-400">
              Playback speed when auto-playing string transitions
            </p>
          </div>

          <select
            value={preferences.simulationSpeedMs}
            onChange={e =>
              onUpdatePreferences({
                ...preferences,
                simulationSpeedMs: Number(e.target.value),
              })
            }
            className="px-3 py-1.5 bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl focus:outline-none"
          >
            <option value={1200}>Slow (1200ms)</option>
            <option value={650}>Normal (650ms)</option>
            <option value={300}>Fast (300ms)</option>
            <option value={100}>Turbo (100ms)</option>
          </select>
        </div>

        {/* Reset Progress & Storage */}
        <div className="flex items-center justify-between pt-2">
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold text-rose-400">Reset Student Progress Data</h4>
            <p className="text-xs text-slate-500">
              Clear all quiz attempts, challenge completions, and exam history
            </p>
          </div>

          <button
            onClick={() => {
              if (confirm('Are you sure you want to reset all learning progress and scores?')) {
                onResetProgress();
              }
            }}
            className="px-4 py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-900/50 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Progress</span>
          </button>
        </div>
      </div>
    </div>
  );
};
