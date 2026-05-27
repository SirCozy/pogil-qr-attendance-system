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

interface MessageState {
  type: "success" | "error" | "info";
  text: string;
  course?: string;
}

export default function AttendancePage() {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState<MessageState | null>(null);
  const [scanned, setScanned] = useState(false);
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

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
        setShowSuccessAnimation(true);
        setMessage({ type: "success", text: `Attendance marked for ${data.course}!`, course: data.course });
        fetchAttendances();
        // Auto-hide animation after 3 seconds
        setTimeout(() => {
          setShowSuccessAnimation(false);
        }, 3000);
      } else if (res.status === 409) {
        setMessage({ type: "info", text: "Attendance already recorded for this session." });
        setScanned(false);
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
    setShowSuccessAnimation(false);
  };

  const closeScan = () => {
    setScanning(false);
    setScanned(false);
    setMessage(null);
  };

  return (
    <>
      <StudentNav />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-12 space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Mark Attendance</h1>
            <p className="text-gray-600">Scan a QR code to record your attendance</p>
          </div>

          {/* Success Animation - Full Screen Overlay */}
          {showSuccessAnimation && (
            <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
              <div className="animate-pulse">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-16 h-16 text-green-600 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Scanner Card */}
          <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 sm:p-8 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex flex-col gap-6">
              {/* Header Section */}
              {!scanning && (
                <div>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Action</p>
                  <h2 className="text-xl font-bold text-gray-900">Scan QR Code</h2>
                  <p className="text-gray-600 text-sm mt-2">Point your camera at the QR code displayed by your lecturer</p>
                </div>
              )}

              {/* Message Display */}
              {message && (
                <div
                  className={`px-4 py-4 rounded-xl text-sm border-2 flex items-start gap-3 font-medium animate-in fade-in ${
                    message.type === "success"
                      ? "bg-green-50 text-green-800 border-green-300"
                      : message.type === "info"
                      ? "bg-blue-50 text-blue-800 border-blue-300"
                      : "bg-red-50 text-red-800 border-red-300"
                  }`}
                >
                  <span className="mt-0.5 flex-shrink-0 text-lg">
                    {message.type === "success" ? "✓" : message.type === "info" ? "ℹ" : "✕"}
                  </span>
                  <div className="flex-1">
                    <p>{message.text}</p>
                    {message.course && message.type === "success" && (
                      <p className="text-xs opacity-80 mt-1">Course: {message.course}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Scanner or Empty State */}
              {scanning ? (
                <div className="border-2 border-blue-200 rounded-xl overflow-hidden bg-gray-50">
                  <QRScanner onScan={handleScan} onClose={closeScan} />
                </div>
              ) : !message ? (
                <div className="border-3 border-dashed border-gray-200 rounded-xl p-8 sm:p-12 text-center bg-gray-50 hover:border-gray-300 transition-colors">
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-600 font-medium text-lg">Ready to scan</p>
                  <p className="text-gray-500 text-sm mt-2">Press the button below to start scanning</p>
                </div>
              ) : null}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {!scanning && !message && (
                  <button
                    onClick={startScan}
                    className="flex-1 px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
                  >
                    Start Scanning
                  </button>
                )}
                {scanning && (
                  <button
                    onClick={closeScan}
                    className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                )}
                {message && message.type === "error" && (
                  <button
                    onClick={startScan}
                    className="flex-1 py-3 text-blue-700 border-2 border-blue-300 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors font-semibold"
                  >
                    Try Again
                  </button>
                )}
                {message && message.type === "success" && (
                  <button
                    onClick={startScan}
                    className="flex-1 py-3 text-blue-700 border-2 border-blue-300 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors font-semibold"
                  >
                    Scan Another
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Attendance Stats */}
          {attendances.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-200 p-6 sm:p-8 shadow-md">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-blue-600 font-semibold">Attendance Marked</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {attendances.length} session{attendances.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
