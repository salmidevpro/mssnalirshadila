"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { motion } from "motion/react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Mail,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import {
  SCHOOL_BLUE,
  SCHOOL_BLUE_DARK,
  SCHOOL_GOLD,
  siteConfig,
} from "@/config/site"

export default function StaffForgotPasswordPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");

    const emailValue = email.trim().toLowerCase();

    if (!emailValue) {
      setError("Please enter your email address.");
      return;
    }

    if (!emailValue.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);

    try {
      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(emailValue, {
          redirectTo: `${window.location.origin}/staff/reset-password`,
        });

      if (resetError) {
        throw resetError;
      }

      /*
       * Always show the same success message.
       *
       * This prevents account enumeration because we do not tell
       * the user whether the email exists in Supabase Auth.
       */
      setSuccess(true);
    } catch (err) {
      console.error("Staff password reset request error:", err);

      /*
       * We still avoid exposing whether the email belongs to an
       * existing staff account.
       */
      setSuccess(true);
    } finally {
      setIsLoading(false);
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
        style={{
          backgroundColor: SCHOOL_BLUE,
        }}
      />

      <div
        className="pointer-events-none absolute -bottom-32 -right-32 h-72 w-72 rounded-full opacity-20 blur-3xl"
        style={{
          backgroundColor: SCHOOL_GOLD,
        }}
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
          {success ? (
            <div className="py-6 text-center">
              {/* Success icon */}
              <div
                className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full"
                style={{
                  backgroundColor: `${SCHOOL_BLUE}12`,
                }}
              >
                <CheckCircle2
                  className="h-8 w-8"
                  style={{
                    color: SCHOOL_BLUE,
                  }}
                />
              </div>

              <h1 className="text-2xl font-bold text-slate-900">
                Check your email
              </h1>

              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">
                If the email address is associated with a staff account,
                you&apos;ll receive a secure password reset link shortly.
              </p>

              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Email address
                </p>

                <p className="mt-1 break-all text-sm font-semibold text-slate-700">
                  {email}
                </p>
              </div>

              <p className="mt-5 text-xs leading-5 text-slate-400">
                Check your spam or junk folder if you don&apos;t see the email.
              </p>

              <Link
                href="/staff-login"
                className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                style={{
                  backgroundColor: SCHOOL_BLUE,
                }}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Staff Login
              </Link>

              <button
                type="button"
                onClick={() => {
                  setSuccess(false);
                  setError("");
                }}
                className="mt-4 text-sm font-semibold transition-colors hover:underline"
                style={{
                  color: SCHOOL_BLUE_DARK,
                }}
              >
                Try another email
              </button>
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
                  <Mail
                    className="h-7 w-7"
                    style={{
                      color: SCHOOL_BLUE,
                    }}
                  />
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Forgot your password?
                </h1>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Enter your staff email address and we&apos;ll send you a
                  secure link to create a new password.
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
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Staff email address
                  </label>

                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="Enter your staff email"
                      autoComplete="email"
                      autoFocus
                      disabled={isLoading}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-transparent focus:bg-white focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
                      style={{
                        ["--tw-ring-color" as string]: SCHOOL_BLUE,
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                  style={{
                    backgroundColor: SCHOOL_BLUE,
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Sending reset link...
                    </>
                  ) : (
                    <>
                      <Mail className="h-5 w-5" />
                      Send Reset Link
                    </>
                  )}
                </button>
              </form>

              {/* Back to login */}
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