"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Users,
  ClipboardList,
  BarChart3,
  CalendarCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Course = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  units: number;
  is_active: boolean;
  class_id: string | null;
};

type ClassInfo = {
  id: string;
  name: string;
};

type Session = {
  id: string;
  name: string;
};

type Term = {
  id: string;
  name: string;
};

type Assignment = {
  id: string;
  title: string;
  due_date: string | null;
  status: string;
  max_score: number;
};

type Staff = {
  id: string;
  staff_id: string;
  department: string | null;
  position: string | null;
  status: string;
};

type Stats = {
  students: number;
  assignments: number;
  pendingSubmissions: number;
  results: number;
};

export default function CourseDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const supabase = useMemo(() => createClient(), []);

  const courseId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [course, setCourse] = useState<Course | null>(null);
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [term, setTerm] = useState<Term | null>(null);
  const [staff, setStaff] = useState<Staff | null>(null);

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [stats, setStats] = useState<Stats>({
    students: 0,
    assignments: 0,
    pendingSubmissions: 0,
    results: 0,
  });

  const loadCourse = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      // --------------------------------------------------
      // 1. CHECK AUTHENTICATION
      // --------------------------------------------------

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push("/staff-login");
        return;
      }

      // --------------------------------------------------
      // 2. GET STAFF RECORD
      // --------------------------------------------------

      const { data: staffRecord, error: staffError } = await supabase
        .from("staff")
        .select(
          "id, staff_id, department, position, status"
        )
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (staffError) {
        console.error(staffError);
        throw new Error("Unable to load your staff profile.");
      }

      if (!staffRecord) {
        throw new Error(
          "Your staff account could not be verified."
        );
      }

      setStaff(staffRecord);

      // --------------------------------------------------
      // 3. GET CURRENT SESSION
      // --------------------------------------------------

      const { data: currentSession, error: sessionError } =
        await supabase
          .from("academic_sessions")
          .select("id, name")
          .eq("is_current", true)
          .maybeSingle();

      if (sessionError) {
        console.error(sessionError);
        throw new Error(
          "Unable to load the current academic session."
        );
      }

      if (!currentSession) {
        throw new Error(
          "There is currently no active academic session."
        );
      }

      setSession(currentSession);

      // --------------------------------------------------
      // 4. GET CURRENT TERM
      // --------------------------------------------------

      const { data: currentTerm, error: termError } =
        await supabase
          .from("academic_terms")
          .select("id, name")
          .eq("session_id", currentSession.id)
          .eq("is_current", true)
          .maybeSingle();

      if (termError) {
        console.error(termError);
        throw new Error(
          "Unable to load the current academic term."
        );
      }

      if (!currentTerm) {
        throw new Error(
          "There is currently no active academic term."
        );
      }

      setTerm(currentTerm);

      // --------------------------------------------------
      // 5. SECURITY CHECK
      //
      // Verify that THIS teacher is actually assigned
      // to THIS course for the current session + term.
      // --------------------------------------------------

      const { data: assignmentRecord, error: assignmentError } =
        await supabase
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
          .eq("teacher_id", staffRecord.id)
          .eq("course_id", courseId)
          .eq("session_id", currentSession.id)
          .eq("term_id", currentTerm.id)
          .maybeSingle();

      if (assignmentError) {
        console.error(assignmentError);

        throw new Error(
          "Unable to verify your course assignment."
        );
      }

      if (!assignmentRecord) {
        throw new Error(
          "You are not assigned to this course for the current academic term."
        );
      }

      // --------------------------------------------------
      // 6. GET COURSE
      // --------------------------------------------------

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
              is_active,
              class_id
            `
          )
          .eq("id", courseId)
          .maybeSingle();

      if (courseError) {
        console.error(courseError);

        throw new Error(
          "Unable to load the course."
        );
      }

      if (!courseRecord) {
        throw new Error("Course not found.");
      }

      setCourse(courseRecord);

      // --------------------------------------------------
      // 7. GET CLASS
      // --------------------------------------------------

      if (courseRecord.class_id) {
        const { data: classRecord, error: classError } =
          await supabase
            .from("classes")
            .select("id, name")
            .eq("id", courseRecord.class_id)
            .maybeSingle();

        if (classError) {
          console.error(classError);
        }

        setClassInfo(classRecord);
      }

      // --------------------------------------------------
      // 8. GET ASSIGNMENTS FOR THIS COURSE
      // --------------------------------------------------

      const { data: assignmentRecords, error: assignmentsError } =
        await supabase
          .from("assignments")
          .select(
            `
              id,
              title,
              due_date,
              status,
              max_score
            `
          )
          .eq("course_id", courseId)
          .eq("teacher_id", staffRecord.id)
          .eq("session_id", currentSession.id)
          .eq("term_id", currentTerm.id)
          .order("created_at", { ascending: false });

      if (assignmentsError) {
        console.error(assignmentsError);

        throw new Error(
          "Unable to load course assignments."
        );
      }

      const loadedAssignments =
        assignmentRecords || [];

      setAssignments(loadedAssignments);

      // --------------------------------------------------
      // 9. COUNT STUDENTS
      // --------------------------------------------------

      let studentCount = 0;

      if (courseRecord.class_id) {
        const { count, error: studentError } =
          await supabase
            .from("student_enrollments")
            .select("id", {
              count: "exact",
              head: true,
            })
            .eq("session_id", currentSession.id)
            .eq("class_id", courseRecord.class_id)
            .eq("status", "active");

        if (studentError) {
          console.error(studentError);
        } else {
          studentCount = count || 0;
        }
      }

      // --------------------------------------------------
      // 10. COUNT RESULTS
      // --------------------------------------------------

      const { count: resultCount, error: resultsError } =
        await supabase
          .from("results")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("course_id", courseId)
          .eq("session_id", currentSession.id)
          .eq("term_id", currentTerm.id);

      if (resultsError) {
        console.error(resultsError);
      }

      // --------------------------------------------------
      // 11. COUNT PENDING SUBMISSIONS
      // --------------------------------------------------

      let pendingCount = 0;

      if (loadedAssignments.length > 0) {
        const assignmentIds = loadedAssignments.map(
          (item: { id: string }) => item.id
        );

        const { count, error: submissionError } =
          await supabase
            .from("submissions")
            .select("id", {
              count: "exact",
              head: true,
            })
            .in("assignment_id", assignmentIds)
            .neq("status", "graded");

        if (submissionError) {
          console.error(submissionError);
        } else {
          pendingCount = count || 0;
        }
      }

      // --------------------------------------------------
      // 12. SET STATISTICS
      // --------------------------------------------------

      setStats({
        students: studentCount,
        assignments: loadedAssignments.length,
        pendingSubmissions: pendingCount,
        results: resultCount || 0,
      });
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading this course."
      );
    } finally {
      setLoading(false);
    }
  }, [courseId, router, supabase]);

  useEffect(() => {
    if (!courseId) return;

    const timeoutId = window.setTimeout(() => {
      void loadCourse();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [courseId, loadCourse]);

  // --------------------------------------------------
  // LOADING STATE
  // --------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-sm font-medium">
            Loading course...
          </p>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // ERROR STATE
  // --------------------------------------------------

  if (error || !course) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
          <div className="mx-auto mb-5 w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>

          <h1 className="text-xl font-bold text-slate-900">
            Course unavailable
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {error ||
              "We could not load this course."}
          </p>

          <Link
            href="/staff-dashboard/courses"
            className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // MAIN PAGE
  // --------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <Link
            href="/staff-dashboard/courses"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-emerald-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Courses
          </Link>

          <div className="mt-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
                <BookOpen className="w-7 h-7 text-emerald-600" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold text-slate-900">
                    {course.name}
                  </h1>

                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold">
                    {course.code}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                  {classInfo && (
                    <span>
                      Class:{" "}
                      <strong className="text-slate-700">
                        {classInfo.name}
                      </strong>
                    </span>
                  )}

                  <span>
                    Session:{" "}
                    <strong className="text-slate-700">
                      {session?.name}
                    </strong>
                  </span>

                  <span>
                    Term:{" "}
                    <strong className="text-slate-700">
                      {term?.name}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold ${
                  course.is_active
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    course.is_active
                      ? "bg-emerald-500"
                      : "bg-slate-400"
                  }`}
                />
                {course.is_active
                  ? "Active Course"
                  : "Inactive Course"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* DESCRIPTION */}
        {course.description && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
            <h2 className="text-sm font-bold text-slate-900">
              Course Description
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {course.description}
            </p>
          </div>
        )}

        {/* STAT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            icon={<Users className="w-5 h-5" />}
            label="Students"
            value={stats.students}
            description="Active students"
          />

          <StatCard
            icon={<ClipboardList className="w-5 h-5" />}
            label="Assignments"
            value={stats.assignments}
            description="Created assignments"
          />

          <StatCard
            icon={<Clock className="w-5 h-5" />}
            label="Pending"
            value={stats.pendingSubmissions}
            description="Submissions to review"
          />

          <StatCard
            icon={<BarChart3 className="w-5 h-5" />}
            label="Results"
            value={stats.results}
            description="Results entered"
          />
        </div>

        {/* QUICK ACTIONS */}
        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">
              Course Workspace
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Manage teaching activities for this course.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <WorkspaceCard
              href={`/staff-dashboard/courses/${course.id}/students`}
              icon={<Users className="w-5 h-5" />}
              title="Students"
              description="View students taking this course."
            />

            <WorkspaceCard
              href={`/staff-dashboard/courses/${course.id}/assignments`}
              icon={<ClipboardList className="w-5 h-5" />}
              title="Assignments"
              description="Create and manage assignments."
            />

            <WorkspaceCard
              href={`/staff-dashboard/courses/${course.id}/results`}
              icon={<BarChart3 className="w-5 h-5" />}
              title="Results"
              description="Enter and manage student results."
            />

            <WorkspaceCard
              href={`/staff-dashboard/courses/${course.id}/attendance`}
              icon={<CalendarCheck className="w-5 h-5" />}
              title="Attendance"
              description="Record and review attendance."
            />
          </div>
        </section>

        {/* RECENT ASSIGNMENTS */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Recent Assignments
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Latest assignments for this course.
              </p>
            </div>

            <Link
              href={`/staff-dashboard/courses/${course.id}/assignments`}
              className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
            >
              View all
            </Link>
          </div>

          {assignments.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center">
              <div className="mx-auto w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-slate-400" />
              </div>

              <h3 className="mt-4 font-semibold text-slate-900">
                No assignments yet
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                You have not created any assignments for this
                course.
              </p>

              <Link
                href={`/staff-dashboard/courses/${course.id}/assignments/create`}
                className="inline-flex items-center gap-2 mt-5 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition"
              >
                Create Assignment
              </Link>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="divide-y divide-slate-100">
                {assignments.slice(0, 5).map((assignment) => (
                  <Link
                    key={assignment.id}
                    href={`/staff-dashboard/assignments/${assignment.id}`}
                    className="block p-5 hover:bg-slate-50 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {assignment.title}
                        </h3>

                        <p className="text-sm text-slate-500 mt-1">
                          Maximum score:{" "}
                          {assignment.max_score}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <AssignmentStatus
                          status={assignment.status}
                        />

                        {assignment.due_date && (
                          <span className="text-xs text-slate-500">
                            Due{" "}
                            {formatDate(
                              assignment.due_date
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* STAFF INFO */}
        {staff && (
          <section className="mt-8">
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Teaching Information
                  </h2>

                  <p className="text-sm text-slate-500 mt-1">
                    Current assignment details
                  </p>
                </div>

                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
                <InfoItem
                  label="Staff ID"
                  value={staff.staff_id}
                />

                <InfoItem
                  label="Department"
                  value={
                    staff.department || "Not specified"
                  }
                />

                <InfoItem
                  label="Position"
                  value={
                    staff.position || "Not specified"
                  }
                />
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

// --------------------------------------------------
// STAT CARD
// --------------------------------------------------

function StatCard({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
          {icon}
        </div>

        <span className="text-2xl font-bold text-slate-900">
          {value}
        </span>
      </div>

      <div className="mt-4">
        <p className="text-sm font-semibold text-slate-900">
          {label}
        </p>

        <p className="text-xs text-slate-500 mt-1">
          {description}
        </p>
      </div>
    </div>
  );
}

// --------------------------------------------------
// WORKSPACE CARD
// --------------------------------------------------

function WorkspaceCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group bg-white border border-slate-200 rounded-2xl p-5 hover:border-emerald-200 hover:shadow-sm transition"
    >
      <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-emerald-50 flex items-center justify-center text-slate-600 group-hover:text-emerald-600 transition">
        {icon}
      </div>

      <h3 className="mt-4 font-semibold text-slate-900">
        {title}
      </h3>

      <p className="mt-1 text-sm leading-5 text-slate-500">
        {description}
      </p>

      <span className="inline-block mt-4 text-xs font-semibold text-emerald-600">
        Open →
      </span>
    </Link>
  );
}

// --------------------------------------------------
// ASSIGNMENT STATUS
// --------------------------------------------------

function AssignmentStatus({
  status,
}: {
  status: string;
}) {
  const normalized = status.toLowerCase();

  const styles =
    normalized === "published"
      ? "bg-emerald-50 text-emerald-700"
      : normalized === "closed"
      ? "bg-slate-100 text-slate-600"
      : "bg-amber-50 text-amber-700";

  return (
    <span
      className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${styles}`}
    >
      {status}
    </span>
  );
}

// --------------------------------------------------
// INFO ITEM
// --------------------------------------------------

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}

// --------------------------------------------------
// DATE FORMATTER
// --------------------------------------------------

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}