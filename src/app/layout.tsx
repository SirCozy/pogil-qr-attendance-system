import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Student Attendance System — POGIL College of Health Technology",
  description:
    "Web-based QR attendance system for Computer Science Department, POGIL College of Health Technology",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
