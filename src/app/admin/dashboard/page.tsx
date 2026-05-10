"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Code {
  id: number;
  code: string;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
  usedBy: { name: string; matricNo: string } | null;
}

const EXPIRY_OPTIONS = [
  { label: "1 Hour", value: 1 },
  { label: "6 Hours", value: 6 },
  { label: "24 Hours", value: 24 },
  { label: "3 Days", value: 72 },
  { label: "7 Days", value: 168 },
];

function codeStatus(code: Code): { label: string; color: string } {
  if (code.usedAt) return { label: "Used", color: "text-gray-500 bg-gray-100" };
  if (new Date() > new Date(code.expiresAt))
    return { label: "Expired", color: "text-red-700 bg-red-50" };
  return { label: "Active", color: "text-green-700 bg-green-50" };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [codes, setCodes] = useState<Code[]>([]);
  const [expiryHours, setExpiryHours] = useState(24);
  const [generating, setGenerating] = useState(false);
  const [newCode, setNewCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCodes = useCallback(async () => {
    const res = await fetch("/api/admin/codes");
    if (res.ok) setCodes(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          router.push("/admin/login");
          return;
        }
        setUser(data);
        fetchCodes();
      })
      .catch(() => router.push("/admin/login"));
  }, [router, fetchCodes]);

  const generateCode = async () => {
    setGenerating(true);
    setNewCode(null);
    const res = await fetch("/api/admin/codes", {
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
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  const active = codes.filter(
    (c) => !c.usedAt && new Date() <= new Date(c.expiresAt)
  ).length;
  const expired = codes.filter(
    (c) => !c.usedAt && new Date() > new Date(c.expiresAt)
  ).length;
  const used = codes.filter((c) => c.usedAt).length;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest">System Administration</p>
            <h1 className="text-base font-semibold text-white mt-0.5">
              POGIL Attendance — Admin Panel
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {user && <span className="text-xs text-gray-400">{user.name}</span>}
            <button
              onClick={handleLogout}
              className="text-xs text-gray-400 hover:text-white border border-gray-700 rounded-lg px-3 py-1.5 transition-colors"
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
            { label: "Active Codes", value: active, color: "text-green-400" },
            { label: "Expired", value: expired, color: "text-red-400" },
            { label: "Used", value: used, color: "text-gray-400" },
          ].map((stat) => (
            <div key={stat.label} className="bg-gray-900 rounded-xl border border-gray-800 p-4">
              <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Generate Code */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h2 className="text-sm font-semibold text-gray-300 mb-4">Generate Registration Code</h2>

            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-2">Code Expiry</label>
              <div className="space-y-1.5">
                {EXPIRY_OPTIONS.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="expiry"
                      value={opt.value}
                      checked={expiryHours === opt.value}
                      onChange={() => setExpiryHours(opt.value)}
                      className="accent-blue-500"
                    />
                    <span className="text-sm text-gray-300">{opt.label}</span>
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
              <div className="mt-4 p-4 bg-blue-900/40 border border-blue-700 rounded-xl text-center">
                <p className="text-xs text-blue-300 mb-1">New Registration Code</p>
                <p className="text-2xl font-mono font-bold text-white tracking-widest">
                  {newCode}
                </p>
                <p className="text-xs text-blue-400 mt-2">Share this with the student to register</p>
              </div>
            )}
          </div>

          {/* Code List */}
          <div className="lg:col-span-2 bg-gray-900 rounded-xl border border-gray-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-300">All Registration Codes</h2>
              <button
                onClick={fetchCodes}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
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
                    <tr className="border-b border-gray-800">
                      <th className="text-left pb-2 text-xs font-medium text-gray-500">Code</th>
                      <th className="text-left pb-2 text-xs font-medium text-gray-500">Expires</th>
                      <th className="text-left pb-2 text-xs font-medium text-gray-500">Status</th>
                      <th className="text-left pb-2 text-xs font-medium text-gray-500">Used By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {codes.map((c) => {
                      const status = codeStatus(c);
                      return (
                        <tr key={c.id}>
                          <td className="py-2.5 font-mono font-semibold text-white">
                            {c.code}
                          </td>
                          <td className="py-2.5 text-gray-400 text-xs">
                            {new Date(c.expiresAt).toLocaleString()}
                          </td>
                          <td className="py-2.5">
                            <span
                              className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.color}`}
                            >
                              {status.label}
                            </span>
                          </td>
                          <td className="py-2.5 text-gray-400 text-xs">
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
      </div>
    </div>
  );
}
