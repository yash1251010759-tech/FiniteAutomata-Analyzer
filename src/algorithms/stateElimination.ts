import { AutomatonDefinition } from '../types/automata';
import { isEpsilon } from './dfaSimulation';

export interface EliminationStep {
  step: number;
  eliminatedState: string;
  transitionsUpdated: { from: string; to: string; regex: string }[];
  explanation: string;
}

export interface StateEliminationReport {
  originalMachine: AutomatonDefinition;
  gnfaStartState: string;
  gnfaAcceptState: string;
  steps: EliminationStep[];
  finalRegex: string;
}

// Helper to simplify regular expression strings
export function simplifyRegex(r: string): string {
  let s = r.trim();
  if (!s) return 'ε';
  // Remove redundant empty additions
  s = s.replace(/\(ε\)/g, 'ε');
  // If wrapped in redundant outer parentheses
  if (s.startsWith('(') && s.endsWith(')')) {
    let depth = 0;
    let canStrip = true;
    for (let i = 0; i < s.length - 1; i++) {
      if (s[i] === '(') depth++;
      else if (s[i] === ')') depth--;
      if (depth === 0) {
        canStrip = false;
        break;
      }
    }
    if (canStrip) {
      s = s.slice(1, -1);
    }
  }
  return s;
}

// Format concatenation of two regex terms
function concatRegex(r1: string, r2: string): string {
  if (!r1 || isEpsilon(r1)) return r2;
  if (!r2 || isEpsilon(r2)) return r1;
  const p1 = r1.includes('+') ? `(${r1})` : r1;
  const p2 = r2.includes('+') ? `(${r2})` : r2;
  return `${p1}${p2}`;
}

// Format Kleene star
function starRegex(r: string): string {
  if (!r || isEpsilon(r)) return 'ε';
  if (r.endsWith('*') && !r.includes('+')) return r;
  if (r.length === 1) return `${r}*`;
  return `(${r})*`;
}

// Format union
function unionRegex(r1: string, r2: string): string {
  if (!r1) return r2;
  if (!r2) return r1;
  if (r1 === r2) return r1;
  if (isEpsilon(r1) && isEpsilon(r2)) return 'ε';
  return `${r1}+${r2}`;
}

// State Elimination Algorithm to convert FA to Regular Expression
export function convertFaToRegex(machine: AutomatonDefinition): StateEliminationReport {
  // 1. Initialize GNFA with distinct start (qs) and accept (qa) states
  const qs = 'q_start';
  const qa = 'q_accept';

  // Matrix: Map from `stateA:stateB` to regex
  const matrix = new Map<string, string>();

  const getEdge = (u: string, v: string): string => matrix.get(`${u}:${v}`) || '';
  const setEdge = (u: string, v: string, regex: string) => {
    if (regex) matrix.set(`${u}:${v}`, regex);
    else matrix.delete(`${u}:${v}`);
  };

  // Add ε-transition from qs to original start
  if (machine.startStateId) {
    setEdge(qs, machine.startStateId, 'ε');
  }

  // Add ε-transitions from original final states to qa
  for (const fId of machine.finalStateIds) {
    const existing = getEdge(fId, qa);
    setEdge(fId, qa, existing ? unionRegex(existing, 'ε') : 'ε');
  }

  // Populate edges from machine transitions
  for (const t of machine.transitions) {
    const current = getEdge(t.from, t.to);
    const syms = t.symbols.map(s => (isEpsilon(s) ? 'ε' : s)).join('+');
    const combined = current ? unionRegex(current, syms) : syms;
    setEdge(t.from, t.to, combined);
  }

  // List of states to eliminate (all original states)
  const statesToEliminate = machine.states.map(s => s.id);
  const steps: EliminationStep[] = [];
  let allStates = [qs, ...statesToEliminate, qa];

  // 2. Eliminate intermediate states one by one
  for (let stepIdx = 0; stepIdx < statesToEliminate.length; stepIdx++) {
    const rip = statesToEliminate[stepIdx];
    const ripLabel = machine.states.find(s => s.id === rip)?.label || rip;
    const rLoop = getEdge(rip, rip);
    const rLoopStar = rLoop ? starRegex(rLoop) : '';

    const remainingStates = allStates.filter(s => s !== rip);
    const updatedInStep: { from: string; to: string; regex: string }[] = [];

    // For every state i != rip and j != rip
    for (const i of remainingStates) {
      if (i === qa) continue; // no outgoing from qa
      const rIn = getEdge(i, rip);
      if (!rIn) continue;

      for (const j of remainingStates) {
        if (j === qs) continue; // no incoming to qs
        const rOut = getEdge(rip, j);
        if (!rOut) continue;

        // R_new = R(i, j) + R(i, rip) . (R(rip, rip))* . R(rip, j)
        const rDirect = getEdge(i, j);
        const rBypass = concatRegex(concatRegex(rIn, rLoopStar), rOut);
        const rCombined = simplifyRegex(unionRegex(rDirect, rBypass));

        setEdge(i, j, rCombined);
        updatedInStep.push({ from: i, to: j, regex: rCombined });
      }
    }

    // Remove all edges connected to rip
    for (const st of allStates) {
      matrix.delete(`${st}:${rip}`);
      matrix.delete(`${rip}:${st}`);
    }

    allStates = remainingStates;

    steps.push({
      step: stepIdx + 1,
      eliminatedState: ripLabel,
      transitionsUpdated: updatedInStep,
      explanation: `Eliminated state ${ripLabel}. R'(i, j) = R(i, j) + R(i, ${ripLabel}) · (R(${ripLabel}, ${ripLabel}))* · R(${ripLabel}, j). Updated ${updatedInStep.length} transition path(s).`,
    });
  }

  const finalRegex = simplifyRegex(getEdge(qs, qa) || '∅');

  return {
    originalMachine: machine,
    gnfaStartState: qs,
    gnfaAcceptState: qa,
    steps,
    finalRegex,
  };
}
