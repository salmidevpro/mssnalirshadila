"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Users,
  X,
  Bell,
  ChevronRight,
  Loader2,
  AlertCircle,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  SCHOOL_BLUE,
  SCHOOL_BLUE_DARK,
  SCHOOL_GOLD,
} from "@/config/site";

import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type Staff = {
  id: string;
  user_id: string;
  staff_id: string;
  department: string | null;
  position: string | null;
  status: string;
};

type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
};

type Session = {
  id: string;
  name: string;
  is_current: boolean;
};

type Term = {
  id: string;
  name: string;
  session_id: string;
  is_current: boolean;
};

type Course = {
  id: string;
  code: string;
  name: string;
  class_id: string | null;
};

type ClassItem = {
  id: string;
  name: string;
};

type DashboardData = {
  staff: Staff;
  profile: Profile | null;
  session: Session | null;
  term: Term | null;
  courses: Course[];
  classes: ClassItem[];
  studentCount: number;
  assignmentCount: number;
  pendingSubmissions: number;
};

const navigation = [
  {
    label: "Dashboard",
    href: "/staff-dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "My Classes",
    href: "/staff-dashboard/classes",
    icon: Users,
  },
  {
    label: "My Courses",
    href: "/staff-dashboard/courses",
    icon: BookOpen,
  },
  {
    label: "Assignments",
    href: "/staff-dashboard/assignments",
    icon: FileText,
  },
  {
    label: "Results",
    href: "/staff-dashboard/results",
    icon: GraduationCap,
  },
  {
    label: "Attendance",
    href: "/staff-dashboard/attendance",
    icon: ClipboardCheck,
  },
  {
    label: "Students",
    href: "/staff-dashboard/students",
    icon: Users,
  },
  {
    label: "Academic Calendar",
    href: "/staff-dashboard/calendar",
    icon: CalendarDays,
  },
];

const secondaryNavigation = [
  {
    label: "Profile",
    href: "/staff-dashboard/profile",
    icon: UserRound,
  },
  {
    label: "Settings",
    href: "/staff-dashboard/settings",
    icon: UserRound,
  },
];

