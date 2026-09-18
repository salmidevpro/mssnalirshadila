"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Loader2,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import {
  SCHOOL_BLUE,
  SCHOOL_BLUE_DARK,
  SCHOOL_GOLD,
  siteConfig,
} from "@/config/site"

export default function StaffResetPasswordPage() {
  const supabase = createClient();

  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [recoveryValid, setRecoveryValid] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isUpdating, setIsUpdating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkRecoverySession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          setRecoveryValid(false);
          setError(
            "This password reset link is invalid or has expired. Please request a new one.",
          );
          return;
        }

        setRecoveryValid(true);
      } catch (err) {
        console.error("Recovery session check error:", err);

        setRecoveryValid(false);
        setError(
          "We could not verify your password reset session. Please request a new reset link.",
        );
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkRecoverySession();
  }, [supabase.auth]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");

    if (!recoveryValid) {
      setError(
        "Your password reset session is invalid or has expired. Please request a new reset link.",
      );
      return;
    }

    if (newPassword.length < 8) {
      setError("Your new password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setIsUpdating(true);

    try {
      // Confirm the recovery session is still valid
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        throw new Error(
          "Your password reset session has expired. Please request a new reset link.",
        );
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);

      // End the recovery session after the password has been changed.
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Password reset error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "We could not update your password. Please try again.",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6"
      style={{
        background:
          "linear-gradient(135deg, #f8fafc 0%, #eef4ff 50%, #fffdf5 100%)",
      }}
    >
      {/* Decorative background */}
      <div
        className="pointer-events-none absolute -left-32 -top-32 h-72 w-72 rounded-full opacity-20 blur-3xl"
        style={{ backgroundColor: SCHOOL_BLUE }}
      />

      <div
        className="pointer-events-none absolute -bottom-32 -right-32 h-72 w-72 rounded-full opacity-20 blur-3xl"
        style={{ backgroundColor: SCHOOL_GOLD }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="mb-7 flex justify-center">
          <Link href="/staff-login" aria-label="Back to staff login">
            <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-slate-200">
              <Image
                src="/images/al-ishad-logo.jpeg"
                alt={`${siteConfig.name} logo`}
                fill
                className="object-contain p-2"
                priority
              />
            </div>
          </Link>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">
          {isCheckingSession ? (
            <div className="flex min-h-75 flex-col items-center justify-center text-center">
              <Loader2
                className="mb-4 h-8 w-8 animate-spin"
                style={{ color: SCHOOL_BLUE }}
              />

              <h1 className="text-lg font-bold text-slate-900">
                Verifying reset link
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Please wait while we securely verify your password reset
                session.
              </p>
            </div>
          ) : success ? (
            <div className="py-6 text-center">
              <div
                className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full"
                style={{
                  backgroundColor: `${SCHOOL_BLUE}12`,
                }}
              >
                <CheckCircle2
                  className="h-8 w-8"
                  style={{ color: SCHOOL_BLUE }}
                />
              </div>

              <h1 className="text-2xl font-bold text-slate-900">
                Password updated
              </h1>

              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">
                Your staff account password has been changed successfully.
                You can now sign in using your new password.
              </p>

              <Link
                href="/staff-login"
                className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                style={{
                  backgroundColor: SCHOOL_BLUE,
                }}
              >
                Continue to Staff Login
              </Link>
            </div>
          ) : !recoveryValid ? (
            <div className="py-6 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>

              <h1 className="text-2xl font-bold text-slate-900">
                Reset link unavailable
              </h1>

              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">
                {error ||
                  "This password reset link is invalid or has expired."}
              </p>

              <Link
                href="/staff-login/staff/forgot-password"
                className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                style={{
                  backgroundColor: SCHOOL_BLUE,
                }}
              >
                Request a New Reset Link
              </Link>

              <Link
                href="/staff-login"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:underline"
                style={{
                  color: SCHOOL_BLUE_DARK,
                }}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Staff Login
              </Link>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="mb-7 text-center">
                <div
                  className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{
                    backgroundColor: `${SCHOOL_BLUE}12`,
                  }}
                >
                  <LockKeyhole
                    className="h-7 w-7"
                    style={{ color: SCHOOL_BLUE }}
                  />
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Create a new password
                </h1>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Choose a strong password for your staff account.
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

                  <p className="text-sm leading-5 text-red-700">{error}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* New password */}
                <div>
                  <label
                    htmlFor="new-password"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    New password
                  </label>

                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                    <input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(event) =>
                        setNewPassword(event.target.value)
                      }
                      placeholder="Enter your new password"
                      autoComplete="new-password"
                      disabled={isUpdating}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-12 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-transparent focus:bg-white focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
                      style={{
                        ["--tw-ring-color" as string]: SCHOOL_BLUE,
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      disabled={isUpdating}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700 disabled:cursor-not-allowed"
                      aria-label={
                        showPassword
                          ? "Hide new password"
                          : "Show new password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  <p className="mt-2 text-xs text-slate-400">
                    Password must be at least 8 characters.
                  </p>
                </div>

                {/* Confirm password */}
                <div>
                  <label
                    htmlFor="confirm-password"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Confirm new password
                  </label>

                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      placeholder="Confirm your new password"
                      autoComplete="new-password"
                      disabled={isUpdating}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-12 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-transparent focus:bg-white focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
                      style={{
                        ["--tw-ring-color" as string]: SCHOOL_BLUE,
                      }}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword((current) => !current)
                      }
                      disabled={isUpdating}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700 disabled:cursor-not-allowed"
                      aria-label={
                        showConfirmPassword
                          ? "Hide password confirmation"
                          : "Show password confirmation"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                  style={{
                    backgroundColor: SCHOOL_BLUE,
                  }}
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Updating password...
                    </>
                  ) : (
                    <>
                      <LockKeyhole className="h-5 w-5" />
                      Update Password
                    </>
                  )}
                </button>
              </form>

              {/* Back */}
              <div className="mt-6 text-center">
                <Link
                  href="/staff-login"
                  className="inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:underline"
                  style={{
                    color: SCHOOL_BLUE_DARK,
                  }}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Staff Login
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
        </p>
      </motion.div>
    </main>
  );
}