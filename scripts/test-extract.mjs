import { GoogleGenAI, Type } from "@google/genai";
import fs from "fs";
import path from "path";

// Read GEMINI_API_KEY from .env.local if not in process.env
let apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  try {
    const envFile = fs.readFileSync(".env.local", "utf8");
    const match = envFile.match(/GEMINI_API_KEY=(.*)/);
    if (match && match[1].trim()) {
      apiKey = match[1].trim();
    }
  } catch {}
}

if (!apiKey) {
  console.error("ERROR: GEMINI_API_KEY is not set in process.env or .env.local");
  process.exit(1);
}

const imagePath = process.argv[2] || "test-flyer.png";
const imageBuffer = fs.readFileSync(imagePath);
const base64Data = imageBuffer.toString("base64");
const mimeType = imagePath.endsWith(".png") ? "image/png" : "image/jpeg";

console.log(`Testing Gemini 2.5 Flash extraction with image: ${imagePath}...`);

const ai = new GoogleGenAI({ apiKey });

async function run() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
            {
              text: "Extract event information from this image following the strict schema. If a field is not explicitly present or unambiguously derivable, return null for that field.",
            },
          ],
        },
      ],
      config: {
        systemInstruction:
          "You are an expert event information extractor. Extract event information from the provided image into structured JSON.\n" +
          "Rules:\n" +
          "1. If a field is not explicitly present or unambiguously derivable from the image, return null for that field. Do not infer, guess, or hallucinate.\n" +
          "2. date: Format as YYYY-MM-DD. If the year is not explicitly printed or is ambiguous (e.g. 'Saturday, Sept 28' without year), return null. If relative (e.g. 'Next Thursday'), return null.\n" +
          "3. startTime: Format in 24-hour time HH:mm (e.g. '19:00' for 7pm). If not explicitly stated, return null.\n" +
          "4. endTime: Format in 24-hour time HH:mm only if explicitly stated. Never guess, infer, or default to 1 hour after start. If missing, return null.\n" +
          "5. location: Physical address or virtual meeting URL. If absent, return null.\n" +
          "6. description: Brief summary of agenda, speakers, or key details from the image. If absent, return null.\n" +
          "7. If the image is not an event flyer, announcement, or invitation, return all fields as null.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, nullable: true },
            date: { type: Type.STRING, nullable: true },
            startTime: { type: Type.STRING, nullable: true },
            endTime: { type: Type.STRING, nullable: true },
            location: { type: Type.STRING, nullable: true },
            description: { type: Type.STRING, nullable: true },
          },
          required: ["title", "date", "startTime", "endTime", "location", "description"],
        },
      },
    });

    console.log("\n--- RAW JSON EXTRACTION RESPONSE ---");
    console.log(response.text);
    console.log("------------------------------------\n");
  } catch (err) {
    console.error("Extraction error:", err);
  }
}

run();
