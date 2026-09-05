"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Course = {
  id: string;
  name: string;
  code: string;
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

export default function CreateAssignmentPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [staff, setStaff] = useState<Staff | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [term, setTerm] = useState<Term | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);

  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [maxScore, setMaxScore] = useState("100");
  const [submissionType, setSubmissionType] = useState("text");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadForm = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Your session has expired. Please sign in again.");
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
      // CURRENT SESSION
      // ---------------------------------------------

      const { data: sessionRecord, error: sessionError } =
        await supabase
          .from("academic_sessions")
          .select("id, name")
          .eq("is_current", true)
          .maybeSingle();

      if (sessionError) throw sessionError;

      if (!sessionRecord) {
        setError(
          "No current academic session has been configured."
        );
        return;
      }

      setSession(sessionRecord);

      // ---------------------------------------------
      // CURRENT TERM
      // ---------------------------------------------

      const { data: termRecord, error: termError } =
        await supabase
          .from("academic_terms")
          .select("id, name")
          .eq("session_id", sessionRecord.id)
          .eq("is_current", true)
          .maybeSingle();

      if (termError) throw termError;

      if (!termRecord) {
        setError(
          "No current academic term has been configured."
        );
        return;
      }

      setTerm(termRecord);

      // ---------------------------------------------
      // TEACHER COURSES
      // ---------------------------------------------

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

      if (coursesError) throw coursesError;

      const normalizedCourses: Course[] = [];

      (teacherCourses || []).forEach((item) => {
        const course = Array.isArray(item.courses)
          ? item.courses[0]
          : item.courses;

        if (course) {
          normalizedCourses.push(course);
        }
      });

      setCourses(normalizedCourses);

      if (normalizedCourses.length > 0) {
        setCourseId(normalizedCourses[0].id);
      }
    } catch (err: unknown) {
      console.error(err);

      setError(
        (err instanceof Error ? err.message : undefined) ||
          "Something went wrong while loading the assignment form."
      );
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadForm();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadForm]);

  // ---------------------------------------------
  // SAVE ASSIGNMENT
  // ---------------------------------------------

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
    status: "draft" | "published"
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!staff || !session || !term) {
      setError(
        "Your staff session is incomplete. Please reload the page."
      );
      return;
    }

    if (!courseId) {
      setError("Please select a course.");
      return;
    }

    if (!title.trim()) {
      setError("Please enter an assignment title.");
      return;
    }

    const score = Number(maxScore);

    if (!Number.isFinite(score) || score <= 0) {
      setError("Maximum score must be greater than 0.");
      return;
    }

    try {
      setSaving(true);

      // ---------------------------------------------
      // VERIFY TEACHER COURSE ASSIGNMENT
      // ---------------------------------------------

      const { data: assignmentCheck, error: checkError } =
        await supabase
          .from("course_teachers")
          .select("id")
          .eq("teacher_id", staff.id)
          .eq("course_id", courseId)
          .eq("session_id", session.id)
          .eq("term_id", term.id)
          .maybeSingle();

      if (checkError) throw checkError;

      if (!assignmentCheck) {
        setError(
          "You are not assigned to this course for the current term."
        );
        return;
      }

      // ---------------------------------------------
      // INSERT
      // ---------------------------------------------

      const { data, error: insertError } = await supabase
        .from("assignments")
        .insert({
          course_id: courseId,
          teacher_id: staff.id,
          session_id: session.id,
          term_id: term.id,
          title: title.trim(),
          description: description.trim() || null,
          instructions: instructions.trim() || null,
          due_date: dueDate
            ? new Date(dueDate).toISOString()
            : null,
          max_score: score,
          status,
          submission_type: submissionType,
        })
        .select("id")
        .single();

      if (insertError) throw insertError;

      setSuccess(
        status === "published"
          ? "Assignment published successfully."
          : "Assignment saved as a draft."
      );

      // Small delay so the success state is visible.
      setTimeout(() => {
        router.push(
          `/staff-dashboard/assignments/${data.id}`
        );
      }, 700);
    } catch (err: unknown) {
      console.error("Create assignment error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to create the assignment. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  // ---------------------------------------------
  // LOADING
  // ---------------------------------------------

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f9fc] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-64 rounded-lg bg-slate-200" />
            <div className="h-4 w-80 rounded bg-slate-200" />

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="space-y-5">
                <div className="h-12 rounded-xl bg-slate-100" />
                <div className="h-12 rounded-xl bg-slate-100" />
                <div className="h-32 rounded-xl bg-slate-100" />
                <div className="h-32 rounded-xl bg-slate-100" />
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ---------------------------------------------
  // ERROR
  // ---------------------------------------------

  if (error && (!staff || !session || !term)) {
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
              Unable to create assignment
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {error}
            </p>

            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={loadForm}
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

  // ---------------------------------------------
  // MAIN
  // ---------------------------------------------

  return (
    <main className="min-h-screen bg-[#f7f9fc] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* HEADER */}
        <div className="mb-6">
          <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
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
              Create
            </span>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Create Assignment
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Create an assignment for one of your assigned
                courses.
              </p>
            </div>

            {session && term && (
              <div className="text-left sm:text-right">
                <p className="text-xs font-semibold text-slate-400">
                  Academic Period
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {session.name}
                </p>

                <p className="text-xs capitalize text-slate-500">
                  {String(term.name)} Term
                </p>
              </div>
            )}
          </div>
        </div>

        {/* FORM */}
        <form className="space-y-6">
          {/* GENERAL INFORMATION */}
          <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900">
                Assignment Information
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Basic information students will see.
              </p>
            </div>

            <div className="space-y-5">
              {/* COURSE */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Course
                </label>

                {courses.length === 0 ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    You currently have no courses assigned to
                    you for this academic term.
                  </div>
                ) : (
                  <select
                    value={courseId}
                    onChange={(event) =>
                      setCourseId(event.target.value)
                    }
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-slate-500"
                  >
                    {courses.map((course) => (
                      <option
                        key={course.id}
                        value={course.id}
                      >
                        {course.code} — {course.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* TITLE */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Assignment Title
                </label>

                <input
                  type="text"
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  placeholder="e.g. Introduction to Algebra"
                  maxLength={150}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500"
                />
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Description
                  <span className="ml-2 font-normal text-slate-400">
                    Optional
                  </span>
                </label>

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  placeholder="Give students a short description of this assignment..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500"
                />
              </div>

              {/* INSTRUCTIONS */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Instructions
                  <span className="ml-2 font-normal text-slate-400">
                    Optional
                  </span>
                </label>

                <textarea
                  value={instructions}
                  onChange={(event) =>
                    setInstructions(event.target.value)
                  }
                  placeholder="Provide detailed instructions for completing the assignment..."
                  rows={7}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500"
                />
              </div>
            </div>
          </section>

          {/* SETTINGS */}
          <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900">
                Assignment Settings
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Configure scoring, submission and deadline.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {/* DUE DATE */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Due Date
                  <span className="ml-2 font-normal text-slate-400">
                    Optional
                  </span>
                </label>

                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(event) =>
                    setDueDate(event.target.value)
                  }
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none focus:border-slate-500"
                />
              </div>

              {/* MAX SCORE */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Maximum Score
                </label>

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={maxScore}
                  onChange={(event) =>
                    setMaxScore(event.target.value)
                  }
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none focus:border-slate-500"
                />
              </div>

              {/* SUBMISSION TYPE */}
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Submission Type
                </label>

                <div className="grid gap-3 sm:grid-cols-3">
                  <SubmissionOption
                    value="text"
                    title="Text"
                    description="Students submit written answers."
                    selected={
                      submissionType === "text"
                    }
                    onClick={() =>
                      setSubmissionType("text")
                    }
                  />

                  <SubmissionOption
                    value="file"
                    title="File Upload"
                    description="Students upload a document."
                    selected={
                      submissionType === "file"
                    }
                    onClick={() =>
                      setSubmissionType("file")
                    }
                  />

                  <SubmissionOption
                    value="text_and_file"
                    title="Text + File"
                    description="Students can submit both."
                    selected={
                      submissionType ===
                      "text_and_file"
                    }
                    onClick={() =>
                      setSubmissionType(
                        "text_and_file"
                      )
                    }
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ALERT */}
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

          {/* ACTIONS */}
          <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Link
                href="/staff-dashboard/assignments"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </Link>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  disabled={
                    saving || courses.length === 0
                  }
                  onClick={(event) =>
                    handleSubmit(
                      event as unknown as FormEvent<HTMLFormElement>,
                      "draft"
                    )
                  }
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-300 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Draft"}
                </button>

                <button
                  type="button"
                  disabled={
                    saving || courses.length === 0
                  }
                  onClick={(event) =>
                    handleSubmit(
                      event as unknown as FormEvent<HTMLFormElement>,
                      "published"
                    )
                  }
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-slate-900 px-6 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Publishing..."
                    : "Publish Assignment"}
                </button>
              </div>
            </div>
          </section>
        </form>
      </div>
    </main>
  );
}

// ======================================================
// SUBMISSION OPTION
// ======================================================

function SubmissionOption({
  value,
  title,
  description,
  selected,
  onClick,
}: {
  value: string;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition ${
        selected
          ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-900">
            {title}
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>

        <div
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
            selected
              ? "border-slate-900 bg-slate-900"
              : "border-slate-300"
          }`}
        >
          {selected && (
            <span className="h-2 w-2 rounded-full bg-white" />
          )}
        </div>
      </div>
    </button>
  );
}