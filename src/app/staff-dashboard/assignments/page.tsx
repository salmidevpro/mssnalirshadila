"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Edit3,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  LogOut,
  Lock,
  Menu,
  RefreshCw,
  Search,
  UserRound,
  Users,
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import {
  SCHOOL_BLUE,
  SCHOOL_BLUE_DARK,
  SCHOOL_GOLD,
} from "@/config/site";

type Assignment = {
  id: string;
  course_id: string;
  teacher_id: string | null;
  session_id: string;
  term_id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  due_date: string | null;
  max_score: number;
  status: "draft" | "published" | "closed";
  submission_type: string | null;
  created_at: string;
  updated_at: string;
  courses:
    | {
        id: string;
        name: string;
        code: string;
      }
    | null;
};

type Course = {
  id: string;
  name: string;
  code: string;
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
  first_name: string | null;
  last_name: string | null;
  middle_name: string | null;
  email: string | null;
  avatar_url: string | null;
};

type Session = {
  id: string;
  name: string;
};

type Term = {
  id: string;
  name: string;
};

type CourseRelation = {
  courses: Course | Course[] | null;
};

type AssignmentRow = Omit<Assignment, "courses"> & {
  courses: Course | Course[] | null;
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
    icon: ClipboardList,
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

const secondaryNavigation = [
  {
    label: "Profile",
    href: "/staff-dashboard/profile",
    icon: UserRound,
  },
];

export default function StaffAssignmentsPage() {
  const router = useRouter();

  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [staff, setStaff] = useState<Staff | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [term, setTerm] = useState<Term | null>(null);

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  const [selectedCourse, setSelectedCourse] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [search, setSearch] = useState("");

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [error, setError] = useState("");

  const loadAssignments = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.replace("/staff-login");
          return;
        }

        // --------------------------------------------------
        // STAFF
        // --------------------------------------------------

        const { data: staffRecord, error: staffError } =
          await supabase
            .from("staff")
            .select(
              "id, user_id, staff_id, department, position, status"
            )
            .eq("user_id", user.id)
            .maybeSingle();

        if (staffError) {
          throw new Error(
            "We could not load your staff account."
          );
        }

        if (!staffRecord) {
          throw new Error(
            "We could not find your staff profile."
          );
        }

        if (staffRecord.status !== "active") {
          await supabase.auth.signOut();
          router.replace("/staff-login");
          return;
        }

        setStaff(staffRecord);

        // --------------------------------------------------
        // PROFILE
        // --------------------------------------------------

        const { data: profileRecord } = await supabase
          .from("profiles")
          .select(
            "id, first_name, last_name, middle_name, email, avatar_url"
          )
          .eq("id", staffRecord.user_id)
          .maybeSingle();

        setProfile(profileRecord);

        // --------------------------------------------------
        // CURRENT SESSION
        // --------------------------------------------------

        const { data: sessionRecord, error: sessionError } =
          await supabase
            .from("academic_sessions")
            .select("id, name")
            .eq("is_current", true)
            .maybeSingle();

        if (sessionError) {
          throw sessionError;
        }

        if (!sessionRecord) {
          throw new Error(
            "No current academic session has been configured."
          );
        }

        setSession(sessionRecord);

        // --------------------------------------------------
        // CURRENT TERM
        // --------------------------------------------------

        const { data: termRecord, error: termError } =
          await supabase
            .from("academic_terms")
            .select("id, name")
            .eq("session_id", sessionRecord.id)
            .eq("is_current", true)
            .maybeSingle();

        if (termError) {
          throw termError;
        }

        if (!termRecord) {
          throw new Error(
            "No current academic term has been configured."
          );
        }

        setTerm(termRecord);

        // --------------------------------------------------
        // TEACHER COURSES
        // --------------------------------------------------

        const { data: teacherCourses, error: coursesError } =
          await supabase
            .from("course_teachers")
            .select(
              `
                course_id,
                courses (
                  id,
                  name,
                  code
                )
              `
            )
            .eq("teacher_id", staffRecord.id)
            .eq("session_id", sessionRecord.id)
            .eq("term_id", termRecord.id);

        if (coursesError) {
          throw coursesError;
        }

        const normalizedCourses: Course[] = [];

        (teacherCourses || []).forEach(
          (item: CourseRelation) => {
            const course = Array.isArray(item.courses)
              ? item.courses[0]
              : item.courses;

            if (course) {
              normalizedCourses.push(course);
            }
          }
        );

        setCourses(normalizedCourses);

        // --------------------------------------------------
        // ASSIGNMENTS
        // --------------------------------------------------

        const {
          data: assignmentRecords,
          error: assignmentsError,
        } = await supabase
          .from("assignments")
          .select(
            `
              id,
              course_id,
              teacher_id,
              session_id,
              term_id,
              title,
              description,
              instructions,
              due_date,
              max_score,
              status,
              submission_type,
              created_at,
              updated_at,
              courses (
                id,
                name,
                code
              )
            `
          )
          .eq("teacher_id", staffRecord.id)
          .eq("session_id", sessionRecord.id)
          .eq("term_id", termRecord.id)
          .order("created_at", { ascending: false });

        if (assignmentsError) {
          throw assignmentsError;
        }

        const normalizedAssignments: Assignment[] = (
          assignmentRecords || []
        ).map(
          (item: AssignmentRow): Assignment => ({
            ...item,
            courses: Array.isArray(item.courses)
              ? item.courses[0] || null
              : item.courses || null,
          })
        );

        setAssignments(normalizedAssignments);
      } catch (err: unknown) {
        console.error("Assignments error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading your assignments."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [router, supabase]
  );

  useEffect(() => {
    void Promise.resolve().then(() => loadAssignments());
  }, [loadAssignments]);

  // --------------------------------------------------
  // LOGOUT
  // --------------------------------------------------

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/staff-login");
  };

  // --------------------------------------------------
  // FILTER
  // --------------------------------------------------

  const filteredAssignments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return assignments.filter((assignment) => {
      const matchesCourse =
        selectedCourse === "all" ||
        assignment.course_id === selectedCourse;

      const matchesStatus =
        selectedStatus === "all" ||
        assignment.status === selectedStatus;

      const matchesSearch =
        !query ||
        assignment.title.toLowerCase().includes(query) ||
        assignment.courses?.name
          ?.toLowerCase()
          .includes(query) ||
        assignment.courses?.code
          ?.toLowerCase()
          .includes(query);

      return (
        matchesCourse &&
        matchesStatus &&
        matchesSearch
      );
    });
  }, [
    assignments,
    selectedCourse,
    selectedStatus,
    search,
  ]);

  // --------------------------------------------------
  // STATS
  // --------------------------------------------------

  const totalAssignments = assignments.length;

  const publishedAssignments = assignments.filter(
    (assignment) => assignment.status === "published"
  ).length;

  const draftAssignments = assignments.filter(
    (assignment) => assignment.status === "draft"
  ).length;

  const closedAssignments = assignments.filter(
    (assignment) => assignment.status === "closed"
  ).length;

  // --------------------------------------------------
  // STAFF NAME
  // --------------------------------------------------

  const staffName = useMemo(() => {
    if (!profile) {
      return staff?.staff_id || "Staff Member";
    }

    const name = [
      profile.first_name,
      profile.middle_name,
      profile.last_name,
    ]
      .filter(Boolean)
      .join(" ");

    return name || staff?.staff_id || "Staff Member";
  }, [profile, staff]);

  const initials = useMemo(() => {
    if (profile) {
      const first = profile.first_name?.charAt(0) || "";
      const last = profile.last_name?.charAt(0) || "";

      const value = `${first}${last}`.toUpperCase();

      if (value) return value;
    }

    return (
      staff?.staff_id?.slice(0, 2).toUpperCase() || "SM"
    );
  }, [profile, staff]);

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return <AssignmentsLoading />;
  }

  // --------------------------------------------------
  // ERROR
  // --------------------------------------------------

  if (error) {
    return (
      <main className="min-h-screen bg-[#f7f9fc]">
        <div className="flex min-h-screen items-center justify-center px-5">
          <div className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <AlertCircle size={30} />
            </div>

            <h1 className="mt-5 text-xl font-bold text-slate-900">
              Unable to load assignments
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {error}
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={() => loadAssignments()}
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Try Again
              </button>

              <Link
                href="/staff-dashboard"
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // MAIN
  // --------------------------------------------------

  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      {/* MOBILE OVERLAY */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:translate-x-0 ${
          mobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        {/* LOGO */}
        <div className="flex h-[76px] items-center justify-between border-b border-slate-100 px-5">
          <Link
            href="/staff-dashboard"
            className="flex items-center gap-3"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white">
              <Image
                src="/images/al-ishad-logo.jpeg"
                alt="Al-Irshad Model School"
                width={44}
                height={44}
                className="h-full w-full object-contain"
              />
            </div>

            <div>
              <p className="text-sm font-bold text-slate-900">
                Al-Irshad
              </p>

              <p className="text-[11px] font-medium text-slate-400">
                Staff Portal
              </p>
            </div>
          </Link>

          <button
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* NAVIGATION */}
        <div className="flex-1 overflow-y-auto px-3 py-5">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Main Menu
          </p>

          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;

              const active =
                item.href ===
                "/staff-dashboard/assignments";

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                    active
                      ? "text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                  style={
                    active
                      ? {
                          backgroundColor: SCHOOL_BLUE,
                        }
                      : undefined
                  }
                >
                  <Icon
                    size={18}
                    strokeWidth={active ? 2.2 : 1.8}
                  />

                  <span>{item.label}</span>

                  {active && (
                    <ChevronRight
                      size={16}
                      className="ml-auto"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="my-6 border-t border-slate-100" />

          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Account
          </p>

          <nav className="space-y-1">
            {secondaryNavigation.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                >
                  <Icon size={18} strokeWidth={1.8} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* STAFF CARD */}
        <div className="border-t border-slate-100 p-3">
          <div className="rounded-2xl bg-slate-50 p-3">
            <div className="flex items-center gap-3">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={staffName}
                  className="h-10 w-10 rounded-xl object-cover"
                />
              ) : (
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white"
                  style={{
                    backgroundColor: SCHOOL_BLUE,
                  }}
                >
                  {initials}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-800">
                  {staffName}
                </p>

                <p className="truncate text-[11px] text-slate-400">
                  {staff?.position ||
                    staff?.department ||
                    "Staff Member"}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-red-100 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={15} />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* CONTENT */}
      <div className="lg:pl-[270px]">
        {/* TOP BAR */}
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>

            <div className="hidden sm:block">
              <p className="text-xs font-medium text-slate-400">
                Staff Portal
              </p>

              <p className="text-sm font-bold text-slate-800">
                Assignment Management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {session && (
              <div className="hidden items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 md:flex">
                <CalendarDays
                  size={15}
                  className="text-slate-400"
                />

                {session.name}
              </div>
            )}

            <div className="hidden h-7 w-px bg-slate-200 sm:block" />

            <div className="flex items-center gap-3">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={staffName}
                  className="h-9 w-9 rounded-xl object-cover"
                />
              ) : (
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold text-white"
                  style={{
                    backgroundColor: SCHOOL_BLUE,
                  }}
                >
                  {initials}
                </div>
              )}

              <div className="hidden min-w-0 sm:block">
                <p className="max-w-[160px] truncate text-sm font-bold text-slate-800">
                  {staffName}
                </p>

                <p className="text-[10px] font-medium text-slate-400">
                  Staff
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* PAGE */}
        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-7xl space-y-6">
            {/* PAGE HEADER */}
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:p-7">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  {/* BREADCRUMB */}
                  <div className="mb-3 flex items-center gap-2 text-xs font-medium text-slate-400">
                    <Link
                      href="/staff-dashboard"
                      className="transition hover:text-slate-700"
                    >
                      Dashboard
                    </Link>

                    <ChevronRight size={14} />

                    <span className="text-slate-600">
                      Assignments
                    </span>
                  </div>

                  <div className="flex items-start gap-4">
                    <div
                      className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm sm:flex"
                      style={{
                        backgroundColor: SCHOOL_BLUE,
                      }}
                    >
                      <ClipboardList size={23} />
                    </div>

                    <div>
                      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                        Assignments
                      </h1>

                      <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                        Create, manage and monitor
                        assignments for your assigned
                        courses.
                      </p>

                      {session && term && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-bold text-slate-600">
                            {session.name}
                          </span>

                          <span
                            className="rounded-lg px-2.5 py-1.5 text-[11px] font-bold"
                            style={{
                              backgroundColor: `${SCHOOL_GOLD}18`,
                              color: SCHOOL_BLUE_DARK,
                            }}
                          >
                            {String(term.name)
                              .charAt(0)
                              .toUpperCase() +
                              String(term.name).slice(1)}{" "}
                            Term
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => loadAssignments(true)}
                    disabled={refreshing}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <RefreshCw
                      size={17}
                      className={
                        refreshing
                          ? "animate-spin"
                          : ""
                      }
                    />

                    Refresh
                  </button>

                  <Link
                    href="/staff-dashboard/assignments/create"
                    className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-95"
                    style={{
                      backgroundColor: SCHOOL_BLUE,
                    }}
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15">
                      +
                    </span>

                    Create Assignment
                  </Link>
                </div>
              </div>
            </section>

            {/* STATS */}
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Total Assignments"
                value={totalAssignments}
                description="Created this term"
                icon={ClipboardList}
              />

              <StatCard
                label="Published"
                value={publishedAssignments}
                description="Visible to students"
                icon={CheckCircle2}
              />

              <StatCard
                label="Drafts"
                value={draftAssignments}
                description="Not yet published"
                icon={Edit3}
              />

              <StatCard
                label="Closed"
                value={closedAssignments}
                description="No longer active"
                icon={Lock}
              />
            </section>

            {/* FILTERS */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <Search
                  size={16}
                  className="text-slate-400"
                />

                <p className="text-sm font-bold text-slate-800">
                  Find an assignment
                </p>
              </div>

              <div className="grid gap-3 lg:grid-cols-[1fr_240px_180px]">
                {/* SEARCH */}
                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Search by title, course or code..."
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                {/* COURSE */}
                <select
                  value={selectedCourse}
                  onChange={(event) =>
                    setSelectedCourse(event.target.value)
                  }
                  className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white"
                >
                  <option value="all">
                    All Courses
                  </option>

                  {courses.map((course) => (
                    <option
                      key={course.id}
                      value={course.id}
                    >
                      {course.code} — {course.name}
                    </option>
                  ))}
                </select>

                {/* STATUS */}
                <select
                  value={selectedStatus}
                  onChange={(event) =>
                    setSelectedStatus(event.target.value)
                  }
                  className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white"
                >
                  <option value="all">
                    All Statuses
                  </option>

                  <option value="published">
                    Published
                  </option>

                  <option value="draft">
                    Draft
                  </option>

                  <option value="closed">
                    Closed
                  </option>
                </select>
              </div>
            </section>

            {/* RESULTS HEADER */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Your Assignments
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Showing{" "}
                  <span className="font-semibold text-slate-700">
                    {filteredAssignments.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-700">
                    {assignments.length}
                  </span>{" "}
                  assignments
                </p>
              </div>

              {(search ||
                selectedCourse !== "all" ||
                selectedStatus !== "all") && (
                <button
                  onClick={() => {
                    setSearch("");
                    setSelectedCourse("all");
                    setSelectedStatus("all");
                  }}
                  className="text-left text-xs font-semibold text-slate-500 transition hover:text-slate-900 sm:text-right"
                >
                  Clear filters
                </button>
              )}
            </div>

            {/* ASSIGNMENTS */}
            {filteredAssignments.length === 0 ? (
              <section className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                <div
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl"
                  style={{
                    backgroundColor: `${SCHOOL_BLUE}10`,
                    color: SCHOOL_BLUE,
                  }}
                >
                  <ClipboardList size={29} />
                </div>

                <h3 className="mt-5 text-lg font-bold text-slate-900">
                  {assignments.length === 0
                    ? "No assignments yet"
                    : "No assignments found"}
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  {assignments.length === 0
                    ? "Create your first assignment for one of your assigned courses."
                    : "Try changing your search or filters to find the assignment you need."}
                </p>

                {assignments.length === 0 && (
                  <Link
                    href="/staff-dashboard/assignments/create"
                    className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition hover:opacity-95"
                    style={{
                      backgroundColor: SCHOOL_BLUE,
                    }}
                  >
                    Create Assignment
                    <ArrowRight size={16} />
                  </Link>
                )}
              </section>
            ) : (
              <section className="space-y-4">
                {filteredAssignments.map(
                  (assignment) => (
                    <AssignmentCard
                      key={assignment.id}
                      assignment={assignment}
                    />
                  )
                )}
              </section>
            )}

            {/* FOOTER */}
            {staff && (
              <div className="border-t border-slate-200 pb-6 pt-5 text-center text-xs text-slate-400">
                Signed in as{" "}
                <span className="font-semibold text-slate-500">
                  {staff.staff_id}
                </span>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// ======================================================
// LOADING
// ======================================================

function AssignmentsLoading() {
  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-[270px] lg:flex-col border-r border-slate-200 bg-white">
        <div className="h-[76px] border-b border-slate-100 px-5 py-4">
          <div className="h-10 w-36 animate-pulse rounded-xl bg-slate-100" />
        </div>

        <div className="space-y-3 px-4 py-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(
            (item) => (
              <div
                key={item}
                className="h-11 animate-pulse rounded-xl bg-slate-100"
              />
            )
          )}
        </div>
      </div>

      <div className="lg:pl-[270px]">
        <div className="h-[76px] border-b border-slate-200 bg-white" />

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <div className="animate-pulse rounded-3xl border border-slate-200 bg-white p-7">
              <div className="h-4 w-24 rounded bg-slate-200" />
              <div className="mt-4 h-9 w-56 rounded-lg bg-slate-200" />
              <div className="mt-3 h-4 w-96 max-w-full rounded bg-slate-100" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-32 animate-pulse rounded-2xl bg-white"
                />
              ))}
            </div>

            <div className="h-28 animate-pulse rounded-2xl bg-white" />

            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-36 animate-pulse rounded-2xl bg-white"
                />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// ======================================================
// STAT CARD
// ======================================================

function StatCard({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;
  value: number;
  description: string;
  icon: typeof ClipboardList;
}) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {description}
          </p>
        </div>

        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition group-hover:scale-105"
          style={{
            backgroundColor: `${SCHOOL_BLUE}10`,
            color: SCHOOL_BLUE,
          }}
        >
          <Icon size={21} strokeWidth={1.9} />
        </div>
      </div>
    </div>
  );
}

