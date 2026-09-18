"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  RefreshCw,
  UserRound,
  Users,
  X,
  Settings,
  type LucideIcon,
} from "lucide-react";

import {
  SCHOOL_BLUE,
  SCHOOL_BLUE_DARK,
  SCHOOL_GOLD,
} from "@/config/site";

/* =========================================================
   TYPES
   ========================================================= */

type Staff = {
  id: string;
  user_id: string;
  staff_id: string | null;
  department: string | null;
  position: string | null;
  status: string | null;
};

type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  middle_name: string | null;
  email: string | null;
  avatar_url: string | null;
};

type AcademicSession = {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
};

type AcademicTerm = {
  id: string;
  name: string;
  session_id: string;
  start_date: string | null;
  end_date: string | null;
};

type CourseTeacher = {
  id: string;
  course_id: string;
  teacher_id: string;
  session_id: string;
  term_id: string;
};

type Course = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  units: number | null;
  is_active: boolean;
  class_id: string | null;
};

type ClassRecord = {
  id: string;
  name: string;
  description: string | null;
  education_level_id: string | null;
};

type ClassWithCourses = ClassRecord & {
  courses: Course[];
};

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/staff-dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "My Classes",
    href: "/staff-dashboard/classes",
    icon: GraduationCap,
  },
  {
    label: "My Courses",
    href: "/staff-dashboard/courses",
    icon: BookOpen,
  },
  {
    label: "Assignments",
    href: "/staff-dashboard/assignments",
    icon: ClipboardCheck,
  },
  {
    label: "Results",
    href: "/staff-dashboard/results",
    icon: CheckCircle2,
  },
  {
    label: "Attendance",
    href: "/staff-dashboard/attendance",
    icon: CalendarDays,
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
  {
    label: "Profile",
    href: "/staff-dashboard/profile",
    icon: UserRound,
  },
   {
      label: "Settings",
      href: "/staff-dashboard/settings",
      icon: Settings,
    },
];

/* =========================================================
   PAGE
   ========================================================= */

