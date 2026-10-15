import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

const MODELS = [
  process.env.GEMINI_MODEL || "gemini-3.8-flash",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
];

async function callGeminiWithRetry(
  ai: GoogleGenAI,
  base64Data: string,
  mimeType: string,
  maxAttempts = 3
) {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Select model or fallback if previous model failed with 503/404
    const model = MODELS[attempt % MODELS.length];

    try {
      const response = await ai.models.generateContent({
        model,
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
              title: {
                type: Type.STRING,
                nullable: true,
                description: "The primary name or title of the event",
              },
              date: {
                type: Type.STRING,
                nullable: true,
                description: "The event date in YYYY-MM-DD format, or null if year is missing or ambiguous",
              },
              startTime: {
                type: Type.STRING,
                nullable: true,
                description: "Event start time in 24-hour HH:mm format (e.g., 18:30)",
              },
              endTime: {
                type: Type.STRING,
                nullable: true,
                description: "Event end time in 24-hour HH:mm format, or null if not explicitly stated",
              },
              location: {
                type: Type.STRING,
                nullable: true,
                description: "Physical venue address or virtual meeting link",
              },
              description: {
                type: Type.STRING,
                nullable: true,
                description: "Event highlights, key speakers, or brief agenda notes",
              },
            },
            required: ["title", "date", "startTime", "endTime", "location", "description"],
          },
        },
      });

      if (response.text) {
        return JSON.parse(response.text);
      }
    } catch (err: unknown) {
      lastError = err;
      const isTransient =
        err instanceof Error &&
        (err.message.includes("503") ||
          err.message.includes("high demand") ||
          err.message.includes("429") ||
          err.message.includes("404"));

      if (isTransient && attempt < maxAttempts - 1) {
        // Wait briefly (1s, 2s) before retry
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error: "GEMINI_API_KEY is not configured in .env.local",
          fallback: {
            title: null,
            date: null,
            startTime: null,
            endTime: null,
            location: null,
            description: null,
          },
        },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const base64Data = Buffer.from(bytes).toString("base64");
    const mimeType = file.type || "image/png";

    const ai = new GoogleGenAI({ apiKey });
    const parsedData = await callGeminiWithRetry(ai, base64Data, mimeType);

    return NextResponse.json(parsedData);
  } catch (err: unknown) {
    let message = "Failed to extract event data";
    if (err instanceof Error) {
      if (err.message.includes("503") || err.message.includes("high demand")) {
        message = "Gemini is currently experiencing high demand. Please try again in a few moments, or enter details manually.";
      } else {
        message = err.message;
      }
    }
    console.error("Extraction error:", err);
    return NextResponse.json(
      {
        error: message,
        fallback: {
          title: null,
          date: null,
          startTime: null,
          endTime: null,
          location: null,
          description: null,
        },
      },
      { status: 500 }
    );
  }
}
