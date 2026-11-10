const DEFAULT_MODEL = "gemini-flash-lite-latest";
const TIMEOUT_MS = 25000;
const FRIENDLY_ERROR =
  "The study assistant is not available right now. Please try again later.";
const SYSTEM_INSTRUCTION =
  "You are a study helper for university students. Answer in plain English in at most 120 words. Be honest: if you are not sure, say so. Do not claim to be a teacher or give medical, legal or financial advice. If the question is not about studying or learning, politely say you can only help with study questions.";

function unavailableError() {
  const error = new Error(FRIENDLY_ERROR);
  error.statusCode = 502;
  return error;
}

async function callGemini(url, apiKey, payload) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Asks a study question to the Google Gemini REST API.
 * @param {string} question - Question from the user (3-500 chars)
 * @returns {Promise<string>} Answer text
 */
export async function askQuestion(question) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
    const error = new Error("The study assistant is not set up yet.");
    error.statusCode = 503;
    throw error;
  }

  const model =
    (process.env.GEMINI_MODEL && process.env.GEMINI_MODEL.trim()) ||
    DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  const payload = {
    system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
    contents: [{ parts: [{ text: question }] }],
  };

  try {
    let response = await callGemini(url, apiKey.trim(), payload);

    // One retry if Gemini is busy
    if (response.status === 503 || response.status === 429) {
      console.error(
        "[assistant] Gemini busy, status:",
        response.status,
        "- retrying once",
      );
      await new Promise((resolve) => setTimeout(resolve, 1500));
      response = await callGemini(url, apiKey.trim(), payload);
    }

    if (!response.ok) {
      const body = await response.text();
      console.error(
        "[assistant] Gemini status:",
        response.status,
        "model:",
        model,
        body.slice(0, 300),
      );
      throw unavailableError();
    }

    const data = await response.json();
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const answer = parts
      .map((part) => (typeof part.text === "string" ? part.text : ""))
      .join("")
      .trim();

    if (!answer) {
      console.error(
        "[assistant] Empty answer. finishReason:",
        data?.candidates?.[0]?.finishReason,
      );
      throw unavailableError();
    }

    return answer;
  } catch (err) {
    if (err.statusCode) {
      throw err;
    }
    console.error(
      "[assistant] request failed:",
      err.name,
      err.cause?.code || err.message,
    );
    throw unavailableError();
  }
}

export default {
  askQuestion,
};
