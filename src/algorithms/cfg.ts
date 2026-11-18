import { CFGDefinition, CFGDerivationStep, CFGProduction, ParseTreeNode } from '../types/automata';

export interface CFGAnalysisResult {
  valid: boolean;
  error?: string;
  leftmostDerivation: CFGDerivationStep[];
  rightmostDerivation: CFGDerivationStep[];
  parseTree?: ParseTreeNode;
  targetString: string;
}

export interface CFGSymbols {
  variables: string[];
  terminals: string[];
  undefinedVariables: string[];
  invalidLeftSides: string[];
  duplicateRules: CFGProduction[];
}

const EPSILON_ALIASES = new Set(['ε', 'λ', 'eps', 'epsilon']);
const MAX_PARSE_ITERATIONS = 100_000;
const MAX_SAMPLE_ITERATIONS = 100_000;
const MAX_SAMPLE_LENGTH = 20;
const MAX_SAMPLE_FORM_LENGTH = 28;

export function isEpsilonProduction(value: string): boolean {
  return EPSILON_ALIASES.has(value.trim().toLowerCase());
}

export function isVariableSymbol(symbol: string): boolean {
  return /^[A-Z]$/.test(symbol);
}

export function isVariable(char: string, variables: string[]): boolean {
  return variables.includes(char);
}

export function getCFGSymbols(cfg: CFGDefinition): CFGSymbols {
  const variables = new Set<string>();
  if (isVariableSymbol(cfg.startVariable)) variables.add(cfg.startVariable);
  const definedVariables = new Set<string>();
  const invalidLeftSides: string[] = [];
  const duplicateRules: CFGProduction[] = [];
  const rules = new Set<string>();

  for (const production of cfg.productions) {
    if (!isVariableSymbol(production.variable)) {
      invalidLeftSides.push(production.variable);
    } else {
      variables.add(production.variable);
      definedVariables.add(production.variable);
    }

    const key = JSON.stringify([production.variable, normalizeReplacement(production.replacement)]);
    if (rules.has(key)) duplicateRules.push(production);
    rules.add(key);

    if (!isEpsilonProduction(production.replacement)) {
      for (const symbol of production.replacement) {
        if (isVariableSymbol(symbol)) variables.add(symbol);
      }
    }
  }

  const variableList = [...variables].sort();
  const terminals = new Set<string>();
  for (const production of cfg.productions) {
    if (isEpsilonProduction(production.replacement)) continue;
    for (const symbol of production.replacement) {
      if (!isVariableSymbol(symbol)) terminals.add(symbol);
    }
  }

  return {
    variables: variableList,
    terminals: [...terminals].sort(),
    undefinedVariables: variableList.filter(variable => !definedVariables.has(variable)),
    invalidLeftSides,
    duplicateRules,
  };
}

function normalizeReplacement(replacement: string): string {
  return isEpsilonProduction(replacement) ? '' : replacement;
}

function getVariableSet(cfg: CFGDefinition): Set<string> {
  return new Set(getCFGSymbols(cfg).variables);
}

function getMinimumYieldLengths(cfg: CFGDefinition): Map<string, number> {
  const variables = getVariableSet(cfg);
  const minimums = new Map([...variables].map(variable => [variable, Number.POSITIVE_INFINITY]));
  let changed = true;

  while (changed) {
    changed = false;
    for (const production of cfg.productions) {
      if (!isVariableSymbol(production.variable)) continue;
      const replacement = normalizeReplacement(production.replacement);
      let length = 0;
      let derivable = true;
      for (const symbol of replacement) {
        if (variables.has(symbol)) {
          const minimum = minimums.get(symbol) ?? Number.POSITIVE_INFINITY;
          if (!Number.isFinite(minimum)) {
            derivable = false;
            break;
          }
          length += minimum;
        } else {
          length++;
        }
      }

      const current = minimums.get(production.variable) ?? Number.POSITIVE_INFINITY;
      if (derivable && length < current) {
        minimums.set(production.variable, length);
        changed = true;
      }
    }
  }

  return minimums;
}

function minimumFormLength(form: string, variables: Set<string>, minimums: Map<string, number>): number {
  let length = 0;
  for (const symbol of form) {
    if (variables.has(symbol)) {
      const minimum = minimums.get(symbol) ?? Number.POSITIVE_INFINITY;
      if (!Number.isFinite(minimum)) return Number.POSITIVE_INFINITY;
      length += minimum;
    } else {
      length++;
    }
  }
  return length;
}

