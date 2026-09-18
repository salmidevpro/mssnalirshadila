"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  RefreshCw,
  Search,
  Users,
  X,
  Clock3,
  UserRound,
  Layers3,
  Plus,
  Settings,
  type LucideIcon,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import {
  SCHOOL_BLUE,
  SCHOOL_BLUE_DARK,
  SCHOOL_GOLD,
} from "@/config/site";

type Session = {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
};

type Term = {
  id: string;
  name: string;
  session_id: string;
  start_date: string | null;
  end_date: string | null;
};

type Course = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  units: number;
  is_active: boolean;
  class_id: string | null;
};

type CourseResult = {
  course: Course;
  studentCount: number;
  resultCount: number;
  publishedCount: number;
  pendingCount: number;
};

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
  avatar_url: string | null;
};

const navigation: {
  label: string;
  href: string;
  icon: LucideIcon;
}[] = [
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
    icon: ClipboardCheck,
  },
  {
    label: "Results",
    href: "/staff-dashboard/results",
    icon: FileText,
  },
  {
    label: "Attendance",
    href: "/staff-dashboard/attendance",
    icon: CheckCircle2,
  },
  {
    label: "Students",
    href: "/staff-dashboard/students",
    icon: GraduationCap,
  },
  {
    label: "Academic Calendar",
    href: "/staff-dashboard/calendar",
    icon: CalendarDays,
  },
];

