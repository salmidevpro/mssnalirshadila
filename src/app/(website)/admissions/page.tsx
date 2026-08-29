"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ClipboardList,
  FileText,
  GraduationCap,
  HelpCircle,
  Images,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { motion } from "motion/react";

const SCHOOL_BLUE = "#010066";
const SCHOOL_BLUE_DARK = "#00004D";
const SCHOOL_GOLD = "#FFAF2E";

const admissionSteps = [
  {
    number: "01",
    icon: ClipboardList,
    title: "Learn About Us",
    text: "Explore our school, educational approach, programmes and values to understand what makes Al-Irshad special.",
  },
  {
    number: "02",
    icon: FileText,
    title: "Submit Application",
    text: "Complete the admission application with the required student and parent or guardian information.",
  },
  {
    number: "03",
    icon: UserPlus,
    title: "Assessment",
    text: "Eligible applicants may be invited for an assessment or other admission-related process.",
  },
  {
    number: "04",
    icon: GraduationCap,
    title: "Admission",
    text: "Successful applicants receive admission information and guidance on the next steps.",
  },
];

const requirements = [
  "Completed admission application",
  "Recent passport photograph",
  "Birth certificate or appropriate age documentation",
  "Previous school report or academic record where applicable",
  "Parent or guardian identification and contact details",
  "Any additional documents requested by the school",
];

const highlights = [
  {
    icon: GraduationCap,
    title: "Quality Education",
    text: "A structured academic environment designed to help learners build strong foundations.",
  },
  {
    icon: ShieldCheck,
    title: "Islamic Values",
    text: "Learning is supported by discipline, faith, character and responsible conduct.",
  },
  {
    icon: Sparkles,
    title: "Student Development",
    text: "We encourage confidence, creativity, responsibility and personal growth.",
  },
];