function canStillMatch(form: string, target: string, variables: Set<string>): boolean {
  const firstVariable = [...form].findIndex(symbol => variables.has(symbol));
  if (firstVariable === -1) return form === target;

  const lastVariable = [...form].findLastIndex(symbol => variables.has(symbol));
  const fixedPrefix = form.slice(0, firstVariable);
  const fixedSuffix = form.slice(lastVariable + 1);
  return target.startsWith(fixedPrefix) && target.endsWith(fixedSuffix);
}

function cloneTree(node: ParseTreeNode): ParseTreeNode {
  return {
    id: node.id,
    symbol: node.symbol,
    children: node.children.map(cloneTree),
  };
}

function expandLeftmostVariable(
  root: ParseTreeNode,
  variables: Set<string>,
  replacement: string,
  nextId: () => string
): boolean {
  if (variables.has(root.symbol) && root.children.length === 0) {
    const symbols = normalizeReplacement(replacement);
    root.children = symbols
      ? [...symbols].map(symbol => ({ id: nextId(), symbol, children: [] }))
      : [{ id: nextId(), symbol: 'ε', children: [] }];
    return true;
  }

  for (const child of root.children) {
    if (expandLeftmostVariable(child, variables, replacement, nextId)) return true;
  }
  return false;
}

interface DerivationSearchNode {
  form: string;
  steps: CFGDerivationStep[];
  tree: ParseTreeNode;
}

export function deriveString(cfg: CFGDefinition, target: string): CFGAnalysisResult {
  const targetClean = isEpsilonProduction(target) ? '' : target;
  const symbols = getCFGSymbols(cfg);
  const baseResult = {
    targetString: target,
    leftmostDerivation: [] as CFGDerivationStep[],
    rightmostDerivation: [] as CFGDerivationStep[],
  };

  if (symbols.invalidLeftSides.length > 0) {
    return {
      ...baseResult,
      valid: false,
      error: `Invalid rule left side '${symbols.invalidLeftSides[0]}': the left side must be a single uppercase variable.`,
    };
  }
  if (symbols.duplicateRules.length > 0) {
    const duplicate = symbols.duplicateRules[0];
    return {
      ...baseResult,
      valid: false,
      error: `Duplicate rule: ${duplicate.variable} → ${duplicate.replacement}.`,
    };
  }

  const alphabet = new Set(symbols.terminals);
  const invalidInputSymbols = [...new Set([...targetClean].filter(symbol => !alphabet.has(symbol)))];
  if (invalidInputSymbols.length > 0) {
    return {
      ...baseResult,
      valid: false,
      error: `Input must only contain terminals from Σ = {${symbols.terminals.join(', ')}}. Invalid symbol(s): ${invalidInputSymbols.join(', ')}`,
    };
  }

  const variables = new Set(symbols.variables);
  const minimums = getMinimumYieldLengths(cfg);
  const initialStep: CFGDerivationStep = {
    step: 0,
    sententialForm: cfg.startVariable,
    explanation: `Start with axiom symbol '${cfg.startVariable}'.`,
  };
  const initialNode: DerivationSearchNode = {
    form: cfg.startVariable,
    steps: [initialStep],
    tree: { id: 'node-root', symbol: cfg.startVariable, children: [] },
  };
  const queue: DerivationSearchNode[] = [initialNode];
  const visited = new Set([initialNode.form]);
  let queueIndex = 0;
  let found: DerivationSearchNode | undefined;
  let explored = 0;
  let nodeId = 0;

  while (queueIndex < queue.length && explored < MAX_PARSE_ITERATIONS) {
    const current = queue[queueIndex++];
    explored++;

    if (
      [...current.form].every(symbol => !variables.has(symbol)) &&
      current.form === targetClean
    ) {
      found = current;
      break;
    }

    if (
      minimumFormLength(current.form, variables, minimums) > targetClean.length ||
      current.form.length > Math.max(targetClean.length * 2 + 20, 20) ||
      !canStillMatch(current.form, targetClean, variables)
    ) {
      continue;
    }

    const leftmostIndex = [...current.form].findIndex(symbol => variables.has(symbol));
    if (leftmostIndex < 0) continue;
    const variable = current.form[leftmostIndex];

    for (const production of cfg.productions) {
      if (production.variable !== variable) continue;
      const replacement = normalizeReplacement(production.replacement);
      const nextForm =
        current.form.slice(0, leftmostIndex) + replacement + current.form.slice(leftmostIndex + 1);
      if (visited.has(nextForm)) continue;
      visited.add(nextForm);

      const nextTree = cloneTree(current.tree);
      expandLeftmostVariable(nextTree, variables, production.replacement, () => `node-${nodeId++}`);
      const nextStep: CFGDerivationStep = {
        step: current.steps.length,
        sententialForm: nextForm || 'ε',
        appliedProduction: production,
        replacedIndex: leftmostIndex,
        explanation: `Apply rule ${production.variable} → ${production.replacement} to '${variable}' at index ${leftmostIndex}.`,
      };
      queue.push({
        form: nextForm,
        steps: [...current.steps, nextStep],
        tree: nextTree,
      });
    }
  }

  if (!found) {
    const error = explored >= MAX_PARSE_ITERATIONS
      ? `Could not decide membership within the search limit of ${MAX_PARSE_ITERATIONS} derivations.`
      : `String "${targetClean || 'ε'}" is not derivable from ${cfg.startVariable} using these productions.`;
    return { ...baseResult, valid: false, error };
  }

  return {
    ...baseResult,
    valid: true,
    leftmostDerivation: found.steps,
    rightmostDerivation: found.steps,
    parseTree: found.tree,
  };
}

