import React, { useState } from 'react';
import { CFGDefinition, ParseTreeNode } from '../../types/automata';
import { sampleGrammars, deriveString } from '../../algorithms/cfg';
import { Workflow, Play, CheckCircle2, XCircle, ArrowRight, Layers, Plus, Trash2 } from 'lucide-react';

export const CfgView: React.FC = () => {
  const [selectedCfg, setSelectedCfg] = useState<CFGDefinition>(sampleGrammars[0]);
  const [targetString, setTargetString] = useState<string>('aabb');
  const [analysisResult, setAnalysisResult] = useState<any>(() =>
    deriveString(sampleGrammars[0], 'aabb')
  );

  const handleDerive = (target?: string, grammar?: CFGDefinition) => {
    const g = grammar || selectedCfg;
    const str = target !== undefined ? target : targetString;
    const res = deriveString(g, str);
    setAnalysisResult(res);
  };

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-['Outfit'] flex items-center gap-2">
            <Workflow className="w-6 h-6 text-indigo-400" />
            <span>Context-Free Grammar (CFG) Visualizer</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Define grammar productions, trace leftmost derivations, and inspect hierarchical SVG parse trees
          </p>
        </div>

        {/* Grammar Selector */}
        <div className="flex items-center gap-2">
          <select
            value={selectedCfg.id}
            onChange={e => {
              const found = sampleGrammars.find(g => g.id === e.target.value);
              if (found) {
                setSelectedCfg(found);
                const defaultStr =
                  found.id === 'cfg-anbn'
                    ? 'aabb'
                    : found.id === 'cfg-parens'
                    ? '(())'
                    : '0110';
                setTargetString(defaultStr);
                handleDerive(defaultStr, found);
              }
            }}
            className="px-3 py-2 bg-slate-900 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl focus:outline-none focus:border-indigo-500 cursor-pointer shadow-sm"
          >
            {sampleGrammars.map(g => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grammar Definition & Input Ribbon */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-4 backdrop-blur-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Productions Display */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block">
              Grammar Production Rules R:
            </span>
            <div className="space-y-1 font-mono text-sm text-slate-200">
              {selectedCfg.productions.map(prod => (
                <div key={prod.id} className="p-1.5 bg-slate-900/60 rounded-lg">
                  {prod.variable} → <strong className="text-cyan-400">{prod.replacement}</strong>
                </div>
              ))}
            </div>
          </div>

          {/* Derivation Target Input */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Target String to Derive:
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={targetString}
                onChange={e => setTargetString(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleDerive()}
                placeholder="e.g. aabb or (())"
                className="flex-1 px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={() => handleDerive()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Derive</span>
              </button>
            </div>

            {/* Quick sample chips */}
            <div className="flex flex-wrap gap-1.5 text-xs font-mono">
              <span className="text-slate-500 text-[11px] font-sans">Quick test:</span>
              {(selectedCfg.id === 'cfg-anbn'
                ? ['ab', 'aabb', 'aaabbb', 'ε']
                : selectedCfg.id === 'cfg-parens'
                ? ['()', '(())', '()()', '((()))']
                : ['00', '11', '0110', '1001']
              ).map(sample => (
                <button
                  key={sample}
                  onClick={() => {
                    setTargetString(sample);
                    handleDerive(sample);
                  }}
                  className="px-2 py-0.5 bg-slate-800 text-slate-300 hover:text-white rounded border border-slate-700"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Derivation Path and Parse Tree */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Leftmost Derivation Steps (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4 backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Leftmost Derivation Sequence</span>
            </h3>

            {analysisResult.valid ? (
              <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>DERIVED ✓</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-rose-400 text-xs font-bold font-mono">
                <XCircle className="w-3.5 h-3.5" />
                <span>NOT IN L(G)</span>
              </span>
            )}
          </div>

          {analysisResult.valid ? (
            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {analysisResult.leftmostDerivation.map((st: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between font-mono">
                    <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded font-bold">
                      Step {st.step}
                    </span>
                    <span className="text-sm font-bold text-white tracking-wide">
                      {st.sententialForm}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] font-sans">{st.explanation}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-rose-950/30 border border-rose-900/50 rounded-2xl text-xs text-rose-300 leading-relaxed">
              {analysisResult.error}
            </div>
          )}
        </div>

        {/* Right: Interactive SVG Parse Tree (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4 backdrop-blur-md">
          <h3 className="text-sm font-bold text-white">Hierarchical Parse Tree</h3>

          {analysisResult.parseTree ? (
            <div className="w-full h-[480px] bg-slate-950 rounded-2xl border border-slate-800 overflow-auto p-4 flex items-center justify-center">
              <svg width="600" height="420" viewBox="0 0 600 420" className="w-full h-full">
                {renderTree(analysisResult.parseTree, 300, 40, 1, 240)}
              </svg>
            </div>
          ) : (
            <div className="h-[480px] bg-slate-950 rounded-2xl border border-dashed border-slate-800 flex items-center justify-center text-slate-500 text-xs">
              No parse tree available for invalid derivation.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
