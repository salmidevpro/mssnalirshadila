"use client";

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  IdCard,
  Mail,
  ShieldCheck,
  User,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";

const SCHOOL_BLUE = "#010066";
const SCHOOL_BLUE_DARK = "#00004D";
const SCHOOL_GOLD = "#FFAF2E";

type StudentProfile = {
  id: string;
  user_id: string;
  student_id: string | null;
  class_id: string | null;
  admission_number: string | null;
  admission_date: string | null;
  date_of_birth: string | null;
  status: string;
};

type ClassInfo = {
  id: string;
  name: string;
  description: string | null;
};

type AcademicSession = {
  id: string;
  name: string;
};

type AcademicTerm = {
  id: string;
  name: string;
};

type ProfileData = {
  student: StudentProfile;
  classInfo: ClassInfo | null;
  session: AcademicSession | null;
  term: AcademicTerm | null;
  email: string | null;
};

export default function StudentProfilePage() {
  const supabase = useMemo(() => createClient(), []);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      /* =====================================================
         1. GET AUTHENTICATED USER
      ===================================================== */

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
            admission_date,
            date_of_birth,
            status
          `,
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (studentError) {
        throw new Error(
          `Unable to load student profile: ${studentError.message}`,
        );
      }

      if (!student) {
        throw new Error(
          "Your student record could not be found. Please contact the school administration.",
        );
      }

      /* =====================================================
         3. GET CLASS
      ===================================================== */

      let classInfo: ClassInfo | null = null;

      if (student.class_id) {
        const { data: classData, error: classError } = await supabase
          .from("classes")
          .select("id, name, description")
          .eq("id", student.class_id)
          .maybeSingle();

        if (classError) {
          console.warn("Unable to load class:", classError.message);
        }

        classInfo = classData;
      }

      /* =====================================================
         4. GET CURRENT SESSION
      ===================================================== */

      const { data: session, error: sessionError } = await supabase
        .from("academic_sessions")
        .select("id, name")
        .eq("is_current", true)
        .maybeSingle();

      if (sessionError) {
        console.warn(
          "Unable to load academic session:",
          sessionError.message,
        );
      }

      /* =====================================================
         5. GET CURRENT TERM
      ===================================================== */

      let term: AcademicTerm | null = null;

      if (session) {
        const { data: termData, error: termError } = await supabase
          .from("academic_terms")
          .select("id, name")
          .eq("session_id", session.id)
          .eq("is_current", true)
          .maybeSingle();

        if (termError) {
          console.warn(
            "Unable to load academic term:",
            termError.message,
          );
        }

        term = termData;
      }

      /* =====================================================
         6. STORE PROFILE
      ===================================================== */

      setProfile({
        student,
        classInfo,
        session,
        term,
        email: user.email ?? null,
      });
    } catch (err) {
      console.error("Student profile error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your profile.",
      );
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  /* =====================================================
     LOAD PROFILE
  ===================================================== */

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProfile();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadProfile]);

  /* =====================================================
     FORMAT DATE
  ===================================================== */

  const formatDate = (date: string | null) => {
    if (!date) return "Not provided";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Not provided";
    }

    return parsedDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="min-h-full bg-slate-50">
        <section className="border-b border-slate-200 bg-white px-5 py-7 sm:px-8 sm:py-9">
          <div className="animate-pulse">
            <div className="h-3 w-28 rounded bg-slate-200" />
            <div className="mt-3 h-8 w-48 rounded bg-slate-200" />
            <div className="mt-3 h-4 w-full max-w-lg rounded bg-slate-100" />
          </div>
        </section>

        <main className="px-5 py-7 sm:px-8 sm:py-9">
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="h-72 animate-pulse rounded-3xl bg-white" />
            <div className="h-72 animate-pulse rounded-3xl bg-white lg:col-span-2" />
          </div>
        </main>
      </div>
    );
  }

  /* =====================================================
     ERROR
  ===================================================== */

  if (error) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-5">
        <div className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-7 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <User size={24} />
          </div>

          <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-red-400">
            Profile Error
          </p>

          <h1
            className="mt-2 text-xl font-black"
            style={{ color: SCHOOL_BLUE_DARK }}
          >
            Unable to load profile
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            {error}
          </p>

          <button
            type="button"
            onClick={() => void loadProfile()}
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

  if (!profile) return null;

  const { student, classInfo, session, term, email } = profile;

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <div className="min-h-full bg-slate-50">
      {/* =================================================
          HEADER
      ================================================= */}

      <section className="border-b border-slate-200 bg-white">
        <div className="px-5 py-7 sm:px-8 sm:py-9">
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
            Student Account
          </p>

          <h1
            className="mt-2 text-2xl font-black tracking-tight sm:text-3xl"
            style={{
              color: SCHOOL_BLUE_DARK,
            }}
          >
            My Profile
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            View your official student information and academic details.
          </p>
        </div>
      </section>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="px-5 py-7 sm:px-8 sm:py-9">
        <div className="grid gap-5 lg:grid-cols-3">
          {/* =================================================
              PROFILE SUMMARY
          ================================================= */}

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(1,0,102,0.035)]">
            <div
              className="relative px-6 pb-7 pt-8"
              style={{
                backgroundColor: SCHOOL_BLUE,
              }}
            >
              <div
                aria-hidden="true"
                className="absolute -right-12 -top-12 h-36 w-36 rounded-full blur-3xl"
                style={{
                  backgroundColor: `${SCHOOL_GOLD}25`,
                }}
              />

              <div className="relative z-10">
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white/20 shadow-lg"
                  style={{
                    backgroundColor: `${SCHOOL_GOLD}20`,
                    color: SCHOOL_GOLD,
                  }}
                >
                  <User size={34} />
                </div>

                <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
                  Student
                </p>

                <h2 className="mt-1 text-xl font-black text-white">
                  {student.student_id || "Student"}
                </h2>

                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  {student.status || "Active"}
                </div>
              </div>
            </div>

            <div className="space-y-4 p-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  Admission Number
                </p>

                <p
                  className="mt-1 text-sm font-black"
                  style={{
                    color: SCHOOL_BLUE_DARK,
                  }}
                >
                  {student.admission_number || "Not provided"}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  Student ID
                </p>

                <p
                  className="mt-1 text-sm font-black"
                  style={{
                    color: SCHOOL_BLUE_DARK,
                  }}
                >
                  {student.student_id || "Not provided"}
                </p>
              </div>
            </div>
          </section>

          {/* =================================================
              PERSONAL + ACADEMIC DETAILS
          ================================================= */}

          <div className="space-y-5 lg:col-span-2">
            {/* PERSONAL INFORMATION */}

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(1,0,102,0.035)] sm:p-7">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: `${SCHOOL_BLUE}08`,
                    color: SCHOOL_BLUE,
                  }}
                >
                  <User size={19} />
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    Account
                  </p>

                  <h2
                    className="text-lg font-black"
                    style={{
                      color: SCHOOL_BLUE_DARK,
                    }}
                  >
                    Personal Information
                  </h2>
                </div>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <InfoItem
                  icon={<Mail size={17} />}
                  label="Email Address"
                  value={email || "Not provided"}
                />

                <InfoItem
                  icon={<CalendarDays size={17} />}
                  label="Date of Birth"
                  value={formatDate(student.date_of_birth)}
                />

                <InfoItem
                  icon={<IdCard size={17} />}
                  label="Admission Date"
                  value={formatDate(student.admission_date)}
                />

                <InfoItem
                  icon={<ShieldCheck size={17} />}
                  label="Account Status"
                  value={student.status || "Active"}
                />
              </div>
            </section>

            {/* ACADEMIC INFORMATION */}

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(1,0,102,0.035)] sm:p-7">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: `${SCHOOL_GOLD}18`,
                    color: SCHOOL_BLUE_DARK,
                  }}
                >
                  <GraduationCap size={20} />
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    Academic
                  </p>

                  <h2
                    className="text-lg font-black"
                    style={{
                      color: SCHOOL_BLUE_DARK,
                    }}
                  >
                    Academic Information
                  </h2>
                </div>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <InfoItem
                  icon={<GraduationCap size={17} />}
                  label="Current Class"
                  value={classInfo?.name || "Not assigned"}
                />

                <InfoItem
                  icon={<CalendarDays size={17} />}
                  label="Academic Session"
                  value={session?.name || "Not configured"}
                />

                <InfoItem
                  icon={<CalendarDays size={17} />}
                  label="Current Term"
                  value={term?.name || "Not configured"}
                />

                <InfoItem
                  icon={<CheckCircle2 size={17} />}
                  label="Enrollment Status"
                  value={student.status || "Active"}
                />
              </div>
            </section>
          </div>
        </div>

        {/* =================================================
            SECURITY NOTICE
        ================================================= */}

        <section
          className="relative mt-5 overflow-hidden rounded-3xl p-6 sm:p-7"
          style={{
            backgroundColor: SCHOOL_BLUE,
          }}
        >
          <div
            aria-hidden="true"
            className="absolute -right-20 -top-20 h-48 w-48 rounded-full blur-3xl"
            style={{
              backgroundColor: `${SCHOOL_GOLD}18`,
            }}
          />

          <div className="relative z-10 flex items-start gap-4">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              style={{
                backgroundColor: `${SCHOOL_GOLD}18`,
                color: SCHOOL_GOLD,
              }}
            >
              <ShieldCheck size={20} />
            </div>

            <div>
              <h3 className="text-sm font-black text-white">
                Your student information is protected
              </h3>

              <p className="mt-1 max-w-2xl text-xs leading-5 text-white/55">
                Official academic information such as your class, admission
                number and student ID is managed by the school administration.
                Contact the school if any information appears to be incorrect.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

/* =====================================================
   INFO ITEM
===================================================== */

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
      <div className="mt-0.5 text-[#010066]">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-bold text-slate-700">
          {value}
        </p>
      </div>
    </div>
  );
}