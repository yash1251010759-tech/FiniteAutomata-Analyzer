import { describe, expect, test } from 'vitest';
import {
  sampleTuringMachines,
  simulateTuringMachine,
  validateTuringMachine,
} from '../src/algorithms/turingMachine';
import type { TMDefinition } from '../src/types/automata';

function preset(id: string): TMDefinition {
  const found = sampleTuringMachines.find(machine => machine.id === id);
  if (!found) throw new Error(`Missing Turing machine preset: ${id}`);
  return found;
}

function accepts(id: string, input: string): boolean {
  return simulateTuringMachine(preset(id), input).status === 'ACCEPTED';
}

function binaryOutput(input: string): string {
  const result = simulateTuringMachine(preset('tm-binary-inc'), input);
  expect(result.status).toBe('ACCEPTED');
  return result.finalTape.join('').replace(/_+$/g, '');
}

describe('Turing Machine presets', () => {
  test.each([
    ['01', true], ['0011', true], ['000111', true],
    ['', false], ['0', false], ['1', false], ['10', false], ['011', false],
    ['001', false], ['0101', false],
  ])('0^n1^n: %j -> %s', (input, expected) => {
    expect(accepts('tm-0n1n', input)).toBe(expected);
  });

  test.each([
    ['abc', true], ['aabbcc', true], ['aaabbbccc', true],
    ['', false], ['ab', false], ['abcc', false], ['aabbc', false],
    ['acb', false], ['abcabc', false],
  ])('a^n b^n c^n: %j -> %s', (input, expected) => {
    expect(accepts('tm-anbncn', input)).toBe(expected);
  });

  test.each([
    ['', true], ['a', true], ['aa', true], ['aba', true], ['abba', true], ['abbba', true],
    ['ab', false], ['abb', false], ['abab', false],
  ])('palindromes: %j -> %s', (input, expected) => {
    expect(accepts('tm-palindrome', input)).toBe(expected);
  });

  test.each([
    ['#', true], ['a#a', true], ['ab#ab', true], ['abb#abb', true],
    ['a#b', false], ['ab#ba', false], ['a#', false], ['ab#a', false],
  ])('w#w: %j -> %s', (input, expected) => {
    expect(accepts('tm-ww', input)).toBe(expected);
  });

  test.each([
    ['0', '1'], ['1', '10'], ['101', '110'], ['111', '1000'],
  ])('binary increment: %s -> %s', (input, expected) => {
    expect(binaryOutput(input)).toBe(expected);
  });

  test.each([
    ['', true], ['0', true], ['11', true], ['1010', true], ['0110', true],
    ['1', false], ['111', false], ['10', false],
  ])('even number of 1s: %j -> %s', (input, expected) => {
    expect(accepts('tm-even-ones', input)).toBe(expected);
  });
});

describe('Turing machine simulator', () => {
  test('starts at cell zero and reads, writes, then moves', () => {
    const tm = preset('tm-binary-inc');
    const result = simulateTuringMachine(tm, '0');
    expect(result.steps[0].headIndex).toBe(0);
    expect(result.steps[0].tape[0]).toBe('0');
    expect(result.steps[1]).toMatchObject({
      readSymbol: '0',
      writtenSymbol: '0',
      direction: 'R',
      headIndex: 1,
    });
  });

  test('extends the tape to the left when the head moves left from cell zero', () => {
    const tm: TMDefinition = {
      ...preset('tm-even-ones'),
      startStateId: 'left',
      acceptStateId: 'accept',
      states: [
        { id: 'left', label: 'left', x: 0, y: 0 },
        { id: 'accept', label: 'accept', x: 1, y: 0, isFinal: true },
      ],
      transitions: [
        { id: 'left-step', from: 'left', to: 'accept', readSymbol: '0', writeSymbol: '1', direction: 'L' },
      ],
    };
    const result = simulateTuringMachine(tm, '0');
    expect(result.status).toBe('ACCEPTED');
    expect(result.steps[1].headIndex).toBe(0);
    expect(result.steps[1].tape).toEqual(['_', '1']);
  });

  test('reports missing transitions precisely', () => {
    const result = simulateTuringMachine(preset('tm-0n1n'), '');
    expect(result.status).toBe('REJECTED');
    expect(result.reason).toBe('REJECTED (no transition for (q0, _))');
  });

  test('validates input alphabet and disallows the blank as input', () => {
    const invalid = simulateTuringMachine(preset('tm-0n1n'), '0a');
    expect(invalid.status).toBe('INVALID_INPUT');
    expect(invalid.reason).toBe("Symbol 'a' is not in Σ = {0, 1}.");
    const blank = simulateTuringMachine(preset('tm-0n1n'), '_');
    expect(blank.status).toBe('INVALID_INPUT');
  });

  test('halts a looping machine at the requested limit without accepting or rejecting', () => {
    const loop: TMDefinition = {
      ...preset('tm-even-ones'),
      startStateId: 'q_even',
      acceptStateId: 'q_acc',
      transitions: [
        { id: 'loop-step', from: 'q_even', to: 'q_even', readSymbol: '0', writeSymbol: '0', direction: 'S' },
      ],
    };
    const result = simulateTuringMachine(loop, '0', 5);
    expect(result.status).toBe('LOOP_DETECTED');
    expect(result.totalSteps).toBe(5);
    expect(result.reason).toBe('No halt within 5 steps (possibly looping)');
  });

  test('validates deterministic rules and required machine states', () => {
    const invalid: TMDefinition = {
      ...preset('tm-even-ones'),
      startStateId: 'missing',
      acceptStateId: 'also-missing',
      transitions: [
        { id: 'duplicate-a', from: 'q_even', to: 'q_odd', readSymbol: '0', writeSymbol: '0', direction: 'R' },
        { id: 'duplicate-b', from: 'q_even', to: 'q_odd', readSymbol: '0', writeSymbol: '1', direction: 'L' },
      ],
    };
    const validation = validateTuringMachine(invalid);
    expect(validation.errors.some(error => error.includes('Start state'))).toBe(true);
    expect(validation.errors.some(error => error.includes('accepting state'))).toBe(true);
    expect(validation.duplicateTransitions).toEqual([{ stateId: 'q_even', symbol: '0' }]);
    expect(simulateTuringMachine(invalid, '').status).toBe('INVALID_MACHINE');
  });

  test('every curated preset is deterministic and valid', () => {
    for (const machine of sampleTuringMachines) {
      expect(validateTuringMachine(machine).errors).toEqual([]);
    }
  });
});
