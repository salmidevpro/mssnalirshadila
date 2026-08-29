"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Images,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";

const SCHOOL_BLUE = "#010066";
const SCHOOL_BLUE_DARK = "#00004D";
const SCHOOL_GOLD = "#FFAF2E";

const heroSlides = [
  {
    image: "/images/mssn-al-irshad-model-school-ila-orangun-campus.png",
    title: "A School Built for Excellence",
    text: "A purposeful environment where knowledge, character and faith grow together.",
  },
  {
    image: "/images/school-2.jpg",
    title: "Learning Beyond the Classroom",
    text: "Creating opportunities for students to learn, discover and develop their potential.",
  },
  {
    image: "/images/images-1.jpg",
    title: "Building Tomorrow's Leaders",
    text: "Preparing confident, responsible and morally upright young people for the future.",
  },
  {
    image: "/images/mssn-al-irshad-model-school-ila-orangun-students.png",
    title: "Where Every Learner Matters",
    text: "Supporting every student with an environment designed for growth, confidence and achievement.",
  },
  {
    image: "/images/lab-aparatus.jpg",
    title: "Growing in Knowledge & Faith",
    text: "Combining quality education with Islamic values and strong character formation.",
  },
  {
    image: "/images/stu-pc.png",
    title: "Preparing Students for the Future",
    text: "Equipping young minds with the knowledge, discipline and confidence to make a difference.",
  },
];

const galleryImages = [
  {
    image: "/images/school-2.jpg",
    title: "Our School Community",
  },
  {
    image: "/images/images-1.jpg",
    title: "Learning & Development",
  },
  {
    image: "/images/school-2.jpg",
    title: "School Activities",
  },
  {
    image: "/images/images-1.jpg",
    title: "Students & Staff",
  },
];

const features = [
  {
    icon: BookOpen,
    title: "Academic Excellence",
    text: "A structured learning environment focused on strong academic foundations and intellectual growth.",
  },
  {
    icon: ShieldCheck,
    title: "Islamic Values",
    text: "We integrate Islamic values, discipline and good character into the educational experience.",
  },
  {
    icon: GraduationCap,
    title: "Holistic Development",
    text: "Students are encouraged to develop intellectually, socially, morally and personally.",
  },
];

const quickLinks = [
  {
    icon: Users,
    title: "School Management",
    text: "Meet the leadership guiding the school's vision and development.",
    href: "/management",
  },
  {
    icon: Users,
    title: "Our Staff",
    text: "Discover the dedicated educators and professionals serving our learners.",
    href: "/staff",
  },
  {
    icon: CalendarDays,
    title: "News & Events",
    text: "Stay updated with activities, announcements and school events.",
    href: "/news-events",
  },
];

