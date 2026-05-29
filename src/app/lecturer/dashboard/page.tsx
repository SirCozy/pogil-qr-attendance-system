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

interface FormMessage {
  type: "success" | "error";
  text: string;
}

const PREDEFINED_COURSES = [
  "COM 211: Data Structures and Algorithms",
  "COM 212: Database Management Systems",
  "COM 213: Computer Networks",
  "COM 214: Systems Analysis and Design",
  "COM 215: Object-Oriented Programming",
  "ENT 211: Entrepreneurship Development",
];

// Helper function to check if session is active (within last hour)
const isSessionActive = (createdAt: string): boolean => {
  const sessionTime = new Date(createdAt).getTime();
  const now = Date.now();
  const oneHourMs = 60 * 60 * 1000;
  return now - sessionTime < oneHourMs;
};

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
  const [formMessage, setFormMessage] = useState<FormMessage | null>(null);
  const [submitPressed, setSubmitPressed] = useState(false);
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
    if (submitPressed || creating) return; // Prevent duplicate submits
    const selectedCourse = useCustom ? customCourse.trim() : course;
    if (!selectedCourse) {
      setFormMessage({ type: "error", text: "Please enter a course name" });
      return;
    }
    setSubmitPressed(true);
    setCreating(true);
    setFormMessage(null);
    
    try {
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
        setFormMessage({ type: "success", text: `Session started for ${selectedCourse}` });
        if (!useCustom) setCustomCourse("");
        // Auto-hide success message after 3 seconds
        setTimeout(() => setFormMessage(null), 3000);
      } else {
        setFormMessage({ type: "error", text: "Failed to create session. Please try again." });
      }
    } catch (err) {
      setFormMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setCreating(false);
      setTimeout(() => setSubmitPressed(false), 1000);
    }
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-gray-600 text-sm font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalSessions = sessions.length;
  const activeSessions = sessions.filter(s => isSessionActive(s.createdAt)).length;
  const totalAttendances = sessions.reduce((sum, s) => sum + s._count.attendances, 0);
  const activeSessions_arr = sessions.filter(s => isSessionActive(s.createdAt));
  const pastSessions_arr = sessions.filter(s => !isSessionActive(s.createdAt));

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

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-700 to-blue-800 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/logo.jpg" alt="POGIL College of Health Technology" className="h-11 w-11 rounded-full object-cover flex-shrink-0 border-2 border-blue-400" />
                <div>
                  <p className="text-xs text-blue-200 uppercase tracking-widest font-semibold">
                    POGIL College of Health Technology
                  </p>
                  <h1 className="text-lg font-bold mt-0.5">
                    Lecturer Dashboard
                    {user ? ` · ${user.name}` : ""}
                  </h1>
                </div>
              </div>
              <button onClick={handleLogout}
                className="text-sm text-blue-100 hover:text-white border border-blue-400 hover:border-white rounded-lg px-4 py-2 transition-colors font-medium">
                Sign out
              </button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Quick Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Total Sessions */}
            <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Sessions</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{totalSessions}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Active Sessions */}
            <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Active Sessions</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{activeSessions}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Total Attendance */}
            <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Attendance</p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">{totalAttendances}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Main Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Column - Session Management */}
            <div className="lg:col-span-1 space-y-6">
              {/* Create Session Form */}
              <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 shadow-md">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Start Session</h3>
                <p className="text-sm text-gray-600 mb-6">Create a new attendance session</p>
                
                <form onSubmit={createSession} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Course
                    </label>
                    {!useCustom ? (
                      <select
                        value={course}
                        onChange={(e) => setCourse(e.target.value)}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white transition-all"
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
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                      />
                    )}
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={useCustom} 
                      onChange={(e) => setUseCustom(e.target.checked)}
                      className="w-4 h-4 accent-blue-600 rounded cursor-pointer" 
                    />
                    <span className="text-sm text-gray-600 font-medium group-hover:text-gray-700">
                      Custom course name
                    </span>
                  </label>

                  {formMessage && (
                    <div
                      className={`px-4 py-3 rounded-xl text-sm font-medium border-2 animate-in fade-in ${
                        formMessage.type === "success"
                          ? "bg-green-50 text-green-800 border-green-200"
                          : "bg-red-50 text-red-800 border-red-200"
                      }`}
                    >
                      {formMessage.type === "success" ? "✓ " : "✕ "}
                      {formMessage.text}
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={creating || submitPressed}
                    className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 disabled:bg-gray-400 text-white rounded-xl text-sm font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:scale-100"
                  >
                    {creating ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Starting...
                      </span>
                    ) : (
                      "Start Session"
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column - Sessions List and QR Display */}
            <div className="lg:col-span-3 space-y-6">
              {/* Active Sessions */}
              {activeSessions_arr.length > 0 && (
                <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-md overflow-hidden">
                  <div className="bg-gradient-to-r from-green-50 to-green-100 px-6 py-4 border-b-2 border-green-200">
                    <h3 className="text-sm font-bold text-green-900 uppercase tracking-wider">
                      Active Sessions ({activeSessions})
                    </h3>
                  </div>
                  <div className="p-6 space-y-3">
                    {activeSessions_arr.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => selectSession(s)}
                        className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                          activeSession?.id === s.id
                            ? "border-blue-400 bg-blue-50"
                            : "border-green-200 bg-green-50 hover:border-green-300"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-bold text-gray-900">{s.course}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              {new Date(s.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                          <div className="ml-3">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-200 text-green-800 text-xs font-semibold rounded-full">
                              <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                              Active
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mt-2 font-semibold text-blue-600">
                          {s._count.attendances} present
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* QR Code Display */}
              {activeSession ? (
                <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-md p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{activeSession.course}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(activeSession.createdAt).toLocaleString([], { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
                      <button 
                        onClick={() => setQrFullscreen(true)}
                        className="text-sm text-blue-700 border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-xl px-4 py-2 font-semibold transition-colors"
                      >
                        Fullscreen
                      </button>
                      <button 
                        onClick={exportExcel} 
                        disabled={exporting}
                        className="text-sm text-green-700 border-2 border-green-200 bg-green-50 hover:bg-green-100 disabled:opacity-50 rounded-xl px-4 py-2 font-semibold transition-colors"
                      >
                        {exporting ? "Exporting..." : "Export"}
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex justify-center py-6 bg-gray-50 rounded-xl">
                    <QRDisplay value={activeSession.qrCode} size={240} />
                  </div>
                  
                  <p className="text-xs text-gray-500 text-center mt-4">
                    Display this QR code for students to scan · Updates every 10 seconds
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-md p-12 text-center">
                  <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <p className="text-base font-semibold text-gray-800 mb-1">No active session</p>
                  <p className="text-sm text-gray-500">
                    Select a session from below or start a new one to display the QR code
                  </p>
                </div>
              )}

              {/* Attendance Table */}
              {activeSession && (
                <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-md overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b-2 border-blue-200 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider">
                      Attendance — {attendance.length} present
                    </h3>
                    <button 
                      onClick={() => fetchAttendance(activeSession.id)}
                      className="text-xs text-blue-700 font-semibold hover:text-blue-900 transition-colors"
                    >
                      Refresh
                    </button>
                  </div>

                  {attendance.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                      <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      </div>
                      <p className="text-gray-600 font-medium">No students yet</p>
                      <p className="text-sm text-gray-500 mt-1">Students who scan the QR code will appear here</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b-2 border-gray-100">
                            <th className="text-left px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">#</th>
                            <th className="text-left px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Name</th>
                            <th className="text-left px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Matric No.</th>
                            <th className="text-left px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {attendance.map((a, i) => (
                            <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-3 text-sm text-gray-500 font-medium">{i + 1}</td>
                              <td className="px-6 py-3 text-sm font-semibold text-gray-900">{a.student.name}</td>
                              <td className="px-6 py-3 text-sm text-gray-600 font-mono">{a.student.matricNo}</td>
                              <td className="px-6 py-3 text-sm text-gray-600">
                                {new Date(a.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Past Sessions */}
              {pastSessions_arr.length > 0 && (
                <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-md overflow-hidden">
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b-2 border-gray-200">
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                      Past Sessions ({pastSessions_arr.length})
                    </h3>
                  </div>
                  <div className="p-6 space-y-3 max-h-64 overflow-y-auto">
                    {pastSessions_arr.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => selectSession(s)}
                        className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                          activeSession?.id === s.id
                            ? "border-blue-400 bg-blue-50"
                            : "border-gray-200 bg-gray-50 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-bold text-gray-900">{s.course}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              {new Date(s.createdAt).toLocaleString([], { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                          <div className="ml-3">
                            <span className="inline-flex items-center px-2.5 py-1 bg-gray-200 text-gray-700 text-xs font-semibold rounded-full">
                              Ended
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mt-2 font-semibold">
                          {s._count.attendances} attendance record{s._count.attendances !== 1 ? "s" : ""}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
