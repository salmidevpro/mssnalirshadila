"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Clock3,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";
import { motion } from "motion/react";

import {
  SCHOOL_BLUE,
  SCHOOL_BLUE_DARK,
  SCHOOL_GOLD,
  siteConfig,
} from "@/config/site";

const contactDetails = [
  {
    icon: Phone,
    title: "Phone",
    value: "Contact the school",
    description: "Speak directly with the school office.",
    href: "tel:+2340000000000",
  },
  {
    icon: Mail,
    title: "Email",
    value: "info@mssnalirshad.com",
    description: "Send us your enquiries and questions.",
    href: "mailto:info@mssnalirshad.com",
  },
  {
    icon: MapPin,
    title: "Location",
    value: "Ila Orangun, Nigeria",
    description: "Visit the school for enquiries and assistance.",
    href: "#location",
  },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* =====================================================
          HERO
      ====================================================== */}

      <section
        className="relative overflow-hidden pt-32 sm:pt-36 lg:pt-40"
        style={{
          background: `linear-gradient(
            135deg,
            ${SCHOOL_BLUE_DARK} 0%,
            ${SCHOOL_BLUE} 60%,
            #07147a 100%
          )`,
        }}
      >
        {/* Decorative glow */}

        <div
          aria-hidden="true"
          className="absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl"
          style={{
            backgroundColor: `${SCHOOL_GOLD}18`,
          }}
        />

        <div
          aria-hidden="true"
          className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full blur-3xl"
          style={{
            backgroundColor: "#ffffff08",
          }}
        />

        <div className="container-main relative z-10 px-5 pb-20 sm:px-6 lg:pb-24">
          <motion.div
            initial={{
              opacity: 0,
              y: 25,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.65,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="max-w-3xl"
          >
            {/* Eyebrow */}

            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 backdrop-blur-sm">
              <MessageCircle
                size={14}
                style={{
                  color: SCHOOL_GOLD,
                }}
              />

              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">
                Contact Us
              </span>
            </div>

            {/* Heading */}

            <h1 className="text-4xl font-bold tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl">
              We&apos;re here to{" "}
              <span style={{ color: SCHOOL_GOLD }}>help.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-sm leading-7 text-white/70 sm:text-base sm:leading-8">
              Whether you have a question about admissions, academics, school
              activities or general enquiries, the MSSN Al-Irshad Model School
              team is available to assist you.
            </p>

            {/* Hero CTA */}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#contact-form"
                className="group relative inline-flex min-h-[50px] items-center justify-center gap-2 overflow-hidden rounded-full px-7 py-3 text-sm font-bold transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(255,175,46,0.30)]"
                style={{
                  backgroundColor: SCHOOL_GOLD,
                  color: SCHOOL_BLUE_DARK,
                }}
              >
                <span className="absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-500 group-hover:translate-x-full" />

                <span className="relative z-10 whitespace-nowrap">
                  Send an Enquiry
                </span>

                <span className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/10">
                  <ArrowUpRight
                    size={15}
                    className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </span>
              </a>

              <a
                href="tel:+2340000000000"
                className="group inline-flex min-h-[50px] items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-7 py-3 text-sm font-bold text-white backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white hover:bg-white hover:text-[#010066] hover:shadow-[0_15px_35px_rgba(0,0,0,0.18)]"
              >
                <Phone
                  size={16}
                  className="transition-transform duration-300 group-hover:scale-110"
                />

                <span>Call the School</span>
              </a>
            </div>
          </motion.div>
        </div>

        {/* Gold accent */}

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
      </section>

      {/* =====================================================
          CONTACT DETAILS
      ====================================================== */}

      <section className="bg-white py-16 sm:py-20 lg:py-24">
        <div className="container-main px-5 sm:px-6">
          <div className="grid gap-5 md:grid-cols-3">
            {contactDetails.map((item, index) => {
              const Icon = item.icon;

              return (
                <motion.a
                  key={item.title}
                  href={item.href}
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
                    duration: 0.5,
                    delay: index * 0.08,
                  }}
                  className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(1,0,102,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-[#010066]/20 hover:shadow-[0_18px_45px_rgba(1,0,102,0.09)]"
                >
                  <div className="flex items-start justify-between">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-2xl"
                      style={{
                        backgroundColor: `${SCHOOL_BLUE}08`,
                        color: SCHOOL_BLUE,
                      }}
                    >
                      <Icon size={19} />
                    </div>

                    <ArrowUpRight
                      size={17}
                      className="text-slate-300 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#010066]"
                    />
                  </div>

                  <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    {item.title}
                  </p>

                  <h2
                    className="mt-2 text-lg font-bold"
                    style={{
                      color: SCHOOL_BLUE_DARK,
                    }}
                  >
                    {item.value}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {item.description}
                  </p>
                </motion.a>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================
          CONTACT FORM + OFFICE INFORMATION
      ====================================================== */}

      <section
        id="contact-form"
        className="scroll-mt-24 border-y border-slate-200 bg-slate-50 py-20 sm:py-24 lg:py-28"
      >
        <div className="container-main px-5 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            {/* Information */}

            <motion.div
              initial={{
                opacity: 0,
                x: -20,
              }}
              whileInView={{
                opacity: 1,
                x: 0,
              }}
              viewport={{
                once: true,
                amount: 0.2,
              }}
              transition={{
                duration: 0.6,
              }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-[0.22em]"
                style={{
                  color: SCHOOL_GOLD,
                }}
              >
                School Office
              </p>

              <h2
                className="mt-3 text-3xl font-bold tracking-[-0.035em] sm:text-4xl"
                style={{
                  color: SCHOOL_BLUE_DARK,
                }}
              >
                Let&apos;s talk.
              </h2>

              <p className="mt-5 text-sm leading-7 text-slate-500 sm:text-base">
                For admissions, academic enquiries, school information or
                general assistance, send us a message and our team will get
                back to you.
              </p>

              {/* Office hours */}

              <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: `${SCHOOL_BLUE}08`,
                      color: SCHOOL_BLUE,
                    }}
                  >
                    <Clock3 size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      School Office
                    </p>

                    <p className="text-xs text-slate-400">
                      Opening hours
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex justify-between gap-5">
                    <span className="text-slate-500">Monday – Friday</span>
                    <span className="font-semibold text-slate-700">
                      School Hours
                    </span>
                  </div>

                  <div className="flex justify-between gap-5">
                    <span className="text-slate-500">Saturday</span>
                    <span className="font-semibold text-slate-700">
                      As Announced
                    </span>
                  </div>

                  <div className="flex justify-between gap-5">
                    <span className="text-slate-500">Sunday</span>
                    <span className="font-semibold text-slate-700">
                      Closed
                    </span>
                  </div>
                </div>
              </div>

              {/* Location */}

              <div
                id="location"
                className="mt-4 rounded-3xl p-6"
                style={{
                  background: `linear-gradient(
                    135deg,
                    ${SCHOOL_BLUE_DARK},
                    ${SCHOOL_BLUE}
                  )`,
                }}
              >
                <MapPin
                  size={20}
                  style={{
                    color: SCHOOL_GOLD,
                  }}
                />

                <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">
                  Our Location
                </p>

                <p className="mt-2 font-bold text-white">
                  {siteConfig.location}
                </p>

                <p className="mt-2 text-sm leading-6 text-white/60">
                  MSSN Al-Irshad Model School
                </p>
              </div>
            </motion.div>

            {/* Form */}

            <motion.div
              initial={{
                opacity: 0,
                x: 20,
              }}
              whileInView={{
                opacity: 1,
                x: 0,
              }}
              viewport={{
                once: true,
                amount: 0.2,
              }}
              transition={{
                duration: 0.6,
                delay: 0.1,
              }}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_15px_50px_rgba(1,0,102,0.06)] sm:p-8"
            >
              <div>
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.22em]"
                  style={{
                    color: SCHOOL_GOLD,
                  }}
                >
                  Send a Message
                </p>

                <h2
                  className="mt-3 text-2xl font-bold tracking-tight"
                  style={{
                    color: SCHOOL_BLUE_DARK,
                  }}
                >
                  How can we help?
                </h2>
              </div>

              <form className="mt-7 space-y-5">
                {/* Name */}

                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-xs font-bold text-slate-700"
                  >
                    Full Name
                  </label>

                  <input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-[#010066]/30 focus:bg-white focus:ring-4 focus:ring-[#010066]/5"
                  />
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
                    placeholder="you@example.com"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-[#010066]/30 focus:bg-white focus:ring-4 focus:ring-[#010066]/5"
                  />
                </div>

                {/* Subject */}

                <div>
                  <label
                    htmlFor="subject"
                    className="mb-2 block text-xs font-bold text-slate-700"
                  >
                    Subject
                  </label>

                  <input
                    id="subject"
                    type="text"
                    placeholder="What is your enquiry about?"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-[#010066]/30 focus:bg-white focus:ring-4 focus:ring-[#010066]/5"
                  />
                </div>

                {/* Message */}

                <div>
                  <label
                    htmlFor="message"
                    className="mb-2 block text-xs font-bold text-slate-700"
                  >
                    Message
                  </label>

                  <textarea
                    id="message"
                    rows={5}
                    placeholder="Write your message..."
                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-[#010066]/30 focus:bg-white focus:ring-4 focus:ring-[#010066]/5"
                  />
                </div>

                {/* Submit */}

                <button
                  type="submit"
                  className="group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl text-sm font-bold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(1,0,102,0.22)]"
                  style={{
                    backgroundColor: SCHOOL_BLUE,
                    color: "#ffffff",
                  }}
                >
                  <span className="absolute inset-0 origin-left scale-x-0 bg-[#00004D] transition-transform duration-300 group-hover:scale-x-100" />

                  <span className="relative z-10">
                    Send Message
                  </span>

                  <span
                    className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: `${SCHOOL_GOLD}25`,
                    }}
                  >
                    <ArrowUpRight
                      size={15}
                      className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    />
                  </span>
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FINAL CTA
      ====================================================== */}

      <section className="bg-white py-16 sm:py-20">
        <div className="container-main px-5 sm:px-6">
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
            className="rounded-3xl border border-slate-200 bg-slate-50 px-6 py-10 text-center sm:px-10"
          >
            <p
              className="text-[10px] font-bold uppercase tracking-[0.2em]"
              style={{
                color: SCHOOL_GOLD,
              }}
            >
              MSSN Al-Irshad Model School
            </p>

            <h2
              className="mx-auto mt-3 max-w-2xl text-2xl font-bold tracking-tight sm:text-3xl"
              style={{
                color: SCHOOL_BLUE_DARK,
              }}
            >
              Questions about admissions or school life?
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
              Our school team is ready to provide the information you need.
            </p>

            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/admissions"
                className="group inline-flex min-h-[46px] items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                style={{
                  backgroundColor: SCHOOL_GOLD,
                  color: SCHOOL_BLUE_DARK,
                }}
              >
                <span>Admissions</span>

                <ArrowUpRight
                  size={15}
                  className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </Link>

              <Link
                href="/faq"
                className="group inline-flex min-h-[46px] items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#010066]/20 hover:text-[#010066] hover:shadow-md"
              >
                <span>Frequently Asked Questions</span>

                <ArrowUpRight
                  size={15}
                  className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}