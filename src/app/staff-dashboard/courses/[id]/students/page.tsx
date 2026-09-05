"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Search,
  Users,
  UserRound,
  AlertCircle,
  Loader2,
  GraduationCap,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Course = {
  id: string;
  code: string;
  name: string;
  class_id: string | null;
};

type ClassInfo = {
  id: string;
  name: string;
};

type Student = {
  id: string;
  full_name: string;
  student_id: string;
  admission_number: string | null;
  status: string;
  profile_photo: string | null;
};

type Enrollment = {
  id: string;
  student_id: string;
  status: string;
  students: Student | Student[] | null;
};

export default function CourseStudentsPage() {
  const params = useParams();
  const router = useRouter();

  const supabase = useMemo(() => createClient(), []);

  const courseId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [course, setCourse] = useState<Course | null>(null);
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [students, setStudents] = useState<Student[]>([]);

  const [search, setSearch] = useState("");

  const loadStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      // ---------------------------------------------
      // 1. AUTH
      // ---------------------------------------------

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push("/staff-login");
        return;
      }

      // ---------------------------------------------
      // 2. STAFF
      // ---------------------------------------------

      const { data: staff, error: staffError } =
        await supabase
          .from("staff")
          .select("id, status")
          .eq("user_id", user.id)
          .eq("status", "active")
          .maybeSingle();

      if (staffError) {
        console.error(staffError);
        throw new Error(
          "Unable to verify your staff account."
        );
      }

      if (!staff) {
        throw new Error(
          "Your staff account could not be verified."
        );
      }

      // ---------------------------------------------
      // 3. CURRENT SESSION
      // ---------------------------------------------

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

      // ---------------------------------------------
      // 4. CURRENT TERM
      // ---------------------------------------------

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

      // ---------------------------------------------
      // 5. VERIFY TEACHER ASSIGNMENT
      // ---------------------------------------------

      const { data: courseTeacher, error: assignmentError } =
        await supabase
          .from("course_teachers")
          .select("id")
          .eq("teacher_id", staff.id)
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

      if (!courseTeacher) {
        throw new Error(
          "You are not assigned to this course for the current academic term."
        );
      }

      // ---------------------------------------------
      // 6. GET COURSE
      // ---------------------------------------------

      const { data: courseRecord, error: courseError } =
        await supabase
          .from("courses")
          .select(
            `
              id,
              code,
              name,
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

      // ---------------------------------------------
      // 7. GET CLASS
      // ---------------------------------------------

      if (!courseRecord.class_id) {
        setStudents([]);
        setLoading(false);
        return;
      }

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

      // ---------------------------------------------
      // 8. GET ENROLLED STUDENTS
      //
      // IMPORTANT:
      // student_enrollments has NO term_id.
      // We therefore scope it by session + class.
      // ---------------------------------------------

      const { data: enrollmentRecords, error: enrollmentError } =
        await supabase
          .from("student_enrollments")
          .select(
            `
              id,
              student_id,
              status,
              students (
                id,
                full_name,
                student_id,
                admission_number,
                status,
                profile_photo
              )
            `
          )
          .eq("session_id", currentSession.id)
          .eq("class_id", courseRecord.class_id)
          .eq("status", "active")
          .order("created_at", {
            ascending: true,
          });

      if (enrollmentError) {
        console.error(enrollmentError);

        throw new Error(
          "Unable to load students for this course."
        );
      }

      // ---------------------------------------------
      // 9. NORMALIZE NESTED STUDENT RELATION
      // ---------------------------------------------

      const loadedStudents: Student[] = [];

      (enrollmentRecords || []).forEach(
        (enrollment: Enrollment) => {
          if (!enrollment.students) return;

          const student = Array.isArray(
            enrollment.students
          )
            ? enrollment.students[0]
            : enrollment.students;

          if (student) {
            loadedStudents.push(student);
          }
        }
      );

      setStudents(loadedStudents);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading students."
      );
    } finally {
      setLoading(false);
    }
  }, [courseId, router, supabase]);

  useEffect(() => {
    if (!courseId) return;

    queueMicrotask(() => {
      void loadStudents();
    });
  }, [courseId, loadStudents]);

  // ---------------------------------------------
  // SEARCH
  // ---------------------------------------------

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return students;

    return students.filter((student) => {
      return (
        student.full_name
          ?.toLowerCase()
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

  // ---------------------------------------------
  // LOADING
  // ---------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />

          <p className="text-sm font-medium">
            Loading students...
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------
  // ERROR
  // ---------------------------------------------

  if (error || !course) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>

          <h1 className="mt-5 text-xl font-bold text-slate-900">
            Students unavailable
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {error ||
              "We could not load the students for this course."}
          </p>

          <Link
            href={`/staff-dashboard/courses/${courseId}`}
            className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Course
          </Link>
        </div>
      </div>
    );
  }

  // ---------------------------------------------
  // MAIN
  // ---------------------------------------------

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <Link
            href={`/staff-dashboard/courses/${course.id}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-emerald-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Course
          </Link>

          <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
                <Users className="w-7 h-7 text-emerald-600" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold text-slate-900">
                    Course Students
                  </h1>

                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold">
                    {course.code}
                  </span>
                </div>

                <p className="mt-2 text-sm text-slate-500">
                  {course.name}
                  {classInfo
                    ? ` • ${classInfo.name}`
                    : ""}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50">
              <Users className="w-4 h-4 text-emerald-600" />

              <span className="text-sm font-semibold text-emerald-700">
                {students.length}{" "}
                {students.length === 1
                  ? "Student"
                  : "Students"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* SEARCH + SUMMARY */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Enrolled Students
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Students currently enrolled in this class for
                the academic session.
              </p>
            </div>

            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search students..."
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
              />
            </div>
          </div>
        </div>

        {/* EMPTY STATE */}
        {students.length === 0 ? (
          <div className="mt-6 bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-slate-400" />
            </div>

            <h3 className="mt-5 text-lg font-bold text-slate-900">
              No students enrolled
            </h3>

            <p className="mt-2 max-w-md mx-auto text-sm leading-6 text-slate-500">
              There are currently no active students enrolled
              in this class for the current academic session.
            </p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="mt-6 bg-white border border-slate-200 rounded-2xl p-10 text-center">
            <Search className="mx-auto w-7 h-7 text-slate-300" />

            <h3 className="mt-4 font-semibold text-slate-900">
              No students found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Try searching with another name, student ID, or
              admission number.
            </p>
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <div className="hidden md:block mt-6 bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Student
                      </th>

                      <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Student ID
                      </th>

                      <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Admission No.
                      </th>

                      <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Status
                      </th>

                      <th className="text-right px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map((student) => (
                      <tr
                        key={student.id}
                        className="hover:bg-slate-50 transition"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <StudentAvatar
                              student={student}
                            />

                            <div>
                              <p className="font-semibold text-slate-900">
                                {student.full_name}
                              </p>

                              <p className="text-xs text-slate-500 mt-0.5">
                                Course student
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {student.student_id || "—"}
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {student.admission_number || "—"}
                        </td>

                        <td className="px-6 py-4">
                          <StatusBadge
                            status={student.status}
                          />
                        </td>

                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/staff-dashboard/students/${student.id}`}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-emerald-600 hover:bg-emerald-50 transition"
                          >
                            <UserRound className="w-4 h-4" />
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* MOBILE CARDS */}
            <div className="md:hidden mt-6 space-y-3">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <StudentAvatar
                        student={student}
                      />

                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {student.full_name}
                        </h3>

                        <p className="text-xs text-slate-500 mt-1">
                          {student.student_id || "No Student ID"}
                        </p>
                      </div>
                    </div>

                    <StatusBadge
                      status={student.status}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-5">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-400">
                        Admission No.
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {student.admission_number || "—"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-400">
                        Status
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-800 capitalize">
                        {student.status}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/staff-dashboard/students/${student.id}`}
                    className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-emerald-50 hover:text-emerald-700 transition"
                  >
                    <UserRound className="w-4 h-4" />
                    View Student
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

// --------------------------------------------------
// STUDENT AVATAR
// --------------------------------------------------

function StudentAvatar({
  student,
}: {
  student: Student;
}) {
  const initials = student.full_name
    ? student.full_name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((name) => name[0])
        .join("")
        .toUpperCase()
    : "?";

  if (student.profile_photo) {
    return (
      <Image
        src={student.profile_photo}
        alt={student.full_name}
        width={40}
        height={40}
        className="w-10 h-10 rounded-xl object-cover border border-slate-200"
      />
    );
  }

  return (
    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs font-bold">
      {initials}
    </div>
  );
}

// --------------------------------------------------
// STATUS BADGE
// --------------------------------------------------

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const active =
    status.toLowerCase() === "active";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${
        active
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          active
            ? "bg-emerald-500"
            : "bg-slate-400"
        }`}
      />

      {status}
    </span>
  );
}