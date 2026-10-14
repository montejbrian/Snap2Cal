import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

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

    // Convert file to base64 buffer for inline data
    const bytes = await file.arrayBuffer();
    const base64Data = Buffer.from(bytes).toString("base64");
    const mimeType = file.type || "image/png";

    const ai = new GoogleGenAI({ apiKey });

    // Use Gemini 3.8 Flash
    const modelName = process.env.GEMINI_MODEL || "gemini-3.8-flash";

    const response = await ai.models.generateContent({
      model: modelName,
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

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response from multimodal model");
    }

    const parsedData = JSON.parse(responseText);

    return NextResponse.json(parsedData);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to extract event data";
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