export default function HomePage() {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((current) =>
        current === heroSlides.length - 1 ? 0 : current + 1,
      );
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  const nextSlide = () => {
    setActiveSlide((current) =>
      current === heroSlides.length - 1 ? 0 : current + 1,
    );
  };

  const previousSlide = () => {
    setActiveSlide((current) =>
      current === 0 ? heroSlides.length - 1 : current - 1,
    );
  };

  return (
    <main className="min-h-screen overflow-hidden bg-white">
      {/* =========================================================
          HERO
      ========================================================== */}

    {/* =========================================================
    HERO — 6 IMAGE PROMOTIONAL SLIDER
========================================================= */}

<section className="relative min-h-[760px] overflow-hidden bg-[#00004D] pt-24 sm:pt-28 lg:min-h-[850px]">

  {/* =====================================================
      HERO IMAGE SLIDES
  ====================================================== */}

  <div className="absolute inset-0">

    <AnimatePresence initial={false} mode="popLayout">
      {heroSlides.map((slide, index) => {
        const isActive = index === activeSlide;

        if (!isActive) return null;

        /*
          First 4 slides = horizontal sliding animation
          Last 2 slides = zoom / scale animation
        */

        const isSlidingSlide = index < 4;

        return (
          <motion.div
            key={`${slide.image}-${index}`}
            className="absolute inset-0"
            initial={
              isSlidingSlide
                ? {
                    opacity: 0,
                    x: 120,
                    scale: 1.02,
                  }
                : {
                    opacity: 0,
                    scale: 1.12,
                  }
            }
            animate={
              isSlidingSlide
                ? {
                    opacity: 1,
                    x: 0,
                    scale: 1,
                  }
                : {
                    opacity: 1,
                    scale: 1,
                  }
            }
            exit={
              isSlidingSlide
                ? {
                    opacity: 0,
                    x: -120,
                    scale: 1.02,
                  }
                : {
                    opacity: 0,
                    scale: 1.08,
                  }
            }
            transition={{
              duration: 1.1,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              priority={index === 0}
              sizes="100vw"
              className="object-cover"
            />
          </motion.div>
        );
      })}
    </AnimatePresence>

    {/* =================================================
        LIGHT IMAGE OVERLAY
    ================================================= */}

    {/* Left readability gradient */}

    <div className="absolute inset-0 bg-gradient-to-r from-[#00004D]/80 via-[#00004D]/45 to-transparent" />

    {/* Bottom readability gradient */}

    <div className="absolute inset-0 bg-gradient-to-t from-[#00004D]/85 via-transparent to-[#00004D]/20" />

    {/* Very light overall tint */}

    <div className="absolute inset-0 bg-[#00004D]/10" />

    {/* Gold glow */}

    <div
      aria-hidden="true"
      className="absolute -right-32 top-20 h-80 w-80 rounded-full blur-3xl"
      style={{
        backgroundColor: `${SCHOOL_GOLD}20`,
      }}
    />

  </div>

  {/* =====================================================
      HERO CONTENT
  ====================================================== */}

  <div className="container-main relative z-10 px-5 sm:px-6">

    <div className="flex min-h-[680px] items-center">

      <motion.div
        initial={{
          opacity: 0,
          y: 30,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.8,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="max-w-3xl"
      >

        {/* =================================================
            SCHOOL IDENTITY
        ================================================= */}

        <motion.div
          initial={{
            opacity: 0,
            y: 15,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.6,
          }}
          className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/20 bg-black/20 px-3 py-2 backdrop-blur-md"
        >

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

        </motion.div>

        {/* =================================================
            SLIDE TEXT
        ================================================= */}

        <AnimatePresence mode="wait">

          <motion.div
            key={activeSlide}
            initial={{
              opacity: 0,
              y: 25,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -20,
            }}
            transition={{
              duration: 0.55,
              ease: [0.22, 1, 0.36, 1],
            }}
          >

            <p
              className="mb-4 text-xs font-bold uppercase tracking-[0.25em]"
              style={{
                color: SCHOOL_GOLD,
              }}
            >
              Ila Orangun, Nigeria
            </p>

            <h1 className="max-w-4xl text-4xl font-black leading-[1.02] tracking-[-0.05em] text-white sm:text-6xl lg:text-7xl">
              {heroSlides[activeSlide].title}
            </h1>

            <div
              className="mt-6 h-1 rounded-full"
              style={{
                width: "80px",
                backgroundColor: SCHOOL_GOLD,
              }}
            />

            <p className="mt-6 max-w-2xl text-sm leading-7 text-white/80 sm:text-lg sm:leading-8">
              {heroSlides[activeSlide].text}
            </p>

          </motion.div>

        </AnimatePresence>

        {/* =================================================
            BUTTONS
        ================================================= */}

        <div className="mt-9 flex flex-col gap-3 sm:flex-row">

          <Link
            href="/admissions"
            className="group inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-bold transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
            style={{
              backgroundColor: SCHOOL_GOLD,
              color: SCHOOL_BLUE_DARK,
            }}
          >
            Apply for Admission

            <ArrowUpRight
              size={16}
              className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </Link>

          <Link
            href="/about"
            className="group inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full border border-white/30 bg-black/20 px-7 py-3 text-sm font-bold text-white backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:text-[#010066]"
          >
            Discover Our School

            <ArrowRight
              size={16}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>

        </div>

        {/* =================================================
            MOTTO
        ================================================= */}

        <div className="mt-9 border-l-2 border-[#FFAF2E] pl-4">

          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
            Our Motto
          </p>

          <p className="mt-1 text-sm font-semibold italic text-white/85">
            &quot;Concretising faith through knowledge acquisition&quot;
          </p>

        </div>

      </motion.div>

    </div>

  </div>

  {/* =====================================================
      SLIDER CONTROLS
  ====================================================== */}

  <div className="absolute bottom-8 left-0 right-0 z-30">

    <div className="container-main flex items-center justify-between px-5 sm:px-6">

      {/* =================================================
          PROGRESS / DOTS
      ================================================= */}

      <div className="flex items-center gap-2">

        {heroSlides.map((slide, index) => (

          <button
            key={index}
            type="button"
            aria-label={`Go to slide ${index + 1}`}
            onClick={() => setActiveSlide(index)}
            className="group relative h-2 overflow-hidden rounded-full transition-all duration-300"
            style={{
              width: index === activeSlide ? "42px" : "10px",
              backgroundColor:
                index === activeSlide
                  ? SCHOOL_GOLD
                  : "rgba(255,255,255,0.4)",
            }}
          >

            {index === activeSlide && (
              <motion.span
                initial={{
                  width: "0%",
                }}
                animate={{
                  width: "100%",
                }}
                transition={{
                  duration: 6,
                  ease: "linear",
                }}
                className="absolute inset-y-0 left-0 bg-white/30"
              />
            )}

          </button>

        ))}

      </div>

      {/* =================================================
          SLIDE COUNTER
      ================================================= */}

      <div className="mr-auto ml-6 hidden items-center gap-2 text-xs font-bold text-white/60 sm:flex">

        <span className="text-white">
          {String(activeSlide + 1).padStart(2, "0")}
        </span>

        <span>/</span>

        <span>
          {String(heroSlides.length).padStart(2, "0")}
        </span>

      </div>

      {/* =================================================
          ARROWS
      ================================================= */}

      <div className="flex gap-2">

        <button
          type="button"
          onClick={previousSlide}
          aria-label="Previous slide"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/20 text-white backdrop-blur-md transition-all duration-300 hover:bg-white hover:text-[#010066]"
        >
          <ChevronLeft size={18} />
        </button>

        <button
          type="button"
          onClick={nextSlide}
          aria-label="Next slide"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/20 text-white backdrop-blur-md transition-all duration-300 hover:bg-white hover:text-[#010066]"
        >
          <ChevronRight size={18} />
        </button>

      </div>

    </div>

  </div>

  {/* =====================================================
      GOLD BOTTOM LINE
  ====================================================== */}

  <div
    className="absolute bottom-0 left-0 z-30 h-1 w-full"
    style={{
      backgroundColor: SCHOOL_GOLD,
    }}
  />

</section> 

      {/* =========================================================
          INTRO / VISUAL STRIP
      ========================================================== */}

      <section className="bg-white py-16 sm:py-20">
        <div className="container-main px-5 sm:px-6">
          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                number: "01",
                title: "Learn",
                text: "Building strong academic foundations.",
              },
              {
                number: "02",
                title: "Believe",
                text: "Growing through faith and Islamic values.",
              },
              {
                number: "03",
                title: "Become",
                text: "Developing responsible future leaders.",
              },
            ].map((item, index) => (
              <motion.div
                key={item.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.08,
                }}
                className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(1,0,102,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(1,0,102,0.1)]"
              >
                <span
                  className="text-4xl font-black"
                  style={{ color: `${SCHOOL_BLUE}10` }}
                >
                  {item.number}
                </span>

                <h3
                  className="mt-3 text-xl font-bold"
                  style={{ color: SCHOOL_BLUE_DARK }}
                >
                  {item.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {item.text}
                </p>

                <div
                  className="absolute bottom-0 left-0 h-1 w-0 transition-all duration-500 group-hover:w-full"
                  style={{ backgroundColor: SCHOOL_GOLD }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          WELCOME + IMAGE
      ========================================================== */}

      <section className="bg-slate-50 py-20 sm:py-24 lg:py-28">
        <div className="container-main px-5 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
            {/* Images */}

            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="relative mt-10 aspect-[3/4] overflow-hidden rounded-[2rem]">
                  <Image
                    src="/images/school-2.jpg"
                    alt="Students at MSSN Al-Irshad Model School"
                    fill
                    sizes="(max-width: 1024px) 45vw, 300px"
                    className="object-cover transition-transform duration-700 hover:scale-105"
                  />
                </div>

                <div className="relative aspect-[3/4] overflow-hidden rounded-[2rem]">
                  <Image
                    src="/images/images-1.jpg"
                    alt="School activities"
                    fill
                    sizes="(max-width: 1024px) 45vw, 300px"
                    className="object-cover transition-transform duration-700 hover:scale-105"
                  />
                </div>
              </div>

              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 rounded-2xl border border-white bg-white px-5 py-3 shadow-xl">
                <p
                  className="text-center text-xs font-bold"
                  style={{ color: SCHOOL_BLUE }}
                >
                  Education with Purpose
                </p>
              </div>
            </motion.div>

            {/* Text */}

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-[0.23em]"
                style={{ color: SCHOOL_GOLD }}
              >
                Welcome to Al-Irshad
              </p>

              <h2
                className="mt-4 text-3xl font-black tracking-[-0.04em] sm:text-4xl lg:text-5xl"
                style={{ color: SCHOOL_BLUE_DARK }}
              >
                More than a school.
                <br />
                <span style={{ color: SCHOOL_BLUE }}>
                  A foundation for life.
                </span>
              </h2>

              <p className="mt-6 text-sm leading-7 text-slate-500 sm:text-base sm:leading-8">
                At MSSN Al-Irshad Model School, we believe education should
                develop the complete individual. Our learning environment
                brings together academic excellence, Islamic guidance,
                discipline, confidence and character.
              </p>

              <p className="mt-4 text-sm leading-7 text-slate-500 sm:text-base">
                Every learner is given the opportunity to discover their
                abilities, build meaningful relationships and prepare for a
                purposeful future.
              </p>

              <Link
                href="/about"
                className="group mt-7 inline-flex items-center gap-2 text-sm font-bold"
                style={{ color: SCHOOL_BLUE }}
              >
                Learn more about our school

                <ArrowRight
                  size={16}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* =========================================================
          FOUNDATION
      ========================================================== */}

      <section className="bg-white py-20 sm:py-24">
        <div className="container-main px-5 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.23em]"
              style={{ color: SCHOOL_GOLD }}
            >
              Our Foundation
            </p>

            <h2
              className="mt-3 text-3xl font-black sm:text-4xl"
              style={{ color: SCHOOL_BLUE_DARK }}
            >
              What shapes our education
            </h2>

            <p className="mt-4 text-sm leading-7 text-slate-500">
              The principles that guide our approach to teaching, learning and
              student development.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <motion.article
                  key={feature.title}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.55,
                    delay: index * 0.08,
                  }}
                  className="group rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_8px_30px_rgba(1,0,102,0.04)] transition-all duration-300 hover:-translate-y-2 hover:border-[#010066]/20 hover:shadow-[0_25px_55px_rgba(1,0,102,0.1)]"
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
                    {feature.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    {feature.text}
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
          SCHOOL GALLERY
      ========================================================== */}

      <section className="bg-[#00004D] py-20 sm:py-24">
        <div className="container-main px-5 sm:px-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.23em] text-[#FFAF2E]">
                School Life
              </p>

              <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
                See our school in action.
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-7 text-white/55">
                Explore moments from our learning environment, activities and
                school community.
              </p>
            </div>

            <Link
              href="/gallery"
              className="group inline-flex items-center gap-2 text-sm font-bold text-[#FFAF2E]"
            >
              View full gallery

              <ArrowRight
                size={16}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
            {galleryImages.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.55,
                  delay: index * 0.08,
                }}
                className={`group relative overflow-hidden rounded-3xl ${
                  index === 0
                    ? "aspect-3/4"
                    : index === 1
                      ? "mt-8 aspect-3/4"
                      : index === 2
                        ? "aspect-3/4"
                        : "mt-8 aspect-3/4"
                }`}
              >
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#00004D]/80 via-transparent to-transparent opacity-80" />

                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-xs font-bold text-white">
                    {item.title}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          MANAGEMENT / STAFF / NEWS
      ========================================================== */}

      <section className="bg-white py-20 sm:py-24">
        <div className="container-main px-5 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.23em]"
              style={{ color: SCHOOL_GOLD }}
            >
              Explore
            </p>

            <h2
              className="mt-3 text-3xl font-black sm:text-4xl"
              style={{ color: SCHOOL_BLUE_DARK }}
            >
              Discover our school community.
            </h2>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {quickLinks.map((item, index) => {
              const Icon = item.icon;

              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.08,
                  }}
                >
                  <Link
                    href={item.href}
                    className="group block overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_8px_30px_rgba(1,0,102,0.04)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_25px_55px_rgba(1,0,102,0.1)]"
                  >
                    {/* Visual placeholder */}

                    <div className="relative h-44 overflow-hidden bg-slate-100">
                      <Image
                        src={
                          index === 0
                            ? "/images/administrator.png"
                            : index === 1
                              ? "/images/High-School-Teacher.jpg"
                              : "/images/student-with-pc.jpg"
                        }
                        alt={item.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />

                      <div className="absolute inset-0 bg-[#00004D]/20 transition-colors group-hover:bg-[#00004D]/35" />

                      <div className="absolute left-5 top-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 text-[#010066] backdrop-blur-sm">
                        <Icon size={19} />
                      </div>

                      <div className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-[#FFAF2E] text-[#00004D]">
                        <ArrowUpRight size={16} />
                      </div>
                    </div>

                    <div className="p-6">
                      <h3
                        className="text-lg font-bold"
                        style={{ color: SCHOOL_BLUE_DARK }}
                      >
                        {item.title}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {item.text}
                      </p>

                      <div
                        className="mt-5 flex items-center gap-2 text-xs font-bold"
                        style={{ color: SCHOOL_BLUE }}
                      >
                        Explore

                        <ArrowRight
                          size={14}
                          className="transition-transform duration-300 group-hover:translate-x-1"
                        />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================
          MISSION / VISION
      ========================================================== */}

      <section className="bg-slate-50 py-20 sm:py-24">
        <div className="container-main px-5 sm:px-6">
          <div className="grid gap-5 md:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -25 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative overflow-hidden rounded-4xl bg-[#010066] p-8 sm:p-10"
            >
              <Sparkles
                className="absolute right-8 top-8 opacity-10"
                size={80}
                color="white"
              />

              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#FFAF2E]">
                Our Vision
              </p>

              <h5 className="mt-4 text-2xl font-black text-white">
                To become a leading islamic school in the Nation (In Shaa Allah) which shall uphold; 
                the Qur&#39;an and Sunnah of the holy Prophet Muhammad in accordance with the understanding of
                the Salaf.
              </h5>

              {/* <p className="mt-5 text-sm leading-7 text-white/65">
                To become a leading islamic school in the Nation (In Shaa Allah) which shall uphold; 
                the Qur&#39;an and Sunnah of the holy Prophet Muhammad in accordance with the understanding of
                the Salaf.
              </p> */}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 25 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm sm:p-10"
            >
              <div
                className="absolute right-0 top-0 h-32 w-32 rounded-bl-full"
                style={{
                  backgroundColor: `${SCHOOL_GOLD}12`,
                }}
              />

              <p
                className="text-[10px] font-bold uppercase tracking-[0.22em]"
                style={{ color: SCHOOL_GOLD }}
              >
                Our Mission
              </p>

              <h5
                className="mt-4 text-2xl font-black"
                style={{ color: SCHOOL_BLUE_DARK }}
              >
                 To provide a balanced education at affordable costs without compromising standard.
              </h5>

              {/* <p className="mt-5 text-sm leading-7 text-slate-500">
               To provide a balanced education at affordable costs without compromising standard
              </p> */}
            </motion.div>
          </div>
        </div>
      </section>

      {/* =========================================================
          PORTALS
      ========================================================== */}

      <section className="bg-white py-20 sm:py-24">
        <div className="container-main px-5 sm:px-6">
          <div className="grid gap-5 md:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-[2rem] bg-[#010066] p-8 sm:p-10"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                Student Access
              </p>

              <h3 className="mt-3 text-2xl font-black text-white">
                Student Portal
              </h3>

              <p className="mt-3 max-w-md text-sm leading-7 text-white/60">
                Access your student account and available school resources.
              </p>

              <Link
                href="/student-login"
                className="group mt-7 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-[#010066] transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                Enter Student Portal

                <ArrowUpRight
                  size={15}
                  className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="rounded-[2rem] border border-slate-200 bg-slate-50 p-8 sm:p-10"
            >
              <p
                className="text-[10px] font-bold uppercase tracking-[0.2em]"
                style={{ color: SCHOOL_GOLD }}
              >
                Staff Access
              </p>

              <h3
                className="mt-3 text-2xl font-black"
                style={{ color: SCHOOL_BLUE_DARK }}
              >
                Staff Portal
              </h3>

              <p className="mt-3 max-w-md text-sm leading-7 text-slate-500">
                Secure access for staff to relevant school resources and
                services.
              </p>

              <Link
                href="/staff-login"
                className="group mt-7 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white transition-all hover:-translate-y-1 hover:shadow-xl"
                style={{ backgroundColor: SCHOOL_BLUE }}
              >
                Enter Staff Portal

                <ArrowUpRight
                  size={15}
                  className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* =========================================================
          FINAL CTA
      ========================================================== */}

      <section className="relative overflow-hidden bg-[#00004D] py-20 sm:py-28">
        <div
          aria-hidden="true"
          className="absolute -right-20 -top-20 h-80 w-80 rounded-full blur-3xl"
          style={{
            backgroundColor: `${SCHOOL_GOLD}15`,
          }}
        />

        <div
          aria-hidden="true"
          className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-white/5 blur-3xl"
        />

        <div className="container-main relative z-10 px-5 text-center sm:px-6">
          <Images
            className="mx-auto text-[#FFAF2E]"
            size={30}
          />

          <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.25em] text-[#FFAF2E]">
            Begin the Journey
          </p>

          <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-black tracking-[-0.04em] text-white sm:text-5xl">
            Give your child a foundation for a meaningful future.
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/60 sm:text-base">
            Discover an educational environment where knowledge, Islamic
            values and character development work together.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/admissions"
              className="group inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-bold transition-all hover:-translate-y-1 hover:shadow-xl"
              style={{
                backgroundColor: SCHOOL_GOLD,
                color: SCHOOL_BLUE_DARK,
              }}
            >
              Apply for Admission

              <ArrowUpRight
                size={16}
                className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </Link>

            <Link
              href="/contact"
              className="group inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-7 py-3 text-sm font-bold text-white backdrop-blur-sm transition-all hover:-translate-y-1 hover:bg-white hover:text-[#010066]"
            >
              Contact the School

              <ArrowUpRight
                size={16}
                className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}