export default function StaffDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      /*
       * =====================================================
       * 1. AUTHENTICATED USER
       * =====================================================
       */

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push("/staff-dashboard");
        return;
      }

      /*
       * =====================================================
       * 2. STAFF RECORD
       * =====================================================
       */

      const { data: staff, error: staffError } = await supabase
        .from("staff")
        .select(
          `
          id,
          user_id,
          staff_id,
          department,
          position,
          status
        `,
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (staffError) {
        console.error("Staff dashboard staff query:", staffError);
        throw new Error("We could not load your staff account.");
      }

      if (!staff) {
        await supabase.auth.signOut();

        router.push("/staff-login");
        return;
      }

      if (staff.status !== "active") {
        await supabase.auth.signOut();

        router.push("/staff-login");
        return;
      }

      /*
       * =====================================================
       * 3. STAFF PROFILE
       * =====================================================
       */

      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select(
            `
            id,
            first_name,
            last_name,
            middle_name,
            email,
            phone,
            avatar_url
          `,
          )
          .eq("id", staff.user_id)
          .maybeSingle();

      if (profileError) {
      console.error("PROFILE QUERY ERROR:", profileError);
    }

      /*
       * =====================================================
       * 4. CURRENT SESSION
       * =====================================================
       */

      const { data: session, error: sessionError } =
        await supabase
          .from("academic_sessions")
          .select("id, name, is_current")
          .eq("is_current", true)
          .maybeSingle();

      if (sessionError) {
        console.warn(
          "Current session query:",
          sessionError,
        );
      }

      /*
       * =====================================================
       * 5. CURRENT TERM
       * =====================================================
       */

      let term: Term | null = null;

      if (session) {
        const { data: currentTerm, error: termError } =
          await supabase
            .from("academic_terms")
            .select(
              "id, name, session_id, is_current",
            )
            .eq("session_id", session.id)
            .eq("is_current", true)
            .maybeSingle();

        if (termError) {
          console.warn(
            "Current term query:",
            termError,
          );
        }

        term = currentTerm;
      }

      /*
       * =====================================================
       * 6. ASSIGNED COURSES
       * =====================================================
       */

      let courses: Course[] = [];

      if (session && term) {
        const { data: courseTeachers, error: courseError } =
          await supabase
            .from("course_teachers")
            .select(
              `
              course_id,
              courses (
                id,
                code,
                name,
                class_id
              )
            `,
            )
            .eq("teacher_id", staff.id)
            .eq("session_id", session.id)
            .eq("term_id", term.id);

        if (courseError) {
          console.warn(
            "Assigned courses query:",
            courseError,
          );
        } else {
          courses =
            (courseTeachers ?? [])
              .flatMap((item: { courses: Course[] }) => item.courses);
        }
      }

      /*
       * =====================================================
       * 7. UNIQUE CLASSES
       * =====================================================
       */

      const classIds = [
        ...new Set(
          courses
            .map((course) => course.class_id)
            .filter(Boolean),
        ),
      ] as string[];

      let classes: ClassItem[] = [];

      if (classIds.length > 0) {
        const { data: classRows, error: classError } =
          await supabase
            .from("classes")
            .select("id, name")
            .in("id", classIds);

        if (classError) {
          console.warn(
            "Classes query:",
            classError,
          );
        } else {
          classes = classRows ?? [];
        }
      }

      /*
       * =====================================================
       * 8. STUDENT COUNT
       * =====================================================
       */

      let studentCount = 0;

      if (session && classIds.length > 0) {
        const { count, error: studentError } =
          await supabase
            .from("student_enrollments")
            .select("id", {
              count: "exact",
              head: true,
            })
            .eq("session_id", session.id)
            .eq("status", "active")
            .in("class_id", classIds);

        if (studentError) {
          console.warn(
            "Student count query:",
            studentError,
          );
        } else {
          studentCount = count ?? 0;
        }
      }

      /*
       * =====================================================
       * 9. ASSIGNMENT COUNT
       * =====================================================
       */

      let assignmentCount = 0;

      if (session && term) {
        const { count, error: assignmentError } =
          await supabase
            .from("assignments")
            .select("id", {
              count: "exact",
              head: true,
            })
            .eq("teacher_id", staff.id)
            .eq("session_id", session.id)
            .eq("term_id", term.id);

        if (assignmentError) {
          console.warn(
            "Assignment count query:",
            assignmentError,
          );
        } else {
          assignmentCount = count ?? 0;
        }
      }

      /*
       * =====================================================
       * 10. PENDING SUBMISSIONS
       * =====================================================
       */

      let pendingSubmissions = 0;

      if (session && term) {
        const { data: assignments } = await supabase
          .from("assignments")
          .select("id")
          .eq("teacher_id", staff.id)
          .eq("session_id", session.id)
          .eq("term_id", term.id);

        const assignmentIds =
          assignments?.map((item) => item.id) ?? [];

        if (assignmentIds.length > 0) {
          const { count, error: submissionError } =
            await supabase
              .from("submissions")
              .select("id", {
                count: "exact",
                head: true,
              })
              .in("assignment_id", assignmentIds)
              .is("graded_by", null);

          if (submissionError) {
            console.warn(
              "Submission count query:",
              submissionError,
            );
          } else {
            pendingSubmissions = count ?? 0;
          }
        }
      }

      /*
       * =====================================================
       * FINAL DASHBOARD DATA
       * =====================================================
       */

      setData({
        staff,
        profile,
        session,
        term,
        courses,
        classes,
        studentCount,
        assignmentCount,
        pendingSubmissions,
      });
    } catch (dashboardError) {
      console.error(
        "Staff dashboard error:",
        dashboardError,
      );

      setError(
        "We were unable to load your staff dashboard. Please check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadDashboard();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadDashboard]);

  /*
   * =======================================================
   * LOGOUT
   * =======================================================
   */

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await supabase.auth.signOut();
    } finally {
      router.push("/staff-login");
    }
  };

/*
 * =======================================================
 * STAFF DISPLAY NAME
 * =======================================================
 */

const staffName = useMemo(() => {
  if (!data) return "Staff Member";

  const firstName = data.profile?.first_name?.trim() ?? "";
  const lastName = data.profile?.last_name?.trim() ?? "";
  const middleName = data.profile?.middle_name?.trim() ?? "";

  const fullName = [firstName, middleName, lastName]
    .filter(Boolean)
    .join(" ");

  if (fullName) {
    return fullName;
  }

  return data.staff.staff_id || "Staff Member";
}, [data]);

