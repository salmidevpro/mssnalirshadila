"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  BookMarked,
  Brain,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Globe2,
  GraduationCap,
  Library,
  Menu,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useMemo, useState } from "react";

const SCHOOL_BLUE = "#010066";
const SCHOOL_BLUE_DARK = "#00004D";
const SCHOOL_GOLD = "#FFAF2E";

type Resource = {
  name: string;
  category: string;
  description: string;
  url: string;
  subjects: string[];
  badge: string;
  featured?: boolean;
};

const resources: Resource[] = [
  {
    name: "Khan Academy",
    category: "Lessons & Practice",
    description:
      "Free lessons, videos, exercises and practice materials covering Mathematics, Science and Computer Science.",
    url: "https://www.khanacademy.org",
    subjects: [
      "Mathematics",
      "Physics",
      "Chemistry",
      "Biology",
      "Computer Science",
    ],
    badge: "Popular",
    featured: true,
  },
  {
    name: "OpenStax",
    category: "Free Textbooks",
    description:
      "Open-access textbooks and learning materials covering Mathematics, Biology, Chemistry, Physics and more.",
    url: "https://openstax.org",
    subjects: ["Mathematics", "Physics", "Chemistry", "Biology"],
    badge: "Textbooks",
    featured: true,
  },
  {
    name: "Siyavula",
    category: "Practice & Science",
    description:
      "Free Mathematics and Science learning resources and practice materials for secondary-level learners.",
    url: "https://www.siyavula.com",
    subjects: ["Mathematics", "Physics", "Chemistry", "Biology"],
    badge: "Science",
    featured: true,
  },
  {
    name: "Project Gutenberg",
    category: "Books & Literature",
    description:
      "A large collection of free ebooks and classic literature available to read online.",
    url: "https://www.gutenberg.org",
    subjects: ["English", "Literature", "History"],
    badge: "10,000+ Books",
    featured: true,
  },
  {
    name: "African Storybook",
    category: "African Reading",
    description:
      "Free storybooks created for African children and learners, available in multiple African languages.",
    url: "https://www.africanstorybook.org",
    subjects: ["English", "Yoruba", "Hausa", "Igbo", "Literature"],
    badge: "African Stories",
  },
  {
    name: "Worldreader",
    category: "Digital Reading",
    description:
      "A digital reading platform providing access to books and educational reading materials.",
    url: "https://www.worldreader.org/read",
    subjects: ["English", "Literature", "General Reading"],
    badge: "Mobile Friendly",
  },
  {
    name: "Nigerian Virtual Library",
    category: "Nigeria Resources",
    description:
      "A Nigerian digital library providing access to educational and academic resources.",
    url: "https://nvlng.org",
    subjects: ["General Studies", "Research", "Education"],
    badge: "Nigeria",
  },
  {
    name: "TRCN Digital Library",
    category: "Teaching Resources",
    description:
      "Digital teaching and learning resources for educators and educational communities.",
    url: "https://library.trcn.gov.ng",
    subjects: ["Education", "Teaching", "Research"],
    badge: "Education",
  },
];

