"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Assignment = {
  id: string;
  course_id: string;
  teacher_id: string;
  session_id: string;
  term_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  max_score: number;
  status: "draft" | "published" | "closed";
  submission_type: "text" | "file" | "text_and_file";
  courses:
    | {
        id: string;
        code: string;
        name: string;
      }
    | {
        id: string;
        code: string;
        name: string;
      }[]
    | null;
};

type Student = {
  id: string;
  student_id: string | null;
  admission_number: string | null;
  full_name: string;
  class_id: string | null;
  status: string;
};

type Submission = {
  id: string;
  assignment_id: string;
  student_id: string;
  content: string | null;
  file_url: string | null;
  score: number | null;
  feedback: string | null;
  status: "submitted" | "graded" | "late";
  submitted_at: string;
  graded_at: string | null;
  graded_by: string | null;
  students:
    | Student
    | Student[]
    | null;
};

type SubmissionForm = {
  score: string;
  feedback: string;
};

export default function AssignmentSubmissionsPage() {
  const params = useParams();
  const router = useRouter();

  const assignmentId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [assignment, setAssignment] =
    useState<Assignment | null>(null);

  const [submissions, setSubmissions] =
    useState<Submission[]>([]);

  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);

  const [forms, setForms] = useState<
    Record<string, SubmissionForm>
  >({});

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"all" | "submitted" | "graded" | "late">(
      "all"
    );

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadPage = useCallback(async () => {
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
      // VERIFY STAFF
      // ----------------------------------------------------

      const { data: staff, error: staffError } =
        await supabase
          .from("staff")
          .select("id, user_id, status")
          .eq("user_id", user.id)
          .eq("status", "active")
          .maybeSingle();

      if (staffError) {
        throw new Error(
          staffError.message ||
            "Unable to verify staff account."
        );
      }

      if (!staff) {
        router.replace("/staff-login");
        return;
      }

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
              due_date,
              max_score,
              status,
              submission_type,
              courses (
                id,
                code,
                name
              )
            `
          )
          .eq("id", assignmentId)
          .eq("teacher_id", staff.id)
          .maybeSingle();

      if (assignmentError) {
        throw new Error(
          assignmentError.message ||
            "Unable to load assignment."
        );
      }

      if (!assignmentRecord) {
        throw new Error(
          "Assignment not found or you do not have permission to view its submissions."
        );
      }

      setAssignment(
        assignmentRecord as Assignment
      );

      // ----------------------------------------------------
      // SUBMISSIONS
      // ----------------------------------------------------

      const { data: submissionRecords, error: submissionError } =
        await supabase
          .from("submissions")
          .select(
            `
              id,
              assignment_id,
              student_id,
              content,
              file_url,
              score,
              feedback,
              status,
              submitted_at,
              graded_at,
              graded_by,
              students (
                id,
                student_id,
                admission_number,
                full_name,
                class_id,
                status
              )
            `
          )
          .eq("assignment_id", assignmentId)
          .order("submitted_at", {
            ascending: false,
          });

      if (submissionError) {
        throw new Error(
          submissionError.message ||
            "Unable to load submissions."
        );
      }

      const normalized =
        (submissionRecords || []).map(
          (submission: unknown) => {
            const record = submission as Record<
              string,
              unknown
            >;

            return {
              ...record,
              students: Array.isArray(
                record.students
              )
                ? record.students[0] || null
                : record.students,
            };
          }
        ) as Submission[];

      setSubmissions(normalized);

      // ----------------------------------------------------
      // FORM STATE
      // ----------------------------------------------------

      const formState: Record<
        string,
        SubmissionForm
      > = {};

      normalized.forEach((submission) => {
        formState[submission.id] = {
          score:
            submission.score !== null &&
            submission.score !== undefined
              ? String(submission.score)
              : "",
          feedback: submission.feedback || "",
        };
      });

      setForms(formState);
    } catch (err: unknown) {
      console.error(err);

      setError(
        (err as { message?: string })?.message ||
          "Something went wrong while loading submissions."
      );
    } finally {
      setLoading(false);
    }
  }, [assignmentId, router, supabase]);

  useEffect(() => {
    if (!assignmentId) return;

    const timer = window.setTimeout(() => {
      void loadPage();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [assignmentId, loadPage]);

  // ----------------------------------------------------
  // COURSE HELPER
  // ----------------------------------------------------

  function getCourse() {
    if (!assignment) return null;

    return Array.isArray(assignment.courses)
      ? assignment.courses[0] || null
      : assignment.courses;
  }

  // ----------------------------------------------------
  // UPDATE FORM
  // ----------------------------------------------------

  function updateForm(
    submissionId: string,
    field: keyof SubmissionForm,
    value: string
  ) {
    setForms((current) => ({
      ...current,
      [submissionId]: {
        ...current[submissionId],
        [field]: value,
      },
    }));
  }

  // ----------------------------------------------------
  // FILTERED SUBMISSIONS
  // ----------------------------------------------------

  const filteredSubmissions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return submissions.filter((submission) => {
      const student = Array.isArray(
        submission.students
      )
        ? submission.students[0]
        : submission.students;

      const matchesSearch =
        !query ||
        student?.full_name
          ?.toLowerCase()
          .includes(query) ||
        student?.student_id
          ?.toLowerCase()
          .includes(query) ||
        student?.admission_number
          ?.toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        submission.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [
    submissions,
    search,
    statusFilter,
  ]);

  // ----------------------------------------------------
  // STATS
  // ----------------------------------------------------

  const totalSubmissions =
    submissions.length;

  const gradedSubmissions =
    submissions.filter(
      (submission) =>
        submission.status === "graded"
    ).length;

  const pendingSubmissions =
    submissions.filter(
      (submission) =>
        submission.status !== "graded"
    ).length;

  const lateSubmissions =
    submissions.filter(
      (submission) =>
        submission.status === "late"
    ).length;

  // ----------------------------------------------------
  // SAVE GRADE
  // ----------------------------------------------------

  async function saveGrade(
    event: FormEvent<HTMLFormElement>,
    submission: Submission
  ) {
    event.preventDefault();

    if (!assignment) return;

    setError("");
    setSuccess("");

    const form = forms[submission.id];

    if (!form) {
      setError("Unable to read grading form.");
      return;
    }

    const score = Number(form.score);

    if (
      form.score.trim() === "" ||
      Number.isNaN(score)
    ) {
      setError("Please enter a valid score.");
      return;
    }

    if (score < 0) {
      setError(
        "Score cannot be less than zero."
      );
      return;
    }

    if (score > Number(assignment.max_score)) {
      setError(
        `Score cannot be greater than ${assignment.max_score}.`
      );
      return;
    }

    setSaving(true);

    try {
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

      const { data: staff, error: staffError } =
        await supabase
          .from("staff")
          .select("id, status")
          .eq("user_id", user.id)
          .eq("status", "active")
          .maybeSingle();

      if (staffError) {
        throw new Error(
          staffError.message ||
            "Unable to verify staff account."
        );
      }

      if (!staff) {
        router.replace("/staff-login");
        return;
      }

      // ----------------------------------------------------
      // UPDATE SUBMISSION
      // ----------------------------------------------------

      const now = new Date().toISOString();

      const { data: updatedSubmission, error: updateError } =
        await supabase
          .from("submissions")
          .update({
            score,
            feedback:
              form.feedback.trim() || null,
            status: "graded",
            graded_at: now,
            graded_by: staff.id,
          })
          .eq("id", submission.id)
          .eq("assignment_id", assignment.id)
          .select(
            `
              id,
              assignment_id,
              student_id,
              content,
              file_url,
              score,
              feedback,
              status,
              submitted_at,
              graded_at,
              graded_by,
              students (
                id,
                student_id,
                admission_number,
                full_name,
                class_id,
                status
              )
            `
          )
          .single();

      if (updateError) {
        throw new Error(
          updateError.message ||
            "Unable to save grade."
        );
      }

      const submissionWithStudents = updatedSubmission as Omit<
        Submission,
        "students"
      > & {
        students: Student | Student[] | null;
      };

      const normalized =
        {
          ...updatedSubmission,
          students: Array.isArray(
            submissionWithStudents.students
          )
            ? submissionWithStudents.students[0] ||
              null
            : submissionWithStudents.students,
        } as Submission;

      setSubmissions((current) =>
        current.map((item) =>
          item.id === normalized.id
            ? normalized
            : item
        )
      );

      setSelectedSubmission(normalized);

      setSuccess(
        "Grade and feedback saved successfully."
      );
    } catch (err: unknown) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save grade."
      );
    } finally {
      setSaving(false);
    }
  }

  // ----------------------------------------------------
  // FORMAT DATE
  // ----------------------------------------------------

  function formatDate(
    value: string | null
  ) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleString([], {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // ----------------------------------------------------
  // STATUS BADGE
  // ----------------------------------------------------

  function statusBadge(
    status: Submission["status"]
  ) {
    if (status === "graded") {
      return "bg-emerald-50 text-emerald-700";
    }

    if (status === "late") {
      return "bg-red-50 text-red-700";
    }

    return "bg-amber-50 text-amber-700";
  }

  // ----------------------------------------------------
  // LOADING
  // ----------------------------------------------------

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 h-5 w-40 animate-pulse rounded bg-slate-200" />

          <div className="mb-6 h-10 w-80 animate-pulse rounded bg-slate-200" />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="h-28 animate-pulse rounded-2xl bg-slate-200"
                />
              )
            )}
          </div>

          <div className="mt-6 h-96 animate-pulse rounded-3xl bg-slate-200" />
        </div>
      </main>
    );
  }

  // ----------------------------------------------------
  // ERROR / NO ASSIGNMENT
  // ----------------------------------------------------

  if (!assignment) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl font-bold text-red-600">
              !
            </div>

            <h1 className="text-xl font-black text-slate-900">
              Unable to open submissions
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {error ||
                "This assignment could not be found."}
            </p>

            <Link
              href="/staff-dashboard/assignments"
              className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800"
            >
              Back to assignments
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const course = getCourse();

  // ----------------------------------------------------
  // MAIN
  // ----------------------------------------------------

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="mb-6">
          <Link
            href={`/staff-dashboard/assignments/${assignment.id}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
          >
            ← Back to assignment
          </Link>

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {course && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                    {course.code}
                  </span>
                )}

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                    assignment.status ===
                    "published"
                      ? "bg-emerald-50 text-emerald-700"
                      : assignment.status ===
                        "closed"
                      ? "bg-slate-100 text-slate-600"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {assignment.status}
                </span>
              </div>

              <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                {assignment.title}
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Submission & grading workspace
              </p>
            </div>

            <Link
              href={`/staff-dashboard/assignments/${assignment.id}`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Assignment Details
            </Link>
          </div>
        </div>

        {/* ALERTS */}

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {success}
          </div>
        )}

        {/* STATS */}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Submissions
            </p>

            <p className="mt-2 text-3xl font-black text-slate-900">
              {totalSubmissions}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Total received
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Graded
            </p>

            <p className="mt-2 text-3xl font-black text-emerald-700">
              {gradedSubmissions}
            </p>

            <p className="mt-1 text-xs text-emerald-600">
              Successfully graded
            </p>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-600">
              Pending
            </p>

            <p className="mt-2 text-3xl font-black text-amber-700">
              {pendingSubmissions}
            </p>

            <p className="mt-1 text-xs text-amber-600">
              Need grading
            </p>
          </div>

          <div className="rounded-2xl border border-red-100 bg-red-50/60 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-red-600">
              Late
            </p>

            <p className="mt-2 text-3xl font-black text-red-700">
              {lateSubmissions}
            </p>

            <p className="mt-1 text-xs text-red-600">
              Submitted late
            </p>
          </div>
        </div>

        {/* FILTER BAR */}

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search student name, student ID or admission number..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as
                    | "all"
                    | "submitted"
                    | "graded"
                    | "late"
                )
              }
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-slate-400 focus:bg-white"
            >
              <option value="all">
                All submissions
              </option>
              <option value="submitted">
                Pending
              </option>
              <option value="graded">
                Graded
              </option>
              <option value="late">
                Late
              </option>
            </select>
          </div>
        </div>

        {/* SUBMISSIONS */}

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">

          {/* LIST */}

          <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-bold text-slate-900">
                    Student Submissions
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    {filteredSubmissions.length}{" "}
                    submission
                    {filteredSubmissions.length === 1
                      ? ""
                      : "s"}{" "}
                    shown
                  </p>
                </div>
              </div>
            </div>

            {filteredSubmissions.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-xl">
                  ○
                </div>

                <h3 className="font-bold text-slate-900">
                  No submissions found
                </h3>

                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  {submissions.length === 0
                    ? "Students have not submitted this assignment yet."
                    : "Try changing your search or status filter."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredSubmissions.map(
                  (submission) => {
                    const student = Array.isArray(
                      submission.students
                    )
                      ? submission.students[0]
                      : submission.students;

                    const form =
                      forms[submission.id];

                    const isSelected =
                      selectedSubmission?.id ===
                      submission.id;

                    return (
                      <button
                        key={submission.id}
                        type="button"
                        onClick={() =>
                          setSelectedSubmission(
                            submission
                          )
                        }
                        className={`w-full text-left transition hover:bg-slate-50 ${
                          isSelected
                            ? "bg-slate-50"
                            : ""
                        }`}
                      >
                        <div className="p-5 sm:px-6">
                          <div className="flex gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-black text-white">
                              {student?.full_name
                                ?.charAt(0)
                                ?.toUpperCase() ||
                                "S"}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                  <h3 className="truncate font-bold text-slate-900">
                                    {student?.full_name ||
                                      "Unknown Student"}
                                  </h3>

                                  <p className="mt-1 text-xs text-slate-500">
                                    {student?.student_id ||
                                      student?.admission_number ||
                                      "Student record"}
                                  </p>
                                </div>

                                <span
                                  className={`w-fit rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${statusBadge(
                                    submission.status
                                  )}`}
                                >
                                  {submission.status ===
                                  "submitted"
                                    ? "Pending"
                                    : submission.status}
                                </span>
                              </div>

                              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
                                <span>
                                  Submitted{" "}
                                  {formatDate(
                                    submission.submitted_at
                                  )}
                                </span>

                                <span className="font-bold text-slate-700">
                                  {form?.score
                                    ? `${form.score} / ${assignment.max_score}`
                                    : `— / ${assignment.max_score}`}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            )}
          </section>

          {/* GRADING PANEL */}

          <aside className="xl:sticky xl:top-6 xl:self-start">
            {!selectedSubmission ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-xl">
                  ✓
                </div>

                <h3 className="font-bold text-slate-900">
                  Select a submission
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Choose a student&apos;s submission from
                  the list to review their work and
                  enter a grade.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

                {/* STUDENT HEADER */}

                <div className="border-b border-slate-100 bg-slate-50 p-5">
                  {(() => {
                    const student =
                      Array.isArray(
                        selectedSubmission.students
                      )
                        ? selectedSubmission
                            .students[0]
                        : selectedSubmission.students;

                    return (
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-sm font-black text-white">
                          {student?.full_name
                            ?.charAt(0)
                            ?.toUpperCase() ||
                            "S"}
                        </div>

                        <div className="min-w-0">
                          <h2 className="truncate font-black text-slate-900">
                            {student?.full_name ||
                              "Unknown Student"}
                          </h2>

                          <p className="mt-1 text-xs text-slate-500">
                            {student?.student_id ||
                              student?.admission_number ||
                              "Student"}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* SUBMISSION CONTENT */}

                <div className="max-h-130 overflow-y-auto p-5">

                  <div className="mb-5">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-bold text-slate-900">
                        Student Work
                      </h3>

                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${statusBadge(
                          selectedSubmission.status
                        )}`}
                      >
                        {selectedSubmission.status ===
                        "submitted"
                          ? "Pending"
                          : selectedSubmission.status}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-slate-400">
                      Submitted{" "}
                      {formatDate(
                        selectedSubmission.submitted_at
                      )}
                    </p>
                  </div>

                  {/* TEXT */}

                  {selectedSubmission.content ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                        {selectedSubmission.content}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
                      <p className="text-sm text-slate-500">
                        No written response was submitted.
                      </p>
                    </div>
                  )}

                  {/* FILE */}

                  {selectedSubmission.file_url && (
                    <div className="mt-4 rounded-2xl border border-slate-200 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Attached File
                      </p>

                      <a
                        href={
                          selectedSubmission.file_url
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
                      >
                        Open Submission File
                      </a>
                    </div>
                  )}
                </div>

                {/* GRADING FORM */}

                <form
                  onSubmit={(event) =>
                    saveGrade(
                      event,
                      selectedSubmission
                    )
                  }
                  className="border-t border-slate-100 p-5"
                >
                  <div className="grid grid-cols-[1fr_auto] items-end gap-3">
                    <div>
                      <label
                        htmlFor={`score-${selectedSubmission.id}`}
                        className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500"
                      >
                        Score
                      </label>

                      <input
                        id={`score-${selectedSubmission.id}`}
                        type="number"
                        min="0"
                        max={assignment.max_score}
                        step="0.01"
                        value={
                          forms[
                            selectedSubmission.id
                          ]?.score || ""
                        }
                        onChange={(event) =>
                          updateForm(
                            selectedSubmission.id,
                            "score",
                            event.target.value
                          )
                        }
                        placeholder="0"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-lg font-black text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                      />
                    </div>

                    <div className="pb-3 text-sm font-bold text-slate-400">
                      / {assignment.max_score}
                    </div>
                  </div>

                  <div className="mt-4">
                    <label
                      htmlFor={`feedback-${selectedSubmission.id}`}
                      className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500"
                    >
                      Feedback
                    </label>

                    <textarea
                      id={`feedback-${selectedSubmission.id}`}
                      rows={5}
                      value={
                        forms[
                          selectedSubmission.id
                        ]?.feedback || ""
                      }
                      onChange={(event) =>
                        updateForm(
                          selectedSubmission.id,
                          "feedback",
                          event.target.value
                        )
                      }
                      placeholder="Write feedback for the student..."
                      className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="mt-4 w-full rounded-xl bg-slate-900 px-5 py-3.5 text-sm font-black text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving
                      ? "Saving Grade..."
                      : selectedSubmission.status ===
                        "graded"
                      ? "Update Grade"
                      : "Save Grade"}
                  </button>
                </form>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}