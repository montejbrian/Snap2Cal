---
doc: prd
status: approved
---

# Snap2Cal — Product Requirements Document (PRD)

**One-line summary:** Upload a screenshot of an event flyer or email, and get an editable event card plus a downloadable `.ics` calendar file.  
**Source:** Developed from `scope.md > The Core Loop` and `scope.md > The Unique Kernel`.

---

## 1. Problem
People frequently screenshot event flyers, announcements, and email invitations to save them, but these screenshots get buried in their camera roll. Converting a screenshot into a calendar event today requires manual transcription—switching back and forth between images and calendar apps to type titles, dates, start/end times, and addresses by hand.

## 2. Target User
Anyone who screenshots event details on desktop or mobile instead of immediately adding them to their calendar.

## 3. Core User Flow
1. **Arrival:** User lands on a clean single-page interface with a prominent dropzone.
2. **Input:** User drags and drops an event image, clicks "browse files", or presses `Ctrl/Cmd+V` to paste an image directly from the clipboard.
3. **Feedback:** The dropzone transitions immediately to a shimmering skeleton card indicating active multimodal parsing.
4. **Extraction & Review:** The card populates with high-contrast editable fields (Title, Date, Start Time, End Time, Location, Description). Missing/ambiguous fields (e.g., missing year or timezone) are outlined with an amber border and helpful placeholder text.
5. **Adjustment:** User verifies or adjusts any field directly inline. The timezone displays as a subtle, editable label defaulting to the user's browser timezone.
6. **Export:** User clicks the primary "Download .ics" button. A valid `.ics` file is generated and downloaded immediately (`snap2cal-{title-slug}.ics`).
7. **Reset:** A secondary "Convert another" button allows wiping the card and returning cleanly to the dropzone state.

## 4. Functional Requirements

### FR-1: Image Input & Ingestion
- Support file drag-and-drop onto the dropzone.
- Support standard system file browsing via a "browse files" button.
- Support clipboard paste (`Ctrl+V` / `Cmd+V`) on the page window.
- Accepted formats: PNG, JPG, JPEG, WEBP. Maximum file size: 10MB.

### FR-2: Visual Loading State (Shimmer Skeleton)
- Immediately upon image receipt, display a shimmering skeleton placeholder card in place of the dropzone.
- Maintain visual feedback until structured parsing completes or errors.

### FR-3: Multimodal Extraction
- Extract structured event fields from the image:
  - **Title** (string)
  - **Date** (YYYY-MM-DD or standard display date)
  - **Start Time** (HH:mm)
  - **End Time** (HH:mm, default to 1 hour after Start Time if missing)
  - **Location** (physical address or virtual meeting URL)
  - **Description / Notes** (key speakers, agenda, or highlights)

### FR-4: High-Contrast Editable Event Card
- Present all extracted values in high-contrast editable form inputs (`slate-900` text, `slate-200` border, `rounded-lg`).
- Missing fields or low-confidence details (e.g. missing year or missing timezone) must display with an amber (`amber-500`) highlight border and prompt placeholder (e.g. "Add year...", "Select time").
- Timezone defaults to the user's local browser timezone (`Intl.DateTimeFormat().resolvedOptions().timeZone`), displayed as an editable badge/selector without modal prompts.

### FR-5: RFC 5545 `.ics` File Generation & Download
- Primary CTA: "Download .ics" button (`bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg`).
- On click, generate a valid RFC 5545 iCalendar (`.ics`) file client-side.
- Filename format: `snap2cal-{title-slug}.ics` (sanitized ASCII slug), falling back to `event.ics` if title is blank.
- Compatible with Apple Calendar, Google Calendar, Outlook, and mobile calendar apps.

### FR-6: Session Reset & State Management
- Display secondary text/ghost CTA: "Convert another".
- Clicking "Convert another" clears the current event card and returns to the initial clean dropzone stage.
- Entire session state remains ephemeral in memory (no server persistence).

### FR-7: Graceful Fallback & Error Handling
- Non-event or unparseable images: display an inline warning banner ("Couldn't find event details in that image. Try a different screenshot or fill in the fields manually.") while still rendering an empty editable card so the user is never blocked.
- Oversized or invalid file types: display a clear dismissible error message above the dropzone.

## 5. Look and Feel
- **Theme:** Crisp light theme (`bg-[#FAFAFA]` or white, text `text-slate-900`, subtle borders `border-slate-200`).
- **Accent Palette:** 
  - Primary CTA: Confident Indigo (`bg-indigo-600`, hover `bg-indigo-700`).
  - Warning / Attention: Amber (`border-amber-500`, `text-amber-700`) exclusively for missing/uncertain fields.
- **Typography:** Native system font stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`) for zero font-load latency.
- **Card Styling:** `rounded-lg`, subtle shadow (`shadow-sm` or `shadow-md`), generous whitespace around dropzone stage.
- **Styling Architecture:** Direct Tailwind CSS utility classes inline. No custom design systems, no Storybook, no theme providers. No gradients, glassmorphism, or animated canvas backgrounds.

## 6. Non-Goals
- **No User Authentication / Accounts:** Pure client utility; zero friction sign-up.
- **No Database / Server-Side Storage:** No persistent event database.
- **No Multi-Event Images:** Extraction parses exactly one primary event per image.
- **No Calendar Sync / OAuth Integrations:** No direct Google Calendar or Microsoft OAuth flows; replaced by universal `.ics`.
- **No Recurring Events:** Single-instance events only.
- **No Native Mobile App:** Responsive web application running on modern desktop/mobile browsers.

## 7. Success Metrics
- **Extraction to Download Time:** Under 10 seconds from image drop to completed download.
- **Demo Viability:** Complete end-to-end user loop demonstrable on video in under 60 seconds.
- **iCalendar Compliance:** 100% valid RFC 5545 `.ics` output that imports cleanly into Apple Calendar and Google Calendar without parse errors.