const subjects = [
  {
    name: "Mathematics",
    category: "Science",
    icon: "∑",
    description: "Numbers, algebra, geometry, statistics and problem solving.",
  },
  {
    name: "Physics",
    category: "Science",
    icon: "⚛",
    description: "Motion, energy, forces, electricity, waves and matter.",
  },
  {
    name: "Chemistry",
    category: "Science",
    icon: "⚗",
    description: "Matter, reactions, atoms, compounds and chemical processes.",
  },
  {
    name: "Biology",
    category: "Science",
    icon: "🧬",
    description: "Living organisms, cells, ecology, genetics and life processes.",
  },
  {
    name: "Computer Science",
    category: "Science",
    icon: "</>",
    description: "Computing, programming, algorithms and digital technology.",
  },
  {
    name: "English",
    category: "Arts",
    icon: "Aa",
    description: "Grammar, comprehension, vocabulary, writing and communication.",
  },
  {
    name: "Literature",
    category: "Arts",
    icon: "📖",
    description: "Novels, drama, poetry, African literature and literary studies.",
  },
  {
    name: "Government",
    category: "Arts",
    icon: "⚖",
    description: "Politics, governance, democracy, institutions and citizenship.",
  },
  {
    name: "History",
    category: "Arts",
    icon: "⌛",
    description: "African, Nigerian and world history and historical events.",
  },
  {
    name: "Geography",
    category: "Arts",
    icon: "🌍",
    description: "People, places, environment, maps and physical geography.",
  },
  {
    name: "Economics",
    category: "Commercial",
    icon: "₦",
    description: "Markets, production, demand, supply and economic systems.",
  },
  {
    name: "Accounting",
    category: "Commercial",
    icon: "▤",
    description: "Bookkeeping, financial records, accounts and business finance.",
  },
  {
    name: "Commerce",
    category: "Commercial",
    icon: "◫",
    description: "Trade, business activities, marketing and commercial operations.",
  },
  {
    name: "Arabic",
    category: "Languages",
    icon: "ع",
    description: "Arabic language, reading, writing and vocabulary.",
  },
  {
    name: "Yoruba",
    category: "Languages",
    icon: "Ọ",
    description: "Yoruba language, literature, culture and communication.",
  },
  {
    name: "Hausa",
    category: "Languages",
    icon: "HA",
    description: "Hausa language, reading, writing and cultural studies.",
  },
  {
    name: "Igbo",
    category: "Languages",
    icon: "IG",
    description: "Igbo language, literature, culture and communication.",
  },
  {
    name: "Islamic Studies",
    category: "Islamic Studies",
    icon: "☪",
    description: "Islamic knowledge, history, ethics, worship and values.",
  },
];

const subjectCategories = [
  "All",
  "Science",
  "Arts",
  "Commercial",
  "Languages",
  "Islamic Studies",
];

const categoryColors: Record<string, string> = {
  Science: "bg-blue-50 text-blue-700 border-blue-100",
  Arts: "bg-purple-50 text-purple-700 border-purple-100",
  Commercial: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Languages: "bg-orange-50 text-orange-700 border-orange-100",
  "Islamic Studies": "bg-teal-50 text-teal-700 border-teal-100",
};

