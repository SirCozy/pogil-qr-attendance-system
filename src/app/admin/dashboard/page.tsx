"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatAcademicSession } from "@/lib/academicSession";

interface Code {
  id: number;
  code: string;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
  usedBy: { name: string; matricNo: string } | null;
}

interface Student {
  id: number;
  name: string;
  matricNo: string | null;
  academicSession: string | null;
  createdAt: string | null;
}

interface Lecturer {
  id: number;
  name: string;
  email: string | null;
  createdAt: string | null;
}

const EXPIRY_OPTIONS = [
  { label: "1 Hour", value: 1 },
  { label: "6 Hours", value: 6 },
  { label: "24 Hours", value: 24 },
  { label: "3 Days", value: 72 },
  { label: "7 Days", value: 168 },
];

const SECURITY_QUESTIONS = [
  "What is your mother's maiden name?",
  "What was the name of your first school?",
  "What is your place of birth?",
  "What is your favourite food?",
  "What was the name of your childhood best friend?",
];

function codeStatus(code: Code): { label: string; color: string } {
  if (code.usedAt) return { label: "Used", color: "text-gray-500 bg-gray-100" };
  if (new Date() > new Date(code.expiresAt))
    return { label: "Expired", color: "text-red-700 bg-red-50" };
  return { label: "Active", color: "text-green-700 bg-green-50" };
}

