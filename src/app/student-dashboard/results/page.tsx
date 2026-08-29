"use client";

import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";

/* =========================================================
   SCHOOL BRAND
========================================================= */

const SCHOOL_BLUE = "#010066";
const SCHOOL_BLUE_DARK = "#00004D";
const SCHOOL_GOLD = "#FFAF2E";

/* =========================================================
   TYPES
========================================================= */

type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  email: string | null;
};

type Student = {
  id: string;
  user_id: string;
  student_id: string;
  class_id: string | null;
  admission_number: string | null;
  status: string;
};

type Course = {
  id: string;
  code: string;
  name: string;
  units: number;
};

type Result = {
  id: string;
  student_id: string;
  course_id: string;
  session_id: string;
  term_id: string;
  ca_score: number;
  exam_score: number;
  total_score: number | null;
  grade: string | null;
  published: boolean;
};

type AcademicSession = {
  id: string;
  name: string;
  is_current: boolean;
};

type AcademicTerm = {
  id: string;
  session_id: string;
  name: string;
  is_current: boolean;
};

type PageData = {
  profile: Profile | null;
  student: Student | null;
  results: Result[];
  courses: Record<string, Course>;
  session: AcademicSession | null;
  term: AcademicTerm | null;
};

/* =========================================================
   EMPTY DATA
========================================================= */

const EMPTY_DATA: PageData = {
  profile: null,
  student: null,
  results: [],
  courses: {},
  session: null,
  term: null,
};

/* =========================================================
   HELPERS
========================================================= */

function percentage(value: number) {
  return `${Math.round(value)}%`;
}

function getGradeLabel(grade: string | null) {
  if (!grade) return "Not graded";

  return grade.toUpperCase();
}

function getGradeClass(grade: string | null) {
  switch (grade?.toUpperCase()) {
    case "A":
      return "bg-emerald-50 text-emerald-600";

    case "B":
      return "bg-blue-50 text-blue-600";

    case "C":
      return "bg-cyan-50 text-cyan-600";

    case "D":
      return "bg-amber-50 text-amber-600";

    case "E":
      return "bg-orange-50 text-orange-600";

    case "F":
      return "bg-red-50 text-red-600";

    default:
      return "bg-slate-100 text-slate-500";
  }
}

/* =========================================================
   PAGE
========================================================= */

