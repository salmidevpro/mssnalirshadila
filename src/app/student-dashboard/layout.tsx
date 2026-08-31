"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  BookOpen,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  User,
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

const SCHOOL_BLUE = "#010066";
const SCHOOL_BLUE_DARK = "#00004D";
const SCHOOL_GOLD = "#FFAF2E";

type Student = {
  id: string;
  user_id: string;
  full_name: string | null;
  profile_photo: string | null;
  admission_number: string | null;
  student_id: string | null;
  status: string | null;
};

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
    title: "Payments",
    href: "/student-dashboard/payments",
    icon: CreditCard,
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
  const router = useRouter();
  const pathname = usePathname();

  const supabase = useMemo(() => createClient(), []);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);
  const [loadingStudent, setLoadingStudent] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  /* =====================================================
     LOAD LOGGED-IN STUDENT
  ====================================================== */

  useEffect(() => {
    let mounted = true;

    const loadStudent = async () => {
      try {
        setLoadingStudent(true);

        /* -----------------------------------------------
           GET AUTHENTICATED USER
        ------------------------------------------------ */

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          console.error("Authentication error:", authError);

          if (mounted) {
            setStudent(null);
          }

          router.replace("/student-login");
          return;
        }

        if (!user) {
          if (mounted) {
            setStudent(null);
          }

          router.replace("/student-login");
          return;
        }

        /* -----------------------------------------------
           GET STUDENT RECORD
        ------------------------------------------------ */

        const { data, error } = await supabase
          .from("students")
          .select(
            `
              id,
              user_id,
              full_name,
              profile_photo,
              admission_number,
              student_id,
              status
            `,
          )
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Student profile error:", error);

          if (mounted) {
            setStudent(null);
          }

          return;
        }

        if (!data) {
          console.error(
            "No student record found for authenticated user.",
          );

          if (mounted) {
            setStudent(null);
          }

          return;
        }

        if (mounted) {
          setStudent(data as Student);
        }
      } catch (error) {
        console.error(
          "Dashboard student loading error:",
          error,
        );

        if (mounted) {
          setStudent(null);
        }
      } finally {
        if (mounted) {
          setLoadingStudent(false);
        }
      }
    };

    void loadStudent();

    return () => {
      mounted = false;
    };
  }, [router, supabase]);

  /* =====================================================
     CLOSE MOBILE SIDEBAR WHEN ROUTE CHANGES
  ====================================================== */

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  /* =====================================================
     LOGOUT
  ====================================================== */

  const handleSignOut = async () => {
    if (signingOut) {
      return;
    }

    try {
      setSigningOut(true);

      const { error } = await supabase.auth.signOut();

      if (error) {
        throw new Error(error.message);
      }

      /*
       * Force a complete browser navigation.
       * This prevents the student from remaining
       * inside the protected dashboard after logout.
       */

      window.location.replace("/student-login");
    } catch (error) {
      console.error("Sign out error:", error);

      setSigningOut(false);

      /*
       * Even if the local sign-out encounters an issue,
       * don't leave the user stuck in the dashboard.
       */

      window.location.replace("/student-login");
    }
  };

  /* =====================================================
     STUDENT NAME
  ====================================================== */

  const studentName =
    student?.full_name?.trim() || "Student";

  /* =====================================================
     STUDENT INITIALS
  ====================================================== */

  const getInitials = (name: string) => {
    const words = name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (words.length === 0) {
      return "ST";
    }

    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }

    return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
  };

  const studentInitials = getInitials(studentName);

  /* =====================================================
     LOADING PROFILE
  ====================================================== */

  if (loadingStudent) {
    return (
      <div className="min-h-screen bg-slate-50">
        <aside className="fixed inset-y-0 left-0 hidden w-[270px] border-r border-slate-200 bg-white lg:flex lg:flex-col">
          <div className="flex h-[82px] items-center border-b border-slate-200 px-5">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 animate-pulse rounded-xl bg-slate-200" />

              <div>
                <div className="h-3 w-32 animate-pulse rounded bg-slate-200" />

                <div className="mt-2 h-2.5 w-24 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          </div>

          <div className="space-y-3 px-4 py-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div
                key={item}
                className="h-11 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        </aside>

        <div className="lg:pl-[270px]">
          <header className="h-[82px] border-b border-slate-200 bg-white" />

          <main className="min-h-[calc(100vh-82px)] p-5 sm:p-8">
            <div className="mx-auto max-w-5xl space-y-6">
              <div className="h-48 animate-pulse rounded-3xl bg-white" />

              <div className="h-72 animate-pulse rounded-3xl bg-white" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
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
        className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col border-r border-slate-200 bg-white transition-transform duration-300 ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* =================================================
            SIDEBAR HEADER
        ================================================== */}

        <div className="flex h-[82px] shrink-0 items-center border-b border-slate-200 px-5">
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
                style={{
                  color: SCHOOL_BLUE,
                }}
              >
                MSSN AL-IRSHAD
              </p>

              <p className="mt-0.5 text-[10px] font-semibold tracking-wide text-slate-400">
                STUDENT DASHBOARD
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 lg:hidden"
          >
            <X size={19} />
          </button>
        </div>

        {/* =================================================
            NAVIGATION
        ================================================== */}

        <nav className="flex-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
            Student Menu
          </p>

          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;

              const isActive =
                item.href === "/student-dashboard"
                  ? pathname === "/student-dashboard"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-[#010066]/[0.07] text-[#010066]"
                      : "text-slate-600 hover:bg-slate-100 hover:text-[#010066]"
                  }`}
                >
                  <Icon
                    size={19}
                    className={`shrink-0 ${
                      isActive
                        ? "text-[#010066]"
                        : ""
                    }`}
                  />

                  <span>{item.title}</span>

                  {isActive &&
                    item.href !==
                      "/student-dashboard" && (
                      <span
                        className="ml-auto h-1.5 w-1.5 rounded-full"
                        style={{
                          backgroundColor:
                            SCHOOL_GOLD,
                        }}
                      />
                    )}

                  {item.href ===
                    "/student-dashboard" && (
                    <ChevronRight
                      size={15}
                      className={`ml-auto transition-transform group-hover:translate-x-0.5 ${
                        isActive
                          ? "opacity-100"
                          : "opacity-40"
                      }`}
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

        <div className="shrink-0 border-t border-slate-200 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            {/* PROFILE PHOTO */}

            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-bold text-white"
              style={{
                backgroundColor: SCHOOL_BLUE,
              }}
            >
              {student?.profile_photo ? (
                <img
                  src={student.profile_photo}
                  alt={studentName}
                  className="h-full w-full object-cover"
                />
              ) : (
                studentInitials
              )}
            </div>

            {/* STUDENT NAME */}

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-800">
                {studentName}
              </p>

              <p className="truncate text-[11px] text-slate-400">
                Student
              </p>
            </div>

            {/* LOGOUT */}

            <button
              type="button"
              onClick={() => void handleSignOut()}
              disabled={signingOut}
              aria-label="Sign out"
              title="Sign out"
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {signingOut ? (
                <span className="block h-[17px] w-[17px] animate-spin rounded-full border-2 border-slate-300 border-t-[#010066]" />
              ) : (
                <LogOut size={17} />
              )}
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

        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
          <div className="flex h-[82px] items-center px-5 sm:px-8">
            {/* MOBILE MENU */}

            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open dashboard menu"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition hover:bg-slate-200 lg:hidden"
            >
              <Menu size={21} />
            </button>

            {/* DESKTOP IDENTITY */}

            <div className="ml-3 hidden lg:block">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Student Portal
              </p>

              <p className="mt-1 text-sm font-bold text-slate-800">
                MSSN Al-Irshad Model School
              </p>
            </div>

            {/* RIGHT CONTROLS */}

            <div className="ml-auto flex items-center gap-2">
              {/* NOTIFICATIONS */}

              <button
                type="button"
                aria-label="Notifications"
                className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"
              >
                <Bell size={18} />

                <span
                  className="absolute right-2 top-2 h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: SCHOOL_GOLD,
                  }}
                />
              </button>

              {/* USER PROFILE */}

              <div className="ml-1 hidden items-center gap-3 rounded-xl bg-slate-100 px-3 py-2 sm:flex">
                {/* PROFILE PHOTO */}

                <div
                  className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full text-xs font-bold text-white"
                  style={{
                    backgroundColor: SCHOOL_BLUE,
                  }}
                >
                  {student?.profile_photo ? (
                    <img
                      src={student.profile_photo}
                      alt={studentName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    studentInitials
                  )}
                </div>

                {/* NAME */}

                <div className="hidden md:block">
                  <p className="max-w-[180px] truncate text-xs font-bold text-slate-800">
                    {studentName}
                  </p>

                  <p className="text-[10px] text-slate-400">
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