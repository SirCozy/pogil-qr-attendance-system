"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [role, setRole] = useState<"student" | "lecturer">("student");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("registered") === "1") {
      setSuccess("Account created! You can now sign in.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch("/qrapi/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, identifier, password }),
        signal: controller.signal,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }
      const dest = data.role === "student" ? "/student/dashboard" : data.role === "lecturer" ? "/lecturer/dashboard" : "/admin/dashboard";
      window.location.href = dest;
    } catch (error) {
      setError(error instanceof DOMException && error.name === "AbortError" ? "Login timed out. Please try again." : "Login failed");
    } finally {
      window.clearTimeout(timeout);
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8 w-full max-w-md">
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Sign In</h2>
      <p className="text-sm text-gray-500 mb-6">Select your role to continue</p>

      <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg">
        {(["student", "lecturer"] as const).map((r) => (
          <button key={r} type="button"
            onClick={() => { setRole(r); setIdentifier(""); setError(""); setSuccess(""); }}
            className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
              role === r ? "bg-blue-700 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}>
            {r.charAt(0).toUpperCase() + r.slice(1)}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {role === "student" ? "Matric Number" : "Email Address"}
          </label>
          <input
            type={role === "student" ? "text" : "email"}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder={role === "student" ? "e.g. CSC/ND2/24/001" : "e.g. akinboro.deborah@pogil.edu.ng"}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <Link href="/forgot-password" className="text-xs text-blue-700 hover:underline">
              Forgot password?
            </Link>
          </div>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password" required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent" />
        </div>

        {success && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{success}</p>
        )}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <button type="submit" disabled={loading}
          className="w-full py-2.5 bg-blue-700 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 disabled:opacity-50 transition-colors">
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-500">
        New student?{" "}
        <Link href="/register" className="text-blue-700 font-medium hover:underline">Register here</Link>
      </p>

    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="bg-blue-700 text-white py-4 px-6 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <img src="/pogil-logo.jpg" alt="POGIL College of Health Technology" className="h-12 w-12 sm:h-14 sm:w-14 rounded-full object-cover flex-shrink-0 border-2 border-blue-400" />
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-blue-200">
              POGIL College of Health Technology
            </p>
            <h1 className="text-lg font-bold mt-0.5">
              Computer Science Department — Student Attendance System
            </h1>
            <p className="text-xs text-blue-200 mt-0.5">ND II · 2025/2026 Academic Session</p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <Suspense fallback={<div className="text-sm text-gray-400">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>

      <footer className="text-center py-4 text-xs text-gray-400">
        Supervised by Mrs. Akinboro Deborah &mdash; Computer Science Dept., POGIL College of Health Technology
      </footer>
    </div>
  );
}
