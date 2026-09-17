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
  Phone,
  Save,
  Settings,
  UserRound,
  Users,
  X,
} from "lucide-react";
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";
import {
  SCHOOL_BLUE,
  SCHOOL_BLUE_DARK,
  SCHOOL_GOLD,
} from "@/config/site";

const MAX_FILE_SIZE = 500 * 1024;
const MAX_IMAGE_DIMENSION = 1200;

const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

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

type NavItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
};

const mainNav: NavItem[] = [
  {
    label: "Dashboard",
    href: "/staff-dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "My Classes",
    href: "/staff-dashboard/classes",
    icon: Users,
  },
  {
    label: "My Courses",
    href: "/staff-dashboard/courses",
    icon: BookOpen,
  },
  {
    label: "Assignments",
    href: "/staff-dashboard/assignments",
    icon: ClipboardCheck,
  },
  {
    label: "Results",
    href: "/staff-dashboard/results",
    icon: FileText,
  },
  {
    label: "Attendance",
    href: "/staff-dashboard/attendance",
    icon: CheckCircle2,
  },
  {
    label: "Students",
    href: "/staff-dashboard/students",
    icon: GraduationCap,
  },
  {
    label: "Academic Calendar",
    href: "/staff-dashboard/calendar",
    icon: CalendarDays,
  },
];

const secondaryNav: NavItem[] = [
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

/**
 * Convert any supported image to WebP.
 *
 * The image is:
 * - resized to a maximum of 1200px
 * - compressed progressively
 * - reduced in dimensions if quality compression alone isn't enough
 * - guaranteed to stay within the 500 KB limit
 */
async function convertToOptimizedWebP(
  file: File
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);

  try {
    let width = bitmap.width;
    let height = bitmap.height;

    if (
      width > MAX_IMAGE_DIMENSION ||
      height > MAX_IMAGE_DIMENSION
    ) {
      const scale = Math.min(
        MAX_IMAGE_DIMENSION / width,
        MAX_IMAGE_DIMENSION / height
      );

      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error(
        "Unable to process the selected image."
      );
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";

    const renderImage = () => {
      context.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
      );

      context.drawImage(
        bitmap,
        0,
        0,
        canvas.width,
        canvas.height
      );
    };

    /*
     * First attempt:
     * Keep dimensions and progressively reduce quality.
     */
    const qualities = [
      0.9,
      0.85,
      0.8,
      0.75,
      0.7,
      0.65,
      0.6,
      0.55,
      0.5,
    ];

    for (const quality of qualities) {
      renderImage();

      const blob = await new Promise<Blob | null>(
        (resolve) => {
          canvas.toBlob(
            resolve,
            "image/webp",
            quality
          );
        }
      );

      if (!blob) {
        continue;
      }

      if (blob.size <= MAX_FILE_SIZE) {
        return blob;
      }
    }

    /*
     * If quality compression wasn't enough,
     * progressively reduce dimensions.
     */
    let currentWidth = width;
    let currentHeight = height;

    while (
      currentWidth > 600 ||
      currentHeight > 600
    ) {
      currentWidth = Math.round(
        currentWidth * 0.85
      );

      currentHeight = Math.round(
        currentHeight * 0.85
      );

      canvas.width = currentWidth;
      canvas.height = currentHeight;

      const reducedQualities = [
        0.75,
        0.7,
        0.65,
        0.6,
      ];

      for (const quality of reducedQualities) {
        renderImage();

        const blob = await new Promise<Blob | null>(
          (resolve) => {
            canvas.toBlob(
              resolve,
              "image/webp",
              quality
            );
          }
        );

        if (!blob) {
          continue;
        }

        if (blob.size <= MAX_FILE_SIZE) {
          return blob;
        }
      }
    }

    throw new Error(
      "Unable to optimize this image below the 500 KB limit. Please choose a simpler image."
    );
  } finally {
    bitmap.close();
  }
}

