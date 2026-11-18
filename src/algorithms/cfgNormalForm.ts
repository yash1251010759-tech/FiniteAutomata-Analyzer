import { CFGDefinition, CFGProduction } from '../types/automata';
import { getCFGSymbols, isEpsilonProduction } from './cfg';

export interface CnfConversionResult {
  grammar: CFGDefinition;
  steps: string[];
}

export function convertCfgToCnf(cfg: CFGDefinition): CnfConversionResult {
  const analysis = getCFGSymbols(cfg);
  if (analysis.invalidLeftSides.length) throw new Error(`Invalid CFG left side '${analysis.invalidLeftSides[0]}'.`);
  if (analysis.duplicateRules.length) throw new Error('Remove duplicate CFG productions before converting to CNF.');
  if (analysis.undefinedVariables.length) throw new Error(`Variable ${analysis.undefinedVariables[0]} has no rules.`);

  const steps = [
    'Introduce a fresh start variable when necessary and remove ε-productions while preserving nullable derivations.',
    'Remove unit productions by computing each variable’s unit-production closure.',
    'Remove non-generating and unreachable variables.',
    'Replace terminals in long right-hand sides and split productions longer than two symbols.',
  ];
  const productions = cfg.productions.map(rule => ({
    variable: rule.variable,
    replacement: isEpsilonProduction(rule.replacement) ? '' : rule.replacement,
  }));
  const variables = new Set(analysis.variables);
  const freshVariable = (): string => {
    for (let code = 90; code >= 65; code--) {
      const candidate = String.fromCharCode(code);
      if (!variables.has(candidate)) {
        variables.add(candidate);
        return candidate;
      }
    }
    throw new Error('CNF conversion needs another single-letter variable, but all uppercase variables are in use.');
  };
  const startAppearsOnRight = productions.some(rule => rule.replacement.includes(cfg.startVariable));
  let start = cfg.startVariable;
  if (startAppearsOnRight || productions.some(rule => rule.variable === cfg.startVariable && rule.replacement === '')) {
    start = freshVariable();
    productions.push({ variable: start, replacement: cfg.startVariable });
  }

  const nullable = new Set<string>();
  let changed = true;
  while (changed) {
    changed = false;
    for (const rule of productions) {
      if (rule.replacement === '' ||
          [...rule.replacement].every(symbol => variables.has(symbol) && nullable.has(symbol))) {
        if (!nullable.has(rule.variable)) {
          nullable.add(rule.variable);
          changed = true;
        }
      }
    }
  }

  const expanded: typeof productions = [];
  for (const rule of productions) {
    if (rule.replacement === '') continue;
    const chars = [...rule.replacement];
    const nullableIndexes = chars.flatMap((symbol, index) =>
      variables.has(symbol) && nullable.has(symbol) ? [index] : []
    );
    if (nullableIndexes.length > 16) throw new Error('Too many nullable positions to expand safely.');
    for (let mask = 0; mask < (1 << nullableIndexes.length); mask++) {
      const removed = new Set(nullableIndexes.filter((_, bit) => (mask & (1 << bit)) !== 0));
      const replacement = chars.filter((_, index) => !removed.has(index)).join('');
      if (replacement) expanded.push({ variable: rule.variable, replacement });
    }
  }
  if (nullable.has(start)) expanded.push({ variable: start, replacement: '' });

  const unitEdges = new Map<string, Set<string>>();
  for (const variable of variables) unitEdges.set(variable, new Set([variable]));
  for (const rule of expanded) {
    if (rule.replacement.length === 1 && variables.has(rule.replacement)) {
      unitEdges.get(rule.variable)?.add(rule.replacement);
    }
  }
  for (const variable of variables) {
    const reachable = unitEdges.get(variable) || new Set([variable]);
    const queue = [...reachable];
    for (let index = 0; index < queue.length; index++) {
      for (const target of unitEdges.get(queue[index]) || []) {
        if (reachable.has(target)) continue;
        reachable.add(target);
        queue.push(target);
      }
    }
    unitEdges.set(variable, reachable);
  }
  const nonUnit = expanded.filter(rule =>
    !(rule.replacement.length === 1 && variables.has(rule.replacement))
  );
  const unitFree: typeof productions = [];
  for (const variable of variables) {
    for (const reached of unitEdges.get(variable) || []) {
      for (const rule of nonUnit) {
        if (rule.variable === reached) unitFree.push({ variable, replacement: rule.replacement });
      }
    }
  }

  const terminals = new Set(analysis.terminals);
  const terminalVariables = new Map<string, string>();
  for (const rule of unitFree) {
    for (const symbol of rule.replacement) {
      if (!variables.has(symbol) && rule.replacement.length > 1 && !terminalVariables.has(symbol)) {
        const variable = freshVariable();
        terminalVariables.set(symbol, variable);
        unitFree.push({ variable, replacement: symbol });
      }
    }
  }
  const normalized: typeof productions = [];
  for (const rule of unitFree) {
    const chars = [...rule.replacement];
    if (chars.length > 1) {
      normalized.push({
        variable: rule.variable,
        replacement: chars.map(symbol => terminalVariables.get(symbol) || symbol).join(''),
      });
    } else {
      normalized.push(rule);
    }
  }

  const binary: typeof productions = [];
  for (const rule of normalized) {
    const chars = [...rule.replacement];
    if (chars.length <= 2) {
      binary.push(rule);
      continue;
    }
    let from = rule.variable;
    for (let index = 0; index < chars.length - 2; index++) {
      const next = freshVariable();
      binary.push({ variable: from, replacement: chars[index] + next });
      from = next;
    }
    binary.push({ variable: from, replacement: chars.slice(-2).join('') });
  }

  const productive = new Set<string>();
  changed = true;
  while (changed) {
    changed = false;
    for (const rule of binary) {
      if ([...rule.replacement].every(symbol =>
        !variables.has(symbol) || productive.has(symbol)
      ) && !productive.has(rule.variable)) {
        productive.add(rule.variable);
        changed = true;
      }
    }
  }
  const reachable = new Set<string>([start]);
  const reachQueue = [start];
  for (let index = 0; index < reachQueue.length; index++) {
    for (const rule of binary.filter(item => item.variable === reachQueue[index])) {
      for (const symbol of rule.replacement) {
        if (variables.has(symbol) && productive.has(symbol) && !reachable.has(symbol)) {
          reachable.add(symbol);
          reachQueue.push(symbol);
        }
      }
    }
  }
  const usefulProductions = productive.has(start)
    ? binary.filter(rule => reachable.has(rule.variable) &&
      [...rule.replacement].every(symbol => !variables.has(symbol) || productive.has(symbol)))
    : [];
  const unique = new Map<string, CFGProduction>();
  let id = 0;
  for (const rule of usefulProductions) {
    unique.set(JSON.stringify([rule.variable, rule.replacement]), {
      id: `cnf-${id++}`,
      variable: rule.variable,
      replacement: rule.replacement || 'ε',
    });
  }
  const result: CFGDefinition = {
    ...cfg,
    id: `${cfg.id}-cnf`,
    name: `${cfg.name} (CNF)`,
    variables: [...new Set([start, ...usefulProductions.flatMap(rule => [
      rule.variable,
      ...[...rule.replacement].filter(symbol => variables.has(symbol)),
    ])])].sort(),
    terminals: [...terminals].sort(),
    startVariable: start,
    productions: [...unique.values()],
  };
  return { grammar: result, steps };
}