// ======================================================
// ASSIGNMENT CARD
// ======================================================

function AssignmentCard({
  assignment,
}: {
  assignment: Assignment;
}) {
  const dueDate = formatDueDate(assignment.due_date);

  const statusStyles = {
    published:
      "bg-emerald-50 text-emerald-700 border-emerald-100",
    draft:
      "bg-amber-50 text-amber-700 border-amber-100",
    closed:
      "bg-slate-100 text-slate-600 border-slate-200",
  };

  const statusLabel = {
    published: "Published",
    draft: "Draft",
    closed: "Closed",
  };

  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-px hover:shadow-md sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        {/* CONTENT */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {assignment.courses && (
              <span
                className="rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide"
                style={{
                  backgroundColor: `${SCHOOL_BLUE}10`,
                  color: SCHOOL_BLUE,
                }}
              >
                {assignment.courses.code}
              </span>
            )}

            <span
              className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold ${
                statusStyles[assignment.status]
              }`}
            >
              {statusLabel[assignment.status]}
            </span>
          </div>

          <h3 className="mt-3 text-lg font-bold text-slate-900 transition group-hover:text-slate-700">
            {assignment.title}
          </h3>

          {assignment.courses && (
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {assignment.courses.name}
            </p>
          )}

          {assignment.description && (
            <p className="mt-3 line-clamp-2 max-w-3xl text-sm leading-6 text-slate-500">
              {assignment.description}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
            {/* DUE DATE */}
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays
                size={15}
                strokeWidth={1.8}
              />

              {dueDate.overdue ? (
                <span className="font-semibold text-red-600">
                  Overdue · {dueDate.text}
                </span>
              ) : (
                <>Due {dueDate.text}</>
              )}
            </span>

            {/* SCORE */}
            <span className="inline-flex items-center gap-1.5">
              <FileText
                size={15}
                strokeWidth={1.8}
              />

              Max score:{" "}
              <span className="font-semibold text-slate-700">
                {assignment.max_score}
              </span>
            </span>

            {/* SUBMISSION TYPE */}
            {assignment.submission_type && (
              <span className="inline-flex items-center gap-1.5">
                <ClipboardList
                  size={15}
                  strokeWidth={1.8}
                />

                {assignment.submission_type}
              </span>
            )}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href={`/staff-dashboard/assignments/${assignment.id}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            View
          </Link>

          <Link
            href={`/staff-dashboard/assignments/${assignment.id}/submissions`}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-95"
            style={{
              backgroundColor: SCHOOL_BLUE_DARK,
            }}
          >
            Submissions
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </article>
  );
}

// ======================================================
// DATE HELPERS
// ======================================================

function formatDate(date: string | null) {
  if (!date) return "No due date";

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function formatDueDate(date: string | null) {
  if (!date) {
    return {
      text: "No due date",
      overdue: false,
    };
  }

  const due = new Date(date);
  const now = new Date();

  return {
    text: formatDate(date),
    overdue: due < now,
  };
}