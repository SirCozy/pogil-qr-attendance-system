"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import QRDisplay from "@/components/QRDisplay";

interface Session {
  id: number;
  course: string;
  qrCode: string;
  createdAt: string;
  _count: { attendances: number };
}

interface AttendanceRecord {
  id: number;
  timestamp: string;
  student: { name: string; matricNo: string };
}

const PREDEFINED_COURSES = [
  "COM 211: Data Structures and Algorithms",
  "COM 212: Database Management Systems",
  "COM 213: Computer Networks",
  "COM 214: Systems Analysis and Design",
  "COM 215: Object-Oriented Programming",
  "ENT 211: Entrepreneurship Development",
];

export default function LecturerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [course, setCourse] = useState(PREDEFINED_COURSES[0]);
  const [customCourse, setCustomCourse] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [qrFullscreen, setQrFullscreen] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchSessions = useCallback(async () => {
    const res = await fetch("/qrapi/sessions");
    if (res.ok) {
      const data = await res.json();
      setSessions(data);
    }
    setLoading(false);
  }, []);

  const fetchAttendance = useCallback(async (sessionId: number) => {
    const res = await fetch(`/qrapi/attendance/${sessionId}`);
    if (res.ok) {
      const data = await res.json();
      setAttendance(data);
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId ? { ...s, _count: { attendances: data.length } } : s
        )
      );
    }
  }, []);

  useEffect(() => {
    fetch("/qrapi/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { router.push("/login"); return; }
        setUser(data);
        fetchSessions();
      })
      .catch(() => router.push("/login"));
  }, [router, fetchSessions]);

  useEffect(() => {
    if (activeSession) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => fetchAttendance(activeSession.id), 10000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [activeSession, fetchAttendance]);

  const createSession = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedCourse = useCustom ? customCourse.trim() : course;
    if (!selectedCourse) return;
    setCreating(true);
    const res = await fetch("/qrapi/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ course: selectedCourse }),
    });
    if (res.ok) {
      const newSession = await res.json();
      setSessions((prev) => [newSession, ...prev]);
      setActiveSession(newSession);
      setAttendance([]);
    }
    setCreating(false);
  };

  const selectSession = (session: Session) => {
    setActiveSession(session);
    fetchAttendance(session.id);
  };

  const exportExcel = async () => {
    if (!activeSession) return;
    setExporting(true);
    const res = await fetch(`/qrapi/sessions/${activeSession.id}/export`);
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const cd = res.headers.get("Content-Disposition") || "";
      const match = cd.match(/filename="(.+)"/);
      a.download = match ? match[1] : `attendance_${activeSession.id}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    }
    setExporting(false);
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
    <>
      {/* Fullscreen QR overlay */}
      {qrFullscreen && activeSession && (
        <div
          className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center cursor-pointer"
          onClick={() => setQrFullscreen(false)}
        >
          <p className="text-sm text-gray-400 mb-2 uppercase tracking-widest font-medium">
            POGIL College of Health Technology
          </p>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">{activeSession.course}</h2>
          <p className="text-sm text-gray-400 mb-8">Scan to mark attendance</p>
          <QRDisplay value={activeSession.qrCode} size={320} />
          <p className="text-xs text-gray-400 mt-8">Tap anywhere to close</p>
        </div>
      )}

      <div className="min-h-screen bg-gray-50">
        <header className="bg-blue-700 text-white shadow-md">
          <div className="max-w-5xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/pogil-logo.jpg" alt="POGIL College of Health Technology" className="h-10 w-10 rounded-full object-cover flex-shrink-0 border-2 border-blue-400" />
                <div>
                  <p className="text-xs text-blue-200 uppercase tracking-widest font-medium">
                    POGIL College of Health Technology
                  </p>
                  <h1 className="text-base font-bold mt-0.5">
                    Computer Science Dept. — Lecturer Dashboard
                    {user ? ` · ${user.name}` : ""}
                  </h1>
                </div>
              </div>
              <button onClick={handleLogout}
                className="text-xs text-blue-200 hover:text-white border border-blue-500 rounded-lg px-3 py-1.5 transition-colors">
                Sign out
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Left column */}
            <div className="lg:col-span-1 space-y-4">
              {/* New session form */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Start New Session
                </p>
                <form onSubmit={createSession} className="space-y-3">
                  {!useCustom ? (
                    <select
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white"
                    >
                      {PREDEFINED_COURSES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={customCourse}
                      onChange={(e) => setCustomCourse(e.target.value)}
                      placeholder="Enter course name"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  )}
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-500">
                    <input type="checkbox" checked={useCustom} onChange={(e) => setUseCustom(e.target.checked)}
                      className="accent-blue-600" />
                    Enter custom course name
                  </label>
                  <button type="submit" disabled={creating}
                    className="w-full py-2 bg-blue-700 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 disabled:opacity-50 transition-colors">
                    {creating ? "Starting..." : "Start Session"}
                  </button>
                </form>
              </div>

              {/* Sessions list */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Sessions ({sessions.length})
                </p>
                {sessions.length === 0 ? (
                  <p className="text-sm text-gray-400">No sessions yet.</p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {sessions.map((s) => (
                      <button key={s.id} onClick={() => selectSession(s)}
                        className={`w-full text-left px-3 py-3 rounded-lg border transition-colors ${
                          activeSession?.id === s.id
                            ? "border-blue-300 bg-blue-50"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}>
                        <p className="text-sm font-semibold text-gray-900 truncate">{s.course}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(s.createdAt).toLocaleDateString()} ·{" "}
                          <span className="font-medium text-blue-600">{s._count.attendances} present</span>
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right column */}
            <div className="lg:col-span-2 space-y-4">
              {activeSession ? (
                <>
                  {/* QR code card */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="text-base font-bold text-gray-900">{activeSession.course}</h2>
                        <p className="text-xs text-gray-400 mt-0.5">
                          ND II Computer Science · {new Date(activeSession.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setQrFullscreen(true)}
                          className="text-xs text-blue-700 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors font-medium">
                          Fullscreen
                        </button>
                        <button onClick={exportExcel} disabled={exporting}
                          className="text-xs text-green-700 border border-green-200 rounded-lg px-3 py-1.5 hover:bg-green-50 transition-colors font-medium disabled:opacity-50">
                          {exporting ? "Exporting..." : "Export Excel"}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <QRDisplay value={activeSession.qrCode} size={220} />
                    </div>
                    <p className="text-xs text-gray-400 text-center mt-3">
                      Display this QR code for students to scan · auto-refreshes every 10 s
                    </p>
                  </div>

                  {/* Attendance table */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        Attendance — {attendance.length} present
                      </p>
                      <button onClick={() => fetchAttendance(activeSession.id)}
                        className="text-xs text-blue-700 font-medium hover:text-blue-800">
                        Refresh now
                      </button>
                    </div>

                    {attendance.length === 0 ? (
                      <p className="text-sm text-gray-400 py-2">No students have marked attendance yet.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-100">
                              <th className="text-left pb-2 text-xs font-medium text-gray-400">#</th>
                              <th className="text-left pb-2 text-xs font-medium text-gray-400">Name</th>
                              <th className="text-left pb-2 text-xs font-medium text-gray-400">Matric No.</th>
                              <th className="text-left pb-2 text-xs font-medium text-gray-400">Time</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {attendance.map((a, i) => (
                              <tr key={a.id}>
                                <td className="py-2.5 text-gray-400 text-xs">{i + 1}</td>
                                <td className="py-2.5 font-medium text-gray-900">{a.student.name}</td>
                                <td className="py-2.5 text-gray-600 font-mono text-xs">{a.student.matricNo}</td>
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
                </>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-center justify-center min-h-64 text-center">
                  <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-600">No active session</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Select a course and start a session to display the QR code.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
