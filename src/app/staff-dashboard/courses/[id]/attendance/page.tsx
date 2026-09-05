"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  Loader2,
  Save,
  Search,
  Users,
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Course = {
  id: string;
  code: string | null;
  name: string;
  class_id: string | null;
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
  name: "first" | "second" | "third";
  is_current: boolean;
};

type Student = {
  id: string;
  full_name: string;
  student_id: string | null;
  admission_number: string | null;
};

type Enrollment = {
  id: string;
  student_id: string;
  class_id: string;
  session_id: string;
  status: string;
  students: Student | Student[] | null;
};

type AttendanceRecord = {
  id: string;
  student_id: string;
  session_id: string;
  term_id: string;
  attendance_date: string;
  present: boolean;
  note: string | null;
};

type AttendanceState = {
  present: boolean;
  note: string;
};

export default function CourseAttendancePage() {
  const params = useParams();
  const router = useRouter();

  const supabase = createClient();

  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [session, setSession] =
    useState<AcademicSession | null>(null);
  const [term, setTerm] =
    useState<AcademicTerm | null>(null);

  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<
    Record<string, AttendanceState>
  >({});

  const [selectedDate, setSelectedDate] = useState(
    getTodayDate()
  );

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!courseId) return;

    loadPage();
  }, [courseId]);

  useEffect(() => {
    if (!courseId || !session || !term || students.length === 0) {
      return;
    }

    loadAttendanceForDate();
  }, [selectedDate]);

  async function loadPage() {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      /*
       * =====================================================
       * 1. AUTH
       * =====================================================
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
       * =====================================================
       * 2. STAFF
       * =====================================================
       */

      const { data: staff, error: staffError } =
        await supabase
          .from("staff")
          .select(
            "id, user_id, staff_id, status"
          )
          .eq("user_id", user.id)
          .eq("status", "active")
          .maybeSingle<Staff>();

      if (staffError) {
        throw new Error(
          "Unable to verify your staff account."
        );
      }

      if (!staff) {
        throw new Error(
          "Your active staff account could not be found."
        );
      }

      /*
       * =====================================================
       * 3. CURRENT SESSION
       * =====================================================
       */

      const {
        data: currentSession,
        error: sessionError,
      } = await supabase
        .from("academic_sessions")
        .select("id, name, is_current")
        .eq("is_current", true)
        .maybeSingle<AcademicSession>();

      if (sessionError) {
        throw new Error(
          "Unable to load the current academic session."
        );
      }

      if (!currentSession) {
        throw new Error(
          "No active academic session was found."
        );
      }

      setSession(currentSession);

      /*
       * =====================================================
       * 4. CURRENT TERM
       * =====================================================
       */

      const {
        data: currentTerm,
        error: termError,
      } = await supabase
        .from("academic_terms")
        .select("id, name, is_current")
        .eq("session_id", currentSession.id)
        .eq("is_current", true)
        .maybeSingle<AcademicTerm>();

      if (termError) {
        throw new Error(
          "Unable to load the current academic term."
        );
      }

      if (!currentTerm) {
        throw new Error(
          "No active academic term was found."
        );
      }

      setTerm(currentTerm);

      /*
       * =====================================================
       * 5. VERIFY TEACHER COURSE ASSIGNMENT
       * =====================================================
       */

      const {
        data: courseAssignment,
        error: courseAssignmentError,
      } = await supabase
        .from("course_teachers")
        .select(
          `
            id,
            course_id,
            teacher_id,
            session_id,
            term_id
          `
        )
        .eq("course_id", courseId)
        .eq("teacher_id", staff.id)
        .eq("session_id", currentSession.id)
        .eq("term_id", currentTerm.id)
        .maybeSingle();

      if (courseAssignmentError) {
        throw new Error(
          "Unable to verify your assignment to this course."
        );
      }

      if (!courseAssignment) {
        throw new Error(
          "You are not assigned to teach this course for the current term."
        );
      }

      /*
       * =====================================================
       * 6. COURSE
       * =====================================================
       */

      const { data: courseData, error: courseError } =
        await supabase
          .from("courses")
          .select(
            "id, code, name, class_id"
          )
          .eq("id", courseId)
          .maybeSingle<Course>();

      if (courseError) {
        throw new Error(
          "Unable to load course information."
        );
      }

      if (!courseData) {
        throw new Error("Course not found.");
      }

      setCourse(courseData);

      if (!courseData.class_id) {
        setStudents([]);
        return;
      }

      /*
       * =====================================================
       * 7. STUDENTS IN COURSE CLASS
       * =====================================================
       *
       * IMPORTANT:
       * student_enrollments does NOT have term_id.
       */

      const {
        data: enrollmentData,
        error: enrollmentError,
      } = await supabase
        .from("student_enrollments")
        .select(
          `
            id,
            student_id,
            class_id,
            session_id,
            status,
            students (
              id,
              full_name,
              student_id,
              admission_number
            )
          `
        )
        .eq("session_id", currentSession.id)
        .eq("class_id", courseData.class_id)
        .eq("status", "active");

      if (enrollmentError) {
        throw new Error(
          "Unable to load students for this course."
        );
      }

      const studentList: Student[] = (
        (enrollmentData as Enrollment[]) || []
      )
        .flatMap((enrollment) => {
          if (!enrollment.students) {
            return [];
          }

          if (Array.isArray(enrollment.students)) {
            return enrollment.students;
          }

          return [enrollment.students];
        })
        .filter(Boolean);

      const uniqueStudents = Array.from(
        new Map(
          studentList.map((student) => [
            student.id,
            student,
          ])
        ).values()
      );

      setStudents(uniqueStudents);

      /*
       * =====================================================
       * 8. LOAD ATTENDANCE FOR TODAY
       * =====================================================
       */

      await loadAttendance(
        currentSession.id,
        currentTerm.id,
        uniqueStudents,
        selectedDate
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading attendance."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * ==========================================================
   * LOAD ATTENDANCE FOR SELECTED DATE
   * ==========================================================
   */

  async function loadAttendanceForDate() {
    if (!session || !term) return;

    await loadAttendance(
      session.id,
      term.id,
      students,
      selectedDate
    );
  }

  async function loadAttendance(
    sessionId: string,
    termId: string,
    studentList: Student[],
    date: string
  ) {
    if (studentList.length === 0) {
      setAttendance({});
      return;
    }

    const studentIds = studentList.map(
      (student) => student.id
    );

    const {
      data: attendanceData,
      error: attendanceError,
    } = await supabase
      .from("attendance")
      .select(
        `
          id,
          student_id,
          session_id,
          term_id,
          attendance_date,
          present,
          note
        `
      )
      .eq("session_id", sessionId)
      .eq("term_id", termId)
      .eq("attendance_date", date)
      .in("student_id", studentIds);

    if (attendanceError) {
      console.error(
        "Attendance load error:",
        attendanceError
      );

      throw new Error(
        "Unable to load attendance for this date."
      );
    }

    const records =
      (attendanceData as AttendanceRecord[]) || [];

    const state: Record<
      string,
      AttendanceState
    > = {};

    /*
     * Students default to PRESENT.
     *
     * Teacher can mark individual students absent.
     */

    studentList.forEach((student) => {
      const existing = records.find(
        (record) =>
          record.student_id === student.id
      );

      state[student.id] = {
        present:
          existing?.present ?? true,

        note:
          existing?.note ?? "",
      };
    });

    setAttendance(state);
  }

  /*
   * ==========================================================
   * MARK PRESENT / ABSENT
   * ==========================================================
   */

  function setStudentAttendance(
    studentId: string,
    present: boolean
  ) {
    setAttendance((current) => ({
      ...current,
      [studentId]: {
        present,
        note:
          current[studentId]?.note || "",
      },
    }));

    setSuccess("");
  }

  /*
   * ==========================================================
   * UPDATE NOTE
   * ==========================================================
   */

  function updateNote(
    studentId: string,
    note: string
  ) {
    setAttendance((current) => ({
      ...current,
      [studentId]: {
        present:
          current[studentId]?.present ?? true,
        note,
      },
    }));

    setSuccess("");
  }

  /*
   * ==========================================================
   * MARK ALL PRESENT
   * ==========================================================
   */

  function markAllPresent() {
    setAttendance((current) => {
      const updated = {
        ...current,
      };

      students.forEach((student) => {
        updated[student.id] = {
          present: true,
          note:
            current[student.id]?.note || "",
        };
      });

      return updated;
    });

    setSuccess("");
  }

  /*
   * ==========================================================
   * MARK ALL ABSENT
   * ==========================================================
   */

  function markAllAbsent() {
    setAttendance((current) => {
      const updated = {
        ...current,
      };

      students.forEach((student) => {
        updated[student.id] = {
          present: false,
          note:
            current[student.id]?.note || "",
        };
      });

      return updated;
    });

    setSuccess("");
  }

  /*
   * ==========================================================
   * SAVE ATTENDANCE
   * ==========================================================
   */

  async function saveAttendance() {
    if (!session || !term || !course) {
      return;
    }

    if (students.length === 0) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const rows = students.map((student) => ({
        student_id: student.id,
        session_id: session.id,
        term_id: term.id,
        attendance_date: selectedDate,
        present:
          attendance[student.id]?.present ?? true,
        note:
          attendance[student.id]?.note?.trim() || null,
      }));

      /*
       * We use upsert so marking attendance again for
       * the same student/date updates the existing record
       * instead of creating duplicates.
       *
       * This assumes the attendance table has a suitable
       * unique constraint for student/session/term/date.
       */

      const { error: saveError } =
        await supabase
          .from("attendance")
          .upsert(rows, {
            onConflict:
              "student_id,session_id,term_id,attendance_date",
          });

      if (saveError) {
        throw new Error(
          saveError.message ||
            "Unable to save attendance."
        );
      }

      setSuccess(
        `Attendance saved successfully for ${formatDate(
          selectedDate
        )}.`
      );

      await loadAttendance(
        session.id,
        term.id,
        students,
        selectedDate
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save attendance."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * ==========================================================
   * FILTER STUDENTS
   * ==========================================================
   */

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return students;
    }

    return students.filter((student) => {
      return (
        student.full_name
          .toLowerCase()
          .includes(query) ||
        student.student_id
          ?.toLowerCase()
          .includes(query) ||
        student.admission_number
          ?.toLowerCase()
          .includes(query)
      );
    });
  }, [students, search]);

  /*
   * ==========================================================
   * STATISTICS
   * ==========================================================
   */

  const statistics = useMemo(() => {
    const present = students.filter(
      (student) =>
        attendance[student.id]?.present ?? true
    ).length;

    const absent =
      students.length - present;

    return {
      total: students.length,
      present,
      absent,
    };
  }, [students, attendance]);

  /*
   * ==========================================================
   * LOADING
   * ==========================================================
   */

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-600">
          <Loader2 className="h-8 w-8 animate-spin" />

          <p className="text-sm">
            Loading attendance...
          </p>
        </div>
      </div>
    );
  }

  /*
   * ==========================================================
   * ERROR
   * ==========================================================
   */

  if (error && !course) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <AlertCircle className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                Unable to load attendance
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
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
                    <CalendarDays className="h-4 w-4" />
                  </div>

                  <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900">
                      Attendance
                    </h1>

                    <p className="text-sm text-slate-500">
                      {course?.name}

                      {course?.code && (
                        <span className="ml-2">
                          • {course.code}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={saveAttendance}
              disabled={
                saving ||
                students.length === 0
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Attendance
                </>
              )}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            {session && (
              <span className="rounded-full bg-slate-100 px-3 py-1.5 font-medium text-slate-600">
                {session.name}
              </span>
            )}

            {term && (
              <span className="rounded-full bg-slate-100 px-3 py-1.5 font-medium capitalize text-slate-600">
                {term.name} Term
              </span>
            )}
          </div>
        </div>
      </header>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ERROR */}

        {error && course && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

            <div>
              <p className="text-sm font-semibold text-red-900">
                Unable to save attendance
              </p>

              <p className="mt-1 text-sm leading-6 text-red-700">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

            <p className="text-sm leading-6 text-emerald-700">
              {success}
            </p>
          </div>
        )}

        {/* ===================================================
            DATE + STATS
        =================================================== */}

        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Attendance Date
            </label>

            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="date"
                value={selectedDate}
                onChange={(event) => {
                  setSelectedDate(
                    event.target.value
                  );
                  setSuccess("");
                  setError("");
                }}
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-medium text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <StatCard
              label="Students"
              value={statistics.total}
            />

            <StatCard
              label="Present"
              value={statistics.present}
            />

            <StatCard
              label="Absent"
              value={statistics.absent}
            />
          </div>
        </div>

        {/* ===================================================
            CONTROLS
        =================================================== */}

        {students.length > 0 && (
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search students..."
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={markAllPresent}
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
              >
                <Check className="h-4 w-4" />
                All Present
              </button>

              <button
                onClick={markAllAbsent}
                className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700 hover:bg-red-100"
              >
                <X className="h-4 w-4" />
                All Absent
              </button>
            </div>
          </div>
        )}

        {/* ===================================================
            EMPTY
        =================================================== */}

        {students.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <Users className="h-6 w-6" />
            </div>

            <h2 className="mt-4 text-base font-semibold text-slate-900">
              No students enrolled
            </h2>

            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
              There are currently no active students
              enrolled in the class assigned to this
              course.
            </p>
          </div>
        ) : (
          <>
            {/* =================================================
                DESKTOP
            ================================================= */}

            <div className="mt-6 hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Student
                      </th>

                      <th className="w-44 px-4 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Attendance
                      </th>

                      <th className="w-[320px] px-4 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Note
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredStudents.map(
                      (student) => {
                        const state =
                          attendance[
                            student.id
                          ] || {
                            present: true,
                            note: "",
                          };

                        return (
                          <tr
                            key={student.id}
                            className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
                          >
                            <td className="px-5 py-4">
                              <div className="font-medium text-slate-900">
                                {student.full_name}
                              </div>

                              <div className="mt-1 text-xs text-slate-500">
                                {student.student_id ||
                                  student.admission_number ||
                                  "No student ID"}
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <div className="flex justify-center gap-2">
                                <button
                                  onClick={() =>
                                    setStudentAttendance(
                                      student.id,
                                      true
                                    )
                                  }
                                  className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                                    state.present
                                      ? "bg-emerald-600 text-white"
                                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                  }`}
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  Present
                                </button>

                                <button
                                  onClick={() =>
                                    setStudentAttendance(
                                      student.id,
                                      false
                                    )
                                  }
                                  className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                                    !state.present
                                      ? "bg-red-600 text-white"
                                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                  }`}
                                >
                                  <X className="h-3.5 w-3.5" />
                                  Absent
                                </button>
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <input
                                type="text"
                                value={
                                  state.note
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateNote(
                                    student.id,
                                    event.target
                                      .value
                                  )
                                }
                                placeholder="Optional note..."
                                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                              />
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* =================================================
                MOBILE
            ================================================= */}

            <div className="mt-6 space-y-3 md:hidden">
              {filteredStudents.map(
                (student) => {
                  const state =
                    attendance[
                      student.id
                    ] || {
                      present: true,
                      note: "",
                    };

                  return (
                    <div
                      key={student.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {student.full_name}
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          {student.student_id ||
                            student.admission_number ||
                            "No student ID"}
                        </p>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <button
                          onClick={() =>
                            setStudentAttendance(
                              student.id,
                              true
                            )
                          }
                          className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                            state.present
                              ? "bg-emerald-600 text-white"
                              : "border border-slate-200 bg-white text-slate-600"
                          }`}
                        >
                          <Check className="h-4 w-4" />
                          Present
                        </button>

                        <button
                          onClick={() =>
                            setStudentAttendance(
                              student.id,
                              false
                            )
                          }
                          className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                            !state.present
                              ? "bg-red-600 text-white"
                              : "border border-slate-200 bg-white text-slate-600"
                          }`}
                        >
                          <X className="h-4 w-4" />
                          Absent
                        </button>
                      </div>

                      <div className="mt-3">
                        <input
                          type="text"
                          value={
                            state.note
                          }
                          onChange={(event) =>
                            updateNote(
                              student.id,
                              event.target.value
                            )
                          }
                          placeholder="Optional note..."
                          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                        />
                      </div>
                    </div>
                  );
                }
              )}
            </div>

            {filteredStudents.length === 0 && (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
                <Search className="mx-auto h-6 w-6 text-slate-400" />

                <p className="mt-3 text-sm font-medium text-slate-700">
                  No students match your search.
                </p>

                <button
                  onClick={() =>
                    setSearch("")
                  }
                  className="mt-3 text-sm font-semibold text-slate-900 underline underline-offset-4"
                >
                  Clear search
                </button>
              </div>
            )}
          </>
        )}

        {/* ===================================================
            BOTTOM SAVE
        =================================================== */}

        {students.length > 0 && (
          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Attendance for{" "}
                {formatDate(selectedDate)}
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                {statistics.present} present •{" "}
                {statistics.absent} absent
              </p>
            </div>

            <button
              onClick={saveAttendance}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Attendance
                </>
              )}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

/*
 * ============================================================
 * STAT CARD
 * ============================================================
 */

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="min-w-22.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

/*
 * ============================================================
 * DATE HELPERS
 * ============================================================
 */

function getTodayDate() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    now.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}