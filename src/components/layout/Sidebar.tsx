import React from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  Hammer,
  PlaySquare,
  Sparkles,
  GitFork,
  Minimize2,
  Regex,
  Workflow,
  Layers,
  Binary,
  Scale,
  Bug,
  Compass,
  Trophy,
  HelpCircle,
  Clock,
  FolderHeart,
  BarChart3,
  Settings,
  Bot,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export type NavigationTab =
  | 'dashboard'
  | 'learn'
  | 'builder'
  | 'simulator'
  | 'generator'
  | 'conversion'
  | 'minimization'
  | 'regex'
  | 'cfg'
  | 'pda'
  | 'turing'
  | 'comparator'
  | 'debugger'
  | 'language'
  | 'practice'
  | 'quiz'
  | 'exam'
  | 'saved'
  | 'statistics'
  | 'settings';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenAiTutor: () => void;
}

interface NavGroup {
  name: string;
  items: {
    id: NavigationTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
  onOpenAiTutor,
}) => {
  const navGroups: NavGroup[] = [
    {
      name: 'Main',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'learn', label: 'Learn Path', icon: GraduationCap },
      ],
    },
    {
      name: 'Design & Simulate',
      items: [
        { id: 'builder', label: 'Automata Builder', icon: Hammer },
        { id: 'simulator', label: 'Simulator', icon: PlaySquare },
        { id: 'generator', label: 'NL Generator', icon: Sparkles, badge: 'AI' },
      ],
    },
    {
      name: 'Formal Labs',
      items: [
        { id: 'conversion', label: 'Conversion Lab', icon: GitFork },
        { id: 'minimization', label: 'Minimization Lab', icon: Minimize2 },
        { id: 'regex', label: 'Regex Lab', icon: Regex },
        { id: 'cfg', label: 'CFG Visualizer', icon: Workflow },
        { id: 'pda', label: 'PDA Visualizer', icon: Layers },
        { id: 'turing', label: 'Turing Machine', icon: Binary },
      ],
    },
    {
      name: 'Analysis & Tools',
      items: [
        { id: 'comparator', label: 'Comparator', icon: Scale },
        { id: 'debugger', label: 'Debugger', icon: Bug },
        { id: 'language', label: 'Language Explorer', icon: Compass },
      ],
    },
    {
      name: 'Practice & Testing',
      items: [
        { id: 'practice', label: 'Challenge Mode', icon: Trophy },
        { id: 'quiz', label: 'Quiz Mode', icon: HelpCircle },
        { id: 'exam', label: 'Exam Mode', icon: Clock },
      ],
    },
    {
      name: 'Workspace',
      items: [
        { id: 'saved', label: 'Saved Automata', icon: FolderHeart },
        { id: 'statistics', label: 'Progress & Stats', icon: BarChart3 },
        { id: 'settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-slate-950 border-r border-slate-800 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-500 p-0.5 shadow-lg shadow-indigo-500/20 shrink-0 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Workflow className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="font-extrabold text-sm tracking-tight text-white truncate font-['Outfit']">
                  UNIVERSAL
                </span>
                <span className="text-[10px] font-semibold text-indigo-400 tracking-wider uppercase truncate">
                  Automata Lab
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center">
            {/* Collapse toggle (desktop) */}
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-900 rounded-lg transition-colors"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            {/* Close mobile button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-900 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* AI Tutor Quick Access Button */}
        <div className="p-3 border-b border-slate-800/80">
          <button
            onClick={() => {
              onOpenAiTutor();
              if (isOpenMobile) onCloseMobile();
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-indigo-950/70 to-violet-950/70 border border-indigo-700/40 text-indigo-300 hover:text-white hover:border-indigo-500 transition-all shadow-md group ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <Bot className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform shrink-0" />
            {!isCollapsed && (
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-semibold">Automata AI Tutor</span>
                <span className="px-1.5 py-0.5 text-[9px] font-bold bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/30">
                  AI
                </span>
              </div>
            )}
          </button>
        </div>

        {/* Navigation Items List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {navGroups.map(group => (
            <div key={group.name} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {group.name}
                </div>
              )}
              {group.items.map(item => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      if (isOpenMobile) onCloseMobile();
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isCollapsed ? 'justify-center' : ''
                    } ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-semibold'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80'
                    }`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    {!isCollapsed && (
                      <span className="flex-1 text-left truncate">{item.label}</span>
                    )}
                    {!isCollapsed && item.badge && (
                      <span
                        className={`px-1.5 py-0.5 text-[9px] font-extrabold rounded ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-indigo-500/20 text-indigo-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer info */}
        {!isCollapsed && (
          <div className="p-3 border-t border-slate-800/80 text-[10px] text-slate-500 text-center">
            Universal Automata Lab v1.0 • Modern Educational Suite
          </div>
        )}
      </aside>
    </>
  );
};
