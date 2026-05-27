"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import StudentNav from "@/components/StudentNav";

interface AttendanceRecord {
  id: number;
  timestamp: string;
  session: { course: string; createdAt: string };
}

export default function HistoryPage() {
  const router = useRouter();
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
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Attendance History</h1>
            <p className="text-gray-600">View all your recorded attendance sessions</p>
          </div>

          {/* Attendance history */}
          <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-md overflow-hidden">
            {/* Header with count */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-8 py-6 border-b-2 border-blue-200">
              <h2 className="text-xl font-bold text-gray-900">
                Sessions Attended: <span className="text-blue-700">{attendances.length}</span>
              </h2>
            </div>

            {/* Content */}
            <div className="p-8">
              {attendances.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-lg font-semibold text-gray-900 mb-1">No attendance records yet</p>
                  <p className="text-gray-600">Mark your attendance by scanning a QR code on the Mark Attendance page</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-gray-200">
                          <th className="text-left pb-4 text-xs font-bold text-gray-600 uppercase tracking-wide">#</th>
                          <th className="text-left pb-4 text-xs font-bold text-gray-600 uppercase tracking-wide">Course</th>
                          <th className="text-left pb-4 text-xs font-bold text-gray-600 uppercase tracking-wide">Date</th>
                          <th className="text-left pb-4 text-xs font-bold text-gray-600 uppercase tracking-wide">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {attendances.map((a, i) => (
                          <tr key={a.id} className="hover:bg-blue-50 transition-colors">
                            <td className="py-4 text-gray-500 text-sm font-semibold">{String(i + 1).padStart(2, "0")}</td>
                            <td className="py-4 font-semibold text-gray-900 text-sm">{a.session.course}</td>
                            <td className="py-4 text-gray-700 text-sm">
                              {new Date(a.timestamp).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </td>
                            <td className="py-4 text-gray-700 text-sm">
                              {new Date(a.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary stats */}
                  <div className="mt-8 pt-8 border-t-2 border-gray-200">
                    <p className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-6">Summary</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                        <p className="text-gray-600 text-sm font-medium mb-2">Total Sessions</p>
                        <p className="text-4xl font-bold text-blue-700">{attendances.length}</p>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                        <p className="text-gray-600 text-sm font-medium mb-2">First Attendance</p>
                        <p className="text-lg font-bold text-green-700">
                          {new Date(attendances[attendances.length - 1].timestamp).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                        <p className="text-gray-600 text-sm font-medium mb-2">Latest Attendance</p>
                        <p className="text-lg font-bold text-purple-700">
                          {new Date(attendances[0].timestamp).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