export default function StaffClassesPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const pathname = usePathname();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [staff, setStaff] = useState<Staff | null>(null);

  const [session, setSession] = useState<AcademicSession | null>(null);
  const [term, setTerm] = useState<AcademicTerm | null>(null);

  const [classes, setClasses] = useState<ClassWithCourses[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [error, setError] = useState("");
  const [unauthenticated, setUnauthenticated] = useState(false);

  /* =======================================================
     LOAD CLASSES
     ======================================================= */

  const loadClasses = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");
      setUnauthenticated(false);

      try {
        /*
         * AUTH
         */
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          setUnauthenticated(true);
          return;
        }

        /*
         * VERIFY ACTIVE STAFF
         */
        const { data: staffRecord, error: staffError } = await supabase
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
          .eq("status", "active")
          .maybeSingle();

        if (staffError) {
          console.error("Staff verification error:", staffError);

          throw new Error("Unable to verify your staff account.");
        }

        if (!staffRecord) {
          throw new Error(
            "Your staff account could not be found or is currently inactive.",
          );
        }

        setStaff(staffRecord);

        /*
         * STAFF PROFILE
         */
        const { data: profileRecord, error: profileError } = await supabase
          .from("profiles")
          .select(
            `
              id,
              first_name,
              last_name,
              middle_name,
              email,
              avatar_url
            `,
          )
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          console.warn("Profile loading error:", profileError);
        } else {
          setProfile(profileRecord);
        }

        /*
         * CURRENT ACADEMIC SESSION
         */
        const { data: currentSession, error: sessionError } = await supabase
          .from("academic_sessions")
          .select(
            `
              id,
              name,
              start_date,
              end_date
            `,
          )
          .eq("is_current", true)
          .maybeSingle();

        if (sessionError) {
          console.error("Academic session error:", sessionError);

          throw new Error(
            sessionError.message ||
              "Unable to load the current academic session.",
          );
        }

        if (!currentSession) {
          throw new Error("No current academic session has been configured.");
        }

        setSession(currentSession);

        /*
         * CURRENT ACADEMIC TERM
         */
        const { data: currentTerm, error: termError } = await supabase
          .from("academic_terms")
          .select(
            `
              id,
              name,
              session_id,
              start_date,
              end_date
            `,
          )
          .eq("session_id", currentSession.id)
          .eq("is_current", true)
          .maybeSingle();

        if (termError) {
          console.error("Academic term error:", termError);

          throw new Error(
            termError.message ||
              "Unable to load the current academic term.",
          );
        }

        if (!currentTerm) {
          throw new Error(
            "No current academic term has been configured for this session.",
          );
        }

        setTerm(currentTerm);

        /*
         * LOAD TEACHER ASSIGNMENTS
         *
         * This is the verified relationship:
         *
         * staff.id
         *   ↓
         * course_teachers.teacher_id
         */
        const { data: assignmentRecords, error: assignmentError } =
          await supabase
            .from("course_teachers")
            .select(
              `
                id,
                course_id,
                teacher_id,
                session_id,
                term_id
              `,
            )
            .eq("teacher_id", staffRecord.id)
            .eq("session_id", currentSession.id)
            .eq("term_id", currentTerm.id);

        if (assignmentError) {
          console.error("Course teacher query error:", assignmentError);

          throw new Error(
            assignmentError.message ||
              "Unable to load your class assignments.",
          );
        }

        /*
         * NO ASSIGNMENTS
         */
        if (!assignmentRecords || assignmentRecords.length === 0) {
          setClasses([]);
          return;
        }

        /*
         * GET UNIQUE COURSE IDS
         */
        const courseIds = Array.from(
          new Set(
            assignmentRecords
              .map((assignment) => assignment.course_id)
              .filter(Boolean),
          ),
        );

        /*
         * LOAD COURSES
         */
        const { data: courseRecords, error: coursesError } = await supabase
          .from("courses")
          .select(
            `
              id,
              code,
              name,
              description,
              units,
              is_active,
              class_id
            `,
          )
          .in("id", courseIds);

        if (coursesError) {
          console.error("Courses query error:", coursesError);

          throw new Error(
            coursesError.message || "Unable to load your courses.",
          );
        }

        const courses = (courseRecords ?? []) as Course[];

        /*
         * GET UNIQUE CLASS IDS
         */
        const classIds = Array.from(
          new Set(
            courses
              .map((course) => course.class_id)
              .filter((id): id is string => Boolean(id)),
          ),
        );

        if (classIds.length === 0) {
          setClasses([]);
          return;
        }

        /*
         * LOAD CLASSES
         *
         * Uses the verified relationship:
         *
         * courses.class_id -> classes.id
         */
        const { data: classRecords, error: classesError } = await supabase
          .from("classes")
          .select(
            `
              id,
              name,
              description,
              education_level_id
            `,
          )
          .in("id", classIds)
          .order("name", { ascending: true });

        if (classesError) {
          console.error("Classes query error:", classesError);

          throw new Error(
            classesError.message || "Unable to load your classes.",
          );
        }

        const loadedClasses = (classRecords ?? []) as ClassRecord[];

        /*
         * COMBINE CLASSES + COURSES
         */
        const formattedClasses: ClassWithCourses[] = loadedClasses.map(
          (classRecord) => ({
            ...classRecord,
            courses: courses.filter(
              (course) => course.class_id === classRecord.id,
            ),
          }),
        );

        setClasses(formattedClasses);
      } catch (err) {
        console.error("Error loading classes:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading your classes.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [supabase],
  );

  /* =======================================================
     INITIAL LOAD
     ======================================================= */

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadClasses();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadClasses]);

  /* =======================================================
     STAFF DISPLAY
     ======================================================= */

  const staffName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    "Staff Member";

  const initials =
    [profile?.first_name?.[0], profile?.last_name?.[0]]
      .filter(Boolean)
      .join("")
      .toUpperCase() || "ST";

  /* =======================================================
     LOGOUT
     ======================================================= */

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/staff-login");
  }

  /* =======================================================
     LOADING
     ======================================================= */

  if (loading) {
    return <LoadingScreen />;
  }

  /* =======================================================
     AUTH ERROR
     ======================================================= */

  if (unauthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-white"
            style={{ backgroundColor: SCHOOL_BLUE }}
          >
            <UserRound size={26} />
          </div>

          <h1 className="mt-5 text-xl font-bold text-slate-900">
            Authentication Required
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Please sign in to access the staff portal.
          </p>

          <Link
            href="/staff-login"
            className="mt-6 inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: SCHOOL_BLUE }}
          >
            Go to Staff Login
          </Link>
        </div>
      </main>
    );
  }

  /* =======================================================
     DATA ERROR
     ======================================================= */

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-xl rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <AlertCircle size={28} />
          </div>

          <h1 className="mt-5 text-xl font-bold text-slate-900">
            Unable to Load Classes
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">{error}</p>

          <button
            onClick={() => void loadClasses()}
            className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: SCHOOL_BLUE }}
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </main>
    );
  }

  /* =======================================================
     MAIN
     ======================================================= */

  return (
    <main className="min-h-screen bg-[#f7f9fc]">
      {mobileMenuOpen && (
        <button
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ===================================================
          SIDEBAR
          =================================================== */}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-67.5 flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-19 items-center justify-between border-b border-slate-100 px-5">
          <Link
            href="/staff-dashboard"
            className="flex items-center gap-3"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Image
              src="/images/al-ishad-logo.jpeg"
              alt="Al-Irshad Model School"
              width={44}
              height={44}
              className="h-11 w-11 rounded-xl object-cover"
            />

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900">
                Al-Irshad Model School
              </p>

              <p className="text-xs text-slate-500">Staff Portal</p>
            </div>
          </Link>

          <button
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          {navItems.map((item) => {
            const Icon = item.icon;

            const active =
              pathname === item.href ||
              (item.href !== "/staff-dashboard" &&
                pathname.startsWith(`${item.href}/`));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition ${
                  active
                    ? "text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
                style={active ? { backgroundColor: SCHOOL_BLUE } : undefined}
              >
                <Icon
                  size={18}
                  className={active ? "text-white" : "text-slate-400"}
                />

                <span className="flex-1">{item.label}</span>

                {active && <ChevronRight size={16} />}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ===================================================
          MAIN CONTENT
          =================================================== */}

      <div className="lg:pl-67.5">
        {/* TOPBAR */}
        <header className="sticky top-0 z-30 flex h-19 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <Menu size={22} />
            </button>

            <div>
              <p className="hidden text-xs font-medium text-slate-400 sm:block">
                Staff Portal
              </p>

              <h2 className="text-sm font-bold text-slate-900 sm:text-base">
                My Classes
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-900">
                {staffName}
              </p>

              <p className="text-xs text-slate-500">
                {staff?.position || "Staff"}
              </p>
            </div>

            {profile?.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={staffName}
                width={40}
                height={40}
                className="h-10 w-10 rounded-full border border-slate-200 object-cover"
              />
            ) : (
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: SCHOOL_BLUE }}
              >
                {initials}
              </div>
            )}
          </div>
        </header>

        {/* CONTENT */}
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {/* HEADER */}
          <section className="mb-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
                  <span style={{ color: SCHOOL_GOLD }}>Staff Portal</span>

                  <span className="text-slate-300">/</span>

                  <span className="text-slate-400">My Classes</span>
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  My Classes
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                  Classes assigned to you for the current academic term.
                </p>
              </div>

              <button
                onClick={() => void loadClasses(true)}
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {refreshing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <RefreshCw size={16} />
                )}

                Refresh
              </button>
            </div>
          </section>

          {/* CURRENT SESSION */}
          <section className="mb-7 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="p-5 sm:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: `${SCHOOL_BLUE}12`,
                      color: SCHOOL_BLUE,
                    }}
                  >
                    <CalendarDays size={22} />
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Current Academic Period
                    </p>

                    <p className="mt-1 text-base font-bold text-slate-900">
                      {session?.name || "Current Session"}
                    </p>

                    <p className="mt-0.5 text-sm text-slate-500">
                      {term?.name || "Current Term"}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 px-4 py-3 text-left sm:text-right">
                  <p className="text-xs font-medium text-slate-400">
                    Assigned Classes
                  </p>

                  <p
                    className="mt-0.5 text-2xl font-bold"
                    style={{ color: SCHOOL_BLUE_DARK }}
                  >
                    {classes.length}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* EMPTY STATE */}
          {classes.length === 0 ? (
            <section className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
              <div
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{
                  backgroundColor: `${SCHOOL_BLUE}10`,
                  color: SCHOOL_BLUE,
                }}
              >
                <GraduationCap size={30} />
              </div>

              <h2 className="mt-5 text-lg font-bold text-slate-900">
                No Classes Assigned
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                You currently do not have any courses assigned to you for the
                current academic term.
              </p>

              <button
                onClick={() => void loadClasses(true)}
                disabled={refreshing}
                className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: SCHOOL_BLUE }}
              >
                <RefreshCw
                  size={16}
                  className={refreshing ? "animate-spin" : ""}
                />
                Refresh Assignments
              </button>
            </section>
          ) : (
            <>
              {/* SUMMARY */}
              <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <SummaryCard
                  label="My Classes"
                  value={classes.length}
                  description="Classes you currently teach"
                  icon={GraduationCap}
                />

                <SummaryCard
                  label="My Courses"
                  value={classes.reduce(
                    (total, classItem) => total + classItem.courses.length,
                    0,
                  )}
                  description="Courses across your classes"
                  icon={BookOpen}
                />

                <SummaryCard
                  label="Academic Term"
                  value={term?.name || "—"}
                  description={session?.name || "Current session"}
                  icon={CalendarDays}
                />
              </section>

              {/* CLASS CARDS */}
              <section>
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-slate-900">
                    Assigned Classes
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Your teaching assignments for this term.
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {classes.map((classItem) => (
                    <ClassCard
                      key={classItem.id}
                      classItem={classItem}
                    />
                  ))}
                </div>
              </section>
            </>
          )}

          {/* NOTICE */}
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0"
              style={{ color: SCHOOL_BLUE }}
            />

            <p className="text-xs leading-5 text-slate-600">
              Classes shown here are based on your course teaching assignments
              for the current academic session and term.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   CLASS CARD
   ========================================================= */

