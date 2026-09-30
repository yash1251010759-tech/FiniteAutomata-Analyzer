import React from 'react';
import { Keyboard, X } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space', desc: 'Toggle Play / Pause simulation' },
    { key: 'N', desc: 'Next simulation step' },
    { key: 'R', desc: 'Reset simulation to initial state' },
    { key: 'Delete / Backspace', desc: 'Delete currently selected state or edge' },
    { key: 'Esc', desc: 'Clear selection or close active modal' },
    { key: 'Ctrl + Z', desc: 'Undo last canvas action' },
    { key: 'Ctrl + Y', desc: 'Redo last canvas action' },
    { key: 'Mouse Wheel', desc: 'Smooth zoom in / zoom out' },
    { key: 'Canvas Drag', desc: 'Pan infinite 2D canvas' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 shadow-2xl relative space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Keyboard Shortcuts</h3>
              <p className="text-xs text-slate-400">Boost your workflow speed</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 py-2">
          {shortcuts.map((sc, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs"
            >
              <span className="text-slate-300">{sc.desc}</span>
              <kbd className="px-2 py-1 bg-slate-800 text-indigo-300 font-mono font-bold rounded-lg border border-slate-700 shadow-sm text-[11px]">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-2 text-center">
          <button
            onClick={onClose}
            className="w-full py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
