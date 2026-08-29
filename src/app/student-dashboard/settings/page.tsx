"use client";

import {
  Bell,
  Check,
  ChevronRight,
  Eye,
  KeyRound,
  LogOut,
  Mail,
  Moon,
  ShieldCheck,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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

type Appearance = "light" | "dark";

export default function StudentSettingsPage() {
  const router = useRouter();

  const supabase = useMemo(() => createClient(), []);

  const [student, setStudent] = useState<Student | null>(null);
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(true);

  const [assignmentNotifications, setAssignmentNotifications] =
    useState(true);

  const [gradeNotifications, setGradeNotifications] =
    useState(true);

  const [announcementNotifications, setAnnouncementNotifications] =
    useState(true);

  const [appearance, setAppearance] =
    useState<Appearance>("light");

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
     APPLY APPEARANCE
  ====================================================== */

  const applyAppearance = (
    theme: Appearance,
  ) => {
    setAppearance(theme);

    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle(
        "dark",
        theme === "dark",
      );

      localStorage.setItem(
        "student-portal-appearance",
        theme,
      );
    }
  };

  /* =====================================================
     LOAD STUDENT
  ====================================================== */

  useEffect(() => {
    const loadStudent = async () => {
      try {
        setLoading(true);

        /* -----------------------------------------------
           LOAD SAVED APPEARANCE
        ------------------------------------------------ */

        const savedAppearance =
          localStorage.getItem(
            "student-portal-appearance",
          ) as Appearance | null;

        if (
          savedAppearance === "light" ||
          savedAppearance === "dark"
        ) {
          setAppearance(savedAppearance);

          document.documentElement.classList.toggle(
            "dark",
            savedAppearance === "dark",
          );
        }

        /* -----------------------------------------------
           GET USER
        ------------------------------------------------ */

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          throw new Error(authError.message);
        }

        if (!user) {
          router.replace("/login");
          return;
        }

        setEmail(user.email ?? "");

        /* -----------------------------------------------
           GET STUDENT
        ------------------------------------------------ */

        const { data, error } = await supabase
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

        if (error) {
          throw new Error(
            `Unable to load student profile: ${error.message}`,
          );
        }

        setStudent(data ?? null);
      } catch (error) {
        console.error(
          "Settings load error:",
          error,
        );

        showMessage(
          error instanceof Error
            ? error.message
            : "Unable to load your account.",
          "error",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadStudent();
  }, [router, supabase]);

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
         VERIFY CURRENT PASSWORD
      ------------------------------------------------ */

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        throw new Error(
          "Your authenticated account could not be found.",
        );
      }

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
          updateError.message,
        );
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setShowPasswordModal(false);

      showMessage(
        "Your password has been changed successfully.",
      );
    } catch (error) {
      console.error(
        "Password change error:",
        error,
      );

      showMessage(
        error instanceof Error
          ? error.message
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

      const { error } =
        await supabase.auth.signOut();

      if (error) {
        throw new Error(error.message);
      }

      /*
       * Force browser navigation.
       * This ensures the protected student portal
       * is completely left after logout.
       */

      window.location.replace("/student-login");
    } catch (error) {
      console.error(
        "Sign out error:",
        error,
      );

      setSigningOut(false);

      showMessage(
        error instanceof Error
          ? error.message
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

    return new Intl.DateTimeFormat(
      "en-GB",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      },
    ).format(new Date(date));
  };

  /* =====================================================
     LOADING
  ====================================================== */

  if (loading) {
    return (
      <div className="min-h-full bg-slate-50 dark:bg-slate-950">
        <section className="border-b border-slate-200 bg-white px-5 py-8 dark:border-slate-800 dark:bg-slate-900 sm:px-8">
          <div className="animate-pulse">
            <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-700" />

            <div className="mt-4 h-9 w-48 rounded bg-slate-200 dark:bg-slate-700" />

            <div className="mt-3 h-4 w-full max-w-xl rounded bg-slate-100 dark:bg-slate-800" />
          </div>
        </section>

        <main className="px-5 py-8 sm:px-8">
          <div className="mx-auto max-w-5xl space-y-6">
            <div className="h-44 animate-pulse rounded-3xl bg-white dark:bg-slate-900" />

            <div className="h-80 animate-pulse rounded-3xl bg-white dark:bg-slate-900" />

            <div className="h-64 animate-pulse rounded-3xl bg-white dark:bg-slate-900" />
          </div>
        </main>
      </div>
    );
  }

  /* =====================================================
     PAGE
  ====================================================== */

  return (
    <div className="min-h-full bg-slate-50 text-slate-700 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-200">
      {/* =================================================
          HEADER
      ================================================== */}

      <section className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
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

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Manage your student account, notifications,
            security and preferences.
          </p>
        </div>
      </section>

      {/* =================================================
          MAIN
      ================================================== */}

      <main className="px-5 py-7 sm:px-8 sm:py-9">
        <div className="mx-auto max-w-5xl space-y-6">

          {/* ALERT */}

          {message && (
            <div
              className={`flex items-start gap-3 rounded-2xl border px-4 py-3.5 text-sm ${
                messageType === "success"
                  ? "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "border-red-100 bg-red-50 text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
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

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(1,0,102,0.035)] dark:border-slate-800 dark:bg-slate-900">
            <div className="p-6 sm:p-7">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                <div className="flex items-center gap-4">
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-white"
                    style={{
                      backgroundColor: SCHOOL_BLUE,
                    }}
                  >
                    {student?.profile_photo ? (
                      <img
                        src={student.profile_photo}
                        alt={student.full_name ?? "Student"}
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
                      className="mt-1 text-lg font-black dark:text-white"
                      style={{
                        color: SCHOOL_BLUE_DARK,
                      }}
                    >
                      {student?.full_name ||
                        "Student"}
                    </h2>

                    <p className="mt-1 text-xs text-slate-400">
                      {student?.admission_number
                        ? `Admission No. ${student.admission_number}`
                        : "Student account"}
                    </p>
                  </div>
                </div>

                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                  {student?.status ??
                    "Active"}
                </span>
              </div>
            </div>

            {/* ACCOUNT INFORMATION */}

            <div className="grid border-t border-slate-100 dark:border-slate-800 sm:grid-cols-2">

              <InfoItem
                label="Email Address"
                value={email || "Not available"}
                icon={<Mail size={17} />}
              />

              <InfoItem
                label="Student ID"
                value={
                  student?.student_id ||
                  "Not available"
                }
                icon={<UserRound size={17} />}
              />

              <InfoItem
                label="Admission Number"
                value={
                  student?.admission_number ||
                  "Not available"
                }
                icon={<ShieldCheck size={17} />}
              />

              <InfoItem
                label="Date of Birth"
                value={formatDate(
                  student?.date_of_birth ?? null,
                )}
                icon={<UserRound size={17} />}
              />

              <InfoItem
                label="Phone"
                value={
                  student?.phone ||
                  "Not available"
                }
                icon={<Mail size={17} />}
              />

              <InfoItem
                label="Guardian"
                value={
                  student?.guardian_name ||
                  "Not available"
                }
                icon={<UserRound size={17} />}
              />

            </div>
          </section>

          {/* =================================================
              NOTIFICATIONS
          ================================================== */}

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(1,0,102,0.035)] dark:border-slate-800 dark:bg-slate-900 sm:p-7">
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
                  className="mt-1 text-base font-black dark:text-white"
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

            <div className="mt-6 divide-y divide-slate-100 dark:divide-slate-800">

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
              APPEARANCE
          ================================================== */}

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(1,0,102,0.035)] dark:border-slate-800 dark:bg-slate-900 sm:p-7">
            <div className="flex items-start gap-4">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: `${SCHOOL_GOLD}15`,
                  color: SCHOOL_GOLD,
                }}
              >
                {appearance === "light" ? (
                  <Sun size={19} />
                ) : (
                  <Moon size={19} />
                )}
              </div>

              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Interface
                </p>

                <h2
                  className="mt-1 text-base font-black dark:text-white"
                  style={{
                    color: SCHOOL_BLUE_DARK,
                  }}
                >
                  Appearance
                </h2>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Choose how the student portal looks.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">

              <AppearanceButton
                icon={<Sun size={18} />}
                title="Light"
                description="Clean and bright"
                active={
                  appearance === "light"
                }
                onClick={() =>
                  applyAppearance("light")
                }
              />

              <AppearanceButton
                icon={<Moon size={18} />}
                title="Dark"
                description="Easier on the eyes"
                active={
                  appearance === "dark"
                }
                onClick={() =>
                  applyAppearance("dark")
                }
              />

            </div>
          </section>

          {/* =================================================
              SECURITY
          ================================================== */}

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(1,0,102,0.035)] dark:border-slate-800 dark:bg-slate-900 sm:p-7">
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
                  className="mt-1 text-base font-black dark:text-white"
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

              <button
                type="button"
                onClick={() =>
                  setShowPasswordModal(true)
                }
                className="group flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-[#010066]/15 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition group-hover:bg-white dark:bg-slate-800 dark:text-slate-300">
                    <KeyRound size={17} />
                  </div>

                  <div>
                    <p className="text-xs font-black text-slate-700 dark:text-white">
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

              <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                <Eye
                  size={17}
                  className="mt-0.5 shrink-0 text-slate-400"
                />

                <div>
                  <p className="text-xs font-black text-slate-700 dark:text-white">
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

          <section className="rounded-3xl border border-red-100 bg-white p-6 shadow-[0_8px_30px_rgba(1,0,102,0.025)] dark:border-red-950/50 dark:bg-slate-900 sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500 dark:bg-red-950/40">
                  <LogOut size={19} />
                </div>

                <div>
                  <p className="text-xs font-black text-slate-700 dark:text-white">
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
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-5 py-3 text-xs font-black text-red-500 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/50 dark:bg-red-950/40"
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

          {/* FOOTER */}

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

          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:p-7">

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
                  className="mt-4 text-lg font-black dark:text-white"
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
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X size={17} />
              </button>

            </div>

            <div className="mt-6 space-y-4">

              <PasswordField
                label="Current password"
                value={currentPassword}
                onChange={setCurrentPassword}
              />

              <PasswordField
                label="New password"
                value={newPassword}
                onChange={setNewPassword}
              />

              <PasswordField
                label="Confirm new password"
                value={confirmPassword}
                onChange={setConfirmPassword}
              />

            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={() =>
                  setShowPasswordModal(false)
                }
                disabled={changingPassword}
                className="rounded-xl border border-slate-200 px-5 py-3 text-xs font-black text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
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
    <div className="flex items-start gap-3 border-b border-slate-100 p-5 last:border-b-0 dark:border-slate-800">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-400 dark:bg-slate-800">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </p>

        <p className="mt-1 break-words text-xs font-bold text-slate-700 dark:text-slate-200">
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
      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
        {label}
      </span>

      <input
        type="password"
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        autoComplete="current-password"
        className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#010066]/25 focus:bg-white focus:ring-4 focus:ring-[#010066]/5 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800"
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
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-400 dark:bg-slate-800">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-xs font-black text-slate-700 dark:text-slate-200">
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

/* =====================================================
   APPEARANCE BUTTON
====================================================== */

function AppearanceButton({
  icon,
  title,
  description,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-between rounded-2xl border p-4 text-left transition"
      style={{
        borderColor: active
          ? `${SCHOOL_BLUE}30`
          : "#E2E8F0",
        backgroundColor: active
          ? `${SCHOOL_BLUE}06`
          : "#FFFFFF",
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{
            backgroundColor: active
              ? `${SCHOOL_BLUE}10`
              : "#F8FAFC",
            color: active
              ? SCHOOL_BLUE
              : "#94A3B8",
          }}
        >
          {icon}
        </div>

        <div>
          <p className="text-xs font-black text-slate-700">
            {title}
          </p>

          <p className="mt-0.5 text-[10px] text-slate-400">
            {description}
          </p>
        </div>
      </div>

      {active && (
        <div
          className="flex h-6 w-6 items-center justify-center rounded-full text-white"
          style={{
            backgroundColor: SCHOOL_BLUE,
          }}
        >
          <Check size={13} />
        </div>
      )}
    </button>
  );
}