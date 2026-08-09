import type { CV } from "./types";

export const cv: CV = {
  profile: {
    name: "Amirudin Ridwan",
    role: "Senior Mobile & Web Engineer",
    tagline:
      "Architecting offline-first mobile & web apps that power real businesses — from POS systems to globally monetized utility apps.",
    location: "Blitar, East Java, Indonesia",
    availability: "Open to relocation worldwide",
    email: "amirudinridwan99@gmail.com",
  },
  socials: [
    {
      platform: "GitHub",
      label: "@amirudinR",
      url: "https://github.com/amirudinR",
    },
    {
      platform: "LinkedIn",
      label: "Amirudin Ridwan",
      url: "https://www.linkedin.com/in/amirudin-ridwan-725b901ba/",
    },
    {
      platform: "Google Play",
      label: "Published Apps",
      url: "https://play.google.com/store/apps/dev?id=5627377990901054380",
    },
    {
      platform: "Instagram",
      label: "@am1red",
      url: "https://www.instagram.com/am1red/",
    },
  ],
  about: {
    bio: [
      "I'm a senior-level Mobile & Web Engineer specializing in React Native, Kotlin, and TypeScript with a strong owner mindset. I've architected, developed, and deployed robust B2B and consumer applications — including full-scale Point of Sale (POS) and inventory management systems used in real business operations.",
      "My sweet spot is the hard stuff: offline-first architecture, complex state management, and real-time data synchronization — from thermal printer integrations and local PDF invoicing to WhatsApp business automation.",
      "Beyond shipping apps, I'm deep into AI automation and agentic workflows, building tools that let small teams punch far above their weight.",
    ],
    stats: [
      { label: "Years in Tech", value: "4+" },
      { label: "Apps Published", value: "4+" },
      { label: "Avg. App Rating", value: "4.6" },
      { label: "Hardware Downtime Cut", value: "40%" },
    ],
    currentFocus:
      "Leading engineering at PT Poros Digital — scaling Poros POS & Inventory — while exploring AI automation and agentic workflows.",
  },
  experience: [
    {
      id: "exp-1",
      company: "PT Poros Digital",
      role: "Founder & Lead Mobile Engineer",
      start: "Jan 2026",
      end: null,
      location: "Blitar, East Java",
      summary:
        "Founding engineer building Poros POS & Inventory — a full-scale, offline-first B2B retail platform.",
      achievements: [
        "Architected Poros POS (Point of Sale & Inventory), a highly-optimized full-scale B2B application.",
        "Engineered real-time inventory tracking, complex offline-first capabilities, and reliable SQLite/Room hardware synchronization.",
        "Integrated deep hardware peripherals, automatic local PDF invoice generation, and automated notifications via the WhatsApp Business API.",
      ],
      tech: ["React Native", "Kotlin", "Offline-First", "SQLite", "n8n", "WhatsApp API"],
    },
    {
      id: "exp-2",
      company: "Independent Global Releases",
      role: "React Native & Android Developer (Creator)",
      start: "Jan 2025",
      end: null,
      location: "Remote / Global",
      summary:
        "Designing, launching, and monetizing consumer utility apps on the Google Play Store.",
      achievements: [
        "Designed and launched Equalizer, a system-level audio enhancement utility monetized globally with AdMob integrations.",
        "Created MindLog, a mobile diary app with advanced voice-to-text algorithms interacting directly with device hardware and Firebase cloud sync.",
        "Published Flashlight Pro, an extremely lightweight, hardware-centric utility built on Camera and LED SDKs with near-zero latency.",
      ],
      tech: ["React Native", "Android SDK", "Audio APIs", "Firebase", "AdMob", "Speech-to-Text"],
    },
    {
      id: "exp-3",
      company: "SMA & SMP Budi Luhur",
      role: "IT Infrastructure & Hardware Manager",
      start: "Jun 2021",
      end: "Aug 2025",
      location: "Samarinda, East Kalimantan",
      summary:
        "Owned technical operations for a school network serving 200+ active daily students and faculty.",
      achievements: [
        "Supervised technical operations, local school servers, network routing infrastructure, and physical workstation maintenance.",
        "Implemented streamlined systems maintenance procedures, slashing general hardware downtime by over 40%.",
      ],
      tech: ["IT Infrastructure", "Server Management", "Network Administration", "Hardware Diagnostics"],
    },
  ],
  skills: [
    {
      category: "Mobile",
      skills: [
        { name: "React Native", level: 3 },
        { name: "Kotlin", level: 3 },
        { name: "Android SDK", level: 3 },
        { name: "Offline-First Architecture", level: 3 },
        { name: "Mobile Hardware Integration", level: 2 },
      ],
    },
    {
      category: "Web",
      skills: [
        { name: "TypeScript", level: 3 },
        { name: "React.js", level: 3 },
        { name: "JavaScript (ES6+)", level: 3 },
        { name: "HTML5 / CSS3", level: 3 },
        { name: "Tailwind CSS", level: 3 },
      ],
    },
    {
      category: "Backend & Cloud",
      skills: [
        { name: "SQLite & Room", level: 3 },
        { name: "Firebase", level: 2 },
        { name: "Supabase", level: 2 },
        { name: "RESTful APIs", level: 2 },
        { name: "GraphQL", level: 1 },
      ],
    },
    {
      category: "Tools & Workflow",
      skills: [
        { name: "Git & GitHub", level: 3 },
        { name: "ESLint / Prettier", level: 3 },
        { name: "GitHub Actions", level: 2 },
        { name: "n8n Automation", level: 2 },
        { name: "Figma UI/UX", level: 2 },
      ],
    },
  ],
  projects: [
    {
      id: "proj-1",
      title: "Poros POS & Inventory",
      summary:
        "Offline-first B2B retail POS platform with real-time inventory tracking, thermal printer integration, and automated WhatsApp invoice dispatch.",
      tech: ["React Native", "Kotlin", "SQLite", "n8n", "WhatsApp API"],
      year: "2026",
      featured: true,
      mockupType: "pos",
      challenge:
        "Keep daily retail operations dependable across unstable or unavailable network conditions.",
      engineering:
        "Designed an offline-first transaction flow around local persistence, queued synchronization, hardware-aware printing, and automated invoice delivery.",
      impact: [
        "Continuous operation in low-connectivity rural regions",
        "Automatic thermal printer & PDF invoice sync",
        "Sub-second automated WhatsApp receipts",
      ],
    },
    {
      id: "proj-2",
      title: "Equalizer Sound Utility",
      summary:
        "System-grade multi-band audio customizer for Android with real-time low-latency DSP, monetized globally via AdMob — rated 4.6+ on Google Play.",
      tech: ["Kotlin", "Android Audio SDK", "AdMob"],
      liveUrl: "https://play.google.com/store/apps/dev?id=5627377990901054380",
      repoUrl: "https://github.com/amirudinR/ikanequalizer",
      year: "2025",
      featured: true,
      mockupType: "equalizer",
      challenge:
        "Deliver responsive system-level audio controls without adding perceptible latency or a heavy user experience.",
      engineering:
        "Built a native Kotlin audio pipeline around Android audio APIs with real-time band controls and a production AdMob monetization flow.",
      impact: [
        "4.6+ rating on Google Play",
        "Real-time low-latency DSP rendering",
        "AdMob banner & interstitial monetization flow",
      ],
    },
    {
      id: "proj-3",
      title: "MindLog AI Diary",
      summary:
        "Voice-first journaling app with speech-to-text capture, offline logging, and seamless Firebase cross-device sync.",
      tech: ["React Native", "Voice-to-Text", "Firebase"],
      liveUrl: "https://play.google.com/store/apps/dev?id=5627377990901054380",
      year: "2025",
      featured: false,
      mockupType: "mindlog",
      impact: [
        "Voice-to-text with on-device capture",
        "Automatic entry categorization with offline cache",
        "Reliable cross-device Firebase sync",
      ],
    },
    {
      id: "proj-4",
      title: "Flashlight Pro Extreme",
      summary:
        "Latency-free LED utility with a Morse code engine, strobing controls, and zero unnecessary background battery drain.",
      tech: ["Android SDK", "CameraManager API"],
      liveUrl: "https://play.google.com/store/apps/dev?id=5627377990901054380",
      year: "2025",
      featured: false,
      mockupType: "flashlight",
      impact: [
        "Near-zero hardware response latency",
        "Morse code strobe engine included",
        "Zero unnecessary background execution",
      ],
    },
    {
      id: "proj-5",
      title: "9router",
      summary:
        "Open-source JavaScript project published under the MIT license.",
      tech: ["JavaScript", "Open Source", "MIT"],
      repoUrl: "https://github.com/amirudinR/9router",
      year: "2026",
      featured: false,
    },
    {
      id: "proj-6",
      title: "Avataraang",
      summary:
        "Interactive web experience built with JavaScript and deployed on Vercel.",
      tech: ["JavaScript", "Vercel"],
      liveUrl: "https://avataraang.vercel.app",
      repoUrl: "https://github.com/amirudinR/Avataraang",
      year: "2026",
      featured: false,
    },
  ],
  education: [
    {
      id: "edu-1",
      institution: "STMIK Widya Cipta Dharma",
      degree: "Bachelor's Degree (S.Kom)",
      field: "Informatics Engineering",
      start: "Aug 2021",
      end: "Aug 2025",
      honors: "GPA 3.54/4.00 · Cum Laude",
    },
  ],
};
