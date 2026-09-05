"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Course = {
  id: string;
  code: string;
  name: string;
};

type Assignment = {
  id: string;
  course_id: string;
  teacher_id: string;
  session_id: string;
  term_id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  due_date: string | null;
  max_score: number;
  status: "draft" | "published" | "closed";
  submission_type: "text" | "file" | "text_and_file";
  created_at: string;
  updated_at: string;
  courses:
    | Course
    | Course[]
    | null;
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

export default function EditAssignmentPage() {
  const params = useParams();
  const router = useRouter();

  const assignmentId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [staff, setStaff] = useState<Staff | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);

  const [session, setSession] = useState<Session | null>(null);
  const [term, setTerm] = useState<Term | null>(null);

  const [courses, setCourses] = useState<Course[]>([]);

  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [maxScore, setMaxScore] = useState("100");
  const [submissionType, setSubmissionType] = useState<
    "text" | "file" | "text_and_file"
  >("text");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const currentCourse = useMemo(() => {
    return courses.find((course) => course.id === courseId) || null;
  }, [courses, courseId]);

  async function loadAssignment() {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/staff-login");
        return;
      }

      // ----------------------------------------------------
      // STAFF
      // ----------------------------------------------------

      const { data: staffRecord, error: staffError } =
        await supabase
          .from("staff")
          .select(
            "id, user_id, staff_id, department, position, status"
          )
          .eq("user_id", user.id)
          .eq("status", "active")
          .maybeSingle();

      if (staffError) {
        throw new Error(
          staffError.message || "Unable to verify staff account."
        );
      }

      if (!staffRecord) {
        router.replace("/staff-login");
        return;
      }

      setStaff(staffRecord);

      // ----------------------------------------------------
      // ASSIGNMENT
      // ----------------------------------------------------

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
                code,
                name
              )
            `
          )
          .eq("id", assignmentId)
          .eq("teacher_id", staffRecord.id)
          .maybeSingle();

      if (assignmentError) {
        throw new Error(
          assignmentError.message ||
            "Unable to load assignment."
        );
      }

      if (!assignmentRecord) {
        throw new Error(
          "This assignment does not exist or you do not have permission to edit it."
        );
      }

      const typedAssignment =
        assignmentRecord as Assignment;

      setAssignment(typedAssignment);

      // ----------------------------------------------------
      // BASIC FORM VALUES
      // ----------------------------------------------------

      setCourseId(typedAssignment.course_id);
      setTitle(typedAssignment.title || "");
      setDescription(typedAssignment.description || "");
      setInstructions(typedAssignment.instructions || "");
      setMaxScore(String(typedAssignment.max_score ?? 100));

      setSubmissionType(
        typedAssignment.submission_type || "text"
      );

      // Convert database timestamp into datetime-local value
      if (typedAssignment.due_date) {
        const date = new Date(typedAssignment.due_date);

        if (!Number.isNaN(date.getTime())) {
          const localDate = new Date(
            date.getTime() -
              date.getTimezoneOffset() * 60000
          )
            .toISOString()
            .slice(0, 16);

          setDueDate(localDate);
        }
      }

      // ----------------------------------------------------
      // SESSION
      // ----------------------------------------------------

      const { data: sessionRecord, error: sessionError } =
        await supabase
          .from("academic_sessions")
          .select("id, name")
          .eq("id", typedAssignment.session_id)
          .maybeSingle();

      if (sessionError) {
        throw new Error(
          sessionError.message ||
            "Unable to load academic session."
        );
      }

      setSession(sessionRecord);

      // ----------------------------------------------------
      // TERM
      // ----------------------------------------------------

      const { data: termRecord, error: termError } =
        await supabase
          .from("academic_terms")
          .select("id, name")
          .eq("id", typedAssignment.term_id)
          .maybeSingle();

      if (termError) {
        throw new Error(
          termError.message ||
            "Unable to load academic term."
        );
      }

      setTerm(termRecord);

      // ----------------------------------------------------
      // ASSIGNED COURSES
      // ----------------------------------------------------

      const { data: courseAssignments, error: courseError } =
        await supabase
          .from("course_teachers")
          .select(
            `
              course_id,
              courses (
                id,
                code,
                name
              )
            `
          )
          .eq("teacher_id", staffRecord.id)
          .eq("session_id", typedAssignment.session_id)
          .eq("term_id", typedAssignment.term_id);

      if (courseError) {
        throw new Error(
          courseError.message ||
            "Unable to load assigned courses."
        );
      }

      const mappedCourses: Course[] = [];

      type CourseTeacherRow = {
        courses?: Course | Course[] | null;
      };

      (courseAssignments as CourseTeacherRow[] | null || []).forEach(
        (row) => {
          const course = Array.isArray(row.courses)
            ? row.courses[0]
            : row.courses;

          if (course) {
            const alreadyExists = mappedCourses.some(
              (item) => item.id === course.id
            );

            if (!alreadyExists) {
              mappedCourses.push(course);
            }
          }
        }
      );

      setCourses(mappedCourses);
    } catch (err: unknown) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading the assignment."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!assignment || !staff) return;

    setError("");
    setSuccess("");

    // ----------------------------------------------------
    // CLOSED ASSIGNMENTS CANNOT BE EDITED
    // ----------------------------------------------------

    if (assignment.status === "closed") {
      setError(
        "This assignment is closed and can no longer be edited."
      );
      return;
    }

    // ----------------------------------------------------
    // VALIDATION
    // ----------------------------------------------------

    const cleanTitle = title.trim();

    if (!cleanTitle) {
      setError("Please enter an assignment title.");
      return;
    }

    if (!courseId) {
      setError("Please select a course.");
      return;
    }

    const score = Number(maxScore);

    if (
      Number.isNaN(score) ||
      score <= 0
    ) {
      setError(
        "Maximum score must be greater than zero."
      );
      return;
    }

    // ----------------------------------------------------
    // VERIFY COURSE ASSIGNMENT
    // ----------------------------------------------------

    setSaving(true);

    try {
      const { data: courseAssignment, error: verifyError } =
        await supabase
          .from("course_teachers")
          .select("id")
          .eq("teacher_id", staff.id)
          .eq("course_id", courseId)
          .eq("session_id", assignment.session_id)
          .eq("term_id", assignment.term_id)
          .maybeSingle();

      if (verifyError) {
        throw new Error(
          verifyError.message ||
            "Unable to verify course assignment."
        );
      }

      if (!courseAssignment) {
        throw new Error(
          "You are not assigned to this course for this academic term."
        );
      }

      // ----------------------------------------------------
      // BUILD UPDATE
      // ----------------------------------------------------

      const updatePayload: Record<string, unknown> = {
        title: cleanTitle,
        description:
          description.trim() || null,
        instructions:
          instructions.trim() || null,
        due_date: dueDate
          ? new Date(dueDate).toISOString()
          : null,
        max_score: score,
        submission_type: submissionType,
        updated_at: new Date().toISOString(),
      };

      // Course can only be changed while assignment is draft.
      if (assignment.status === "draft") {
        updatePayload.course_id = courseId;
      }

      // ----------------------------------------------------
      // UPDATE
      // ----------------------------------------------------

      const { data: updatedAssignment, error: updateError } =
        await supabase
          .from("assignments")
          .update(updatePayload)
          .eq("id", assignment.id)
          .eq("teacher_id", staff.id)
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
                code,
                name
              )
            `
          )
          .single();

      if (updateError) {
        throw new Error(
          updateError.message ||
            "Unable to save assignment changes."
        );
      }

      setAssignment(updatedAssignment as Assignment);

      setSuccess(
        "Assignment changes saved successfully."
      );

      // Give user a moment to see success message
      setTimeout(() => {
        router.push(
          `/staff-dashboard/assignments/${assignment.id}`
        );
      }, 900);
    } catch (err: unknown) {
      console.error(err);

      setError(
        (err instanceof Error && err.message) ||
          "Something went wrong while saving changes."
      );
    } finally {
      setSaving(false);
    }
  }

  async function publishAssignment() {
    if (!assignment || !staff) return;

    if (assignment.status !== "draft") return;

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const { error: updateError } = await supabase
        .from("assignments")
        .update({
          status: "published",
          updated_at: new Date().toISOString(),
        })
        .eq("id", assignment.id)
        .eq("teacher_id", staff.id)
        .eq("status", "draft");

      if (updateError) {
        throw new Error(
          updateError.message ||
            "Unable to publish assignment."
        );
      }

      setSuccess(
        "Assignment updated and published successfully."
      );

      setTimeout(() => {
        router.push(
          `/staff-dashboard/assignments/${assignment.id}`
        );
      }, 900);
    } catch (err: unknown) {
      console.error(err);

      setError(
        err instanceof Error ? err.message :
          "Unable to publish assignment."
      );
    } finally {
      setSaving(false);
    }
  }

  // ----------------------------------------------------
  // LOADING
  // ----------------------------------------------------

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 h-6 w-40 animate-pulse rounded bg-slate-200" />

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 h-8 w-72 animate-pulse rounded bg-slate-200" />

            <div className="space-y-5">
              <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-32 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-32 animate-pulse rounded-xl bg-slate-100" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ----------------------------------------------------
  // ERROR
  // ----------------------------------------------------

  if (!assignment) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl">
              !
            </div>

            <h1 className="text-xl font-bold text-slate-900">
              Assignment unavailable
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {error ||
                "We could not find this assignment."}
            </p>

            <Link
              href="/staff-dashboard/assignments"
              className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Back to assignments
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const isClosed = assignment.status === "closed";
  const isPublished =
    assignment.status === "published";
  const isDraft = assignment.status === "draft";

  // ----------------------------------------------------
  // CLOSED VIEW
  // ----------------------------------------------------

  if (isClosed) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Link
            href={`/staff-dashboard/assignments/${assignment.id}`}
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            ← Back to assignment
          </Link>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-600">
                  Closed
                </span>

                <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                  {assignment.title}
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                  This assignment is closed and can no longer be edited.
                </p>
              </div>

              <Link
                href={`/staff-dashboard/assignments/${assignment.id}`}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                View Assignment
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ----------------------------------------------------
  // MAIN
  // ----------------------------------------------------

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-5xl">

        {/* HEADER */}
        <div className="mb-6">
          <Link
            href={`/staff-dashboard/assignments/${assignment.id}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
          >
            ← Back to assignment
          </Link>

          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                    isDraft
                      ? "bg-amber-50 text-amber-700"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {assignment.status}
                </span>

                {currentCourse && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                    {currentCourse.code}
                  </span>
                )}
              </div>

              <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                Edit Assignment
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Update the assignment details, instructions,
                submission settings and deadline.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Academic Period
              </p>

              <p className="mt-1 text-sm font-bold text-slate-800">
                {session?.name || "Academic Session"}
              </p>

              <p className="text-xs text-slate-500">
                {term?.name || "Academic Term"}
              </p>
            </div>
          </div>
        </div>

        {/* ALERTS */}

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {success}
          </div>
        )}

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* BASIC INFORMATION */}

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900">
                Assignment Information
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Provide the main details students will see.
              </p>
            </div>

            <div className="space-y-5">

              {/* COURSE */}

              <div>
                <label
                  htmlFor="course"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Course
                </label>

                <select
                  id="course"
                  value={courseId}
                  onChange={(e) =>
                    setCourseId(e.target.value)
                  }
                  disabled={isPublished}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  <option value="">
                    Select course
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

                {isPublished && (
                  <p className="mt-2 text-xs text-slate-400">
                    Course cannot be changed after publication.
                  </p>
                )}
              </div>

              {/* TITLE */}

              <div>
                <label
                  htmlFor="title"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Assignment Title
                </label>

                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) =>
                    setTitle(e.target.value)
                  }
                  placeholder="e.g. Introduction to Algebra"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              {/* DESCRIPTION */}

              <div>
                <label
                  htmlFor="description"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Description
                </label>

                <textarea
                  id="description"
                  rows={4}
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  placeholder="Briefly explain what this assignment is about..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              {/* INSTRUCTIONS */}

              <div>
                <label
                  htmlFor="instructions"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Instructions
                </label>

                <textarea
                  id="instructions"
                  rows={7}
                  value={instructions}
                  onChange={(e) =>
                    setInstructions(e.target.value)
                  }
                  placeholder="Give students clear instructions for completing the assignment..."
                  className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                />
              </div>
            </div>
          </section>

          {/* SUBMISSION SETTINGS */}

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900">
                Submission Settings
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Control how students submit their work.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">

              {/* MAX SCORE */}

              <div>
                <label
                  htmlFor="maxScore"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Maximum Score
                </label>

                <input
                  id="maxScore"
                  type="number"
                  min="1"
                  step="0.01"
                  value={maxScore}
                  onChange={(e) =>
                    setMaxScore(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              {/* DUE DATE */}

              <div>
                <label
                  htmlFor="dueDate"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Due Date & Time
                </label>

                <input
                  id="dueDate"
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) =>
                    setDueDate(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                />
              </div>
            </div>

            {/* SUBMISSION TYPE */}

            <div className="mt-5">
              <label className="mb-3 block text-sm font-bold text-slate-700">
                Submission Type
              </label>

              <div className="grid gap-3 sm:grid-cols-3">

                {/* TEXT */}

                <label
                  className={`cursor-pointer rounded-2xl border p-4 transition ${
                    submissionType === "text"
                      ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="submissionType"
                    value="text"
                    checked={
                      submissionType === "text"
                    }
                    onChange={() =>
                      setSubmissionType("text")
                    }
                    className="sr-only"
                  />

                  <div className="text-sm font-bold text-slate-900">
                    Text
                  </div>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Students submit written responses.
                  </p>
                </label>

                {/* FILE */}

                <label
                  className={`cursor-pointer rounded-2xl border p-4 transition ${
                    submissionType === "file"
                      ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="submissionType"
                    value="file"
                    checked={
                      submissionType === "file"
                    }
                    onChange={() =>
                      setSubmissionType("file")
                    }
                    className="sr-only"
                  />

                  <div className="text-sm font-bold text-slate-900">
                    File
                  </div>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Students upload a file.
                  </p>
                </label>

                {/* BOTH */}

                <label
                  className={`cursor-pointer rounded-2xl border p-4 transition ${
                    submissionType ===
                    "text_and_file"
                      ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="submissionType"
                    value="text_and_file"
                    checked={
                      submissionType ===
                      "text_and_file"
                    }
                    onChange={() =>
                      setSubmissionType(
                        "text_and_file"
                      )
                    }
                    className="sr-only"
                  />

                  <div className="text-sm font-bold text-slate-900">
                    Text + File
                  </div>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Students can submit both.
                  </p>
                </label>
              </div>
            </div>
          </section>

          {/* STATUS INFORMATION */}

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Assignment Status
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {isDraft
                    ? "This assignment is still a draft. Students cannot access it until you publish it."
                    : "This assignment is published and visible to students."}
                </p>
              </div>

              <span
                className={`inline-flex w-fit rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide ${
                  isDraft
                    ? "bg-amber-50 text-amber-700"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {assignment.status}
              </span>
            </div>
          </section>

          {/* ACTIONS */}

          <div className="sticky bottom-4 z-10">
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur sm:flex-row sm:items-center sm:justify-between">

              <Link
                href={`/staff-dashboard/assignments/${assignment.id}`}
                className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Cancel
              </Link>

              <div className="flex flex-col gap-2 sm:flex-row">

                {isDraft && (
                  <button
                    type="button"
                    onClick={publishAssignment}
                    disabled={saving}
                    className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving
                      ? "Publishing..."
                      : "Save & Publish"}
                  </button>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}