"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StudentNav from "@/components/StudentNav";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/qrapi/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          router.push("/login");
          return;
        }
        setUser(data);
        return fetch("/qrapi/attendance");
      })
      .then((res) => res?.json())
      .then((data) => {
        if (data) setAttendances(data);
        setLoading(false);
      })
      .catch(() => router.push("/login"));
  }, [router]);

  if (loading) {
    return (
      <>
        <StudentNav />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <StudentNav />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
          {/* Welcome Section */}
          {user && (
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl p-8 sm:p-10 shadow-lg">
              <h2 className="text-3xl sm:text-4xl font-bold mb-3">Welcome back, {user.name}!</h2>
              <p className="text-blue-100 text-lg">
                You have marked attendance for{" "}
                <span className="font-bold text-blue-50 text-2xl block sm:inline">
                  {attendances.length} session{attendances.length !== 1 ? "s" : ""}
                </span>
              </p>
            </div>
          )}

          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Mark Attendance Card */}
            <Link href="/student/attendance">
              <div className="bg-white rounded-2xl border-2 border-gray-100 p-7 hover:shadow-xl hover:border-blue-300 transition-all duration-300 cursor-pointer h-full group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Quick Action</p>
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors">Mark Attendance</h3>
                  </div>
                  <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg p-3 ml-3 group-hover:from-blue-200 group-hover:to-blue-100 transition-all">
                    <svg className="w-7 h-7 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
                    </svg>
                  </div>
                </div>
                <p className="text-gray-600 mb-6 leading-relaxed">Scan a QR code to mark your attendance</p>
                <div className="flex items-center text-blue-700 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                  <span>Start scanning</span>
                  <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>

            {/* History Card */}
            <Link href="/student/history">
              <div className="bg-white rounded-2xl border-2 border-gray-100 p-7 hover:shadow-xl hover:border-green-300 transition-all duration-300 cursor-pointer h-full group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-2">Records</p>
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-green-700 transition-colors">Attendance History</h3>
                  </div>
                  <div className="bg-gradient-to-br from-green-100 to-green-50 rounded-lg p-3 ml-3 group-hover:from-green-200 group-hover:to-green-100 transition-all">
                    <svg className="w-7 h-7 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <p className="text-gray-600 mb-6 leading-relaxed">View all {attendances.length} attendance record{attendances.length !== 1 ? "s" : ""}</p>
                <div className="flex items-center text-green-700 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                  <span>View records</span>
                  <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          </div>

          {/* Profile Card */}
          <Link href="/student/profile">
            <div className="bg-white rounded-2xl border-2 border-gray-100 p-7 hover:shadow-xl hover:border-purple-300 transition-all duration-300 cursor-pointer group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2">Account</p>
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-700 transition-colors">Student Profile</h3>
                </div>
                <div className="bg-gradient-to-br from-purple-100 to-purple-50 rounded-lg p-3 ml-3 group-hover:from-purple-200 group-hover:to-purple-100 transition-all">
                  <svg className="w-7 h-7 text-purple-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-gray-600 mb-6 leading-relaxed">View your profile information and attendance summary</p>
              <div className="flex items-center text-purple-700 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                <span>View profile</span>
                <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </>
  );
}
