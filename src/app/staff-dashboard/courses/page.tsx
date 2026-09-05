"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ClipboardList,
  Loader2,
  Menu,
  Users,
  X,
  AlertCircle,
  ChevronRight,
  LayoutDashboard,
  GraduationCap,
  FileText,
  ClipboardCheck,
  UserRound,
  LogOut,
  Bell,
  Search,
  RefreshCw,
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
  avatar_url: string | null;
};

type AcademicSession = {
  id: string;
  name: string;
};

type AcademicTerm = {
  id: string;
  name: string;
  session_id: string;
};

type Course = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  class_id: string | null;
  units: number;
};

type ClassItem = {
  id: string;
  name: string;
};

type CourseTeacherRow = {
  course_id: string;
  courses:
    | Course
    | Course[]
    | null;
};

type CourseCardData = {
  course: Course;
  classItem: ClassItem | null;
  studentCount: number;
  assignmentCount: number;
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

export default function StaffCoursesPage() {
  const router = useRouter();

  const [staff, setStaff] = useState<Staff | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [session, setSession] =
    useState<AcademicSession | null>(null);

  const [term, setTerm] =
    useState<AcademicTerm | null>(null);

  const [courses, setCourses] =
    useState<CourseCardData[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] =
    useState(false);
  const [isLoggingOut, setIsLoggingOut] =
    useState(false);

  const loadCourses = useCallback(async () => {
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
        router.push("/staff-login");
        return;
      }

      /*
       * =====================================================
       * 2. STAFF
       * =====================================================
       */

      const {
        data: staffRecord,
        error: staffError,
      } = await supabase
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
        console.error(
          "Staff courses staff query:",
          staffError,
        );

        throw new Error(
          "We could not load your staff account.",
        );
      }

      if (!staffRecord) {
        await supabase.auth.signOut();
        router.push("/staff-login");
        return;
      }

      if (staffRecord.status !== "active") {
        await supabase.auth.signOut();
        router.push("/staff-login");
        return;
      }

      setStaff(staffRecord);

      /*
       * =====================================================
       * 3. PROFILE
       * =====================================================
       */

      const {
        data: profileRecord,
        error: profileError,
      } = await supabase
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
        .eq("id", staffRecord.user_id)
        .maybeSingle();

      if (profileError) {
        console.warn(
          "Staff courses profile query:",
          profileError,
        );
      }

      setProfile(profileRecord);

      /*
       * =====================================================
       * 4. CURRENT SESSION
       * =====================================================
       */

      const {
        data: sessionRecord,
        error: sessionError,
      } = await supabase
        .from("academic_sessions")
        .select("id, name")
        .eq("is_current", true)
        .maybeSingle();

      if (sessionError) {
        console.warn(
          "Staff courses session query:",
          sessionError,
        );
      }

      setSession(sessionRecord);

      if (!sessionRecord) {
        setCourses([]);
        return;
      }

      /*
       * =====================================================
       * 5. CURRENT TERM
       * =====================================================
       */

      const {
        data: termRecord,
        error: termError,
      } = await supabase
        .from("academic_terms")
        .select("id, name, session_id")
        .eq("session_id", sessionRecord.id)
        .eq("is_current", true)
        .maybeSingle();

      if (termError) {
        console.warn(
          "Staff courses term query:",
          termError,
        );
      }

      setTerm(termRecord);

      if (!termRecord) {
        setCourses([]);
        return;
      }

      /*
       * =====================================================
       * 6. ASSIGNED COURSES
       * =====================================================
       */

      const {
        data: courseTeacherRows,
        error: courseTeacherError,
      } = await supabase
        .from("course_teachers")
        .select(
          `
          course_id,
          courses (
            id,
            code,
            name,
            description,
            class_id,
            units
          )
        `,
        )
        .eq("teacher_id", staffRecord.id)
        .eq("session_id", sessionRecord.id)
        .eq("term_id", termRecord.id);

      if (courseTeacherError) {
        console.error(
          "Staff courses assignment query:",
          courseTeacherError,
        );

        throw new Error(
          "We could not load your assigned courses.",
        );
      }

      /*
       * =====================================================
       * 7. NORMALIZE COURSE RELATION
       * =====================================================
       */

      const normalizedCourses: Course[] = [];

      for (const row of (courseTeacherRows ??
        []) as CourseTeacherRow[]) {
        const relation = row.courses;

        if (Array.isArray(relation)) {
          if (relation[0]) {
            normalizedCourses.push(relation[0]);
          }
        } else if (relation) {
          normalizedCourses.push(relation);
        }
      }

      /*
       * Prevent duplicate course cards
       */

      const uniqueCourses = Array.from(
        new Map(
          normalizedCourses.map((course) => [
            course.id,
            course,
          ]),
        ).values(),
      );

      /*
       * =====================================================
       * 8. CLASS INFORMATION
       * =====================================================
       */

      const classIds = Array.from(
        new Set(
          uniqueCourses
            .map((course) => course.class_id)
            .filter(
              (id): id is string => Boolean(id),
            ),
        ),
      );

      let classRows: ClassItem[] = [];

      if (classIds.length > 0) {
        const {
          data: classes,
          error: classError,
        } = await supabase
          .from("classes")
          .select("id, name")
          .in("id", classIds);

        if (classError) {
          console.warn(
            "Staff courses classes query:",
            classError,
          );
        } else {
          classRows = classes ?? [];
        }
      }

      /*
       * =====================================================
       * 9. BUILD COURSE CARDS
       * =====================================================
       */

      const courseCards: CourseCardData[] =
        await Promise.all(
          uniqueCourses.map(async (course) => {
            const classItem =
              classRows.find(
                (item) =>
                  item.id === course.class_id,
              ) ?? null;

            /*
             * Student count
             */

            let studentCount = 0;

            if (
              course.class_id &&
              sessionRecord.id
            ) {
              const {
                count,
                error: studentError,
              } = await supabase
                .from("student_enrollments")
                .select("id", {
                  count: "exact",
                  head: true,
                })
                .eq(
                  "session_id",
                  sessionRecord.id,
                )
                .eq(
                  "class_id",
                  course.class_id,
                )
                .eq("status", "active");

              if (studentError) {
                console.warn(
                  `Student count for ${course.code}:`,
                  studentError,
                );
              } else {
                studentCount = count ?? 0;
              }
            }

            /*
             * Assignment count
             */

            let assignmentCount = 0;

            const {
              count,
              error: assignmentError,
            } = await supabase
              .from("assignments")
              .select("id", {
                count: "exact",
                head: true,
              })
              .eq(
                "teacher_id",
                staffRecord.id,
              )
              .eq(
                "course_id",
                course.id,
              )
              .eq(
                "session_id",
                sessionRecord.id,
              )
              .eq(
                "term_id",
                termRecord.id,
              );

            if (assignmentError) {
              console.warn(
                `Assignment count for ${course.code}:`,
                assignmentError,
              );
            } else {
              assignmentCount = count ?? 0;
            }

            return {
              course,
              classItem,
              studentCount,
              assignmentCount,
            };
          }),
        );

      setCourses(courseCards);
    } catch (loadError) {
      console.error(
        "Staff courses page error:",
        loadError,
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "We were unable to load your courses.",
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadCourses();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadCourses]);

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
   * STAFF DISPLAY
   * =======================================================
   */

  const staffName = useMemo(() => {
    if (!staff) return "Staff Member";

    const first =
      profile?.first_name?.trim() ?? "";

    const middle =
      profile?.middle_name?.trim() ?? "";

    const last =
      profile?.last_name?.trim() ?? "";

    const fullName = [
      first,
      middle,
      last,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      fullName ||
      staff.staff_id ||
      "Staff Member"
    );
  }, [staff, profile]);

  const initials = useMemo(() => {
    const first =
      profile?.first_name?.trim() ?? "";

    const last =
      profile?.last_name?.trim() ?? "";

    if (first && last) {
      return `${first[0]}${last[0]}`.toUpperCase();
    }

    if (first) {
      return first.slice(0, 2).toUpperCase();
    }

    if (last) {
      return last.slice(0, 2).toUpperCase();
    }

    return (
      staff?.staff_id?.slice(0, 2).toUpperCase() ||
      "ST"
    );
  }, [staff, profile]);

  /*
   * =======================================================
   * FILTER
   * =======================================================
   */

  const filteredCourses = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return courses;
    }

    return courses.filter(
      ({ course, classItem }) => {
        return (
          course.name
            .toLowerCase()
            .includes(query) ||
          course.code
            .toLowerCase()
            .includes(query) ||
          classItem?.name
            ?.toLowerCase()
            .includes(query)
        );
      },
    );
  }, [courses, search]);

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
            Loading your courses...
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

  if (error || !staff) {
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
            Unable to load courses
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            {error ||
              "Your courses could not be loaded."}
          </p>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              onClick={() => void loadCourses()}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCw size={14} />
              Try again
            </button>

            <Link
              href="/staff-dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-xs font-bold text-white"
              style={{
                backgroundColor: SCHOOL_BLUE,
              }}
            >
              Dashboard
              <ArrowRight size={14} />
            </Link>
          </div>
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
          onClick={() =>
            setIsMobileMenuOpen(false)
          }
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
        <div className="flex h-20.5 items-center border-b border-slate-100 px-6">
          <Link
            href="/staff-dashboard"
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
              <Image
                src="/images/al-ishad-logo.jpeg"
                alt="MSSN Al-Irshad"
                width={32}
                height={32}
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

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-3 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
            Workspace
          </p>

          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;

              const active =
                item.href ===
                "/staff-dashboard/courses";

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

        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={staffName}
                className="h-10 w-10 rounded-xl object-cover"
              />
            ) : (
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black text-white"
                style={{
                  backgroundColor:
                    SCHOOL_BLUE,
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
                {staff.position ||
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
          MAIN
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
                My Courses
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
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

            <div className="hidden items-center gap-3 border-l border-slate-200 pl-4 sm:flex">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
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
                  {staff.staff_id}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* ===================================================
            PAGE CONTENT
        ==================================================== */}

        <div className="px-5 py-7 sm:px-8 lg:px-10 lg:py-9">
          {/* Header */}

          <section className="relative overflow-hidden rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
            <div className="relative z-10">
              <p
                className="text-[10px] font-black uppercase tracking-[0.2em]"
                style={{
                  color: SCHOOL_GOLD,
                }}
              >
                Teaching Workspace
              </p>

              <div className="mt-2 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2
                    className="text-2xl font-black tracking-tight sm:text-3xl"
                    style={{
                      color: SCHOOL_BLUE_DARK,
                    }}
                  >
                    My Courses
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    Courses assigned to you for the
                    current academic session and
                    term.
                  </p>
                </div>

                <Link
                  href="/staff-dashboard"
                  className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                >
                  Dashboard
                  <ChevronRight size={14} />
                </Link>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-bold text-slate-600">
                  <CalendarDays size={13} />
                  {session?.name ||
                    "No current session"}
                </span>

                <span
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-bold"
                  style={{
                    backgroundColor:
                      `${SCHOOL_BLUE}08`,
                    color: SCHOOL_BLUE,
                  }}
                >
                  <ClipboardCheck size={13} />
                  {term?.name ||
                    "No current term"}
                </span>

                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-bold text-slate-600">
                  <BookOpen size={13} />
                  {courses.length}{" "}
                  {courses.length === 1
                    ? "Course"
                    : "Courses"}
                </span>
              </div>
            </div>

            <div
              aria-hidden="true"
              className="absolute -right-16 -top-16 h-52 w-52 rounded-full opacity-60 blur-3xl"
              style={{
                backgroundColor:
                  `${SCHOOL_BLUE}10`,
              }}
            />

            <div
              aria-hidden="true"
              className="absolute -bottom-20 right-20 h-40 w-40 rounded-full opacity-40 blur-3xl"
              style={{
                backgroundColor:
                  `${SCHOOL_GOLD}15`,
              }}
            />
          </section>

          {/* Search */}

          {courses.length > 0 && (
            <div className="mt-6">
              <div className="relative max-w-xl">
                <Search
                  size={17}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="search"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value,
                    )
                  }
                  placeholder="Search by course, code or class..."
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
                />
              </div>
            </div>
          )}

          {/* Course grid */}

          {filteredCourses.length > 0 ? (
            <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredCourses.map(
                ({
                  course,
                  classItem,
                  studentCount,
                  assignmentCount,
                }) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    classItem={classItem}
                    studentCount={studentCount}
                    assignmentCount={
                      assignmentCount
                    }
                  />
                ),
              )}
            </section>
          ) : courses.length > 0 ? (
            <div className="mt-6 rounded-[2rem] border border-dashed border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
              <div
                className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{
                  backgroundColor:
                    `${SCHOOL_BLUE}08`,
                  color: SCHOOL_BLUE,
                }}
              >
                <Search size={20} />
              </div>

              <h3
                className="mt-4 text-sm font-black"
                style={{
                  color: SCHOOL_BLUE_DARK,
                }}
              >
                No courses found
              </h3>

              <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-400">
                Try searching with a different
                course name, code or class.
              </p>

              <button
                onClick={() => setSearch("")}
                className="mt-5 rounded-xl px-4 py-2.5 text-xs font-bold text-white"
                style={{
                  backgroundColor:
                    SCHOOL_BLUE,
                }}
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="mt-6 rounded-[2rem] border border-dashed border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
              <div
                className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{
                  backgroundColor:
                    `${SCHOOL_BLUE}08`,
                  color: SCHOOL_BLUE,
                }}
              >
                <BookOpen size={23} />
              </div>

              <p className="mt-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Teaching Assignment
              </p>

              <h3
                className="mt-2 text-xl font-black"
                style={{
                  color: SCHOOL_BLUE_DARK,
                }}
              >
                No courses assigned yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
                You don&apos;t currently have any courses
                assigned for the active academic
                session and term. Contact an
                administrator if this doesn&apos;t look
                right.
              </p>

              <Link
                href="/staff-dashboard"
                className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-bold text-white"
                style={{
                  backgroundColor:
                    SCHOOL_BLUE,
                }}
              >
                Back to dashboard
                <ArrowRight size={14} />
              </Link>
            </div>
          )}

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
 * COURSE CARD
 * ==========================================================
 */

