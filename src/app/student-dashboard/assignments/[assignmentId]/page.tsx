"use client";

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Paperclip,
  Send,
  Trophy,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useParams } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

const SCHOOL_BLUE = "#010066";
const SCHOOL_BLUE_DARK = "#00004D";
const SCHOOL_GOLD = "#FFAF2E";

type SubmissionType = "text" | "file" | "text_and_file";

type Course = {
  id: string;
  code: string;
  name: string;
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
  status: string;
  created_at: string;
  updated_at: string;
  submission_type: string | null;
  course: Course | Course[] | null;
};

type Submission = {
  id: string;
  assignment_id: string;
  student_id: string;
  content: string | null;
  file_url: string | null;
  score: number | null;
  feedback: string | null;
  status: string;
  submitted_at: string;
  graded_at: string | null;
  graded_by: string | null;
};

export default function StudentAssignmentDetailsPage() {
  const params = useParams();
  const assignmentId = params.assignmentId as string;

  const supabase = useMemo(() => createClient(), []);

  const [assignment, setAssignment] =
    useState<Assignment | null>(null);

  const [submission, setSubmission] =
    useState<Submission | null>(null);

  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFile, setUploadingFile] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState<string | null>(null);

  const [currentTime] =
    useState(() => Date.now());

  /* =====================================================
     COURSE NORMALIZATION
  ====================================================== */

  const getCourse = (
    course: Assignment["course"],
  ): Course | null => {
    if (Array.isArray(course)) {
      return course[0] ?? null;
    }

    return course;
  };

  /* =====================================================
     SUBMISSION TYPE
  ====================================================== */

  const getSubmissionType = (
    type: string | null | undefined,
  ): SubmissionType => {
    if (type === "file") {
      return "file";
    }

    if (
      type === "text_and_file" ||
      type === "text+file" ||
      type === "both"
    ) {
      return "text_and_file";
    }

    return "text";
  };

  /* =====================================================
     LOAD ASSIGNMENT
  ====================================================== */

  const loadAssignment = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      /* -------------------------------------------------
         GET AUTHENTICATED USER
      -------------------------------------------------- */

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw new Error(authError.message);
      }

      if (!user) {
        throw new Error("You are not logged in.");
      }

      /* -------------------------------------------------
         GET STUDENT
      -------------------------------------------------- */

      const { data: student, error: studentError } =
        await supabase
          .from("students")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

      if (studentError) {
        throw new Error(
          `Unable to load student record: ${studentError.message}`,
        );
      }

      if (!student) {
        throw new Error(
          "Your student record could not be found.",
        );
      }

      /* -------------------------------------------------
         GET ASSIGNMENT
      -------------------------------------------------- */

      const {
        data: assignmentData,
        error: assignmentError,
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
            created_at,
            updated_at,
            submission_type,
            course:courses (
              id,
              code,
              name
            )
          `,
        )
        .eq("id", assignmentId)
        .maybeSingle();

      if (assignmentError) {
        throw new Error(
          `Unable to load assignment: ${assignmentError.message}`,
        );
      }

      if (!assignmentData) {
        throw new Error(
          "This assignment could not be found.",
        );
      }

      /* -------------------------------------------------
         VERIFY COURSE REGISTRATION
      -------------------------------------------------- */

      const {
        data: registration,
        error: registrationError,
      } = await supabase
        .from("course_registrations")
        .select("id")
        .eq("student_id", student.id)
        .eq("course_id", assignmentData.course_id)
        .eq("session_id", assignmentData.session_id)
        .eq("term_id", assignmentData.term_id)
        .maybeSingle();

      if (registrationError) {
        throw new Error(
          `Unable to verify course registration: ${registrationError.message}`,
        );
      }

      if (!registration) {
        throw new Error(
          "You are not registered for the course associated with this assignment.",
        );
      }

      /* -------------------------------------------------
         GET EXISTING SUBMISSION
      -------------------------------------------------- */

      const {
        data: submissionData,
        error: submissionError,
      } = await supabase
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
            graded_by
          `,
        )
        .eq("assignment_id", assignmentId)
        .eq("student_id", student.id)
        .maybeSingle();

      if (submissionError) {
        throw new Error(
          `Unable to load your submission: ${submissionError.message}`,
        );
      }

      setAssignment(assignmentData);
      setSubmission(submissionData ?? null);

      if (submissionData?.content) {
        setContent(submissionData.content);
      }
    } catch (err) {
      console.error(
        "Assignment details error:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load assignment.",
      );
    } finally {
      setLoading(false);
    }
  }, [assignmentId, supabase]);

  /* =====================================================
     INITIAL LOAD
  ====================================================== */

  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(() => {
      if (!cancelled) {
        void loadAssignment();
      }
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [loadAssignment]);

  /* =====================================================
     FILE SELECTION
  ====================================================== */

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0] ?? null;

    if (!file) {
      return;
    }

    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
      setError(
        "The selected file is too large. Maximum file size is 10MB.",
      );

      event.target.value = "";
      return;
    }

    setError(null);
    setSelectedFile(file);
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
  };

  /* =====================================================
     FORMATTERS
  ====================================================== */

  const formatDate = (
    date: string | null,
  ) => {
    if (!date) {
      return "No deadline";
    }

    return new Intl.DateTimeFormat(
      "en-GB",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      },
    ).format(new Date(date));
  };

  const formatDateTime = (
    date: string | null,
  ) => {
    if (!date) {
      return "";
    }

    return new Intl.DateTimeFormat(
      "en-GB",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
    ).format(new Date(date));
  };

  const formatFileSize = (
    bytes: number,
  ) => {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(
        bytes / 1024
      ).toFixed(1)} KB`;
    }

    return `${(
      bytes /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  };

  /* =====================================================
     ASSIGNMENT STATE
  ====================================================== */

  const isOverdue =
    !!assignment?.due_date &&
    new Date(
      assignment.due_date,
    ).getTime() < currentTime;

  const hasSubmission =
    !!submission;

  const canSubmit =
    !hasSubmission &&
    !isOverdue;

  const submissionType =
    getSubmissionType(
      assignment?.submission_type,
    );

  const requiresText =
    submissionType === "text" ||
    submissionType === "text_and_file";

  const requiresFile =
    submissionType === "file" ||
    submissionType === "text_and_file";

  /* =====================================================
     SUBMISSION TYPE LABEL
  ====================================================== */

  const submissionTypeLabel =
    submissionType === "text"
      ? "Written Answer"
      : submissionType === "file"
        ? "File Upload"
        : "Written Answer + File";

  /* =====================================================
     SUBMIT ASSIGNMENT
  ====================================================== */

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!assignment) {
      return;
    }

    if (submission) {
      setError(
        "You have already submitted this assignment.",
      );
      return;
    }

    if (isOverdue) {
      setError(
        "This assignment is past its deadline and can no longer be submitted.",
      );
      return;
    }

    /* -------------------------------------------------
       VALIDATE ACCORDING TO ASSIGNMENT TYPE
    -------------------------------------------------- */

    if (
      requiresText &&
      !content.trim()
    ) {
      setError(
        "Please write your answer before submitting.",
      );
      return;
    }

    if (
      requiresFile &&
      !selectedFile
    ) {
      setError(
        "Please attach the required file before submitting.",
      );
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      /* -------------------------------------------------
         GET USER
      -------------------------------------------------- */

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw new Error(
          authError.message,
        );
      }

      if (!user) {
        throw new Error(
          "You are not logged in.",
        );
      }

      /* -------------------------------------------------
         GET STUDENT
      -------------------------------------------------- */

      const {
        data: student,
        error: studentError,
      } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (
        studentError ||
        !student
      ) {
        throw new Error(
          studentError?.message ??
            "Student record could not be found.",
        );
      }

      let fileUrl: string | null =
        null;

      /* -------------------------------------------------
         UPLOAD FILE IF REQUIRED
      -------------------------------------------------- */

      if (
        requiresFile &&
        selectedFile
      ) {
        setUploadingFile(true);

        const fileExtension =
          selectedFile.name
            .split(".")
            .pop() || "file";

        const filePath = `${student.id}/${assignment.id}/${crypto.randomUUID()}.${fileExtension}`;

        const {
          error: uploadError,
        } = await supabase.storage
          .from(
            "assignment-submissions",
          )
          .upload(
            filePath,
            selectedFile,
            {
              cacheControl: "3600",
              upsert: false,
            },
          );

        if (uploadError) {
          throw new Error(
            `Unable to upload attachment: ${uploadError.message}`,
          );
        }

        const {
          data: publicUrlData,
        } = supabase.storage
          .from(
            "assignment-submissions",
          )
          .getPublicUrl(
            filePath,
          );

        fileUrl =
          publicUrlData.publicUrl;
      }

      setUploadingFile(false);

      /* -------------------------------------------------
         CREATE SUBMISSION
      -------------------------------------------------- */

      const {
        data: createdSubmission,
        error: submissionError,
      } = await supabase
        .from("submissions")
        .insert({
          assignment_id:
            assignment.id,
          student_id: student.id,
          content:
            requiresText &&
            content.trim()
              ? content.trim()
              : null,
          file_url: fileUrl,
          status: "submitted",
        })
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
            graded_by
          `,
        )
        .single();

      if (submissionError) {
        throw new Error(
          `Unable to submit assignment: ${submissionError.message}`,
        );
      }

      setSubmission(
        createdSubmission,
      );

      setSuccess(
        "Your assignment has been submitted successfully.",
      );

      setSelectedFile(null);
    } catch (err) {
      console.error(
        "Assignment submission error:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit assignment.",
      );
    } finally {
      setSubmitting(false);
      setUploadingFile(false);
    }
  };

  /* =====================================================
     LOADING
  ====================================================== */

  if (loading) {
    return (
      <div className="min-h-full bg-slate-50">
        <section className="border-b border-slate-200 bg-white px-5 py-7 sm:px-8 sm:py-9">
          <div className="animate-pulse">
            <div className="h-3 w-32 rounded bg-slate-200" />

            <div className="mt-4 h-9 w-80 rounded bg-slate-200" />

            <div className="mt-3 h-4 w-full max-w-xl rounded bg-slate-100" />
          </div>
        </section>

        <main className="px-5 py-7 sm:px-8 sm:py-9">
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <div className="h-125 animate-pulse rounded-3xl bg-white" />

            <div className="h-100 animate-pulse rounded-3xl bg-white" />
          </div>
        </main>
      </div>
    );
  }

  /* =====================================================
     ERROR
  ====================================================== */

  if (
    error &&
    !assignment
  ) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-5">
        <div className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <FileText size={24} />
          </div>

          <p className="mt-5 text-[10px] font-black uppercase tracking-[0.2em] text-red-400">
            Assignment Error
          </p>

          <h1
            className="mt-2 text-xl font-black"
            style={{
              color: SCHOOL_BLUE_DARK,
            }}
          >
            Unable to load assignment
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            {error}
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() =>
                void loadAssignment()
              }
              className="rounded-full px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5"
              style={{
                backgroundColor:
                  SCHOOL_BLUE,
              }}
            >
              Try Again
            </button>

            <Link
              href="/student-dashboard/assignments"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
            >
              <ArrowLeft size={15} />
              Back
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return null;
  }

  const course =
    getCourse(
      assignment.course,
    );

  /* =====================================================
     PAGE
  ====================================================== */

  return (
    <div className="min-h-full bg-slate-50">
      {/* =================================================
          HEADER
      ================================================== */}

      <section className="border-b border-slate-200 bg-white">
        <div className="px-5 py-7 sm:px-8 sm:py-9">
          <Link
            href="/student-dashboard/assignments"
            className="inline-flex items-center gap-2 text-xs font-bold transition hover:opacity-70"
            style={{
              color: SCHOOL_BLUE,
            }}
          >
            <ArrowLeft size={15} />
            Back to Assignments
          </Link>

          <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              {course && (
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="text-[10px] font-black uppercase tracking-[0.18em]"
                    style={{
                      color: SCHOOL_BLUE,
                    }}
                  >
                    {course.code}
                  </span>

                  <span className="text-slate-300">
                    •
                  </span>

                  <span className="text-[10px] font-semibold text-slate-400">
                    {course.name}
                  </span>
                </div>
              )}

              <p
                className="mt-3 text-[10px] font-bold uppercase tracking-[0.22em]"
                style={{
                  color: SCHOOL_GOLD,
                }}
              >
                Academic Work
              </p>

              <h1
                className="mt-2 text-2xl font-black tracking-tight sm:text-3xl"
                style={{
                  color:
                    SCHOOL_BLUE_DARK,
                }}
              >
                {assignment.title}
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Review the assignment carefully and submit your work before the deadline.
              </p>
            </div>

            <div>
              {submission ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-emerald-600">
                  <CheckCircle2 size={14} />
                  Submitted
                </span>
              ) : isOverdue ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-red-500">
                  <Clock3 size={14} />
                  Overdue
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-amber-600">
                  <Clock3 size={14} />
                  Pending
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =================================================
          MAIN
      ================================================== */}

      <main className="px-5 py-7 sm:px-8 sm:py-9">
        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3.5 text-sm text-red-600">
            <X
              size={17}
              className="mt-0.5 shrink-0"
            />

            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-700">
            <CheckCircle2
              size={17}
              className="mt-0.5 shrink-0"
            />

            <p>{success}</p>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* =================================================
              LEFT
          ================================================== */}

          <div className="space-y-6">
            {/* DESCRIPTION */}

            {assignment.description && (
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(1,0,102,0.035)] sm:p-7">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: `${SCHOOL_BLUE}08`,
                      color: SCHOOL_BLUE,
                    }}
                  >
                    <FileText size={18} />
                  </div>

                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
                      Assignment
                    </p>

                    <h2
                      className="mt-0.5 text-base font-black"
                      style={{
                        color:
                          SCHOOL_BLUE_DARK,
                      }}
                    >
                      Description
                    </h2>
                  </div>
                </div>

                <div className="mt-6 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                  {assignment.description}
                </div>
              </section>
            )}

            {/* INSTRUCTIONS */}

            {assignment.instructions && (
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(1,0,102,0.035)] sm:p-7">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: `${SCHOOL_GOLD}15`,
                      color: SCHOOL_GOLD,
                    }}
                  >
                    <FileText size={18} />
                  </div>

                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
                      What to do
                    </p>

                    <h2
                      className="mt-0.5 text-base font-black"
                      style={{
                        color:
                          SCHOOL_BLUE_DARK,
                      }}
                    >
                      Instructions
                    </h2>
                  </div>
                </div>

                <div className="mt-6 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                  {assignment.instructions}
                </div>
              </section>
            )}

            {/* SUBMISSION */}

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(1,0,102,0.035)] sm:p-7">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: `${SCHOOL_BLUE}08`,
                    color: SCHOOL_BLUE,
                  }}
                >
                  <Send size={18} />
                </div>

                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    Your Work
                  </p>

                  <h2
                    className="mt-0.5 text-base font-black"
                    style={{
                      color:
                        SCHOOL_BLUE_DARK,
                    }}
                  >
                    {submission
                      ? "Your Submission"
                      : "Submit Assignment"}
                  </h2>
                </div>
              </div>

              {/* EXISTING SUBMISSION */}

              {submission ? (
                <div className="mt-6">
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5">
                    <div className="flex items-start gap-3">
                      <CheckCircle2
                        size={19}
                        className="mt-0.5 shrink-0 text-emerald-600"
                      />

                      <div className="min-w-0">
                        <p className="text-sm font-black text-emerald-700">
                          Assignment submitted successfully
                        </p>

                        <p className="mt-1 text-xs leading-5 text-emerald-600/75">
                          Submitted on{" "}
                          {formatDateTime(
                            submission.submitted_at,
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {submission.content && (
                    <div className="mt-5">
                      <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
                        Your Answer
                      </p>

                      <div className="mt-2 whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-600">
                        {submission.content}
                      </div>
                    </div>
                  )}

                  {submission.file_url && (
                    <div className="mt-5">
                      <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
                        Attachment
                      </p>

                      <a
                        href={
                          submission.file_url
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-[#010066]/20 hover:bg-white"
                      >
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-xl"
                          style={{
                            backgroundColor: `${SCHOOL_BLUE}08`,
                            color: SCHOOL_BLUE,
                          }}
                        >
                          <Paperclip
                            size={18}
                          />
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-black text-slate-700">
                            View submitted file
                          </p>

                          <p className="mt-0.5 text-[10px] text-slate-400">
                            Open attachment
                          </p>
                        </div>
                      </a>
                    </div>
                  )}

                  {/* SCORE */}

                  {submission.score !==
                    null && (
                    <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                      <div className="flex items-center gap-3">
                        <Trophy
                          size={20}
                          className="text-emerald-600"
                        />

                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-emerald-500">
                            Your Score
                          </p>

                          <p className="mt-1 text-2xl font-black text-emerald-700">
                            {
                              submission.score
                            }{" "}
                            <span className="text-sm font-bold text-emerald-500">
                              /{" "}
                              {
                                assignment.max_score
                              }
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* FEEDBACK */}

                  {submission.feedback && (
                    <div className="mt-5">
                      <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
                        Teacher Feedback
                      </p>

                      <div className="mt-2 rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-7 text-slate-600">
                        {
                          submission.feedback
                        }
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* NEW SUBMISSION */

                <form
                  onSubmit={
                    handleSubmit
                  }
                  className="mt-6"
                >
                  {/* SUBMISSION TYPE NOTICE */}

                  <div className="mb-5 rounded-2xl border border-[#010066]/10 bg-[#010066]/3 p-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
                      Submission Required
                    </p>

                    <p
                      className="mt-1 text-sm font-black"
                      style={{
                        color:
                          SCHOOL_BLUE_DARK,
                      }}
                    >
                      {submissionTypeLabel}
                    </p>

                    <p className="mt-1 text-[11px] leading-5 text-slate-500">
                      {submissionType ===
                        "text" &&
                        "Write your answer in the space below."}

                      {submissionType ===
                        "file" &&
                        "Attach the required file below."}

                      {submissionType ===
                        "text_and_file" &&
                        "Write your answer and attach the required file below."}
                    </p>
                  </div>

                  {/* TEXT ANSWER */}

                  {requiresText && (
                    <label className="block">
                      <span className="text-xs font-bold text-slate-600">
                        Your Answer
                      </span>

                      <textarea
                        value={content}
                        onChange={(
                          event,
                        ) =>
                          setContent(
                            event.target
                              .value,
                          )
                        }
                        disabled={
                          !canSubmit ||
                          submitting
                        }
                        rows={10}
                        placeholder="Write your answer here..."
                        className="mt-2 w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#010066]/25 focus:bg-white focus:ring-4 focus:ring-[#010066]/5 disabled:cursor-not-allowed disabled:opacity-60"
                      />
                    </label>
                  )}

                  {/* FILE */}

                  {requiresFile && (
                    <div
                      className={
                        requiresText
                          ? "mt-5"
                          : ""
                      }
                    >
                      <p className="text-xs font-bold text-slate-600">
                        Attachment
                      </p>

                      <label
                        className={`mt-2 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center transition hover:border-[#010066]/20 hover:bg-white ${
                          !canSubmit ||
                          submitting
                            ? "pointer-events-none opacity-60"
                            : ""
                        }`}
                      >
                        <Upload
                          size={22}
                          className="text-slate-400"
                        />

                        <p className="mt-3 text-xs font-bold text-slate-600">
                          Choose a file to attach
                        </p>

                        <p className="mt-1 text-[10px] text-slate-400">
                          Maximum file size: 10MB
                        </p>

                        <input
                          type="file"
                          className="hidden"
                          disabled={
                            !canSubmit ||
                            submitting
                          }
                          onChange={
                            handleFileChange
                          }
                        />
                      </label>

                      {selectedFile && (
                        <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <div
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                              style={{
                                backgroundColor: `${SCHOOL_BLUE}08`,
                                color: SCHOOL_BLUE,
                              }}
                            >
                              <Paperclip
                                size={17}
                              />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold text-slate-700">
                                {
                                  selectedFile.name
                                }
                              </p>

                              <p className="mt-0.5 text-[10px] text-slate-400">
                                {formatFileSize(
                                  selectedFile.size,
                                )}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={
                              removeSelectedFile
                            }
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                          >
                            <X
                              size={15}
                            />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* SUBMIT */}

                  <button
                    type="submit"
                    disabled={
                      !canSubmit ||
                      submitting
                    }
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                    style={{
                      backgroundColor:
                        SCHOOL_BLUE,
                    }}
                  >
                    {submitting ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                        {uploadingFile
                          ? "Uploading file..."
                          : "Submitting..."}
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Submit Assignment
                      </>
                    )}
                  </button>

                  {isOverdue && (
                    <p className="mt-3 text-center text-[11px] font-semibold text-red-500">
                      This assignment is past its deadline and can no longer be submitted.
                    </p>
                  )}
                </form>
              )}
            </section>
          </div>

          {/* =================================================
              RIGHT SIDEBAR
          ================================================== */}

          <aside className="space-y-5">
            {/* ASSIGNMENT DETAILS */}

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(1,0,102,0.035)]">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Assignment Details
              </p>

              <div className="mt-5 space-y-4">
                {course && (
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: `${SCHOOL_BLUE}08`,
                        color: SCHOOL_BLUE,
                      }}
                    >
                      <FileText
                        size={16}
                      />
                    </div>

                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        Course
                      </p>

                      <p className="mt-1 text-xs font-bold text-slate-700">
                        {course.name}
                      </p>

                      <p
                        className="mt-0.5 text-[10px] font-black"
                        style={{
                          color:
                            SCHOOL_BLUE,
                        }}
                      >
                        {course.code}
                      </p>
                    </div>
                  </div>
                )}

                {/* DUE DATE */}

                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      isOverdue
                        ? "bg-red-50 text-red-500"
                        : "bg-slate-50 text-slate-500"
                    }`}
                  >
                    <CalendarDays
                      size={16}
                    />
                  </div>

                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Due Date
                    </p>

                    <p
                      className={`mt-1 text-xs font-bold ${
                        isOverdue
                          ? "text-red-500"
                          : "text-slate-700"
                      }`}
                    >
                      {formatDate(
                        assignment.due_date,
                      )}
                    </p>

                    {assignment.due_date && (
                      <p
                        className={`mt-0.5 text-[10px] ${
                          isOverdue
                            ? "text-red-400"
                            : "text-slate-400"
                        }`}
                      >
                        {new Intl.DateTimeFormat(
                          "en-GB",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        ).format(
                          new Date(
                            assignment.due_date,
                          ),
                        )}
                      </p>
                    )}
                  </div>
                </div>

                {/* MAX SCORE */}

                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <Trophy
                      size={16}
                    />
                  </div>

                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Maximum Score
                    </p>

                    <p className="mt-1 text-xs font-black text-slate-700">
                      {
                        assignment.max_score
                      }
                    </p>
                  </div>
                </div>

                {/* SUBMISSION TYPE */}

                <div className="flex items-start gap-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: `${SCHOOL_GOLD}12`,
                      color: SCHOOL_GOLD,
                    }}
                  >
                    {requiresFile ? (
                      <Paperclip
                        size={16}
                      />
                    ) : (
                      <FileText
                        size={16}
                      />
                    )}
                  </div>

                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Submission Type
                    </p>

                    <p className="mt-1 text-xs font-bold text-slate-700">
                      {
                        submissionTypeLabel
                      }
                    </p>
                  </div>
                </div>

                {/* CREATED */}

                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
                    <Clock3
                      size={16}
                    />
                  </div>

                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Created
                    </p>

                    <p className="mt-1 text-xs font-bold text-slate-700">
                      {formatDate(
                        assignment.created_at,
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* SUBMISSION STATUS */}

            <section
              className="relative overflow-hidden rounded-3xl p-6"
              style={{
                backgroundColor:
                  SCHOOL_BLUE,
              }}
            >
              <div
                aria-hidden="true"
                className="absolute -right-14 -top-14 h-40 w-40 rounded-full blur-3xl"
                style={{
                  backgroundColor: `${SCHOOL_GOLD}20`,
                }}
              />

              <div className="relative z-10">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/45">
                  Submission Status
                </p>

                <div className="mt-4 flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: `${SCHOOL_GOLD}18`,
                      color: SCHOOL_GOLD,
                    }}
                  >
                    {submission ? (
                      <CheckCircle2
                        size={19}
                      />
                    ) : (
                      <Clock3
                        size={19}
                      />
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-black text-white">
                      {submission
                        ? "Submitted"
                        : isOverdue
                          ? "Deadline Passed"
                          : "Awaiting Submission"}
                    </p>

                    <p className="mt-1 text-[10px] leading-5 text-white/50">
                      {submission
                        ? "Your work has been received."
                        : isOverdue
                          ? "This assignment can no longer be submitted."
                          : "Complete and submit your work before the deadline."}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}