export default function StaffProfilePage() {
  const supabase = useMemo(
    () => createClient(),
    []
  );

  const router = useRouter();
  const pathname = usePathname();

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  const [staff, setStaff] =
    useState<Staff | null>(null);

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [uploadingImage, setUploadingImage] =
    useState(false);

  const [menuOpen, setMenuOpen] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [avatarVersion, setAvatarVersion] =
    useState(0);

  const [form, setForm] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    phone: "",
  });

  /*
   * Load authenticated staff member and profile.
   */
  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          throw new Error(
            "Unable to verify your session."
          );
        }

        if (!user) {
          router.replace("/staff-login");
          return;
        }

        const {
          data: staffData,
          error: staffError,
        } = await supabase
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
          throw new Error(
            staffError.message
          );
        }

        if (
          !staffData ||
          staffData.status !== "active"
        ) {
          await supabase.auth.signOut();
          router.replace("/staff-login");
          return;
        }

        const {
          data: profileData,
          error: profileError,
        } = await supabase
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
          throw new Error(
            profileError.message
          );
        }

        if (!profileData) {
          throw new Error(
            "Your profile could not be found."
          );
        }

        if (!mounted) {
          return;
        }

        setStaff(staffData);
        setProfile(profileData);

        setForm({
          first_name:
            profileData.first_name ?? "",
          middle_name:
            profileData.middle_name ?? "",
          last_name:
            profileData.last_name ?? "",
          phone:
            profileData.phone ?? "",
        });
      } catch (err) {
        console.error(
          "Profile loading error:",
          err
        );

        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load your profile."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [router, supabase]);

  const staffName =
    [
      profile?.first_name,
      profile?.middle_name,
      profile?.last_name,
    ]
      .filter(Boolean)
      .join(" ") || "Staff Member";

  const initials = (
    `${profile?.first_name?.charAt(0) ?? ""}${
      profile?.last_name?.charAt(0) ?? ""
    }`
  )
    .toUpperCase() || "ST";

  const avatarSrc = profile?.avatar_url
    ? `${profile.avatar_url}${
        profile.avatar_url.includes("?")
          ? "&"
          : "?"
      }v=${avatarVersion}`
    : null;

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.replace("/staff-login");
    } catch (err) {
      console.error(
        "Logout error:",
        err
      );
    }
  };

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (error) {
      setError("");
    }

    if (success) {
      setSuccess("");
    }
  };

  /*
   * Save personal profile information.
   */
  const handleProfileSave = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!profile || !staff) {
      return;
    }

    setError("");
    setSuccess("");

    const firstName =
      form.first_name.trim();

    const middleName =
      form.middle_name.trim();

    const lastName =
      form.last_name.trim();

    const phone =
      form.phone.trim();

    if (!firstName) {
      setError(
        "First name is required."
      );
      return;
    }

    if (!lastName) {
      setError(
        "Last name is required."
      );
      return;
    }

    try {
      setSaving(true);

      const {
        data: updatedProfile,
        error: updateError,
      } = await supabase
        .from("profiles")
        .update({
          first_name: firstName,
          middle_name:
            middleName || null,
          last_name: lastName,
          phone: phone || null,
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
        throw new Error(
          updateError.message
        );
      }

      if (!updatedProfile) {
        throw new Error(
          "Your profile could not be updated."
        );
      }

      setProfile(updatedProfile);

      setForm({
        first_name:
          updatedProfile.first_name ?? "",
        middle_name:
          updatedProfile.middle_name ?? "",
        last_name:
          updatedProfile.last_name ?? "",
        phone:
          updatedProfile.phone ?? "",
      });

      setSuccess(
        "Your profile information has been updated successfully."
      );
    } catch (err) {
      console.error(
        "Profile update error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * Upload and optimize profile image.
   */
  const handleImageSelect = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file || !staff || !profile) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      /*
       * Validate MIME type.
       */
      if (
        !ALLOWED_FILE_TYPES.includes(
          file.type as (typeof ALLOWED_FILE_TYPES)[number]
        )
      ) {
        throw new Error(
          "Please select a JPG, PNG, or WebP image."
        );
      }

      /*
       * Validate original file size.
       */
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(
          "Please choose an image smaller than 500 KB."
        );
      }

      setUploadingImage(true);

      /*
       * Convert:
       * JPG/PNG/WebP → optimized WebP
       */
      const optimizedImage =
        await convertToOptimizedWebP(file);

      /*
       * Final safety check.
       */
      if (
        optimizedImage.size > MAX_FILE_SIZE
      ) {
        throw new Error(
          "The image could not be compressed below 500 KB."
        );
      }

      /*
       * ONE permanent image path per staff member.
       *
       * Do not use Date.now().
       */
      const filePath =
        `${staff.user_id}/profile.webp`;

      /*
       * Replace the existing image.
       */
      const {
        error: uploadError,
      } = await supabase.storage
        .from("staff-profiles")
        .upload(
          filePath,
          optimizedImage,
          {
            cacheControl: "3600",
            upsert: true,
            contentType: "image/webp",
          }
        );

      if (uploadError) {
        throw new Error(
          uploadError.message
        );
      }

      /*
       * Get clean permanent public URL.
       */
      const {
        data: { publicUrl },
      } = supabase.storage
        .from("staff-profiles")
        .getPublicUrl(filePath);

      /*
       * Save canonical URL to profiles.
       */
      const {
        data: updatedProfile,
        error: updateError,
      } = await supabase
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

      /*
       * IMPORTANT:
       *
       * We intentionally do NOT delete the uploaded
       * file if the database update fails.
       *
       * profile.webp is the permanent canonical
       * object for this staff member.
       */
      if (updateError) {
        console.error(
          "Profile database update failed after image upload:",
          updateError
        );

        throw new Error(
          "The image was uploaded, but your profile could not be updated. Please try again."
        );
      }

      if (!updatedProfile) {
        throw new Error(
          "The image was uploaded, but your profile could not be updated. Please try again."
        );
      }

      /*
       * Update UI.
       */
      setProfile(updatedProfile);

      /*
       * Bust browser cache without storing
       * a timestamp in the database.
       */
      setAvatarVersion(Date.now());

      setSuccess(
        "Profile image updated successfully."
      );

      /*
       * Allow selecting the same file again.
       */
      event.target.value = "";
    } catch (err) {
      console.error(
        "Profile image upload error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to upload your profile image."
      );

      event.target.value = "";
    } finally {
      setUploadingImage(false);
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2
            className="animate-spin"
            size={32}
            style={{
              color: SCHOOL_BLUE,
            }}
          />

          <p className="text-sm font-medium text-slate-500">
            Loading your profile...
          </p>
        </div>
      </div>
    );
  }

  if (!staff || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <AlertCircle
              size={24}
              className="text-red-600"
            />
          </div>

          <h1 className="text-lg font-bold text-slate-900">
            Unable to load profile
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {error ||
              "Your staff profile could not be loaded."}
          </p>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
            className="mt-6 rounded-xl px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile backdrop */}
      {menuOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() =>
            setMenuOpen(false)
          }
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:translate-x-0 ${
          menuOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-[82px] items-center justify-between border-b border-slate-100 px-5">
          <Link
            href="/staff-dashboard"
            className="flex items-center gap-3"
            onClick={() =>
              setMenuOpen(false)
            }
          >
            <img
              src="/images/al-ishad-logo.jpeg"
              alt="Al-Irshad Model School"
              className="h-11 w-11 rounded-xl object-cover"
            />

            <div>
              <p
                className="text-sm font-extrabold"
                style={{
                  color: SCHOOL_BLUE_DARK,
                }}
              >
                Al-Irshad
              </p>

              <p className="text-[11px] font-medium text-slate-400">
                Staff Portal
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() =>
              setMenuOpen(false)
            }
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Main Menu
          </p>

          <nav className="space-y-1">
            {mainNav.map((item) => {
              const Icon = item.icon;

              const active =
                pathname === item.href ||
                (item.href !==
                  "/staff-dashboard" &&
                  pathname.startsWith(
                    `${item.href}/`
                  ));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() =>
                    setMenuOpen(false)
                  }
                  className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                    active
                      ? "text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                  style={
                    active
                      ? {
                          backgroundColor:
                            SCHOOL_BLUE,
                        }
                      : undefined
                  }
                >
                  <Icon
                    size={18}
                    className={
                      active
                        ? "text-white"
                        : "text-slate-400 group-hover:text-slate-600"
                    }
                  />

                  <span>
                    {item.label}
                  </span>

                  {active && (
                    <ChevronRight
                      size={15}
                      className="ml-auto"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="my-6 border-t border-slate-100" />

          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Account
          </p>

          <nav className="space-y-1">
            {secondaryNav.map((item) => {
              const Icon = item.icon;

              const active =
                pathname === item.href ||
                pathname.startsWith(
                  `${item.href}/`
                );

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() =>
                    setMenuOpen(false)
                  }
                  className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                    active
                      ? "text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                  style={
                    active
                      ? {
                          backgroundColor:
                            SCHOOL_BLUE,
                        }
                      : undefined
                  }
                >
                  <Icon
                    size={18}
                    className={
                      active
                        ? "text-white"
                        : "text-slate-400 group-hover:text-slate-600"
                    }
                  />

                  <span>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Staff card */}
        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-bold text-white"
              style={{
                backgroundColor:
                  SCHOOL_BLUE,
              }}
            >
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={staffName}
                  className="h-full w-full object-cover"
                />
              ) : (
                initials
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-800">
                {staffName}
              </p>

              <p className="truncate text-[11px] text-slate-400">
                {staff.position ||
                  "Staff Member"}
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title="Logout"
              className="rounded-lg p-2 text-slate-400 transition hover:bg-white hover:text-red-600"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:pl-[270px]">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-[82px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                setMenuOpen(true)
              }
              className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50 lg:hidden"
            >
              <Menu size={20} />
            </button>

            <div>
              <p className="text-xs font-medium text-slate-400">
                Staff Portal
              </p>

              <h1 className="text-lg font-bold text-slate-900">
                My Profile
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="relative rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:bg-slate-50"
            >
              <Bell size={19} />

              <span
                className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full"
                style={{
                  backgroundColor:
                    SCHOOL_GOLD,
                }}
              />
            </button>

            <div className="hidden h-8 w-px bg-slate-200 sm:block" />

            <div className="hidden items-center gap-3 sm:flex">
              <div
                className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full text-xs font-bold text-white"
                style={{
                  backgroundColor:
                    SCHOOL_BLUE,
                }}
              >
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={staffName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>

              <div className="max-w-[160px]">
                <p className="truncate text-sm font-bold text-slate-800">
                  {staffName}
                </p>

                <p className="truncate text-[11px] text-slate-400">
                  {staff.position ||
                    "Staff Member"}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {/* Page heading */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <Link
                href="/staff-dashboard"
                className="transition hover:text-slate-600"
              >
                Dashboard
              </Link>

              <ChevronRight size={14} />

              <span className="text-slate-600">
                Profile
              </span>
            </div>

            <div className="mt-4">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Profile Settings
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Manage your personal information
                and profile photo.
              </p>
            </div>
          </div>

          {/* Feedback */}
          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0"
              />

              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CheckCircle2
                size={18}
                className="mt-0.5 shrink-0"
              />

              <p>{success}</p>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            {/* Profile photo card */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <h3 className="text-base font-bold text-slate-900">
                  Profile Photo
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Use a clear professional photo.
                </p>
              </div>

              <div className="flex flex-col items-center">
                <div
                  className="relative flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border-4 border-white shadow-lg ring-1 ring-slate-200"
                  style={{
                    backgroundColor:
                      SCHOOL_BLUE,
                  }}
                >
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt={staffName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-extrabold text-white">
                      {initials}
                    </span>
                  )}

                  {uploadingImage && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/55">
                      <Loader2
                        size={28}
                        className="animate-spin text-white"
                      />
                    </div>
                  )}
                </div>

                <p className="mt-4 text-center text-base font-bold text-slate-900">
                  {staffName}
                </p>

                <p className="mt-1 text-center text-xs text-slate-500">
                  {staff.position ||
                    "Staff Member"}
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={
                    handleImageSelect
                  }
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={openFilePicker}
                  disabled={uploadingImage}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    backgroundColor:
                      SCHOOL_BLUE,
                  }}
                >
                  {uploadingImage ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <UserRound
                        size={17}
                      />
                      Change Photo
                    </>
                  )}
                </button>

                <p className="mt-3 text-center text-[11px] leading-5 text-slate-400">
                  JPG, PNG or WebP
                  <br />
                  Maximum 500 KB
                </p>
              </div>
            </section>

            {/* Personal information */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
              <div className="mb-6">
                <h3 className="text-base font-bold text-slate-900">
                  Personal Information
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Update the personal information
                  displayed on your staff profile.
                </p>
              </div>

              <form
                onSubmit={handleProfileSave}
                className="space-y-6"
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  {/* First name */}
                  <div>
                    <label
                      htmlFor="first_name"
                      className="mb-2 block text-xs font-bold text-slate-700"
                    >
                      First Name
                    </label>

                    <input
                      id="first_name"
                      name="first_name"
                      type="text"
                      value={form.first_name}
                      onChange={
                        handleInputChange
                      }
                      disabled={saving}
                      autoComplete="given-name"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-transparent focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50"
                      style={{
                        "--tw-ring-color":
                          SCHOOL_BLUE,
                      } as React.CSSProperties}
                      placeholder="Enter first name"
                    />
                  </div>

                  {/* Middle name */}
                  <div>
                    <label
                      htmlFor="middle_name"
                      className="mb-2 block text-xs font-bold text-slate-700"
                    >
                      Middle Name
                      <span className="ml-1 font-normal text-slate-400">
                        (Optional)
                      </span>
                    </label>

                    <input
                      id="middle_name"
                      name="middle_name"
                      type="text"
                      value={
                        form.middle_name
                      }
                      onChange={
                        handleInputChange
                      }
                      disabled={saving}
                      autoComplete="additional-name"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-transparent focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50"
                      style={{
                        "--tw-ring-color":
                          SCHOOL_BLUE,
                      } as React.CSSProperties}
                      placeholder="Enter middle name"
                    />
                  </div>

                  {/* Last name */}
                  <div>
                    <label
                      htmlFor="last_name"
                      className="mb-2 block text-xs font-bold text-slate-700"
                    >
                      Last Name
                    </label>

                    <input
                      id="last_name"
                      name="last_name"
                      type="text"
                      value={form.last_name}
                      onChange={
                        handleInputChange
                      }
                      disabled={saving}
                      autoComplete="family-name"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-transparent focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50"
                      style={{
                        "--tw-ring-color":
                          SCHOOL_BLUE,
                      } as React.CSSProperties}
                      placeholder="Enter last name"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label
                      htmlFor="phone"
                      className="mb-2 block text-xs font-bold text-slate-700"
                    >
                      Phone Number
                    </label>

                    <div className="relative">
                      <Phone
                        size={17}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={form.phone}
                        onChange={
                          handleInputChange
                        }
                        disabled={saving}
                        autoComplete="tel"
                        className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-transparent focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50"
                        style={{
                          "--tw-ring-color":
                            SCHOOL_BLUE,
                        } as React.CSSProperties}
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-xs font-bold text-slate-700"
                  >
                    Email Address
                  </label>

                  <input
                    id="email"
                    type="email"
                    value={
                      profile.email ?? ""
                    }
                    disabled
                    className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 outline-none"
                  />

                  <p className="mt-2 text-[11px] text-slate-400">
                    Your email address is managed
                    by your account and cannot be
                    changed here.
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-6">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    style={{
                      backgroundColor:
                        SCHOOL_BLUE,
                    }}
                  >
                    {saving ? (
                      <>
                        <Loader2
                          size={17}
                          className="animate-spin"
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={17} />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </section>
          </div>

          {/* Official staff information */}
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
            <div className="mb-6">
              <h3 className="text-base font-bold text-slate-900">
                Staff Information
              </h3>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                These details are managed by the
                school administration.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Staff ID
                </p>

                <p className="mt-2 text-sm font-bold text-slate-800">
                  {staff.staff_id}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Department
                </p>

                <p className="mt-2 text-sm font-bold text-slate-800">
                  {staff.department ||
                    "Not assigned"}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Position
                </p>

                <p className="mt-2 text-sm font-bold text-slate-800">
                  {staff.position ||
                    "Not assigned"}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Status
                </p>

                <div className="mt-2 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />

                  <span className="text-sm font-bold capitalize text-emerald-700">
                    {staff.status}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Security note */}
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{
                backgroundColor: `${SCHOOL_GOLD}20`,
              }}
            >
              <Settings
                size={17}
                style={{
                  color: SCHOOL_GOLD,
                }}
              />
            </div>

            <div>
              <p className="text-sm font-bold text-slate-800">
                Account information
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Your staff ID, department, position
                and account status are controlled by
                the school administration. Contact an
                administrator if any of these details
                need to be changed.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}