import axios from "axios";
const pdfParse = require("pdf-parse");

function cleanBase64(base64: string): string {
  return base64.includes(";base64,") ? base64.split(";base64,")[1] : base64;
}

function parseJsonResponse(text: string): any {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

async function extractTextFromFile(fileData: {
  base64: string;
  mimeType: string;
}): Promise<string | null> {
  const mime = (fileData.mimeType || "application/pdf").toLowerCase();
  const buffer = Buffer.from(cleanBase64(fileData.base64), "base64");

  if (mime.includes("pdf")) {
    try {
      const result = await pdfParse(buffer);
      return result.text?.trim() || null;
    } catch (err: any) {
      console.error("PDF text extraction failed:", err.message);
      return null;
    }
  }

  if (mime.includes("text") || mime === "application/json") {
    return buffer.toString("utf-8").trim() || null;
  }

  console.warn(`Groq fallback: unsupported file type "${mime}" (use PDF)`);
  return null;
}

async function callGemini(
  prompt: string,
  fileData?: { base64: string; mimeType: string }
): Promise<any | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_gemini_api_key") {
    return null;
  }

  try {
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const parts: any[] = [{ text: prompt }];

    if (fileData) {
      parts.unshift({
        inlineData: {
          data: cleanBase64(fileData.base64),
          mimeType: fileData.mimeType,
        },
      });
    }

    const response = await axios.post(
      url,
      {
        contents: [{ parts }],
        generationConfig: { responseMimeType: "application/json" },
      },
      { headers: { "Content-Type": "application/json" }, timeout: 90000 }
    );

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) return parseJsonResponse(text);
  } catch (err: any) {
    console.error("Gemini API call failed:", err?.response?.data || err.message);
  }
  return null;
}

async function callGroq(prompt: string, fileText?: string): Promise<any | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === "your_groq_api_key") {
    return null;
  }

  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  const userContent = fileText
    ? `${prompt}\n\n--- RESUME TEXT ---\n${fileText.slice(0, 14000)}`
    : prompt;

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model,
        messages: [{ role: "user", content: userContent }],
        response_format: { type: "json_object" },
        temperature: 0.2,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 90000,
      }
    );

    const text = response.data?.choices?.[0]?.message?.content;
    if (text) return parseJsonResponse(text);
  } catch (err: any) {
    console.error("Groq API call failed:", err?.response?.data || err.message);
  }
  return null;
}

/** Try Gemini first, then Groq (with PDF text extraction when needed). */
export async function callAI(
  prompt: string,
  fileData?: { base64: string; mimeType: string }
): Promise<any | null> {
  const geminiResult = await callGemini(prompt, fileData);
  if (geminiResult) {
    console.log("AI response: Gemini");
    return geminiResult;
  }

  console.log("Gemini unavailable — trying Groq fallback...");

  let fileText: string | undefined;
  if (fileData) {
    const extracted = await extractTextFromFile(fileData);
    if (!extracted) {
      console.warn("Groq fallback skipped: could not extract resume text");
      return null;
    }
    fileText = extracted;
  }

  const groqResult = await callGroq(prompt, fileText);
  if (groqResult) {
    console.log("AI response: Groq");
    return groqResult;
  }

  return null;
}
