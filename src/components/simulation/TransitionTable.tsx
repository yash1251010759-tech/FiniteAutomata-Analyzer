import React, { useState } from 'react';
import { AutomatonDefinition, TransitionEdge } from '../../types/automata';
import { Edit2, Check, ArrowRight } from 'lucide-react';

interface TransitionTableProps {
  machine: AutomatonDefinition;
  onChangeMachine: (updated: AutomatonDefinition) => void;
  activeStateIds?: string[];
  isEditable?: boolean;
}

export const TransitionTable: React.FC<TransitionTableProps> = ({
  machine,
  onChangeMachine,
  activeStateIds = [],
  isEditable = true,
}) => {
  const alphabet = machine.alphabet.filter(s => s !== 'ε' && s !== 'λ');
  const hasEpsilon = machine.transitions.some(t => t.symbols.some(s => s === 'ε' || s === 'λ'));
  const columns = hasEpsilon ? [...alphabet, 'ε'] : alphabet;

  const [editingCell, setEditingCell] = useState<{ stateId: string; symbol: string } | null>(null);
  const [cellValue, setCellValue] = useState<string>('');

  // Find destinations from state on symbol
  const getDestinations = (fromStateId: string, symbol: string): string[] => {
    const matchingEdges = machine.transitions.filter(
      t => t.from === fromStateId && t.symbols.includes(symbol)
    );
    const destLabels = matchingEdges
      .map(edge => machine.states.find(s => s.id === edge.to)?.label || edge.to)
      .sort();
    return destLabels;
  };

  // Start editing a cell
  const handleStartEdit = (stateId: string, symbol: string) => {
    if (!isEditable) return;
    const currentDests = getDestinations(stateId, symbol);
    setCellValue(currentDests.join(', '));
    setEditingCell({ stateId, symbol });
  };

  // Commit cell edit
  const handleCommitEdit = () => {
    if (!editingCell) return;
    const { stateId, symbol } = editingCell;

    // Parse target state labels/IDs
    const targetLabels = cellValue
      .split(/[, ]+/)
      .map(s => s.trim())
      .filter(Boolean);

    // Resolve target labels to state IDs
    const resolvedTargetIds: string[] = [];
    for (const label of targetLabels) {
      const match = machine.states.find(s => s.label === label || s.id === label);
      if (match) {
        resolvedTargetIds.push(match.id);
      }
    }

    // Remove existing transitions from stateId with this symbol
    let newTransitions: TransitionEdge[] = [];

    for (const edge of machine.transitions) {
      if (edge.from === stateId && edge.symbols.includes(symbol)) {
        const remainingSymbols = edge.symbols.filter(s => s !== symbol);
        if (remainingSymbols.length > 0) {
          newTransitions.push({ ...edge, symbols: remainingSymbols });
        }
      } else {
        newTransitions.push(edge);
      }
    }

    // Add transitions for the new targets
    for (const targetId of resolvedTargetIds) {
      const existing = newTransitions.find(t => t.from === stateId && t.to === targetId);
      if (existing) {
        if (!existing.symbols.includes(symbol)) {
          existing.symbols.push(symbol);
        }
      } else {
        newTransitions.push({
          id: `edge-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          from: stateId,
          to: targetId,
          symbols: [symbol],
        });
      }
    }

    onChangeMachine({ ...machine, transitions: newTransitions });
    setEditingCell(null);
  };

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/70 shadow-lg backdrop-blur-md">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-300">
            <th className="py-3 px-4 font-semibold uppercase tracking-wider">Current State</th>
            {columns.map(sym => (
              <th key={sym} className="py-3 px-4 font-mono font-bold text-indigo-400">
                δ(q, {sym})
              </th>
            ))}
            {machine.type === 'MOORE' && (
              <th className="py-3 px-4 font-semibold text-cyan-400">Output λ(q)</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 font-mono">
          {machine.states.map(state => {
            const isStart = state.id === machine.startStateId;
            const isFinal = machine.finalStateIds.includes(state.id);
            const isActive = activeStateIds.includes(state.id);

            return (
              <tr
                key={state.id}
                className={`transition-colors ${
                  isActive
                    ? 'bg-indigo-950/50 text-indigo-200 font-bold'
                    : 'hover:bg-slate-900/40 text-slate-300'
                }`}
              >
                {/* State Label with Start (→) and Final (*) Markers */}
                <td className="py-3 px-4 font-semibold whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    {isStart && <span className="text-indigo-400 font-bold">→</span>}
                    {isFinal && <span className="text-purple-400 font-bold">*</span>}
                    <span
                      className={`px-2 py-0.5 rounded ${
                        isActive
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800/80 text-slate-200 border border-slate-700/50'
                      }`}
                    >
                      {state.label}
                    </span>
                  </div>
                </td>

                {/* Transition Cells for each Symbol */}
                {columns.map(sym => {
                  const dests = getDestinations(state.id, sym);
                  const isEditingThis =
                    editingCell?.stateId === state.id && editingCell?.symbol === sym;

                  return (
                    <td
                      key={sym}
                      className="py-3 px-4 group relative cursor-pointer hover:bg-slate-800/40 transition-colors"
                      onClick={() => !isEditingThis && handleStartEdit(state.id, sym)}
                    >
                      {isEditingThis ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={cellValue}
                            onChange={e => setCellValue(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleCommitEdit();
                              if (e.key === 'Escape') setEditingCell(null);
                            }}
                            autoFocus
                            placeholder="q0, q1"
                            className="w-24 px-1.5 py-0.5 bg-slate-900 border border-indigo-500 rounded text-slate-100 font-mono text-xs focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleCommitEdit}
                            className="p-1 bg-indigo-600 text-white rounded hover:bg-indigo-500"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span
                            className={
                              dests.length > 0
                                ? 'text-slate-200'
                                : 'text-slate-600 italic'
                            }
                          >
                            {dests.length > 0 ? (
                              machine.type === 'DFA' ? (
                                dests[0]
                              ) : (
                                `{${dests.join(', ')}}`
                              )
                            ) : (
                              '∅ (Trap)'
                            )}
                          </span>
                          {isEditable && (
                            <Edit2 className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}

                {/* Moore Output Cell */}
                {machine.type === 'MOORE' && (
                  <td className="py-3 px-4 text-cyan-300 font-bold">
                    {state.output || 'ε'}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
