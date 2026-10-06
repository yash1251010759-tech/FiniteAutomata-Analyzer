import { CFGDefinition, CFGDerivationStep, CFGProduction, ParseTreeNode } from '../types/automata';

export interface CFGAnalysisResult {
  valid: boolean;
  error?: string;
  leftmostDerivation: CFGDerivationStep[];
  rightmostDerivation: CFGDerivationStep[];
  parseTree?: ParseTreeNode;
  targetString: string;
}

// Check if a character is uppercase (standard variable)
export function isVariable(char: string, variables: string[]): boolean {
  return variables.includes(char);
}

// Generate Derivation and Parse Tree using BFS search (depth limited)
export function deriveString(cfg: CFGDefinition, target: string): CFGAnalysisResult {
  const targetClean = target === 'ε' || target === 'λ' ? '' : target;
  const maxDepth = 12;
  const maxStates = 4000;

  // Search queue for derivation: { sententialForm, steps: CFGDerivationStep[], tree: ParseTreeNode }
  interface QueueItem {
    form: string;
    steps: CFGDerivationStep[];
    tree: ParseTreeNode;
  }

  const initialTree: ParseTreeNode = {
    id: 'node-root',
    symbol: cfg.startVariable,
    children: [],
  };

  const initialStep: CFGDerivationStep = {
    step: 0,
    sententialForm: cfg.startVariable,
    explanation: `Start with axiom symbol '${cfg.startVariable}'.`,
  };

  // BFS Queue
  const queue: QueueItem[] = [
    {
      form: cfg.startVariable,
      steps: [initialStep],
      tree: initialTree,
    },
  ];

  let explored = 0;
  let foundItem: QueueItem | null = null;

  while (queue.length > 0 && explored < maxStates) {
    explored++;
    const current = queue.shift()!;

    // Check if current form is pure terminals
    const currentTerminalsOnly = current.form
      .split('')
      .every(ch => !cfg.variables.includes(ch));

    if (currentTerminalsOnly) {
      if (current.form === targetClean) {
        foundItem = current;
        break;
      }
      continue; // Terminal string that didn't match target
    }

    if (current.steps.length > maxDepth) continue;

    // Prune forms that are already longer than target (excluding variables that can expand to epsilon)
    const terminalCount = current.form
      .split('')
      .filter(ch => !cfg.variables.includes(ch)).length;
    if (terminalCount > targetClean.length) continue;

    // Find leftmost variable
    const leftmostIdx = current.form
      .split('')
      .findIndex(ch => cfg.variables.includes(ch));
    if (leftmostIdx === -1) continue;

    const varToReplace = current.form[leftmostIdx];
    const matchingProductions = cfg.productions.filter(p => p.variable === varToReplace);

    for (const prod of matchingProductions) {
      const rep = prod.replacement === 'ε' || prod.replacement === 'λ' ? '' : prod.replacement;
      const nextForm =
        current.form.slice(0, leftmostIdx) + rep + current.form.slice(leftmostIdx + 1);

      const nextStep: CFGDerivationStep = {
        step: current.steps.length,
        sententialForm: nextForm === '' ? 'ε' : nextForm,
        appliedProduction: prod,
        replacedIndex: leftmostIdx,
        explanation: `Apply rule ${prod.variable} → ${prod.replacement} to '${varToReplace}' at index ${leftmostIdx}.`,
      };

      // Clone and expand parse tree at first leaf matching varToReplace
      const nextTree = cloneTree(current.tree);
      expandTreeLeaf(nextTree, varToReplace, prod.replacement);

      queue.push({
        form: nextForm,
        steps: [...current.steps, nextStep],
        tree: nextTree,
      });
    }
  }

  if (!foundItem) {
    return {
      valid: false,
      error: `Could not derive string "${target || 'ε'}" within search depth of ${maxDepth} steps. The string may not belong to L(G) or requires higher depth.`,
      leftmostDerivation: [],
      rightmostDerivation: [],
      targetString: target,
    };
  }

  return {
    valid: true,
    leftmostDerivation: foundItem.steps,
    rightmostDerivation: foundItem.steps, // Leftmost is canonical
    parseTree: foundItem.tree,
    targetString: target,
  };
}

let nodeCounter = 0;
function cloneTree(node: ParseTreeNode): ParseTreeNode {
  return {
    id: node.id,
    symbol: node.symbol,
    children: node.children.map(cloneTree),
  };
}

function expandTreeLeaf(root: ParseTreeNode, targetVar: string, replacement: string): boolean {
  if (root.symbol === targetVar && root.children.length === 0) {
    const chars = replacement === 'ε' || replacement === 'λ' ? ['ε'] : replacement.split('');
    root.children = chars.map(c => ({
      id: `node-${nodeCounter++}`,
      symbol: c,
      children: [],
    }));
    return true;
  }

  for (const child of root.children) {
    const expanded = expandTreeLeaf(child, targetVar, replacement);
    if (expanded) return true;
  }

  return false;
}

// Predefined CFGs
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
    id: 'cfg-parens',
    name: 'Balanced Parentheses ()',
    variables: ['S'],
    terminals: ['(', ')'],
    startVariable: 'S',
    productions: [
      { id: 'p1', variable: 'S', replacement: '(S)' },
      { id: 'p2', variable: 'S', replacement: 'SS' },
      { id: 'p3', variable: 'S', replacement: 'ε' },
    ],
  },
  {
    id: 'cfg-palindromes',
    name: 'Palindromes over {0, 1}',
    variables: ['S'],
    terminals: ['0', '1'],
    startVariable: 'S',
    productions: [
      { id: 'p1', variable: 'S', replacement: '0S0' },
      { id: 'p2', variable: 'S', replacement: '1S1' },
      { id: 'p3', variable: 'S', replacement: '0' },
      { id: 'p4', variable: 'S', replacement: '1' },
      { id: 'p5', variable: 'S', replacement: 'ε' },
    ],
  },
];

// Generate valid sample strings from CFG up to maxCount
export function generateSampleStringsFromCfg(
  cfg: CFGDefinition,
  maxCount = 12,
  maxDepth = 8
): string[] {
  const results = new Set<string>();
  const queue: { form: string; depth: number }[] = [{ form: cfg.startVariable, depth: 0 }];
  const visited = new Set<string>([cfg.startVariable]);

  while (queue.length > 0 && results.size < maxCount) {
    const { form, depth } = queue.shift()!;

    const isTerminalString = form.split('').every(ch => !cfg.variables.includes(ch));
    if (isTerminalString) {
      results.add(form === '' ? 'ε' : form);
      continue;
    }

    if (depth >= maxDepth) continue;

    const leftmostIdx = form.split('').findIndex(ch => cfg.variables.includes(ch));
    if (leftmostIdx === -1) continue;

    const varToReplace = form[leftmostIdx];
    const prods = cfg.productions.filter(p => p.variable === varToReplace);

    for (const prod of prods) {
      const rep = prod.replacement === 'ε' || prod.replacement === 'λ' ? '' : prod.replacement;
      const nextForm = form.slice(0, leftmostIdx) + rep + form.slice(leftmostIdx + 1);

      if (nextForm.length <= 15 && !visited.has(nextForm)) {
        visited.add(nextForm);
        queue.push({ form: nextForm, depth: depth + 1 });
      }
    }
  }

  return Array.from(results);
}