export default function StaffResultsPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const pathname = usePathname();

  const [session, setSession] = useState<Session | null>(null);
  const [term, setTerm] = useState<Term | null>(null);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [courses, setCourses] = useState<CourseResult[]>([]);

  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unauthenticated, setUnauthenticated] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | LOAD RESULTS
  |--------------------------------------------------------------------------
  */

  const loadResults = useCallback(async () => {
    setLoading(true);
    setError("");
    setUnauthenticated(false);

    try {
      // --------------------------------------------------
      // AUTH
      // --------------------------------------------------

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setUnauthenticated(true);
        setLoading(false);
        return;
      }

      // --------------------------------------------------
      // STAFF
      // --------------------------------------------------

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
        throw new Error("Unable to verify your staff account.");
      }

      if (!staffRecord) {
        throw new Error(
          "Your staff account could not be found or is currently inactive.",
        );
      }

      setStaff(staffRecord);

      // --------------------------------------------------
      // PROFILE
      // --------------------------------------------------

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

      if (!profileError && profileRecord) {
        setProfile(profileRecord);
      }

      // --------------------------------------------------
      // CURRENT SESSION
      // --------------------------------------------------

      const { data: currentSession, error: sessionError } = await supabase
        .from("academic_sessions")
        .select("id, name, start_date, end_date")
        .eq("is_current", true)
        .maybeSingle();

      if (sessionError) {
        throw new Error("Unable to load the current academic session.");
      }

      if (!currentSession) {
        throw new Error("No current academic session has been configured.");
      }

      setSession(currentSession);

      // --------------------------------------------------
      // CURRENT TERM
      // --------------------------------------------------

      const { data: currentTerm, error: termError } = await supabase
        .from("academic_terms")
        .select("id, name, session_id, start_date, end_date")
        .eq("session_id", currentSession.id)
        .eq("is_current", true)
        .maybeSingle();

      if (termError) {
        throw new Error("Unable to load the current academic term.");
      }

      if (!currentTerm) {
        throw new Error(
          "No current academic term has been configured for this session.",
        );
      }

      setTerm(currentTerm);

      // --------------------------------------------------
      // TEACHER'S ASSIGNED COURSES
      // --------------------------------------------------

      const { data: assignments, error: assignmentError } = await supabase
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
        throw new Error("Unable to load your assigned courses.");
      }

      if (!assignments || assignments.length === 0) {
        setCourses([]);
        setLoading(false);
        return;
      }

      const courseIds = [
        ...new Set(assignments.map((assignment) => assignment.course_id)),
      ];

      // --------------------------------------------------
      // COURSES
      // --------------------------------------------------

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
        .in("id", courseIds)
        .order("name", { ascending: true });

      if (coursesError) {
        throw new Error("Unable to load your courses.");
      }

      if (!courseRecords || courseRecords.length === 0) {
        setCourses([]);
        setLoading(false);
        return;
      }

      // --------------------------------------------------
      // LOAD RESULT STATISTICS FOR EACH COURSE
      // --------------------------------------------------

      const courseStatistics = await Promise.all(
        courseRecords.map(async (course) => {
          let studentCount = 0;

          // Students registered for this course
          const { count: registrationCount, error: registrationError } =
            await supabase
              .from("course_registrations")
              .select("id", { count: "exact", head: true })
              .eq("course_id", course.id)
              .eq("session_id", currentSession.id)
              .eq("term_id", currentTerm.id);

          if (registrationError) {
            console.warn(
              `Could not load student count for ${course.name}`,
              registrationError,
            );
          } else {
            studentCount = registrationCount ?? 0;
          }

          // Results entered for this course
          const { data: resultRecords, error: resultsError } = await supabase
            .from("results")
            .select("id, published")
            .eq("course_id", course.id)
            .eq("session_id", currentSession.id)
            .eq("term_id", currentTerm.id);

          if (resultsError) {
            console.warn(
              `Could not load results for ${course.name}`,
              resultsError,
            );
          }

          const resultCount = resultRecords?.length ?? 0;

          const publishedCount =
            resultRecords?.filter((result) => result.published === true)
              .length ?? 0;

          const pendingCount = Math.max(studentCount - resultCount, 0);

          return {
            course,
            studentCount,
            resultCount,
            publishedCount,
            pendingCount,
          };
        }),
      );

      setCourses(courseStatistics);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading results.",
      );
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadResults();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadResults]);

  // --------------------------------------------------
  // CLOSE MOBILE MENU ON ROUTE CHANGE
  // --------------------------------------------------

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setMobileMenuOpen(false);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [pathname]);

  // --------------------------------------------------
  // LOGOUT
  // --------------------------------------------------

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await supabase.auth.signOut();
      router.replace("/staff-login");
    } catch (error) {
      console.error(error);
      setLoggingOut(false);
    }
  };

  // --------------------------------------------------
  // STAFF DISPLAY
  // --------------------------------------------------

  const staffName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim()
    : "Staff Member";

  const staffInitials = profile
    ? `${profile.first_name?.charAt(0) ?? ""}${profile.last_name?.charAt(0) ?? ""}`.toUpperCase()
    : "ST";

  // --------------------------------------------------
  // FILTER
  // --------------------------------------------------

  const filteredCourses = useMemo(() => {
    const query = search.trim().toLowerCase();

    return courses.filter((item) => {
      const course = item.course;

      const matchesSearch =
        !query ||
        course.name.toLowerCase().includes(query) ||
        course.code.toLowerCase().includes(query);

      const matchesStatus = showInactive || course.is_active;

      return matchesSearch && matchesStatus;
    });
  }, [courses, search, showInactive]);

  // --------------------------------------------------
  // OVERALL STATS
  // --------------------------------------------------

  const stats = useMemo(() => {
    const totalStudents = courses.reduce(
      (sum, item) => sum + item.studentCount,
      0,
    );

    const totalResults = courses.reduce(
      (sum, item) => sum + item.resultCount,
      0,
    );

    const totalPublished = courses.reduce(
      (sum, item) => sum + item.publishedCount,
      0,
    );

    const totalPending = courses.reduce(
      (sum, item) => sum + item.pendingCount,
      0,
    );

    return {
      courses: courses.length,
      totalStudents,
      totalResults,
      totalPublished,
      totalPending,
    };
  }, [courses]);

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f9fc]">
        <StaffSidebar
          pathname={pathname}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          onLogout={handleLogout}
          loggingOut={loggingOut}
        />

        <div className="lg:pl-[270px]">
          <StaffTopbar
            staffName={staffName}
            initials={staffInitials}
            profile={profile}
            onMenuClick={() => setMobileMenuOpen(true)}
          />

          <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto max-w-7xl animate-pulse space-y-6">
              <div>
                <div className="h-4 w-24 rounded bg-slate-200" />
                <div className="mt-3 h-9 w-64 rounded-xl bg-slate-200" />
                <div className="mt-2 h-4 w-96 max-w-full rounded bg-slate-200" />
              </div>

              <div className="h-24 rounded-2xl bg-white shadow-sm" />

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="h-32 rounded-2xl bg-white shadow-sm"
                  />
                ))}
              </div>

              <div className="h-24 rounded-2xl bg-white shadow-sm" />

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-72 rounded-3xl bg-white shadow-sm"
                  />
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // UNAUTHENTICATED
  // --------------------------------------------------

  if (unauthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f9fc] px-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <AlertCircle size={26} />
          </div>

          <h1 className="text-xl font-bold text-slate-900">
            Staff sign-in required
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Please sign in to access your teaching results.
          </p>

          <Link
            href="/staff-login"
            className="mt-6 inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: SCHOOL_BLUE }}
          >
            Sign in here
          </Link>
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // ERROR
  // --------------------------------------------------

  if (error) {
    return (
      <div className="min-h-screen bg-[#f7f9fc]">
        <StaffSidebar
          pathname={pathname}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          onLogout={handleLogout}
          loggingOut={loggingOut}
        />

        <div className="lg:pl-[270px]">
          <StaffTopbar
            staffName={staffName}
            initials={staffInitials}
            profile={profile}
            onMenuClick={() => setMobileMenuOpen(true)}
          />

          <main className="px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-xl">
              <div className="rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                  <AlertCircle size={26} />
                </div>

                <h1 className="text-xl font-bold text-slate-900">
                  Unable to load results
                </h1>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {error}
                </p>

                <button
                  onClick={loadResults}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                  style={{ backgroundColor: SCHOOL_BLUE }}
                >
                  <RefreshCw size={16} />
                  Try Again
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // MAIN
  // --------------------------------------------------

  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      <StaffSidebar
        pathname={pathname}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onLogout={handleLogout}
        loggingOut={loggingOut}
      />

      <div className="lg:pl-[270px]">
        <StaffTopbar
          staffName={staffName}
          initials={staffInitials}
          profile={profile}
          onMenuClick={() => setMobileMenuOpen(true)}
        />

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-7xl">
            {/* ============================================
                HEADER
            ============================================ */}

            <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
                  <Link
                    href="/staff-dashboard"
                    className="transition hover:text-slate-900"
                  >
                    Dashboard
                  </Link>

                  <ChevronRight size={14} />

                  <span className="font-medium text-slate-900">
                    Results
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className="hidden h-11 w-11 items-center justify-center rounded-2xl text-white sm:flex"
                    style={{
                      background: `linear-gradient(135deg, ${SCHOOL_BLUE}, ${SCHOOL_BLUE_DARK})`,
                    }}
                  >
                    <FileText size={21} />
                  </div>

                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                      Results
                    </h1>

                    <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                      Enter, review and manage academic results for your
                      assigned courses.
                    </p>
                  </div>
                </div>
              </div>

              <Link
                href="/staff-dashboard/results/enter"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                style={{
                  backgroundColor: SCHOOL_BLUE,
                }}
              >
                <Plus size={18} />
                Enter Results
              </Link>
            </div>

            {/* ============================================
                SESSION / TERM
            ============================================ */}

            <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div
                className="h-1 w-full"
                style={{
                  background: `linear-gradient(90deg, ${SCHOOL_BLUE}, ${SCHOOL_GOLD})`,
                }}
              />

              <div className="p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: `${SCHOOL_BLUE}12`,
                        color: SCHOOL_BLUE,
                      }}
                    >
                      <CalendarDays size={21} />
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Academic Period
                      </p>

                      <p className="mt-1 font-semibold text-slate-900">
                        {session?.name}
                      </p>

                      <p className="mt-0.5 text-sm capitalize text-slate-500">
                        {term?.name} Term
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Current Period
                  </div>
                </div>
              </div>
            </div>

            {/* ============================================
                STATS
            ============================================ */}

            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Assigned Courses"
                value={stats.courses}
                icon={<Layers3 size={21} />}
                accent={SCHOOL_BLUE}
              />

              <StatCard
                label="Students"
                value={stats.totalStudents}
                icon={<Users size={21} />}
                accent="#0f766e"
              />

              <StatCard
                label="Results Entered"
                value={stats.totalResults}
                icon={<CheckCircle2 size={21} />}
                accent="#2563eb"
              />

              <StatCard
                label="Pending"
                value={stats.totalPending}
                icon={<Clock3 size={21} />}
                accent="#d97706"
              />
            </div>

            {/* ============================================
                TOOLBAR
            ============================================ */}

            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative w-full lg:max-w-md">
                  <Search
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />

                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search course or course code..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white"
                  />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <span className="text-xs font-medium text-slate-400">
                    {filteredCourses.length}{" "}
                    {filteredCourses.length === 1 ? "course" : "courses"}
                  </span>

                  <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={showInactive}
                      onChange={(event) =>
                        setShowInactive(event.target.checked)
                      }
                      className="h-4 w-4 rounded border-slate-300"
                    />

                    Show inactive courses
                  </label>
                </div>
              </div>
            </div>

            {/* ============================================
                COURSE LIST
            ============================================ */}

            {filteredCourses.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                <div
                  className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{
                    backgroundColor: `${SCHOOL_BLUE}10`,
                    color: SCHOOL_BLUE,
                  }}
                >
                  <BookOpen size={25} />
                </div>

                <h2 className="mt-5 text-lg font-semibold text-slate-900">
                  No courses found
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  {search
                    ? "No assigned courses match your search."
                    : "You currently have no courses assigned for this academic term."}
                </p>

                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="mt-5 text-sm font-semibold underline underline-offset-4"
                    style={{ color: SCHOOL_BLUE }}
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredCourses.map((item) => (
                  <ResultCourseCard
                    key={item.course.id}
                    item={item}
                    schoolBlue={SCHOOL_BLUE}
                    schoolBlueDark={SCHOOL_BLUE_DARK}
                    schoolGold={SCHOOL_GOLD}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ==================================================
   SIDEBAR
================================================== */

function StaffSidebar({
  pathname,
  mobileMenuOpen,
  setMobileMenuOpen,
  onLogout,
  loggingOut,
}: {
  pathname: string;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (value: boolean) => void;
  onLogout: () => void;
  loggingOut: boolean;
}) {
  return (
    <>
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}

        <div className="flex h-[76px] items-center justify-between border-b border-slate-100 px-5">
          <Link
            href="/staff-dashboard"
            className="flex items-center gap-3"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="relative h-11 w-11 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
              <Image
                src="/images/al-ishad-logo.jpeg"
                alt="Al-Irshad Model School"
                fill
                className="object-contain p-1"
                sizes="44px"
              />
            </div>

            <div>
              <p
                className="text-sm font-bold"
                style={{ color: SCHOOL_BLUE_DARK }}
              >
                Al-Irshad
              </p>

              <p className="text-[11px] font-medium text-slate-400">
                Staff Portal
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Workspace
          </p>

          <div className="space-y-1">
            {navigation.map((item) => {
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
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                  style={
                    active
                      ? {
                          background: `linear-gradient(135deg, ${SCHOOL_BLUE}, ${SCHOOL_BLUE_DARK})`,
                        }
                      : undefined
                  }
                >
                  <Icon
                    size={18}
                    className={
                      active
                        ? "text-white"
                        : "text-slate-400 group-hover:text-slate-600"
                    }
                  />

                  <span className="flex-1">{item.label}</span>

                  {active && <ChevronRight size={15} />}
                </Link>
              );
            })}
          </div>

          <div className="my-5 border-t border-slate-100" />

          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Account
          </p>

          <Link
            href="/staff-dashboard/profile"
            onClick={() => setMobileMenuOpen(false)}
            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              pathname.startsWith("/staff-dashboard/profile")
                ? "text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
            style={
              pathname.startsWith("/staff-dashboard/profile")
                ? {
                    background: `linear-gradient(135deg, ${SCHOOL_BLUE}, ${SCHOOL_BLUE_DARK})`,
                  }
                : undefined
            }
          >
            <UserRound size={18} />
            <span>Profile</span>
          </Link>

          <Link
            href="/staff-dashboard/settings"
            onClick={() => setMobileMenuOpen(false)}
            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              pathname.startsWith("/staff-dashboard/settings")
                ? "text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
            style={
              pathname.startsWith("/staff-dashboard/settings")
                ? {
                    background: `linear-gradient(135deg, ${SCHOOL_BLUE}, ${SCHOOL_BLUE_DARK})`,
                  }
                : undefined
            }
          >
            <Settings size={18} />
            <span>Settings</span>
          </Link>
        </nav>

        {/* Logout */}

        <div className="border-t border-slate-100 p-3">
          <button
            type="button"
            onClick={onLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogOut size={18} />

            <span>{loggingOut ? "Signing out..." : "Sign out"}</span>
          </button>
        </div>
      </aside>
    </>
  );
}

/* ==================================================
   TOPBAR
================================================== */

function StaffTopbar({
  staffName,
  initials,
  profile,
  onMenuClick,
}: {
  staffName: string;
  initials: string;
  profile: Profile | null;
  onMenuClick: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>

        <div className="hidden sm:block">
          <p className="text-xs font-medium text-slate-400">
            Staff Workspace
          </p>

          <p className="mt-0.5 text-sm font-semibold text-slate-900">
            Academic Management
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-slate-900">
            {staffName}
          </p>

          <p className="text-xs text-slate-400">
            Staff Member
          </p>
        </div>

        <div className="relative h-10 w-10 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={staffName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: SCHOOL_BLUE }}
            >
              {initials}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

/* ==================================================
   STAT CARD
================================================== */

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl"
          style={{
            backgroundColor: `${accent}12`,
            color: accent,
          }}
        >
          {icon}
        </div>

        <div
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: accent }}
        />
      </div>

      <div className="mt-5">
        <p className="text-sm text-slate-500">{label}</p>

        <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
          {value}
        </p>
      </div>
    </div>
  );
}

