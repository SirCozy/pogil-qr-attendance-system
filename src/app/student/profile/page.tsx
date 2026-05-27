"use client";

import { useState, useEffect } from "react";
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

export default function ProfilePage() {
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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
          {/* Page Header */}
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Student Profile</h1>
            <p className="text-gray-600">Your information and attendance summary</p>
          </div>

          {/* Profile Information Card */}
          {user && (
            <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-md overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-8">
                <h2 className="text-2xl font-bold text-white mb-1">{user.name}</h2>
                <p className="text-blue-100 font-mono">{user.matricNo}</p>
              </div>

              {/* Content */}
              <div className="p-8">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-6">Personal Information</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="pb-6 border-b-2 border-gray-100 sm:border-b-0 lg:pb-0 lg:border-b-2">
                    <p className="text-gray-600 font-medium mb-2">Full Name</p>
                    <p className="text-lg font-bold text-gray-900">{user.name}</p>
                  </div>
                  <div className="pb-6 border-b-2 border-gray-100 sm:border-b-0 lg:pb-0 lg:border-b-2">
                    <p className="text-gray-600 font-medium mb-2">Matric Number</p>
                    <p className="text-lg font-bold text-gray-900 font-mono">{user.matricNo}</p>
                  </div>
                  <div className="pb-6 border-b-2 border-gray-100 sm:pb-0 sm:border-b-0 lg:pb-0 lg:border-b-2">
                    <p className="text-gray-600 font-medium mb-2">Department</p>
                    <p className="text-lg font-bold text-gray-900">Computer Science</p>
                  </div>
                  <div className="pb-6 border-b-2 border-gray-100 sm:border-b-0 lg:pb-0 lg:border-b-2">
                    <p className="text-gray-600 font-medium mb-2">Level</p>
                    <p className="text-lg font-bold text-gray-900">ND II</p>
                  </div>
                  <div className="pb-6 border-b-2 border-gray-100 sm:border-b-0 lg:pb-0 lg:border-b-2">
                    <p className="text-gray-600 font-medium mb-2">Academic Session</p>
                    <p className="text-lg font-bold text-gray-900">2024/2025</p>
                  </div>
                  <div className="pb-6 border-b-2 border-gray-100 sm:pb-0 sm:border-b-0 lg:pb-0 lg:border-b-2">
                    <p className="text-gray-600 font-medium mb-2">Total Attendance</p>
                    <p className="text-2xl font-bold text-blue-700">{attendances.length}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Attendance Overview */}
          <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-md overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-8 py-6 border-b-2 border-blue-200">
              <h3 className="text-xl font-bold text-gray-900">Attendance Overview</h3>
            </div>

            {/* Content */}
            <div className="p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Marked */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-gray-600 font-medium text-sm">Sessions Marked</p>
                    <div className="bg-blue-200 rounded-lg p-2">
                      <svg className="w-5 h-5 text-blue-700" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 12l2 2 4-4m7 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-4xl font-bold text-blue-700">{attendances.length}</p>
                </div>

                {/* Unique Courses */}
                {attendances.length > 0 && (
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-gray-600 font-medium text-sm">Unique Courses</p>
                      <div className="bg-green-200 rounded-lg p-2">
                        <svg className="w-5 h-5 text-green-700" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 6.253v13m0-13C6.228 6.228 2 10.456 2 15.5c0 5.046 4.228 9.274 10 9.274s10-4.228 10-9.274c0-5.044-4.228-9.247-10-9.247z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-4xl font-bold text-green-700">
                      {new Set(attendances.map((a) => a.session.course)).size}
                    </p>
                  </div>
                )}

                {/* Latest Attendance */}
                {attendances.length > 0 && (
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-200">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-gray-600 font-medium text-sm">Latest Attendance</p>
                      <div className="bg-purple-200 rounded-lg p-2">
                        <svg className="w-5 h-5 text-purple-700" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-purple-700">
                      {new Date(attendances[0].timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                )}

                {/* First Attendance */}
                {attendances.length > 0 && (
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border-2 border-orange-200">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-gray-600 font-medium text-sm">First Attendance</p>
                      <div className="bg-orange-200 rounded-lg p-2">
                        <svg className="w-5 h-5 text-orange-700" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m0 0l-2-1m2 1v2.5M14 4l-2 1m0 0l-2-1m2 1v2.5" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-orange-700">
                      {new Date(attendances[attendances.length - 1].timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-md p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">About This System</h3>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                This attendance system allows you to mark your presence in classes by scanning QR codes provided by your lecturer. All attendance records are automatically saved and timestamped for accuracy.
              </p>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-blue-900">
                  <span className="font-semibold">Pro tip:</span> Visit the <span className="font-semibold text-blue-700">Mark Attendance</span> page to scan a QR code during class, and check your <span className="font-semibold text-blue-700">History</span> anytime to view all your attendance records.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