function ClassCard({
  classItem,
}: {
  classItem: ClassWithCourses;
}) {
  return (
    <div className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div
        className="h-1.5"
        style={{ backgroundColor: SCHOOL_BLUE }}
      />

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
            style={{
              backgroundColor: `${SCHOOL_BLUE}12`,
              color: SCHOOL_BLUE,
            }}
          >
            <GraduationCap size={24} />
          </div>

          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
            Assigned
          </span>
        </div>

        <div className="mt-5">
          <h3 className="text-xl font-bold text-slate-900">
            {classItem.name}
          </h3>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            {classItem.description || "Class assigned for this academic term."}
          </p>
        </div>

        <div className="mt-5 rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-slate-400" />

              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Your Courses
              </span>
            </div>

            <span
              className="text-sm font-bold"
              style={{ color: SCHOOL_BLUE }}
            >
              {classItem.courses.length}
            </span>
          </div>

          {classItem.courses.length > 0 && (
            <div className="mt-3 space-y-2">
              {classItem.courses.slice(0, 4).map((course) => (
                <div
                  key={course.id}
                  className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-700">
                      {course.name}
                    </p>

                    <p className="mt-0.5 font-mono text-[10px] text-slate-400">
                      {course.code}
                    </p>
                  </div>

                  {course.units !== null && (
                    <span className="shrink-0 text-[10px] font-medium text-slate-400">
                      {course.units} unit{course.units === 1 ? "" : "s"}
                    </span>
                  )}
                </div>
              ))}

              {classItem.courses.length > 4 && (
                <p className="pt-1 text-center text-[11px] font-medium text-slate-400">
                  +{classItem.courses.length - 4} more course
                  {classItem.courses.length - 4 === 1 ? "" : "s"}
                </p>
              )}
            </div>
          )}
        </div>

        <Link
          href={`/staff-dashboard/classes/${classItem.id}`}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          View Class
          <ChevronRight size={16} />
        </Link>
      </div>
    </div>
  );
}

