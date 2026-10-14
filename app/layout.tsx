import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Snap2Cal — Screenshot in, calendar event out",
  description: "Upload a screenshot of an event flyer or email, and get an editable event card plus a downloadable .ics calendar file.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#FAFAFA] text-slate-900 antialiased flex flex-col">
        {children}
      </body>
    </html>
  );
}
