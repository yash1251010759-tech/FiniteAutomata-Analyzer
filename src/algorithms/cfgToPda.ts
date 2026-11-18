import { CFGDefinition, PDADefinition, StateNode } from '../types/automata';
import { getCFGSymbols, isEpsilonProduction } from './cfg';

export function convertCfgToPda(cfg: CFGDefinition): PDADefinition {
  const symbols = getCFGSymbols(cfg);
  if (symbols.invalidLeftSides.length > 0) {
    throw new Error(`Invalid CFG rule left side '${symbols.invalidLeftSides[0]}'.`);
  }
  if (symbols.duplicateRules.length > 0) {
    const duplicate = symbols.duplicateRules[0];
    throw new Error(`Duplicate CFG rule ${duplicate.variable} → ${duplicate.replacement}.`);
  }
  if (symbols.undefinedVariables.length > 0) {
    throw new Error(`Variable ${symbols.undefinedVariables[0]} has no rules, so it can never be eliminated.`);
  }
  if (!cfg.startVariable || !cfg.productions.some(production => production.variable === cfg.startVariable)) {
    throw new Error(`Start variable '${cfg.startVariable}' has no productions.`);
  }

  const state: StateNode = { id: 'q', label: 'q', x: 300, y: 200, isStart: true, isFinal: true };
  const transitions: PDADefinition['transitions'] = [];
  for (const production of cfg.productions) {
    const pushSymbols = isEpsilonProduction(production.replacement)
      ? []
      : [...production.replacement];
    transitions.push({
      id: `production-${production.id}`,
      from: state.id,
      to: state.id,
      inputSymbol: 'ε',
      popSymbol: production.variable,
      pushSymbols,
    });
  }
  for (const terminal of symbols.terminals) {
    transitions.push({
      id: `match-${terminal}`,
      from: state.id,
      to: state.id,
      inputSymbol: terminal,
      popSymbol: terminal,
      pushSymbols: [],
    });
  }

  return {
    id: `${cfg.id}-pda`,
    name: `${cfg.name} (equivalent PDA)`,
    description: 'Nondeterministically expands variables and matches terminal stack symbols against the input.',
    states: [state],
    inputAlphabet: symbols.terminals,
    stackAlphabet: [...new Set([...symbols.variables, ...symbols.terminals])],
    startStateId: state.id,
    startStackSymbol: cfg.startVariable,
    finalStateIds: [state.id],
    transitions,
    acceptMode: 'EMPTY_STACK',
  };
}