export default function ELibraryPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const filteredSubjects = useMemo(() => {
    const query = search.toLowerCase().trim();

    return subjects.filter((subject) => {
      const matchesCategory =
        activeCategory === "All" || subject.category === activeCategory;

      const matchesSearch =
        !query ||
        subject.name.toLowerCase().includes(query) ||
        subject.category.toLowerCase().includes(query) ||
        subject.description.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [search, activeCategory]);

  const filteredResources = useMemo(() => {
    const query = search.toLowerCase().trim();

    return resources.filter((resource) => {
      if (!query) return true;

      return (
        resource.name.toLowerCase().includes(query) ||
        resource.category.toLowerCase().includes(query) ||
        resource.description.toLowerCase().includes(query) ||
        resource.subjects.some((subject) =>
          subject.toLowerCase().includes(query),
        )
      );
    });
  }, [search]);

  const scrollToSubjects = () => {
    document
      .getElementById("subjects")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="min-h-screen overflow-hidden bg-white">
      {/* =========================================================
          HERO
      ========================================================== */}

      <section className="relative overflow-hidden bg-[#00004D] pt-28 sm:pt-32 lg:pt-36">
        {/* Decorative elements */}

        <div
          aria-hidden="true"
          className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full blur-3xl"
          style={{
            backgroundColor: `${SCHOOL_GOLD}12`,
          }}
        />

        <div
          aria-hidden="true"
          className="absolute -bottom-40 -left-40 h-[450px] w-[450px] rounded-full bg-white/[0.03] blur-3xl"
        />

        <div
          aria-hidden="true"
          className="absolute right-[15%] top-[35%] h-32 w-32 rounded-full border border-white/5"
        />

        <div className="container-main relative z-10 px-5 pb-20 sm:px-6 sm:pb-24 lg:pb-28">
          <div className="mx-auto max-w-4xl text-center">
            {/* Breadcrumb */}

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8 flex items-center justify-center gap-2 text-xs text-white/40"
            >
              <Link href="/" className="transition-colors hover:text-white">
                Home
              </Link>

              <ChevronRight size={13} />

              <span className="text-white/70">E-Library</span>
            </motion.div>

            {/* Icon */}

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.6,
                delay: 0.1,
              }}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-[#FFAF2E] shadow-2xl backdrop-blur-md"
            >
              <Library size={30} />
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: 0.2,
              }}
              className="mt-6 text-[10px] font-bold uppercase tracking-[0.3em] text-[#FFAF2E]"
            >
              MSSN Al-Irshad Model School
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.25,
              }}
              className="mt-4 text-4xl font-black tracking-[-0.05em] text-white sm:text-6xl lg:text-7xl"
            >
              Your Digital
              <br />
              <span className="text-[#FFAF2E]">Learning Library.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: 0.35,
              }}
              className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-white/60 sm:text-base sm:leading-8"
            >
              Explore trusted free educational resources, digital textbooks,
              video lessons, practice materials and reading resources for
              students.
            </motion.p>

            {/* Search */}

            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.45,
              }}
              className="mx-auto mt-9 max-w-2xl"
            >
              <div className="relative">
                <Search
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
                  size={20}
                />

                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search subjects, resources or platforms..."
                  className="h-16 w-full rounded-2xl border border-white/10 bg-white px-14 pr-12 text-sm text-slate-800 outline-none shadow-2xl transition-all placeholder:text-slate-400 focus:ring-4 focus:ring-[#FFAF2E]/20"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                    className="absolute right-5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </motion.div>

            {/* Stats */}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.55,
              }}
              className="mx-auto mt-10 grid max-w-xl grid-cols-3 divide-x divide-white/10"
            >
              <div>
                <p className="text-2xl font-black text-white">
                  {subjects.length}+
                </p>
                <p className="mt-1 text-[10px] uppercase tracking-wider text-white/35">
                  Subjects
                </p>
              </div>

              <div>
                <p className="text-2xl font-black text-white">
                  {resources.length}
                </p>
                <p className="mt-1 text-[10px] uppercase tracking-wider text-white/35">
                  Resources
                </p>
              </div>

              <div>
                <p className="text-2xl font-black text-white">Free</p>
                <p className="mt-1 text-[10px] uppercase tracking-wider text-white/35">
                  Access
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        <div
          className="h-1 w-full"
          style={{
            backgroundColor: SCHOOL_GOLD,
          }}
        />
      </section>

      {/* =========================================================
          CATEGORY FILTER
      ========================================================== */}

      <section className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="container-main px-5 sm:px-6">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="hidden items-center gap-1 overflow-x-auto md:flex">
              {subjectCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition-all ${
                    activeCategory === category
                      ? "bg-[#010066] text-white shadow-md"
                      : "text-slate-500 hover:bg-slate-100 hover:text-[#010066]"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="flex w-full items-center gap-3 md:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-[#010066]"
              >
                <Menu size={15} />
                {activeCategory}
              </button>

              <span className="text-xs text-slate-400">
                {filteredSubjects.length} subjects
              </span>
            </div>

            <button
              type="button"
              onClick={scrollToSubjects}
              className="hidden items-center gap-2 text-xs font-bold text-[#010066] sm:flex"
            >
              Browse Subjects
              <ArrowRight size={14} />
            </button>
          </div>

          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden md:hidden"
              >
                <div className="flex flex-wrap gap-2 pb-4">
                  {subjectCategories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => {
                        setActiveCategory(category);
                        setMobileMenuOpen(false);
                      }}
                      className={`rounded-full px-4 py-2 text-xs font-bold ${
                        activeCategory === category
                          ? "bg-[#010066] text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* =========================================================
          FEATURED RESOURCES
      ========================================================== */}

      <section className="bg-slate-50 py-20 sm:py-24">
        <div className="container-main px-5 sm:px-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p
                className="text-[10px] font-bold uppercase tracking-[0.25em]"
                style={{ color: SCHOOL_GOLD }}
              >
                Start Here
              </p>

              <h2
                className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl"
                style={{ color: SCHOOL_BLUE_DARK }}
              >
                Featured learning resources.
              </h2>

              <p className="mt-3 text-sm leading-7 text-slate-500">
                Carefully selected external platforms where students can
                continue learning beyond the classroom.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck size={15} className="text-[#010066]" />
              Trusted external resources
            </div>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {filteredResources
              .filter((resource) => resource.featured)
              .map((resource, index) => (
                <motion.a
                  key={resource.name}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{
                    duration: 0.55,
                    delay: index * 0.08,
                  }}
                  className="group relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(1,0,102,0.04)] transition-all duration-300 hover:-translate-y-2 hover:border-[#010066]/20 hover:shadow-[0_25px_60px_rgba(1,0,102,0.1)] sm:p-7"
                >
                  <div
                    className="absolute right-0 top-0 h-32 w-32 rounded-bl-full opacity-70"
                    style={{
                      backgroundColor: `${SCHOOL_GOLD}09`,
                    }}
                  />

                  <div className="relative flex items-start justify-between gap-4">
                    <div
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl font-black"
                      style={{
                        backgroundColor: `${SCHOOL_BLUE}08`,
                        color: SCHOOL_BLUE,
                      }}
                    >
                      {resource.name.charAt(0)}
                    </div>

                    <span
                      className="rounded-full px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: `${SCHOOL_GOLD}15`,
                        color: SCHOOL_BLUE_DARK,
                      }}
                    >
                      {resource.badge}
                    </span>
                  </div>

                  <div className="relative mt-6">
                    <div className="flex items-center gap-2">
                      <h3
                        className="text-xl font-black"
                        style={{
                          color: SCHOOL_BLUE_DARK,
                        }}
                      >
                        {resource.name}
                      </h3>

                      <ExternalLink
                        size={15}
                        className="text-slate-300 transition-colors group-hover:text-[#010066]"
                      />
                    </div>

                    <p className="mt-3 text-sm leading-7 text-slate-500">
                      {resource.description}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {resource.subjects.slice(0, 4).map((subject) => (
                        <span
                          key={subject}
                          className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold text-slate-500"
                        >
                          {subject}
                        </span>
                      ))}
                    </div>

                    <div
                      className="mt-6 flex items-center gap-2 text-xs font-bold"
                      style={{
                        color: SCHOOL_BLUE,
                      }}
                    >
                      Explore Resource
                      <ArrowUpRight
                        size={14}
                        className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      />
                    </div>
                  </div>
                </motion.a>
              ))}
          </div>
        </div>
      </section>

       {/* =========================================================
    SUBJECT RESOURCE LIBRARY
========================================================= */}

<section className="bg-white py-20 sm:py-24">
  <div className="container-main px-5 sm:px-6">

    {/* Section Header */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="mx-auto max-w-3xl text-center"
    >
      <p
        className="text-[10px] font-bold uppercase tracking-[0.25em]"
        style={{ color: SCHOOL_GOLD }}
      >
        Explore by Subject
      </p>

      <h2
        className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl"
        style={{ color: SCHOOL_BLUE_DARK }}
      >
        What are you learning today?
      </h2>

      <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
        Search or select a subject to discover learning resources
        available through our external educational partners.
      </p>
    </motion.div>

    {/* Subject Cards */}

    <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

      {[
        {
          subject: "Mathematics",
          category: "Science & Mathematics",
          description:
            "Explore lessons, exercises and practice materials for mathematics.",
          icon: "📐",
          href: "https://www.khanacademy.org/math",
        },

        {
          subject: "Physics",
          category: "Science",
          description:
            "Study mechanics, electricity, waves, energy and other physics topics.",
          icon: "⚛️",
          href: "https://www.khanacademy.org/science/physics",
        },

        {
          subject: "Chemistry",
          category: "Science",
          description:
            "Learn chemistry concepts through videos, explanations and exercises.",
          icon: "🧪",
          href: "https://www.khanacademy.org/science/chemistry",
        },

        {
          subject: "Biology",
          category: "Science",
          description:
            "Discover cells, genetics, ecology, human biology and more.",
          icon: "🧬",
          href: "https://www.khanacademy.org/science/biology",
        },

        {
          subject: "Computer Science",
          category: "Technology",
          description:
            "Develop your understanding of programming, computing and technology.",
          icon: "💻",
          href: "https://www.khanacademy.org/computing",
        },

        {
          subject: "English Language",
          category: "Languages",
          description:
            "Improve grammar, vocabulary, reading and communication skills.",
          icon: "📖",
          href: "https://www.khanacademy.org/humanities/grammar",
        },

        {
          subject: "Literature in English",
          category: "Arts & Humanities",
          description:
            "Access classic literature, novels, plays and other reading materials.",
          icon: "📚",
          href: "https://www.gutenberg.org",
        },

        {
          subject: "General Reading",
          category: "Reading Resources",
          description:
            "Discover thousands of books and reading resources for students.",
          icon: "📕",
          href: "https://www.worldreader.org/read",
        },

        {
          subject: "African Literature",
          category: "African Studies",
          description:
            "Read African stories and discover literature from across the continent.",
          icon: "🌍",
          href: "https://www.africanstorybook.org",
        },

        {
          subject: "General Science",
          category: "Science",
          description:
            "Explore free science textbooks and educational materials.",
          icon: "🔬",
          href: "https://openstax.org/subjects/science",
        },

        {
          subject: "Economics",
          category: "Commercial",
          description:
            "Build your understanding of economics, markets and financial concepts.",
          icon: "📊",
          href: "https://www.khanacademy.org/economics-finance-domain",
        },

        {
          subject: "General Learning",
          category: "Academic Resources",
          description:
            "Explore additional academic resources available through the Nigeria Virtual Library.",
          icon: "🎓",
          href: "https://nvlng.org",
        },
      ].map((item, index) => (
        <motion.a
          key={item.subject}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{
            duration: 0.5,
            delay: index * 0.04,
          }}
          className="group relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(1,0,102,0.04)] transition-all duration-300 hover:-translate-y-2 hover:border-[#010066]/20 hover:shadow-[0_22px_50px_rgba(1,0,102,0.1)]"
        >
          {/* Decorative glow */}

          <div
            aria-hidden="true"
            className="absolute -right-10 -top-10 h-24 w-24 rounded-full blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{
              backgroundColor: `${SCHOOL_GOLD}25`,
            }}
          />

          {/* Icon */}

          <div className="relative flex items-start justify-between">

            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-2"
              style={{
                backgroundColor: `${SCHOOL_BLUE}08`,
              }}
            >
              {item.icon}
            </div>

            <div
              className="flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1"
              style={{
                backgroundColor: `${SCHOOL_GOLD}18`,
                color: SCHOOL_BLUE,
              }}
            >
              <ArrowUpRight size={16} />
            </div>
          </div>

          {/* Content */}

          <div className="relative mt-6">

            <span
              className="text-[9px] font-bold uppercase tracking-[0.18em]"
              style={{
                color: SCHOOL_GOLD,
              }}
            >
              {item.category}
            </span>

            <h3
              className="mt-2 text-lg font-black"
              style={{
                color: SCHOOL_BLUE_DARK,
              }}
            >
              {item.subject}
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {item.description}
            </p>

            {/* CTA */}

            <div
              className="mt-5 inline-flex items-center gap-2 text-xs font-bold"
              style={{
                color: SCHOOL_BLUE,
              }}
            >
              Explore Resources

              <ArrowRight
                size={14}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </div>
          </div>

          {/* Bottom accent */}

          <div
            className="absolute bottom-0 left-0 h-1 w-0 transition-all duration-500 group-hover:w-full"
            style={{
              backgroundColor: SCHOOL_GOLD,
            }}
          />
        </motion.a>
      ))}

    </div>

    {/* External resource notice */}

    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mx-auto mt-10 flex max-w-3xl items-start gap-3 rounded-2xl border border-[#010066]/10 bg-[#010066]/[0.03] p-5"
    >
      <div
        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{
          backgroundColor: `${SCHOOL_GOLD}18`,
          color: SCHOOL_BLUE,
        }}
      >
        <ShieldCheck size={17} />
      </div>

      <div>
        <p
          className="text-sm font-bold"
          style={{ color: SCHOOL_BLUE_DARK }}
        >
          Learning resources are provided by external partners
        </p>

        <p className="mt-1 text-xs leading-6 text-slate-500">
          When you select a subject, you will be redirected to the
          educational website providing the resource. The school does
          not host these external materials.
        </p>
      </div>
    </motion.div>

  </div>
</section>

    

      {/* =========================================================
          READING & LITERATURE
      ========================================================== */}

      <section className="bg-[#00004D] py-20 sm:py-24">
        <div className="container-main px-5 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFAF2E]/10 text-[#FFAF2E]">
                <BookMarked size={27} />
              </div>

              <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.25em] text-[#FFAF2E]">
                Reading Corner
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">
                Read. Discover.
                <br />
                <span className="text-[#FFAF2E]">Imagine.</span>
              </h2>

              <p className="mt-5 text-sm leading-7 text-white/55">
                Develop a strong reading culture with free digital storybooks,
                classic literature and mobile-friendly reading resources.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {resources
                .filter(
                  (resource) =>
                    resource.category === "Books & Literature" ||
                    resource.category === "African Reading" ||
                    resource.category === "Digital Reading",
                )
                .map((resource, index) => (
                  <motion.a
                    key={resource.name}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
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
                    }}
                    transition={{
                      duration: 0.5,
                      delay: index * 0.1,
                    }}
                    className="group rounded-3xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#FFAF2E]/30 hover:bg-white/[0.09]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-[#FFAF2E]">
                        <BookOpen size={19} />
                      </div>

                      <ExternalLink
                        size={15}
                        className="text-white/30 transition-colors group-hover:text-[#FFAF2E]"
                      />
                    </div>

                    <h3 className="mt-5 font-bold text-white">
                      {resource.name}
                    </h3>

                    <p className="mt-2 text-xs leading-6 text-white/45">
                      {resource.description}
                    </p>

                    <div className="mt-5 flex items-center gap-2 text-[11px] font-bold text-[#FFAF2E]">
                      Start Reading
                      <ArrowUpRight size={13} />
                    </div>
                  </motion.a>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          NIGERIAN RESOURCES
      ========================================================== */}

      <section className="bg-slate-50 py-20 sm:py-24">
        <div className="container-main px-5 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{
                backgroundColor: `${SCHOOL_BLUE}08`,
                color: SCHOOL_BLUE,
              }}
            >
              <Globe2 size={27} />
            </div>

            <p
              className="mt-6 text-[10px] font-bold uppercase tracking-[0.25em]"
              style={{
                color: SCHOOL_GOLD,
              }}
            >
              Nigeria Focus
            </p>

            <h2
              className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl"
              style={{
                color: SCHOOL_BLUE_DARK,
              }}
            >
              Resources closer to home.
            </h2>

            <p className="mt-4 text-sm leading-7 text-slate-500">
              Explore Nigerian educational resources that can complement
              classroom learning and support teachers and students.
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-4xl gap-5 md:grid-cols-2">
            {resources
              .filter(
                (resource) =>
                  resource.category === "Nigeria Resources" ||
                  resource.category === "Teaching Resources",
              )
              .map((resource, index) => (
                <motion.a
                  key={resource.name}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{
                    opacity: 0,
                    x: index === 0 ? -20 : 20,
                  }}
                  whileInView={{
                    opacity: 1,
                    x: 0,
                  }}
                  viewport={{
                    once: true,
                  }}
                  transition={{
                    duration: 0.6,
                  }}
                  className="group flex gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#010066]/20 hover:shadow-xl sm:p-7"
                >
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                    style={{
                      backgroundColor: `${SCHOOL_GOLD}15`,
                      color: SCHOOL_BLUE,
                    }}
                  >
                    <GraduationCap size={22} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3
                        className="font-black"
                        style={{
                          color: SCHOOL_BLUE_DARK,
                        }}
                      >
                        {resource.name}
                      </h3>

                      <ExternalLink
                        size={13}
                        className="shrink-0 text-slate-300 group-hover:text-[#010066]"
                      />
                    </div>

                    <p className="mt-2 text-xs leading-6 text-slate-500">
                      {resource.description}
                    </p>

                    <p
                      className="mt-4 text-[10px] font-bold"
                      style={{
                        color: SCHOOL_BLUE,
                      }}
                    >
                      Visit Resource →
                    </p>
                  </div>
                </motion.a>
              ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          HOW IT WORKS
      ========================================================== */}

      <section className="bg-white py-20 sm:py-24">
        <div className="container-main px-5 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.25em]"
              style={{
                color: SCHOOL_GOLD,
              }}
            >
              Simple & Easy
            </p>

            <h2
              className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl"
              style={{
                color: SCHOOL_BLUE_DARK,
              }}
            >
              How the E-Library works.
            </h2>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              {
                number: "01",
                icon: Search,
                title: "Find a subject",
                text: "Search for your subject or browse through the available categories.",
              },
              {
                number: "02",
                icon: BookOpen,
                title: "Choose a resource",
                text: "Explore recommended books, lessons, practice materials and learning platforms.",
              },
              {
                number: "03",
                icon: ExternalLink,
                title: "Start learning",
                text: "Click the resource and continue your learning on the external educational website.",
              },
            ].map((step, index) => {
              const Icon = step.icon;

              return (
                <motion.div
                  key={step.number}
                  initial={{
                    opacity: 0,
                    y: 25,
                  }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                  }}
                  viewport={{
                    once: true,
                  }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.1,
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
                      className="flex h-11 w-11 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: `${SCHOOL_GOLD}15`,
                        color: SCHOOL_BLUE,
                      }}
                    >
                      <Icon size={19} />
                    </div>
                  </div>

                  <h3
                    className="mt-6 text-lg font-black"
                    style={{
                      color: SCHOOL_BLUE_DARK,
                    }}
                  >
                    {step.title}
                  </h3>

                  <p className="mt-2 text-sm leading-7 text-slate-500">
                    {step.text}
                  </p>

                  {index < 2 && (
                    <ChevronRight
                      className="absolute -right-4 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white text-slate-300 md:block"
                      size={28}
                    />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================
          TRUST / NOTE
      ========================================================== */}

      <section className="border-y border-slate-200 bg-slate-50 py-14">
        <div className="container-main px-5 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left">
            <div className="flex items-start gap-4">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: `${SCHOOL_BLUE}08`,
                  color: SCHOOL_BLUE,
                }}
              >
                <CheckCircle2 size={20} />
              </div>

              <div>
                <h3
                  className="font-bold"
                  style={{
                    color: SCHOOL_BLUE_DARK,
                  }}
                >
                  Learning beyond the classroom.
                </h3>

                <p className="mt-1 max-w-xl text-xs leading-6 text-slate-500">
                  The E-Library provides links to external educational
                  platforms. Availability, content and policies are managed by
                  those external websites.
                </p>
              </div>
            </div>

            <Link
              href="/"
              className="group inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold transition-all hover:-translate-y-0.5 hover:border-[#010066]/20 hover:shadow-md"
              style={{
                color: SCHOOL_BLUE,
              }}
            >
              Back to School Website
              <ArrowRight
                size={14}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================
          FINAL CTA
      ========================================================== */}

      <section className="relative overflow-hidden bg-[#00004D] py-20 sm:py-24">
        <div
          aria-hidden="true"
          className="absolute -right-32 -top-32 h-80 w-80 rounded-full blur-3xl"
          style={{
            backgroundColor: `${SCHOOL_GOLD}12`,
          }}
        />

        <div
          aria-hidden="true"
          className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-white/[0.03] blur-3xl"
        />

        <div className="container-main relative z-10 px-5 text-center sm:px-6">
          <Sparkles
            size={27}
            className="mx-auto text-[#FFAF2E]"
          />

          <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.25em] text-[#FFAF2E]">
            Keep Learning
          </p>

          <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-black tracking-[-0.04em] text-white sm:text-5xl">
            Knowledge doesn't stop when the school bell rings.
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/55 sm:text-base">
            Explore a world of free educational resources and keep discovering,
            practising and growing wherever you are.
          </p>

          <button
            type="button"
            onClick={scrollToSubjects}
            className="group mt-8 inline-flex min-h-[50px] items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-bold transition-all hover:-translate-y-1 hover:shadow-xl"
            style={{
              backgroundColor: SCHOOL_GOLD,
              color: SCHOOL_BLUE_DARK,
            }}
          >
            Explore Subjects

            <ArrowRight
              size={16}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </button>
        </div>
      </section>
    </main>
  );
}