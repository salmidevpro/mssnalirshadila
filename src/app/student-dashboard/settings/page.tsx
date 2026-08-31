"use client";

import {
  AlertCircle,
  Bell,
  Check,
  ChevronRight,
  Eye,
  KeyRound,
  LogOut,
  Mail,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";

const SCHOOL_BLUE = "#010066";
const SCHOOL_BLUE_DARK = "#00004D";
const SCHOOL_GOLD = "#FFAF2E";

type Student = {
  id: string;
  user_id: string;
  student_id: string | null;
  admission_number: string | null;
  full_name: string | null;
  status: string | null;
  phone: string | null;
  address: string | null;
  state: string | null;
  lga: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  profile_photo: string | null;
  date_of_birth: string | null;
  admission_date: string | null;
};

export default function StudentSettingsPage() {
  const router = useRouter();

  const supabase = useMemo(() => createClient(), []);

  const [student, setStudent] = useState<Student | null>(null);
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [assignmentNotifications, setAssignmentNotifications] =
    useState(true);

  const [gradeNotifications, setGradeNotifications] =
    useState(true);

  const [announcementNotifications, setAnnouncementNotifications] =
    useState(true);

  const [message, setMessage] =
    useState<string | null>(null);

  const [messageType, setMessageType] =
    useState<"success" | "error">("success");

  const [showPasswordModal, setShowPasswordModal] =
    useState(false);

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [changingPassword, setChangingPassword] =
    useState(false);

  const [signingOut, setSigningOut] =
    useState(false);

  /* =====================================================
     MESSAGE
  ====================================================== */

  const showMessage = (
    text: string,
    type: "success" | "error" = "success",
  ) => {
    setMessage(text);
    setMessageType(type);

    window.setTimeout(() => {
      setMessage(null);
    }, 3500);
  };

  /* =====================================================
     LOAD STUDENT
  ====================================================== */

  const loadStudent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      /* -----------------------------------------------
         GET AUTHENTICATED USER
      ------------------------------------------------ */

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw new Error(
          authError.message ||
            "Unable to verify your account.",
        );
      }

      /* -----------------------------------------------
         USER NOT SIGNED IN
      ------------------------------------------------ */

      if (!user) {
        setStudent(null);
        setEmail("");

        setError("LOGIN_REQUIRED");

        return;
      }

      setEmail(user.email ?? "");

      /* -----------------------------------------------
         GET STUDENT RECORD
      ------------------------------------------------ */

      const { data, error: studentError } =
        await supabase
          .from("students")
          .select(
            `
              id,
              user_id,
              student_id,
              admission_number,
              full_name,
              status,
              phone,
              address,
              state,
              lga,
              guardian_name,
              guardian_phone,
              profile_photo,
              date_of_birth,
              admission_date
            `,
          )
          .eq("user_id", user.id)
          .maybeSingle();

      if (studentError) {
        throw new Error(
          `Unable to load your student profile: ${studentError.message}`,
        );
      }

      /* -----------------------------------------------
         STUDENT RECORD NOT FOUND
      ------------------------------------------------ */

      if (!data) {
        throw new Error(
          "Your student account could not be found. Please contact the school administration.",
        );
      }

      setStudent(data);
    } catch (err) {
      console.error(
        "Settings load error:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your account settings.",
      );
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  /* =====================================================
     INITIAL LOAD
  ====================================================== */

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadStudent();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadStudent]);

  /* =====================================================
     CHANGE PASSWORD
  ====================================================== */

  const handleChangePassword = async () => {
    if (!currentPassword) {
      showMessage(
        "Please enter your current password.",
        "error",
      );

      return;
    }

    if (!newPassword) {
      showMessage(
        "Please enter a new password.",
        "error",
      );

      return;
    }

    if (newPassword.length < 6) {
      showMessage(
        "Your new password must be at least 6 characters.",
        "error",
      );

      return;
    }

    if (newPassword !== confirmPassword) {
      showMessage(
        "The new passwords do not match.",
        "error",
      );

      return;
    }

    if (!email) {
      showMessage(
        "Your account email could not be found.",
        "error",
      );

      return;
    }

    try {
      setChangingPassword(true);

      /* -----------------------------------------------
         GET CURRENT USER
      ------------------------------------------------ */

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(
          "Unable to verify your account. Please sign in again.",
        );
      }

      if (!user?.email) {
        throw new Error(
          "Your authenticated account could not be found. Please sign in again.",
        );
      }

      /* -----------------------------------------------
         VERIFY CURRENT PASSWORD
      ------------------------------------------------ */

      const { error: signInError } =
        await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        });

      if (signInError) {
        throw new Error(
          "Your current password is incorrect.",
        );
      }

      /* -----------------------------------------------
         UPDATE PASSWORD
      ------------------------------------------------ */

      const { error: updateError } =
        await supabase.auth.updateUser({
          password: newPassword,
        });

      if (updateError) {
        throw new Error(
          updateError.message ||
            "Unable to update your password.",
        );
      }

      /* -----------------------------------------------
         CLEAR FORM
      ------------------------------------------------ */

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setShowPasswordModal(false);

      showMessage(
        "Your password has been changed successfully.",
        "success",
      );
    } catch (err) {
      console.error(
        "Password change error:",
        err,
      );

      showMessage(
        err instanceof Error
          ? err.message
          : "Unable to change your password.",
        "error",
      );
    } finally {
      setChangingPassword(false);
    }
  };

  /* =====================================================
     SIGN OUT
  ====================================================== */

  const handleSignOut = async () => {
    try {
      setSigningOut(true);

      const { error: signOutError } =
        await supabase.auth.signOut();

      if (signOutError) {
        throw new Error(
          signOutError.message ||
            "Unable to sign out.",
        );
      }

      /*
       * Force browser navigation so the protected
       * student portal is completely left.
       */

      window.location.replace("/student-login");
    } catch (err) {
      console.error(
        "Sign out error:",
        err,
      );

      setSigningOut(false);

      showMessage(
        err instanceof Error
          ? err.message
          : "Unable to sign out.",
        "error",
      );
    }
  };

  /* =====================================================
     FORMAT DATE
  ====================================================== */

  const formatDate = (
    date: string | null,
  ) => {
    if (!date) {
      return "Not available";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Not available";
    }

    return new Intl.DateTimeFormat(
      "en-GB",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      },
    ).format(parsedDate);
  };

  /* =====================================================
     LOADING
  ====================================================== */

  if (loading) {
    return (
      <div className="min-h-full bg-slate-50">
        <section className="border-b border-slate-200 bg-white px-5 py-8 sm:px-8">
          <div className="animate-pulse">
            <div className="h-3 w-20 rounded bg-slate-200" />

            <div className="mt-4 h-9 w-48 rounded bg-slate-200" />

            <div className="mt-3 h-4 w-full max-w-xl rounded bg-slate-100" />
          </div>
        </section>

        <main className="px-5 py-8 sm:px-8">
          <div className="mx-auto max-w-5xl space-y-6">
            <div className="h-44 animate-pulse rounded-3xl bg-white" />

            <div className="h-80 animate-pulse rounded-3xl bg-white" />

            <div className="h-64 animate-pulse rounded-3xl bg-white" />
          </div>
        </main>
      </div>
    );
  }

  /* =====================================================
     LOGIN REQUIRED
  ====================================================== */

  if (error === "LOGIN_REQUIRED") {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-5">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{
              backgroundColor: `${SCHOOL_BLUE}08`,
              color: SCHOOL_BLUE,
            }}
          >
            <ShieldCheck size={25} />
          </div>

          <p
            className="mt-5 text-[10px] font-black uppercase tracking-[0.2em]"
            style={{
              color: SCHOOL_GOLD,
            }}
          >
            Settings
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
            Please sign in again to continue viewing your
            account settings.
          </p>

          <Link
            href="/student-login"
            className="mt-6 inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:shadow-md"
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