/* =========================================================
   SUMMARY CARD
   ========================================================= */

function SummaryCard({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>

          <p className="mt-2 truncate text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400">{description}</p>
        </div>

        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{
            backgroundColor: `${SCHOOL_BLUE}12`,
            color: SCHOOL_BLUE,
          }}
        >
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   LOADING
   ========================================================= */

function LoadingScreen() {
  return (
    <main className="min-h-screen bg-[#f7f9fc]">
      <div className="flex min-h-screen">
        <aside className="hidden w-[270px] border-r border-slate-200 bg-white lg:block">
          <div className="h-[76px] border-b border-slate-100 p-5">
            <div className="h-10 w-40 animate-pulse rounded-lg bg-slate-100" />
          </div>

          <div className="space-y-3 p-4">
            {Array.from({ length: 9 }).map((_, index) => (
              <div
                key={index}
                className="h-11 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        </aside>

        <div className="flex-1">
          <div className="h-[76px] border-b border-slate-200 bg-white" />

          <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
            <div className="space-y-3">
              <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />

              <div className="h-9 w-48 animate-pulse rounded bg-slate-200" />

              <div className="h-4 w-96 max-w-full animate-pulse rounded bg-slate-100" />
            </div>

            <div className="h-32 animate-pulse rounded-3xl bg-white shadow-sm" />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-32 animate-pulse rounded-2xl bg-white shadow-sm"
                />
              ))}
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-96 animate-pulse rounded-3xl bg-white shadow-sm"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}