function fmtDate(v: string | null) {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtDateTime(v: string | null) {
  if (!v) return "—";
  return new Date(v).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const BLANK_FORM = { name: "", email: "", password: "", securityQuestion: SECURITY_QUESTIONS[0], securityAnswer: "" };

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; id?: number } | null>(null);
  const [adminId, setAdminId] = useState<number | null>(null);

  // Codes
  const [codes, setCodes] = useState<Code[]>([]);
  const [expiryHours, setExpiryHours] = useState(24);
  const [generating, setGenerating] = useState(false);
  const [newCode, setNewCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Users
  const [students, setStudents] = useState<Student[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Create Lecturer
  const [createForm, setCreateForm] = useState(BLANK_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  const fetchCodes = useCallback(async () => {
    const res = await fetch("/qrapi/admin/codes");
    if (res.ok) setCodes(await res.json());
    setLoading(false);
  }, []);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    const res = await fetch("/qrapi/admin/users");
    if (res.ok) {
      const data = await res.json();
      setStudents(data.students);
      setLecturers(data.lecturers);
    }
    setUsersLoading(false);
  }, []);

  useEffect(() => {
    fetch("/qrapi/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { router.push("/admin/login"); return; }
        setUser(data);
        if (data.id) setAdminId(data.id);
        fetchCodes();
        fetchUsers();
      })
      .catch(() => router.push("/admin/login"));
  }, [router, fetchCodes, fetchUsers]);

  const generateCode = async () => {
    setGenerating(true);
    setNewCode(null);
    const res = await fetch("/qrapi/admin/codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expiryHours }),
    });
    if (res.ok) {
      const data = await res.json();
      setNewCode(data.code);
      fetchCodes();
    }
    setGenerating(false);
  };

  const handleLogout = async () => {
    await fetch("/qrapi/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  const handleCreateLecturer = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    setCreateSuccess(null);
    const res = await fetch("/qrapi/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createForm),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) { setCreateError(data.error || "Failed to create lecturer"); return; }
    setCreateSuccess(`Lecturer "${createForm.name}" created successfully.`);
    setCreateForm(BLANK_FORM);
    fetchUsers();
  };

  const handleDeleteUser = async (u: { id: number; name: string; role: string }) => {
    const label = u.role === "student" ? "student" : "lecturer";
    const confirmed = window.confirm(
      `Delete ${label} "${u.name}"?\n\nThis will permanently remove their account` +
      (u.role === "student" ? " and all their attendance records." : " along with all their sessions and related attendance records.")
    );
    if (!confirmed) return;
    setDeletingId(u.id);
    const res = await fetch(`/qrapi/admin/users/${u.id}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) {
      fetchUsers();
    } else {
      const data = await res.json();
      alert(data.error || "Delete failed");
    }
  };

  const active = codes.filter((c) => !c.usedAt && new Date() <= new Date(c.expiresAt)).length;
  const expired = codes.filter((c) => !c.usedAt && new Date() > new Date(c.expiresAt)).length;
  const used = codes.filter((c) => c.usedAt).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <header className="bg-gradient-to-r from-blue-700 to-blue-800 text-white border-b border-blue-900">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/pogil-logo.jpg" alt="POGIL College of Health Technology" className="h-10 w-10 rounded-full object-cover flex-shrink-0 border-2 border-white" />
            <div>
              <p className="text-xs text-blue-100 uppercase tracking-widest">System Administration</p>
              <h1 className="text-base font-semibold text-white mt-0.5">
                POGIL Attendance — Admin Panel
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user && <span className="text-xs text-blue-100">{user.name}</span>}
            <button
              onClick={handleLogout}
              className="text-xs text-blue-100 hover:bg-blue-600 border border-blue-600 rounded-lg px-3 py-1.5 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Active Codes", value: active, color: "text-green-600" },
            { label: "Expired", value: expired, color: "text-red-600" },
            { label: "Used", value: used, color: "text-gray-600" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs text-gray-600 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Registration Codes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Generate Registration Code</h2>
            <div className="mb-4">
              <label className="block text-xs text-gray-600 mb-2">Code Expiry</label>
              <div className="space-y-1.5">
                {EXPIRY_OPTIONS.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="expiry"
                      value={opt.value}
                      checked={expiryHours === opt.value}
                      onChange={() => setExpiryHours(opt.value)}
                      className="accent-blue-600"
                    />
                    <span className="text-sm text-gray-700">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <button
              onClick={generateCode}
              disabled={generating}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {generating ? "Generating..." : "Generate Code"}
            </button>
            {newCode && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl text-center">
                <p className="text-xs text-blue-700 mb-1">New Registration Code</p>
                <p className="text-2xl font-mono font-bold text-blue-900 tracking-widest">{newCode}</p>
                <p className="text-xs text-blue-600 mt-2">Share this with the student to register</p>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">All Registration Codes</h2>
              <button onClick={fetchCodes} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                Refresh
              </button>
            </div>
            {loading ? (
              <p className="text-sm text-gray-500 py-4">Loading...</p>
            ) : codes.length === 0 ? (
              <p className="text-sm text-gray-500 py-4">No codes generated yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left pb-2 text-xs font-medium text-gray-600">Code</th>
                      <th className="text-left pb-2 text-xs font-medium text-gray-600">Expires</th>
                      <th className="text-left pb-2 text-xs font-medium text-gray-600">Status</th>
                      <th className="text-left pb-2 text-xs font-medium text-gray-600">Used By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {codes.map((c) => {
                      const status = codeStatus(c);
                      return (
                        <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-2.5 font-mono font-semibold text-gray-900">{c.code}</td>
                          <td className="py-2.5 text-gray-600 text-xs">
                            {fmtDateTime(c.expiresAt)}
                          </td>
                          <td className="py-2.5">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.color}`}>
                              {status.label}
                            </span>
                          </td>
                          <td className="py-2.5 text-gray-600 text-xs">
                            {c.usedBy ? (
                              <span>
                                {c.usedBy.name}
                                <br />
                                <span className="text-gray-500">{c.usedBy.matricNo}</span>
                              </span>
                            ) : (
                              <span className="text-gray-600">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Create Lecturer + Lecturers Table */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Lecturer Form */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Create Lecturer Account</h2>
            <form onSubmit={handleCreateLecturer} className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Dr. Okonkwo Emmanuel"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="lecturer@pogil.edu.ng"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={createForm.password}
                  onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Security Question</label>
                <select
                  required
                  value={createForm.securityQuestion}
                  onChange={(e) => setCreateForm((f) => ({ ...f, securityQuestion: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {SECURITY_QUESTIONS.map((q) => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Security Answer</label>
                <input
                  type="text"
                  required
                  value={createForm.securityAnswer}
                  onChange={(e) => setCreateForm((f) => ({ ...f, securityAnswer: e.target.value }))}
                  placeholder="Answer to the question above"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {createError && (
                <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {createError}
                </p>
              )}
              {createSuccess && (
                <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  {createSuccess}
                </p>
              )}

              <button
                type="submit"
                disabled={creating}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {creating ? "Creating..." : "Create Lecturer"}
              </button>
            </form>
          </div>

          {/* Lecturers Table */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">Lecturers</h2>
              <button onClick={fetchUsers} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                Refresh
              </button>
            </div>
            {usersLoading ? (
              <p className="text-sm text-gray-500 py-4">Loading...</p>
            ) : lecturers.length === 0 ? (
              <p className="text-sm text-gray-500 py-4">No lecturers found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left pb-2 text-xs font-medium text-gray-600">Name</th>
                      <th className="text-left pb-2 text-xs font-medium text-gray-600">Email</th>
                      <th className="text-left pb-2 text-xs font-medium text-gray-600">Date Created</th>
                      <th className="text-left pb-2 text-xs font-medium text-gray-600"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {lecturers.map((l) => (
                      <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-2.5 text-gray-900 text-sm">{l.name}</td>
                        <td className="py-2.5 text-gray-600 text-xs">{l.email ?? "—"}</td>
                        <td className="py-2.5 text-gray-600 text-xs">{fmtDate(l.createdAt)}</td>
                        <td className="py-2.5">
                          <button
                            onClick={() => handleDeleteUser({ id: l.id, name: l.name, role: "lecturer" })}
                            disabled={deletingId === l.id || l.id === adminId}
                            className="text-xs text-red-600 hover:text-red-700 border border-red-300 hover:border-red-400 rounded px-2 py-1 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            {deletingId === l.id ? "Deleting…" : "Delete"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Students</h2>
            <span className="text-xs text-gray-600">{students.length} registered</span>
          </div>
          {usersLoading ? (
            <p className="text-sm text-gray-500 py-4">Loading...</p>
          ) : students.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">No students registered yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left pb-2 text-xs font-medium text-gray-600">Name</th>
                    <th className="text-left pb-2 text-xs font-medium text-gray-600">Matric Number</th>
                    <th className="text-left pb-2 text-xs font-medium text-gray-600">Academic Session</th>
                    <th className="text-left pb-2 text-xs font-medium text-gray-600">Date Created</th>
                    <th className="text-left pb-2 text-xs font-medium text-gray-600"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {students.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-2.5 text-gray-900 text-sm">{s.name}</td>
                      <td className="py-2.5 font-mono text-gray-600 text-xs">{s.matricNo ?? "—"}</td>
                      <td className="py-2.5 text-gray-600 text-xs">
                        {s.academicSession ? formatAcademicSession(s.academicSession) : "—"}
                      </td>
                      <td className="py-2.5 text-gray-600 text-xs">{fmtDate(s.createdAt)}</td>
                      <td className="py-2.5">
                        <button
                          onClick={() => handleDeleteUser({ id: s.id, name: s.name, role: "student" })}
                          disabled={deletingId === s.id}
                          className="text-xs text-red-600 hover:text-red-700 border border-red-300 hover:border-red-400 rounded px-2 py-1 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          {deletingId === s.id ? "Deleting…" : "Delete"}
                        </button>
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
