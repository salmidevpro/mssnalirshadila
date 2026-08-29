"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
} from "react-icons/fa";
import { motion } from "motion/react";

const SCHOOL_BLUE = "#010066";
const SCHOOL_BLUE_DARK = "#00004D";
const SCHOOL_GOLD = "#FFAF2E";

const quickLinks = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "About",
    href: "/about",
  },
  {
    label: "The School Management",
    href: "/management",
  },
  {
    label: "The Staff",
    href: "/staff",
  },
  {
    label: "News & Events",
    href: "/news-events",
  },
  {
    label: "Picture Gallery",
    href: "/gallery",
  },
];

const portalLinks = [
  {
    label: "Student Portal",
    href: "/student-login",
  },
  {
    label: "Staff Portal",
    href: "/staff-login",
  },
];

const socialLinks = [
  {
    label: "Facebook",
    href: "#",
    icon: FaFacebookF,
  },
  {
    label: "Instagram",
    href: "#",
    icon: FaInstagram,
  },
  {
    label: "YouTube",
    href: "#",
    icon: FaYoutube,
  },
];

export default function Footer() {
  return (
    <footer
      className="relative overflow-hidden text-white"
      style={{
        backgroundColor: SCHOOL_BLUE_DARK,
      }}
    >
      {/* =====================================================
          DECORATIVE BACKGROUND
      ====================================================== */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full blur-3xl"
        style={{
          backgroundColor: `${SCHOOL_GOLD}0D`,
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full blur-3xl"
        style={{
          backgroundColor: "#ffffff06",
        }}
      />

      {/* =====================================================
          MAIN FOOTER
      ====================================================== */}

      <div className="container-main relative z-10 px-5 pb-10 pt-16 sm:px-6 sm:pt-20 lg:pt-24">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_0.8fr_0.8fr_1fr] lg:gap-10">
          {/* =================================================
              SCHOOL INFORMATION
          ================================================== */}

          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
              amount: 0.2,
            }}
            transition={{
              duration: 0.6,
            }}
            className="max-w-md"
          >
            {/* School Logo + Name */}

            <Link
              href="/"
              aria-label="MSSN Al-Irshad Model School"
              className="group inline-flex items-center gap-3"
            >
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-1.5 shadow-lg transition-transform duration-300 group-hover:scale-105">
                <img
                  src="/images/al-ishad-logo.jpeg"
                  alt="MSSN Al-Irshad Model School"
                  className="h-full w-full object-contain"
                />
              </div>

              <div>
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.22em]"
                  style={{
                    color: SCHOOL_GOLD,
                  }}
                >
                  MSSN Al-Irshad
                </p>

                <p className="mt-0.5 text-base font-bold text-white">
                  Islamic School
                </p>

                <p className="mt-0.5 text-[10px] text-white/45">
                  Ila Orangun
                </p>
              </div>
            </Link>

            {/* School Description */}

            <p className="mt-7 text-sm leading-7 text-white/60">
              MSSN Al-Irshad Model School is committed to providing quality
              education grounded in Islamic values, strong character,
              discipline and excellence.
            </p>

            {/* Contact Information */}

            <div className="mt-7 space-y-3">
              <a
                href="tel:+2348037211673"
                className="group flex items-center gap-3 text-sm text-white/60 transition-colors duration-300 hover:text-white"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: `${SCHOOL_GOLD}12`,
                    color: SCHOOL_GOLD,
                  }}
                >
                  <Phone size={15} />
                </span>

                <span>Call Us +234 803 721 1673</span>
              </a>

              <a
                href="mailto:info@example.com"
                className="group flex items-center gap-3 text-sm text-white/60 transition-colors duration-300 hover:text-white"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: `${SCHOOL_GOLD}12`,
                    color: SCHOOL_GOLD,
                  }}
                >
                  <Mail size={15} />
                </span>

                <span>mssnalirshad@gmail.com</span>
              </a>

              <div className="flex items-center gap-3 text-sm text-white/60">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: `${SCHOOL_GOLD}12`,
                    color: SCHOOL_GOLD,
                  }}
                >
                  <MapPin size={15} />
                </span>

                <span>Ita-Baba Area, Ajaba Road, Ila-orangun, Osun State.</span>
              </div>
            </div>
          </motion.div>

          {/* =================================================
              QUICK LINKS
          ================================================== */}

          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
              amount: 0.2,
            }}
            transition={{
              duration: 0.6,
              delay: 0.08,
            }}
          >
            <p
              className="text-[10px] font-bold uppercase tracking-[0.22em]"
              style={{
                color: SCHOOL_GOLD,
              }}
            >
              Explore
            </p>

            <h3 className="mt-3 text-lg font-bold text-white">
              School
            </h3>

            <div className="mt-6 space-y-3">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex items-center gap-2 text-sm text-white/55 transition-all duration-300 hover:translate-x-1 hover:text-white"
                >
                  <span>{link.label}</span>

                  <ArrowUpRight
                    size={13}
                    className="opacity-0 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100"
                  />
                </Link>
              ))}
            </div>
          </motion.div>

          {/* =================================================
              PORTALS
          ================================================== */}

          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
              amount: 0.2,
            }}
            transition={{
              duration: 0.6,
              delay: 0.16,
            }}
          >
            <p
              className="text-[10px] font-bold uppercase tracking-[0.22em]"
              style={{
                color: SCHOOL_GOLD,
              }}
            >
              Access
            </p>

            <h3 className="mt-3 text-lg font-bold text-white">
              Portals
            </h3>

            <div className="mt-6 space-y-3">
              {portalLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3 text-sm text-white/65 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
                >
                  <span>{link.label}</span>

                  <ArrowUpRight
                    size={14}
                    className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </Link>
              ))}
            </div>

            {/* Admissions */}

            <Link
              href="/admissions"
              className="group mt-5 inline-flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-bold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
              style={{
                backgroundColor: SCHOOL_GOLD,
                color: SCHOOL_BLUE_DARK,
              }}
            >
              <span>Admissions</span>

              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/10">
                <ArrowUpRight
                  size={14}
                  className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </span>
            </Link>
          </motion.div>

          {/* =================================================
              SOCIAL MEDIA
          ================================================== */}

          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
              amount: 0.2,
            }}
            transition={{
              duration: 0.6,
              delay: 0.24,
            }}
          >
            <p
              className="text-[10px] font-bold uppercase tracking-[0.22em]"
              style={{
                color: SCHOOL_GOLD,
              }}
            >
              Connect
            </p>

            <h3 className="mt-3 text-lg font-bold text-white">
              Follow the School
            </h3>

            <p className="mt-4 text-sm leading-6 text-white/50">
              Follow our official social media pages for school news,
              announcements, activities and updates.
            </p>

            {/* Social Media Icons */}

            <div className="mt-6 flex items-center gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;

                return (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/60 transition-all duration-300 hover:-translate-y-1 hover:border-[#FFAF2E]/40 hover:bg-[#FFAF2E] hover:text-[#00004D] hover:shadow-[0_10px_25px_rgba(255,175,46,0.20)]"
                  >
                    <Icon
                      size={17}
                      className="transition-transform duration-300 group-hover:scale-110"
                    />
                  </a>
                );
              })}
            </div>

            {/* Commitment Card */}

            <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: SCHOOL_GOLD,
                  }}
                />

                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/50">
                  Our Commitment
                </span>
              </div>

              <p className="mt-2 text-xs leading-5 text-white/45">
                Knowledge. Character. Excellence.
              </p>
            </div>
          </motion.div>
        </div>

        {/* =====================================================
            DIVIDER
        ====================================================== */}

        <div className="mt-14 h-px bg-white/10" />

        {/* =====================================================
            LOWER FOOTER
        ====================================================== */}

        <div className="flex flex-col gap-5 pt-7 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p className="text-white/40">
            © {new Date().getFullYear()} MSSN Al-Irshad Model School. All
            rights reserved.
          </p>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link
              href="/about"
              className="text-white/40 transition-colors duration-300 hover:text-white"
            >
              About
            </Link>

            <Link
              href="/faq"
              className="text-white/40 transition-colors duration-300 hover:text-white"
            >
              FAQ
            </Link>

            <Link
              href="/contact"
              className="text-white/40 transition-colors duration-300 hover:text-white"
            >
              Contact
            </Link>
          </div>
        </div>
      </div>

      {/* =====================================================
          BOTTOM GOLD ACCENT
      ====================================================== */}

      <div
        aria-hidden="true"
        className="h-1 w-full"
        style={{
          background: `linear-gradient(
            90deg,
            transparent,
            ${SCHOOL_GOLD},
            transparent
          )`,
        }}
      />
    </footer>
  );
}