function CourseCard({
  course,
  classItem,
  studentCount,
  assignmentCount,
}: {
  course: Course;
  classItem: ClassItem | null;
  studentCount: number;
  assignmentCount: number;
}) {
  return (
    <article className="group relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-6">
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{
          backgroundColor: SCHOOL_BLUE,
        }}
      />

      <div className="flex items-start justify-between gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xs font-black"
          style={{
            backgroundColor:
              `${SCHOOL_BLUE}08`,
            color: SCHOOL_BLUE,
          }}
        >
          {course.code
            ?.slice(0, 4)
            .toUpperCase()}
        </div>

        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-slate-500">
          {course.units}{" "}
          {course.units === 1
            ? "Unit"
            : "Units"}
        </span>
      </div>

      <div className="mt-5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {course.code}
        </p>

        <h3
          className="mt-1 line-clamp-2 text-lg font-black leading-6"
          style={{
            color: SCHOOL_BLUE_DARK,
          }}
        >
          {course.name}
        </h3>

        {classItem && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5">
            <Users
              size={13}
              className="text-slate-400"
            />

            <span className="text-[10px] font-bold text-slate-600">
              {classItem.name}
            </span>
          </div>
        )}

        {course.description && (
          <p className="mt-4 line-clamp-2 text-xs leading-5 text-slate-400">
            {course.description}
          </p>
        )}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <MiniStat
          icon={Users}
          label="Students"
          value={studentCount}
        />

        <MiniStat
          icon={ClipboardList}
          label="Assignments"
          value={assignmentCount}
        />
      </div>

      <Link
        href={`/staff-dashboard/courses/${course.id}`}
        className="mt-5 flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-xs font-bold text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50"
      >
        <span>Open course</span>

        <ArrowRight
          size={15}
          className="transition-transform group-hover:translate-x-1"
        />
      </Link>
    </article>
  );
}

/*
 * ==========================================================
 * MINI STAT
 * ==========================================================
 */

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-3">
      <div className="flex items-center gap-1.5 text-slate-400">
        <Icon size={13} />

        <span className="text-[9px] font-bold uppercase tracking-wider">
          {label}
        </span>
      </div>

      <p
        className="mt-1 text-lg font-black"
        style={{
          color: SCHOOL_BLUE_DARK,
        }}
      >
        {value}
      </p>
    </div>
  );
}