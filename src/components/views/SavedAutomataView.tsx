import React, { useState, useRef } from 'react';
import { AutomatonDefinition } from '../../types/automata';
import { getSavedAutomata, saveAutomaton, deleteAutomaton } from '../../utils/storage';
import { exportAutomatonAsJSON, validateImportedAutomaton } from '../../utils/exportUtils';
import { FolderHeart, Search, Plus, Upload, Download, Copy, Trash2, ArrowRight, Hammer } from 'lucide-react';
import { NavigationTab } from '../layout/Sidebar';

interface SavedAutomataViewProps {
  onSelectMachine: (m: AutomatonDefinition) => void;
  onNavigate: (tab: NavigationTab) => void;
}

export const SavedAutomataView: React.FC<SavedAutomataViewProps> = ({
  onSelectMachine,
  onNavigate,
}) => {
  const [automataList, setAutomataList] = useState<AutomatonDefinition[]>(getSavedAutomata);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allTags = ['ALL', 'DFA', 'NFA', 'MOORE', 'MEALY'];

  const filtered = automataList.filter(m => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTag = selectedTag === 'ALL' || m.type === selectedTag;
    return matchesSearch && matchesTag;
  });

  // Duplicate machine
  const handleDuplicate = (m: AutomatonDefinition) => {
    const dup: AutomatonDefinition = {
      ...m,
      id: `copy-${Date.now()}`,
      name: `${m.name} (Copy)`,
    };
    saveAutomaton(dup);
    setAutomataList(getSavedAutomata());
  };

  // Delete machine
  const handleDelete = (id: string) => {
    if (confirm('Delete this saved automaton?')) {
      deleteAutomaton(id);
      setAutomataList(getSavedAutomata());
    }
  };

  // Import JSON
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const { valid, machine, error } = validateImportedAutomaton(parsed);
        if (valid && machine) {
          saveAutomaton(machine);
          setAutomataList(getSavedAutomata());
          alert(`Successfully imported "${machine.name}"!`);
        } else {
          alert(`Import failed: ${error}`);
        }
      } catch (err) {
        alert('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-['Outfit'] flex items-center gap-2">
            <FolderHeart className="w-6 h-6 text-indigo-400" />
            <span>Saved Automata Repository</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Manage your personal library of created, converted, and simulated machines
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import JSON</span>
          </button>
        </div>
      </div>

      {/* Search & Tag Filter Bar */}
      <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 backdrop-blur-md">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search saved automata by name or description..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                selectedTag === tag
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Saved Automata Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(machine => (
          <div
            key={machine.id}
            className="p-5 rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 transition-all flex flex-col justify-between space-y-4 shadow-lg group"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg">
                  {machine.type}
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  {machine.states.length} states • {machine.transitions.length} edges
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                  {machine.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {machine.description || 'Custom finite automaton created in editor.'}
                </p>
              </div>

              <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                <span>Alphabet: Σ = {`{${machine.alphabet.join(', ')}}`}</span>
                <span>Final: {machine.finalStateIds.length}</span>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => exportAutomatonAsJSON(machine)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  title="Export JSON"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDuplicate(machine)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  title="Duplicate Machine"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(machine.id)}
                  className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={() => {
                  onSelectMachine(machine);
                  onNavigate('builder');
                }}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-md shadow-indigo-600/30 transition-all"
              >
                <Hammer className="w-3 h-3" />
                <span>Open in Builder</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="p-12 text-center text-slate-500 text-sm border border-dashed border-slate-800 rounded-3xl">
          No saved automata match your query.
        </div>
      )}
    </div>
  );
};
