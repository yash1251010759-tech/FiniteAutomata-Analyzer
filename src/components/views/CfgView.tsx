import React, { useState } from 'react';
import { CFGDefinition, ParseTreeNode, CFGProduction } from '../../types/automata';
import { sampleGrammars, deriveString, generateSampleStringsFromCfg } from '../../algorithms/cfg';
import {
  Workflow,
  Play,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Layers,
  Plus,
  Trash2,
  HelpCircle,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { TermExplainerModal, TermKey } from '../common/TermExplainerModal';

export const CfgView: React.FC = () => {
  const [selectedCfg, setSelectedCfg] = useState<CFGDefinition>(sampleGrammars[0]);
  const [targetString, setTargetString] = useState<string>('aabb');
  const [analysisResult, setAnalysisResult] = useState<any>(() =>
    deriveString(sampleGrammars[0], 'aabb')
  );
  const [activeTermKey, setActiveTermKey] = useState<TermKey | null>(null);

  // New production inputs for custom editing
  const [newVar, setNewVar] = useState<string>('S');
  const [newReplacement, setNewReplacement] = useState<string>('');

  const handleDerive = (target?: string, grammar?: CFGDefinition) => {
    const g = grammar || selectedCfg;
    const str = target !== undefined ? target : targetString;
    const res = deriveString(g, str);
    setAnalysisResult(res);
  };

  // Add custom production rule
  const handleAddProduction = () => {
    const v = newVar.trim().toUpperCase();
    const rep = newReplacement.trim();
    if (!v || !rep) return;

    const newProd: CFGProduction = {
      id: `p-${Date.now()}`,
      variable: v,
      replacement: rep,
    };

    const updatedCfg: CFGDefinition = {
      ...selectedCfg,
      name: `${selectedCfg.name} (Customized)`,
      variables: Array.from(new Set([...selectedCfg.variables, v])),
      productions: [...selectedCfg.productions, newProd],
    };

    setSelectedCfg(updatedCfg);
    setNewReplacement('');
    handleDerive(targetString, updatedCfg);
  };

  // Delete production rule
  const handleDeleteProduction = (id: string) => {
    const updatedCfg: CFGDefinition = {
      ...selectedCfg,
      productions: selectedCfg.productions.filter(p => p.id !== id),
    };
    setSelectedCfg(updatedCfg);
    handleDerive(targetString, updatedCfg);
  };

  // Generate example strings
  const generatedExamples = generateSampleStringsFromCfg(selectedCfg, 10);

  // Render SVG Parse Tree recursively
  const renderTree = (
    node: ParseTreeNode,
    x: number,
    y: number,
    level: number,
    spread: number
  ): React.ReactNode => {
    const isLeaf = node.children.length === 0;

    return (
      <g key={node.id}>
        {/* Branch Lines to children */}
        {node.children.map((child, idx) => {
          const totalChildren = node.children.length;
          const offset = (idx - (totalChildren - 1) / 2) * (spread / (level + 1));
          const childX = x + offset;
          const childY = y + 70;

          return (
            <React.Fragment key={child.id}>
              <line
                x1={x}
                y1={y}
                x2={childX}
                y2={childY}
                stroke="#6366f1"
                strokeWidth={2}
                className="opacity-60"
              />
              {renderTree(child, childX, childY, level + 1, spread * 0.75)}
            </React.Fragment>
          );
        })}

        {/* Node Circle & Symbol */}
        <circle
          cx={x}
          cy={y}
          r={18}
          fill={isLeaf ? '#0f172a' : '#1e1b4b'}
          stroke={isLeaf ? '#38bdf8' : '#818cf8'}
          strokeWidth={2}
          className="filter drop-shadow-md"
        />
        <text
          x={x}
          y={y + 4}
          textAnchor="middle"
          fill="#f8fafc"
          fontSize={13}
          fontWeight="bold"
          fontFamily="monospace"
        >
          {node.symbol}
        </text>
      </g>
    );
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white font-['Outfit'] flex items-center gap-2">
              <Workflow className="w-6 h-6 text-indigo-400" />
              <span>Context-Free Grammar (CFG) Visualizer</span>
            </h2>
            <span className="px-2.5 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg">
              Type-2 Chomsky
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Define grammar productions, test arbitrary strings, trace leftmost derivations, and inspect hierarchical SVG parse trees
          </p>
        </div>

        {/* Grammar Preset Selector */}
        <div className="flex items-center gap-2">
          <select
            value={selectedCfg.id}
            onChange={e => {
              const found = sampleGrammars.find(g => g.id === e.target.value);
              if (found) {
                setSelectedCfg(found);
                handleDerive(undefined, found);
              }
            }}
            className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-semibold focus:outline-none"
          >
            {sampleGrammars.map(g => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grammar Definition & Rule Manager */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Formal 4-Tuple and Rule List */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5 font-['Outfit']">
              <span>Production Rules (P)</span>
              <button
                onClick={() => setActiveTermKey('production')}
                className="text-slate-500 hover:text-cyan-400"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </h3>
            <span className="text-[10px] font-mono text-cyan-400">
              Start: {selectedCfg.startVariable}
            </span>
          </div>

          {/* Grammar Tuples overview */}
          <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 text-[11px] font-mono space-y-1">
            <div className="text-slate-400">
              Variables V = {'{' + selectedCfg.variables.join(', ') + '}'}
            </div>
            <div className="text-slate-400">
              Terminals Σ = {'{' + selectedCfg.terminals.join(', ') + '}'}
            </div>
          </div>

          {/* Rules list */}
          <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
            {selectedCfg.productions.map(prod => (
              <div
                key={prod.id}
                className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800/80 rounded-xl text-xs font-mono"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-indigo-400">{prod.variable}</span>
                  <span className="text-slate-500">→</span>
                  <span className="text-white font-semibold">{prod.replacement}</span>
                </div>

                <button
                  onClick={() => handleDeleteProduction(prod.id)}
                  className="p-1 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                  title="Delete rule"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Add Rule Form */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
            <input
              type="text"
              value={newVar}
              onChange={e => setNewVar(e.target.value.toUpperCase())}
              placeholder="Var"
              className="w-14 px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-indigo-300 font-mono text-center text-xs font-bold"
            />
            <span className="text-slate-500 font-bold">→</span>
            <input
              type="text"
              value={newReplacement}
              onChange={e => setNewReplacement(e.target.value)}
              placeholder="Replacement (e.g. aSb or ε)"
              className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleAddProduction}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors shrink-0"
            >
              + Add
            </button>
          </div>
        </div>

        {/* Right: Dynamic Sample String Generator */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5 font-['Outfit']">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Generated Language Sample (L(G))</span>
            </h3>
            <span className="text-[10px] text-slate-500">First 10 valid strings</span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Click any valid string to instantly test its derivation and generate the hierarchical parse tree:
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            {generatedExamples.map((str, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setTargetString(str === 'ε' ? '' : str);
                  handleDerive(str === 'ε' ? '' : str);
                }}
                className="px-3 py-1.5 bg-slate-950 hover:bg-indigo-950/60 text-slate-200 hover:text-indigo-300 border border-slate-800 hover:border-indigo-500/50 rounded-xl text-xs font-mono font-semibold transition-colors"
              >
                {str}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Target String Derivation Input Bar */}
      <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-3">
        <label className="text-xs font-bold text-white block">
          Enter String to Parse & Derive:
        </label>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="text"
            value={targetString}
            onChange={e => setTargetString(e.target.value.trim())}
            onKeyDown={e => e.key === 'Enter' && handleDerive()}
            placeholder="e.g., aabb or ()"
            className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-indigo-500 shadow-inner"
          />
          <button
            onClick={() => handleDerive()}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shrink-0"
          >
            <Play className="w-4 h-4" />
            <span>Parse & Derive String</span>
          </button>
        </div>
      </div>

      {/* Derivation Results */}
      {analysisResult && (
        <div className="space-y-6">
          {/* Status Badge Banner */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              {analysisResult.valid ? (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  STRING DERIVED (ACCEPTED)
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl font-bold">
                  <XCircle className="w-4 h-4 text-rose-400" />
                  CANNOT BE GENERATED (REJECTED)
                </span>
              )}
              <span className="text-slate-400 font-mono text-xs">
                Target: "{targetString || 'ε'}"
              </span>
            </div>

            <button
              onClick={() => setActiveTermKey('derivation')}
              className="text-slate-400 hover:text-cyan-300 flex items-center gap-1 text-[11px]"
            >
              <HelpCircle className="w-3.5 h-3.5" /> What is a Derivation?
            </button>
          </div>

          {analysisResult.valid && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Leftmost Derivation Steps */}
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 font-['Outfit']">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>Leftmost Derivation Sequence</span>
                </h3>

                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {analysisResult.leftmostDerivation.map((st: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between font-mono text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-[10px]">Step {st.step}</span>
                        <span className="text-cyan-300 font-bold">{st.sententialForm}</span>
                      </div>
                      <span className="text-slate-400 text-[11px] font-sans">
                        {st.appliedProduction
                          ? `${st.appliedProduction.variable} → ${st.appliedProduction.replacement}`
                          : 'Axiom'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hierarchical Parse Tree Canvas */}
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-3 flex flex-col">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 font-['Outfit']">
                    <BookOpen className="w-4 h-4 text-cyan-400" />
                    <span>SVG Concrete Syntax Parse Tree</span>
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">
                    Axiom {selectedCfg.startVariable}
                  </span>
                </div>

                <div className="flex-1 min-h-[300px] bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center overflow-auto p-4">
                  {analysisResult.parseTree ? (
                    <svg className="w-full h-72">
                      {renderTree(analysisResult.parseTree, 220, 30, 0, 180)}
                    </svg>
                  ) : (
                    <span className="text-slate-500 text-xs">No parse tree available.</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <TermExplainerModal
        termKey={activeTermKey}
        onClose={() => setActiveTermKey(null)}
      />
    </div>
  );
};
