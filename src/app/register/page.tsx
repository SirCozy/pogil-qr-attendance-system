"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatAcademicSession, getAcademicSession } from "@/lib/academicSession";

const SECURITY_QUESTIONS = [
  "What is your mother's maiden name?",
  "What was the name of your first school?",
  "What is your place of birth?",
  "What is your favourite food?",
  "What was the name of your childhood best friend?",
];

export default function RegisterPage() {
  const router = useRouter();
  const academicSession = formatAcademicSession(getAcademicSession());
  const [form, setForm] = useState({
    name: "",
    matricNo: "",
    password: "",
    confirmPassword: "",
    code: "",
    securityQuestion: SECURITY_QUESTIONS[0],
    securityAnswer: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (!form.securityAnswer.trim()) {
      setError("Please provide an answer to your security question");
      return;
    }

    setLoading(true);
    const res = await fetch("/qrapi/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        matricNo: form.matricNo,
        password: form.password,
        code: form.code,
        securityQuestion: form.securityQuestion,
        securityAnswer: form.securityAnswer,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Registration failed");
      setLoading(false);
      return;
    }

    router.push("/login?registered=1");
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
            <p className="text-xs text-blue-200 mt-0.5">ND II · {academicSession} Academic Session</p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8 w-full max-w-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Student Registration</h2>
          <p className="text-sm text-gray-500 mb-6">
            You need a valid registration code from your admin to register.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <input name="name" type="text" value={form.name} onChange={handleChange}
                placeholder="e.g. ADEBAYO MUSTAPHA" required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Matric Number</label>
              <input name="matricNo" type="text" value={form.matricNo} onChange={handleChange}
                placeholder="e.g. CSC/ND2/24/001" required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input name="password" type="password" value={form.password} onChange={handleChange}
                placeholder="Minimum 6 characters" required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
              <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange}
                placeholder="Repeat your password" required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Registration Code</label>
              <input name="code" type="text" value={form.code} onChange={handleChange}
                placeholder="8-character code from your admin" required maxLength={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent" />
            </div>

            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Security Question (for password recovery)
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Choose a Question</label>
                  <select name="securityQuestion" value={form.securityQuestion} onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white">
                    {SECURITY_QUESTIONS.map((q) => (
                      <option key={q} value={q}>{q}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Answer</label>
                  <input name="securityAnswer" type="text" value={form.securityAnswer} onChange={handleChange}
                    placeholder="Enter your answer (case-insensitive)" required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent" />
                </div>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-blue-700 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 disabled:opacity-50 transition-colors">
              {loading ? "Registering..." : "Create Account"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-500">
            Already registered?{" "}
            <Link href="/login" className="text-blue-700 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>

      <footer className="text-center py-4 text-xs text-gray-400">
        Supervised by Mrs. Akinboro Deborah &mdash; Computer Science Dept., POGIL College of Health Technology
      </footer>
    </div>
  );
}
