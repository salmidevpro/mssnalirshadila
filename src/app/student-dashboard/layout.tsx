"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  BookOpen,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  User,
  X,
} from "lucide-react";

const SCHOOL_BLUE = "#010066";
const SCHOOL_BLUE_DARK = "#00004D";
const SCHOOL_GOLD = "#FFAF2E";

const navigation = [
  {
    title: "Dashboard",
    href: "/student-dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "My Courses",
    href: "/student-dashboard/courses",
    icon: BookOpen,
  },
  {
    title: "Assignments",
    href: "/student-dashboard/assignments",
    icon: ClipboardList,
  },
  {
    title: "Results",
    href: "/student-dashboard/results",
    icon: GraduationCap,
  },
  {
    title: "Academic Calendar",
    href: "/student-dashboard/calendar",
    icon: CalendarDays,
  },
  {
    title: "Profile",
    href: "/student-dashboard/profile",
    icon: User,
  },
  {
    title: "Settings",
    href: "/student-dashboard/settings",
    icon: Settings,
  },
];

export default function StudentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div
      className={`min-h-screen ${
        darkMode
          ? "bg-slate-950 text-white"
          : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* =====================================================
          MOBILE SIDEBAR OVERLAY
      ====================================================== */}

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close dashboard menu"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      {/* =====================================================
          SIDEBAR
      ====================================================== */}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col border-r transition-transform duration-300 ${
          darkMode
            ? "border-white/10 bg-slate-900"
            : "border-slate-200 bg-white"
        } ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* =================================================
            SIDEBAR HEADER
        ================================================== */}

        <div
          className={`flex h-[82px] shrink-0 items-center border-b px-5 ${
            darkMode
              ? "border-white/10"
              : "border-slate-200"
          }`}
        >
          <Link
            href="/student-dashboard"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3"
          >
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
              <img
                src="/images/al-ishad-logo.jpeg"
                alt="MSSN Al-Irshad"
                className="h-full w-full object-contain p-1"
              />
            </div>

            <div>
              <p
                className="text-sm font-black leading-tight"
                style={{ color: SCHOOL_BLUE }}
              >
                MSSN AL-IRSHAD
              </p>

              <p
                className={`mt-0.5 text-[10px] font-semibold tracking-wide ${
                  darkMode
                    ? "text-white/40"
                    : "text-slate-400"
                }`}
              >
                STUDENT DASHBOARD
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            className={`ml-auto flex h-9 w-9 items-center justify-center rounded-lg lg:hidden ${
              darkMode
                ? "text-white/60 hover:bg-white/10"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            <X size={19} />
          </button>
        </div>

        {/* =================================================
            NAVIGATION
        ================================================== */}

        <nav className="flex-1 overflow-y-auto px-4 py-6">
          <p
            className={`mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] ${
              darkMode
                ? "text-white/30"
                : "text-slate-400"
            }`}
          >
            Student Menu
          </p>

          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all duration-200 ${
                    darkMode
                      ? "text-white/60 hover:bg-white/5 hover:text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-[#010066]"
                  }`}
                >
                  <Icon
                    size={19}
                    className="shrink-0"
                  />

                  <span>{item.title}</span>

                  {item.href === "/student-dashboard" && (
                    <ChevronRight
                      size={15}
                      className="ml-auto opacity-40 transition-transform group-hover:translate-x-0.5"
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* =================================================
            SIDEBAR PROFILE
        ================================================== */}

        <div
          className={`shrink-0 border-t p-4 ${
            darkMode
              ? "border-white/10"
              : "border-slate-200"
          }`}
        >
          <div
            className={`flex items-center gap-3 rounded-xl p-3 ${
              darkMode
                ? "bg-white/5"
                : "bg-slate-50"
            }`}
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{
                backgroundColor: SCHOOL_BLUE,
              }}
            >
              AA
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">
                Abdulsalam Abdulazeez
              </p>

              <p
                className={`truncate text-[11px] ${
                  darkMode
                    ? "text-white/40"
                    : "text-slate-400"
                }`}
              >
                Student
              </p>
            </div>

            <button
              type="button"
              aria-label="Logout"
              className={`rounded-lg p-2 transition-colors ${
                darkMode
                  ? "text-white/40 hover:bg-white/10 hover:text-white"
                  : "text-slate-400 hover:bg-slate-200 hover:text-[#010066]"
              }`}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      {/* =====================================================
          MAIN DASHBOARD AREA
      ====================================================== */}

      <div className="lg:pl-[270px]">
        {/* =================================================
            TOPBAR
        ================================================== */}

        <header
          className={`sticky top-0 z-30 border-b backdrop-blur-xl ${
            darkMode
              ? "border-white/10 bg-slate-950/90"
              : "border-slate-200 bg-white/90"
          }`}
        >
          <div className="flex h-[82px] items-center px-5 sm:px-8">
            {/* Mobile menu */}

            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open dashboard menu"
              className={`flex h-10 w-10 items-center justify-center rounded-xl lg:hidden ${
                darkMode
                  ? "bg-white/5 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              <Menu size={21} />
            </button>

            {/* Desktop identity */}

            <div className="ml-3 hidden lg:block">
              <p
                className={`text-[10px] font-semibold uppercase tracking-wider ${
                  darkMode
                    ? "text-white/35"
                    : "text-slate-400"
                }`}
              >
                Student Portal
              </p>

              <p
                className={`mt-1 text-sm font-bold ${
                  darkMode
                    ? "text-white"
                    : "text-slate-800"
                }`}
              >
                MSSN Al-Irshad Model School
              </p>
            </div>

            {/* Right controls */}

            <div className="ml-auto flex items-center gap-2">
              {/* Notifications */}

              <button
                type="button"
                aria-label="Notifications"
                className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                  darkMode
                    ? "bg-white/5 text-white/70 hover:bg-white/10"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Bell size={18} />

                <span
                  className="absolute right-2 top-2 h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: SCHOOL_GOLD,
                  }}
                />
              </button>

              {/* Theme */}

              <button
                type="button"
                onClick={() =>
                  setDarkMode((value) => !value)
                }
                aria-label="Toggle theme"
                className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                  darkMode
                    ? "bg-white/5 text-white/70 hover:bg-white/10"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {darkMode ? (
                  <Sun size={18} />
                ) : (
                  <Moon size={18} />
                )}
              </button>

              {/* User */}

              <div
                className={`ml-1 hidden items-center gap-3 rounded-xl px-3 py-2 sm:flex ${
                  darkMode
                    ? "bg-white/5"
                    : "bg-slate-100"
                }`}
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{
                    backgroundColor: SCHOOL_BLUE,
                  }}
                >
                  AA
                </div>

                <div className="hidden md:block">
                  <p
                    className={`text-xs font-bold ${
                      darkMode
                        ? "text-white"
                        : "text-slate-800"
                    }`}
                  >
                    Abdulsalam Abdulazeez
                  </p>

                  <p
                    className={`text-[10px] ${
                      darkMode
                        ? "text-white/40"
                        : "text-slate-400"
                    }`}
                  >
                    Student
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* =================================================
            PAGE CONTENT
        ================================================== */}

        <main className="min-h-[calc(100vh-82px)]">
          {children}
        </main>
      </div>
    </div>
  );
}