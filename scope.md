---
doc: scope
status: approved
---

# Snap2Cal

Upload a screenshot of an event flyer or email, and get an editable event card plus a downloadable `.ics` calendar file.

## The Unique Kernel
Instant AI-powered event parsing with zero friction and honest human-in-the-loop control: dropping an image immediately triggers a shimmering skeleton placeholder, followed by high-contrast editable fields where missing or ambiguous data (like missing year or timezone) is highlighted in amber for instant manual completion instead of hallucinating.

## Who It's For
Anyone who routinely screenshots event announcements, flyers, or calendar invites from emails/chats and lets them get lost in their camera roll instead of taking the friction-heavy steps to manually type them into Google Calendar or Apple Calendar.

## The Core Loop
1. User drops an event flyer or email screenshot onto the single-page interface.
2. The UI immediately displays a shimmering skeleton card indicating active processing.
3. Extracted event fields (Title, Date, Start Time, End Time, Location/Link, Description) populate into high-contrast editable inputs; missing fields are highlighted in amber.
4. User reviews, makes any quick edits, and clicks "Download .ics" to save the calendar file ready to open in any calendar app.

## Inspiration & Identity
- **Visual Feel:** Clean, lightweight, high-utility single-page application.
- **Interactions:** Responsive drag-and-drop zone, smooth skeleton/shimmer loader state, clear visual cues (subtle borders and distinct inputs) so users immediately know fields are directly editable.
- **Tone:** Reliable, transparent, and swift—trust through visible, editable fields rather than black-box automation.

## Why This Matters to the Learner
To master the habit and discipline of plan-first development with AI coding agents: forcing a structured planning phase (`scope.md`, `prd.md`, `spec.md`) before writing any code, ensuring both agent and learner operate under an explicit written contract to eliminate drift, debugging waste, and scope creep.

## What "Working" Looks Like
A single-page web app where dropping a screenshot of an event flyer or invite immediately shows a shimmering loader, extracts Title, Date, Time, and Location into an editable card with amber highlights on missing items, and provides a single-click button that generates and downloads a valid RFC 5545 `.ics` file that opens directly in standard calendar applications.

## The POC Boundary
- **In Scope:**
  - Single-page web application (SPA)
  - Image drop/upload zone supporting PNG, JPG, WEBP
  - Shimmering skeleton loader feedback state during extraction
  - Structured multimodal extraction: Event Title, Date, Start Time, End Time, Location, Description
  - High-contrast editable card inputs with amber warning highlights for missing/uncertain fields
  - Client-side or endpoint generation of valid `.ics` calendar file download
  - Responsive, clean desktop/browser layout

## Later
- Multi-event extraction from a single image (e.g., conference schedule or festival line-up)
- Direct Google Calendar / Outlook OAuth sync
- Browser extension for right-click image capture
- Timezone automatic geocoding from location string

## Explicitly Cut
- **No authentication or user accounts:** Pure client utility; zero sign-up friction.
- **No database:** Ephemeral session; data lives on the card and downloads directly to the user's device.
- **No multi-event parsing:** Strictly one event per image upload to keep logic predictable.
- **No calendar sync / OAuth:** Replaced by clean, universal `.ics` file generation.
- **No recurring events:** Single-instance events only.
- **No native mobile app:** Standard responsive web application only.
