"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
  session_id: string;
};

type Course = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  units: number;
  class_id: string | null;
  is_active: boolean;
};

type Student = {
  id: string;
  full_name: string;
  student_id: string | null;
  admission_number: string | null;
};

type Result = {
  id: string;
  student_id: string;
  ca_score: number | null;
  exam_score: number | null;
  total_score: number | null;
  grade: string | null;
  remark: string | null;
  published: boolean;
};

type GradeScale = {
  grade: string;
  min_score: number;
  max_score: number;
  remark: string | null;
};

type ScoreConfig = {
  ca_weight: number;
  exam_weight: number;
};

type ResultRow = {
  student: Student;
  result: Result | null;
  ca: string;
  exam: string;
  total: number | null;
  grade: string;
  remark: string;
};

export default function CourseResultsPage() {
  const supabase = useMemo(() => createClient(), []);
  const params = useParams();

  const courseId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [staff, setStaff] = useState<Staff | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [term, setTerm] = useState<Term | null>(null);
  const [course, setCourse] = useState<Course | null>(null);

  const [rows, setRows] = useState<ResultRow[]>([]);
  const [gradeScales, setGradeScales] = useState<GradeScale[]>([]);

  const [config, setConfig] = useState<ScoreConfig>({
    ca_weight: 40,
    exam_weight: 60,
  });

  const [search, setSearch] = useState("");
  const [showPublished, setShowPublished] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadPage = useCallback(async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // ============================================
      // AUTH
      // ============================================

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("Please sign in to access results.");
      }

      // ============================================
      // STAFF
      // ============================================

      const { data: staffRecord, error: staffError } = await supabase
        .from("staff")
        .select("id, user_id, staff_id, status")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (staffError || !staffRecord) {
        throw new Error(
          "Your active staff account could not be verified.",
        );
      }

      setStaff(staffRecord);

      // ============================================
      // CURRENT SESSION
      // ============================================

      const { data: currentSession, error: sessionError } =
        await supabase
          .from("academic_sessions")
          .select("id, name")
          .eq("is_current", true)
          .maybeSingle();

      if (sessionError || !currentSession) {
        throw new Error(
          "No current academic session has been configured.",
        );
      }

      setSession(currentSession);

      // ============================================
      // CURRENT TERM
      // ============================================

      const { data: currentTerm, error: termError } = await supabase
        .from("academic_terms")
        .select("id, name, session_id")
        .eq("session_id", currentSession.id)
        .eq("is_current", true)
        .maybeSingle();

      if (termError || !currentTerm) {
        throw new Error(
          "No current academic term has been configured.",
        );
      }

      setTerm(currentTerm);

      // ============================================
      // VERIFY COURSE ASSIGNMENT
      // ============================================

      const { data: assignment, error: assignmentError } =
        await supabase
          .from("course_teachers")
          .select("id")
          .eq("course_id", courseId)
          .eq("teacher_id", staffRecord.id)
          .eq("session_id", currentSession.id)
          .eq("term_id", currentTerm.id)
          .maybeSingle();

      if (assignmentError || !assignment) {
        throw new Error(
          "You are not assigned to teach this course for the current term.",
        );
      }

      // ============================================
      // COURSE
      // ============================================

      const { data: courseRecord, error: courseError } =
        await supabase
          .from("courses")
          .select(
            `
            id,
            code,
            name,
            description,
            units,
            class_id,
            is_active
          `,
          )
          .eq("id", courseId)
          .maybeSingle();

      if (courseError || !courseRecord) {
        throw new Error("Course could not be found.");
      }

      setCourse(courseRecord);

      // ============================================
      // SCORING CONFIGURATION
      // ============================================

      let scoringQuery = supabase
        .from("scoring_configurations")
        .select("ca_weight, exam_weight")
        .eq("session_id", currentSession.id)
        .eq("is_active", true);

      if (courseRecord.class_id) {
        scoringQuery = scoringQuery.eq(
          "class_id",
          courseRecord.class_id,
        );
      }

      const { data: scoringConfig, error: scoringError } =
        await scoringQuery.maybeSingle();

      if (scoringError) {
        console.warn("Scoring configuration:", scoringError);
      }

      if (scoringConfig) {
        setConfig({
          ca_weight: Number(scoringConfig.ca_weight),
          exam_weight: Number(scoringConfig.exam_weight),
        });
      }

      // ============================================
      // GRADING SCALE
      // ============================================

      let gradingQuery = supabase
        .from("grading_scales")
        .select(
          "grade, min_score, max_score, remark, sort_order",
        )
        .eq("session_id", currentSession.id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (courseRecord.class_id) {
        gradingQuery = gradingQuery.eq(
          "class_id",
          courseRecord.class_id,
        );
      }

      const { data: gradingRecords, error: gradingError } =
        await gradingQuery;

      if (gradingError) {
        console.warn("Grading scale:", gradingError);
      }

      setGradeScales(
        (gradingRecords ?? []).map((item) => ({
          grade: item.grade,
          min_score: Number(item.min_score),
          max_score: Number(item.max_score),
          remark: item.remark,
        })),
      );

      // ============================================
      // STUDENTS REGISTERED FOR COURSE
      // ============================================

      const { data: registrations, error: registrationError } =
        await supabase
          .from("course_registrations")
          .select(
            `
            student_id
          `,
          )
          .eq("course_id", courseId)
          .eq("session_id", currentSession.id)
          .eq("term_id", currentTerm.id);

      if (registrationError) {
        throw new Error(
          "Unable to load students registered for this course.",
        );
      }

      const studentIds = [
        ...new Set(
          (registrations ?? []).map(
            (registration) => registration.student_id,
          ),
        ),
      ];

      if (studentIds.length === 0) {
        setRows([]);
        setLoading(false);
        return;
      }

      // ============================================
      // STUDENTS
      // ============================================

      const { data: studentRecords, error: studentError } =
        await supabase
          .from("students")
          .select(
            `
            id,
            full_name,
            student_id,
            admission_number
          `,
          )
          .in("id", studentIds)
          .eq("status", "active")
          .order("full_name", { ascending: true });

      if (studentError) {
        throw new Error("Unable to load course students.");
      }

      // ============================================
      // EXISTING RESULTS
      // ============================================

      const { data: resultRecords, error: resultError } =
        await supabase
          .from("results")
          .select(
            `
            id,
            student_id,
            ca_score,
            exam_score,
            total_score,
            grade,
            remark,
            published
          `,
          )
          .eq("course_id", courseId)
          .eq("session_id", currentSession.id)
          .eq("term_id", currentTerm.id);

      if (resultError) {
        throw new Error("Unable to load existing results.");
      }

      // ============================================
      // BUILD TABLE
      // ============================================

      const resultMap = new Map(
        (resultRecords ?? []).map((result) => [
          result.student_id,
          result,
        ]),
      );

      const tableRows: ResultRow[] = (studentRecords ?? []).map(
        (student) => {
          const result = resultMap.get(student.id) ?? null;

          const ca =
            result?.ca_score !== null &&
            result?.ca_score !== undefined
              ? String(result.ca_score)
              : "";

          const exam =
            result?.exam_score !== null &&
            result?.exam_score !== undefined
              ? String(result.exam_score)
              : "";

          const calculated = calculateResult(
            ca,
            exam,
            config,
            gradeScales ?? [],
          );

          return {
            student,
            result,
            ca,
            exam,
            total:
              result?.total_score !== null &&
              result?.total_score !== undefined
                ? Number(result.total_score)
                : calculated.total,
            grade: result?.grade ?? calculated.grade,
            remark: result?.remark ?? calculated.remark,
          };
        },
      );

      setRows(tableRows);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading results.",
      );
    } finally {
      setLoading(false);
    }
  }, [config, courseId, gradeScales, supabase]);

  useEffect(() => {
    if (!courseId) return;

    const timeoutId = window.setTimeout(() => {
      void loadPage();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [courseId, loadPage]);

  // ============================================
  // UPDATE SCORE
  // ============================================

  function updateScore(
    studentId: string,
    field: "ca" | "exam",
    value: string,
  ) {
    setSuccess("");

    setRows((currentRows) =>
      currentRows.map((row) => {
        if (row.student.id !== studentId) {
          return row;
        }

        const nextRow = {
          ...row,
          [field]: value,
        };

        const calculated = calculateResult(
          nextRow.ca,
          nextRow.exam,
          config,
          gradeScales,
        );

        return {
          ...nextRow,
          total: calculated.total,
          grade: calculated.grade,
          remark: calculated.remark,
        };
      }),
    );
  }

  // ============================================
  // SAVE ALL RESULTS
  // ============================================

  async function saveResults() {
    if (!staff || !session || !term || !course) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const rowsToSave = rows.filter(
        (row) => row.ca.trim() !== "" || row.exam.trim() !== "",
      );

      if (rowsToSave.length === 0) {
        throw new Error(
          "Please enter at least one CA or Exam score before saving.",
        );
      }

      const invalidRows = rowsToSave.filter((row) => {
        const ca = Number(row.ca);
        const exam = Number(row.exam);

        return (
          !Number.isFinite(ca) ||
          !Number.isFinite(exam) ||
          ca < 0 ||
          exam < 0 ||
          ca > config.ca_weight ||
          exam > config.exam_weight
        );
      });

      if (invalidRows.length > 0) {
        throw new Error(
          `Please correct the scores for ${invalidRows.length} student${
            invalidRows.length > 1 ? "s" : ""
          }.`,
        );
      }

      const payload = rowsToSave.map((row) => {
        const calculated = calculateResult(
          row.ca,
          row.exam,
          config,
          gradeScales,
        );

        return {
          student_id: row.student.id,
          course_id: course.id,
          session_id: session.id,
          term_id: term.id,
          ca_score: Number(row.ca),
          exam_score: Number(row.exam),
          total_score: calculated.total,
          grade: calculated.grade || null,
          remark: calculated.remark || null,

          // Teacher enters results as unpublished.
          published: row.result?.published ?? false,
        };
      });

      const { error: saveError } = await supabase
        .from("results")
        .upsert(payload, {
          onConflict: "student_id,course_id,session_id,term_id",
        });

      if (saveError) {
        console.error(saveError);
        throw new Error(
          saveError.message ||
            "Unable to save results. Please try again.",
        );
      }

      setSuccess(
        `${payload.length} result${
          payload.length > 1 ? "s" : ""
        } saved successfully.`,
      );

      await loadPage();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save results.",
      );
    } finally {
      setSaving(false);
    }
  }

  // ============================================
  // FILTER
  // ============================================

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesSearch =
        !query ||
        row.student.full_name.toLowerCase().includes(query) ||
        row.student.student_id
          ?.toLowerCase()
          .includes(query) ||
        row.student.admission_number
          ?.toLowerCase()
          .includes(query);

      const matchesPublished =
        showPublished || !row.result?.published;

      return matchesSearch && matchesPublished;
    });
  }, [rows, search, showPublished]);

  // ============================================
  // STATISTICS
  // ============================================

  const statistics = useMemo(() => {
    const entered = rows.filter(
      (row) => row.ca !== "" || row.exam !== "",
    ).length;

    const published = rows.filter(
      (row) => row.result?.published,
    ).length;

    const pending = Math.max(rows.length - entered, 0);

    const graded = rows.filter(
      (row) => row.grade !== "",
    ).length;

    return {
      total: rows.length,
      entered,
      pending,
      published,
      graded,
    };
  }, [rows]);

  // ============================================
  // LOADING
  // ============================================

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-72 rounded-lg bg-slate-200" />

            <div className="h-28 rounded-2xl bg-white" />

            <div className="h-96 rounded-2xl bg-white" />
          </div>
        </div>
      </main>
    );
  }

  // ============================================
  // ERROR
  // ============================================

  if (error && !course) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-xl">
          <div className="rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
                <path d="M10.3 3.7 2.8 17a2 2 0 0 0 1.75 3h14.9a2 2 0 0 0 1.75-3l-7.5-13.3a2 2 0 0 0-3.4 0Z" />
              </svg>
            </div>

            <h1 className="mt-5 text-xl font-bold text-slate-900">
              Unable to load results
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {error}
            </p>

            <Link
              href="/staff-dashboard/results"
              className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
            >
              Back to Results
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!course) return null;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* ============================================
            BREADCRUMB
        ============================================ */}

        <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
          <Link
            href="/staff-dashboard"
            className="hover:text-slate-900"
          >
            Dashboard
          </Link>

          <span>/</span>

          <Link
            href="/staff-dashboard/results"
            className="hover:text-slate-900"
          >
            Results
          </Link>

          <span>/</span>

          <span className="text-slate-900">
            {course.code}
          </span>
        </div>

        {/* ============================================
            HEADER
        ============================================ */}

        <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                {course.name}
              </h1>

              <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">
                {course.code}
              </span>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              {session?.name} ·{" "}
              <span className="capitalize">
                {term?.name} Term
              </span>
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/staff-dashboard/courses/${course.id}`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Course Overview
            </Link>

            <button
              onClick={saveResults}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Spinner />
                  Saving...
                </>
              ) : (
                <>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
                    <path d="M17 21v-8H7v8" />
                    <path d="M7 3v5h8" />
                  </svg>

                  Save Results
                </>
              )}
            </button>
          </div>
        </div>

        {/* ============================================
            CONFIGURATION
        ============================================ */}

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Scoring Configuration
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
                  CA: {config.ca_weight}
                </span>

                <span className="text-slate-300">+</span>

                <span className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
                  Exam: {config.exam_weight}
                </span>

                <span className="text-sm text-slate-500">
                  = {config.ca_weight + config.exam_weight} marks
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm leading-5 text-blue-700">
              Results are saved as unpublished. Final publishing is
              controlled by an administrator.
            </div>
          </div>
        </div>

        {/* ============================================
            NOTIFICATIONS
        ============================================ */}

        {error && (
          <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        {/* ============================================
            STATS
        ============================================ */}

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ResultStat
            label="Students"
            value={statistics.total}
          />

          <ResultStat
            label="Entered"
            value={statistics.entered}
          />

          <ResultStat
            label="Pending"
            value={statistics.pending}
          />

          <ResultStat
            label="Published"
            value={statistics.published}
          />
        </div>

        {/* ============================================
            TOOLBAR
        ============================================ */}

        <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <svg
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search student..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
              />
            </div>

            <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={showPublished}
                onChange={(event) =>
                  setShowPublished(event.target.checked)
                }
                className="h-4 w-4 rounded border-slate-300"
              />

              Show published results
            </label>
          </div>
        </div>

        {/* ============================================
            RESULTS TABLE
        ============================================ */}

        {filteredRows.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <svg
                width="25"
                height="25"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M4 4h16v16H4z" />
                <path d="M8 9h8M8 13h5M8 17h4" />
              </svg>
            </div>

            <h2 className="mt-5 text-lg font-semibold text-slate-900">
              No students found
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              There are no students matching the current filters.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[950px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      Student
                    </th>

                    <th className="w-36 px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
                      CA / {config.ca_weight}
                    </th>

                    <th className="w-36 px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
                      Exam / {config.exam_weight}
                    </th>

                    <th className="w-28 px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
                      Total
                    </th>

                    <th className="w-28 px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
                      Grade
                    </th>

                    <th className="w-48 px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      Remark
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRows.map((row, index) => (
                    <ResultTableRow
                      key={row.student.id}
                      row={row}
                      index={index}
                      config={config}
                      onUpdate={updateScore}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-slate-100 md:hidden">
              {filteredRows.map((row, index) => (
                <ResultMobileCard
                  key={row.student.id}
                  row={row}
                  index={index}
                  config={config}
                  onUpdate={updateScore}
                />
              ))}
            </div>
          </div>
        )}

        {/* ============================================
            FOOTER ACTION
        ============================================ */}

        {rows.length > 0 && (
          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-900">
                {filteredRows.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-900">
                {rows.length}
              </span>{" "}
              students.
            </p>

            <button
              onClick={saveResults}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save All Results"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

/* ==================================================
   RESULT TABLE ROW
================================================== */

function ResultTableRow({
  row,
  index,
  config,
  onUpdate,
}: {
  row: ResultRow;
  index: number;
  config: ScoreConfig;
  onUpdate: (
    studentId: string,
    field: "ca" | "exam",
    value: string,
  ) => void;
}) {
  const published = row.result?.published === true;

  return (
    <tr
      className={`border-b border-slate-100 last:border-b-0 ${
        published ? "bg-slate-50/60" : "bg-white"
      }`}
    >
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-600">
            {index + 1}
          </div>

          <div className="min-w-0">
            <p className="font-semibold text-slate-900">
              {row.student.full_name}
            </p>

            <p className="mt-0.5 text-xs text-slate-400">
              {row.student.student_id ||
                row.student.admission_number ||
                "No ID"}
            </p>
          </div>

          {published && (
            <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
              Published
            </span>
          )}
        </div>
      </td>

      <td className="px-4 py-4">
        <input
          type="number"
          min="0"
          max={config.ca_weight}
          step="0.01"
          value={row.ca}
          disabled={published}
          onChange={(event) =>
            onUpdate(
              row.student.id,
              "ca",
              event.target.value,
            )
          }
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        />
      </td>

      <td className="px-4 py-4">
        <input
          type="number"
          min="0"
          max={config.exam_weight}
          step="0.01"
          value={row.exam}
          disabled={published}
          onChange={(event) =>
            onUpdate(
              row.student.id,
              "exam",
              event.target.value,
            )
          }
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        />
      </td>

      <td className="px-4 py-4 text-center">
        <span className="font-bold text-slate-900">
          {row.total !== null ? formatScore(row.total) : "—"}
        </span>
      </td>

      <td className="px-4 py-4 text-center">
        {row.grade ? (
          <span className="inline-flex min-w-10 items-center justify-center rounded-xl bg-slate-900 px-2.5 py-2 text-sm font-bold text-white">
            {row.grade}
          </span>
        ) : (
          <span className="text-slate-300">—</span>
        )}
      </td>

      <td className="px-5 py-4">
        <span className="text-sm text-slate-600">
          {row.remark || "—"}
        </span>
      </td>
    </tr>
  );
}

/* ==================================================
   MOBILE RESULT CARD
================================================== */

function ResultMobileCard({
  row,
  index,
  config,
  onUpdate,
}: {
  row: ResultRow;
  index: number;
  config: ScoreConfig;
  onUpdate: (
    studentId: string,
    field: "ca" | "exam",
    value: string,
  ) => void;
}) {
  const published = row.result?.published === true;

  return (
    <div
      className={`p-4 ${
        published ? "bg-slate-50/70" : "bg-white"
      }`}
    >
      {/* Student */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-600">
            {index + 1}
          </div>

          <div className="min-w-0">
            <p className="font-semibold text-slate-900">
              {row.student.full_name}
            </p>

            <p className="mt-0.5 text-xs text-slate-400">
              {row.student.student_id ||
                row.student.admission_number ||
                "No ID"}
            </p>
          </div>
        </div>

        {published && (
          <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
            Published
          </span>
        )}
      </div>

      {/* Scores */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-500">
            CA / {config.ca_weight}
          </label>

          <input
            type="number"
            min="0"
            max={config.ca_weight}
            step="0.01"
            value={row.ca}
            disabled={published}
            onChange={(event) =>
              onUpdate(
                row.student.id,
                "ca",
                event.target.value,
              )
            }
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-center text-sm font-bold outline-none focus:border-slate-400 focus:bg-white disabled:bg-slate-100"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-500">
            Exam / {config.exam_weight}
          </label>

          <input
            type="number"
            min="0"
            max={config.exam_weight}
            step="0.01"
            value={row.exam}
            disabled={published}
            onChange={(event) =>
              onUpdate(
                row.student.id,
                "exam",
                event.target.value,
              )
            }
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-center text-sm font-bold outline-none focus:border-slate-400 focus:bg-white disabled:bg-slate-100"
          />
        </div>
      </div>

      {/* Result */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-slate-50 p-3 text-center">
          <p className="text-[10px] font-semibold uppercase text-slate-400">
            Total
          </p>

          <p className="mt-1 font-bold text-slate-900">
            {row.total !== null
              ? formatScore(row.total)
              : "—"}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3 text-center">
          <p className="text-[10px] font-semibold uppercase text-slate-400">
            Grade
          </p>

          <p className="mt-1 font-bold text-slate-900">
            {row.grade || "—"}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3 text-center">
          <p className="text-[10px] font-semibold uppercase text-slate-400">
            Status
          </p>

          <p className="mt-1 text-xs font-bold text-slate-700">
            {published ? "Published" : "Draft"}
          </p>
        </div>
      </div>

      {/* Remark */}
      <div className="mt-3 rounded-xl border border-slate-100 bg-white p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          Remark
        </p>

        <p className="mt-1 text-sm text-slate-600">
          {row.remark || "—"}
        </p>
      </div>
    </div>
  );
}

/* ==================================================
   STAT
================================================== */

function ResultStat({
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

      <p className="mt-1 text-2xl font-bold text-slate-950">
        {value}
      </p>
    </div>
  );
}

/* ==================================================
   CALCULATE RESULT
================================================== */

function calculateResult(
  caValue: string,
  examValue: string,
  config: ScoreConfig,
  scales: GradeScale[],
) {
  if (caValue === "" && examValue === "") {
    return {
      total: null,
      grade: "",
      remark: "",
    };
  }

  const ca = Number(caValue || 0);
  const exam = Number(examValue || 0);

  if (!Number.isFinite(ca) || !Number.isFinite(exam)) {
    return {
      total: null,
      grade: "",
      remark: "",
    };
  }

  const total = roundScore(ca + exam);

  const scale = scales.find(
    (item) =>
      total >= item.min_score &&
      total <= item.max_score,
  );

  return {
    total,
    grade: scale?.grade ?? "",
    remark: scale?.remark ?? "",
  };
}

/* ==================================================
   HELPERS
================================================== */

function roundScore(value: number) {
  return Math.round(value * 100) / 100;
}

function formatScore(value: number) {
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function Spinner() {
  return (
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
  );
}