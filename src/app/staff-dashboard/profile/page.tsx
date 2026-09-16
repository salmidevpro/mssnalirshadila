"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertCircle,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Save,
  Settings,
  Upload,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SCHOOL_BLUE, SCHOOL_GOLD } from "@/config/site";

type Staff = {
  id: string;
  user_id: string;
  staff_id: string;
  department: string | null;
  position: string | null;
  status: string;
};

type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  middle_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
};

const MAX_FILE_SIZE = 500 * 1024;

const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const navigation = [
  {
    label: "Dashboard",
    href: "/staff-dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "My Classes",
    href: "/staff-dashboard/classes",
    icon: GraduationCap,
  },
  {
    label: "My Courses",
    href: "/staff-dashboard/courses",
    icon: BookOpen,
  },
  {
    label: "Assignments",
    href: "/staff-dashboard/assignments",
    icon: FileText,
  },
  {
    label: "Results",
    href: "/staff-dashboard/results",
    icon: ClipboardCheck,
  },
  {
    label: "Attendance",
    href: "/staff-dashboard/attendance",
    icon: CheckCircle2,
  },
  {
    label: "Students",
    href: "/staff-dashboard/students",
    icon: Users,
  },
  {
    label: "Academic Calendar",
    href: "/staff-dashboard/calendar",
    icon: CalendarDays,
  },
];

const secondaryNavigation = [
  {
    label: "Profile",
    href: "/staff-dashboard/profile",
    icon: UserRound,
  },
  {
    label: "Settings",
    href: "/staff-dashboard/settings",
    icon: Settings,
  },
];

