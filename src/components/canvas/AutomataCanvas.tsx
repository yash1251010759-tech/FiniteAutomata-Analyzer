import React, { useRef, useState, useEffect } from 'react';
import { AutomatonDefinition, StateNode, TransitionEdge } from '../../types/automata';
import { ZoomIn, ZoomOut, Maximize2, Move, Plus, Trash2, ArrowRightCircle, CheckCircle2 } from 'lucide-react';

interface AutomataCanvasProps {
  machine: AutomatonDefinition;
  onChangeMachine: (updated: AutomatonDefinition) => void;
  activeStateIds?: string[];
  activeTransitionId?: string;
  isEditable?: boolean;
  onSelectState?: (state: StateNode | null) => void;
  selectedStateId?: string | null;
}

export const AutomataCanvas: React.FC<AutomataCanvasProps> = ({
  machine,
  onChangeMachine,
  activeStateIds = [],
  activeTransitionId,
  isEditable = true,
  onSelectState,
  selectedStateId,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Fallback internal selection when parent does not manage selectedStateId
  const [internalSelectedStateId, setInternalSelectedStateId] = useState<string | null>(null);
  const activeSelectedStateId = selectedStateId !== undefined ? selectedStateId : internalSelectedStateId;

  // Pan and Zoom
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Node Dragging
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Transition Creation Mode
  const [connectSourceId, setConnectSourceId] = useState<string | null>(null);
  const [editingTransition, setEditingTransition] = useState<TransitionEdge | null>(null);
  const [editSymbolsInput, setEditSymbolsInput] = useState<string>('');
  const [editOutputInput, setEditOutputInput] = useState<string>('');

  // Handle Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.min(2.5, Math.max(0.4, prev * factor)));
  };

  // Start Canvas Pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === svgRef.current || (e.target as HTMLElement).tagName === 'svg') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      setInternalSelectedStateId(null);
      if (onSelectState) onSelectState(null);
      setConnectSourceId(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    } else if (draggingNodeId && isEditable) {
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;

      const mouseX = (e.clientX - containerRect.left - pan.x) / zoom;
      const mouseY = (e.clientY - containerRect.top - pan.y) / zoom;

      const updatedStates = machine.states.map(s => {
        if (s.id === draggingNodeId) {
          return {
            ...s,
            x: Math.round(mouseX - dragOffset.x),
            y: Math.round(mouseY - dragOffset.y),
          };
        }
        return s;
      });

      onChangeMachine({ ...machine, states: updatedStates });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  // Start Node Drag or Connect
  const handleNodeMouseDown = (e: React.MouseEvent, state: StateNode) => {
    e.stopPropagation();

    if (connectSourceId) {
      // Complete connection
      handleCreateTransition(connectSourceId, state.id);
      setConnectSourceId(null);
      return;
    }

    setInternalSelectedStateId(state.id);
    if (onSelectState) onSelectState(state);

    if (isEditable) {
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;
      const mouseX = (e.clientX - containerRect.left - pan.x) / zoom;
      const mouseY = (e.clientY - containerRect.top - pan.y) / zoom;

      setDraggingNodeId(state.id);
      setDragOffset({
        x: mouseX - state.x,
        y: mouseY - state.y,
      });
    }
  };

  // Create new Transition between two nodes
  const handleCreateTransition = (fromId: string, toId: string) => {
    const existing = machine.transitions.find(t => t.from === fromId && t.to === toId);
    if (existing) {
      setEditingTransition(existing);
      setEditSymbolsInput(existing.symbols.join(', '));
      setEditOutputInput(existing.output || '');
      return;
    }

    const defaultSym = machine.alphabet[0] || '0';
    const newEdge: TransitionEdge = {
      id: `edge-${Date.now()}`,
      from: fromId,
      to: toId,
      symbols: [defaultSym],
      output: machine.type === 'MEALY' ? '0' : undefined,
    };

    onChangeMachine({
      ...machine,
      transitions: [...machine.transitions, newEdge],
    });
    setEditingTransition(newEdge);
    setEditSymbolsInput(defaultSym);
    setEditOutputInput(newEdge.output || '');
  };

  // Add new state node
  const handleAddState = () => {
    const nextIdx = machine.states.length;
    const newId = `q${nextIdx}`;
    const newState: StateNode = {
      id: newId,
      label: newId,
      x: 350 + (nextIdx % 4) * 60,
      y: 220 + (nextIdx % 3) * 50,
      isStart: machine.states.length === 0,
      isFinal: false,
      output: machine.type === 'MOORE' ? '0' : undefined,
    };

    const newFinals = newState.isFinal ? [...machine.finalStateIds, newId] : machine.finalStateIds;
    const newStart = machine.startStateId ? machine.startStateId : newId;

    onChangeMachine({
      ...machine,
      states: [...machine.states, newState],
      startStateId: newStart,
      finalStateIds: newFinals,
    });
    if (onSelectState) onSelectState(newState);
  };

  // Toggle start state
  const handleToggleStart = (stateId: string) => {
    const newStartId = machine.startStateId === stateId ? '' : stateId;
    const updatedStates = machine.states.map(s => ({
      ...s,
      isStart: s.id === newStartId,
    }));
    onChangeMachine({
      ...machine,
      startStateId: newStartId,
      states: updatedStates,
    });
  };

  // Toggle final state
  const handleToggleFinal = (stateId: string) => {
    const isCurrentlyFinal =
      machine.finalStateIds.includes(stateId) ||
      Boolean(machine.states.find(s => s.id === stateId)?.isFinal);
    const newFinals = isCurrentlyFinal
      ? machine.finalStateIds.filter(id => id !== stateId)
      : [...machine.finalStateIds, stateId];

    const updatedStates = machine.states.map(s => ({
      ...s,
      isFinal: newFinals.includes(s.id),
    }));

    onChangeMachine({
      ...machine,
      finalStateIds: newFinals,
      states: updatedStates,
    });
  };

  // Delete State
  const handleDeleteState = (stateId: string) => {
    const remainingStates = machine.states.filter(s => s.id !== stateId);
    const remainingTransitions = machine.transitions.filter(
      t => t.from !== stateId && t.to !== stateId
    );
    const remainingFinals = machine.finalStateIds.filter(id => id !== stateId);
    const newStart = machine.startStateId === stateId ? (remainingStates[0]?.id || '') : machine.startStateId;

    onChangeMachine({
      ...machine,
      states: remainingStates,
      transitions: remainingTransitions,
      finalStateIds: remainingFinals,
      startStateId: newStart,
    });
    if (activeSelectedStateId === stateId) {
      setInternalSelectedStateId(null);
      if (onSelectState) onSelectState(null);
    }
  };

  // Delete Transition
  const handleDeleteTransition = (edgeId: string) => {
    const remaining = machine.transitions.filter(t => t.id !== edgeId);
    onChangeMachine({ ...machine, transitions: remaining });
    setEditingTransition(null);
  };

  // Save edited transition symbols
  const handleSaveTransitionSymbols = () => {
    if (!editingTransition) return;
    const syms = editSymbolsInput
      .split(/[, ]+/)
      .map(s => s.trim())
      .filter(Boolean);

    const updated = machine.transitions.map(t => {
      if (t.id === editingTransition.id) {
        return {
          ...t,
          symbols: syms.length > 0 ? syms : ['0'],
          output: machine.type === 'MEALY' ? editOutputInput.trim() : undefined,
        };
      }
      return t;
    });

    onChangeMachine({ ...machine, transitions: updated });
    setEditingTransition(null);
  };

  // Fit to screen helper
  const handleFitScreen = () => {
    if (machine.states.length === 0) {
      setPan({ x: 0, y: 0 });
      setZoom(1);
      return;
    }

    const xs = machine.states.map(s => s.x);
    const ys = machine.states.map(s => s.y);
    const minX = Math.min(...xs) - 80;
    const maxX = Math.max(...xs) + 80;
    const minY = Math.min(...ys) - 80;
    const maxY = Math.max(...ys) + 80;

    const width = maxX - minX;
    const height = maxY - minY;

    const containerWidth = containerRef.current?.clientWidth || 700;
    const containerHeight = containerRef.current?.clientHeight || 450;

    const newZoom = Math.min(1.8, Math.max(0.5, Math.min(containerWidth / width, containerHeight / height) * 0.85));
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    setZoom(newZoom);
    setPan({
      x: containerWidth / 2 - centerX * newZoom,
      y: containerHeight / 2 - centerY * newZoom,
    });
  };

  // Render curved edge between two nodes
  const renderEdge = (edge: TransitionEdge) => {
    const source = machine.states.find(s => s.id === edge.from);
    const target = machine.states.find(s => s.id === edge.to);
    if (!source || !target) return null;

    const isSelfLoop = edge.from === edge.to;
    const isActive = activeTransitionId === edge.id;

    // Check if reverse transition exists between same pair of distinct states
    const hasReverse = machine.transitions.some(
      t => t.from === edge.to && t.to === edge.from && t.from !== t.to
    );

    const nodeRadius = 32;

    if (isSelfLoop) {
      // Draw circular loop on top of node
      const loopRadius = 24;
      const x = source.x;
      const y = source.y - nodeRadius;

      const pathData = `M ${x - 14} ${y + 6} C ${x - 30} ${y - loopRadius * 2}, ${x + 30} ${y - loopRadius * 2}, ${x + 14} ${y + 6}`;
      const labelX = x;
      const labelY = y - loopRadius * 1.5;

      const displaySymbols = edge.symbols.join(', ');
      const displayLabel = edge.output ? `${displaySymbols} / ${edge.output}` : displaySymbols;

      return (
        <g key={edge.id} className="cursor-pointer group" onClick={() => {
          setEditingTransition(edge);
          setEditSymbolsInput(edge.symbols.join(', '));
          setEditOutputInput(edge.output || '');
        }}>
          <path
            d={pathData}
            fill="none"
            stroke={isActive ? '#38bdf8' : '#94a3b8'}
            strokeWidth={isActive ? 3.5 : 2}
            markerEnd="url(#arrowhead)"
            className={isActive ? 'active-transition-path' : 'transition-colors group-hover:stroke-indigo-400'}
          />
          {/* Label Pill */}
          <rect
            x={labelX - 18}
            y={labelY - 12}
            width={Math.max(36, displayLabel.length * 9 + 12)}
            height={22}
            rx={11}
            fill="#1e293b"
            stroke={isActive ? '#38bdf8' : '#475569'}
            strokeWidth={1.5}
            className="filter drop-shadow-md"
          />
          <text
            x={labelX - 18 + Math.max(36, displayLabel.length * 9 + 12) / 2}
            y={labelY + 3}
            textAnchor="middle"
            fill={isActive ? '#38bdf8' : '#f1f5f9'}
            fontSize={12}
            fontWeight="bold"
            fontFamily="monospace"
          >
            {displayLabel}
          </text>
        </g>
      );
    }

    // Straight or Curved transition between two distinct nodes
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return null;

    const unitX = dx / dist;
    const unitY = dy / dist;

    // Normal vector perpendicular to line
    const normX = -unitY;
    const normY = unitX;

    // If reverse edge exists, curve outwards
    const curveAmount = hasReverse ? 38 : 0;
    const midX = (source.x + target.x) / 2 + normX * curveAmount;
    const midY = (source.y + target.y) / 2 + normY * curveAmount;

    // Intersect circle perimeters
    const startX = source.x + unitX * nodeRadius + normX * (hasReverse ? 8 : 0);
    const startY = source.y + unitY * nodeRadius + normY * (hasReverse ? 8 : 0);
    const endX = target.x - unitX * (nodeRadius + 4) + normX * (hasReverse ? 8 : 0);
    const endY = target.y - unitY * (nodeRadius + 4) + normY * (hasReverse ? 8 : 0);

    const pathData = curveAmount !== 0
      ? `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`
      : `M ${startX} ${startY} L ${endX} ${endY}`;

    const displaySymbols = edge.symbols.join(', ');
    const displayLabel = edge.output ? `${displaySymbols} / ${edge.output}` : displaySymbols;
    const textWidth = Math.max(32, displayLabel.length * 8.5 + 14);

    return (
      <g key={edge.id} className="cursor-pointer group" onClick={() => {
        setEditingTransition(edge);
        setEditSymbolsInput(edge.symbols.join(', '));
        setEditOutputInput(edge.output || '');
      }}>
        {/* Transparent thick stroke for easy clicking */}
        <path
          d={pathData}
          fill="none"
          stroke="transparent"
          strokeWidth={18}
        />
        <path
          d={pathData}
          fill="none"
          stroke={isActive ? '#38bdf8' : '#94a3b8'}
          strokeWidth={isActive ? 3.5 : 2}
          markerEnd={isActive ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
          className={isActive ? 'active-transition-path' : 'transition-colors group-hover:stroke-indigo-400'}
        />
        {/* Label Badge */}
        <g transform={`translate(${midX}, ${midY})`}>
          <rect
            x={-textWidth / 2}
            y={-11}
            width={textWidth}
            height={22}
            rx={11}
            fill="#0f172a"
            stroke={isActive ? '#38bdf8' : '#475569'}
            strokeWidth={1.5}
            className="filter drop-shadow-md group-hover:border-indigo-500"
          />
          <text
            x={0}
            y={4}
            textAnchor="middle"
            fill={isActive ? '#38bdf8' : '#f8fafc'}
            fontSize={12}
            fontWeight="bold"
            fontFamily="monospace"
          >
            {displayLabel}
          </text>
        </g>
      </g>
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[460px] bg-slate-950/70 border border-slate-800/80 rounded-2xl overflow-hidden select-none shadow-2xl backdrop-blur-md"
      onWheel={handleWheel}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Background Grid Pattern */}
      <svg
        ref={svgRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
      >
        <defs>
          <pattern id="grid-pattern" width="30" height="30" patternUnits="userSpaceOnUse">
            <circle cx="15" cy="15" r="1" fill="#334155" opacity="0.4" />
          </pattern>

          {/* Standard Arrowhead */}
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
          </marker>

          {/* Active Highlight Arrowhead */}
          <marker
            id="arrowhead-active"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#38bdf8" />
          </marker>

          {/* Start State Arrow Marker */}
          <marker
            id="arrowhead-start"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" />
          </marker>
        </defs>

        <rect width="100%" height="100%" fill="url(#grid-pattern)" />

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Transitions Layer */}
          {machine.transitions.map(edge => renderEdge(edge))}

          {/* States Layer */}
          {machine.states.map(state => {
            const isActive = activeStateIds.includes(state.id);
            const isSelected = activeSelectedStateId === state.id;
            const isConnectingSource = connectSourceId === state.id;
            const isStart = state.id === machine.startStateId || Boolean(state.isStart);
            const isFinal = machine.finalStateIds.includes(state.id) || Boolean(state.isFinal);

            return (
              <g
                key={state.id}
                transform={`translate(${state.x}, ${state.y})`}
                className="cursor-pointer group"
                onMouseDown={e => handleNodeMouseDown(e, state)}
              >
                {/* Start State Incoming Arrow */}
                {isStart && (
                  <g transform="translate(-48, 0)">
                    <line
                      x1="-24"
                      y1="0"
                      x2="14"
                      y2="0"
                      stroke="#818cf8"
                      strokeWidth="3.5"
                      markerEnd="url(#arrowhead-start)"
                    />
                    <text
                      x="-30"
                      y="4"
                      fill="#818cf8"
                      fontSize="11"
                      fontWeight="bold"
                      textAnchor="end"
                      fontFamily="sans-serif"
                    >
                      Start
                    </text>
                  </g>
                )}

                {/* Active Simulation Pulsing Ring */}
                {isActive && (
                  <circle
                    r="44"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="3"
                    className="pulse-active-state opacity-80"
                  />
                )}

                {/* Outer Selection Highlight */}
                {isSelected && (
                  <circle
                    r="39"
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="2.5"
                    strokeDasharray="4 3"
                  />
                )}

                {/* Connecting Source Glow */}
                {isConnectingSource && (
                  <circle
                    r="41"
                    fill="none"
                    stroke="#eab308"
                    strokeWidth="3"
                    strokeDasharray="6 4"
                  />
                )}

                {/* Main Node Circle */}
                <circle
                  r="32"
                  fill={isActive ? '#1e3a8a' : '#1e293b'}
                  stroke={
                    isActive
                      ? '#38bdf8'
                      : isConnectingSource
                      ? '#eab308'
                      : isSelected
                      ? '#c084fc'
                      : '#64748b'
                  }
                  strokeWidth={isActive || isSelected ? 3 : 2}
                  className="transition-colors filter drop-shadow-lg group-hover:stroke-indigo-400"
                />

                {/* Final State Inner Concentric Circle (Automata Theory Double Circle Standard) */}
                {isFinal && (
                  <circle
                    r="25"
                    fill="none"
                    stroke={isActive ? '#38bdf8' : isSelected ? '#c084fc' : '#94a3b8'}
                    strokeWidth="2"
                  />
                )}

                {/* State Label */}
                <text
                  x="0"
                  y={state.output !== undefined && machine.type === 'MOORE' ? '-3' : '5'}
                  textAnchor="middle"
                  fill="#f8fafc"
                  fontSize="15"
                  fontWeight="600"
                  fontFamily="'Outfit', sans-serif"
                  pointerEvents="none"
                >
                  {state.label}
                </text>

                {/* Moore State Output Tag (q0 / 0) */}
                {state.output !== undefined && machine.type === 'MOORE' && (
                  <text
                    x="0"
                    y="15"
                    textAnchor="middle"
                    fill="#38bdf8"
                    fontSize="11"
                    fontWeight="bold"
                    fontFamily="monospace"
                    pointerEvents="none"
                  >
                    / {state.output}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Floating Canvas Controls Toolbar */}
      <div className="absolute top-4 left-4 flex items-center gap-1.5 p-1.5 bg-slate-900/90 border border-slate-800 rounded-xl shadow-lg backdrop-blur-md z-10">
        {isEditable && (
          <>
            <button
              onClick={handleAddState}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm"
              title="Add State Node"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add State</span>
            </button>

            <button
              onClick={() => {
                if (activeSelectedStateId) {
                  setConnectSourceId(activeSelectedStateId);
                } else if (machine.states.length >= 2) {
                  setConnectSourceId(machine.states[0].id);
                } else if (machine.states.length === 1) {
                  setConnectSourceId(machine.states[0].id);
                }
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                connectSourceId
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
              title="Click a source state then target state to connect"
            >
              <ArrowRightCircle className="w-3.5 h-3.5" />
              <span>{connectSourceId ? 'Click target...' : 'Connect'}</span>
            </button>

            <div className="w-[1px] h-4 bg-slate-800 mx-1" />
          </>
        )}

        <button
          onClick={() => setZoom(prev => Math.min(2.5, prev * 1.15))}
          className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          onClick={() => setZoom(prev => Math.max(0.4, prev * 0.85))}
          className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          onClick={handleFitScreen}
          className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          title="Fit Graph to Screen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            setPan({ x: 0, y: 0 });
            setZoom(1);
          }}
          className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors text-xs font-mono"
          title="Reset Zoom & Pan"
        >
          100%
        </button>
      </div>

      {/* Connection in Progress Floating Notice Banner */}
      {connectSourceId && (
        <div className="absolute top-4 right-4 flex items-center gap-2.5 px-3.5 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-2xl backdrop-blur-md z-20 animate-in fade-in">
          <ArrowRightCircle className="w-4 h-4 animate-pulse shrink-0" />
          <span>
            Connect from <span className="font-mono underline">{machine.states.find(s => s.id === connectSourceId)?.label || connectSourceId}</span> → Click target state (or click same state for self-loop)
          </span>
          <button
            onClick={() => setConnectSourceId(null)}
            className="ml-2 px-2 py-0.5 bg-slate-950 text-amber-300 rounded-lg text-[11px] hover:bg-slate-800"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Selected State Actions Bar (Bottom left) */}
      {activeSelectedStateId && isEditable && (
        <div className="absolute bottom-4 left-4 flex items-center gap-2 p-2 bg-slate-900/95 border border-slate-700/80 rounded-xl shadow-xl backdrop-blur-md z-10 animate-in fade-in">
          {(() => {
            const st = machine.states.find(s => s.id === activeSelectedStateId);
            if (!st) return null;
            const isStart = st.id === machine.startStateId;
            const isFinal = machine.finalStateIds.includes(st.id);

            return (
              <>
                <div className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 font-mono text-xs rounded border border-indigo-500/30 font-semibold">
                  {st.label}
                </div>

                <button
                  onClick={() => setConnectSourceId(st.id)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${
                    connectSourceId === st.id
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-amber-300 hover:bg-slate-700'
                  }`}
                  title="Connect this state to another state"
                >
                  <ArrowRightCircle className="w-3 h-3" />
                  <span>{connectSourceId === st.id ? 'Connecting...' : 'Connect →'}</span>
                </button>

                <button
                  onClick={() => handleToggleStart(st.id)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${
                    isStart
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <ArrowRightCircle className="w-3 h-3" />
                  <span>{isStart ? 'Start State ✓' : 'Set as Start'}</span>
                </button>

                <button
                  onClick={() => handleToggleFinal(st.id)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${
                    isFinal
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{isFinal ? 'Final State (◎) ✓' : 'Set as Final'}</span>
                </button>

                <button
                  onClick={() => {
                    const newLabel = prompt('Rename state label:', st.label);
                    if (newLabel && newLabel.trim()) {
                      const updated = machine.states.map(s =>
                        s.id === st.id ? { ...s, label: newLabel.trim() } : s
                      );
                      onChangeMachine({ ...machine, states: updated });
                    }
                  }}
                  className="px-2 py-1 text-xs text-slate-300 hover:bg-slate-800 rounded-lg"
                >
                  Rename
                </button>

                {machine.type === 'MOORE' && (
                  <button
                    onClick={() => {
                      const out = prompt('Moore output for state ' + st.label + ':', st.output || '0');
                      if (out !== null) {
                        const updated = machine.states.map(s =>
                          s.id === st.id ? { ...s, output: out.trim() } : s
                        );
                        onChangeMachine({ ...machine, states: updated });
                      }
                    }}
                    className="px-2 py-1 text-xs text-cyan-300 hover:bg-slate-800 rounded-lg"
                  >
                    Output: {st.output || 'ε'}
                  </button>
                )}

                <button
                  onClick={() => handleDeleteState(st.id)}
                  className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors"
                  title="Delete State"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            );
          })()}
        </div>
      )}

      {/* Transition Edit Modal */}
      {editingTransition && isEditable && (
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-30 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 w-full max-w-sm shadow-2xl space-y-4">
            <h4 className="text-sm font-semibold text-slate-100 flex items-center justify-between">
              <span>Edit Transition</span>
              <span className="text-xs font-mono text-indigo-400">
                {machine.states.find(s => s.id === editingTransition.from)?.label} →{' '}
                {machine.states.find(s => s.id === editingTransition.to)?.label}
              </span>
            </h4>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Input Symbols (comma separated, e.g. 0, 1 or ε)
              </label>
              <input
                type="text"
                value={editSymbolsInput}
                onChange={e => setEditSymbolsInput(e.target.value)}
                placeholder="0, 1 or ε"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-sm font-mono focus:outline-none focus:border-indigo-500"
              />
              <div className="flex gap-1.5 mt-2">
                {machine.alphabet.map(sym => (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => {
                      if (!editSymbolsInput.includes(sym)) {
                        setEditSymbolsInput(prev => (prev ? `${prev}, ${sym}` : sym));
                      }
                    }}
                    className="px-2 py-0.5 text-xs font-mono bg-slate-800 text-slate-300 hover:bg-indigo-600 hover:text-white rounded border border-slate-700"
                  >
                    +{sym}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    if (!editSymbolsInput.includes('ε')) {
                      setEditSymbolsInput(prev => (prev ? `${prev}, ε` : 'ε'));
                    }
                  }}
                  className="px-2 py-0.5 text-xs font-mono bg-slate-800 text-amber-300 hover:bg-amber-600 hover:text-white rounded border border-slate-700"
                >
                  +ε
                </button>
              </div>
            </div>

            {machine.type === 'MEALY' && (
              <div>
                <label className="block text-xs font-medium text-cyan-400 mb-1">
                  Mealy Output Symbol
                </label>
                <input
                  type="text"
                  value={editOutputInput}
                  onChange={e => setEditOutputInput(e.target.value)}
                  placeholder="e.g. 0, 1, A"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-sm font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => handleDeleteTransition(editingTransition.id)}
                className="px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
              >
                Delete Transition
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTransition(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveTransitionSymbols}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
