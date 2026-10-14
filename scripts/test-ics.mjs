import fs from "fs";
import { generateICS } from "../lib/ics.ts";

// Event A: Full event with comma, semicolon, and emoji
const eventA = {
  title: "DEVPOST BUILD WITH AI DEMO NIGHT 2026",
  date: "2026-10-24",
  startTime: "18:00",
  endTime: "21:00",
  location: "123 Innovation Way, Tech Hub; Suite 400",
  description: "Join us for presentations, networking, and live demos! 🚀 Don't miss out; it's going to be great.",
  timezone: "Africa/Nairobi",
};

// Event B: Partial event — title, date + start time, no end time, no location, no description
const eventB = {
  title: "Morning Sync",
  date: "2026-10-25",
  startTime: "09:30",
  endTime: null,
  location: null,
  description: null,
  timezone: "America/New_York",
};

// Event C: Long description (~200 chars) to force line folding
const eventC = {
  title: "AI Developers Conference & Community Workshop",
  date: "2026-11-15",
  startTime: "10:00",
  endTime: "16:00",
  location: "Moscone Center, 747 Howard St, San Francisco, CA 94103",
  description: "A comprehensive deep dive into multimodal AI agents, autonomous planning workflows, prompt architectures, and production-grade system deployments with real-world industry case studies and hands-on labs! 🚀 Experience café networking sessions.",
  timezone: "America/Los_Angeles",
};

const icsA = generateICS(eventA);
const icsB = generateICS(eventB);
const icsC = generateICS(eventC);

fs.writeFileSync("test-event-a.ics", icsA, "utf8");
fs.writeFileSync("test-event-b.ics", icsB, "utf8");
fs.writeFileSync("test-event-c.ics", icsC, "utf8");

console.log("Generated test-event-a.ics, test-event-b.ics, and test-event-c.ics successfully.");
