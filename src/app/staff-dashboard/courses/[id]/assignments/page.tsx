"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Plus,
  Search,
  ClipboardList,
  CalendarDays,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileText,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Course = {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  class_id: string | null;
};

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
};

type Submission = {
  id: string;
  assignment_id: string;
  score: number | null;
  status: string;
};

type Staff = {
  id: string;
  user_id: string;
  staff_id: string;
  status: string;
};

type AcademicSession = {
  id: string;
  name: string;
  is_current: boolean;
};

type AcademicTerm = {
  id: string;
  name: string;
  is_current: boolean;
};

type CourseTeacher = {
  id: string;
  course_id: string;
  teacher_id: string;
  session_id: string;
  term_id: string;
};

type FilterType = "all" | "draft" | "published" | "closed";

export default function CourseAssignmentsPage() {
  const params = useParams();
  const router = useRouter();

  const supabase = useMemo(() => createClient(), []);

  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState("");

  const loadPage = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      /*
       * -------------------------------------------------------
       * 1. AUTHENTICATION
       * -------------------------------------------------------
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
       * -------------------------------------------------------
       * 2. STAFF RECORD
       * -------------------------------------------------------
       */

      const { data: staff, error: staffError } = await supabase
        .from("staff")
        .select("id, user_id, staff_id, status")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle<Staff>();

      if (staffError) {
        throw new Error("Unable to verify staff account.");
      }

      if (!staff) {
        throw new Error("Your staff account could not be found.");
      }

      /*
       * -------------------------------------------------------
       * 3. CURRENT SESSION
       * -------------------------------------------------------
       */

      const { data: session, error: sessionError } = await supabase
        .from("academic_sessions")
        .select("id, name, is_current")
        .eq("is_current", true)
        .maybeSingle<AcademicSession>();

      if (sessionError) {
        throw new Error("Unable to load the current academic session.");
      }

      if (!session) {
        throw new Error("No active academic session was found.");
      }

      /*
       * -------------------------------------------------------
       * 4. CURRENT TERM
       * -------------------------------------------------------
       */

      const { data: term, error: termError } = await supabase
        .from("academic_terms")
        .select("id, name, is_current")
        .eq("session_id", session.id)
        .eq("is_current", true)
        .maybeSingle<AcademicTerm>();

      if (termError) {
        throw new Error("Unable to load the current academic term.");
      }

      if (!term) {
        throw new Error("No active academic term was found.");
      }

      /*
       * -------------------------------------------------------
       * 5. VERIFY COURSE ASSIGNMENT
       * -------------------------------------------------------
       */

      const { data: assignmentLink, error: assignmentLinkError } =
        await supabase
          .from("course_teachers")
          .select(
            "id, course_id, teacher_id, session_id, term_id"
          )
          .eq("course_id", courseId)
          .eq("teacher_id", staff.id)
          .eq("session_id", session.id)
          .eq("term_id", term.id)
          .maybeSingle<CourseTeacher>();

      if (assignmentLinkError) {
        throw new Error(
          "Unable to verify your assignment to this course."
        );
      }

      if (!assignmentLink) {
        throw new Error(
          "You are not assigned to teach this course for the current term."
        );
      }

      /*
       * -------------------------------------------------------
       * 6. COURSE
       * -------------------------------------------------------
       */

      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select(
          "id, code, name, description, class_id"
        )
        .eq("id", courseId)
        .maybeSingle<Course>();

      if (courseError) {
        throw new Error("Unable to load course information.");
      }

      if (!courseData) {
        throw new Error("Course not found.");
      }

      setCourse(courseData);

      /*
       * -------------------------------------------------------
       * 7. ASSIGNMENTS
       * -------------------------------------------------------
       */

      const { data: assignmentData, error: assignmentsError } =
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
              created_at
            `
          )
          .eq("course_id", courseId)
          .eq("teacher_id", staff.id)
          .eq("session_id", session.id)
          .eq("term_id", term.id)
          .order("created_at", { ascending: false });

      if (assignmentsError) {
        throw new Error(
          "Unable to load assignments for this course."
        );
      }

      const assignmentList =
        (assignmentData as Assignment[]) || [];

      setAssignments(assignmentList);

      /*
       * -------------------------------------------------------
       * 8. SUBMISSIONS
       * -------------------------------------------------------
       */

      if (assignmentList.length > 0) {
        const assignmentIds = assignmentList.map(
          (assignment) => assignment.id
        );

        const { data: submissionData, error: submissionsError } =
          await supabase
            .from("submissions")
            .select(
              "id, assignment_id, score, status"
            )
            .in("assignment_id", assignmentIds);

        if (submissionsError) {
          console.warn(
            "Unable to load assignment submissions:",
            submissionsError
          );

          setSubmissions([]);
        } else {
          setSubmissions(
            (submissionData as Submission[]) || []
          );
        }
      } else {
        setSubmissions([]);
      }
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading assignments."
      );
    } finally {
      setLoading(false);
    }
  }, [courseId, router, supabase]);

  useEffect(() => {
    if (!courseId) return;

    const timeoutId = window.setTimeout(() => {
      void loadPage();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadPage]);

  /*
   * -------------------------------------------------------
   * FILTERED ASSIGNMENTS
   * -------------------------------------------------------
   */

  const filteredAssignments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return assignments.filter((assignment) => {
      const matchesSearch =
        !query ||
        assignment.title.toLowerCase().includes(query) ||
        assignment.description
          ?.toLowerCase()
          .includes(query);

      const matchesFilter =
        filter === "all" ||
        assignment.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [assignments, search, filter]);

  /*
   * -------------------------------------------------------
   * COUNTS
   * -------------------------------------------------------
   */

  const counts = useMemo(() => {
    return {
      all: assignments.length,

      draft: assignments.filter(
        (assignment) => assignment.status === "draft"
      ).length,

      published: assignments.filter(
        (assignment) => assignment.status === "published"
      ).length,

      closed: assignments.filter(
        (assignment) => assignment.status === "closed"
      ).length,
    };
  }, [assignments]);

  /*
   * -------------------------------------------------------
   * SUBMISSION COUNT
   * -------------------------------------------------------
   */

  function getSubmissionCount(assignmentId: string) {
    return submissions.filter(
      (submission) =>
        submission.assignment_id === assignmentId
    ).length;
  }

  /*
   * -------------------------------------------------------
   * DUE DATE
   * -------------------------------------------------------
   */

  function formatDueDate(date: string | null) {
    if (!date) return "No due date";

    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(date));
  }

  /*
   * -------------------------------------------------------
   * DELETE
   * -------------------------------------------------------
   */

  async function handleDelete(assignmentId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this assignment?"
    );

    if (!confirmed) return;

    setDeletingId(assignmentId);

    try {
      const { error: deleteError } = await supabase
        .from("assignments")
        .delete()
        .eq("id", assignmentId);

      if (deleteError) {
        throw new Error(
          deleteError.message ||
            "Unable to delete assignment."
        );
      }

      setAssignments((current) =>
        current.filter(
          (assignment) => assignment.id !== assignmentId
        )
      );

      setSubmissions((current) =>
        current.filter(
          (submission) =>
            submission.assignment_id !== assignmentId
        )
      );
    } catch (err) {
      console.error(err);

      alert(
        err instanceof Error
          ? err.message
          : "Unable to delete assignment."
      );
    } finally {
      setDeletingId(null);
    }
  }

  /*
   * -------------------------------------------------------
   * LOADING
   * -------------------------------------------------------
   */

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-600">
          <Loader2 className="w-8 h-8 animate-spin" />

          <p className="text-sm">
            Loading assignments...
          </p>
        </div>
      </div>
    );
  }

  /*
   * -------------------------------------------------------
   * ERROR
   * -------------------------------------------------------
   */

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <AlertCircle className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                Unable to load assignments
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                {error}
              </p>
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <button
              onClick={() => router.back()}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Go Back
            </button>

            <button
              onClick={loadPage}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Link
                href={`/staff-dashboard/courses/${courseId}`}
                className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>

              <div>
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-slate-700" />

                  <h1 className="text-xl font-bold tracking-tight text-slate-900">
                    Assignments
                  </h1>
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  {course?.name}

                  {course?.code && (
                    <span className="ml-2">
                      • {course.code}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <Link
              href={`/staff-dashboard/assignments/create?course=${courseId}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              Create Assignment
            </Link>
          </div>
        </div>
      </header>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* STATS */}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition ${
              filter === "all"
                ? "border-slate-900 ring-1 ring-slate-900"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <p className="text-xs font-medium text-slate-500">
              Total
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {counts.all}
            </p>
          </button>

          <button
            onClick={() => setFilter("draft")}
            className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition ${
              filter === "draft"
                ? "border-slate-900 ring-1 ring-slate-900"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <p className="text-xs font-medium text-slate-500">
              Draft
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {counts.draft}
            </p>
          </button>

          <button
            onClick={() => setFilter("published")}
            className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition ${
              filter === "published"
                ? "border-slate-900 ring-1 ring-slate-900"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <p className="text-xs font-medium text-slate-500">
              Published
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {counts.published}
            </p>
          </button>

          <button
            onClick={() => setFilter("closed")}
            className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition ${
              filter === "closed"
                ? "border-slate-900 ring-1 ring-slate-900"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <p className="text-xs font-medium text-slate-500">
              Closed
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {counts.closed}
            </p>
          </button>
        </div>

        {/* SEARCH */}

        <div className="mt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search assignments..."
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>
        </div>

        {/* =====================================================
            ASSIGNMENTS
        ===================================================== */}

        {filteredAssignments.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <FileText className="h-6 w-6" />
            </div>

            <h2 className="mt-4 text-base font-semibold text-slate-900">
              No assignments found
            </h2>

            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
              {search || filter !== "all"
                ? "Try changing your search or filter."
                : "Create your first assignment for this course."}
            </p>

            {!search && filter === "all" && (
              <Link
                href={`/staff-dashboard/assignments/create?course=${courseId}`}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                Create Assignment
              </Link>
            )}
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {filteredAssignments.map((assignment) => {
              const submissionCount =
                getSubmissionCount(assignment.id);

              return (
                <div
                  key={assignment.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 sm:p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    {/* INFO */}

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold text-slate-900">
                          {assignment.title}
                        </h2>

                        <StatusBadge
                          status={assignment.status}
                        />
                      </div>

                      {assignment.description && (
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                          {assignment.description}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5" />

                          {formatDueDate(
                            assignment.due_date
                          )}
                        </span>

                        <span className="inline-flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5" />

                          Max score:{" "}
                          {assignment.max_score}
                        </span>

                        <span className="inline-flex items-center gap-1.5">
                          <ClipboardList className="h-3.5 w-3.5" />

                          {submissionCount} submission
                          {submissionCount !== 1
                            ? "s"
                            : ""}
                        </span>

                        {assignment.submission_type && (
                          <span className="inline-flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5" />

                            {assignment.submission_type}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* ACTIONS */}

                    <div className="flex shrink-0 items-center gap-2">
                      <Link
                        href={`/staff-dashboard/assignments/${assignment.id}`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        <Eye className="h-4 w-4" />

                        <span className="hidden sm:inline">
                          View
                        </span>
                      </Link>

                      <Link
                        href={`/staff-dashboard/assignments/${assignment.id}/edit`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                        title="Edit assignment"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>

                      {assignment.status !== "published" && (
                        <button
                          onClick={() =>
                            handleDelete(assignment.id)
                          }
                          disabled={
                            deletingId === assignment.id
                          }
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          title="Delete assignment"
                        >
                          {deletingId === assignment.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

/*
 * ============================================================
 * STATUS BADGE
 * ============================================================
 */

function StatusBadge({
  status,
}: {
  status: Assignment["status"];
}) {
  if (status === "published") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
        <CheckCircle2 className="h-3 w-3" />
        Published
      </span>
    );
  }

  if (status === "closed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
        <Clock3 className="h-3 w-3" />
        Closed
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
      <FileText className="h-3 w-3" />
      Draft
    </span>
  );
}