export const sampleGrammars: CFGDefinition[] = [
  {
    id: 'cfg-anbn',
    name: 'Language {a^n b^n | n ≥ 0}',
    variables: ['S'],
    terminals: ['a', 'b'],
    startVariable: 'S',
    productions: [
      { id: 'p1', variable: 'S', replacement: 'aSb' },
      { id: 'p2', variable: 'S', replacement: 'ε' },
    ],
  },
  {
    id: 'cfg-a-star-b',
    name: 'Language {a^n b | n ≥ 1}',
    variables: ['S', 'A'],
    terminals: ['a', 'b'],
    startVariable: 'S',
    productions: [
      { id: 'p1', variable: 'S', replacement: 'aA' },
      { id: 'p2', variable: 'A', replacement: 'aA' },
      { id: 'p3', variable: 'A', replacement: 'b' },
    ],
  },
  {
    id: 'cfg-parens',
    name: 'Balanced Parentheses ()',
    variables: ['S'],
    terminals: ['(', ')'],
    startVariable: 'S',
    productions: [
      { id: 'p1', variable: 'S', replacement: 'SS' },
      { id: 'p2', variable: 'S', replacement: '(S)' },
      { id: 'p3', variable: 'S', replacement: 'ε' },
    ],
  },
  {
    id: 'cfg-palindromes',
    name: 'Palindromes over {a, b}',
    variables: ['S'],
    terminals: ['a', 'b'],
    startVariable: 'S',
    productions: [
      { id: 'p1', variable: 'S', replacement: 'aSa' },
      { id: 'p2', variable: 'S', replacement: 'bSb' },
      { id: 'p3', variable: 'S', replacement: 'a' },
      { id: 'p4', variable: 'S', replacement: 'b' },
      { id: 'p5', variable: 'S', replacement: 'ε' },
    ],
  },
];

export function generateSampleStringsFromCfg(
  cfg: CFGDefinition,
  maxCount = 10,
  maxLength = MAX_SAMPLE_LENGTH
): string[] {
  const symbols = getCFGSymbols(cfg);
  if (
    symbols.invalidLeftSides.length > 0 ||
    symbols.duplicateRules.length > 0 ||
    !cfg.productions.some(production => production.variable === cfg.startVariable)
  ) {
    return [];
  }

  const variables = new Set(symbols.variables);
  const minimums = getMinimumYieldLengths(cfg);
  const queue = [cfg.startVariable];
  const visited = new Set(queue);
  const results = new Set<string>();
  let queueIndex = 0;
  let explored = 0;

  while (
    queueIndex < queue.length &&
    explored < MAX_SAMPLE_ITERATIONS
  ) {
    const form = queue[queueIndex++];
    explored++;
    const containsVariable = [...form].some(symbol => variables.has(symbol));
    if (!containsVariable) {
      results.add(form);
      continue;
    }

    if (
      minimumFormLength(form, variables, minimums) > maxLength ||
      form.length > MAX_SAMPLE_FORM_LENGTH
    ) {
      continue;
    }

    const leftmostIndex = [...form].findIndex(symbol => variables.has(symbol));
    const variable = form[leftmostIndex];
    for (const production of cfg.productions) {
      if (production.variable !== variable) continue;
      const replacement = normalizeReplacement(production.replacement);
      const nextForm = form.slice(0, leftmostIndex) + replacement + form.slice(leftmostIndex + 1);
      if (nextForm.length <= MAX_SAMPLE_FORM_LENGTH && !visited.has(nextForm)) {
        visited.add(nextForm);
        queue.push(nextForm);
      }
    }
  }

  return [...results]
    .filter(value => value.length <= maxLength)
    .sort((left, right) => left.length - right.length || left.localeCompare(right))
    .slice(0, maxCount)
    .map(value => value || 'ε');
}

export function hasTerminalDerivation(cfg: CFGDefinition): boolean {
  const minimum = getMinimumYieldLengths(cfg).get(cfg.startVariable);
  return minimum !== undefined && Number.isFinite(minimum);
}
