"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Save,
  Search,
  Users,
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

type CourseTeacher = {
  id: string;
  course_id: string;
  teacher_id: string;
  session_id: string;
  term_id: string;
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
  students:
    | Student
    | Student[]
    | null;
};

type Result = {
  id: string;
  student_id: string;
  course_id: string;
  session_id: string;
  term_id: string;
  ca_score: number | null;
  exam_score: number | null;
  total_score: number | null;
  grade: string | null;
  remark: string | null;
  published: boolean;
};

type GradingScale = {
  id: string;
  grade: string;
  min_score: number;
  max_score: number;
  remark: string | null;
  sort_order: number;
  is_active: boolean;
};

type ScoringConfiguration = {
  id: string;
  ca_weight: number;
  exam_weight: number;
  is_active: boolean;
};

type ResultInput = {
  ca_score: string;
  exam_score: string;
};

type ResultRow = {
  student: Student;
  result: Result | null;
  input: ResultInput;
};

export default function CourseResultsPage() {
  const params = useParams();
  const router = useRouter();

  const supabase = createClient();

  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [session, setSession] =
    useState<AcademicSession | null>(null);
  const [term, setTerm] =
    useState<AcademicTerm | null>(null);

  const [rows, setRows] = useState<ResultRow[]>([]);

  const [gradingScale, setGradingScale] = useState<
    GradingScale[]
  >([]);

  const [scoringConfig, setScoringConfig] =
    useState<ScoringConfiguration | null>(null);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!courseId) return;

    loadPage();
  }, [courseId]);

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

      const { data: currentSession, error: sessionError } =
        await supabase
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

      const { data: currentTerm, error: termError } =
        await supabase
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
       * 5. VERIFY COURSE ASSIGNMENT
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
        .maybeSingle<CourseTeacher>();

      if (courseAssignmentError) {
        throw new Error(
          "Unable to verify your course assignment."
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
        setRows([]);
        return;
      }

      /*
       * =====================================================
       * 7. SCORING CONFIGURATION
       * =====================================================
       *
       * We first try class-specific configuration.
       * If none exists, we fall back to a general
       * session configuration.
       */

      const { data: classConfig } =
        await supabase
          .from("scoring_configurations")
          .select(
            `
              id,
              ca_weight,
              exam_weight,
              is_active
            `
          )
          .eq("session_id", currentSession.id)
          .eq("class_id", courseData.class_id)
          .eq("is_active", true)
          .maybeSingle<ScoringConfiguration>();

      let activeConfig = classConfig;

      if (!activeConfig) {
        const { data: generalConfig } =
          await supabase
            .from("scoring_configurations")
            .select(
              `
                id,
                ca_weight,
                exam_weight,
                is_active
              `
            )
            .eq("session_id", currentSession.id)
            .is("class_id", null)
            .eq("is_active", true)
            .maybeSingle<ScoringConfiguration>();

        activeConfig = generalConfig;
      }

      setScoringConfig(
        activeConfig || {
          id: "default",
          ca_weight: 40,
          exam_weight: 60,
          is_active: true,
        }
      );

      /*
       * =====================================================
       * 8. GRADING SCALE
       * =====================================================
       */

      const { data: gradingData, error: gradingError } =
        await supabase
          .from("grading_scales")
          .select(
            `
              id,
              grade,
              min_score,
              max_score,
              remark,
              sort_order,
              is_active
            `
          )
          .eq("session_id", currentSession.id)
          .eq("is_active", true)
          .order("sort_order", {
            ascending: true,
          });

      if (gradingError) {
        console.warn(
          "Unable to load grading scale:",
          gradingError
        );
      }

      setGradingScale(
        (gradingData as GradingScale[]) || []
      );

      /*
       * =====================================================
       * 9. ENROLLED STUDENTS
       * =====================================================
       *
       * IMPORTANT:
       * student_enrollments DOES NOT have term_id.
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
          "Unable to load students enrolled in this class."
        );
      }

      /*
       * Normalize Supabase's nested relationship.
       */

      const students: Student[] = (
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

      /*
       * Remove accidental duplicates.
       */

      const uniqueStudents = Array.from(
        new Map(
          students.map((student) => [
            student.id,
            student,
          ])
        ).values()
      );

      /*
       * =====================================================
       * 10. EXISTING RESULTS
       * =====================================================
       */

      let existingResults: Result[] = [];

      if (uniqueStudents.length > 0) {
        const studentIds = uniqueStudents.map(
          (student) => student.id
        );

        const { data: resultData, error: resultError } =
          await supabase
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
                remark,
                published
              `
            )
            .eq("course_id", courseId)
            .eq("session_id", currentSession.id)
            .eq("term_id", currentTerm.id)
            .in("student_id", studentIds);

        if (resultError) {
          throw new Error(
            "Unable to load existing results."
          );
        }

        existingResults =
          (resultData as Result[]) || [];
      }

      /*
       * =====================================================
       * 11. BUILD TABLE ROWS
       * =====================================================
       */

      const resultMap = new Map(
        existingResults.map((result) => [
          result.student_id,
          result,
        ])
      );

      const tableRows: ResultRow[] =
        uniqueStudents.map((student) => {
          const result = resultMap.get(student.id) || null;

          return {
            student,
            result,
            input: {
              ca_score:
                result?.ca_score !== null &&
                result?.ca_score !== undefined
                  ? String(result.ca_score)
                  : "",

              exam_score:
                result?.exam_score !== null &&
                result?.exam_score !== undefined
                  ? String(result.exam_score)
                  : "",
            },
          };
        });

      setRows(tableRows);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading results."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * ==========================================================
   * CALCULATE TOTAL
   * ==========================================================
   */

  function calculateTotal(
    ca: string,
    exam: string
  ) {
    const caScore = Number(ca);
    const examScore = Number(exam);

    if (
      !Number.isFinite(caScore) ||
      !Number.isFinite(examScore)
    ) {
      return null;
    }

    const caWeight =
      scoringConfig?.ca_weight ?? 40;

    const examWeight =
      scoringConfig?.exam_weight ?? 60;

    /*
     * CA and Exam values are entered according to
     * their configured maximum weights.
     *
     * Example:
     * CA = 32 / 40
     * Exam = 51 / 60
     * Total = 83
     */

    const total =
      caScore + examScore;

    /*
     * We keep the configured weights visible
     * in the UI, but scores themselves are already
     * expected to be entered against those weights.
     */

    if (
      caScore < 0 ||
      examScore < 0
    ) {
      return null;
    }

    if (
      caScore > caWeight ||
      examScore > examWeight
    ) {
      return null;
    }

    return Number(total.toFixed(2));
  }

  /*
   * ==========================================================
   * FIND GRADE
   * ==========================================================
   */

  function getGrade(total: number | null) {
    if (total === null) {
      return null;
    }

    const scale = gradingScale.find(
      (item) =>
        total >= Number(item.min_score) &&
        total <= Number(item.max_score)
    );

    return scale || null;
  }

  /*
   * ==========================================================
   * UPDATE INPUT
   * ==========================================================
   */

  function updateScore(
    studentId: string,
    field: keyof ResultInput,
    value: string
  ) {
    /*
     * Allow empty input.
     */

    if (value !== "") {
      const numericValue = Number(value);

      if (!Number.isFinite(numericValue)) {
        return;
      }

      if (numericValue < 0) {
        return;
      }
    }

    setRows((currentRows) =>
      currentRows.map((row) => {
        if (row.student.id !== studentId) {
          return row;
        }

        return {
          ...row,
          input: {
            ...row.input,
            [field]: value,
          },
        };
      })
    );

    setSuccess("");
  }

  /*
   * ==========================================================
   * SAVE RESULTS
   * ==========================================================
   */

  async function saveResults() {
    if (!session || !term || !course) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const rowsToSave = rows.filter(
        (row) =>
          row.input.ca_score !== "" ||
          row.input.exam_score !== ""
      );

      /*
       * Validate all entered scores first.
       */

      for (const row of rowsToSave) {
        const ca =
          row.input.ca_score === ""
            ? null
            : Number(row.input.ca_score);

        const exam =
          row.input.exam_score === ""
            ? null
            : Number(row.input.exam_score);

        const caWeight =
          scoringConfig?.ca_weight ?? 40;

        const examWeight =
          scoringConfig?.exam_weight ?? 60;

        if (
          ca !== null &&
          (ca < 0 || ca > caWeight)
        ) {
          throw new Error(
            `CA score for ${row.student.full_name} must be between 0 and ${caWeight}.`
          );
        }

        if (
          exam !== null &&
          (exam < 0 || exam > examWeight)
        ) {
          throw new Error(
            `Exam score for ${row.student.full_name} must be between 0 and ${examWeight}.`
          );
        }

        if (
          ca !== null &&
          exam !== null
        ) {
          const total = calculateTotal(
            String(ca),
            String(exam)
          );

          if (total === null) {
            throw new Error(
              `Invalid scores entered for ${row.student.full_name}.`
            );
          }
        }
      }

      /*
       * ======================================================
       * UPSERT RESULTS
       * ======================================================
       */

      for (const row of rowsToSave) {
        const ca =
          row.input.ca_score === ""
            ? null
            : Number(row.input.ca_score);

        const exam =
          row.input.exam_score === ""
            ? null
            : Number(row.input.exam_score);

        const total =
          ca !== null && exam !== null
            ? calculateTotal(
                String(ca),
                String(exam)
              )
            : null;

        const gradeInfo =
          getGrade(total);

        const payload = {
          student_id: row.student.id,
          course_id: course.id,
          session_id: session.id,
          term_id: term.id,

          ca_score: ca,
          exam_score: exam,

          total_score: total,

          grade:
            gradeInfo?.grade || null,

          remark:
            gradeInfo?.remark || null,

          /*
           * Teachers do not publish results.
           * Existing published results stay published.
           */
          published:
            row.result?.published ?? false,
        };

        if (row.result) {
          const { error: updateError } =
            await supabase
              .from("results")
              .update(payload)
              .eq("id", row.result.id);

          if (updateError) {
            throw new Error(
              `Unable to update ${row.student.full_name}'s result: ${updateError.message}`
            );
          }
        } else {
          const { error: insertError } =
            await supabase
              .from("results")
              .insert(payload);

          if (insertError) {
            throw new Error(
              `Unable to save ${row.student.full_name}'s result: ${insertError.message}`
            );
          }
        }
      }

      setSuccess(
        "Results saved successfully. They remain unpublished until reviewed by an administrator."
      );

      await loadPage();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save results."
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

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return rows;
    }

    return rows.filter((row) => {
      return (
        row.student.full_name
          .toLowerCase()
          .includes(query) ||
        row.student.student_id
          ?.toLowerCase()
          .includes(query) ||
        row.student.admission_number
          ?.toLowerCase()
          .includes(query)
      );
    });
  }, [rows, search]);

  /*
   * ==========================================================
   * STATISTICS
   * ==========================================================
   */

  const statistics = useMemo(() => {
    const completed = rows.filter(
      (row) =>
        row.input.ca_score !== "" &&
        row.input.exam_score !== ""
    ).length;

    const published = rows.filter(
      (row) => row.result?.published
    ).length;

    return {
      students: rows.length,
      completed,
      pending: rows.length - completed,
      published,
    };
  }, [rows]);

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
            Loading course results...
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
                Unable to load results
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

  /*
   * ==========================================================
   * PAGE
   * ==========================================================
   */

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
                    <Users className="h-4 w-4" />
                  </div>

                  <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900">
                      Course Results
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
              onClick={saveResults}
              disabled={saving || rows.length === 0}
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
                  Save Results
                </>
              )}
            </button>
          </div>

          {/* SESSION / TERM */}

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

            {scoringConfig && (
              <span className="rounded-full bg-blue-50 px-3 py-1.5 font-medium text-blue-700">
                CA {scoringConfig.ca_weight}% • Exam{" "}
                {scoringConfig.exam_weight}%
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
                Unable to save results
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
            STATISTICS
        =================================================== */}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Students"
            value={statistics.students}
          />

          <StatCard
            label="Completed"
            value={statistics.completed}
          />

          <StatCard
            label="Pending"
            value={statistics.pending}
          />

          <StatCard
            label="Published"
            value={statistics.published}
          />
        </div>

        {/* ===================================================
            SEARCH
        =================================================== */}

        <div className="mt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search student name, student ID or admission number..."
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>
        </div>

        {/* ===================================================
            EMPTY STATE
        =================================================== */}

        {rows.length === 0 ? (
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
                DESKTOP TABLE
            ================================================= */}

            <div className="mt-6 hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Student
                      </th>

                      <th className="w-36 px-4 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                        CA /{" "}
                        {scoringConfig?.ca_weight ?? 40}
                      </th>

                      <th className="w-36 px-4 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Exam /{" "}
                        {scoringConfig?.exam_weight ?? 60}
                      </th>

                      <th className="w-28 px-4 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Total
                      </th>

                      <th className="w-28 px-4 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Grade
                      </th>

                      <th className="w-32 px-4 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredRows.map((row) => {
                      const total =
                        calculateTotal(
                          row.input.ca_score,
                          row.input.exam_score
                        );

                      const gradeInfo =
                        getGrade(total);

                      return (
                        <tr
                          key={row.student.id}
                          className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
                        >
                          {/* STUDENT */}

                          <td className="px-5 py-4">
                            <div className="font-medium text-slate-900">
                              {row.student.full_name}
                            </div>

                            <div className="mt-1 text-xs text-slate-500">
                              {row.student.student_id ||
                                row.student.admission_number ||
                                "No student ID"}
                            </div>
                          </td>

                          {/* CA */}

                          <td className="px-4 py-4">
                            <input
                              type="number"
                              min="0"
                              max={
                                scoringConfig?.ca_weight ??
                                40
                              }
                              step="0.01"
                              value={
                                row.input.ca_score
                              }
                              onChange={(event) =>
                                updateScore(
                                  row.student.id,
                                  "ca_score",
                                  event.target.value
                                )
                              }
                              placeholder="0"
                              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-center text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                            />
                          </td>

                          {/* EXAM */}

                          <td className="px-4 py-4">
                            <input
                              type="number"
                              min="0"
                              max={
                                scoringConfig?.exam_weight ??
                                60
                              }
                              step="0.01"
                              value={
                                row.input.exam_score
                              }
                              onChange={(event) =>
                                updateScore(
                                  row.student.id,
                                  "exam_score",
                                  event.target.value
                                )
                              }
                              placeholder="0"
                              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-center text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                            />
                          </td>

                          {/* TOTAL */}

                          <td className="px-4 py-4 text-center">
                            <span className="font-semibold text-slate-900">
                              {total !== null
                                ? total
                                : "—"}
                            </span>
                          </td>

                          {/* GRADE */}

                          <td className="px-4 py-4 text-center">
                            {gradeInfo ? (
                              <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                                {gradeInfo.grade}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>

                          {/* STATUS */}

                          <td className="px-4 py-4 text-center">
                            {row.result?.published ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                                <CheckCircle2 className="h-3 w-3" />
                                Published
                              </span>
                            ) : row.result ? (
                              <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                                Unpublished
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">
                                Not entered
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* =================================================
                MOBILE CARDS
            ================================================= */}

            <div className="mt-6 space-y-3 md:hidden">
              {filteredRows.map((row) => {
                const total =
                  calculateTotal(
                    row.input.ca_score,
                    row.input.exam_score
                  );

                const gradeInfo =
                  getGrade(total);

                return (
                  <div
                    key={row.student.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    {/* STUDENT */}

                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {row.student.full_name}
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          {row.student.student_id ||
                            row.student.admission_number ||
                            "No student ID"}
                        </p>
                      </div>

                      {row.result?.published ? (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" />
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                          {row.result
                            ? "Unpublished"
                            : "New"}
                        </span>
                      )}
                    </div>

                    {/* SCORES */}

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-slate-500">
                          CA /{" "}
                          {scoringConfig?.ca_weight ??
                            40}
                        </label>

                        <input
                          type="number"
                          min="0"
                          max={
                            scoringConfig?.ca_weight ??
                            40
                          }
                          step="0.01"
                          value={
                            row.input.ca_score
                          }
                          onChange={(event) =>
                            updateScore(
                              row.student.id,
                              "ca_score",
                              event.target.value
                            )
                          }
                          placeholder="0"
                          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-slate-500">
                          Exam /{" "}
                          {scoringConfig?.exam_weight ??
                            60}
                        </label>

                        <input
                          type="number"
                          min="0"
                          max={
                            scoringConfig?.exam_weight ??
                            60
                          }
                          step="0.01"
                          value={
                            row.input.exam_score
                          }
                          onChange={(event) =>
                            updateScore(
                              row.student.id,
                              "exam_score",
                              event.target.value
                            )
                          }
                          placeholder="0"
                          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                        />
                      </div>
                    </div>

                    {/* RESULT */}

                    <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                      <div>
                        <p className="text-xs text-slate-500">
                          Total
                        </p>

                        <p className="mt-0.5 font-bold text-slate-900">
                          {total !== null
                            ? total
                            : "—"}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-slate-500">
                          Grade
                        </p>

                        <p className="mt-0.5 font-bold text-slate-900">
                          {gradeInfo?.grade || "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* NO SEARCH RESULTS */}

            {filteredRows.length === 0 && (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
                <Search className="mx-auto h-6 w-6 text-slate-400" />

                <p className="mt-3 text-sm font-medium text-slate-700">
                  No students match your search.
                </p>

                <button
                  onClick={() => setSearch("")}
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

        {rows.length > 0 && (
          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Ready to save?
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Teacher-entered results remain unpublished
                until reviewed and published by an
                administrator.
              </p>
            </div>

            <button
              onClick={saveResults}
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
                  Save Results
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
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}