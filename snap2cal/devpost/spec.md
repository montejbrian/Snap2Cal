---
doc: spec
status: approved
---

# Snap2Cal — Technical Specification

**One-line summary:** Technical blueprint for Snap2Cal using Next.js App Router, Gemini 2.5 Flash structured vision extraction, and client-side RFC 5545 `.ics` serialization.  
**PRD Reference:** Implements `prd.md > Functional Requirements` and `prd.md > Look and Feel`.

---

## 1. Architecture

Snap2Cal is built as a single-page Next.js application (App Router) with a single backend API route to safeguard credentials:

- **Frontend (`app/page.tsx`):** React Client Component managing single-page application state (idle, uploading/shimmer, populated card, error/fallback). Handles drag-and-drop, clipboard paste events (`Ctrl/Cmd+V`), field edits, and client-side `.ics` file triggering.
- **Backend API Route (`app/api/extract/route.ts`):** Next.js server route that receives multipart image data, invokes Google Gemini 2.5 Flash via `@google/genai` with strict JSON schema enforcement (`responseSchema`), and returns structured event data to the client. The `GEMINI_API_KEY` remains strictly server-side.
- **Calendar Serializer (`lib/ics.ts`):** Pure TypeScript RFC 5545 compliant serializer running directly in the browser. Zero external npm dependencies.

```
+-----------------------------------------------------------------------------------------+
|                                    Browser (Client)                                     |
|                                                                                         |
|  [Image Drop / Paste] ---> [Skeleton Loader] ---> [Editable Event Card] ---> [.ics CTA] |
|           |                                               ^                     |       |
+-----------|-----------------------------------------------|---------------------|-------+
            | POST FormData (image)                         | JSON response       |
            v                                               |                     |
+------------------------------------+                      |                     |
|  Server: /api/extract/route.ts     |----------------------+                     |
|  - Gemini 2.5 Flash Vision API     |                                            |
|  - Strict JSON Schema Enforcement  |                                            |
+------------------------------------+                                            v
                                                                        +------------------+
                                                                        |   lib/ics.ts     |
                                                                        | RFC 5545 Export  |
                                                                        +------------------+
```

---

## 2. File Structure

Strict minimal project structure without unnecessary abstractions:

```
snap2cal/
├── app/
│   ├── api/
│   │   └── extract/
│   │       └── route.ts         # Server endpoint: handles image upload & Gemini SDK call
│   ├── globals.css              # Tailwind CSS directives
│   ├── layout.tsx               # Root layout: system fonts, meta tags
│   └── page.tsx                 # SPA UI: dropzone, skeleton state, editable card
├── lib/
│   └── ics.ts                   # Pure TypeScript RFC 5545 serializer & line folder
├── public/                      # Static assets
├── .env.local                   # Local secret: GEMINI_API_KEY (git-ignored)
├── .env.example                 # Template for required environment variables
├── .gitignore                   # Ignore node_modules, .env*, .next
├── package.json                 # Next.js, React, Tailwind, @google/genai
├── tsconfig.json                # TypeScript configuration
├── scope.md                     # Approved project scope (repo root)
├── prd.md                       # Approved product requirements (repo root)
└── spec.md                      # Approved technical specification (repo root)
```

---

## 3. Data Flow

1. **User Action:** User drags/drops an image or pastes via `Ctrl/Cmd+V` onto `app/page.tsx`.
2. **Client Upload:** Client sets loading state (`isParsing = true`, rendering shimmering skeleton card) and sends a `POST` request with `multipart/form-data` containing the image file to `/api/extract`.
3. **Multimodal Processing:** `/api/extract/route.ts` converts the file buffer into inline base64 data and calls Gemini 2.5 Flash using `@google/genai` with strict `responseSchema`.
   - **System Instruction:** *"Extract event information from this image. If a field is not explicitly present or unambiguously derivable from the image, return null for that field. Do not infer, guess, or hallucinate."*
4. **Structured JSON Response:** Server returns the typed JSON payload to the browser.
5. **Card Population & Review:** Client renders the populated fields into high-contrast inputs. Any `null` or missing fields display with an `amber-500` border and prompt placeholder. Timezone defaults to `Intl.DateTimeFormat().resolvedOptions().timeZone`.
6. **Download:** User clicks "Download .ics". `lib/ics.ts` formats the data into a valid RFC 5545 string, wraps it into a `Blob([icsContent], { type: 'text/calendar;charset=utf-8' })`, creates a temporary object URL, and triggers an immediate browser download named `snap2cal-{title-slug}.ics`.

