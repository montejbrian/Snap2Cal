"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pasteNotice, setPasteNotice] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle preview generation and cleanup
  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file (PNG, JPG, WEBP).");
      return;
    }
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }, []);

  // Global clipboard paste listener (Ctrl/Cmd+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
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

  // Clean up object URL on unmount or file change
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl text-center">
        {/* Header */}
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
          Snap2Cal
        </h1>
        <p className="text-lg text-slate-600 mb-8 font-normal">
          Screenshot in, calendar event out.
        </p>

        {/* Paste notification toast */}
        {pasteNotice && (
          <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm font-medium animate-fade-in">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Pasted image from clipboard!
          </div>
        )}

        {/* Dropzone Stage */}
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
            onChange={handleFileInputChange}
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
          />

          {!selectedFile ? (
            <div className="flex flex-col items-center gap-4">
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
                  or press <kbd className="px-1.5 py-0.5 text-xs font-mono bg-slate-100 border border-slate-300 rounded text-slate-700">Ctrl+V</kbd> / <kbd className="px-1.5 py-0.5 text-xs font-mono bg-slate-100 border border-slate-300 rounded text-slate-700">⌘V</kbd> to paste from clipboard
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
          ) : (
            <div className="flex flex-col items-center gap-4 w-full">
              {previewUrl && (
                <div className="relative max-h-56 overflow-hidden rounded-md border border-slate-200 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Uploaded event screenshot preview"
                    className="max-h-56 object-contain"
                  />
                </div>
              )}
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-800 truncate max-w-xs">
                  {selectedFile.name || "Pasted Image"}
                </p>
                <p className="text-xs text-slate-500">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>

              <div className="flex items-center gap-3 mt-2">
                <button
                  type="button"
                  onClick={clearFile}
                  className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  Remove
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 text-sm text-indigo-600 hover:text-indigo-700 border border-indigo-200 hover:bg-indigo-50 rounded-lg cursor-pointer"
                >
                  Change image
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
