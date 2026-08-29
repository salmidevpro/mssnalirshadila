"use client";

import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Search,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";

const SCHOOL_BLUE = "#010066";
const SCHOOL_BLUE_DARK = "#00004D";
const SCHOOL_GOLD = "#FFAF2E";

type Course = {
  id: string;
  code: string;
  name: string;
};

type Assignment = {
  id: string;
  course_id: string;
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
};

type AssignmentWithSubmission = Assignment & {
  submission: Submission | null;
};

type Session = {
  id: string;
  name: string;
};

type Term = {
  id: string;
  name: string;
};

export default function StudentAssignmentsPage() {
  const supabase = useMemo(() => createClient(), []);

  const [assignments, setAssignments] = useState<
    AssignmentWithSubmission[]
  >([]);

  const [session, setSession] = useState<Session | null>(null);
  const [term, setTerm] = useState<Term | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [currentTime, setCurrentTime] = useState<number | null>(
    () => Date.now(),
  );

  const loadAssignments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      /* =====================================================
         1. GET AUTHENTICATED USER
      ====================================================== */

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

      /* =====================================================
         2. GET STUDENT
      ====================================================== */

      const { data: student, error: studentError } = await supabase
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
          "Your student record could not be found. Please contact the school administration.",
        );
      }

      /* =====================================================
         3. GET CURRENT SESSION
      ====================================================== */

      const { data: currentSession, error: sessionError } =
        await supabase
          .from("academic_sessions")
          .select("id, name")
          .eq("is_current", true)
          .maybeSingle();

      if (sessionError) {
        throw new Error(
          `Unable to load academic session: ${sessionError.message}`,
        );
      }

      if (!currentSession) {
        throw new Error(
          "No active academic session has been configured.",
        );
      }

      setSession(currentSession);

      /* =====================================================
         4. GET CURRENT TERM
      ====================================================== */

      const { data: currentTerm, error: termError } = await supabase
        .from("academic_terms")
        .select("id, name")
        .eq("session_id", currentSession.id)
        .eq("is_current", true)
        .maybeSingle();

      if (termError) {
        throw new Error(
          `Unable to load academic term: ${termError.message}`,
        );
      }

      if (!currentTerm) {
        throw new Error(
          "No active academic term has been configured.",
        );
      }

      setTerm(currentTerm);

      /* =====================================================
         5. GET STUDENT REGISTERED COURSES
      ====================================================== */

      const { data: registrations, error: registrationError } =
        await supabase
          .from("course_registrations")
          .select("course_id")
          .eq("student_id", student.id)
          .eq("session_id", currentSession.id)
          .eq("term_id", currentTerm.id);

      if (registrationError) {
        throw new Error(
          `Unable to load your registered courses: ${registrationError.message}`,
        );
      }

      const courseIds = (registrations ?? []).map(
        (registration) => registration.course_id,
      );

      /* =====================================================
         NO REGISTERED COURSES
      ====================================================== */

      if (courseIds.length === 0) {
        setAssignments([]);
        return;
      }

      /* =====================================================
         6. GET ASSIGNMENTS
         
         Only assignments:
         - belonging to registered courses
         - belonging to current session
         - belonging to current term
      ====================================================== */

      const { data: assignmentData, error: assignmentError } =
        await supabase
          .from("assignments")
          .select(
            `
              id,
              course_id,
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
              course:courses (
                id,
                code,
                name
              )
            `,
          )
          .in("course_id", courseIds)
          .eq("session_id", currentSession.id)
          .eq("term_id", currentTerm.id)
          .order("due_date", {
            ascending: true,
            nullsFirst: false,
          });

      if (assignmentError) {
        throw new Error(
          `Unable to load assignments: ${assignmentError.message}`,
        );
      }

      /* =====================================================
         7. GET STUDENT SUBMISSIONS
      ====================================================== */

      const assignmentIds = (assignmentData ?? []).map(
        (assignment) => assignment.id,
      );

      let submissionData: Submission[] = [];

      if (assignmentIds.length > 0) {
        const { data, error: submissionError } = await supabase
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
              graded_at
            `,
          )
          .eq("student_id", student.id)
          .in("assignment_id", assignmentIds);

        if (submissionError) {
          throw new Error(
            `Unable to load your submissions: ${submissionError.message}`,
          );
        }

        submissionData = data ?? [];
      }

      /* =====================================================
         8. COMBINE ASSIGNMENTS + SUBMISSIONS
      ====================================================== */

      const combined: AssignmentWithSubmission[] = (
        assignmentData ?? []
      ).map((assignment) => {
        const submission =
          submissionData.find(
            (item) => item.assignment_id === assignment.id,
          ) ?? null;

        return {
          ...assignment,
          submission,
        };
      });

      setAssignments(combined);
    } catch (err) {
      console.error("Assignments page error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load assignments.",
      );
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  /* =====================================================
     LOAD PAGE
  ====================================================== */

  useEffect(() => {
    // This initial fetch is required to hydrate the dashboard from Supabase.
    // The async state updates happen in the loader, not synchronously in the
    // effect body itself, so we suppress the false-positive lint warning here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAssignments();
  }, [loadAssignments]);

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
     SEARCH
  ====================================================== */

  const filteredAssignments = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return assignments;
    }

    return assignments.filter((assignment) => {
      const course = getCourse(assignment.course);

      return (
        assignment.title.toLowerCase().includes(query) ||
        assignment.description?.toLowerCase().includes(query) ||
        assignment.instructions?.toLowerCase().includes(query) ||
        course?.name.toLowerCase().includes(query) ||
        course?.code.toLowerCase().includes(query)
      );
    });
  }, [assignments, search]);

  /* =====================================================
     HELPERS
  ====================================================== */

  const isOverdue = (assignment: AssignmentWithSubmission) => {
    if (!assignment.due_date) {
      return false;
    }

    if (assignment.submission) {
      return false;
    }

    return (
      currentTime !== null &&
      new Date(assignment.due_date).getTime() < currentTime
    );
  };

  const formatDate = (date: string | null) => {
    if (!date) {
      return "No deadline";
    }

    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  };

  const formatTime = (date: string | null) => {
    if (!date) {
      return "";
    }

    return new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const getStatus = (
    assignment: AssignmentWithSubmission,
  ) => {
    if (assignment.submission) {
      return {
        label: "Submitted",
        type: "submitted",
      };
    }

    if (isOverdue(assignment)) {
      return {
        label: "Overdue",
        type: "overdue",
      };
    }

    return {
      label: "Pending",
      type: "pending",
    };
  };

  /* =====================================================
     STATISTICS
  ====================================================== */

  const submittedCount = assignments.filter(
    (assignment) => assignment.submission,
  ).length;

  const overdueCount = assignments.filter(
    (assignment) => isOverdue(assignment),
  ).length;

  const pendingCount =
    assignments.length - submittedCount - overdueCount;

  /* =====================================================
     LOADING
  ====================================================== */

  if (loading) {
    return (
      <div className="min-h-full bg-slate-50">
        <section className="border-b border-slate-200 bg-white px-5 py-7 sm:px-8 sm:py-9">
          <div className="animate-pulse">
            <div className="h-3 w-28 rounded bg-slate-200" />

            <div className="mt-4 h-8 w-64 rounded bg-slate-200" />

            <div className="mt-3 h-4 w-full max-w-xl rounded bg-slate-100" />
          </div>
        </section>

        <main className="px-5 py-7 sm:px-8 sm:py-9">
          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-28 animate-pulse rounded-2xl bg-white"
              />
            ))}
          </div>

          <div className="mt-6 grid gap-4">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-48 animate-pulse rounded-2xl bg-white"
              />
            ))}
          </div>
        </main>
      </div>
    );
  }

  /* =====================================================
     ERROR
  ====================================================== */

  if (error) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-5">
        <div className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-7 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <FileText size={24} />
          </div>

          <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-red-400">
            Assignments Error
          </p>

          <h1
            className="mt-2 text-xl font-black"
            style={{ color: SCHOOL_BLUE_DARK }}
          >
            Unable to load assignments
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            {error}
          </p>

          <button
            type="button"
            onClick={() => void loadAssignments()}
            className="mt-6 rounded-full px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5"
            style={{
              backgroundColor: SCHOOL_BLUE,
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  /* =====================================================
     PAGE
  ====================================================== */

  return (
    <div className="min-h-full bg-slate-50">
      {/* ===================================================
          HEADER
      ==================================================== */}

      <section className="border-b border-slate-200 bg-white">
        <div className="px-5 py-7 sm:px-8 sm:py-9">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Link
                href="/student-dashboard"
                className="mb-4 inline-flex items-center gap-2 text-xs font-bold transition hover:opacity-70"
                style={{
                  color: SCHOOL_BLUE,
                }}
              >
                <ArrowLeft size={15} />
                Back to Dashboard
              </Link>

              <p
                className="text-[10px] font-bold uppercase tracking-[0.22em]"
                style={{
                  color: SCHOOL_GOLD,
                }}
              >
                Academic Work
              </p>

              <h1
                className="mt-2 text-2xl font-black tracking-tight sm:text-3xl"
                style={{
                  color: SCHOOL_BLUE_DARK,
                }}
              >
                My Assignments
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                View assignments from the courses you are currently
                registered for.
              </p>

              {session && term && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#010066]/5 px-3 py-1.5 text-[11px] font-bold text-[#010066]">
                    <CalendarDays size={13} />
                    {session.name}
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-full bg-[#FFAF2E]/15 px-3 py-1.5 text-[11px] font-bold text-[#00004D]">
                    <Clock3 size={13} />
                    {term.name}
                  </span>
                </div>
              )}
            </div>

            {/* SEARCH */}

            <div className="relative w-full lg:max-w-xs">
              <Search
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search assignments..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#010066]/30 focus:bg-white focus:ring-4 focus:ring-[#010066]/5"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================
          MAIN
      ==================================================== */}

      <main className="px-5 py-7 sm:px-8 sm:py-9">
        {/* =================================================
            STATISTICS
        ================================================== */}

        <div className="grid gap-4 sm:grid-cols-3">
          {/* TOTAL */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(1,0,102,0.035)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Total
                </p>

                <p
                  className="mt-2 text-2xl font-black"
                  style={{
                    color: SCHOOL_BLUE_DARK,
                  }}
                >
                  {assignments.length}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#010066]/5 text-[#010066]">
                <FileText size={20} />
              </div>
            </div>
          </div>

          {/* PENDING */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(1,0,102,0.035)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Pending
                </p>

                <p className="mt-2 text-2xl font-black text-amber-600">
                  {pendingCount}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Clock3 size={20} />
              </div>
            </div>
          </div>

          {/* SUBMITTED */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(1,0,102,0.035)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Submitted
                </p>

                <p className="mt-2 text-2xl font-black text-emerald-600">
                  {submittedCount}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* OVERDUE NOTICE */}

        {overdueCount > 0 && (
          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3.5">
            <Clock3
              size={18}
              className="shrink-0 text-red-500"
            />

            <p className="text-xs font-semibold text-red-600">
              You have {overdueCount} overdue{" "}
              {overdueCount === 1
                ? "assignment"
                : "assignments"}
              .
            </p>
          </div>
        )}

        {/* =================================================
            ASSIGNMENT LIST
        ================================================== */}

        <div className="mt-7">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Assignments
            </p>

            <p
              className="mt-1 text-sm font-bold"
              style={{
                color: SCHOOL_BLUE_DARK,
              }}
            >
              {filteredAssignments.length}{" "}
              {filteredAssignments.length === 1
                ? "assignment"
                : "assignments"}
            </p>
          </div>

          {filteredAssignments.length > 0 ? (
            <div className="grid gap-4">
              {filteredAssignments.map((assignment) => {
                const course = getCourse(
                  assignment.course,
                );

                const status = getStatus(assignment);

                return (
                  <article
                    key={assignment.id}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(1,0,102,0.035)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#010066]/15 hover:shadow-lg"
                  >
                    <div className="p-5 sm:p-6">
                      {/* TOP */}

                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex min-w-0 gap-4">
                          <div
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                            style={{
                              backgroundColor: `${SCHOOL_BLUE}08`,
                              color: SCHOOL_BLUE,
                            }}
                          >
                            <BookOpen size={21} />
                          </div>

                          <div className="min-w-0">
                            {course && (
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className="text-[10px] font-black uppercase tracking-wider"
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

                            <h2
                              className="mt-1 text-lg font-black"
                              style={{
                                color: SCHOOL_BLUE_DARK,
                              }}
                            >
                              {assignment.title}
                            </h2>
                          </div>
                        </div>

                        {/* STATUS */}

                        <span
                          className={`
                            inline-flex
                            w-fit
                            shrink-0
                            items-center
                            gap-2
                            rounded-full
                            px-3
                            py-1.5
                            text-[10px]
                            font-black
                            uppercase
                            tracking-wider
                            ${
                              status.type === "submitted"
                                ? "bg-emerald-50 text-emerald-600"
                                : status.type === "overdue"
                                  ? "bg-red-50 text-red-500"
                                  : "bg-amber-50 text-amber-600"
                            }
                          `}
                        >
                          <span
                            className={`
                              h-1.5
                              w-1.5
                              rounded-full
                              ${
                                status.type === "submitted"
                                  ? "bg-emerald-500"
                                  : status.type === "overdue"
                                    ? "bg-red-500"
                                    : "bg-amber-500"
                              }
                            `}
                          />

                          {status.label}
                        </span>
                      </div>

                      {/* DESCRIPTION */}

                      {(assignment.description ||
                        assignment.instructions) && (
                        <div className="mt-5 max-w-3xl">
                          <p className="text-sm leading-6 text-slate-500">
                            {assignment.description ||
                              assignment.instructions}
                          </p>
                        </div>
                      )}

                      {/* DETAILS */}

                      <div className="mt-5 flex flex-wrap gap-3">
                        <div className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                          <CalendarDays
                            size={15}
                            className={
                              isOverdue(assignment)
                                ? "text-red-500"
                                : "text-slate-400"
                            }
                          />

                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                              Due
                            </p>

                            <p
                              className={`text-xs font-bold ${
                                isOverdue(assignment)
                                  ? "text-red-500"
                                  : "text-slate-600"
                              }`}
                            >
                              {formatDate(
                                assignment.due_date,
                              )}

                              {assignment.due_date && (
                                <>
                                  {" "}
                                  ·{" "}
                                  {formatTime(
                                    assignment.due_date,
                                  )}
                                </>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                          <Trophy
                            size={15}
                            className="text-slate-400"
                          />

                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                              Maximum Score
                            </p>

                            <p className="text-xs font-bold text-slate-600">
                              {assignment.max_score}
                            </p>
                          </div>
                        </div>

                        {assignment.submission?.score !==
                          null &&
                          assignment.submission?.score !==
                            undefined && (
                            <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2">
                              <CheckCircle2
                                size={15}
                                className="text-emerald-500"
                              />

                              <div>
                                <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-500">
                                  Score
                                </p>

                                <p className="text-xs font-black text-emerald-600">
                                  {
                                    assignment.submission
                                      .score
                                  }{" "}
                                  /{" "}
                                  {
                                    assignment.max_score
                                  }
                                </p>
                              </div>
                            </div>
                          )}
                      </div>

                      {/* SUBMISSION INFO */}

                      {assignment.submission && (
                        <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                          <div className="flex items-start gap-3">
                            <CheckCircle2
                              size={17}
                              className="mt-0.5 shrink-0 text-emerald-600"
                            />

                            <div className="min-w-0">
                              <p className="text-xs font-black text-emerald-700">
                                Assignment submitted
                              </p>

                              <p className="mt-1 text-[11px] leading-5 text-emerald-600/75">
                                Submitted on{" "}
                                {formatDate(
                                  assignment.submission
                                    .submitted_at,
                                )}{" "}
                                at{" "}
                                {formatTime(
                                  assignment.submission
                                    .submitted_at,
                                )}
                              </p>

                              {assignment.submission
                                .feedback && (
                                <div className="mt-3 border-t border-emerald-100 pt-3">
                                  <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-500">
                                    Teacher Feedback
                                  </p>

                                  <p className="mt-1 text-xs leading-5 text-emerald-700">
                                    {
                                      assignment.submission
                                        .feedback
                                    }
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* FOOTER */}

                      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                        <p className="text-[10px] text-slate-400">
                          Created{" "}
                          {formatDate(
                            assignment.created_at,
                          )}
                        </p>

                        <Link
                          href={`/student-dashboard/assignments/${assignment.id}`}
                          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                          style={{
                            backgroundColor: SCHOOL_BLUE,
                          }}
                        >
                          View Assignment
                          <ArrowLeft
                            size={13}
                            className="rotate-180"
                          />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            /* =================================================
               EMPTY STATE
            ================================================== */

            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-16 text-center shadow-[0_8px_30px_rgba(1,0,102,0.035)]">
              <div
                className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{
                  backgroundColor: `${SCHOOL_BLUE}08`,
                  color: SCHOOL_BLUE,
                }}
              >
                {search ? (
                  <Search size={24} />
                ) : (
                  <FileText size={24} />
                )}
              </div>

              <h2
                className="mt-5 text-lg font-black"
                style={{
                  color: SCHOOL_BLUE_DARK,
                }}
              >
                {search
                  ? "No assignments found"
                  : "No assignments yet"}
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
                {search
                  ? "Try searching with a different assignment title, course name or course code."
                  : "Assignments from your registered courses will appear here when your teachers publish them."}
              </p>

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="mt-5 rounded-full px-5 py-2.5 text-xs font-bold text-white"
                  style={{
                    backgroundColor: SCHOOL_BLUE,
                  }}
                >
                  Clear Search
                </button>
              )}
            </div>
          )}
        </div>

        {/* =================================================
            BOTTOM HELP
        ================================================== */}

        <section
          className="relative mt-7 overflow-hidden rounded-2xl p-6 sm:p-7"
          style={{
            backgroundColor: SCHOOL_BLUE,
          }}
        >
          <div
            aria-hidden="true"
            className="absolute -right-16 -top-16 h-44 w-44 rounded-full blur-3xl"
            style={{
              backgroundColor: `${SCHOOL_GOLD}20`,
            }}
          />

          <div className="relative z-10 flex items-center gap-4">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              style={{
                backgroundColor: `${SCHOOL_GOLD}18`,
                color: SCHOOL_GOLD,
              }}
            >
              <FileText size={19} />
            </div>

            <div>
              <p className="text-sm font-black text-white">
                Missing an assignment?
              </p>

              <p className="mt-1 text-xs leading-5 text-white/55">
                If you believe an assignment is missing from
                one of your registered courses, contact your
                teacher or the school administration.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}