/*
 * =======================================================
 * STAFF FIRST NAME
 * =======================================================
 */

const staffFirstName = useMemo(() => {
  if (!data) return "Staff Member";

  const firstName = data.profile?.first_name?.trim();

  if (firstName) {
    return firstName;
  }

  const lastName = data.profile?.last_name?.trim();

  if (lastName) {
    return lastName;
  }

  return data.staff.staff_id || "Staff Member";
}, [data]);
  

 /*
 * =======================================================
 * STAFF INITIALS
 * =======================================================
 */

const initials = useMemo(() => {
  if (!data) return "ST";

  const firstName = data.profile?.first_name?.trim() ?? "";
  const lastName = data.profile?.last_name?.trim() ?? "";

  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }

  if (firstName) {
    return firstName.slice(0, 2).toUpperCase();
  }

  if (lastName) {
    return lastName.slice(0, 2).toUpperCase();
  }

  return data.staff.staff_id.slice(0, 2).toUpperCase();
}, [data]);

  /*
   * =======================================================
   * LOADING
   * =======================================================
   */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{
              backgroundColor: `${SCHOOL_BLUE}08`,
              color: SCHOOL_BLUE,
            }}
          >
            <Loader2
              size={23}
              className="animate-spin"
            />
          </div>

          <p className="mt-4 text-sm font-semibold text-slate-500">
            Loading staff dashboard...
          </p>
        </div>
      </main>
    );
  }

  /*
   * =======================================================
   * ERROR
   * =======================================================
   */

  if (error || !data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
        <div className="w-full max-w-md rounded-[2rem] border border-red-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <AlertCircle size={25} />
          </div>

          <p className="mt-5 text-[10px] font-black uppercase tracking-[0.2em] text-red-400">
            Staff Portal Error
          </p>

          <h1
            className="mt-2 text-xl font-black"
            style={{
              color: SCHOOL_BLUE_DARK,
            }}
          >
            Unable to load dashboard
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            {error ||
              "Your staff dashboard could not be loaded."}
          </p>

          <Link
            href="/staff-login"
            className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-bold text-white"
            style={{
              backgroundColor: SCHOOL_BLUE,
            }}
          >
            Return to sign in
            <ArrowRight size={14} />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* =====================================================
          MOBILE OVERLAY
      ====================================================== */}

      {isMobileMenuOpen && (
        <button
          aria-label="Close navigation"
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* =====================================================
          SIDEBAR
      ====================================================== */}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:translate-x-0 ${
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        {/* Logo */}

        <div className="flex h-[82px] items-center border-b border-slate-100 px-6">
          <Link
            href="/staff-dashboard"
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
              <img
                src="/images/al-ishad-logo.jpeg"
                alt="MSSN Al-Irshad"
                className="h-8 w-8 rounded-lg object-contain"
              />
            </div>

            <div>
              <p
                className="text-[9px] font-black uppercase tracking-[0.16em]"
                style={{
                  color: SCHOOL_BLUE,
                }}
              >
                MSSN Al-Irshad
              </p>

              <p
                className="text-sm font-black"
                style={{
                  color: SCHOOL_BLUE_DARK,
                }}
              >
                Staff Portal
              </p>
            </div>
          </Link>

          <button
            onClick={() =>
              setIsMobileMenuOpen(false)
            }
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-3 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
            Workspace
          </p>

          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;

              const active =
                item.href === "/staff-dashboard";

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() =>
                    setIsMobileMenuOpen(false)
                  }
                  className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all ${
                    active
                      ? "text-white shadow-sm"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                  style={
                    active
                      ? {
                          backgroundColor:
                            SCHOOL_BLUE,
                        }
                      : undefined
                  }
                >
                  <Icon
                    size={18}
                    className={
                      active
                        ? "text-white"
                        : "text-slate-400 group-hover:text-slate-700"
                    }
                  />

                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <p className="mb-3 mt-8 px-3 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
            Account
          </p>

          <nav className="space-y-1">
            {secondaryNavigation.map(
              (item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() =>
                      setIsMobileMenuOpen(false)
                    }
                    className="group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-800"
                  >
                    <Icon
                      size={18}
                      className="text-slate-400 group-hover:text-slate-700"
                    />

                    <span>{item.label}</span>
                  </Link>
                );
              },
            )}
          </nav>
        </div>

        {/* Staff mini profile */}

        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
            {data.profile?.avatar_url ? (
              <img
                src={data.profile.avatar_url}
                alt={staffName}
                className="h-10 w-10 rounded-xl object-cover"
              />
            ) : (
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black text-white"
                style={{
                  backgroundColor: SCHOOL_BLUE,
                }}
              >
                {initials}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-slate-800">
                {staffName}
              </p>

              <p className="truncate text-[10px] text-slate-400">
                {data.staff.position ||
                  "Staff Member"}
              </p>
            </div>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              title="Sign out"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white hover:text-red-500 disabled:opacity-50"
            >
              {isLoggingOut ? (
                <Loader2
                  size={15}
                  className="animate-spin"
                />
              ) : (
                <LogOut size={15} />
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <div className="lg:pl-[270px]">
        {/* ===================================================
            TOPBAR
        ==================================================== */}

        <header className="sticky top-0 z-30 flex h-[82px] items-center justify-between border-b border-slate-200 bg-white/90 px-5 backdrop-blur-xl sm:px-8 lg:px-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                setIsMobileMenuOpen(true)
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 lg:hidden"
            >
              <Menu size={19} />
            </button>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Staff Workspace
              </p>

              <h1
                className="mt-0.5 text-lg font-black tracking-tight sm:text-xl"
                style={{
                  color: SCHOOL_BLUE_DARK,
                }}
              >
                Dashboard
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification */}

            <button
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
              aria-label="Notifications"
            >
              <Bell size={18} />

              <span
                className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full"
                style={{
                  backgroundColor:
                    SCHOOL_GOLD,
                }}
              />
            </button>

            {/* Profile */}

            <div className="hidden items-center gap-3 border-l border-slate-200 pl-4 sm:flex">
              {data.profile?.avatar_url ? (
                <img
                  src={data.profile.avatar_url}
                  alt={staffName}
                  className="h-10 w-10 rounded-xl object-cover"
                />
              ) : (
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-xs font-black text-white"
                  style={{
                    backgroundColor:
                      SCHOOL_BLUE,
                  }}
                >
                  {initials}
                </div>
              )}

              <div>
                <p className="max-w-[150px] truncate text-xs font-bold text-slate-800">
                  {staffName}
                </p>

                <p className="text-[10px] text-slate-400">
                  {data.staff.staff_id}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* ===================================================
            PAGE
        ==================================================== */}

        <div className="px-5 py-7 sm:px-8 lg:px-10 lg:py-9">
          {/* Welcome */}

          <section className="relative overflow-hidden rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
            <div className="relative z-10 max-w-2xl">
              <p
                className="text-[10px] font-black uppercase tracking-[0.2em]"
                style={{
                  color: SCHOOL_GOLD,
                }}
              >
                Welcome back
              </p>

              <h2
                className="mt-2 text-2xl font-black tracking-tight sm:text-3xl"
                style={{
                  color: SCHOOL_BLUE_DARK,
                }}
              >
                 As-salamualaikum, {staffFirstName} 👋
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
                Manage your classes, courses,
                assignments, student records and
                academic activities from one place.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span
                  className="rounded-full px-3 py-1.5 text-[10px] font-bold"
                  style={{
                    backgroundColor: `${SCHOOL_BLUE}08`,
                    color: SCHOOL_BLUE,
                  }}
                >
                  {data.staff.staff_id}
                </span>

                {data.staff.department && (
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-bold text-slate-600">
                    {data.staff.department}
                  </span>
                )}

                {data.staff.position && (
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-bold text-slate-600">
                    {data.staff.position}
                  </span>
                )}
              </div>
            </div>

            {/* Decorative element */}

            <div
              aria-hidden="true"
              className="absolute -right-16 -top-16 h-52 w-52 rounded-full opacity-60 blur-3xl"
              style={{
                backgroundColor: `${SCHOOL_BLUE}10`,
              }}
            />

            <div
              aria-hidden="true"
              className="absolute -bottom-20 right-20 h-40 w-40 rounded-full opacity-40 blur-3xl"
              style={{
                backgroundColor: `${SCHOOL_GOLD}15`,
              }}
            />
          </section>

          {/* =================================================
              SESSION / TERM
          ================================================== */}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <div className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: `${SCHOOL_BLUE}08`,
                  color: SCHOOL_BLUE,
                }}
              >
                <CalendarDays size={17} />
              </div>

              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Academic Session
                </p>

                <p className="mt-0.5 text-xs font-bold text-slate-700">
                  {data.session?.name ||
                    "No current session"}
                </p>
              </div>
            </div>

            <div className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: `${SCHOOL_GOLD}12`,
                  color: SCHOOL_GOLD,
                }}
              >
                <ClipboardCheck size={17} />
              </div>

              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Current Term
                </p>

                <p className="mt-0.5 text-xs font-bold text-slate-700">
                  {data.term?.name ||
                    "No current term"}
                </p>
              </div>
            </div>
          </div>

          {/* =================================================
              STAT CARDS
          ================================================== */}

          <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={BookOpen}
              label="Assigned Courses"
              value={data.courses.length}
              href="/staff-dashboard/courses"
              iconBackground={`${SCHOOL_BLUE}08`}
              iconColor={SCHOOL_BLUE}
            />

            <StatCard
              icon={Users}
              label="My Students"
              value={data.studentCount}
              href="/staff-dashboard/students"
              iconBackground={`${SCHOOL_GOLD}12`}
              iconColor={SCHOOL_GOLD}
            />

            <StatCard
              icon={FileText}
              label="Assignments"
              value={data.assignmentCount}
              href="/staff-dashboard/assignments"
              iconBackground="#f0fdf4"
              iconColor="#16a34a"
            />

            <StatCard
              icon={ClipboardCheck}
              label="Pending Submissions"
              value={data.pendingSubmissions}
              href="/staff-dashboard/assignments"
              iconBackground="#fff7ed"
              iconColor="#ea580c"
            />
          </section>

          {/* =================================================
              LOWER CONTENT
          ================================================== */}

          <div className="mt-7 grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
            {/* Assigned Courses */}

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Teaching
                  </p>

                  <h3
                    className="mt-1 text-lg font-black"
                    style={{
                      color: SCHOOL_BLUE_DARK,
                    }}
                  >
                    My Courses
                  </h3>
                </div>

                <Link
                  href="/staff-dashboard/courses"
                  className="flex items-center gap-1 text-[10px] font-bold"
                  style={{
                    color: SCHOOL_BLUE,
                  }}
                >
                  View all
                  <ChevronRight size={14} />
                </Link>
              </div>

              {data.courses.length > 0 ? (
                <div className="mt-5 space-y-3">
                  {data.courses
                    .slice(0, 5)
                    .map((course) => {
                        const className =
                        data.classes.find(
                          (item) =>
                            item.id ===
                            course.class_id,
                        )?.name;

                      return (
                        <Link
                          key={course.id}
                          href={`/staff-dashboard/courses/${course.id}`}
                          className="group flex items-center gap-4 rounded-2xl border border-slate-100 p-4 transition-all hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-sm"
                        >
                          <div
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xs font-black"
                            style={{
                              backgroundColor: `${SCHOOL_BLUE}08`,
                              color: SCHOOL_BLUE,
                            }}
                          >
                            {course.code
                              ?.slice(0, 3)
                              .toUpperCase()}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-slate-800">
                              {course.name}
                            </p>

                            <p className="mt-1 text-[10px] font-medium text-slate-400">
                              {course.code}
                              {className
                                ? ` • ${className}`
                                : ""}
                            </p>
                          </div>

                          <ArrowRight
                            size={16}
                            className="text-slate-300 transition-transform group-hover:translate-x-1"
                          />
                        </Link>
                      );
                    })}
                </div>
              ) : (
                <EmptyState
                  icon={BookOpen}
                  title="No courses assigned"
                  message="Your assigned courses will appear here."
                />
              )}
            </section>

            {/* My Classes */}

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Teaching Groups
                  </p>

                  <h3
                    className="mt-1 text-lg font-black"
                    style={{
                      color: SCHOOL_BLUE_DARK,
                    }}
                  >
                    My Classes
                  </h3>
                </div>

                <Link
                  href="/staff-dashboard/classes"
                  className="flex items-center gap-1 text-[10px] font-bold"
                  style={{
                    color: SCHOOL_BLUE,
                  }}
                >
                  View all
                  <ChevronRight size={14} />
                </Link>
              </div>

              {data.classes.length > 0 ? (
                <div className="mt-5 space-y-3">
                  {data.classes.map((classItem) => (
                    <Link
                      key={classItem.id}
                      href={`/staff-dashboard/classes/${classItem.id}`}
                      className="group flex items-center gap-4 rounded-2xl border border-slate-100 p-4 transition-all hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-sm"
                    >
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                        style={{
                          backgroundColor: `${SCHOOL_GOLD}12`,
                          color: SCHOOL_GOLD,
                        }}
                      >
                        <Users size={18} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-800">
                          {classItem.name}
                        </p>

                        <p className="mt-1 text-[10px] text-slate-400">
                          Assigned class
                        </p>
                      </div>

                      <ArrowRight
                        size={16}
                        className="text-slate-300 transition-transform group-hover:translate-x-1"
                      />
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Users}
                  title="No classes yet"
                  message="Classes connected to your courses will appear here."
                />
              )}
            </section>
          </div>

          {/* =================================================
              QUICK ACTIONS
          ================================================== */}

          <section className="mt-7">
            <div className="mb-4">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                Quick Access
              </p>

              <h3
                className="mt-1 text-lg font-black"
                style={{
                  color: SCHOOL_BLUE_DARK,
                }}
              >
                Common Tasks
              </h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <QuickAction
                href="/staff-dashboard/assignments"
                icon={FileText}
                title="Assignments"
                description="Create and manage assignments."
              />

              <QuickAction
                href="/staff-dashboard/results"
                icon={GraduationCap}
                title="Enter Results"
                description="Manage student academic results."
              />

              <QuickAction
                href="/staff-dashboard/attendance"
                icon={ClipboardCheck}
                title="Attendance"
                description="Record and review attendance."
              />

              <QuickAction
                href="/staff-dashboard/students"
                icon={Users}
                title="Students"
                description="View students in your classes."
              />
            </div>
          </section>

          {/* Footer */}

          <footer className="pb-4 pt-10 text-center">
            <p className="text-[10px] font-medium text-slate-400">
              © {new Date().getFullYear()} MSSN
              Al-Irshad Model School
            </p>
          </footer>
        </div>
      </div>
    </main>
  );
}

