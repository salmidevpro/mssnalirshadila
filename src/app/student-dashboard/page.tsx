"use client";

import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  GraduationCap,
  Megaphone,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

type DashboardProfile = {
  id: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  email: string | null;
};

type DashboardStudent = {
  id: string;
  user_id: string;
  student_id: string;
  class_id: string | null;
  admission_number: string | null;
  status: string;
};

type DashboardClass = {
  id: string;
  name: string;
};

type DashboardSession = {
  id: string;
  name: string;
  is_current: boolean;
};

type DashboardTerm = {
  id: string;
  session_id: string;
  name: string;
  is_current: boolean;
};

type DashboardCourse = {
  id: string;
  code: string;
  name: string;
  units: number;
};

type DashboardRegistration = {
  id: string;
  course_id: string;
  course: DashboardCourse | null;
};

type DashboardResult = {
  id: string;
  course_id: string;
  ca_score: number;
  exam_score: number;
  total_score: number | null;
  grade: string | null;
  published: boolean;
  course: DashboardCourse | null;
};

type DashboardAssignment = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  max_score: number;
  status: string;
  course: DashboardCourse | null;
};

type DashboardSubmission = {
  id: string;
  assignment_id: string;
  status: string;
};

type DashboardAnnouncement = {
  id: string;
  title: string;
  content: string;
  published_at: string | null;
  created_at: string;
};

type DashboardAttendance = {
  id: string;
  present: boolean;
  attendance_date: string;
};

type DashboardScheduleItem = {
  subject: string;
  time: string;
  teacher: string;
  room: string;
};

type StudentDashboardData = {
  profile: DashboardProfile | null;
  student: DashboardStudent | null;
  class: DashboardClass | null;
  session: DashboardSession | null;
  term: DashboardTerm | null;
  registrations: DashboardRegistration[];
  results: DashboardResult[];
  assignments: DashboardAssignment[];
  submissions: DashboardSubmission[];
  announcements: DashboardAnnouncement[];
  attendance: DashboardAttendance[];
};

/* =========================================================
   EMPTY STATE
========================================================= */

const EMPTY_DATA: StudentDashboardData = {
  profile: null,
  student: null,
  class: null,
  session: null,
  term: null,
  registrations: [],
  results: [],
  assignments: [],
  submissions: [],
  announcements: [],
  attendance: [],
};

/* =========================================================
   HELPERS
========================================================= */

function getPercentage(value: number) {
  return `${Math.round(value)}%`;
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";

  return "Good evening";
}