export default function StudentResultsPage() {
  const supabase = useMemo(() => createClient(), []);

  const [data, setData] = useState<PageData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  /* =======================================================
     LOAD RESULTS
  ======================================================= */

  const loadResults = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("========================================");
      console.log("📊 STUDENT RESULTS PAGE");
      console.log("========================================");

      /* =====================================================
         1. AUTH USER
      ===================================================== */

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      console.log("STEP 1 - AUTH USER:", {
        id: user?.id,
        email: user?.email,
        authError,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!user) {
        throw new Error("You are not logged in.");
      }

      /* =====================================================
         2. PROFILE
      ===================================================== */

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select(
          "id, first_name, last_name, middle_name, email",
        )
        .eq("id", user.id)
        .maybeSingle();

      console.log("STEP 2 - PROFILE:", {
        profile,
        profileError,
      });

      if (profileError) {
        throw new Error(
          `Unable to load profile: ${profileError.message}`,
        );
      }

      /* =====================================================
         3. STUDENT
      ===================================================== */

      const { data: student, error: studentError } = await supabase
        .from("students")
        .select(
          `
          id,
          user_id,
          student_id,
          class_id,
          admission_number,
          status
          `,
        )
        .eq("user_id", user.id)
        .maybeSingle();

      console.log("STEP 3 - STUDENT:", {
        student,
        studentError,
      });

      if (studentError) {
        throw new Error(
          `Unable to load student record: ${studentError.message}`,
        );
      }

      if (!student) {
        throw new Error(
          "Your account is logged in, but no student record is linked to this account.",
        );
      }

      /* =====================================================
         4. GET PUBLISHED RESULTS
         
         IMPORTANT:
         We are NOT filtering by current session/term here.
         
         We first get the student's published results.
         Then we use the session_id and term_id contained
         inside the results.
      ===================================================== */

      const {
        data: resultRows,
        error: resultError,
      } = await supabase
        .from("results")
        .select(
          `
          id,
          student_id,
          course_id,
          session_id,
          term_id,
          ca_score,
          exam_score,
          total_score,
          grade,
          published
          `,
        )
        .eq("student_id", student.id)
        .eq("published", true)
        .order("course_id", {
          ascending: true,
        });

      console.log("STEP 4 - RESULTS:", {
        resultRows,
        resultError,
      });

      if (resultError) {
        throw new Error(
          `Unable to load results: ${resultError.message}`,
        );
      }

      const results = (resultRows ?? []) as Result[];

      console.log("🎯 PUBLISHED RESULTS:", results);

      /* =====================================================
         5. FIND SESSION FROM RESULT
         
         We use the session_id actually stored in the result.
      ===================================================== */

      let session: AcademicSession | null = null;

      const sessionId = results[0]?.session_id;

      if (sessionId) {
        const {
          data: sessionData,
          error: sessionError,
        } = await supabase
          .from("academic_sessions")
          .select("id, name, is_current")
          .eq("id", sessionId)
          .maybeSingle();

        console.log("STEP 5 - SESSION:", {
          sessionData,
          sessionError,
          sessionId,
        });

        if (sessionError) {
          console.warn(
            "Unable to load session:",
            sessionError.message,
          );
        } else {
          session = sessionData as AcademicSession | null;
        }
      }

      /* =====================================================
         6. FIND TERM FROM RESULT
      ===================================================== */

      let term: AcademicTerm | null = null;

      const termId = results[0]?.term_id;

      if (termId) {
        const {
          data: termData,
          error: termError,
        } = await supabase
          .from("academic_terms")
          .select(
            "id, session_id, name, is_current",
          )
          .eq("id", termId)
          .maybeSingle();

        console.log("STEP 6 - TERM:", {
          termData,
          termError,
          termId,
        });

        if (termError) {
          console.warn(
            "Unable to load term:",
            termError.message,
          );
        } else {
          term = termData as AcademicTerm | null;
        }
      }

      /* =====================================================
         7. LOAD COURSES DIRECTLY

         Some installations store course details in `courses`,
         while others use a `subjects` table or do not expose
         the FK relationship correctly. We therefore try the
         canonical table first and fall back to the common
         alternative when needed.
      ===================================================== */

      const courseIds = [
        ...new Set(
          results
            .map((result) => result.course_id)
            .filter(Boolean),
        ),
      ];

      console.log("STEP 7 - COURSE IDS:", courseIds);

      let courses: Record<string, Course> = {};

      if (courseIds.length > 0) {
        const fetchCourseRows = async (
          table: "courses" | "subjects",
        ) => {
          const {
            data: rows,
            error,
          } = await supabase
            .from(table)
            .select("id, code, name, units")
            .in("id", courseIds);

          console.log(`STEP 7 - ${table.toUpperCase()}:`, {
            rows,
            error,
          });

          if (error) {
            console.warn(
              `Unable to load ${table}:`,
              error.message,
            );
            return [] as Course[];
          }

          return (rows ?? []) as Course[];
        };

        const courseRows = await fetchCourseRows("courses");

        if (courseRows.length === 0) {
          const fallbackRows = await fetchCourseRows("subjects");

          if (fallbackRows.length > 0) {
            courses = Object.fromEntries(
              fallbackRows.map((course) => [course.id, course]),
            );
          }
        } else {
          courses = Object.fromEntries(
            courseRows.map((course) => [course.id, course]),
          );
        }
      }

      /* =====================================================
         8. FINAL DATA
      ===================================================== */

      const finalData: PageData = {
        profile: profile as Profile | null,
        student: student as Student,
        results,
        courses,
        session,
        term,
      };

      console.log("🎯 FINAL RESULTS PAGE DATA:", finalData);

      setData(finalData);
    } catch (err) {
      console.error(
        "❌ STUDENT RESULTS ERROR:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your results.",
      );
    } finally {
      setLoading(false);

      console.log(
        "🏁 STUDENT RESULTS PAGE LOADING COMPLETE",
      );
    }
  }, [supabase]);

  /* =======================================================
     LOAD ON MOUNT
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(() => {
      if (!cancelled) {
        void loadResults();
      }
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [loadResults, retryCount]);

  /* =======================================================
     DERIVED DATA
  ======================================================= */

  const averageScore = useMemo(() => {
    const validResults = data.results.filter(
      (result) =>
        typeof result.total_score === "number",
    );

    if (validResults.length === 0) {
      return 0;
    }

    const total = validResults.reduce(
      (sum, result) =>
        sum + (result.total_score ?? 0),
      0,
    );

    return total / validResults.length;
  }, [data.results]);

  const highestScore = useMemo(() => {
    if (data.results.length === 0) {
      return 0;
    }

    return Math.max(
      ...data.results.map(
        (result) => result.total_score ?? 0,
      ),
    );
  }, [data.results]);

  const lowestScore = useMemo(() => {
    if (data.results.length === 0) {
      return 0;
    }

    return Math.min(
      ...data.results.map(
        (result) => result.total_score ?? 0,
      ),
    );
  }, [data.results]);

  const displayName = useMemo(() => {
    if (!data.profile) {
      return "Student";
    }

    return (
      data.profile.first_name ||
      data.profile.last_name ||
      "Student"
    );
  }, [data.profile]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="min-h-full bg-slate-50">
        <section className="border-b border-slate-200 bg-white">
          <div className="px-5 py-7 sm:px-8 sm:py-9">
            <div className="animate-pulse">
              <div className="h-3 w-32 rounded bg-slate-200" />

              <div className="mt-3 h-8 w-52 rounded bg-slate-200" />

              <div className="mt-3 h-4 w-full max-w-xl rounded bg-slate-100" />
            </div>
          </div>
        </section>

        <main className="px-5 py-7 sm:px-8 sm:py-9">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white"
              />
            ))}
          </div>

          <div className="mt-7 h-96 animate-pulse rounded-2xl border border-slate-200 bg-white" />
        </main>
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-5">
        <div className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-7 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <GraduationCap size={24} />
          </div>

          <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-red-400">
            Results Error
          </p>

          <h1
            className="mt-2 text-xl font-black"
            style={{
              color: SCHOOL_BLUE_DARK,
            }}
          >
            Unable to load results
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              setRetryCount((count) => count + 1)
            }
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

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <div className="min-h-full bg-slate-50">
      {/* ===================================================
          HEADER
      =================================================== */}

      <section className="border-b border-slate-200 bg-white">
        <div className="px-5 py-7 sm:px-8 sm:py-9">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Link
                href="/student-dashboard"
                className="inline-flex items-center gap-2 text-[11px] font-bold text-slate-400 transition hover:text-[#010066]"
              >
                <ArrowLeft size={13} />
                Back to dashboard
              </Link>

              <p
                className="mt-5 text-[10px] font-bold uppercase tracking-[0.22em]"
                style={{
                  color: SCHOOL_GOLD,
                }}
              >
                Academic Performance
              </p>

              <h1
                className="mt-2 text-2xl font-black tracking-tight sm:text-3xl"
                style={{
                  color: SCHOOL_BLUE_DARK,
                }}
              >
                My Results
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                View your published academic results for the current
                academic session and term.
              </p>
            </div>

            <div className="flex gap-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Session
                </p>

                <p
                  className="mt-1 text-xs font-bold"
                  style={{
                    color: SCHOOL_BLUE,
                  }}
                >
                  {data.session?.name ?? "Not set"}
                </p>
              </div>

              <div
                className="rounded-2xl px-4 py-3 text-white"
                style={{
                  backgroundColor: SCHOOL_BLUE,
                }}
              >
                <p className="text-[9px] font-bold uppercase tracking-wider text-white/60">
                  Term
                </p>

                <p className="mt-1 text-xs font-bold">
                  {data.term?.name ?? "Not set"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================
          MAIN
      =================================================== */}

      <main className="px-5 py-7 sm:px-8 sm:py-9">
        {/* =================================================
            STUDENT
        ================================================== */}

        <section className="mb-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(1,0,102,0.035)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Student
          </p>

          <h2
            className="mt-1 text-lg font-black"
            style={{
              color: SCHOOL_BLUE_DARK,
            }}
          >
            {displayName}
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            {data.student?.student_id ??
              "Student ID unavailable"}

            {data.student?.admission_number
              ? ` • Admission ${data.student.admission_number}`
              : ""}
          </p>
        </section>

        {/* =================================================
            STATISTICS
        ================================================== */}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* Average */}

          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(1,0,102,0.035)]"
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{
                backgroundColor: `${SCHOOL_BLUE}08`,
                color: SCHOOL_BLUE,
              }}
            >
              <TrendingUp size={18} />
            </div>

            <p className="mt-5 text-xs font-semibold text-slate-400">
              Average Score
            </p>

            <p
              className="mt-1 text-2xl font-black"
              style={{
                color: SCHOOL_BLUE_DARK,
              }}
            >
              {percentage(averageScore)}
            </p>

            <p className="mt-1 text-[10px] text-slate-400">
              Across published results
            </p>
          </motion.div>

          {/* Courses */}

          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.05,
            }}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(1,0,102,0.035)]"
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{
                backgroundColor: `${SCHOOL_BLUE}08`,
                color: SCHOOL_BLUE,
              }}
            >
              <BookOpen size={18} />
            </div>

            <p className="mt-5 text-xs font-semibold text-slate-400">
              Courses
            </p>

            <p
              className="mt-1 text-2xl font-black"
              style={{
                color: SCHOOL_BLUE_DARK,
              }}
            >
              {data.results.length}
            </p>

            <p className="mt-1 text-[10px] text-slate-400">
              Results published
            </p>
          </motion.div>

          {/* Highest */}

          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.1,
            }}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(1,0,102,0.035)]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp size={18} />
            </div>

            <p className="mt-5 text-xs font-semibold text-slate-400">
              Highest Score
            </p>

            <p
              className="mt-1 text-2xl font-black"
              style={{
                color: SCHOOL_BLUE_DARK,
              }}
            >
              {percentage(highestScore)}
            </p>

            <p className="mt-1 text-[10px] text-slate-400">
              Best performance
            </p>
          </motion.div>

          {/* Lowest */}

          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.15,
            }}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(1,0,102,0.035)]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <TrendingDown size={18} />
            </div>

            <p className="mt-5 text-xs font-semibold text-slate-400">
              Lowest Score
            </p>

            <p
              className="mt-1 text-2xl font-black"
              style={{
                color: SCHOOL_BLUE_DARK,
              }}
            >
              {percentage(lowestScore)}
            </p>

            <p className="mt-1 text-[10px] text-slate-400">
              Lowest performance
            </p>
          </motion.div>
        </div>

        {/* =================================================
            RESULTS TABLE
        ================================================== */}

        <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(1,0,102,0.035)]">
          <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Published Results
            </p>

            <h2
              className="mt-1 text-lg font-black"
              style={{
                color: SCHOOL_BLUE_DARK,
              }}
            >
              Course Performance
            </h2>
          </div>

          {data.results.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70">
                    <th className="px-5 py-4 text-left text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Course
                    </th>

                    <th className="px-5 py-4 text-center text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      CA
                    </th>

                    <th className="px-5 py-4 text-center text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Exam
                    </th>

                    <th className="px-5 py-4 text-center text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Total
                    </th>

                    <th className="px-5 py-4 text-center text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Grade
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {data.results.map(
                    (result, index) => {
                      const course =
                        data.courses[result.course_id];

                      const total =
                        result.total_score ?? 0;

                      return (
                        <motion.tr
                          key={result.id}
                          initial={{
                            opacity: 0,
                            y: 10,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          transition={{
                            delay: index * 0.05,
                          }}
                          className="border-b border-slate-100 last:border-b-0"
                        >
                          {/* Course */}

                          <td className="px-5 py-5">
                            <div className="flex items-center gap-3">
                              <div
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                                style={{
                                  backgroundColor: `${SCHOOL_BLUE}08`,
                                  color: SCHOOL_BLUE,
                                }}
                              >
                                <BookOpen size={16} />
                              </div>

                              <div>
                                <p
                                  className="text-sm font-bold"
                                  style={{
                                    color:
                                      SCHOOL_BLUE_DARK,
                                  }}
                                >
                                  {course?.name ??
                                    "Course unavailable"}
                                </p>

                                <p className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                  {course?.code ??
                                    "No course code"}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* CA */}

                          <td className="px-5 py-5 text-center">
                            <span className="text-sm font-bold text-slate-600">
                              {result.ca_score}
                            </span>
                          </td>

                          {/* Exam */}

                          <td className="px-5 py-5 text-center">
                            <span className="text-sm font-bold text-slate-600">
                              {result.exam_score}
                            </span>
                          </td>

                          {/* Total */}

                          <td className="px-5 py-5 text-center">
                            <span
                              className="text-sm font-black"
                              style={{
                                color: SCHOOL_BLUE,
                              }}
                            >
                              {total}
                            </span>
                          </td>

                          {/* Grade */}

                          <td className="px-5 py-5 text-center">
                            <span
                              className={`inline-flex min-w-8 items-center justify-center rounded-full px-3 py-1 text-[10px] font-black ${getGradeClass(
                                result.grade,
                              )}`}
                            >
                              {getGradeLabel(
                                result.grade,
                              )}
                            </span>
                          </td>
                        </motion.tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-5 py-16 text-center">
              <GraduationCap
                size={30}
                className="mx-auto text-slate-300"
              />

              <p
                className="mt-4 text-sm font-bold"
                style={{
                  color: SCHOOL_BLUE_DARK,
                }}
              >
                No published results
              </p>

              <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-400">
                Your published academic results will
                appear here once they are released by
                the school.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}