export default function AdmissionsPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-white">
      {/* =========================================================
          HERO
      ========================================================== */}

      <section className="relative overflow-hidden bg-[#00004D] pt-28 sm:pt-32 lg:pt-36">
        <div className="absolute inset-0">
          <Image
            src="/images/mssn-al-irshad-model-school-ila-orangun-campus.png"
            alt="MSSN Al-Irshad Model School campus"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>

        <div className="absolute inset-0 bg-[#00004D]/75" />

        <div className="absolute inset-0 bg-gradient-to-r from-[#00004D] via-[#00004D]/75 to-[#00004D]/30" />

        <div className="absolute inset-0 bg-gradient-to-t from-[#00004D] via-transparent to-transparent" />

        <div
          aria-hidden="true"
          className="absolute -right-24 top-20 h-72 w-72 rounded-full blur-3xl"
          style={{
            backgroundColor: `${SCHOOL_GOLD}18`,
          }}
        />

        <div className="container-main relative z-10 px-5 sm:px-6">
          <div className="grid min-h-[620px] items-center gap-12 py-20 lg:grid-cols-[1fr_0.8fr]">
            {/* TEXT */}

            <motion.div
              initial={{ opacity: 0, x: -35 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.8,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="max-w-3xl"
            >
              <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-md">
                <div className="relative h-10 w-10 overflow-hidden rounded-full bg-white">
                  <Image
                    src="/images/al-ishad-logo.jpeg"
                    alt="MSSN Al-Irshad Model School"
                    fill
                    sizes="40px"
                    className="object-contain p-1"
                  />
                </div>

                <div className="pr-3">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#FFAF2E]">
                    MSSN Al-Irshad
                  </p>

                  <p className="text-xs font-semibold text-white">
                    Model School
                  </p>
                </div>
              </div>

              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#FFAF2E]">
                Admissions
              </p>

              <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[1.02] tracking-[-0.05em] text-white sm:text-6xl lg:text-7xl">
                Begin your child&apos;s journey with us.
              </h1>

              <div
                className="mt-6 h-1 w-20 rounded-full"
                style={{
                  backgroundColor: SCHOOL_GOLD,
                }}
              />

              <p className="mt-6 max-w-2xl text-sm leading-7 text-white/70 sm:text-lg sm:leading-8">
                Join a learning community where academic excellence, Islamic
                values, discipline and character development come together to
                prepare students for a meaningful future.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#application"
                  className="group inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-bold transition-all hover:-translate-y-1 hover:shadow-2xl"
                  style={{
                    backgroundColor: SCHOOL_GOLD,
                    color: SCHOOL_BLUE_DARK,
                  }}
                >
                  Start Application

                  <ArrowUpRight
                    size={16}
                    className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </a>

                <Link
                  href="/contact"
                  className="group inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-7 py-3 text-sm font-bold text-white backdrop-blur-md transition-all hover:-translate-y-1 hover:bg-white hover:text-[#010066]"
                >
                  Contact Admissions

                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>
              </div>
            </motion.div>

            {/* HERO IMAGE CARD */}

            <motion.div
              initial={{ opacity: 0, x: 35, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{
                duration: 0.8,
                delay: 0.15,
              }}
              className="relative hidden lg:block"
            >
              <div className="relative mx-auto max-w-md overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 p-2 shadow-2xl backdrop-blur-sm">
                <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem]">
                  <Image
                    src="/images/school-2.jpg"
                    alt="Students at MSSN Al-Irshad Model School"
                    fill
                    sizes="420px"
                    className="object-cover"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-[#00004D]/80 via-transparent to-transparent" />

                  <div className="absolute bottom-5 left-5 right-5">
                    <div className="rounded-2xl border border-white/15 bg-black/25 p-4 backdrop-blur-md">
                      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#FFAF2E]">
                        Your Future Starts Here
                      </p>

                      <p className="mt-1 text-lg font-bold text-white">
                        Education with purpose.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -bottom-5 -left-8 rounded-2xl border border-white bg-white px-5 py-4 shadow-2xl"
              >
                <p
                  className="text-xs font-bold"
                  style={{ color: SCHOOL_BLUE }}
                >
                  Admissions Open
                </p>

                <p className="mt-1 text-[10px] text-slate-400">
                  Start your application today
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>

        <div
          className="absolute bottom-0 left-0 h-1 w-full"
          style={{
            backgroundColor: SCHOOL_GOLD,
          }}
        />
      </section>

      {/* =========================================================
          INTRO
      ========================================================== */}

      <section className="bg-white py-20 sm:py-24">
        <div className="container-main px-5 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <motion.div
              initial={{ opacity: 0, x: -25 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65 }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-[0.23em]"
                style={{ color: SCHOOL_GOLD }}
              >
                Why Choose Al-Irshad?
              </p>

              <h2
                className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl"
                style={{ color: SCHOOL_BLUE_DARK }}
              >
                An environment designed for growth.
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 25 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65 }}
            >
              <p className="text-sm leading-7 text-slate-500 sm:text-base sm:leading-8">
                Choosing a school is one of the most important decisions a
                parent or guardian can make. At MSSN Al-Irshad Model School,
                we aim to create an environment where students are challenged
                academically while being guided by strong Islamic values and
                sound character.
              </p>

              <p className="mt-4 text-sm leading-7 text-slate-500 sm:text-base">
                Our goal is not simply to prepare students for examinations,
                but to help them develop the knowledge, discipline, confidence
                and values needed for life.
              </p>
            </motion.div>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {highlights.map((item, index) => {
              const Icon = item.icon;

              return (
                <motion.article
                  key={item.title}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.55,
                    delay: index * 0.08,
                  }}
                  className="group rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_8px_30px_rgba(1,0,102,0.04)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_25px_55px_rgba(1,0,102,0.1)]"
                >
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl"
                    style={{
                      backgroundColor: `${SCHOOL_BLUE}08`,
                      color: SCHOOL_BLUE,
                    }}
                  >
                    <Icon size={21} />
                  </div>

                  <h3
                    className="mt-6 text-xl font-bold"
                    style={{ color: SCHOOL_BLUE_DARK }}
                  >
                    {item.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    {item.text}
                  </p>

                  <div
                    className="mt-6 h-1 w-8 rounded-full transition-all duration-500 group-hover:w-14"
                    style={{ backgroundColor: SCHOOL_GOLD }}
                  />
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================
          ADMISSION PROCESS
      ========================================================== */}

      <section className="bg-slate-50 py-20 sm:py-24">
        <div className="container-main px-5 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.23em]"
              style={{ color: SCHOOL_GOLD }}
            >
              Admission Process
            </p>

            <h2
              className="mt-3 text-3xl font-black sm:text-4xl"
              style={{ color: SCHOOL_BLUE_DARK }}
            >
              Your journey starts here.
            </h2>

            <p className="mt-4 text-sm leading-7 text-slate-500">
              Our admission process is designed to make the journey clear and
              straightforward for parents, guardians and prospective students.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {admissionSteps.map((step, index) => {
              const Icon = step.icon;

              return (
                <motion.article
                  key={step.number}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.55,
                    delay: index * 0.08,
                  }}
                  className="relative rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_8px_30px_rgba(1,0,102,0.04)]"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-4xl font-black"
                      style={{
                        color: `${SCHOOL_BLUE}10`,
                      }}
                    >
                      {step.number}
                    </span>

                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-2xl"
                      style={{
                        backgroundColor: `${SCHOOL_GOLD}18`,
                        color: SCHOOL_BLUE,
                      }}
                    >
                      <Icon size={19} />
                    </div>
                  </div>

                  <h3
                    className="mt-6 text-lg font-bold"
                    style={{ color: SCHOOL_BLUE_DARK }}
                  >
                    {step.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    {step.text}
                  </p>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================
          REQUIREMENTS + IMAGE
      ========================================================== */}

      <section className="bg-white py-20 sm:py-24 lg:py-28">
        <div className="container-main px-5 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_0.9fr] lg:gap-20">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-[0.23em]"
                style={{ color: SCHOOL_GOLD }}
              >
                What You&apos;ll Need
              </p>

              <h2
                className="mt-3 text-3xl font-black sm:text-4xl"
                style={{ color: SCHOOL_BLUE_DARK }}
              >
                Admission requirements.
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-500">
                Prospective students and their parents or guardians should
                prepare the relevant documents required during the admission
                process.
              </p>

              <div className="mt-8 space-y-4">
                {requirements.map((requirement, index) => (
                  <motion.div
                    key={requirement}
                    initial={{ opacity: 0, x: -15 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.4,
                      delay: index * 0.05,
                    }}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle2
                      size={20}
                      className="mt-0.5 shrink-0"
                      style={{ color: SCHOOL_GOLD }}
                    />

                    <p className="text-sm leading-6 text-slate-600">
                      {requirement}
                    </p>
                  </motion.div>
                ))}
              </div>

              <p className="mt-7 text-xs leading-6 text-slate-400">
                Requirements may vary depending on the class or programme.
                Please contact the school for the latest admission
                information.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative"
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem]">
                <Image
                  src="/images/images-1.jpg"
                  alt="MSSN Al-Irshad Model School students"
                  fill
                  sizes="(max-width: 1024px) 90vw, 500px"
                  className="object-cover transition-transform duration-700 hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#00004D]/75 via-transparent to-transparent" />

                <div className="absolute bottom-6 left-6 right-6">
                  <div className="rounded-2xl border border-white/15 bg-black/25 p-5 backdrop-blur-md">
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#FFAF2E]">
                      MSSN Al-Irshad Model School
                    </p>

                    <p className="mt-2 text-xl font-bold text-white">
                      Growing through knowledge and values.
                    </p>
                  </div>
                </div>
              </div>

              <div
                className="absolute -bottom-5 -left-5 h-28 w-28 rounded-3xl border-8 border-white"
                style={{
                  backgroundColor: SCHOOL_GOLD,
                }}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* =========================================================
          APPLICATION CTA
      ========================================================== */}

      <section
        id="application"
        className="relative overflow-hidden bg-[#00004D] py-20 sm:py-28"
      >
        <div
          aria-hidden="true"
          className="absolute -right-24 -top-24 h-80 w-80 rounded-full blur-3xl"
          style={{
            backgroundColor: `${SCHOOL_GOLD}15`,
          }}
        />

        <div
          aria-hidden="true"
          className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-white/5 blur-3xl"
        />

        <div className="container-main relative z-10 px-5 sm:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
            <motion.div
              initial={{ opacity: 0, x: -25 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Images
                size={30}
                className="text-[#FFAF2E]"
              />

              <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.23em] text-[#FFAF2E]">
                Ready to Begin?
              </p>

              <h2 className="mt-3 max-w-3xl text-3xl font-black tracking-[-0.04em] text-white sm:text-5xl">
                Take the first step towards your child&apos;s future.
              </h2>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/60 sm:text-base">
                Contact our admissions team to learn more about available
                opportunities, requirements and the next steps for your child.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 25 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex flex-col gap-3"
            >
              <Link
                href="/contact"
                className="group inline-flex min-h-[52px] min-w-[220px] items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-bold transition-all hover:-translate-y-1 hover:shadow-2xl"
                style={{
                  backgroundColor: SCHOOL_GOLD,
                  color: SCHOOL_BLUE_DARK,
                }}
              >
                Contact Admissions

                <ArrowUpRight
                  size={16}
                  className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </Link>

              <a
                href="tel:+2340000000000"
                className="group inline-flex min-h-[52px] min-w-[220px] items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-7 py-3 text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white hover:text-[#010066]"
              >
                <Phone size={16} />

                Call the School
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* =========================================================
          FAQ / CONTACT STRIP
      ========================================================== */}

      <section className="bg-white py-16 sm:py-20">
        <div className="container-main px-5 sm:px-6">
          <div className="grid gap-5 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <HelpCircle
                size={22}
                style={{ color: SCHOOL_BLUE }}
              />

              <h3
                className="mt-4 text-lg font-bold"
                style={{ color: SCHOOL_BLUE_DARK }}
              >
                Have a question?
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Our admissions team can provide clarification about the
                admission process.
              </p>

              <Link
                href="/contact"
                className="mt-5 inline-flex items-center gap-2 text-sm font-bold"
                style={{ color: SCHOOL_BLUE }}
              >
                Contact us
                <ArrowRight size={15} />
              </Link>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <Mail
                size={22}
                style={{ color: SCHOOL_BLUE }}
              />

              <h3
                className="mt-4 text-lg font-bold"
                style={{ color: SCHOOL_BLUE_DARK }}
              >
                Email Admissions
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Send an enquiry to the school and our team will guide you
                through the next steps.
              </p>

              <a
                href="mailto:info@example.com"
                className="mt-5 inline-flex items-center gap-2 text-sm font-bold"
                style={{ color: SCHOOL_BLUE }}
              >
                Send an email
                <ArrowRight size={15} />
              </a>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <Images
                size={22}
                style={{ color: SCHOOL_BLUE }}
              />

              <h3
                className="mt-4 text-lg font-bold"
                style={{ color: SCHOOL_BLUE_DARK }}
              >
                Explore School Life
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Take a visual tour through activities, students, staff and
                moments from our school community.
              </p>

              <Link
                href="/gallery"
                className="mt-5 inline-flex items-center gap-2 text-sm font-bold"
                style={{ color: SCHOOL_BLUE }}
              >
                View gallery
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}