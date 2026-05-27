"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

export default function StudentNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await fetch("/qrapi/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const navItems = [
    { href: "/student/dashboard", label: "Dashboard" },
    { href: "/student/attendance", label: "Mark Attendance" },
    { href: "/student/history", label: "History" },
    { href: "/student/profile", label: "Profile" },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* Desktop Navigation */}
      <header className="hidden md:block bg-gradient-to-r from-blue-700 to-blue-800 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src="/pogil-logo.jpg"
                alt="POGIL College of Health Technology"
                className="h-12 w-12 rounded-full object-cover flex-shrink-0 border-3 border-blue-300 shadow-md"
              />
              <div>
                <p className="text-xs text-blue-100 uppercase tracking-widest font-bold">
                  POGIL College of Health Technology
                </p>
                <h1 className="text-lg font-bold text-white mt-0.5">
                  CS Dept. — Attendance System
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <nav className="flex gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      isActive(item.href)
                        ? "bg-white text-blue-700 shadow-md"
                        : "text-blue-100 hover:bg-blue-600 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <button
                onClick={handleLogout}
                className="text-sm px-4 py-2 text-blue-100 hover:text-white border-2 border-blue-300 hover:border-white rounded-lg transition-all duration-200 font-semibold"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden bg-gradient-to-r from-blue-700 to-blue-800 text-white shadow-lg sticky top-0 z-40">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/pogil-logo.jpg"
              alt="POGIL"
              className="h-10 w-10 rounded-full object-cover border-2 border-blue-300 shadow-md"
            />
            <h1 className="text-base font-bold text-white">Attendance</h1>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 hover:bg-blue-600 rounded-lg transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={
                  mobileMenuOpen
                    ? "M6 18L18 6M6 6l12 12"
                    : "M4 6h16M4 12h16M4 18h16"
                }
              />
            </svg>
          </button>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <nav className="bg-blue-800 border-t-2 border-blue-600 py-2 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                  isActive(item.href)
                    ? "bg-blue-900 text-white border-l-4 border-white"
                    : "text-blue-100 hover:bg-blue-700 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="w-full text-left px-4 py-3 text-sm font-semibold text-blue-100 hover:bg-blue-700 hover:text-white transition-colors border-t-2 border-blue-600 mt-2"
            >
              Sign out
            </button>
          </nav>
        )}
      </header>
    </>
  );
}
