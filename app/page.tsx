"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { generateICS, getIcsFilename } from "@/lib/ics";

export interface EventData {
  title: string | null;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  description: string | null;
}

const COMMON_TIMEZONES = [
  "Africa/Nairobi",
  "Africa/Cairo",
  "Africa/Johannesburg",
  "Africa/Lagos",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "UTC",
];

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pasteNotice, setPasteNotice] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [timezone, setTimezone] = useState<string>("");
  const [isChangingTz, setIsChangingTz] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize timezone from browser and log to console
  useEffect(() => {
    try {
      const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const initialTz = resolved || "UTC";
      setTimezone(initialTz);
      console.log("Snap2Cal timezone initialized:", initialTz);
    } catch (e) {
      console.warn("Could not resolve browser timezone, defaulting to UTC:", e);
      setTimezone("UTC");
    }
  }, []);

  // Upload and parse image via /api/extract
  const extractEvent = async (file: File) => {
    setIsParsing(true);
    setErrorMessage(null);
    setValidationWarning(null);
    setDownloadSuccess(false);
    setEventData(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to parse image");
      }

      // Check if all fields are null (unparseable or non-event image)
      const allNull =
        !data.title &&
        !data.date &&
        !data.startTime &&
        !data.endTime &&
        !data.location &&
        !data.description;

      if (allNull) {
        setErrorMessage(
          "Couldn't find event details in that image. Try a different screenshot or fill in the fields manually."
        );
      }

      setEventData({
        title: data.title || "",
        date: data.date || "",
        startTime: data.startTime || "",
        endTime: data.endTime || "",
        location: data.location || "",
        description: data.description || "",
      });
    } catch (err: unknown) {
      console.error("Extraction error:", err);
      const msg = err instanceof Error ? err.message : "Error extracting event";
      setErrorMessage(
        `Extraction error: ${msg}. You can enter details manually below.`
      );
      setEventData({
        title: "",
        date: "",
        startTime: "",
        endTime: "",
        location: "",
        description: "",
      });
    } finally {
      setIsParsing(false);
    }
  };

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file (PNG, JPG, WEBP).");
      return;
    }
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    extractEvent(file);
  }, []);

  // Clipboard paste listener (Ctrl/Cmd+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) {
            handleFile(file);
            setPasteNotice(true);
            setTimeout(() => setPasteNotice(false), 3000);
            e.preventDefault();
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handleFile]);

  // Cleanup object URL
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const resetAll = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setEventData(null);
    setIsParsing(false);
    setErrorMessage(null);
    setValidationWarning(null);
    setDownloadSuccess(false);
    setIsChangingTz(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const updateField = (field: keyof EventData, value: string) => {
    if (!eventData) return;
    setEventData({
      ...eventData,
      [field]: value,
    });
    setValidationWarning(null);
  };

  // Step 6: Download .ics calendar file
  const handleDownloadIcs = () => {
    if (!eventData) return;

    if (!eventData.date || !eventData.date.trim()) {
      setValidationWarning("Please enter an event date (YYYY-MM-DD) before downloading.");
      return;
    }
    if (!eventData.startTime || !eventData.startTime.trim()) {
      setValidationWarning("Please enter a start time (HH:mm) before downloading.");
      return;
    }

    try {
      const icsString = generateICS({
        title: eventData.title || "Event",
        date: eventData.date.trim(),
        startTime: eventData.startTime.trim(),
        endTime: eventData.endTime?.trim() || null,
        location: eventData.location?.trim() || null,
        description: eventData.description?.trim() || null,
        timezone: timezone || "UTC",
      });

      const blob = new Blob([icsString], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const filename = getIcsFilename(eventData.title);

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error("Failed to generate ICS:", err);
      alert("Error generating calendar file. Please check date and time formats.");
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
            Snap2Cal
          </h1>
          <p className="text-base text-slate-600 font-normal">
            Screenshot in, calendar event out.
          </p>
        </div>

        {/* Paste notification toast */}
        {pasteNotice && (
          <div className="mb-4 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm font-medium">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Pasted screenshot from clipboard!
          </div>
        )}

        {/* Stage 1: Dropzone (when idle) */}
        {!selectedFile && !isParsing && !eventData && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative w-full rounded-lg border-2 border-dashed p-10 transition-all duration-150 ease-in-out bg-white shadow-sm flex flex-col items-center justify-center min-h-[320px] ${
              isDragging
                ? "border-indigo-600 bg-indigo-50/40 ring-4 ring-indigo-500/10"
                : "border-slate-300 hover:border-slate-400"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
            />

            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.5V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
              </div>

              <div>
                <p className="text-base font-semibold text-slate-800">
                  Drag and drop your event screenshot here
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  or press <kbd className="px-1.5 py-0.5 text-xs font-mono bg-slate-100 border border-slate-300 rounded text-slate-700">Ctrl+V</kbd> / <kbd className="px-1.5 py-0.5 text-xs font-mono bg-slate-100 border border-slate-300 rounded text-slate-700">⌘V</kbd> to paste
                </p>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-sm font-medium rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Browse files
              </button>

              <p className="text-xs text-slate-400 mt-2">
                PNG, JPG, WEBP up to 10MB
              </p>
            </div>
          </div>
        )}

        {/* Stage 2: Shimmering Skeleton Loader */}
        {isParsing && (
          <div className="w-full bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-5 animate-pulse">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="h-5 bg-slate-200 rounded w-1/3"></div>
              <div className="h-4 bg-slate-200 rounded w-28"></div>
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-slate-200 rounded w-1/4"></div>
              <div className="h-10 bg-slate-100 rounded-lg w-full"></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                <div className="h-10 bg-slate-100 rounded-lg w-full"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                <div className="h-10 bg-slate-100 rounded-lg w-full"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-slate-200 rounded w-1/4"></div>
              <div className="h-10 bg-slate-100 rounded-lg w-full"></div>
            </div>
            <div className="h-11 bg-slate-200 rounded-lg w-full mt-4"></div>
            <p className="text-center text-xs text-slate-400 pt-1">
              Extracting event details from screenshot...
            </p>
          </div>
        )}

        {/* Stage 3: Populated High-Contrast Editable Card */}
        {!isParsing && eventData && (
          <div className="w-full bg-white rounded-lg border border-slate-200 shadow-md p-6">
            {/* Inline Warning/Error banner */}
            {errorMessage && (
              <div className="mb-5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-amber-600 shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Validation warning */}
            {validationWarning && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{validationWarning}</span>
              </div>
            )}

            {/* Card Header & Timezone Badge */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Event Card
              </span>
              <span className="text-xs text-slate-400">
                Click any field to edit
              </span>
            </div>

            {/* Editable Form Fields */}
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  value={eventData.title || ""}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="Event title..."
                  className={`w-full px-3 py-2 text-sm text-slate-900 bg-white rounded-lg border outline-none transition-colors ${
                    !eventData.title
                      ? "border-amber-500 bg-amber-50/10 focus:ring-1 focus:ring-amber-500"
                      : "border-slate-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  }`}
                />
              </div>

              {/* Date & Times */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date {!eventData.date && <span className="text-amber-600 font-normal">(needed)</span>}
                  </label>
                  <input
                    type="text"
                    value={eventData.date || ""}
                    onChange={(e) => updateField("date", e.target.value)}
                    placeholder="YYYY-MM-DD"
                    className={`w-full px-3 py-2 text-sm text-slate-900 bg-white rounded-lg border outline-none transition-colors font-mono ${
                      !eventData.date
                        ? "border-amber-500 bg-amber-50/20 focus:ring-1 focus:ring-amber-500"
                        : "border-slate-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Time {!eventData.startTime && <span className="text-amber-600 font-normal">(needed)</span>}
                  </label>
                  <input
                    type="text"
                    value={eventData.startTime || ""}
                    onChange={(e) => updateField("startTime", e.target.value)}
                    placeholder="HH:mm (e.g. 18:00)"
                    className={`w-full px-3 py-2 text-sm text-slate-900 bg-white rounded-lg border outline-none transition-colors font-mono ${
                      !eventData.startTime
                        ? "border-amber-500 bg-amber-50/20 focus:ring-1 focus:ring-amber-500"
                        : "border-slate-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    End Time <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={eventData.endTime || ""}
                    onChange={(e) => updateField("endTime", e.target.value)}
                    placeholder="HH:mm (e.g. 21:00)"
                    className="w-full px-3 py-2 text-sm text-slate-900 bg-white rounded-lg border border-slate-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none transition-colors font-mono"
                  />
                </div>
              </div>

              {/* Timezone affordance label & dropdown */}
              <div className="pt-0.5">
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span>Timezone:</span>
                  <button
                    type="button"
                    onClick={() => setIsChangingTz(!isChangingTz)}
                    className="font-mono text-indigo-600 hover:text-indigo-800 underline underline-offset-2 cursor-pointer font-medium"
                    title="Click to change timezone"
                  >
                    {timezone} · change
                  </button>
                </div>

                {isChangingTz && (
                  <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-700">
                      Select Event Timezone:
                    </label>
                    <select
                      value={timezone}
                      onChange={(e) => {
                        setTimezone(e.target.value);
                        setIsChangingTz(false);
                      }}
                      className="w-full px-2.5 py-1.5 text-xs text-slate-800 bg-white rounded border border-slate-300 font-mono outline-none"
                    >
                      {!COMMON_TIMEZONES.includes(timezone) && (
                        <option value={timezone}>{timezone} (detected)</option>
                      )}
                      {COMMON_TIMEZONES.map((tz) => (
                        <option key={tz} value={tz}>
                          {tz} {tz === timezone ? "✓" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Location / Meeting Link
                </label>
                <input
                  type="text"
                  value={eventData.location || ""}
                  onChange={(e) => updateField("location", e.target.value)}
                  placeholder="Venue address or meeting link..."
                  className="w-full px-3 py-2 text-sm text-slate-900 bg-white rounded-lg border border-slate-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Notes
                </label>
                <textarea
                  rows={3}
                  value={eventData.description || ""}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Event details, speakers, agenda..."
                  className="w-full px-3 py-2 text-sm text-slate-900 bg-white rounded-lg border border-slate-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none transition-colors resize-none"
                />
              </div>
            </div>

            {/* CTAs */}
            <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3 justify-between">
              <button
                type="button"
                onClick={resetAll}
                className="w-full sm:w-auto px-4 py-2.5 text-sm text-slate-600 hover:text-slate-900 border border-slate-300 hover:bg-slate-50 font-medium rounded-lg cursor-pointer transition-colors text-center order-2 sm:order-1"
              >
                Convert another
              </button>

              <button
                type="button"
                onClick={handleDownloadIcs}
                className={`w-full sm:w-auto px-6 py-2.5 font-medium text-sm rounded-lg shadow-sm transition-all cursor-pointer text-center order-1 sm:order-2 flex items-center justify-center gap-2 ${
                  downloadSuccess
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                }`}
              >
                {downloadSuccess ? (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Downloaded!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.5V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    Download .ics
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