/* =====================================================
   ERROR STATE
====================================================== */

if (error || !student) {
  const isAuthError =
    error?.toLowerCase().includes("auth session missing") ||
    error?.toLowerCase().includes("not logged in") ||
    error?.toLowerCase().includes("session missing");

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-5">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">

        {/* ICON */}

        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: `${SCHOOL_BLUE}08`,
            color: SCHOOL_BLUE,
          }}
        >
          <AlertCircle size={25} />
        </div>

        {/* LABEL */}

        <p
          className="mt-5 text-[10px] font-black uppercase tracking-[0.2em]"
          style={{
            color: SCHOOL_GOLD,
          }}
        >
          {isAuthError ? "Login Required" : "Settings Error"}
        </p>

        {/* TITLE */}

        <h1
          className="mt-2 text-xl font-black"
          style={{
            color: SCHOOL_BLUE_DARK,
          }}
        >
          {isAuthError
            ? "Please sign in to continue"
            : "Unable to load settings"}
        </h1>

        {/* MESSAGE */}

        <p className="mt-3 text-sm leading-6 text-slate-500">
          {isAuthError
            ? "Please sign in again to continue viewing your account settings."
            : error ??
              "Your account settings could not be loaded."}
        </p>

        {/* SIGN IN */}

        <div className="mt-6">
          <Link
            href="/student-login"
            className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:shadow-md"
            style={{
              backgroundColor: SCHOOL_BLUE,
            }}
          >
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
}

  /* =====================================================
     PAGE
  ====================================================== */

  return (
    <div className="min-h-full bg-slate-50 text-slate-700">
      {/* =================================================
          HEADER
      ================================================== */}

      <section className="border-b border-slate-200 bg-white">
        <div className="px-5 py-7 sm:px-8 sm:py-9">
          <p
            className="text-[10px] font-black uppercase tracking-[0.22em]"
            style={{
              color: SCHOOL_GOLD,
            }}
          >
            Account
          </p>

          <h1
            className="mt-2 text-2xl font-black tracking-tight sm:text-3xl"
            style={{
              color: SCHOOL_BLUE_DARK,
            }}
          >
            Settings
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Manage your student account, notifications and
            security preferences.
          </p>
        </div>
      </section>

      {/* =================================================
          MAIN
      ================================================== */}

      <main className="px-5 py-7 sm:px-8 sm:py-9">
        <div className="mx-auto max-w-5xl space-y-6">

          {/* =================================================
              ALERT
          ================================================== */}

          {message && (
            <div
              className={`flex items-start gap-3 rounded-2xl border px-4 py-3.5 text-sm ${
                messageType === "success"
                  ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                  : "border-red-100 bg-red-50 text-red-600"
              }`}
            >
              {messageType === "success" ? (
                <Check
                  size={17}
                  className="mt-0.5 shrink-0"
                />
              ) : (
                <X
                  size={17}
                  className="mt-0.5 shrink-0"
                />
              )}

              <p>{message}</p>
            </div>
          )}

          {/* =================================================
              PROFILE
          ================================================== */}

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(1,0,102,0.035)]">
            <div className="p-6 sm:p-7">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                <div className="flex items-center gap-4">
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-white"
                    style={{
                      backgroundColor: SCHOOL_BLUE,
                    }}
                  >
                    {student.profile_photo ? (
                      <img
                        src={student.profile_photo}
                        alt={
                          student.full_name ??
                          "Student"
                        }
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserRound size={24} />
                    )}
                  </div>

                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
                      Student Account
                    </p>

                    <h2
                      className="mt-1 text-lg font-black"
                      style={{
                        color: SCHOOL_BLUE_DARK,
                      }}
                    >
                      {student.full_name ||
                        "Student"}
                    </h2>

                    <p className="mt-1 text-xs text-slate-400">
                      {student.admission_number
                        ? `Admission No. ${student.admission_number}`
                        : "Student account"}
                    </p>
                  </div>
                </div>

                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                  {student.status ??
                    "Active"}
                </span>
              </div>
            </div>

            {/* ACCOUNT INFORMATION */}

            <div className="grid border-t border-slate-100 sm:grid-cols-2">

              <InfoItem
                label="Email Address"
                value={
                  email ||
                  "Not available"
                }
                icon={<Mail size={17} />}
              />

              <InfoItem
                label="Student ID"
                value={
                  student.student_id ||
                  "Not available"
                }
                icon={<UserRound size={17} />}
              />

              <InfoItem
                label="Admission Number"
                value={
                  student.admission_number ||
                  "Not available"
                }
                icon={<ShieldCheck size={17} />}
              />

              <InfoItem
                label="Date of Birth"
                value={formatDate(
                  student.date_of_birth,
                )}
                icon={<UserRound size={17} />}
              />

              <InfoItem
                label="Phone"
                value={
                  student.phone ||
                  "Not available"
                }
                icon={<Mail size={17} />}
              />

              <InfoItem
                label="Guardian"
                value={
                  student.guardian_name ||
                  "Not available"
                }
                icon={<UserRound size={17} />}
              />

            </div>
          </section>

          {/* =================================================
              NOTIFICATIONS
          ================================================== */}

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(1,0,102,0.035)] sm:p-7">

            <div className="flex items-start gap-4">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: `${SCHOOL_BLUE}08`,
                  color: SCHOOL_BLUE,
                }}
              >
                <Bell size={19} />
              </div>

              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Preferences
                </p>

                <h2
                  className="mt-1 text-base font-black"
                  style={{
                    color: SCHOOL_BLUE_DARK,
                  }}
                >
                  Notifications
                </h2>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Choose the updates you want to receive.
                </p>
              </div>
            </div>

            <div className="mt-6 divide-y divide-slate-100">

              <SettingToggle
                icon={<Bell size={17} />}
                title="Assignment notifications"
                description="Receive updates when new assignments are posted."
                enabled={
                  assignmentNotifications
                }
                onChange={
                  setAssignmentNotifications
                }
              />

              <SettingToggle
                icon={<Check size={17} />}
                title="Grade notifications"
                description="Receive updates when assignments are graded."
                enabled={
                  gradeNotifications
                }
                onChange={
                  setGradeNotifications
                }
              />

              <SettingToggle
                icon={<Mail size={17} />}
                title="School announcements"
                description="Receive important academic and school announcements."
                enabled={
                  announcementNotifications
                }
                onChange={
                  setAnnouncementNotifications
                }
              />

            </div>
          </section>

          {/* =================================================
              SECURITY
          ================================================== */}

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(1,0,102,0.035)] sm:p-7">

            <div className="flex items-start gap-4">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: `${SCHOOL_BLUE}08`,
                  color: SCHOOL_BLUE,
                }}
              >
                <ShieldCheck size={19} />
              </div>

              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Protection
                </p>

                <h2
                  className="mt-1 text-base font-black"
                  style={{
                    color: SCHOOL_BLUE_DARK,
                  }}
                >
                  Security
                </h2>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Manage your account security.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">

              {/* CHANGE PASSWORD */}

              <button
                type="button"
                onClick={() =>
                  setShowPasswordModal(true)
                }
                className="group flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-[#010066]/15 hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition group-hover:bg-white">
                    <KeyRound size={17} />
                  </div>

                  <div>
                    <p className="text-xs font-black text-slate-700">
                      Change password
                    </p>

                    <p className="mt-0.5 text-[10px] text-slate-400">
                      Update your account password securely.
                    </p>
                  </div>

                </div>

                <ChevronRight
                  size={17}
                  className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500"
                />
              </button>

              {/* SECURITY INFO */}

              <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">

                <Eye
                  size={17}
                  className="mt-0.5 shrink-0 text-slate-400"
                />

                <div>
                  <p className="text-xs font-black text-slate-700">
                    Account security
                  </p>

                  <p className="mt-1 text-[10px] leading-5 text-slate-400">
                    Your account is protected by secure
                    authentication provided by the school portal.
                  </p>
                </div>

              </div>

            </div>
          </section>

          {/* =================================================
              SIGN OUT
          ================================================== */}

          <section className="rounded-3xl border border-red-100 bg-white p-6 shadow-[0_8px_30px_rgba(1,0,102,0.025)] sm:p-7">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-start gap-4">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500">
                  <LogOut size={19} />
                </div>

                <div>
                  <p className="text-xs font-black text-slate-700">
                    Sign out
                  </p>

                  <p className="mt-1 max-w-lg text-[10px] leading-5 text-slate-400">
                    Sign out of your student account on this device.
                  </p>
                </div>

              </div>

              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-5 py-3 text-xs font-black text-red-500 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {signingOut ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-300 border-t-red-500" />
                    Signing out...
                  </>
                ) : (
                  <>
                    <LogOut size={15} />
                    Sign Out
                  </>
                )}
              </button>

            </div>
          </section>

          {/* =================================================
              FOOTER
          ================================================== */}

          <div className="pb-5 text-center">
            <Link
              href="/student-dashboard"
              className="text-xs font-bold transition hover:opacity-70"
              style={{
                color: SCHOOL_BLUE,
              }}
            >
              Back to Student Dashboard
            </Link>
          </div>

        </div>
      </main>

      {/* ===================================================
          PASSWORD MODAL
      ==================================================== */}

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-5 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-7">

            <div className="flex items-start justify-between gap-4">

              <div>

                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: `${SCHOOL_BLUE}08`,
                    color: SCHOOL_BLUE,
                  }}
                >
                  <KeyRound size={19} />
                </div>

                <h2
                  className="mt-4 text-lg font-black"
                  style={{
                    color: SCHOOL_BLUE_DARK,
                  }}
                >
                  Change password
                </h2>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Enter your current password and choose a new one.
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowPasswordModal(false)
                }
                disabled={changingPassword}
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={17} />
              </button>

            </div>

            {/* PASSWORD FIELDS */}

            <div className="mt-6 space-y-4">

              <PasswordField
                label="Current password"
                value={currentPassword}
                onChange={
                  setCurrentPassword
                }
              />

              <PasswordField
                label="New password"
                value={newPassword}
                onChange={
                  setNewPassword
                }
              />

              <PasswordField
                label="Confirm new password"
                value={confirmPassword}
                onChange={
                  setConfirmPassword
                }
              />

            </div>

            {/* ACTIONS */}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={() => {
                  setShowPasswordModal(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                disabled={changingPassword}
                className="rounded-xl border border-slate-200 px-5 py-3 text-xs font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-xs font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  backgroundColor: SCHOOL_BLUE,
                }}
              >
                {changingPassword ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Updating...
                  </>
                ) : (
                  <>
                    <KeyRound size={15} />
                    Update Password
                  </>
                )}
              </button>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}

