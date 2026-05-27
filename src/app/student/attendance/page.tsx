"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import StudentNav from "@/components/StudentNav";

const QRScanner = dynamic(() => import("@/components/QRScanner"), { ssr: false });

interface AttendanceRecord {
  id: number;
  timestamp: string;
  session: { course: string; createdAt: string };
}

export default function AttendancePage() {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [scanned, setScanned] = useState(false);
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);

  const fetchAttendances = useCallback(async () => {
    const res = await fetch("/qrapi/attendance");
    if (res.ok) setAttendances(await res.json());
  }, []);

  useEffect(() => {
    fetch("/qrapi/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) router.push("/login");
        else fetchAttendances();
      })
      .catch(() => router.push("/login"));
  }, [router, fetchAttendances]);

  const handleScan = useCallback(
    async (qrCode: string) => {
      if (scanned) return;
      setScanned(true);
      setScanning(false);
      setMessage({ type: "info", text: "Marking attendance..." });

      const res = await fetch("/qrapi/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrCode }),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: `Attendance marked for ${data.course}!` });
        fetchAttendances();
      } else if (res.status === 409) {
        setMessage({ type: "info", text: "Attendance already recorded for this session." });
      } else {
        setMessage({ type: "error", text: data.error || "Failed to mark attendance. Please try again." });
        setScanned(false);
      }
    },
    [scanned, fetchAttendances]
  );

  const startScan = () => {
    setScanning(true);
    setMessage(null);
    setScanned(false);
  };

  return (
    <>
      <StudentNav />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Mark Attendance</h1>
            <p className="text-gray-600">Scan a QR code to record your attendance</p>
          </div>

          {/* Scanner card */}
          <div className="bg-white rounded-2xl border-2 border-gray-100 p-8 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8">
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Action</p>
                <h2 className="text-xl font-bold text-gray-900">Scan QR Code</h2>
                <p className="text-gray-600 mt-2">Point your camera at the QR code displayed by your lecturer</p>
              </div>
              {!scanning && (
                <button
                  onClick={startScan}
                  className="px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 whitespace-nowrap shadow-md hover:shadow-lg"
                >
                  Start Scanning
                </button>
              )}
            </div>

            {message && (
              <div
                className={`mb-6 px-4 py-4 rounded-xl text-sm border-2 flex items-start gap-3 font-medium ${
                  message.type === "success"
                    ? "bg-green-50 text-green-800 border-green-300"
                    : message.type === "info"
                    ? "bg-blue-50 text-blue-800 border-blue-300"
                    : "bg-red-50 text-red-800 border-red-300"
                }`}
              >
                <span className="mt-0.5 flex-shrink-0">
                  {message.type === "success" ? "✓" : message.type === "info" ? "ℹ" : "✕"}
                </span>
                <span>{message.text}</span>
              </div>
            )}

            {scanning ? (
              <div className="border-2 border-blue-200 rounded-xl overflow-hidden bg-blue-50 p-2">
                <QRScanner onScan={handleScan} onClose={() => setScanning(false)} />
              </div>
            ) : (
              !message && (
                <div className="border-3 border-dashed border-gray-200 rounded-xl p-12 text-center bg-gray-50 hover:border-gray-300 transition-colors">
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
                    </svg>
                  </div>
                  <p className="text-gray-600 font-medium">Ready to scan</p>
                  <p className="text-gray-500 text-sm mt-1">Press Start Scanning to begin</p>
                </div>
              )
            )}

            {message && message.type === "error" && (
              <button
                onClick={startScan}
                className="mt-6 w-full py-3 text-blue-700 border-2 border-blue-300 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors font-semibold"
              >
                Try Again
              </button>
            )}
          </div>

          {/* Quick attendance stats */}
          {attendances.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-200 p-6 sm:p-8">
              <p className="text-lg font-bold text-blue-900">
                ✓ You have marked attendance for <span className="text-2xl text-blue-700">{attendances.length}</span> session{attendances.length !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
