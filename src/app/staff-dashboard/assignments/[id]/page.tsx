"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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

type Staff = {
  id: string;
  user_id: string;
  staff_id: string;
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

type Submission = {
  id: string;
  status: "submitted" | "graded" | "late";
  score: number | null;
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function AssignmentDetailsPage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();

  const assignmentId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  const [assignment, setAssignment] =
    useState<Assignment | null>(null);

  const [staff, setStaff] = useState<Staff | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [term, setTerm] = useState<Term | null>(null);

  const [submissions, setSubmissions] = useState<
    Submission[]
  >([]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showDeleteModal, setShowDeleteModal] =
    useState(false);

  useEffect(() => {
    if (assignmentId) {
      loadAssignment();
    }
  }, [assignmentId]);

  async function loadAssignment() {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError(
          "Your session has expired. Please sign in again."
        );
        return;
      }

      // ---------------------------------------------
      // STAFF
      // ---------------------------------------------

      const { data: staffRecord, error: staffError } =
        await supabase
          .from("staff")
          .select("id, user_id, staff_id, status")
          .eq("user_id", user.id)
          .maybeSingle();

      if (staffError) throw staffError;

      if (!staffRecord) {
        setError("We could not find your staff profile.");
        return;
      }

      if (staffRecord.status !== "active") {
        setError(
          "Your staff account is not currently active."
        );
        return;
      }

      setStaff(staffRecord);

      // ---------------------------------------------
      // ASSIGNMENT
      // ---------------------------------------------

      const { data: assignmentRecord, error: assignmentError } =
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
          .eq("id", assignmentId)
          .eq("teacher_id", staffRecord.id)
          .maybeSingle();

      if (assignmentError) throw assignmentError;

      if (!assignmentRecord) {
        setError(
          "Assignment not found or you do not have permission to view it."
        );
        return;
      }

      const relatedCourses = assignmentRecord.courses as
        | Assignment["courses"]
        | Assignment["courses"][];

      const normalizedAssignment: Assignment = {
        ...assignmentRecord,
        courses: Array.isArray(relatedCourses)
          ? relatedCourses[0] || null
          : relatedCourses || null,
      };

      setAssignment(normalizedAssignment);

      // ---------------------------------------------
      // SESSION
      // ---------------------------------------------

      const { data: sessionRecord } = await supabase
        .from("academic_sessions")
        .select("id, name")
        .eq("id", normalizedAssignment.session_id)
        .maybeSingle();

      setSession(sessionRecord);

      // ---------------------------------------------
      // TERM
      // ---------------------------------------------

      const { data: termRecord } = await supabase
        .from("academic_terms")
        .select("id, name")
        .eq("id", normalizedAssignment.term_id)
        .maybeSingle();

      setTerm(termRecord);

      // ---------------------------------------------
      // SUBMISSIONS
      // ---------------------------------------------

      const { data: submissionRecords, error: submissionError } =
        await supabase
          .from("submissions")
          .select("id, status, score")
          .eq("assignment_id", normalizedAssignment.id);

      if (submissionError) {
        console.warn(
          "Could not load submissions:",
          submissionError
        );
      } else {
        setSubmissions(submissionRecords || []);
      }
    } catch (err: unknown) {
      console.error(err);

      setError(
        getErrorMessage(
          err,
          "Something went wrong while loading the assignment."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  // ---------------------------------------------
  // PUBLISH
  // ---------------------------------------------

  async function publishAssignment() {
    if (!assignment || !staff) return;

    try {
      setWorking(true);
      setError("");
      setSuccess("");

      const { error: updateError } = await supabase
        .from("assignments")
        .update({
          status: "published",
          updated_at: new Date().toISOString(),
        })
        .eq("id", assignment.id)
        .eq("teacher_id", staff.id);

      if (updateError) throw updateError;

      setAssignment({
        ...assignment,
        status: "published",
      });

      setSuccess("Assignment published successfully.");
    } catch (err: unknown) {
      setError(
        getErrorMessage(err, "Unable to publish this assignment.")
      );
    } finally {
      setWorking(false);
    }
  }

  // ---------------------------------------------
  // CLOSE
  // ---------------------------------------------

  async function closeAssignment() {
    if (!assignment || !staff) return;

    try {
      setWorking(true);
      setError("");
      setSuccess("");

      const { error: updateError } = await supabase
        .from("assignments")
        .update({
          status: "closed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", assignment.id)
        .eq("teacher_id", staff.id);

      if (updateError) throw updateError;

      setAssignment({
        ...assignment,
        status: "closed",
      });

      setSuccess("Assignment closed successfully.");
    } catch (err: unknown) {
      setError(
        getErrorMessage(err, "Unable to close this assignment.")
      );
    } finally {
      setWorking(false);
    }
  }

  // ---------------------------------------------
  // DELETE
  // ---------------------------------------------

  async function deleteAssignment() {
    if (!assignment || !staff) return;

    try {
      setWorking(true);
      setError("");

      const { error: deleteError } = await supabase
        .from("assignments")
        .delete()
        .eq("id", assignment.id)
        .eq("teacher_id", staff.id);

      if (deleteError) throw deleteError;

      router.push("/staff-dashboard/assignments");
    } catch (err: unknown) {
      console.error(err);

      setError(
        getErrorMessage(err, "Unable to delete this assignment.")
      );

      setShowDeleteModal(false);
    } finally {
      setWorking(false);
    }
  }

  // ---------------------------------------------
  // HELPERS
  // ---------------------------------------------

  function formatDate(date: string | null) {
    if (!date) return "No due date";

    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(date));
  }

  function formatCreatedDate(date: string) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  }

  function statusLabel(status: Assignment["status"]) {
    if (status === "published") return "Published";
    if (status === "closed") return "Closed";
    return "Draft";
  }

  const gradedCount = submissions.filter(
    (submission) => submission.status === "graded"
  ).length;

  const submittedCount = submissions.filter(
    (submission) =>
      submission.status === "submitted" ||
      submission.status === "late"
  ).length;

  // ---------------------------------------------
  // LOADING
  // ---------------------------------------------

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f9fc] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl animate-pulse space-y-6">
          <div className="h-4 w-56 rounded bg-slate-200" />
          <div className="h-10 w-96 rounded bg-slate-200" />

          <div className="rounded-3xl bg-white p-7 shadow-sm">
            <div className="space-y-5">
              <div className="h-6 w-32 rounded bg-slate-200" />
              <div className="h-10 w-3/4 rounded bg-slate-200" />
              <div className="h-20 rounded bg-slate-200" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ---------------------------------------------
  // ERROR
  // ---------------------------------------------

  if (error && !assignment) {
    return (
      <main className="min-h-screen bg-[#f7f9fc] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
          <div className="w-full rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
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

            <h1 className="mt-5 text-xl font-bold text-slate-900">
              Assignment unavailable
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {error}
            </p>

            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={loadAssignment}
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
              >
                Try Again
              </button>

              <Link
                href="/staff-dashboard/assignments"
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700"
              >
                Back
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!assignment) return null;

  const statusStyles = {
    published:
      "border-emerald-100 bg-emerald-50 text-emerald-700",
    draft:
      "border-amber-100 bg-amber-50 text-amber-700",
    closed:
      "border-slate-200 bg-slate-100 text-slate-600",
  };

  return (
    <main className="min-h-screen bg-[#f7f9fc] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* BREADCRUMB */}
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <Link
            href="/staff-dashboard"
            className="hover:text-slate-900"
          >
            Dashboard
          </Link>

          <span>/</span>

          <Link
            href="/staff-dashboard/assignments"
            className="hover:text-slate-900"
          >
            Assignments
          </Link>

          <span>/</span>

          <span className="text-slate-700">
            Details
          </span>
        </div>

        {/* HEADER */}
        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {assignment.courses && (
                  <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-600">
                    {assignment.courses.code}
                  </span>
                )}

                <span
                  className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${
                    statusStyles[assignment.status]
                  }`}
                >
                  {statusLabel(assignment.status)}
                </span>
              </div>

              <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {assignment.title}
              </h1>

              {assignment.courses && (
                <p className="mt-2 text-sm font-medium text-slate-500">
                  {assignment.courses.name}
                </p>
              )}

              <p className="mt-3 text-xs text-slate-400">
                Created{" "}
                {formatCreatedDate(assignment.created_at)}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href={`/staff-dashboard/assignments/${assignment.id}/submissions`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                View Submissions
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </Link>

              <Link
                href={`/staff-dashboard/assignments/${assignment.id}/edit`}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Edit
              </Link>
            </div>
          </div>
        </section>

        {/* ALERTS */}
        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
            {success}
          </div>
        )}

        {/* OVERVIEW */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <InfoCard
            label="Due Date"
            value={formatDate(assignment.due_date)}
            icon="calendar"
          />

          <InfoCard
            label="Maximum Score"
            value={String(assignment.max_score)}
            icon="score"
          />

          <InfoCard
            label="Submissions"
            value={String(submissions.length)}
            icon="users"
          />

          <InfoCard
            label="Graded"
            value={`${gradedCount}/${submissions.length}`}
            icon="check"
          />
        </section>

        {/* ASSIGNMENT CONTENT */}
        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-7">
            <h2 className="text-lg font-bold text-slate-900">
              Assignment Details
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              The information provided to students.
            </p>
          </div>

          <div className="space-y-8">
            {/* DESCRIPTION */}
            <div>
              <h3 className="text-sm font-bold text-slate-700">
                Description
              </h3>

              {assignment.description ? (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                  {assignment.description}
                </p>
              ) : (
                <p className="mt-3 text-sm italic text-slate-400">
                  No description provided.
                </p>
              )}
            </div>

            {/* INSTRUCTIONS */}
            <div>
              <h3 className="text-sm font-bold text-slate-700">
                Instructions
              </h3>

              {assignment.instructions ? (
                <div className="mt-3 rounded-2xl bg-slate-50 p-5">
                  <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">
                    {assignment.instructions}
                  </p>
                </div>
              ) : (
                <p className="mt-3 text-sm italic text-slate-400">
                  No additional instructions provided.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* SETTINGS */}
        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">
              Assignment Settings
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <SettingRow
              label="Course"
              value={
                assignment.courses
                  ? `${assignment.courses.code} — ${assignment.courses.name}`
                  : "Unknown course"
              }
            />

            <SettingRow
              label="Academic Session"
              value={session?.name || "Unknown session"}
            />

            <SettingRow
              label="Academic Term"
              value={
                term?.name
                  ? `${String(term.name)
                      .charAt(0)
                      .toUpperCase()}${String(
                      term.name
                    ).slice(1)} Term`
                  : "Unknown term"
              }
            />

            <SettingRow
              label="Submission Type"
              value={
                assignment.submission_type ||
                "Not specified"
              }
            />

            <SettingRow
              label="Maximum Score"
              value={String(assignment.max_score)}
            />

            <SettingRow
              label="Due Date"
              value={formatDate(assignment.due_date)}
            />
          </div>
        </section>

        {/* SUBMISSION SUMMARY */}
        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Submission Overview
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Track student submissions and grading.
              </p>
            </div>

            <Link
              href={`/staff-dashboard/assignments/${assignment.id}/submissions`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Manage Submissions
            </Link>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <MiniStat
              label="Total"
              value={submissions.length}
            />

            <MiniStat
              label="Awaiting Grading"
              value={submittedCount}
            />

            <MiniStat
              label="Graded"
              value={gradedCount}
            />
          </div>
        </section>

        {/* ACTIONS */}
        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-bold text-slate-900">
            Assignment Actions
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Manage the assignment lifecycle.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {assignment.status === "draft" && (
              <button
                type="button"
                onClick={publishAssignment}
                disabled={working}
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {working
                  ? "Publishing..."
                  : "Publish Assignment"}
              </button>
            )}

            {assignment.status === "published" && (
              <button
                type="button"
                onClick={closeAssignment}
                disabled={working}
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {working
                  ? "Closing..."
                  : "Close Assignment"}
              </button>
            )}

            <Link
              href={`/staff-dashboard/assignments/${assignment.id}/edit`}
              className="rounded-xl border border-slate-200 px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Edit Assignment
            </Link>

            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              disabled={working}
              className="rounded-xl border border-red-200 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
            >
              Delete Assignment
            </button>
          </div>
        </section>

        <div className="pb-8">
          <Link
            href="/staff-dashboard/assignments"
            className="text-sm font-semibold text-slate-500 hover:text-slate-900"
          >
            ← Back to Assignments
          </Link>
        </div>
      </div>

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-7">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <svg
                width="23"
                height="23"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M3 6h18" />
                <path d="M8 6V4h8v2" />
                <path d="M19 6l-1 15H6L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
              </svg>
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-900">
              Delete assignment?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              This will permanently remove{" "}
              <span className="font-semibold text-slate-700">
                &quot;{assignment.title}&quot;
              </span>
              . This action cannot be undone.
            </p>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setShowDeleteModal(false)
                }
                disabled={working}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={deleteAssignment}
                disabled={working}
                className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {working
                  ? "Deleting..."
                  : "Delete Assignment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// ======================================================
// INFO CARD
// ======================================================

function InfoCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: "calendar" | "score" | "users" | "check";
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {label}
          </p>

          <p className="mt-2 truncate text-lg font-bold text-slate-900">
            {value}
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          {icon === "calendar" && (
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <rect
                x="3"
                y="5"
                width="18"
                height="16"
                rx="2"
              />
              <path d="M16 3v4" />
              <path d="M8 3v4" />
              <path d="M3 10h18" />
            </svg>
          )}

          {icon === "score" && (
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M12 3 4 7v5c0 5 3.5 8 8 9 4.5-1 8-4 8-9V7l-8-4Z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          )}

          {icon === "users" && (
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
              <circle cx="9.5" cy="7" r="4" />
              <path d="M17 11a4 4 0 1 0 0-8" />
              <path d="M21 21v-2a4 4 0 0 0-3-3.87" />
            </svg>
          )}

          {icon === "check" && (
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="m8 12 2.5 2.5L16 9" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}

// ======================================================
// SETTING ROW
// ======================================================

function SettingRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-700">
        {value}
      </p>
    </div>
  );
}

// ======================================================
// MINI STAT
// ======================================================

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}