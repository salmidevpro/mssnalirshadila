"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

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

export default function StaffAssignmentsPage() {
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [staff, setStaff] = useState<Staff | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [term, setTerm] = useState<Term | null>(null);

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  const [selectedCourse, setSelectedCourse] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [search, setSearch] = useState("");

  const [error, setError] = useState("");

  const loadAssignments = useCallback(async (showRefresh = false) => {
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
        setError("Your session has expired. Please sign in again.");
        return;
      }

      // --------------------------------------------------
      // GET STAFF PROFILE
      // --------------------------------------------------

      const { data: staffRecord, error: staffError } = await supabase
        .from("staff")
        .select(
          "id, user_id, staff_id, department, position, status"
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (staffError) {
        throw staffError;
      }

      if (!staffRecord) {
        setError("We could not find your staff profile.");
        return;
      }

      if (staffRecord.status !== "active") {
        setError(
          "Your staff account is not currently active. Please contact the school administrator."
        );
        return;
      }

      setStaff(staffRecord);

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
        setError("No current academic session has been configured.");
        return;
      }

      setSession(sessionRecord);

      // --------------------------------------------------
      // CURRENT TERM
      // --------------------------------------------------

      const { data: termRecord, error: termError } = await supabase
        .from("academic_terms")
        .select("id, name")
        .eq("session_id", sessionRecord.id)
        .eq("is_current", true)
        .maybeSingle();

      if (termError) {
        throw termError;
      }

      if (!termRecord) {
        setError("No current academic term has been configured.");
        return;
      }

      setTerm(termRecord);

      // --------------------------------------------------
      // TEACHER'S COURSES
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

      (teacherCourses || []).forEach((item: CourseRelation) => {
        const course = Array.isArray(item.courses)
          ? item.courses[0]
          : item.courses;

        if (course) {
          normalizedCourses.push(course);
        }
      });

      setCourses(normalizedCourses);

      // --------------------------------------------------
      // ASSIGNMENTS
      // --------------------------------------------------

      const { data: assignmentRecords, error: assignmentsError } =
        await supabase
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
      ).map((item: AssignmentRow): Assignment => ({
        ...item,
        courses: Array.isArray(item.courses)
          ? item.courses[0] || null
          : item.courses || null,
      }));

      setAssignments(normalizedAssignments);
    } catch (err: unknown) {
      console.error("Assignments error:", err);

      setError(
        (err instanceof Error ? err.message : undefined) ||
          "Something went wrong while loading your assignments."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [supabase]);

  useEffect(() => {
    void Promise.resolve().then(() => loadAssignments());
  }, [loadAssignments]);

  // --------------------------------------------------
  // FILTER ASSIGNMENTS
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

      return matchesCourse && matchesStatus && matchesSearch;
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
  // DATE FORMAT
  // --------------------------------------------------

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

  function getStatusLabel(status: Assignment["status"]) {
    switch (status) {
      case "published":
        return "Published";
      case "draft":
        return "Draft";
      case "closed":
        return "Closed";
      default:
        return status;
    }
  }

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f9fc] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-56 rounded-lg bg-slate-200" />
            <div className="h-4 w-80 rounded bg-slate-200" />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-28 rounded-2xl bg-white shadow-sm"
                />
              ))}
            </div>

            <div className="h-16 rounded-2xl bg-white shadow-sm" />

            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-32 rounded-2xl bg-white shadow-sm"
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // ERROR
  // --------------------------------------------------

  if (error) {
    return (
      <main className="min-h-screen bg-[#f7f9fc] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
          <div className="w-full rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
              </svg>
            </div>

            <h1 className="text-xl font-bold text-slate-900">
              Unable to load assignments
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {error}
            </p>

            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
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
  // MAIN UI
  // --------------------------------------------------

  return (
    <main className="min-h-screen bg-[#f7f9fc] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* HEADER */}
        <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
              <Link
                href="/staff-dashboard"
                className="transition hover:text-slate-900"
              >
                Dashboard
              </Link>

              <span>/</span>

              <span className="text-slate-700">
                Assignments
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Assignments
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Create, manage and monitor assignments for your
              courses.
            </p>

            {session && term && (
              <p className="mt-2 text-xs font-medium text-slate-400">
                {session.name} ·{" "}
                {String(term.name)
                  .charAt(0)
                  .toUpperCase() +
                  String(term.name).slice(1)}{" "}
                Term
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => loadAssignments(true)}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={refreshing ? "animate-spin" : ""}
              >
                <path d="M20 11a8.1 8.1 0 0 0-14.9-4" />
                <path d="M4 4v5h5" />
                <path d="M4 13a8.1 8.1 0 0 0 14.9 4" />
                <path d="M20 20v-5h-5" />
              </svg>

              Refresh
            </button>

            <Link
              href="/staff-dashboard/assignments/create"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>

              Create Assignment
            </Link>
          </div>
        </section>

        {/* STATS */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Assignments"
            value={totalAssignments}
            icon="clipboard"
            description="This term"
          />

          <StatCard
            label="Published"
            value={publishedAssignments}
            icon="check"
            description="Visible to students"
          />

          <StatCard
            label="Drafts"
            value={draftAssignments}
            icon="edit"
            description="Not yet published"
          />

          <StatCard
            label="Closed"
            value={closedAssignments}
            icon="lock"
            description="No longer active"
          />
        </section>

        {/* FILTER BAR */}
        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px_180px]">
            {/* SEARCH */}
            <div className="relative">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search assignments..."
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
              />
            </div>

            {/* COURSE */}
            <select
              value={selectedCourse}
              onChange={(event) =>
                setSelectedCourse(event.target.value)
              }
              className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 outline-none focus:border-slate-400"
            >
              <option value="all">All Courses</option>

              {courses.map((course) => (
                <option key={course.id} value={course.id}>
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
              className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 outline-none focus:border-slate-400"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </section>

        {/* RESULTS HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Your Assignments
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Showing {filteredAssignments.length} of{" "}
              {assignments.length} assignments
            </p>
          </div>
        </div>

        {/* ASSIGNMENTS */}
        {filteredAssignments.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
              >
                <path d="M7 3h10l3 3v15H4V3h3Z" />
                <path d="M7 3v5h10V3" />
                <path d="M8 13h8" />
                <path d="M8 17h5" />
              </svg>
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
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <span className="text-lg leading-none">
                  +
                </span>
                Create Assignment
              </Link>
            )}
          </section>
        ) : (
          <section className="space-y-4">
            {filteredAssignments.map((assignment) => {
              const dueDate = formatDueDate(
                assignment.due_date
              );

              return (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  dueDate={dueDate}
                  statusLabel={getStatusLabel(
                    assignment.status
                  )}
                />
              );
            })}
          </section>
        )}

        {/* FOOTER NOTE */}
        {staff && (
          <div className="pb-6 text-center text-xs text-slate-400">
            Signed in as{" "}
            <span className="font-semibold text-slate-500">
              {staff.staff_id}
            </span>
          </div>
        )}
      </div>
    </main>
  );
}

// ======================================================
// STAT CARD
// ======================================================

function StatCard({
  label,
  value,
  description,
  icon,
}: {
  label: string;
  value: number;
  description: string;
  icon: "clipboard" | "check" | "edit" | "lock";
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {description}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          {icon === "clipboard" && (
            <svg
              width="21"
              height="21"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <rect
                x="5"
                y="4"
                width="14"
                height="17"
                rx="2"
              />
              <path d="M9 4V2h6v2" />
              <path d="M9 9h6" />
              <path d="M9 13h6" />
              <path d="M9 17h4" />
            </svg>
          )}

          {icon === "check" && (
            <svg
              width="21"
              height="21"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="m8 12 2.7 2.7L16.5 9" />
            </svg>
          )}

          {icon === "edit" && (
            <svg
              width="21"
              height="21"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
            </svg>
          )}

          {icon === "lock" && (
            <svg
              width="21"
              height="21"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <rect
                x="5"
                y="10"
                width="14"
                height="10"
                rx="2"
              />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
          )}
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
  dueDate,
  statusLabel,
}: {
  assignment: Assignment;
  dueDate: {
    text: string;
    overdue: boolean;
  };
  statusLabel: string;
}) {
  const statusStyles = {
    published:
      "bg-emerald-50 text-emerald-700 border-emerald-100",
    draft: "bg-amber-50 text-amber-700 border-amber-100",
    closed: "bg-slate-100 text-slate-600 border-slate-200",
  };

  return (
    <article className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-px hover:shadow-md sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        {/* MAIN */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {assignment.courses && (
              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-600">
                {assignment.courses.code}
              </span>
            )}

            <span
              className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold ${statusStyles[assignment.status]}`}
            >
              {statusLabel}
            </span>
          </div>

          <h3 className="mt-3 text-lg font-bold text-slate-900 transition group-hover:text-slate-700">
            {assignment.title}
          </h3>

          {assignment.courses && (
            <p className="mt-1 text-sm font-medium text-slate-500">
              {assignment.courses.name}
            </p>
          )}

          {assignment.description && (
            <p className="mt-3 line-clamp-2 max-w-3xl text-sm leading-6 text-slate-500">
              {assignment.description}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M12 6v6l4 2" />
                <circle cx="12" cy="12" r="9" />
              </svg>

              {dueDate.overdue ? (
                <span className="font-semibold text-red-600">
                  Overdue · {dueDate.text}
                </span>
              ) : (
                <>Due {dueDate.text}</>
              )}
            </span>

            <span className="inline-flex items-center gap-1.5">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M4 6h16" />
                <path d="M4 12h16" />
                <path d="M4 18h10" />
              </svg>

              Max score:{" "}
              <span className="font-semibold text-slate-700">
                {assignment.max_score}
              </span>
            </span>

            {assignment.submission_type && (
              <span className="inline-flex items-center gap-1.5">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M7 3h10l3 3v15H4V3h3Z" />
                  <path d="M7 3v5h10V3" />
                </svg>

                {assignment.submission_type}
              </span>
            )}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href={`/staff-dashboard/assignments/${assignment.id}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            View
          </Link>

          <Link
            href={`/staff-dashboard/assignments/${assignment.id}/submissions`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Submissions

            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}