/* =====================================================
   INFO ITEM
====================================================== */

function InfoItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-slate-100 p-5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </p>

        <p className="mt-1 break-words text-xs font-bold text-slate-700">
          {value}
        </p>
      </div>
    </div>
  );
}

/* =====================================================
   PASSWORD FIELD
====================================================== */

function PasswordField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-slate-600">
        {label}
      </span>

      <input
        type="password"
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        autoComplete="current-password"
        className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#010066]/25 focus:bg-white focus:ring-4 focus:ring-[#010066]/5"
        placeholder="••••••••"
      />
    </label>
  );
}

/* =====================================================
   TOGGLE COMPONENT
====================================================== */

function SettingToggle({
  icon,
  title,
  description,
  enabled,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-5 py-5 first:pt-0 last:pb-0">

      <div className="flex min-w-0 items-start gap-3">

        <div
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{
            backgroundColor: `${SCHOOL_BLUE}06`,
            color: SCHOOL_BLUE,
          }}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-xs font-black text-slate-700">
            {title}
          </p>

          <p className="mt-1 text-[10px] leading-5 text-slate-400">
            {description}
          </p>
        </div>

      </div>

      <button
        type="button"
        aria-label={`Toggle ${title}`}
        aria-pressed={enabled}
        onClick={() => onChange(!enabled)}
        className="relative h-6 w-11 shrink-0 rounded-full transition"
        style={{
          backgroundColor: enabled
            ? SCHOOL_BLUE
            : "#CBD5E1",
        }}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
            enabled
              ? "left-6"
              : "left-1"
          }`}
        />
      </button>

    </div>
  );
}