export default function StaffProfilePage() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [staff, setStaff] = useState<Staff | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  const activeNavigation = [
    ...navigation,
    ...secondaryNavigation,
  ];

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw new Error(authError.message);
      }

      if (!user) {
        router.replace("/staff-login");
        return;
      }

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
        .maybeSingle();

      if (staffError) {
        throw new Error(staffError.message);
      }

      if (!staffData) {
        throw new Error("Staff record not found.");
      }

      if (staffData.status !== "active") {
        throw new Error("Your staff account is not active.");
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select(`
          id,
          first_name,
          last_name,
          middle_name,
          email,
          phone,
          avatar_url
        `)
        .eq("id", staffData.user_id)
        .maybeSingle();

      if (profileError) {
        throw new Error(profileError.message);
      }

      if (!profileData) {
        throw new Error("Profile record not found.");
      }

      setStaff(staffData);
      setProfile(profileData);

      setFirstName(profileData.first_name ?? "");
      setMiddleName(profileData.middle_name ?? "");
      setLastName(profileData.last_name ?? "");
      setPhone(profileData.phone ?? "");
    } catch (err) {
      console.error("Profile loading error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your profile."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleImageSelect(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file || !staff || !profile) {
      return;
    }

    setError("");
    setSuccess("");

    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setError(
        "Invalid image type. Please upload a JPEG, PNG, or WebP image."
      );

      event.target.value = "";
      return;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setError(
        `Image is too large. Maximum allowed size is 500 KB. Your image is ${(
          file.size / 1024
        ).toFixed(0)} KB.`
      );

      event.target.value = "";
      return;
    }

    try {
      setUploadingImage(true);

      /*
       * Each staff member gets their own folder.
       *
       * Example:
       * staff-user-id/profile.jpg
       */
      const filePath = `${staff.user_id}/profile-${Date.now()}.${getFileExtension(
        file.type
      )}`;

      // Upload new image
      const { error: uploadError } = await supabase.storage
        .from("staff-profiles")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage
        .from("staff-profiles")
        .getPublicUrl(filePath);

      // Update profile avatar_url
      const { data: updatedProfile, error: updateError } =
        await supabase
          .from("profiles")
          .update({
            avatar_url: publicUrl,
          })
          .eq("id", profile.id)
          .select(`
            id,
            first_name,
            last_name,
            middle_name,
            email,
            phone,
            avatar_url
          `)
          .single();

      if (updateError) {
        // If database update fails, remove uploaded image
        await supabase.storage
          .from("staff-profiles")
          .remove([filePath]);

        throw new Error(updateError.message);
      }

      setProfile(updatedProfile);
      setSuccess("Profile image updated successfully.");

      // Reset file input so the same file can be selected again
      event.target.value = "";
    } catch (err) {
      console.error("Image upload error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to upload your profile image."
      );
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSaveProfile(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!profile) {
      return;
    }

    setError("");
    setSuccess("");

    if (!firstName.trim()) {
      setError("First name is required.");
      return;
    }

    if (!lastName.trim()) {
      setError("Last name is required.");
      return;
    }

    try {
      setSaving(true);

      const { data: updatedProfile, error: updateError } =
        await supabase
          .from("profiles")
          .update({
            first_name: firstName.trim(),
            middle_name: middleName.trim() || null,
            last_name: lastName.trim(),
            phone: phone.trim() || null,
          })
          .eq("id", profile.id)
          .select(`
            id,
            first_name,
            last_name,
            middle_name,
            email,
            phone,
            avatar_url
          `)
          .single();

      if (updateError) {
        throw new Error(updateError.message);
      }

      setProfile(updatedProfile);

      setFirstName(updatedProfile.first_name ?? "");
      setMiddleName(updatedProfile.middle_name ?? "");
      setLastName(updatedProfile.last_name ?? "");
      setPhone(updatedProfile.phone ?? "");

      setSuccess("Profile updated successfully.");
    } catch (err) {
      console.error("Profile update error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update your profile."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    try {
      setLoggingOut(true);

      await supabase.auth.signOut();

      router.replace("/staff-login");
    } catch (err) {
      console.error("Logout error:", err);
      setLoggingOut(false);
    }
  }

  function getFileExtension(type: string) {
    switch (type) {
      case "image/jpeg":
        return "jpg";
      case "image/png":
        return "png";
      case "image/webp":
        return "webp";
      default:
        return "jpg";
    }
  }

  const staffName = [
    profile?.first_name,
    profile?.middle_name,
    profile?.last_name,
  ]
    .filter(Boolean)
    .join(" ") || "Staff Member";

  const firstInitial = profile?.first_name?.charAt(0) ?? "";
  const lastInitial = profile?.last_name?.charAt(0) ?? "";

  const initials =
    `${firstInitial}${lastInitial}`.toUpperCase() || "ST";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="animate-spin" size={22} />
          <span className="font-medium">
            Loading your profile...
          </span>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
            <AlertCircle size={24} />
          </div>

          <h1 className="text-xl font-bold text-slate-900">
            Unable to load profile
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {error}
          </p>

          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-xl px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: SCHOOL_BLUE }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile backdrop */}
      {isMobileMenuOpen && (
        <button
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[270px] transform bg-white shadow-xl transition-transform duration-300 lg:translate-x-0 lg:shadow-none ${
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col border-r border-slate-200">
          {/* Logo */}
          <div className="flex h-[82px] items-center gap-3 border-b border-slate-100 px-5">
            <img
              src="/images/al-ishad-logo.jpeg"
              alt="Al-Irshad Model School"
              className="h-11 w-11 rounded-xl object-cover"
            />

            <div className="min-w-0">
              <p
                className="truncate text-sm font-extrabold"
                style={{ color: SCHOOL_BLUE }}
              >
                Al-Irshad Model School
              </p>

              <p className="text-xs text-slate-500">
                Staff Portal
              </p>
            </div>

            <button
              className="ml-auto rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto px-4 py-5">
            <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Main Menu
            </p>

            <nav className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;

                const active =
                  pathname === item.href ||
                  (item.href !== "/staff-dashboard" &&
                    pathname.startsWith(`${item.href}/`));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() =>
                      setIsMobileMenuOpen(false)
                    }
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                      active
                        ? "text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                    style={
                      active
                        ? {
                            backgroundColor: SCHOOL_BLUE,
                          }
                        : undefined
                    }
                  >
                    <Icon size={19} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="my-6 h-px bg-slate-100" />

            <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Account
            </p>

            <nav className="space-y-1">
              {secondaryNavigation.map((item) => {
                const Icon = item.icon;

                const active =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() =>
                      setIsMobileMenuOpen(false)
                    }
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                      active
                        ? "text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                    style={
                      active
                        ? {
                            backgroundColor: SCHOOL_BLUE,
                          }
                        : undefined
                    }
                  >
                    <Icon size={19} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User */}
          <div className="border-t border-slate-100 p-4">
            <div className="flex items-center gap-3">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={staffName}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{
                    backgroundColor: SCHOOL_BLUE,
                  }}
                >
                  {initials}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900">
                  {staffName}
                </p>

                <p className="truncate text-xs text-slate-500">
                  {staff?.position || "Staff"}
                </p>
              </div>

              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                title="Logout"
              >
                {loggingOut ? (
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                ) : (
                  <LogOut size={18} />
                )}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:pl-[270px]">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-[82px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="rounded-xl border border-slate-200 p-2.5 text-slate-600 lg:hidden"
            >
              <Menu size={21} />
            </button>

            <div>
              <p className="text-sm font-medium text-slate-500">
                Staff Portal
              </p>

              <h1 className="text-xl font-extrabold text-slate-900">
                My Profile
              </h1>
            </div>
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <button
              className="relative rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:bg-slate-50"
              title="Notifications"
            >
              <Bell size={19} />

              <span
                className="absolute right-2 top-2 h-2 w-2 rounded-full"
                style={{ backgroundColor: SCHOOL_GOLD }}
              />
            </button>

            <div className="h-8 w-px bg-slate-200" />

            <div className="flex items-center gap-3">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={staffName}
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{
                    backgroundColor: SCHOOL_BLUE,
                  }}
                >
                  {initials}
                </div>
              )}

              <div className="hidden text-right md:block">
                <p className="text-sm font-bold text-slate-900">
                  {staffName}
                </p>

                <p className="text-xs text-slate-500">
                  {staff?.staff_id}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Page heading */}
          <div className="mb-6">
            <h2 className="text-2xl font-extrabold text-slate-900">
              Profile Information
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage your staff profile information and profile
              photo.
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle
                size={19}
                className="mt-0.5 shrink-0"
              />

              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CheckCircle2
                size={19}
                className="mt-0.5 shrink-0"
              />

              <span>{success}</span>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
            {/* Profile photo card */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-center">
                <div className="relative mx-auto h-32 w-32">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={staffName}
                      className="h-32 w-32 rounded-full border-4 border-white object-cover shadow-md ring-1 ring-slate-200"
                    />
                  ) : (
                    <div
                      className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-white text-3xl font-extrabold text-white shadow-md ring-1 ring-slate-200"
                      style={{
                        backgroundColor: SCHOOL_BLUE,
                      }}
                    >
                      {initials}
                    </div>
                  )}

                  {uploadingImage && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-slate-900/60 text-white">
                      <Loader2
                        size={28}
                        className="animate-spin"
                      />
                    </div>
                  )}
                </div>

                <h3 className="mt-5 text-lg font-extrabold text-slate-900">
                  {staffName}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {staff?.position || "Staff Member"}
                </p>

                <p className="mt-1 text-xs font-semibold text-slate-400">
                  {staff?.staff_id}
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleImageSelect}
                />

                <button
                  type="button"
                  disabled={uploadingImage}
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    backgroundColor: SCHOOL_BLUE,
                  }}
                >
                  {uploadingImage ? (
                    <>
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      {profile?.avatar_url
                        ? "Change Photo"
                        : "Upload Photo"}
                    </>
                  )}
                </button>

                <p className="mt-3 text-xs leading-5 text-slate-400">
                  JPEG, PNG or WebP
                  <br />
                  Maximum file size: 500 KB
                </p>
              </div>
            </section>

            {/* Profile information */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
              <div className="mb-6">
                <h3 className="text-lg font-extrabold text-slate-900">
                  Personal Information
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Update the information associated with your
                  staff account.
                </p>
              </div>

              <form
                onSubmit={handleSaveProfile}
                className="space-y-5"
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      First Name
                    </label>

                    <input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(event) =>
                        setFirstName(event.target.value)
                      }
                      placeholder="First name"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="middleName"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Middle Name
                    </label>

                    <input
                      id="middleName"
                      type="text"
                      value={middleName}
                      onChange={(event) =>
                        setMiddleName(event.target.value)
                      }
                      placeholder="Middle name (optional)"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="lastName"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Last Name
                  </label>

                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(event) =>
                      setLastName(event.target.value)
                    }
                    placeholder="Last name"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Phone Number
                  </label>

                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(event) =>
                      setPhone(event.target.value)
                    }
                    placeholder="Phone number"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div className="grid gap-5 border-t border-slate-100 pt-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Email Address
                    </label>

                    <input
                      id="email"
                      type="email"
                      value={profile?.email ?? ""}
                      disabled
                      className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 outline-none"
                    />

                    <p className="mt-1.5 text-xs text-slate-400">
                      Email cannot be changed here.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="staffId"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Staff ID
                    </label>

                    <input
                      id="staffId"
                      type="text"
                      value={staff?.staff_id ?? ""}
                      disabled
                      className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 outline-none"
                    />

                    <p className="mt-1.5 text-xs text-slate-400">
                      Staff ID is managed by the school.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end border-t border-slate-100 pt-5">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    style={{
                      backgroundColor: SCHOOL_BLUE,
                    }}
                  >
                    {saving ? (
                      <>
                        <Loader2
                          size={18}
                          className="animate-spin"
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </section>
          </div>

          {/* Account information */}
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Account Information
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Your staff account is currently{" "}
                  <span className="font-bold text-emerald-600">
                    {staff?.status}
                  </span>
                  .
                </p>
              </div>

              <Link
                href="/staff-dashboard/settings"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Account Settings
                <ChevronRight size={16} />
              </Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}