/**
 * Pure TypeScript RFC 5545 iCalendar Serializer
 * Zero external dependencies.
 */

export interface CalendarEvent {
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm (24-hour)
  endTime?: string | null; // HH:mm (24-hour), optional
  location?: string | null;
  description?: string | null;
  timezone?: string; // IANA timezone string, e.g. "America/New_York"
}

/**
 * Escapes characters per RFC 5545 Section 3.3.11:
 * Backslashes, semicolons, commas, and newlines must be escaped.
 */
export function escapeText(text: string): string {
  if (!text) return "";
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\, clinical_or_comma") // placeholder protection
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function cleanEscape(text: string): string {
  if (!text) return "";
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/**
 * Converts a wall-clock date, time, and IANA timezone to a UTC Date object.
 */
export function parseLocalToUTC(
  dateStr: string,
  timeStr: string,
  timeZone: string
): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);

  // Initial UTC assumption
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));

  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    const parts = formatter.formatToParts(utcGuess);
    const getPart = (type: string) =>
      Number(parts.find((p) => p.type === type)?.value || 0);

    let tzHour = getPart("hour");
    if (tzHour === 24) tzHour = 0;

    const asTz = new Date(
      Date.UTC(
        getPart("year"),
        getPart("month") - 1,
        getPart("day"),
        tzHour,
        getPart("minute"),
        0
      )
    );

    const diffMs = asTz.getTime() - utcGuess.getTime();
    return new Date(utcGuess.getTime() - diffMs);
  } catch (err) {
    console.warn("Timezone conversion fallback to UTC for zone:", timeZone, err);
    return utcGuess;
  }
}

/**
 * Formats a Date object into UTC iCalendar format: YYYYMMDDTHHmmssZ
 */
export function formatUTC(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    date.getUTCFullYear() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    "T" +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    "Z"
  );
}

/**
 * Folds a content line so no physical line exceeds 75 UTF-8 octets (RFC 5545 Section 3.1).
 * Folded lines begin with a single CRLF followed by a space.
 */
export function foldLine(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) {
    return line;
  }

  // Iterate character by character (Array.from preserves Unicode code points)
  const chars = Array.from(line);
  const lines: string[] = [];
  let currentLine = "";
  let currentBytes = 0;
  let isFirstLine = true;

  for (const char of chars) {
    const charBytes = encoder.encode(char).length;
    const maxBytes = isFirstLine ? 75 : 74; // Subsequent lines reserve 1 byte for leading space

    if (currentBytes + charBytes > maxBytes) {
      lines.push(currentLine);
      currentLine = char;
      currentBytes = charBytes;
      isFirstLine = false;
    } else {
      currentLine += char;
      currentBytes += charBytes;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.join("\r\n ");
}

/**
 * Generates RFC 5545 compliant .ics string from event details.
 */
export function generateICS(event: CalendarEvent): string {
  const tz = event.timezone;
  if (!tz) {
    throw new Error("Timezone must be provided to generateICS");
  }
  const startUtc = parseLocalToUTC(event.date, event.startTime, tz);
  const dtStartStr = `DTSTART:${formatUTC(startUtc)}`;

  let dtEndStr: string | null = null;
  if (event.endTime && event.endTime.trim()) {
    const endUtc = parseLocalToUTC(event.date, event.endTime, tz);
    dtEndStr = `DTEND:${formatUTC(endUtc)}`;
  }

  const dtStamp = `DTSTAMP:${formatUTC(new Date())}`;
  const uid = `UID:${crypto.randomUUID()}@snap2cal`;

  const rawLines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Snap2Cal//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    uid,
    dtStamp,
    dtStartStr,
  ];

  // If endTime is provided, include DTEND; if null, omit completely per spec
  if (dtEndStr) {
    rawLines.push(dtEndStr);
  }

  rawLines.push(`SUMMARY:${cleanEscape(event.title || "Event")}`);

  if (event.location && event.location.trim()) {
    rawLines.push(`LOCATION:${cleanEscape(event.location.trim())}`);
  }

  if (event.description && event.description.trim()) {
    rawLines.push(`DESCRIPTION:${cleanEscape(event.description.trim())}`);
  }

  rawLines.push("STATUS:CONFIRMED");
  rawLines.push("END:VEVENT");
  rawLines.push("END:VCALENDAR");

  // Apply 75-octet line folding and CRLF endings
  const foldedContent = rawLines.map(foldLine).join("\r\n") + "\r\n";

  return foldedContent;
}

/**
 * Helper to generate sanitized filename slug
 */
export function getIcsFilename(title: string | null | undefined): string {
  if (!title || !title.trim()) return "event.ics";
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `snap2cal-${slug || "event"}.ics`;
}
