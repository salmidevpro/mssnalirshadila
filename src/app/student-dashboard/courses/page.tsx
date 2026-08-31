"use client";

import { ArrowLeft, BookOpen, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";

const SCHOOL_BLUE = "#010066";
const SCHOOL_BLUE_DARK = "#00004D";
const SCHOOL_GOLD = "#FFAF2E";

type Course = {
  id: string;
  code: string;
  name: string;
};

type Registration = {
  id: string;
  course_id: string;
};

export default function StudentCoursesPage() {
  const supabase = useMemo(() => createClient(), []);

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const isMountedRef = useRef(true);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);

      // =====================================================
      // 1. GET LOGGED-IN USER
      // =====================================================

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

      // =====================================================
      // 2. GET STUDENT RECORD
      // =====================================================

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

      // =====================================================
      // 3. GET CURRENT ACADEMIC SESSION
      // =====================================================

      const { data: session, error: sessionError } = await supabase
        .from("academic_sessions")
        .select("id, name, is_current")
        .eq("is_current", true)
        .maybeSingle();

      if (sessionError) {
        throw new Error(
          `Unable to load academic session: ${sessionError.message}`,
        );
      }

      if (!session) {
        throw new Error("No active academic session has been configured.");
      }

      // =====================================================
      // 4. GET CURRENT TERM
      // =====================================================

      const { data: term, error: termError } = await supabase
        .from("academic_terms")
        .select("id, name, session_id, is_current")
        .eq("session_id", session.id)
        .eq("is_current", true)
        .maybeSingle();

      if (termError) {
        throw new Error(
          `Unable to load academic term: ${termError.message}`,
        );
      }

      if (!term) {
        throw new Error("No active academic term has been configured.");
      }

      // =====================================================
      // 5. GET STUDENT COURSE REGISTRATIONS
      //
      // IMPORTANT:
      // We DO NOT use:
      //
      // courses (...)
      //
      // here.
      //
      // We first get the course IDs.
      // =====================================================

      const { data: registrations, error: registrationError } = await supabase
        .from("course_registrations")
        .select("id, course_id")
        .eq("student_id", student.id)
        .eq("session_id", session.id)
        .eq("term_id", term.id);

      if (registrationError) {
        throw new Error(
          `Unable to load course registrations: ${registrationError.message}`,
        );
      }

      const registrationRows = (registrations ?? []) as Registration[];

      // =====================================================
      // 6. NO REGISTRATIONS
      // =====================================================

      if (registrationRows.length === 0) {
        if (isMountedRef.current) {
          setCourses([]);
        }
        return;
      }

      // =====================================================
      // 7. EXTRACT COURSE IDS
      // =====================================================

      const courseIds = Array.from(
        new Set(
          registrationRows
            .map((registration) => registration.course_id)
            .filter(Boolean),
        ),
      );

      if (courseIds.length === 0) {
        if (isMountedRef.current) {
          setCourses([]);
        }
        return;
      }

      // =====================================================
      // 8. LOAD COURSES DIRECTLY
      //
      // This is the important fix.
      // =====================================================

      const { data: courseRows, error: coursesError } = await supabase
        .from("courses")
        .select("id, code, name")
        .in("id", courseIds)
        .order("code", { ascending: true });

      if (coursesError) {
        throw new Error(
          `Unable to load courses: ${coursesError.message}`,
        );
      }

      // =====================================================
      // 9. NORMALIZE COURSES
      // =====================================================

      const normalizedCourses: Course[] = (courseRows ?? []).map((course) => ({
        id: course.id,
        code: course.code,
        name: course.name,
      }));

      if (isMountedRef.current) {
        setCourses(normalizedCourses);
      }
    } catch (err) {
      console.error("Student courses error:", err);

      if (isMountedRef.current) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your courses.",
        );
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  // =====================================================
  // LOAD PAGE
  // =====================================================

  useEffect(() => {
    isMountedRef.current = true;

    const loadCoursesForPage = async () => {
      try {
        setLoading(true);
        setError(null);

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

        const { data: session, error: sessionError } = await supabase
          .from("academic_sessions")
          .select("id, name, is_current")
          .eq("is_current", true)
          .maybeSingle();

        if (sessionError) {
          throw new Error(
            `Unable to load academic session: ${sessionError.message}`,
          );
        }

        if (!session) {
          throw new Error("No active academic session has been configured.");
        }

        const { data: term, error: termError } = await supabase
          .from("academic_terms")
          .select("id, name, session_id, is_current")
          .eq("session_id", session.id)
          .eq("is_current", true)
          .maybeSingle();

        if (termError) {
          throw new Error(
            `Unable to load academic term: ${termError.message}`,
          );
        }

        if (!term) {
          throw new Error("No active academic term has been configured.");
        }

        const { data: registrations, error: registrationError } = await supabase
          .from("course_registrations")
          .select("id, course_id")
          .eq("student_id", student.id)
          .eq("session_id", session.id)
          .eq("term_id", term.id);

        if (registrationError) {
          throw new Error(
            `Unable to load course registrations: ${registrationError.message}`,
          );
        }

        const registrationRows = (registrations ?? []) as Registration[];

        if (registrationRows.length === 0) {
          if (isMountedRef.current) {
            setCourses([]);
          }
          return;
        }

        const courseIds = Array.from(
          new Set(
            registrationRows
              .map((registration) => registration.course_id)
              .filter(Boolean),
          ),
        );

        if (courseIds.length === 0) {
          if (isMountedRef.current) {
            setCourses([]);
          }
          return;
        }

        const { data: courseRows, error: coursesError } = await supabase
          .from("courses")
          .select("id, code, name")
          .in("id", courseIds)
          .order("code", { ascending: true });

        if (coursesError) {
          throw new Error(
            `Unable to load courses: ${coursesError.message}`,
          );
        }

        const normalizedCourses: Course[] = (courseRows ?? []).map((course) => ({
          id: course.id,
          code: course.code,
          name: course.name,
        }));

        if (isMountedRef.current) {
          setCourses(normalizedCourses);
        }
      } catch (err) {
        console.error("Student courses error:", err);

        if (isMountedRef.current) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load your courses.",
          );
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    void loadCoursesForPage();

    return () => {
      isMountedRef.current = false;
    };
  }, [supabase]);

  // =====================================================
  // SEARCH
  // =====================================================

  const filteredCourses = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return courses;
    }

    return courses.filter(
      (course) =>
        course.name.toLowerCase().includes(query) ||
        course.code.toLowerCase().includes(query),
    );
  }, [courses, search]);

  // =====================================================
  // LOADING STATE
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-full bg-slate-50">
        <section className="border-b border-slate-200 bg-white">
          <div className="px-5 py-7 sm:px-8 sm:py-9">
            <div className="animate-pulse">
              <div className="h-3 w-28 rounded bg-slate-200" />

              <div className="mt-3 h-8 w-56 rounded bg-slate-200" />

              <div className="mt-3 h-4 w-full max-w-lg rounded bg-slate-100" />
            </div>
          </div>
        </section>

        <main className="px-5 py-7 sm:px-8 sm:py-9">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-white"
              />
            ))}
          </div>
        </main>
      </div>
    );
  }

  // =====================================================
  // ERROR STATE
  // =====================================================

  if (error) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-5">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm">
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{
              backgroundColor: `${SCHOOL_BLUE}08`,
              color: SCHOOL_BLUE,
            }}
          >
            <BookOpen size={24} />
          </div>

          <p
            className="mt-5 text-xs font-bold uppercase tracking-[0.18em]"
            style={{
              color: SCHOOL_GOLD,
            }}
          >
            Courses
          </p>

          <h1
            className="mt-2 text-xl font-black"
            style={{
              color: SCHOOL_BLUE_DARK,
            }}
          >
            Login required
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Please sign in again to continue viewing your courses.
          </p>

          <Link
            href="/student-login"
            className="mt-6 inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5"
            style={{
              backgroundColor: SCHOOL_BLUE,
            }}
          >
            Sign in here
          </Link>
        </div>
      </div>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="min-h-full bg-slate-50">
      {/* =================================================
          HEADER
      ================================================= */}

      <section className="border-b border-slate-200 bg-white">
        <div className="px-5 py-7 sm:px-8 sm:py-9">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Link
                href="/student-dashboard"
                className="mb-4 inline-flex items-center gap-2 text-xs font-bold transition hover:opacity-70"
                style={{ color: SCHOOL_BLUE }}
              >
                <ArrowLeft size={15} />
                Back to Dashboard
              </Link>

              <p
                className="text-[10px] font-bold uppercase tracking-[0.22em]"
                style={{ color: SCHOOL_GOLD }}
              >
                Academic
              </p>

              <h1
                className="mt-2 text-2xl font-black tracking-tight sm:text-3xl"
                style={{ color: SCHOOL_BLUE_DARK }}
              >
                My Courses
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                View the courses you are currently registered for.
              </p>
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
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search courses..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#010066]/30 focus:bg-white focus:ring-4 focus:ring-[#010066]/5"
              />
            </div>
          </div>
        </div>
      </section>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="px-5 py-7 sm:px-8 sm:py-9">
        {/* COURSE COUNT */}

        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Registered Courses
            </p>

            <p
              className="mt-1 text-sm font-bold"
              style={{ color: SCHOOL_BLUE_DARK }}
            >
              {filteredCourses.length}{" "}
              {filteredCourses.length === 1 ? "course" : "courses"}
            </p>
          </div>
        </div>

        {/* =================================================
            COURSES
        ================================================= */}

        {filteredCourses.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(1,0,102,0.035)] transition-all duration-300 hover:-translate-y-1 hover:border-[#010066]/20 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-4">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: `${SCHOOL_BLUE}08`,
                      color: SCHOOL_BLUE,
                    }}
                  >
                    <BookOpen size={21} />
                  </div>

                  <span
                    className="rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider"
                    style={{
                      backgroundColor: `${SCHOOL_GOLD}18`,
                      color: SCHOOL_BLUE_DARK,
                    }}
                  >
                    {course.code}
                  </span>
                </div>

                <div className="mt-6">
                  <p
                    className="text-lg font-black"
                    style={{ color: SCHOOL_BLUE_DARK }}
                  >
                    {course.name}
                  </p>

                  <p className="mt-2 text-xs text-slate-400">
                    Course Code:{" "}
                    <span className="font-bold text-slate-500">
                      {course.code}
                    </span>
                  </p>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-4">
                  <span className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Registered
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* =================================================
             EMPTY STATE
          ================================================= */

          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-16 text-center shadow-[0_8px_30px_rgba(1,0,102,0.035)]">
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{
                backgroundColor: `${SCHOOL_BLUE}08`,
                color: SCHOOL_BLUE,
              }}
            >
              {search ? <Search size={24} /> : <BookOpen size={24} />}
            </div>

            <h2
              className="mt-5 text-lg font-black"
              style={{ color: SCHOOL_BLUE_DARK }}
            >
              {search ? "No courses found" : "No courses registered"}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
              {search
                ? "Try searching with a different course name or course code."
                : "Your registered courses will appear here once they have been assigned to your student account."}
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

        {/* =================================================
            INFO
        ================================================= */}

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
              <Plus size={19} />
            </div>

            <div>
              <p className="text-sm font-black text-white">
                Need help with your courses?
              </p>

              <p className="mt-1 text-xs leading-5 text-white/55">
                Contact the school administration if you believe a course is
                missing from your registration.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}