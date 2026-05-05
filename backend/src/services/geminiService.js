// backend/src/services/geminiService.js
//
// Thin wrapper around @google/generative-ai with:
//   - configurable model (default gemini-1.5-flash, free-tier friendly)
//   - JSON-mode helper that *asks* for JSON and validates the response
//   - retry with exponential backoff on transient errors
//   - centralized error handling so callers see structured errors

import { GoogleGenerativeAI } from '@google/generative-ai';

let client = null;

function getClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not set in environment.');
  }
  if (!client) {
    client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return client;
}

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

/**
 * Generate text from a prompt.
 */
export async function generateText(prompt, { model = DEFAULT_MODEL, temperature = 0.7 } = {}) {
  const genModel = getClient().getGenerativeModel({
    model,
    generationConfig: { temperature, maxOutputTokens: 2048 },
  });
  const result = await withRetry(() => genModel.generateContent(prompt));
  return result.response.text();
}

/**
 * Ask Gemini to return JSON. Strips code fences and validates parsability.
 * Throws a structured error if the model returns invalid JSON after retries.
 */
export async function generateJSON(prompt, { model = DEFAULT_MODEL, temperature = 0.4 } = {}) {
  const genModel = getClient().getGenerativeModel({
    model,
    generationConfig: {
      temperature,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',
    },
  });

  const result = await withRetry(() => genModel.generateContent(prompt));
  const text = result.response.text();
  return parseJSONLoose(text);
}

function parseJSONLoose(text) {
  // First try direct
  try {
    return JSON.parse(text);
  } catch {
    // Strip markdown fences if model ignored responseMimeType
    const cleaned = text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    try {
      return JSON.parse(cleaned);
    } catch (err) {
      const error = new Error('Gemini returned non-JSON response');
      error.cause = { raw: text.slice(0, 500), parseError: err.message };
      throw error;
    }
  }
}

async function withRetry(fn, { tries = 3, baseDelay = 600 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt < tries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      // Don't retry on 4xx auth/permission errors
      const status = err?.response?.status || err?.status;
      if (status && status >= 400 && status < 500 && status !== 429) break;
      await sleep(baseDelay * Math.pow(2, attempt));
    }
  }
  throw lastErr;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));