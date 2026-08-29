"use client";

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Camera,
  GraduationCap,
  IdCard,
  Mail,
  Pencil,
  Phone,
  Save,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  ChangeEvent,
  FormEvent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

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

  full_name: string | null;
  phone: string | null;
  address: string | null;
  state: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  profile_photo: string | null;
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

type EditForm = {
  full_name: string;
  phone: string;
  address: string;
  state: string;
  guardian_name: string;
  guardian_phone: string;
  date_of_birth: string;
};

export default function StudentProfilePage() {
  const supabase = useMemo(() => createClient(), []);

  const [profile, setProfile] = useState<ProfileData | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);

  const [saving, setSaving] = useState(false);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formError, setFormError] = useState<string | null>(null);

  const [photoUploading, setPhotoUploading] = useState(false);

  const [form, setForm] = useState<EditForm>({
    full_name: "",
    phone: "",
    address: "",
    state: "",
    guardian_name: "",
    guardian_phone: "",
    date_of_birth: "",
  });

  /* =====================================================
     LOAD PROFILE
  ===================================================== */

  const loadProfile = useCallback(async () => {
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
        .select(
          `
            id,
            user_id,
            student_id,
            class_id,
            admission_number,
            admission_date,
            date_of_birth,
            status,
            full_name,
            phone,
            address,
            state,
            guardian_name,
            guardian_phone,
            profile_photo
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

      /* =================================================
         CLASS
      ================================================= */

      let classInfo: ClassInfo | null = null;

      if (student.class_id) {
        const { data: classData } = await supabase
          .from("classes")
          .select("id, name, description")
          .eq("id", student.class_id)
          .maybeSingle();

        classInfo = classData;
      }

      /* =================================================
         CURRENT SESSION
      ================================================= */

      const { data: session } = await supabase
        .from("academic_sessions")
        .select("id, name")
        .eq("is_current", true)
        .maybeSingle();

      /* =================================================
         CURRENT TERM
      ================================================= */

      let term: AcademicTerm | null = null;

      if (session) {
        const { data: termData } = await supabase
          .from("academic_terms")
          .select("id, name")
          .eq("session_id", session.id)
          .eq("is_current", true)
          .maybeSingle();

        term = termData;
      }

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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProfile();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadProfile]);

  /* =====================================================
     OPEN EDIT MODAL
  ===================================================== */

  const openEditProfile = () => {
    if (!profile) return;

    const student = profile.student;

    setForm({
      full_name: student.full_name ?? "",
      phone: student.phone ?? "",
      address: student.address ?? "",
      state: student.state ?? "",
      guardian_name: student.guardian_name ?? "",
      guardian_phone: student.guardian_phone ?? "",
      date_of_birth: student.date_of_birth ?? "",
    });

    setFormError(null);
    setSuccessMessage(null);
    setEditOpen(true);
  };

  /* =====================================================
     CLOSE EDIT MODAL
  ===================================================== */

  const closeEditProfile = () => {
    if (saving) return;

    setEditOpen(false);
    setFormError(null);
  };

  /* =====================================================
     FORM INPUT
  ===================================================== */

  const updateField = (field: keyof EditForm, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  /* =====================================================
     SAVE PROFILE
  ===================================================== */

  const handleSaveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!profile) return;

    setFormError(null);
    setSuccessMessage(null);

    /* ---------------------------------------------
       BASIC VALIDATION
    --------------------------------------------- */

    const fullName = form.full_name.trim();

    if (!fullName) {
      setFormError("Please enter your full name.");
      return;
    }

    if (form.phone.trim() && form.phone.trim().length < 7) {
      setFormError("Please enter a valid phone number.");
      return;
    }

    if (
      form.guardian_phone.trim() &&
      form.guardian_phone.trim().length < 7
    ) {
      setFormError("Please enter a valid guardian phone number.");
      return;
    }

    setSaving(true);

    try {
      /* ---------------------------------------------
         UPDATE ONLY STUDENT-EDITABLE FIELDS
      --------------------------------------------- */

      const { data: updatedStudent, error: updateError } =
        await supabase
          .from("students")
          .update({
            full_name: fullName,
            phone: form.phone.trim() || null,
            address: form.address.trim() || null,
            state: form.state.trim() || null,
            guardian_name: form.guardian_name.trim() || null,
            guardian_phone: form.guardian_phone.trim() || null,
            date_of_birth: form.date_of_birth || null,
          })
          .eq("id", profile.student.id)
          .select(
            `
              id,
              user_id,
              student_id,
              class_id,
              admission_number,
              admission_date,
              date_of_birth,
              status,
              full_name,
              phone,
              address,
              state,
              guardian_name,
              guardian_phone,
              profile_photo
            `,
          )
          .single();

      if (updateError) {
        throw new Error(updateError.message);
      }

      if (!updatedStudent) {
        throw new Error("Your profile could not be updated.");
      }

      setProfile((current) =>
        current
          ? {
              ...current,
              student: updatedStudent,
            }
          : current,
      );

      setEditOpen(false);

      setSuccessMessage("Your profile has been updated successfully.");
    } catch (err) {
      console.error("Profile update error:", err);

      setFormError(
        err instanceof Error
          ? err.message
          : "Unable to update your profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  /* =====================================================
     PHOTO UPLOAD
  ===================================================== */

  const handlePhotoUpload = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file || !profile) return;

    setSuccessMessage(null);
    setError(null);

    /* ---------------------------------------------
       FILE VALIDATION
    --------------------------------------------- */

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setError("Profile photos must be smaller than 3MB.");
      return;
    }

    setPhotoUploading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You are not logged in.");
      }

      const extension =
        file.name.split(".").pop()?.toLowerCase() || "jpg";

      const filePath = `${user.id}/profile.${extension}`;

      /* ---------------------------------------------
         REMOVE OLD PHOTO
      --------------------------------------------- */

      const existingPhoto = profile.student.profile_photo;

      if (existingPhoto) {
        try {
          const url = new URL(existingPhoto);

          const marker = "/student-profiles/";

          const markerIndex = url.pathname.indexOf(marker);

          if (markerIndex !== -1) {
            const oldPath = decodeURIComponent(
              url.pathname.slice(
                markerIndex + marker.length,
              ),
            );

            await supabase.storage
              .from("student-profiles")
              .remove([oldPath]);
          }
        } catch {
          // Ignore malformed old photo URL.
        }
      }

      /* ---------------------------------------------
         UPLOAD NEW PHOTO
      --------------------------------------------- */

      const { error: uploadError } = await supabase.storage
        .from("student-profiles")
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      /* ---------------------------------------------
         GET PUBLIC URL
      --------------------------------------------- */

      const {
        data: { publicUrl },
      } = supabase.storage
        .from("student-profiles")
        .getPublicUrl(filePath);

      const photoUrl = `${publicUrl}?v=${Date.now()}`;

      /* ---------------------------------------------
         SAVE URL TO STUDENT RECORD
      --------------------------------------------- */

      const { error: updateError } = await supabase
        .from("students")
        .update({
          profile_photo: photoUrl,
        })
        .eq("id", profile.student.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      setProfile((current) =>
        current
          ? {
              ...current,
              student: {
                ...current.student,
                profile_photo: photoUrl,
              },
            }
          : current,
      );

      setSuccessMessage("Profile photo updated successfully.");
    } catch (err) {
      console.error("Photo upload error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to upload your profile photo.",
      );
    } finally {
      setPhotoUploading(false);
    }
  };

  /* =====================================================
     DATE FORMAT
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

  if (error && !profile) {
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

  const displayName =
    student.full_name ||
    student.student_id ||
    "Student";

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

          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1
                className="text-2xl font-black tracking-tight sm:text-3xl"
                style={{
                  color: SCHOOL_BLUE_DARK,
                }}
              >
                My Profile
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Manage your personal information and view your official
                academic details.
              </p>
            </div>

            <button
              type="button"
              onClick={openEditProfile}
              className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              style={{
                backgroundColor: SCHOOL_BLUE,
              }}
            >
              <Pencil size={15} />
              Edit Profile
            </button>
          </div>
        </div>
      </section>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="px-5 py-7 sm:px-8 sm:py-9">
        {/* SUCCESS MESSAGE */}

        {successMessage && (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            <CheckCircle2 size={18} />

            <span>{successMessage}</span>

            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              className="ml-auto rounded-lg p-1 transition hover:bg-emerald-100"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* PHOTO ERROR */}

        {error && profile && (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError(null)}
              className="ml-auto rounded-lg p-1 transition hover:bg-red-100"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        )}

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
                {/* PROFILE PHOTO */}

                <div className="relative h-24 w-24">
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border-4 border-white/20 bg-white/10 text-white shadow-lg">
                    {student.profile_photo ? (
                      <img
                        src={student.profile_photo}
                        alt="Student profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User size={38} />
                    )}
                  </div>

                  <label
                    className={`absolute -bottom-2 -right-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border-2 border-white text-[#010066] shadow-md transition ${
                      photoUploading
                        ? "pointer-events-none opacity-60"
                        : "bg-white hover:scale-105"
                    }`}
                  >
                    {photoUploading ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#010066]/20 border-t-[#010066]" />
                    ) : (
                      <Camera size={16} />
                    )}

                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={handlePhotoUpload}
                      disabled={photoUploading}
                    />
                  </label>
                </div>

                <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
                  Student
                </p>

                <h2 className="mt-1 text-xl font-black text-white">
                  {displayName}
                </h2>

                <p className="mt-1 text-xs text-white/50">
                  {student.student_id || "Student ID not assigned"}
                </p>

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
              DETAILS
          ================================================= */}

          <div className="space-y-5 lg:col-span-2">
            {/* PERSONAL */}

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
                    Personal
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

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <InfoItem
                  icon={<User size={17} />}
                  label="Full Name"
                  value={student.full_name || "Not provided"}
                />

                <InfoItem
                  icon={<Mail size={17} />}
                  label="Email Address"
                  value={email || "Not provided"}
                />

                <InfoItem
                  icon={<Phone size={17} />}
                  label="Phone Number"
                  value={student.phone || "Not provided"}
                />

                <InfoItem
                  icon={<CalendarDays size={17} />}
                  label="Date of Birth"
                  value={formatDate(student.date_of_birth)}
                />

                <InfoItem
                  icon={<IdCard size={17} />}
                  label="State"
                  value={student.state || "Not provided"}
                />

                <InfoItem
                  icon={<User size={17} />}
                  label="Guardian"
                  value={student.guardian_name || "Not provided"}
                />
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <InfoItem
                  icon={<Phone size={17} />}
                  label="Guardian Phone"
                  value={student.guardian_phone || "Not provided"}
                />

                <InfoItem
                  icon={<IdCard size={17} />}
                  label="Address"
                  value={student.address || "Not provided"}
                />
              </div>
            </section>

            {/* ACADEMIC */}

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

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
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

                <InfoItem
                  icon={<IdCard size={17} />}
                  label="Admission Date"
                  value={formatDate(student.admission_date)}
                />

                <InfoItem
                  icon={<ShieldCheck size={17} />}
                  label="Student ID"
                  value={student.student_id || "Not provided"}
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
                Academic information such as your class, admission number,
                student ID and enrollment status is managed by the school
                administration.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* =====================================================
          EDIT PROFILE MODAL
      ===================================================== */}

      {editOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-[#00004D]/40 p-0 backdrop-blur-sm sm:items-center sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeEditProfile();
            }
          }}
        >
          <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-2xl sm:rounded-3xl">
            {/* MODAL HEADER */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-5 sm:px-7">
              <div>
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.18em]"
                  style={{
                    color: SCHOOL_GOLD,
                  }}
                >
                  Account Settings
                </p>

                <h2
                  className="mt-1 text-xl font-black"
                  style={{
                    color: SCHOOL_BLUE_DARK,
                  }}
                >
                  Edit Profile
                </h2>
              </div>

              <button
                type="button"
                onClick={closeEditProfile}
                disabled={saving}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
                aria-label="Close"
              >
                <X size={19} />
              </button>
            </div>

            {/* FORM */}

            <form
              onSubmit={handleSaveProfile}
              className="space-y-6 px-5 py-6 sm:px-7"
            >
              {/* FORM ERROR */}

              {formError && (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold leading-5 text-red-600">
                  {formError}
                </div>
              )}

              {/* PERSONAL */}

              <div>
                <p
                  className="text-xs font-black uppercase tracking-[0.16em]"
                  style={{
                    color: SCHOOL_BLUE,
                  }}
                >
                  Personal Information
                </p>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <FormInput
                    label="Full Name"
                    value={form.full_name}
                    onChange={(value) =>
                      updateField("full_name", value)
                    }
                    placeholder="Enter your full name"
                    required
                  />

                  <FormInput
                    label="Phone Number"
                    value={form.phone}
                    onChange={(value) =>
                      updateField("phone", value)
                    }
                    placeholder="Enter phone number"
                    type="tel"
                  />

                  <FormInput
                    label="Date of Birth"
                    value={form.date_of_birth}
                    onChange={(value) =>
                      updateField("date_of_birth", value)
                    }
                    type="date"
                  />

                  <FormInput
                    label="State"
                    value={form.state}
                    onChange={(value) =>
                      updateField("state", value)
                    }
                    placeholder="Enter state"
                  />
                </div>

                <div className="mt-4">
                  <FormInput
                    label="Address"
                    value={form.address}
                    onChange={(value) =>
                      updateField("address", value)
                    }
                    placeholder="Enter your home address"
                  />
                </div>
              </div>

              {/* GUARDIAN */}

              <div className="border-t border-slate-100 pt-6">
                <p
                  className="text-xs font-black uppercase tracking-[0.16em]"
                  style={{
                    color: SCHOOL_BLUE,
                  }}
                >
                  Guardian Information
                </p>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <FormInput
                    label="Guardian Name"
                    value={form.guardian_name}
                    onChange={(value) =>
                      updateField("guardian_name", value)
                    }
                    placeholder="Parent / guardian name"
                  />

                  <FormInput
                    label="Guardian Phone"
                    value={form.guardian_phone}
                    onChange={(value) =>
                      updateField("guardian_phone", value)
                    }
                    placeholder="Guardian phone number"
                    type="tel"
                  />
                </div>
              </div>

              {/* LOCKED INFORMATION */}

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      backgroundColor: `${SCHOOL_BLUE}08`,
                      color: SCHOOL_BLUE,
                    }}
                  >
                    <ShieldCheck size={17} />
                  </div>

                  <div>
                    <p
                      className="text-sm font-black"
                      style={{
                        color: SCHOOL_BLUE_DARK,
                      }}
                    >
                      School-managed information
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      These official records can only be changed by the
                      school administration.
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <LockedItem
                    label="Student ID"
                    value={student.student_id || "Not assigned"}
                  />

                  <LockedItem
                    label="Admission Number"
                    value={
                      student.admission_number ||
                      "Not assigned"
                    }
                  />

                  <LockedItem
                    label="Current Class"
                    value={classInfo?.name || "Not assigned"}
                  />

                  <LockedItem
                    label="Status"
                    value={student.status || "Active"}
                  />
                </div>
              </div>

              {/* BUTTONS */}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeEditProfile}
                  disabled={saving}
                  className="rounded-full border border-slate-200 px-6 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    backgroundColor: SCHOOL_BLUE,
                  }}
                >
                  {saving ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* =====================================================
   FORM INPUT
===================================================== */

function FormInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
        {label}
        {required && (
          <span className="ml-1 text-red-400">*</span>
        )}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-[#010066]/25 focus:bg-white focus:ring-4 focus:ring-[#010066]/5"
      />
    </label>
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
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
      <div className="mt-0.5 shrink-0 text-[#010066]">
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

/* =====================================================
   LOCKED ITEM
===================================================== */

function LockedItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-xs font-bold text-slate-600">
        {value}
      </p>
    </div>
  );
}