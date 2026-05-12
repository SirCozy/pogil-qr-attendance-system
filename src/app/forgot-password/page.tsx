"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Step = "identify" | "question" | "reset" | "done";

const SECURITY_QUESTIONS = [
  "What is your mother's maiden name?",
  "What was the name of your first school?",
  "What is your place of birth?",
  "What is your favourite food?",
  "What was the name of your childhood best friend?",
];

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("identify");
  const [role, setRole] = useState<"student" | "lecturer">("student");
  const [identifier, setIdentifier] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleIdentify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/qrapi/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: "question", role, identifier }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    setQuestion(data.question);
    setStep("question");
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }
    if (newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    setError("");
    const res = await fetch("/qrapi/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: "reset", role, identifier, answer, newPassword }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    setStep("done");
  };

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
            <p className="text-xs text-blue-200 mt-0.5">ND II · 2024/2025 Academic Session</p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8 w-full max-w-md">

          {step === "identify" && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Reset Password</h2>
              <p className="text-sm text-gray-500 mb-6">
                Enter your details to verify your identity.
              </p>

              <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg">
                {(["student", "lecturer"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => { setRole(r); setIdentifier(""); setError(""); }}
                    className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      role === r ? "bg-blue-700 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>

              <form onSubmit={handleIdentify} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {role === "student" ? "Matric Number" : "Email Address"}
                  </label>
                  <input
                    type={role === "student" ? "text" : "email"}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={role === "student" ? "e.g. CSC/ND2/24/001" : "your@email.com"}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
                )}
                <button type="submit" disabled={loading}
                  className="w-full py-2.5 bg-blue-700 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 disabled:opacity-50 transition-colors">
                  {loading ? "Checking..." : "Continue"}
                </button>
              </form>
            </>
          )}

          {step === "question" && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Security Question</h2>
              <p className="text-sm text-gray-500 mb-6">Answer your security question to proceed.</p>

              <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <p className="text-sm font-medium text-blue-900">{question}</p>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); if (!answer.trim()) { setError("Please enter your answer"); return; } setError(""); setStep("reset"); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Answer</label>
                  <input
                    type="text"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Enter your answer"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
                )}
                <button type="submit"
                  className="w-full py-2.5 bg-blue-700 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors">
                  Continue
                </button>
              </form>
              <button onClick={() => { setStep("identify"); setError(""); }}
                className="mt-3 w-full py-2 text-sm text-gray-500 hover:text-gray-700">
                ← Back
              </button>
            </>
          )}

          {step === "reset" && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">New Password</h2>
              <p className="text-sm text-gray-500 mb-6">Choose a strong new password.</p>

              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters" required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password" required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent" />
                </div>
                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
                )}
                <button type="submit" disabled={loading}
                  className="w-full py-2.5 bg-blue-700 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 disabled:opacity-50 transition-colors">
                  {loading ? "Saving..." : "Reset Password"}
                </button>
              </form>
            </>
          )}

          {step === "done" && (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Password Reset!</h2>
              <p className="text-sm text-gray-500 mb-6">
                Your password has been updated. You can now sign in with your new password.
              </p>
              <button onClick={() => router.push("/login")}
                className="w-full py-2.5 bg-blue-700 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors">
                Go to Sign In
              </button>
            </div>
          )}

          {step !== "done" && (
            <p className="mt-4 text-center text-sm text-gray-500">
              Remembered it?{" "}
              <Link href="/login" className="text-blue-700 font-medium hover:underline">Sign in</Link>
            </p>
          )}
        </div>
      </div>

      <footer className="text-center py-4 text-xs text-gray-400">
        Supervised by Mrs. Akinboro Deborah &mdash; Computer Science Dept., POGIL College of Health Technology
      </footer>
    </div>
  );
}
