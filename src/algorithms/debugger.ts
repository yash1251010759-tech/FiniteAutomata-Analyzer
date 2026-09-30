import { AutomatonDefinition, DebugIssue, MachineStatistics } from '../types/automata';
import { isEpsilon } from './dfaSimulation';
import { getReachableStates } from './dfaMinimization';

// Compute full machine statistics
export function analyzeMachine(machine: AutomatonDefinition): MachineStatistics {
  const alphabet = machine.alphabet.filter(s => !isEpsilon(s));
  const reachable = getReachableStates(machine);
  const reachableSet = new Set(reachable);
  const unreachable = machine.states.filter(s => !reachableSet.has(s.id)).map(s => s.id);

  // Compute states that can reach at least one final state (reverse BFS)
  const canReachFinal = new Set<string>(machine.finalStateIds);
  const reverseQueue = [...machine.finalStateIds];

  while (reverseQueue.length > 0) {
    const curr = reverseQueue.shift()!;
    // Find all states with transitions pointing to curr
    const incoming = machine.transitions.filter(t => t.to === curr);
    for (const edge of incoming) {
      if (!canReachFinal.has(edge.from)) {
        canReachFinal.add(edge.from);
        reverseQueue.push(edge.from);
      }
    }
  }

  // Dead states are reachable states that CANNOT reach any final state
  const deadStates = reachable.filter(id => !canReachFinal.has(id));

  // Missing transitions for DFA
  const missingTransitions: { stateId: string; symbol: string }[] = [];
  let isDeterministic = true;
  let epsilonCount = 0;

  for (const st of machine.states) {
    const outgoing = machine.transitions.filter(t => t.from === st.id);

    // Count epsilons
    for (const edge of outgoing) {
      if (edge.symbols.some(isEpsilon)) {
        epsilonCount++;
        isDeterministic = false;
      }
    }

    // Check determinism: no symbol can appear more than once in outgoing transitions from st
    const symbolCounts = new Map<string, number>();
    for (const edge of outgoing) {
      for (const sym of edge.symbols) {
        if (!isEpsilon(sym)) {
          symbolCounts.set(sym, (symbolCounts.get(sym) || 0) + 1);
        }
      }
    }

    for (const [sym, count] of symbolCounts.entries()) {
      if (count > 1) {
        isDeterministic = false;
      }
    }

    // Check missing transitions for each symbol in alphabet
    for (const sym of alphabet) {
      if (!symbolCounts.has(sym) || symbolCounts.get(sym) === 0) {
        missingTransitions.push({ stateId: st.id, symbol: sym });
      }
    }
  }

  return {
    numStates: machine.states.length,
    numTransitions: machine.transitions.length,
    numFinalStates: machine.finalStateIds.length,
    alphabetSize: alphabet.length,
    reachableStates: reachable,
    unreachableStates: unreachable,
    deadStates,
    missingTransitions,
    isDeterministic,
    epsilonCount,
  };
}

// Generate diagnostic issues and suggestions
export function debugAutomaton(machine: AutomatonDefinition): DebugIssue[] {
  const issues: DebugIssue[] = [];
  const stats = analyzeMachine(machine);

  // 1. Start state check
  if (!machine.startStateId) {
    issues.push({
      id: 'issue-no-start',
      severity: 'ERROR',
      title: 'Missing Start State',
      message: 'The automaton does not have an initial start state defined.',
      suggestion: 'Right-click or toggle a state to designate it as the Start State (→).',
    });
  } else if (!machine.states.some(s => s.id === machine.startStateId)) {
    issues.push({
      id: 'issue-invalid-start',
      severity: 'ERROR',
      title: 'Invalid Start State',
      message: `Start state ID "${machine.startStateId}" does not exist in the state list.`,
      suggestion: 'Select a valid existing state to be the start state.',
    });
  }

  // 2. Final state check
  if (machine.finalStateIds.length === 0) {
    issues.push({
      id: 'issue-no-final',
      severity: 'WARNING',
      title: 'No Accepting (Final) State',
      message: 'The machine has 0 final states. It will reject all input strings, recognizing the empty language ∅.',
      suggestion: 'Set at least one state as a Final State (double circle) if the language is non-empty.',
    });
  }

  // 3. Unreachable states
  if (stats.unreachableStates.length > 0) {
    const labels = stats.unreachableStates
      .map(id => machine.states.find(s => s.id === id)?.label || id)
      .join(', ');
    issues.push({
      id: 'issue-unreachable',
      severity: 'WARNING',
      title: 'Unreachable State(s) Detected',
      message: `State(s) {${labels}} cannot be reached from the start state.`,
      suggestion: `Add transitions leading to these states, or remove them during minimization.`,
      affectedStates: stats.unreachableStates,
    });
  }

  // 4. Dead states
  if (stats.deadStates.length > 0) {
    const labels = stats.deadStates
      .map(id => machine.states.find(s => s.id === id)?.label || id)
      .join(', ');
    issues.push({
      id: 'issue-dead-state',
      severity: 'WARNING',
      title: 'Dead / Sink State Detected',
      message: `State(s) {${labels}} are reachable but have no path to any accepting state. Any computation entering them will reject.`,
      suggestion: 'If this is an intentional trap state for a DFA, this is valid. Otherwise, add transitions towards final states.',
      affectedStates: stats.deadStates,
    });
  }

  // 5. DFA specific checks
  if (machine.type === 'DFA') {
    if (stats.epsilonCount > 0) {
      issues.push({
        id: 'issue-dfa-epsilon',
        severity: 'ERROR',
        title: 'ε-Transition in Strict DFA',
        message: `Found ${stats.epsilonCount} ε-transition(s). A deterministic finite automaton cannot contain ε-transitions.`,
        suggestion: 'Convert the machine type to ε-NFA or replace ε-transitions with explicit symbol transitions.',
      });
    }

    if (!stats.isDeterministic && stats.epsilonCount === 0) {
      issues.push({
        id: 'issue-dfa-nondeterministic',
        severity: 'ERROR',
        title: 'Non-deterministic Branching in DFA',
        message: 'A state has multiple outgoing transitions on the same symbol.',
        suggestion: 'Ensure each state has at most one outgoing transition per alphabet symbol, or switch type to NFA.',
      });
    }

    if (stats.missingTransitions.length > 0) {
      const examples = stats.missingTransitions
        .slice(0, 3)
        .map(
          m =>
            `State '${machine.states.find(s => s.id === m.stateId)?.label || m.stateId}' on '${
              m.symbol
            }'`
        )
        .join('; ');
      issues.push({
        id: 'issue-missing-transitions',
        severity: 'WARNING',
        title: 'Missing DFA Transitions (Incomplete δ)',
        message: `${stats.missingTransitions.length} transition(s) are missing for the alphabet. For instance: ${examples}.`,
        suggestion: 'In a complete DFA, δ(q, a) must be defined for all q ∈ Q and a ∈ Σ. Consider adding a sink/trap state.',
      });
    }
  }

  if (issues.length === 0) {
    issues.push({
      id: 'issue-perfect',
      severity: 'INFO',
      title: 'Machine Structure Valid',
      message: 'All structural validations passed. The automaton is properly formed and ready for simulation!',
    });
  }

  return issues;
}
