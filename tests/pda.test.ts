import { describe, expect, test } from 'vitest';
import { samplePDAs, simulatePDA } from '../src/algorithms/pda';
import type { PDADefinition } from '../src/types/automata';

function preset(id: string): PDADefinition {
  const found = samplePDAs.find(machine => machine.id === id);
  if (!found) throw new Error(`Missing PDA preset: ${id}`);
  return found;
}

function accepts(machineId: string, input: string): boolean {
  return simulatePDA(preset(machineId), input).accepted;
}

describe('PDA presets', () => {
  test.each([
    ['01', true],
    ['0011', true],
    ['000111', true],
    ['0000000011111111', true],
    ['', false],
    ['0', false],
    ['1', false],
    ['10', false],
    ['011', false],
    ['001', false],
    ['0101', false],
    ['00111', false],
  ])('0^n1^n: %j -> %s', (input, expected) => {
    expect(accepts('pda-0n1n', input)).toBe(expected);
  });

  test.each([
    ['()', true],
    ['()()', true],
    ['(())', true],
    ['(()())', true],
    ['(', false],
    [')', false],
    [')(', false],
    ['(()', false],
  ])('balanced parentheses: %j -> %s', (input, expected) => {
    expect(accepts('pda-balanced-parens', input)).toBe(expected);
  });

  test.each([
    ['', true],
    ['a', true],
    ['aa', true],
    ['aba', true],
    ['abba', true],
    ['aabaa', true],
    ['ab', false],
    ['abb', false],
    ['abab', false],
  ])('palindromes: %j -> %s', (input, expected) => {
    expect(accepts('pda-palindrome', input)).toBe(expected);
  });

  test.each([
    ['aa', true],
    ['abba', true],
    ['baab', true],
    ['a', false],
    ['ab', false],
    ['aba', false],
  ])('w w^R: %j -> %s', (input, expected) => {
    expect(accepts('pda-even-palindrome', input)).toBe(expected);
  });

  test.each([
    ['', true],
    ['01', true],
    ['10', true],
    ['0011', true],
    ['0110', true],
    ['001', false],
    ['000', false],
  ])('equal number of 0s and 1s: %j -> %s', (input, expected) => {
    expect(accepts('pda-equal-zeros-ones', input)).toBe(expected);
  });

  test.each([
    ['abcba', true],
    ['abccba', false],
    ['aba', false],
  ])('center-marker palindrome: %j -> %s', (input, expected) => {
    expect(accepts('pda-wcwR', input)).toBe(expected);
  });

  test.each([
    ['abb', true],
    ['aabbbb', true],
    ['ab', false],
    ['abbb', false],
    ['', false],
  ])('a^n b^{2n}: %j -> %s', (input, expected) => {
    expect(accepts('pda-anb2n', input)).toBe(expected);
  });
});

describe('PDA simulator', () => {
  test('pushes the first listed symbol onto the top of the stack', () => {
    const result = simulatePDA(preset('pda-0n1n'), '0');
    expect(result.steps[1].stack).toEqual(['Z0', '0']);
  });

  test('returns the accepting nondeterministic palindrome path', () => {
    const result = simulatePDA(preset('pda-palindrome'), 'aabaa');
    expect(result.accepted).toBe(true);
    expect(result.steps.at(-1)?.remainingInput).toBe('');
    expect(result.finalStack).toEqual([]);
  });

  test('follows epsilon transitions after consuming the input', () => {
    const result = simulatePDA(preset('pda-0n1n'), '01');
    expect(result.accepted).toBe(true);
    expect(result.steps.at(-1)?.appliedTransition?.inputSymbol).toBe('ε');
  });

  test('stops a PDA with an unbounded epsilon-push loop at the step limit', () => {
    const loopingPda: PDADefinition = {
      ...preset('pda-even-palindrome'),
      finalStateIds: [],
      transitions: [
        { from: 'q0', to: 'q0', inputSymbol: 'ε', popSymbol: 'ε', pushSymbols: ['A'] },
      ],
    };
    const result = simulatePDA(loopingPda, '');
    expect(result.accepted).toBe(false);
    expect(result.reason).toContain('safety limit');
    expect(result.steps.length).toBeLessThanOrEqual(1001);
  });

  test('warns when an input symbol is outside the input alphabet', () => {
    const result = simulatePDA(preset('pda-0n1n'), '0a');
    expect(result.accepted).toBe(false);
    expect(result.reason).toContain("Symbol 'a' is not in Σ = {0, 1}");
  });

  test('uses the same nondeterministic simulator for user-defined machines', () => {
    const custom: PDADefinition = {
      ...preset('pda-even-palindrome'),
      id: 'custom-even-palindrome',
      name: 'Custom even palindrome',
    };
    expect(simulatePDA(custom, 'baab').accepted).toBe(true);
    expect(simulatePDA(custom, 'aba').accepted).toBe(false);
  });
});