function formatDate(dateString: string | null) {
  if (!dateString) return "No date";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "No date";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatAnnouncementDate(dateString: string | null) {
  if (!dateString) return "";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* =========================================================
   PAGE
========================================================= */

export default function StudentDashboardPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [data, setData] = useState<StudentDashboardData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  /* =======================================================
     LOAD DASHBOARD
  ======================================================= */

  const loadStudentDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("========================================");
      console.log("🚀 STUDENT DASHBOARD LOADING");
      console.log("========================================");

      /* =====================================================
         1. AUTH USER
      ===================================================== */

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      /*
       * IMPORTANT:
       * Never expose the raw Supabase authentication error
       * to the student.
       */

      if (authError) {
        console.error("Authentication error:", authError);

        const authMessage = authError.message?.toLowerCase() ?? "";

        if (
          authMessage.includes("auth session missing") ||
          authMessage.includes("session missing") ||
          authMessage.includes("jwt") ||
          authMessage.includes("session")
        ) {
          throw new Error(
            "Your login session has expired. Please sign in again to continue.",
          );
        }

        throw new Error(
          "We couldn't verify your login session. Please sign in again to continue.",
        );
      }

      if (!user) {
        throw new Error(
          "Your login session has expired. Please sign in again to continue.",
        );
      }

      console.log("✅ STEP 1 - AUTH USER:", {
        id: user.id,
        email: user.email,
      });

      /* =====================================================
         2. PROFILE
      ===================================================== */

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, middle_name, email")
        .eq("id", user.id)
        .maybeSingle();

      console.log("✅ STEP 2 - PROFILE QUERY RESULT:", {
        profile,
        profileError,
      });

      if (profileError) {
        throw new Error(
          "We couldn't load your student profile. Please try again.",
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

      console.log("✅ STEP 3 - STUDENT QUERY RESULT:", {
        student,
        studentError,
      });

      if (studentError) {
        throw new Error(
          "We couldn't load your student record. Please try again.",
        );
      }

      if (!student) {
        throw new Error(
          "Your account is logged in, but no student record is linked to this account.",
        );
      }

      console.log("🎉 STUDENT FOUND:", student);

      /* =====================================================
         BASIC STUDENT DATA
      ===================================================== */

      setData((previous) => ({
        ...previous,
        profile: profile as DashboardProfile | null,
        student: student as DashboardStudent,
      }));

      setLoading(false);

      console.log("✅ BASIC STUDENT DASHBOARD DATA LOADED");

      /* =====================================================
         4. CURRENT SESSION
      ===================================================== */

      let session: DashboardSession | null = null;

      try {
        console.log("➡️ STEP 4 - Loading academic session...");

        const {
          data: sessionData,
          error: sessionError,
        } = await supabase
          .from("academic_sessions")
          .select("id, name, is_current")
          .eq("is_current", true)
          .maybeSingle();

        console.log("📚 SESSION QUERY:", {
          sessionData,
          sessionError,
        });

        if (sessionError) {
          console.warn(
            "⚠️ Academic session could not be loaded:",
            sessionError.message,
          );
        } else {
          session = sessionData as DashboardSession | null;

          setData((previous) => ({
            ...previous,
            session,
          }));
        }
      } catch (sessionException) {
        console.warn(
          "⚠️ Session query exception:",
          sessionException,
        );
      }

      /* =====================================================
         5. CURRENT TERM
      ===================================================== */

      let term: DashboardTerm | null = null;

      if (session) {
        try {
          console.log("➡️ STEP 5 - Loading academic term...");

          const {
            data: currentTerm,
            error: termError,
          } = await supabase
            .from("academic_terms")
            .select("id, session_id, name, is_current")
            .eq("session_id", session.id)
            .eq("is_current", true)
            .maybeSingle();

          console.log("📅 TERM QUERY:", {
            currentTerm,
            termError,
          });

          if (termError) {
            console.warn(
              "⚠️ Academic term could not be loaded:",
              termError.message,
            );
          } else {
            term = currentTerm as DashboardTerm | null;

            setData((previous) => ({
              ...previous,
              term,
            }));
          }
        } catch (termException) {
          console.warn(
            "⚠️ Term query exception:",
            termException,
          );
        }
      }

      /* =====================================================
         6. CLASS
      ===================================================== */

      let studentClass: DashboardClass | null = null;

      if (student.class_id) {
        try {
          console.log("➡️ STEP 6 - Loading student class...");

          const {
            data: classData,
            error: classError,
          } = await supabase
            .from("classes")
            .select("id, name")
            .eq("id", student.class_id)
            .maybeSingle();

          console.log("🏫 CLASS QUERY:", {
            classData,
            classError,
          });

          if (classError) {
            console.warn(
              "⚠️ Class could not be loaded:",
              classError.message,
            );
          } else {
            studentClass = classData as DashboardClass | null;

            setData((previous) => ({
              ...previous,
              class: studentClass,
            }));
          }
        } catch (classException) {
          console.warn(
            "⚠️ Class query exception:",
            classException,
          );
        }
      } else {
        console.log("ℹ️ Student has no class_id.");
      }

      /* =====================================================
         7. COURSE REGISTRATIONS
      ===================================================== */

      if (session && term) {
        try {
          console.log("➡️ STEP 7 - Loading course registrations...");

          const {
            data: registrationData,
            error: registrationError,
          } = await supabase
            .from("course_registrations")
            .select(
              `
              id,
              course_id,
              course:courses (
                id,
                code,
                name,
                units
              )
              `,
            )
            .eq("student_id", student.id)
            .eq("session_id", session.id)
            .eq("term_id", term.id);

          console.log("📚 REGISTRATIONS QUERY:", {
            registrationData,
            registrationError,
          });

          if (registrationError) {
            console.warn(
              "⚠️ Course registrations could not be loaded:",
              registrationError.message,
            );
          } else {
            const registrations = (
              registrationData ?? []
            ).map((registration) => ({
              ...registration,
              course: Array.isArray(registration.course)
                ? (registration.course[0] ?? null)
                : registration.course,
            })) as DashboardRegistration[];

            setData((previous) => ({
              ...previous,
              registrations,
            }));
          }
        } catch (registrationException) {
          console.warn(
            "⚠️ Registration query exception:",
            registrationException,
          );
        }
      }

      /* =====================================================
         8. RESULTS
      ===================================================== */

      if (session && term) {
        try {
          console.log("➡️ STEP 8 - Loading results...");

          const {
            data: resultData,
            error: resultError,
          } = await supabase
            .from("results")
            .select(
              `
              id,
              course_id,
              ca_score,
              exam_score,
              total_score,
              grade,
              published,
              course:courses (
                id,
                code,
                name,
                units
              )
              `,
            )
            .eq("student_id", student.id)
            .eq("session_id", session.id)
            .eq("term_id", term.id)
            .eq("published", true);

          console.log("📊 RESULTS QUERY:", {
            resultData,
            resultError,
          });

          if (resultError) {
            console.warn(
              "⚠️ Results could not be loaded:",
              resultError.message,
            );
          } else {
            const results = (
              resultData ?? []
            ).map((result) => ({
              ...result,
              course: Array.isArray(result.course)
                ? (result.course[0] ?? null)
                : result.course,
            })) as DashboardResult[];

            setData((previous) => ({
              ...previous,
              results,
            }));
          }
        } catch (resultException) {
          console.warn(
            "⚠️ Result query exception:",
            resultException,
          );
        }
      }

      /* =====================================================
         9. ASSIGNMENTS
      ===================================================== */

      if (session && term) {
        try {
          console.log("➡️ STEP 9 - Loading assignments...");

          const {
            data: assignmentData,
            error: assignmentError,
          } = await supabase
            .from("assignments")
            .select(
              `
              id,
              course_id,
              title,
              description,
              due_date,
              max_score,
              status,
              course:courses (
                id,
                code,
                name,
                units
              )
              `,
            )
            .eq("session_id", session.id)
            .eq("term_id", term.id)
            .neq("status", "draft")
            .order("due_date", {
              ascending: true,
              nullsFirst: false,
            })
            .limit(10);

          console.log("📝 ASSIGNMENTS QUERY:", {
            assignmentData,
            assignmentError,
          });

          if (assignmentError) {
            console.warn(
              "⚠️ Assignments could not be loaded:",
              assignmentError.message,
            );
          } else {
            const assignments = (
              (assignmentData ?? []) as Array<
                Omit<DashboardAssignment, "course"> & {
                  course:
                    | DashboardCourse
                    | DashboardCourse[]
                    | null;
                }
              >
            ).map((assignment) => ({
              ...assignment,
              course: Array.isArray(assignment.course)
                ? (assignment.course[0] ?? null)
                : assignment.course,
            }));

            setData((previous) => ({
              ...previous,
              assignments,
            }));

            /* =============================================
               10. SUBMISSIONS
            ============================================= */

            if (assignments.length > 0) {
              try {
                console.log(
                  "➡️ STEP 10 - Loading submissions...",
                );

                const assignmentIds = assignments.map(
                  (assignment) => assignment.id,
                );

                const {
                  data: submissionData,
                  error: submissionError,
                } = await supabase
                  .from("submissions")
                  .select(
                    "id, assignment_id, status",
                  )
                  .eq("student_id", student.id)
                  .in(
                    "assignment_id",
                    assignmentIds,
                  );

                console.log("📤 SUBMISSIONS QUERY:", {
                  submissionData,
                  submissionError,
                });

                if (submissionError) {
                  console.warn(
                    "⚠️ Submissions could not be loaded:",
                    submissionError.message,
                  );
                } else {
                  const submissions =
                    (submissionData as DashboardSubmission[]) ??
                    [];

                  setData((previous) => ({
                    ...previous,
                    submissions,
                  }));
                }
              } catch (submissionException) {
                console.warn(
                  "⚠️ Submission query exception:",
                  submissionException,
                );
              }
            }
          }
        } catch (assignmentException) {
          console.warn(
            "⚠️ Assignment query exception:",
            assignmentException,
          );
        }
      }

      /* =====================================================
         11. ANNOUNCEMENTS
      ===================================================== */

      try {
        console.log(
          "➡️ STEP 11 - Loading announcements...",
        );

        const {
          data: announcementData,
          error: announcementError,
        } = await supabase
          .from("announcements")
          .select(
            "id, title, content, published_at, created_at",
          )
          .eq("is_published", true)
          .order("published_at", {
            ascending: false,
            nullsFirst: false,
          })
          .limit(5);

        console.log("📢 ANNOUNCEMENTS QUERY:", {
          announcementData,
          announcementError,
        });

        if (announcementError) {
          console.warn(
            "⚠️ Announcements could not be loaded:",
            announcementError.message,
          );
        } else {
          const announcements =
            (announcementData as DashboardAnnouncement[]) ??
            [];

          setData((previous) => ({
            ...previous,
            announcements,
          }));
        }
      } catch (announcementException) {
        console.warn(
          "⚠️ Announcement query exception:",
          announcementException,
        );
      }

      /* =====================================================
         12. ATTENDANCE
      ===================================================== */

      if (session && term) {
        try {
          console.log(
            "➡️ STEP 12 - Loading attendance...",
          );

          const {
            data: attendanceData,
            error: attendanceError,
          } = await supabase
            .from("attendance")
            .select(
              "id, present, attendance_date",
            )
            .eq("student_id", student.id)
            .eq("session_id", session.id)
            .eq("term_id", term.id)
            .order("attendance_date", {
              ascending: false,
            });

          console.log("🕐 ATTENDANCE QUERY:", {
            attendanceData,
            attendanceError,
          });

          if (attendanceError) {
            console.warn(
              "⚠️ Attendance could not be loaded:",
              attendanceError.message,
            );
          } else {
            const attendance =
              (attendanceData as DashboardAttendance[]) ??
              [];

            setData((previous) => ({
              ...previous,
              attendance,
            }));
          }
        } catch (attendanceException) {
          console.warn(
            "⚠️ Attendance query exception:",
            attendanceException,
          );
        }
      }

      /* =====================================================
         COMPLETE
      ===================================================== */

      console.log("========================================");
      console.log("🎉 STUDENT DASHBOARD LOADING COMPLETE");
      console.log("========================================");
    } catch (err) {
      console.error(
        "❌ STUDENT DASHBOARD ERROR:",
        err,
      );

      /*
       * IMPORTANT:
       * Convert unexpected technical errors into a friendly
       * message instead of exposing Supabase internals.
       */

      const rawMessage =
        err instanceof Error
          ? err.message
          : "";

      const normalizedMessage =
        rawMessage.toLowerCase();

      if (
        normalizedMessage.includes(
          "auth session missing",
        ) ||
        normalizedMessage.includes(
          "session missing",
        ) ||
        normalizedMessage.includes(
          "jwt",
        ) ||
        normalizedMessage.includes(
          "session has expired",
        ) ||
        normalizedMessage.includes(
          "login session",
        )
      ) {
        setError(
          "Your login session has expired. Please sign in again to continue.",
        );
      } else {
        setError(
          rawMessage ||
            "We couldn't load your dashboard right now. Please try again.",
        );
      }

      setLoading(false);
    }
  }, [supabase]);

  /* =======================================================
     LOAD ON MOUNT / RETRY
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    const timeoutId = window.setTimeout(() => {
      if (mounted) {
        void loadStudentDashboard();
      }
    }, 0);

    return () => {
      mounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [loadStudentDashboard, retryCount]);

  /* =======================================================
     DERIVED DATA
  ======================================================= */

  const averageScore = useMemo(() => {
    const validResults = data.results.filter(
      (result) =>
        typeof result.total_score === "number",
    );

    if (validResults.length === 0) return 0;

    const total = validResults.reduce(
      (sum, result) =>
        sum + (result.total_score ?? 0),
      0,
    );

    return total / validResults.length;
  }, [data.results]);

  const attendancePercentage = useMemo(() => {
    if (data.attendance.length === 0) return 0;

    const present = data.attendance.filter(
      (item) => item.present,
    ).length;

    return (
      (present / data.attendance.length) * 100
    );
  }, [data.attendance]);

  const pendingAssignments = useMemo(() => {
    return data.assignments.filter(
      (assignment) => {
        const submitted =
          data.submissions.some(
            (submission) =>
              submission.assignment_id ===
              assignment.id,
          );

        return !submitted;
      },
    );
  }, [data.assignments, data.submissions]);

  const recentAssignments = useMemo(() => {
    return data.assignments.slice(0, 4);
  }, [data.assignments]);

  const recentResults = useMemo(() => {
    return data.results.slice(0, 4);
  }, [data.results]);

  const displayName = useMemo(() => {
    if (!data.profile) return "Student";

    return (
      data.profile.first_name ||
      data.profile.last_name ||
      "Student"
    );
  }, [data.profile]);

  const schedule = useMemo<
    DashboardScheduleItem[]
  >(() => {
    return [];
  }, []);

  /* =======================================================
     ERROR TYPE
  ======================================================= */

  const isSessionError = useMemo(() => {
    if (!error) return false;

    const message = error.toLowerCase();

    return (
      message.includes("login session") ||
      message.includes("sign in again") ||
      message.includes("session has expired")
    );
  }, [error]);

  /* =======================================================
     LOADING STATE
  ======================================================= */

  if (loading) {
    return (
      <div className="min-h-full bg-slate-50">
        <div className="border-b border-slate-200 bg-white">
          <div className="px-5 py-7 sm:px-8 sm:py-9">
            <div className="animate-pulse">
              <div className="h-3 w-32 rounded bg-slate-200" />

              <div className="mt-3 h-8 w-72 rounded bg-slate-200" />

              <div className="mt-3 h-4 w-full max-w-xl rounded bg-slate-100" />
            </div>
          </div>
        </div>

        <main className="px-5 py-7 sm:px-8 sm:py-9">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-white"
              />
            ))}
          </div>

          <div className="mt-7 grid gap-6 xl:grid-cols-2">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white"
              />
            ))}
          </div>
        </main>
      </div>
    );
  }

  /* =======================================================
     ERROR STATE
  ======================================================= */

  if (error) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-5">
        <motion.div
          initial={{
            opacity: 0,
            y: 15,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.35,
          }}
          className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-[0_15px_50px_rgba(1,0,102,0.06)]"
        >
          {/* ICON */}

          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{
              backgroundColor: `${SCHOOL_BLUE}08`,
              color: SCHOOL_BLUE,
            }}
          >
            {isSessionError ? (
              <svg
                width="25"
                height="25"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line
                  x1="15"
                  y1="12"
                  x2="3"
                  y2="12"
                />
              </svg>
            ) : (
              <ClipboardList size={24} />
            )}
          </div>

          {/* LABEL */}

          <p
            className="mt-5 text-[10px] font-bold uppercase tracking-[0.18em]"
            style={{
              color: SCHOOL_GOLD,
            }}
          >
            {isSessionError
              ? "Session Required"
              : "Dashboard"}
          </p>

          {/* TITLE */}

          <h1
            className="mt-2 text-xl font-black"
            style={{
              color: SCHOOL_BLUE_DARK,
            }}
          >
            {isSessionError
              ? "Please sign in again"
              : "Unable to load dashboard"}
          </h1>

          {/* MESSAGE */}

          <p className="mt-3 text-sm leading-6 text-slate-500">
            {error}
          </p>

          {/* EXTRA SESSION MESSAGE */}

          {isSessionError && (
            <p className="mt-2 text-xs leading-5 text-slate-400">
              Your account is safe. Sign in again to continue
              accessing your student dashboard.
            </p>
          )}

          {/* ACTIONS */}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {isSessionError ? (
              <button
                type="button"
                onClick={() => {
                  router.push("/student-login");
                }}
                className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                style={{
                  backgroundColor: SCHOOL_BLUE,
                }}
              >
                Sign In Again

                <ArrowRight size={15} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  setRetryCount(
                    (count) => count + 1,
                  )
                }
                className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                style={{
                  backgroundColor: SCHOOL_BLUE,
                }}
              >
                Try Again
              </button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  /* =======================================================
     DASHBOARD
  ======================================================= */

  return (
    <div className="min-h-full bg-slate-50">

      {/* =================================================
          PAGE HEADER
      ================================================== */}

      <section className="border-b border-slate-200 bg-white">
        <div className="px-5 py-7 sm:px-8 sm:py-9">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <p
                className="text-[10px] font-bold uppercase tracking-[0.22em]"
                style={{
                  color: SCHOOL_GOLD,
                }}
              >
                Student Dashboard
              </p>

              <h1
                className="mt-2 text-2xl font-black tracking-tight sm:text-3xl"
                style={{
                  color: SCHOOL_BLUE_DARK,
                }}
              >
                {getGreeting()}, {displayName}.
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Welcome back. Here is an overview of your academic activities,
                performance and upcoming work.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Academic Session
                </p>

                <p
                  className="mt-1 text-sm font-bold"
                  style={{
                    color: SCHOOL_BLUE,
                  }}
                >
                  {data.session?.name ??
                    "Not set"}
                </p>
              </div>

              <div
                className="rounded-2xl px-4 py-3 text-white"
                style={{
                  backgroundColor:
                    SCHOOL_BLUE,
                }}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">
                  Current Term
                </p>

                <p className="mt-1 text-sm font-bold">
                  {data.term?.name ??
                    "Not set"}
                </p>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* =================================================
          MAIN
      ================================================== */}

      <main className="px-5 py-7 sm:px-8 sm:py-9">

        {/* =================================================
            STUDENT INFO
        ================================================== */}

        <section className="mb-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(1,0,102,0.035)]">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Student Profile
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

                {data.class?.name
                  ? ` • ${data.class.name}`
                  : ""}
              </p>

              {data.profile?.email && (
                <p className="mt-1 text-xs text-slate-400">
                  {data.profile.email}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">

              {data.student
                ?.admission_number && (
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-bold text-slate-500">
                  Admission:{" "}
                  {data.student.admission_number}
                </span>
              )}

              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold capitalize text-emerald-600">
                {data.student?.status ??
                  "active"}
              </span>

            </div>
          </div>
        </section>

        {/* =================================================
            STATISTICS
        ================================================== */}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {[
            {
              title: "Current Average",
              value: getPercentage(
                averageScore,
              ),
              label: "Published results",
              icon: TrendingUp,
            },
            {
              title: "Courses",
              value: String(
                data.registrations.length,
              ),
              label: "Courses registered",
              icon: BookOpen,
            },
            {
              title: "Assignments",
              value: String(
                pendingAssignments.length,
              ),
              label: "Pending submissions",
              icon: ClipboardList,
            },
            {
              title: "Attendance",
              value: getPercentage(
                attendancePercentage,
              ),
              label: "Current attendance",
              icon: CheckCircle2,
            },
          ].map((stat, index) => {

            const Icon = stat.icon;

            return (
              <motion.div
                key={stat.title}
                initial={{
                  opacity: 0,
                  y: 20,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.45,
                  delay: index * 0.07,
                }}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(1,0,102,0.035)]"
              >

                <div className="flex items-start justify-between">

                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor:
                        `${SCHOOL_BLUE}08`,
                      color: SCHOOL_BLUE,
                    }}
                  >
                    <Icon size={20} />
                  </div>

                  <span className="text-xs font-semibold text-emerald-600">
                    Active
                  </span>

                </div>

                <p className="mt-5 text-xs font-semibold text-slate-400">
                  {stat.title}
                </p>

                <p
                  className="mt-1 text-2xl font-black"
                  style={{
                    color:
                      SCHOOL_BLUE_DARK,
                  }}
                >
                  {stat.value}
                </p>

                <p className="mt-1 text-[11px] text-slate-400">
                  {stat.label}
                </p>

              </motion.div>
            );
          })}
        </div>

        {/* =================================================
            QUICK ACTIONS
        ================================================== */}

        <section className="mt-7">

          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Quick Access
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

            {[
              {
                title: "My Courses",
                text: "View your registered courses",
                href: "/student-dashboard/courses",
                icon: BookOpen,
              },
              {
                title: "Assignments",
                text: "Check pending assignments",
                href: "/student-dashboard/assignments",
                icon: ClipboardList,
              },
              {
                title: "Results",
                text: "View your academic results",
                href: "/student-dashboard/results",
                icon: GraduationCap,
              },
              {
                title: "Calendar",
                text: "View academic activities",
                href: "/student-dashboard/calendar",
                icon: CalendarDays,
              },
            ].map((item) => {

              const Icon = item.icon;

              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[#010066]/20 hover:shadow-lg"
                >

                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor:
                        `${SCHOOL_BLUE}08`,
                      color: SCHOOL_BLUE,
                    }}
                  >
                    <Icon size={19} />
                  </div>

                  <div className="min-w-0 flex-1">

                    <p
                      className="text-sm font-bold"
                      style={{
                        color:
                          SCHOOL_BLUE_DARK,
                      }}
                    >
                      {item.title}
                    </p>

                    <p className="mt-1 truncate text-[11px] text-slate-400">
                      {item.text}
                    </p>

                  </div>

                  <ArrowRight
                    size={16}
                    className="text-slate-300 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-[#010066]"
                  />

                </Link>
              );
            })}
          </div>
        </section>

        {/* =================================================
            SCHEDULE + ANNOUNCEMENTS
        ================================================== */}

        <div className="mt-7 grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">

          {/* =================================================
              TODAY'S SCHEDULE
          ================================================== */}

          <section className="rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(1,0,102,0.035)]">

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Academic Schedule
                </p>

                <h2
                  className="mt-1 text-lg font-black"
                  style={{
                    color:
                      SCHOOL_BLUE_DARK,
                  }}
                >
                  Today&apos;s Classes
                </h2>
              </div>

              <Link
                href="/student-dashboard/calendar"
                className="text-xs font-bold"
                style={{
                  color: SCHOOL_BLUE,
                }}
              >
                Full calendar
              </Link>

            </div>

            {schedule.length > 0 ? (

              <div className="divide-y divide-slate-100">

                {schedule.map(
                  (item, index) => (
                    <motion.div
                      key={`${item.subject}-${index}`}
                      initial={{
                        opacity: 0,
                        x: -15,
                      }}
                      animate={{
                        opacity: 1,
                        x: 0,
                      }}
                      transition={{
                        duration: 0.4,
                        delay:
                          0.2 +
                          index * 0.06,
                      }}
                      className="flex items-center gap-4 px-5 py-4 sm:px-6"
                    >

                      <div className="w-16 shrink-0">
                        <p className="text-xs font-bold text-slate-500">
                          {item.time}
                        </p>
                      </div>

                      <div
                        className="h-10 w-1 shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            SCHOOL_GOLD,
                        }}
                      />

                      <div className="min-w-0 flex-1">

                        <p
                          className="text-sm font-bold"
                          style={{
                            color:
                              SCHOOL_BLUE_DARK,
                          }}
                        >
                          {item.subject}
                        </p>

                        <p className="mt-1 text-[11px] text-slate-400">
                          {item.teacher} •{" "}
                          {item.room}
                        </p>

                      </div>

                      <Clock3
                        size={16}
                        className="hidden text-slate-300 sm:block"
                      />

                    </motion.div>
                  ),
                )}

              </div>

            ) : (

              <div className="px-5 py-12 text-center sm:px-6">

                <CalendarDays
                  size={25}
                  className="mx-auto text-slate-300"
                />

                <p
                  className="mt-3 text-sm font-bold"
                  style={{
                    color:
                      SCHOOL_BLUE_DARK,
                  }}
                >
                  No timetable available yet
                </p>

                <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-400">
                  Your timetable will appear here once the school schedule has
                  been configured.
                </p>

              </div>
            )}

          </section>

          {/* =================================================
              ANNOUNCEMENTS
          ================================================== */}

          <section className="rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(1,0,102,0.035)]">

            <div className="border-b border-slate-100 px-5 py-5 sm:px-6">

              <div className="flex items-center gap-3">

                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor:
                      `${SCHOOL_GOLD}18`,
                    color: SCHOOL_GOLD,
                  }}
                >
                  <Megaphone size={18} />
                </div>

                <div>

                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    Notice Board
                  </p>

                  <h2
                    className="mt-1 text-lg font-black"
                    style={{
                      color:
                        SCHOOL_BLUE_DARK,
                    }}
                  >
                    Announcements
                  </h2>

                </div>
              </div>
            </div>

            {data.announcements.length >
            0 ? (

              <div className="divide-y divide-slate-100">

                {data.announcements.map(
                  (item) => (
                    <div
                      key={item.id}
                      className="px-5 py-4 sm:px-6"
                    >

                      <p
                        className="text-sm font-bold"
                        style={{
                          color:
                            SCHOOL_BLUE_DARK,
                        }}
                      >
                        {item.title}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {item.content}
                      </p>

                      <p className="mt-2 text-[10px] font-semibold text-slate-400">
                        {formatAnnouncementDate(
                          item.published_at ??
                            item.created_at,
                        )}
                      </p>

                    </div>
                  ),
                )}

              </div>

            ) : (

              <div className="px-5 py-12 text-center sm:px-6">

                <Megaphone
                  size={25}
                  className="mx-auto text-slate-300"
                />

                <p
                  className="mt-3 text-sm font-bold"
                  style={{
                    color:
                      SCHOOL_BLUE_DARK,
                  }}
                >
                  No announcements
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  School announcements will appear here.
                </p>

              </div>
            )}

          </section>

        </div>

        {/* =================================================
            ASSIGNMENTS + RESULTS
        ================================================== */}

        <div className="mt-6 grid gap-6 xl:grid-cols-2">

          {/* =================================================
              ASSIGNMENTS
          ================================================== */}

          <section className="rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(1,0,102,0.035)]">

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">

              <div>

                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Coursework
                </p>

                <h2
                  className="mt-1 text-lg font-black"
                  style={{
                    color:
                      SCHOOL_BLUE_DARK,
                  }}
                >
                  Recent Assignments
                </h2>

              </div>

              <Link
                href="/student-dashboard/assignments"
                className="text-xs font-bold"
                style={{
                  color: SCHOOL_BLUE,
                }}
              >
                View all
              </Link>

            </div>

            {recentAssignments.length >
            0 ? (

              <div className="divide-y divide-slate-100">

                {recentAssignments.map(
                  (item) => {

                    const submitted =
                      data.submissions.some(
                        (submission) =>
                          submission.assignment_id ===
                          item.id,
                      );

                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 px-5 py-4 sm:px-6"
                      >

                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                          style={{
                            backgroundColor:
                              `${SCHOOL_BLUE}08`,
                            color:
                              SCHOOL_BLUE,
                          }}
                        >
                          <ClipboardList
                            size={18}
                          />
                        </div>

                        <div className="min-w-0 flex-1">

                          <p
                            className="truncate text-sm font-bold"
                            style={{
                              color:
                                SCHOOL_BLUE_DARK,
                            }}
                          >
                            {item.title}
                          </p>

                          <p className="mt-1 text-[11px] text-slate-400">
                            {item.course
                              ?.name ??
                              "Course unavailable"}
                          </p>

                        </div>

                        <div className="text-right">

                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                              submitted
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-amber-50 text-amber-600"
                            }`}
                          >
                            {submitted
                              ? "Submitted"
                              : "Pending"}
                          </span>

                          <p className="mt-2 text-[10px] text-slate-400">
                            {formatDate(
                              item.due_date,
                            )}
                          </p>

                        </div>

                      </div>
                    );
                  },
                )}

              </div>

            ) : (

              <div className="px-5 py-12 text-center sm:px-6">

                <ClipboardList
                  size={25}
                  className="mx-auto text-slate-300"
                />

                <p
                  className="mt-3 text-sm font-bold"
                  style={{
                    color:
                      SCHOOL_BLUE_DARK,
                  }}
                >
                  No assignments
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Your current assignments will appear here.
                </p>

              </div>
            )}

          </section>

          {/* =================================================
              RESULTS
          ================================================== */}

          <section className="rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(1,0,102,0.035)]">

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">

              <div>

                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Academic Performance
                </p>

                <h2
                  className="mt-1 text-lg font-black"
                  style={{
                    color:
                      SCHOOL_BLUE_DARK,
                  }}
                >
                  Recent Results
                </h2>

              </div>

              <Link
                href="/student-dashboard/results"
                className="text-xs font-bold"
                style={{
                  color: SCHOOL_BLUE,
                }}
              >
                View results
              </Link>

            </div>

            {recentResults.length >
            0 ? (

              <div className="divide-y divide-slate-100">

                {recentResults.map(
                  (item) => {

                    const score =
                      Math.max(
                        0,
                        Math.min(
                          100,
                          item.total_score ??
                            0,
                        ),
                      );

                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 px-5 py-4 sm:px-6"
                      >

                        <div className="min-w-0 flex-1">

                          <p
                            className="text-sm font-bold"
                            style={{
                              color:
                                SCHOOL_BLUE_DARK,
                            }}
                          >
                            {item.course
                              ?.name ??
                              "Course unavailable"}
                          </p>

                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">

                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${score}%`,
                                backgroundColor:
                                  SCHOOL_BLUE,
                              }}
                            />

                          </div>
                        </div>

                        <div className="text-right">

                          <p
                            className="text-sm font-black"
                            style={{
                              color:
                                SCHOOL_BLUE,
                            }}
                          >
                            {getPercentage(
                              score,
                            )}
                          </p>

                          {item.grade && (
                            <p
                              className="mt-1 text-[10px] font-bold"
                              style={{
                                color:
                                  SCHOOL_GOLD,
                              }}
                            >
                              Grade{" "}
                              {item.grade}
                            </p>
                          )}

                        </div>

                      </div>
                    );
                  },
                )}

              </div>

            ) : (

              <div className="px-5 py-12 text-center sm:px-6">

                <GraduationCap
                  size={25}
                  className="mx-auto text-slate-300"
                />

                <p
                  className="mt-3 text-sm font-bold"
                  style={{
                    color:
                      SCHOOL_BLUE_DARK,
                  }}
                >
                  No published results
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Your published academic results will appear here.
                </p>

              </div>
            )}

          </section>

        </div>

        {/* =================================================
            BOTTOM CTA
        ================================================== */}

        <section
          className="relative mt-7 overflow-hidden rounded-2xl p-6 sm:p-8"
          style={{
            backgroundColor:
              SCHOOL_BLUE,
          }}
        >

          <div
            aria-hidden="true"
            className="absolute -right-20 -top-20 h-52 w-52 rounded-full blur-3xl"
            style={{
              backgroundColor:
                `${SCHOOL_GOLD}20`,
            }}
          />

          <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FFAF2E]">
                Keep Learning
              </p>

              <h2 className="mt-2 text-xl font-black text-white sm:text-2xl">
                Stay on top of your academic journey.
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-white/55">
                Review your courses, complete assignments and monitor your
                academic progress throughout the term.
              </p>

            </div>

            <Link
              href="/student-dashboard/courses"
              className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              style={{
                color: SCHOOL_BLUE,
              }}
            >
              View My Courses

              <ArrowRight
                size={15}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />

            </Link>

          </div>
        </section>

      </main>
    </div>
  );
}