// backend/src/services/geminiService.js
// Ripped out Google SDK - Now using native fetch with Groq (Llama 3) for stable, free, generous AI!

export async function generateText(prompt) {
  return await callAI(prompt, false);
}

export async function generateJSON(prompt) {
  // Force the AI to return raw JSON
  const strictPrompt = prompt + "\n\nCRITICAL: You MUST respond ONLY with valid JSON. Do not include markdown formatting, code blocks (```json), or any other text. Just the raw JSON object/array.";

  const text = await callAI(strictPrompt, true);
  return parseJSONLoose(text);
}

async function callAI(prompt, isJson) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not set in environment. Please add it to your .env file.');
  }

  // Notice: Just a clean, normal string URL!
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      response_format: isJson ? { type: "json_object" } : { type: "text" }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`AI API Error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

function parseJSONLoose(text) {
  try {
    return JSON.parse(text);
  } catch {
    const cleaned = text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    try {
      return JSON.parse(cleaned);
    } catch (err) {
      const error = new Error('AI returned non-JSON response');
      error.cause = { raw: text.slice(0, 500), parseError: err.message };
      throw error;
    }
  }
}