---

## 4. API Contract

### Endpoint: `POST /api/extract`

- **Request:** `multipart/form-data`
  - `file`: Image binary (PNG, JPG, WEBP, max 10MB)

- **Gemini Response Schema / Server JSON Response:**
```json
{
  "title": "Hackathon Demo Night",
  "date": "2026-10-24",
  "startTime": "18:00",
  "endTime": "21:00",
  "location": "123 Innovation Way, Tech Hub",
  "description": "Presentations, networking, and demos."
}
```
*(All fields are nullable strings. If confidence is missing or ambiguous, the field value is `null`.)*

- **Error Response (`HTTP 400` or `500`):**
```json
{
  "error": "Image unparseable",
  "fallback": {
    "title": null,
    "date": null,
    "startTime": null,
    "endTime": null,
    "location": null,
    "description": null
  }
}
```

---

## 5. RFC 5545 Calendar Serializer (`lib/ics.ts`) Specification

Must strictly adhere to RFC 5545 specifications to ensure calendar clients do not reject files:

- **Line Endings:** Every line terminates with CRLF (`\r\n`).
- **Line Folding:** Any content line exceeding 75 octets must be folded by inserting `\r\n` followed by a single whitespace character (`\r\n `).
- **Text Escaping:** Commas (`,`), semicolons (`;`), and newlines in `SUMMARY`, `LOCATION`, and `DESCRIPTION` must be escaped as `\,`, `\;`, and `\n`.
- **Properties:**
  - `BEGIN:VCALENDAR`
  - `VERSION:2.0`
  - `PRODID:-//Snap2Cal//EN`
  - `CALSCALE:GREGORIAN`
  - `BEGIN:VEVENT`
  - `UID:${crypto.randomUUID()}@snap2cal`
  - `DTSTAMP:${nowUtcFormatted}`
  - `DTSTART;TZID=${timezone}:${formatDateTime(date, startTime)}`
  - `DTEND;TZID=${timezone}:${formatDateTime(date, endTime)}`
  - `SUMMARY:${escapedTitle}`
  - `LOCATION:${escapedLocation}`
  - `DESCRIPTION:${escapedDescription}`
  - `END:VEVENT`
  - `END:VCALENDAR`

---

## 6. Edge Case Handling (Verification Plan)

| Test Case | Flyer Input Example | Expected Behavior |
| :--- | :--- | :--- |
| **No Date / Relative Day** | "Next Thursday" | `date: null`. Renders with amber highlight: *"Enter date (YYYY-MM-DD)"*. |
| **Missing Year** | "Saturday, Sept 28" | `date: null` or partial without guessing year. User manually inputs year. |
| **Time Without Timezone** | "7:00 PM" | `startTime: "19:00"`. Card defaults timezone to client's browser timezone with subtle badge. |
| **Missing End Time** | "Starts at 6:00 PM" | `endTime: null`. Never guess or infer; user can fill in manually if desired. |
| **Multi-Date Flyer** | Two dates listed | Extracts primary/first event; does not attempt multi-event split. |
| **Non-Event Image** | Screenshot of a cat or spreadsheet | Friendly inline message: *"Couldn't find event details in that image."* Empty editable card displayed. Never throws raw unhandled errors. |

---

## 7. Out-of-Scope & Non-Goals

- **No Database:** Ephemeral client state only.
- **No User Authentication / Accounts:** Zero login barriers.
- **No Direct Calendar OAuth Sync:** Avoids OAuth token storage and complex sync scopes; `.ics` is universal.
- **No Multi-Event Parsing:** Exactly one event per image.
- **No External ICS Library:** Pure TypeScript in `lib/ics.ts`.

---

## 8. Where It Runs and How to Try It

- **Runtime:** Node.js (v18+) with Next.js local development server.
- **Environment Variables:** `GEMINI_API_KEY` stored in `.env.local`.
- **Command to Run:**
  ```bash
  npm install
  npm run dev
  ```
- **URL to Open:** `http://localhost:3000`
