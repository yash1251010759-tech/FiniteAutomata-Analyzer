import { describe, expect, test } from 'vitest';
import {
  deriveString,
  generateSampleStringsFromCfg,
  getCFGSymbols,
  hasTerminalDerivation,
  sampleGrammars,
} from '../src/algorithms/cfg';
import type { CFGDefinition } from '../src/types/automata';

function grammar(
  productions: Array<[string, string]>,
  startVariable = 'S'
): CFGDefinition {
  return {
    id: 'test-grammar',
    name: 'Test grammar',
    variables: [],
    terminals: [],
    startVariable,
    productions: productions.map(([variable, replacement], index) => ({
      id: `r${index}`,
      variable,
      replacement,
    })),
  };
}

function accepted(cfg: CFGDefinition, input: string): boolean {
  return deriveString(cfg, input).valid;
}

describe('CFG parsing', () => {
  const anbn = grammar([['S', 'aSb'], ['S', 'ε']]);
  const aStar = grammar([['S', 'aA'], ['A', 'aA'], ['A', 'ε']]);
  const aPlusB = grammar([['S', 'aA'], ['A', 'aA'], ['A', 'b']]);
  const palindrome = grammar([
    ['S', 'aSa'],
    ['S', 'bSb'],
    ['S', 'a'],
    ['S', 'b'],
    ['S', 'ε'],
  ]);
  const parentheses = grammar([['S', 'SS'], ['S', '(S)'], ['S', 'ε']]);
  const leftRecursive = grammar([['S', 'Sa'], ['S', 'a']]);

  test.each([
    ['', true], ['ab', true], ['aabb', true], ['aaabbb', true],
    ['a', false], ['b', false], ['aab', false], ['abb', false], ['ba', false], ['abab', false],
  ])('S -> aSb | ε: %j -> %s', (input, expected) => {
    expect(accepted(anbn, input)).toBe(expected);
  });

  test.each([
    ['a', true], ['aa', true], ['aaa', true],
    ['', false], ['b', false], ['ab', false],
  ])('epsilon and recursive rules: %j -> %s', (input, expected) => {
    expect(accepted(aStar, input)).toBe(expected);
  });

  test.each([
    ['ab', true], ['aab', true], ['aaab', true],
    ['a', false], ['b', false], ['abb', false],
  ])('recursive rule with terminal base: %j -> %s', (input, expected) => {
    expect(accepted(aPlusB, input)).toBe(expected);
  });

  test.each([
    ['', true], ['a', true], ['b', true], ['aa', true], ['aba', true], ['abba', true], ['babab', true],
    ['ab', false], ['abb', false], ['abab', false],
  ])('palindromes: %j -> %s', (input, expected) => {
    expect(accepted(palindrome, input)).toBe(expected);
  });

  test.each([
    ['', true], ['()', true], ['()()', true], ['(())', true], ['(()())', true],
    ['(', false], [')', false], [')(', false], ['(()', false],
  ])('balanced parentheses: %j -> %s', (input, expected) => {
    expect(accepted(parentheses, input)).toBe(expected);
  });

  test.each([
    ['a', true], ['aa', true], ['aaaa', true],
    ['', false], ['b', false], ['ab', false],
  ])('left recursion terminates and parses: %j -> %s', (input, expected) => {
    expect(accepted(leftRecursive, input)).toBe(expected);
  });

  test('reports invalid input symbols before attempting a parse', () => {
    const result = deriveString(anbn, 'aaAA');
    expect(result.valid).toBe(false);
    expect(result.error).toBe(
      'Input must only contain terminals from Σ = {a, b}. Invalid symbol(s): A'
    );
  });

  test('returns a derivation and tree built from the same applied rules', () => {
    const result = deriveString(anbn, 'aabb');
    expect(result.valid).toBe(true);
    expect(result.leftmostDerivation.at(-1)?.sententialForm).toBe('aabb');
    expect(result.leftmostDerivation.filter(step => step.appliedProduction).length).toBe(3);
    expect(result.parseTree).toBeDefined();
  });

  test('supports unit productions and epsilon aliases', () => {
    const unitGrammar = grammar([['S', 'A'], ['A', 'B'], ['B', 'x'], ['A', 'epsilon']]);
    expect(accepted(unitGrammar, 'x')).toBe(true);
    expect(accepted(unitGrammar, '')).toBe(true);
  });
});

describe('CFG symbol analysis and generated samples', () => {
  test('derives variables and terminals from rules rather than stored headers', () => {
    const cfg = grammar([['S', 'aA'], ['A', 'b']]);
    expect(getCFGSymbols(cfg).variables).toEqual(['A', 'S']);
    expect(getCFGSymbols(cfg).terminals).toEqual(['a', 'b']);
  });

  test('warns about variables without productions', () => {
    const cfg = grammar([['S', 'aA']]);
    expect(getCFGSymbols(cfg).undefinedVariables).toContain('A');
    expect(hasTerminalDerivation(cfg)).toBe(false);
    expect(generateSampleStringsFromCfg(cfg)).toEqual([]);
    expect(deriveString(cfg, 'aA').valid).toBe(false);
    expect(deriveString(cfg, 'a').valid).toBe(false);
  });

  test('does not include sentential forms containing variables in samples', () => {
    const cfg = grammar([['S', 'aA']]);
    expect(generateSampleStringsFromCfg(cfg)).not.toContain('aA');
  });

  test('generates distinct epsilon-inclusive samples sorted by length then alphabetically', () => {
    const cfg = grammar([['S', 'aS'], ['S', 'bS'], ['S', 'ε']]);
    expect(generateSampleStringsFromCfg(cfg, 10, 2)).toEqual([
      'ε', 'a', 'b', 'aa', 'ab', 'ba', 'bb',
    ]);
  });

  test('every generated sample is accepted by its grammar parser', () => {
    for (const cfg of sampleGrammars) {
      const samples = generateSampleStringsFromCfg(cfg);
      expect(samples.length).toBeGreaterThan(0);
      for (const sample of samples) {
        expect(deriveString(cfg, sample).valid).toBe(true);
      }
    }
  });

  test('rejects duplicate exact rules', () => {
    const cfg = grammar([['S', 'a'], ['S', 'a']]);
    expect(deriveString(cfg, 'a').error).toBe('Duplicate rule: S → a.');
  });
});
