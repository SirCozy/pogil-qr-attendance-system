"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

const QRScanner = dynamic(() => import("@/components/QRScanner"), { ssr: false });

interface User {
  id: number;
  name: string;
  matricNo: string;
  role: string;
}

interface AttendanceRecord {
  id: number;
  timestamp: string;
  session: { course: string; createdAt: string };
}

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanned, setScanned] = useState(false);

  const fetchAttendances = useCallback(async () => {
    const res = await fetch("/qrapi/attendance");
    if (res.ok) setAttendances(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch("/qrapi/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { router.push("/login"); return; }
        setUser(data);
        fetchAttendances();
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

  const handleLogout = async () => {
    await fetch("/qrapi/auth/logout", { method: "POST" });
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-700 text-white shadow-md">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-200 uppercase tracking-widest font-medium">
                POGIL College of Health Technology
              </p>
              <h1 className="text-base font-bold mt-0.5">
                Computer Science Dept. — Attendance System
              </h1>
            </div>
            <button onClick={handleLogout}
              className="text-xs text-blue-200 hover:text-white border border-blue-500 rounded-lg px-3 py-1.5 transition-colors">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Profile card */}
        {user && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Student Profile
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Full Name</p>
                <p className="text-sm font-semibold text-gray-900">{user.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Matric Number</p>
                <p className="text-sm font-semibold text-gray-900 font-mono">{user.matricNo}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Department</p>
                <p className="text-sm font-semibold text-gray-900">Computer Science</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Level</p>
                <p className="text-sm font-semibold text-gray-900">ND II</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Session</p>
                <p className="text-sm font-semibold text-gray-900">2024/2025</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Total Attendance</p>
                <p className="text-sm font-bold text-blue-700">{attendances.length} sessions</p>
              </div>
            </div>
          </div>
        )}

        {/* Scanner card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Mark Attendance
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Scan the QR code displayed by your lecturer</p>
            </div>
            {!scanning && (
              <button onClick={startScan}
                className="text-sm px-4 py-2 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 transition-colors">
                Scan QR Code
              </button>
            )}
          </div>

          {message && (
            <div className={`mb-4 px-3 py-3 rounded-lg text-sm border flex items-start gap-2 ${
              message.type === "success"
                ? "bg-green-50 text-green-700 border-green-200"
                : message.type === "info"
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}>
              <span className="mt-0.5">
                {message.type === "success" ? "✓" : message.type === "info" ? "ℹ" : "✕"}
              </span>
              <span>{message.text}</span>
            </div>
          )}

          {scanning ? (
            <div>
              <QRScanner onScan={handleScan} onClose={() => setScanning(false)} />
            </div>
          ) : (
            !message && (
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
                  </svg>
                </div>
                <p className="text-sm text-gray-400">Press Scan QR Code to open your camera</p>
              </div>
            )
          )}

          {message && (message.type === "error") && (
            <button onClick={startScan} className="mt-3 w-full py-2 text-sm text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors font-medium">
              Try Again
            </button>
          )}
        </div>

        {/* Attendance history */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
            Attendance History ({attendances.length})
          </p>
          {attendances.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">No attendance records yet. Scan a QR code to mark your first attendance.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left pb-2 text-xs font-medium text-gray-400">#</th>
                    <th className="text-left pb-2 text-xs font-medium text-gray-400">Course</th>
                    <th className="text-left pb-2 text-xs font-medium text-gray-400">Date</th>
                    <th className="text-left pb-2 text-xs font-medium text-gray-400">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {attendances.map((a, i) => (
                    <tr key={a.id}>
                      <td className="py-2.5 text-gray-400 text-xs">{i + 1}</td>
                      <td className="py-2.5 font-medium text-gray-900">{a.session.course}</td>
                      <td className="py-2.5 text-gray-600">
                        {new Date(a.timestamp).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 text-gray-600">
                        {new Date(a.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