/* ==================================================
   COURSE CARD
================================================== */

function ResultCourseCard({
  item,
  schoolBlue,
  schoolBlueDark,
  schoolGold,
}: {
  item: CourseResult;
  schoolBlue: string;
  schoolBlueDark: string;
  schoolGold: string;
}) {
  const {
    course,
    studentCount,
    resultCount,
    publishedCount,
    pendingCount,
  } = item;

  const progress =
    studentCount > 0
      ? Math.min(Math.round((resultCount / studentCount) * 100), 100)
      : 0;

  const publishedProgress =
    resultCount > 0
      ? Math.min(Math.round((publishedCount / resultCount) * 100), 100)
      : 0;

  return (
    <div className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      {/* Accent */}

      <div
        className="h-1"
        style={{
          background: `linear-gradient(90deg, ${schoolBlue}, ${schoolGold})`,
        }}
      />

      {/* Content */}

      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white"
              style={{
                background: `linear-gradient(135deg, ${schoolBlue}, ${schoolBlueDark})`,
              }}
            >
              {course.code.slice(0, 2).toUpperCase()}
            </div>

            <div className="min-w-0">
              <p
                className="text-xs font-bold uppercase tracking-wide"
                style={{ color: schoolBlue }}
              >
                {course.code}
              </p>

              <h2 className="mt-1 truncate text-base font-bold text-slate-950">
                {course.name}
              </h2>
            </div>
          </div>

          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
              course.is_active
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {course.is_active ? "Active" : "Inactive"}
          </span>
        </div>

        {course.description && (
          <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-500">
            {course.description}
          </p>
        )}

        {/* Completion */}

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-slate-500">
              Results completion
            </span>

            <span
              className="font-bold"
              style={{ color: schoolBlueDark }}
            >
              {progress}%
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${schoolBlue}, ${schoolBlueDark})`,
              }}
            />
          </div>
        </div>

        {/* Stats */}

        <div className="mt-6 grid grid-cols-3 divide-x divide-slate-100 rounded-2xl border border-slate-100 bg-slate-50">
          <MiniStat label="Students" value={studentCount} />

          <MiniStat label="Entered" value={resultCount} />

          <MiniStat label="Pending" value={pendingCount} />
        </div>

        {/* Published */}

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-slate-500">
              Published results
            </span>

            <span className="font-semibold text-slate-900">
              {publishedCount} / {resultCount}
            </span>
          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full"
              style={{
                width: `${publishedProgress}%`,
                backgroundColor: schoolGold,
              }}
            />
          </div>
        </div>
      </div>

      {/* Actions */}

      <div className="grid grid-cols-2 border-t border-slate-100">
        <Link
          href={`/staff-dashboard/courses/${course.id}/results`}
          className="flex items-center justify-center gap-2 px-4 py-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          View Results

          <ArrowRight size={16} />
        </Link>

        <Link
          href={`/staff-dashboard/courses/${course.id}/results`}
          className="flex items-center justify-center gap-2 border-l border-slate-100 px-4 py-4 text-sm font-semibold text-white transition hover:opacity-90"
          style={{
            background: `linear-gradient(135deg, ${schoolBlue}, ${schoolBlueDark})`,
          }}
        >
          Enter Results

          <Plus size={16} />
        </Link>
      </div>
    </div>
  );
}

/* ==================================================
   MINI STAT
================================================== */

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="px-3 py-3 text-center">
      <p className="text-base font-bold text-slate-900">{value}</p>

      <p className="mt-0.5 text-[11px] text-slate-400">
        {label}
      </p>
    </div>
  );
}