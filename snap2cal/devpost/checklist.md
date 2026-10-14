---
doc: checklist
status: approved
---

# Build Checklist

Build mode: fast

## Slices

- [ ] **1. Project Scaffold & Interactive Dropzone**
  Becomes usable: Clean Next.js app with Tailwind, displaying the centered dropzone supporting drag-and-drop, system file picker, and clipboard paste (`Ctrl/Cmd+V`) with image preview.
  Why now: Verifies runtime, environment, Tailwind setup, and image ingestion before touching backend or external APIs.
  PRD ref: `prd.md > FR-1: Image Input & Ingestion`, `prd.md > Look and Feel`
  Spec ref: `spec.md > Architecture`, `spec.md > File Structure`
  Build: Scaffold Next.js with TypeScript and Tailwind, add `.env.local` and `.env.example`, implement `app/layout.tsx` and `app/page.tsx` dropzone.
  Verify (mechanical): Dev server builds and runs; drag-and-drop and clipboard paste render preview in browser without errors.
  Learner check: Open `http://localhost:3000`, paste or drop an image into the dropzone.
  Commit: `Scaffold Next.js app with image dropzone and clipboard paste`

- [ ] **2. Gemini Vision Multimodal Extraction API**
  Becomes usable: Backend route `/api/extract` that receives an image and returns structured JSON with strict schema enforcement via Gemini 2.5 Flash.
  Why now: Proves the core AI kernel and testable prompt/schema contract with real test flyers early.
  PRD ref: `prd.md > FR-3: Multimodal Extraction`, `prd.md > FR-7: Graceful Fallback & Error Handling`
  Spec ref: `spec.md > API Contract`, `spec.md > Edge Case Handling`
  Build: Create `app/api/extract/route.ts` using `@google/genai` with strict `responseSchema` and system instructions.
  Verify (mechanical): Test route using curl or script with real test flyer screenshot, inspect raw JSON output.
  Learner check: Verify the raw JSON extraction output from test flyer.
  Commit: `Add Gemini 2.5 Flash multimodal extraction API route`

- [ ] **3. Connect Frontend to API & Render Populated Event Card**
  Becomes usable: Dropping or pasting an image triggers `/api/extract` and populates the high-contrast editable event card with the extracted fields.
  Why now: Delivers end-to-end integration between user action, AI extraction, and editable UI card.
  PRD ref: `prd.md > FR-4: High-Contrast Editable Event Card`
  Spec ref: `spec.md > Data Flow`, `spec.md > Components`
  Build: Wire `app/page.tsx` fetch call to `/api/extract`, render editable card with Title, Date, Start Time, End Time, Location, Description.
  Verify (mechanical): Upload test image in browser, verify fields populate accurately in inputs.
  Learner check: Upload an image in browser and review the populated card.
  Commit: `Wire frontend upload to extraction API and render editable card`

- [ ] **4. Pure TypeScript RFC 5545 Calendar Serializer (`lib/ics.ts`)**
  Becomes usable: Clicking "Download .ics" generates and downloads a valid RFC 5545 calendar file that imports cleanly into calendar apps.
  Why now: Completes the primary utility and delivers the final tangible output of the app.
  PRD ref: `prd.md > FR-5: RFC 5545 .ics File Generation & Download`
  Spec ref: `spec.md > RFC 5545 Calendar Serializer (lib/ics.ts) Specification`
  Build: Implement `lib/ics.ts` with CRLF, 75-char folding, character escaping, and hook up "Download .ics" CTA button.
  Verify (mechanical): Download generated `.ics` and validate RFC 5545 syntax and import into calendar.
  Learner check: Download an `.ics` file and import into Google/Apple Calendar.
  Commit: `Add pure TypeScript RFC 5545 .ics generator and download button`

- [ ] **5. Amber Highlight States, Loading Skeleton & Error Handling**
  Becomes usable: Shimmering skeleton loader during parsing, amber borders for missing fields (null date/time/year), inline error banner on non-event images, and "Convert another" button.
  Why now: Polishes the human-in-the-loop experience and ensures robustness against edge cases.
  PRD ref: `prd.md > FR-2: Visual Loading State`, `prd.md > FR-6: Session Reset`, `prd.md > FR-7: Graceful Fallback`
  Spec ref: `spec.md > Edge Case Handling`
  Build: Add shimmer animation, conditional amber border styling on inputs, error banner, and state reset function.
  Verify (mechanical): Test non-event image and missing-field flyers; test "Convert another" reset.
  Learner check: Test edge cases and reset button.
  Commit: `Add skeleton shimmer, amber warning highlights, error fallback, and reset`

- [ ] **6. Final Polish, Tagline & Verification**
  Becomes usable: Clean, elegant UI matching styling rules (rounded-lg, slate palette, indigo-600 CTA, system font stack), fully ready for submission and demo video.
  Why now: Final polish for hackathon demo.
  PRD ref: `prd.md > Look and Feel`, `prd.md > Success Metrics`
  Spec ref: `spec.md > Where It Runs and How to Try It`
  Build: Align whitespace, ensure responsive layout, verify production build (`npm run build`).
  Verify (mechanical): `npm run build` succeeds with zero errors; full user flow passes in under 10 seconds.
  Learner check: Record 60-second demo video of complete flow.
  Commit: `Final styling polish, layout alignment, and demo readiness`

## Hands-on Checkpoints

- [ ] Checkpoint 1 (After Slice 3): Verify end-to-end extraction from screenshot to populated editable card.
- [ ] Checkpoint 2 (After Slice 4): Verify `.ics` download and calendar client import.
- [ ] Final Review: Complete flow from drop to `.ics` download in under 60 seconds.

## Revisions