/*
 * ==========================================================
 * STAT CARD
 * ==========================================================
 */

function StatCard({
  icon: Icon,
  label,
  value,
  href,
  iconBackground,
  iconColor,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  href: string;
  iconBackground: string;
  iconColor: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl"
          style={{
            backgroundColor: iconBackground,
            color: iconColor,
          }}
        >
          <Icon size={19} />
        </div>

        <ArrowRight
          size={15}
          className="text-slate-300 transition-transform group-hover:translate-x-1"
        />
      </div>

      <p className="mt-5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p
        className="mt-1 text-2xl font-black"
        style={{
          color: SCHOOL_BLUE_DARK,
        }}
      >
        {value}
      </p>
    </Link>
  );
}

/*
 * ==========================================================
 * QUICK ACTION
 * ==========================================================
 */

function QuickAction({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
    >
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl"
        style={{
          backgroundColor: `${SCHOOL_BLUE}08`,
          color: SCHOOL_BLUE,
        }}
      >
        <Icon size={18} />
      </div>

      <h4
        className="mt-4 text-sm font-black"
        style={{
          color: SCHOOL_BLUE_DARK,
        }}
      >
        {title}
      </h4>

      <p className="mt-1 text-xs leading-5 text-slate-400">
        {description}
      </p>

      <div
        className="mt-4 flex items-center gap-1 text-[10px] font-bold"
        style={{
          color: SCHOOL_BLUE,
        }}
      >
        Open
        <ArrowRight
          size={13}
          className="transition-transform group-hover:translate-x-1"
        />
      </div>
    </Link>
  );
}

/*
 * ==========================================================
 * EMPTY STATE
 * ==========================================================
 */

function EmptyState({
  icon: Icon,
  title,
  message,
}: {
  icon: LucideIcon;
  title: string;
  message: string;
}) {
  return (
    <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-5 py-8 text-center">
      <div
        className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl"
        style={{
          backgroundColor: `${SCHOOL_BLUE}08`,
          color: SCHOOL_BLUE,
        }}
      >
        <Icon size={17} />
      </div>

      <p className="mt-3 text-xs font-bold text-slate-700">
        {title}
      </p>

      <p className="mx-auto mt-1 max-w-xs text-[10px] leading-5 text-slate-400">
        {message}
      </p>
    </div>
  );
}