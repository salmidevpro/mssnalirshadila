"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

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

export default function StaffResultsPage() {
  const supabase = useMemo(() => createClient(), []);

  const [session, setSession] = useState<Session | null>(null);
  const [term, setTerm] = useState<Term | null>(null);

  const [courses, setCourses] = useState<CourseResult[]>([]);

  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unauthenticated, setUnauthenticated] = useState(false);

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
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-10 w-64 rounded-xl bg-slate-200" />

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
                  className="h-72 rounded-2xl bg-white shadow-sm"
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // UNAUTHENTICATED
  // --------------------------------------------------
  if (unauthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
              <path d="M10.3 3.7 2.8 17a2 2 0 0 0 1.75 3h14.9a2 2 0 0 0 1.75-3l-7.5-13.3a2 2 0 0 0-3.4 0Z" />
            </svg>
          </div>

          <h1 className="text-xl font-bold text-slate-900">
            Staff sign-in required
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Please sign in to access your teaching results.
          </p>

          <Link
            href="/staff-login"
            className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
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
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-xl">
          <div className="rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
                <path d="M10.3 3.7 2.8 17a2 2 0 0 0 1.75 3h14.9a2 2 0 0 0 1.75-3l-7.5-13.3a2 2 0 0 0-3.4 0Z" />
              </svg>
            </div>

            <h1 className="text-xl font-bold text-slate-900">
              Unable to load results
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">{error}</p>

            <button
              onClick={loadResults}
              className="mt-6 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
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

              <span>/</span>

              <span className="text-slate-900">Results</span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Results
            </h1>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Enter, review and manage academic results for your assigned
              courses.
            </p>
          </div>

          <Link
            href="/staff-dashboard/results/enter"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>

            Enter Results
          </Link>
        </div>

        {/* ============================================
            SESSION / TERM
        ============================================ */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <svg
                  width="21"
                  height="21"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <rect x="3" y="4" width="18" height="17" rx="2" />
                  <path d="M8 2v4M16 2v4M3 10h18" />
                </svg>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
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

            <div className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
              Current Period
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
            icon={
              <svg
                width="21"
                height="21"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="m4 6 8-3 8 3-8 3-8-3Z" />
                <path d="m4 10 8 3 8-3" />
                <path d="m4 14 8 3 8-3" />
                <path d="m4 18 8 3 8-3" />
              </svg>
            }
          />

          <StatCard
            label="Students"
            value={stats.totalStudents}
            icon={
              <svg
                width="21"
                height="21"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            }
          />

          <StatCard
            label="Results Entered"
            value={stats.totalResults}
            icon={
              <svg
                width="21"
                height="21"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M9 11 12 14 22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            }
          />

          <StatCard
            label="Pending"
            value={stats.totalPending}
            icon={
              <svg
                width="21"
                height="21"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
            }
          />
        </div>

        {/* ============================================
            TOOLBAR
        ============================================ */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <svg
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search course or course code..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
              />
            </div>

            <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(event) => setShowInactive(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />

              Show inactive courses
            </label>
          </div>
        </div>

        {/* ============================================
            COURSE LIST
        ============================================ */}
        {filteredCourses.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <svg
                width="25"
                height="25"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="m4 6 8-3 8 3-8 3-8-3Z" />
                <path d="M4 10v8l8 3 8-3v-8" />
              </svg>
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
                className="mt-5 text-sm font-semibold text-slate-900 underline underline-offset-4"
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
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

/* ==================================================
   STAT CARD
================================================== */

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
          {icon}
        </div>
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
}: {
  item: CourseResult;
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

  return (
    <div className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      {/* Top */}
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white">
              {course.code.slice(0, 2).toUpperCase()}
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
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

        {/* Progress */}
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-slate-500">
              Results completion
            </span>

            <span className="font-bold text-slate-900">
              {progress}%
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-slate-900 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-3 divide-x divide-slate-100 rounded-2xl border border-slate-100 bg-slate-50">
          <MiniStat
            label="Students"
            value={studentCount}
          />

          <MiniStat
            label="Entered"
            value={resultCount}
          />

          <MiniStat
            label="Pending"
            value={pendingCount}
          />
        </div>

        {/* Published status */}
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-slate-500">Published</span>

          <span className="font-semibold text-slate-900">
            {publishedCount} / {resultCount}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 border-t border-slate-100">
        <Link
          href={`/staff-dashboard/courses/${course.id}/results`}
          className="flex items-center justify-center gap-2 px-4 py-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          View Results

          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </Link>

        <Link
          href={`/staff-dashboard/courses/${course.id}/results`}
          className="flex items-center justify-center gap-2 border-l border-slate-100 bg-slate-900 px-4 py-4 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Enter Results

          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
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
      <p className="mt-0.5 text-[11px] text-slate-400">{label}</p>
    </div>
  );
}