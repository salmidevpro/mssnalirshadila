export const siteConfig = {
  name: "MSSN Al-Irshad Model School",
  shortName: "Al-Irshad Model School",
  location: "Ila Orangun, Nigeria",

  description:
    "MSSN Al-Irshad Model School is committed to providing quality education rooted in Islamic values, character development and academic excellence.",

  url: "https://example.com",

  navigation: [
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
     {
      label: "E-Library",
      href: "/e-library",
    },
  ],

  portalNavigation: [
    {
      label: "Student Portal",
      href: "/student-login",
      description: "Access student services and resources.",
    },
    {
      label: "Staff Portal",
      href: "/staff-login",
      description: "Secure access to staff services and resources.",
    },
  ],

  footerLinks: [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "About Us",
      href: "/about",
    },
    {
      label: "FAQ",
      href: "/faq",
    },
  ],

  socialLinks: [
    {
      label: "Facebook",
      href: "#",
    },
    {
      label: "Instagram",
      href: "#",
    },
    {
      label: "YouTube",
      href: "#",
    },
    {
      label: "TikTok",
      href: "#",
    },
  ],

  mission:
    "To provide an excellent and holistic educational experience that nurtures knowledgeable, responsible and morally upright individuals through quality learning grounded in Islamic values.",

  vision:
    "To raise a generation of intellectually capable, spiritually grounded and socially responsible individuals who will positively contribute to the development of the Ummah and the wider world.",
} as const;

export const SCHOOL_BLUE = "#010066";

export const SCHOOL_BLUE_DARK = "#00004D";

export const SCHOOL_GOLD = "#FFAF2E";