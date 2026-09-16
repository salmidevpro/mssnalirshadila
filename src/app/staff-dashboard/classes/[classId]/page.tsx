"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  GraduationCap,
  Loader2,
  RefreshCw,
  Search,
  Users,
  UserRound,
  AlertCircle,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { SCHOOL_BLUE, SCHOOL_GOLD } from "@/config/site";

type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  middle_name: string | null;
  email: string | null;
  avatar_url: string | null;
};

type Staff = {
  id: string;
  user_id: string;
  staff_id: string;
  department: string | null;
  position: string | null;
  status: string;
};

type AcademicSession = {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
};

type AcademicTerm = {
  id: string;
  name: string;
  session_id: string;
  start_date: string | null;
  end_date: string | null;
};

type ClassRecord = {
  id: string;
  name: string;
  description: string | null;
  education_level_id: string | null;
  created_at: string;
};

type Course = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  units: number | null;
  is_active: boolean;
  class_id: string | null;
};

type Student = {
  id: string;
  student_id: string | null;
  admission_number: string | null;
  full_name: string | null;
  date_of_birth: string | null;
  status: string | null;
  profile_photo: string | null;
};

export default function ClassOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const classId =
    typeof params?.classId === "string"
      ? params.classId
      : Array.isArray(params?.classId)
        ? params.classId[0]
        : "";

  const [profile, setProfile] = useState<Profile | null>(null);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [session, setSession] = useState<AcademicSession | null>(null);
  const [term, setTerm] = useState<AcademicTerm | null>(null);
  const [classRecord, setClassRecord] = useState<ClassRecord | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const [studentSearch, setStudentSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const displayName = useMemo(() => {
    if (!profile) return "Staff";

    return (
      [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
      profile.email ||
      "Staff"
    );
  }, [profile]);

  const filteredStudents = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();

    if (!query) return students;

    return students.filter((student) => {
      const values = [
        student.full_name,
        student.student_id,
        student.admission_number,
      ];

      return values.some((value) =>
        value?.toLowerCase().includes(query)
      );
    });
  }, [students, studentSearch]);

  const loadClass = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      /*
       * 1. Authenticated user
       */
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/staff-login");
        return;
      }

      /*
       * 2. Staff profile
       */
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select(`
          id,
          first_name,
          last_name,
          middle_name,
          email,
          avatar_url
        `)
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        throw new Error(profileError.message);
      }

      setProfile(profileData);

      /*
       * 3. Active staff record
       */
      const { data: staffData, error: staffError } = await supabase
        .from("staff")
        .select(`
          id,
          user_id,
          staff_id,
          department,
          position,
          status
        `)
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (staffError) {
        throw new Error(staffError.message);
      }

      if (!staffData) {
        throw new Error(
          "Your account is not linked to an active staff record."
        );
      }

      setStaff(staffData);

      /*
       * 4. Current academic session
       */
      const { data: sessionData, error: sessionError } = await supabase
        .from("academic_sessions")
        .select("id, name, start_date, end_date")
        .eq("is_current", true)
        .maybeSingle();

      if (sessionError) {
        throw new Error(sessionError.message);
      }

      if (!sessionData) {
        throw new Error(
          "No current academic session has been configured."
        );
      }

      setSession(sessionData);

      /*
       * 5. Current academic term
       */
      const { data: termData, error: termError } = await supabase
        .from("academic_terms")
        .select(`
          id,
          name,
          session_id,
          start_date,
          end_date
        `)
        .eq("session_id", sessionData.id)
        .eq("is_current", true)
        .maybeSingle();

      if (termError) {
        throw new Error(termError.message);
      }

      if (!termData) {
        throw new Error(
          "No current academic term has been configured."
        );
      }

      setTerm(termData);

      /*
       * 6. Load requested class
       */
      if (!classId) {
        throw new Error("No class was specified.");
      }

      const { data: classData, error: classError } = await supabase
        .from("classes")
        .select(`
          id,
          name,
          description,
          education_level_id,
          created_at
        `)
        .eq("id", classId)
        .maybeSingle();

      if (classError) {
        throw new Error(classError.message);
      }

      if (!classData) {
        throw new Error("Class not found.");
      }

      setClassRecord(classData);

      /*
       * 7. Find courses assigned to this teacher
       *    for the current session and term.
       */
      const { data: assignmentData, error: assignmentError } =
        await supabase
          .from("course_teachers")
          .select(`
            id,
            course_id,
            teacher_id,
            session_id,
            term_id
          `)
          .eq("teacher_id", staffData.id)
          .eq("session_id", sessionData.id)
          .eq("term_id", termData.id);

      if (assignmentError) {
        throw new Error(assignmentError.message);
      }

      const assignedCourseIds = Array.from(
        new Set(
          (assignmentData ?? [])
            .map((assignment) => assignment.course_id)
            .filter(Boolean)
        )
      );

      /*
       * 8. Load courses and keep only courses belonging
       *    to this class.
       */
      let classCourses: Course[] = [];

      if (assignedCourseIds.length > 0) {
        const { data: courseData, error: courseError } = await supabase
          .from("courses")
          .select(`
            id,
            code,
            name,
            description,
            units,
            is_active,
            class_id
          `)
          .in("id", assignedCourseIds)
          .eq("class_id", classId)
          .order("name");

        if (courseError) {
          throw new Error(courseError.message);
        }

        classCourses = courseData ?? [];
      }

      setCourses(classCourses);

      /*
       * 9. Load students belonging to this class.
       */
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select(`
          id,
          student_id,
          admission_number,
          full_name,
          date_of_birth,
          status,
          profile_photo
        `)
        .eq("class_id", classId)
        .order("full_name");

      if (studentError) {
        throw new Error(studentError.message);
      }

      setStudents(studentData ?? []);
    } catch (err) {
      console.error("Class overview error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load this class."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [classId, router, supabase]);

  useEffect(() => {
    const loadTimeout = window.setTimeout(() => {
      void loadClass();
    }, 0);

    return () => window.clearTimeout(loadTimeout);
  }, [loadClass]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f9fc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm">Loading class...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f7f9fc] flex items-center justify-center px-4">
        <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-sm p-7 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>

          <h1 className="mt-4 text-lg font-semibold text-slate-900">
            Unable to load class
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {error}
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => loadClass(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white"
              style={{ backgroundColor: SCHOOL_BLUE }}
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>

            <Link
              href="/staff-dashboard/classes"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Classes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!classRecord) return null;

  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      {/* Top header */}
      <header className="h-[76px] bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/staff-dashboard/classes"
            className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Staff Portal</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span>My Classes</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="truncate">{classRecord.name}</span>
            </div>

            <h1 className="mt-0.5 text-lg sm:text-xl font-bold text-slate-900 truncate">
              {classRecord.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadClass(true)}
            disabled={refreshing}
            className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>

          <div className="hidden md:flex items-center gap-3 pl-3 border-l border-slate-200">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-800">
                {displayName}
              </p>
              <p className="text-xs text-slate-400">
                {staff?.staff_id || "Staff"}
              </p>
            </div>

            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={displayName}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserRound className="w-5 h-5 text-slate-400" />
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Hero */}
        <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: `${SCHOOL_BLUE}12`,
                  color: SCHOOL_BLUE,
                }}
              >
                <GraduationCap className="w-7 h-7" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-bold text-slate-900">
                    {classRecord.name}
                  </h2>

                  <span
                    className="px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{
                      backgroundColor: `${SCHOOL_GOLD}22`,
                      color: SCHOOL_BLUE,
                    }}
                  >
                    Assigned
                  </span>
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  {classRecord.description ||
                    "Your teaching workspace for this class."}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4" />
                    {session?.name}
                  </span>

                  <span className="w-1 h-1 rounded-full bg-slate-300" />

                  <span className="capitalize">
                    {term?.name} Term
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:min-w-[280px]">
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <Users className="w-4 h-4" />
                  <span className="text-xs font-medium">
                    Students
                  </span>
                </div>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {students.length}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <BookOpen className="w-4 h-4" />
                  <span className="text-xs font-medium">
                    My Courses
                  </span>
                </div>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {courses.length}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick actions */}
        <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/staff-dashboard/attendance"
            className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all group"
          >
            <div className="flex items-start justify-between">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: `${SCHOOL_BLUE}12`,
                  color: SCHOOL_BLUE,
                }}
              >
                <ClipboardCheck className="w-5 h-5" />
              </div>

              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
            </div>

            <h3 className="mt-4 font-semibold text-slate-900">
              Attendance
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Manage attendance for your students.
            </p>
          </Link>

          <Link
            href="/staff-dashboard/results"
            className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all group"
          >
            <div className="flex items-start justify-between">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: `${SCHOOL_GOLD}22`,
                  color: SCHOOL_BLUE,
                }}
              >
                <GraduationCap className="w-5 h-5" />
              </div>

              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
            </div>

            <h3 className="mt-4 font-semibold text-slate-900">
              Results
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Enter and manage academic results.
            </p>
          </Link>

          <Link
            href="/staff-dashboard/students"
            className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all group sm:col-span-2 lg:col-span-1"
          >
            <div className="flex items-start justify-between">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: "#f1f5f9",
                  color: SCHOOL_BLUE,
                }}
              >
                <Users className="w-5 h-5" />
              </div>

              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
            </div>

            <h3 className="mt-4 font-semibold text-slate-900">
              Students
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              View students in the staff portal.
            </p>
          </Link>
        </section>

        {/* Courses */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Your Courses
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Courses you are assigned to teach in this class.
              </p>
            </div>

            <span className="text-sm font-semibold text-slate-500">
              {courses.length}
            </span>
          </div>

          {courses.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
              <BookOpen className="w-8 h-8 mx-auto text-slate-300" />
              <p className="mt-3 font-medium text-slate-700">
                No courses assigned
              </p>
              <p className="mt-1 text-sm text-slate-500">
                You currently have no course assignment for this class.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <span
                        className="inline-flex px-2.5 py-1 rounded-lg text-xs font-bold"
                        style={{
                          backgroundColor: `${SCHOOL_BLUE}12`,
                          color: SCHOOL_BLUE,
                        }}
                      >
                        {course.code}
                      </span>

                      <h3 className="mt-3 text-base font-bold text-slate-900">
                        {course.name}
                      </h3>

                      {course.description && (
                        <p className="mt-1 text-sm text-slate-500 line-clamp-2">
                          {course.description}
                        </p>
                      )}
                    </div>

                    <BookOpen
                      className="w-5 h-5 shrink-0"
                      style={{ color: SCHOOL_BLUE }}
                    />
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                      {course.units ?? 0}{" "}
                      {course.units === 1 ? "unit" : "units"}
                    </span>

                    <Link
                      href={`/staff-dashboard/courses/${course.id}/results`}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
                      style={{ color: SCHOOL_BLUE }}
                    >
                      Results
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Students */}
        <section className="mt-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Students
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Students currently assigned to {classRecord.name}.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search students..."
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
              <Users className="w-8 h-8 mx-auto text-slate-300" />

              <p className="mt-3 font-medium text-slate-700">
                {students.length === 0
                  ? "No students found"
                  : "No matching students"}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {students.length === 0
                  ? "There are currently no students assigned to this class."
                  : "Try a different search term."}
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="hidden md:grid grid-cols-[minmax(0,1fr)_180px_140px] gap-4 px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span>Student</span>
                <span>Admission Number</span>
                <span>Status</span>
              </div>

              <div className="divide-y divide-slate-100">
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_180px_140px] gap-3 md:gap-4 px-5 py-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                        {student.profile_photo ? (
                          <Image
                            src={student.profile_photo}
                            alt={student.full_name || "Student"}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <UserRound className="w-5 h-5 text-slate-400" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">
                          {student.full_name || "Unnamed Student"}
                        </p>

                        <p className="text-xs text-slate-400 truncate">
                          {student.student_id || "No student ID"}
                        </p>
                      </div>
                    </div>

                    <div className="flex md:items-center">
                      <div className="md:hidden text-xs font-medium text-slate-400 mr-2">
                        Admission:
                      </div>

                      <span className="text-sm text-slate-600">
                        {student.admission_number || "—"}
                      </span>
                    </div>

                    <div className="flex md:items-center">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                          student.status === "active"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {student.status || "Unknown"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
