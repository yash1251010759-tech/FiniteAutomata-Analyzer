import { afterEach, describe, expect, test, vi } from 'vitest';
import { askGeminiTutor } from '../src/services/geminiService';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Gemini tutor connection', () => {
  test('sends a user-first conversation and returns the generated text', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                { text: 'internal thought', thought: true },
                { text: 'A DFA has a finite set of states.' },
              ],
            },
          },
        ],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const answer = await askGeminiTutor(
      'What is a DFA?',
      [
        { sender: 'tutor', text: 'Initial greeting' },
        { sender: 'user', text: 'Explain automata' },
        { sender: 'tutor', text: 'Automata process input.' },
      ],
      undefined,
      'test-api-key'
    );

    expect(answer).toBe('A DFA has a finite set of states.');
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).not.toContain('key=');
    expect(options.headers['x-goog-api-key']).toBe('test-api-key');
    expect(JSON.parse(options.body).contents).toEqual([
      { role: 'user', parts: [{ text: 'Explain automata' }] },
      { role: 'model', parts: [{ text: 'Automata process input.' }] },
      { role: 'user', parts: [{ text: 'What is a DFA?' }] },
    ]);
  });

  test('tries the next supported model when the primary model is unavailable', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: { message: 'Model unavailable' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: 'Answer' }] } }],
        }),
      });
    vi.stubGlobal('fetch', fetchMock);

    await expect(askGeminiTutor('Question', [], undefined, 'test-api-key')).resolves.toBe(
      'Answer'
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toContain('/gemini-3.8-flash:generateContent');
    expect(fetchMock.mock.calls[1][0]).toContain('/gemini-3.6-flash:generateContent');
  });
});
