# Snap2Cal

> **Screenshot in, calendar event out.**

Snap2Cal is a single-page web utility that extracts event information from screenshots of flyers, announcements, or emails and converts them into editable cards and downloadable RFC 5545 standard `.ics` calendar files.

Built for the **Devpost Learn: Build With AI** hackathon.

---

## ⚡ The Problem & The Solution

- **The Problem:** People frequently screenshot event flyers and emails, but transcribing titles, dates, start/end times, and addresses into Google Calendar or Apple Calendar manually is tedious and friction-heavy.
- **The Solution:** Drop or paste (`Ctrl/Cmd+V`) a screenshot into Snap2Cal. Gemini 3.8 Flash parses the flyer into structured fields, displays a high-contrast editable card with amber warnings for missing fields, and exports a clean `.ics` file in one click.

---

## 📋 Hackathon Planning Contracts

Snap2Cal followed a strict plan-first, spec-driven development workflow:

- [**`scope.md`**](./scope.md) — The core idea, unique kernel, target user, and explicit cuts (no auth, no db, no multi-event parsing).
- [**`prd.md`**](./prd.md) — Complete product requirements, user flow, functional requirements (FR-1 through FR-7), and acceptance criteria.
- [**`spec.md`**](./spec.md) — Technical blueprint, API contracts, RFC 5545 serializer specification (CRLF, 75-octet line folding, character escaping, UTC Z-format), and edge case handling.

---

## 🛠️ Tech Stack & Architecture

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS v4, TypeScript.
- **AI Multimodal Vision:** Google Gemini 3.8 Flash via `@google/genai` with strict `responseSchema` enforcement and system rules against hallucination.
- **Calendar Serializer:** Pure TypeScript RFC 5545 implementation in `lib/ics.ts` (zero external npm dependencies, true UTF-8 octet-aware line folding, UTC conversion with client-side timezone awareness).

---

## 🚀 Quickstart

### 1. Clone the repository
```bash
git clone https://github.com/montejbrian/Snap2Cal.git
cd Snap2Cal
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env.local` file with your Google Gemini API key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```
*(Get a free Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey))*

### 4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing with Sample Flyers

Sample event flyers are included in the [`samples/`](./samples/) folder:
- **`samples/test-flyer.png`**: Complete demo flyer with date, time, location, and description.
- **`samples/ambiguous-flyer.png`**: Edge case flyer with relative date ("Next Thursday") and no end time—verifies that ambiguous fields return `null` and highlight in amber for manual entry without hallucination.

---

## 📄 License

MIT
