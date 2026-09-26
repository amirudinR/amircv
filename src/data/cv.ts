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
      label: "in/amirudin-ridwan",
      url: "https://www.linkedin.com/in/amirudin-ridwan-725b901ba/",
    },
    {
      platform: "Google Play",
      label: "10 published apps",
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
      { label: "Apps Published", value: "10" },
      { label: "Top Store Rating", value: "4.3" },
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
        "System-grade multi-band audio customizer for Android with real-time low-latency DSP, monetized globally via AdMob — rated 4.3 on Google Play.",
      tech: ["Kotlin", "Android Audio SDK", "AdMob"],
      liveUrl:
        "https://play.google.com/store/apps/details?id=com.porosdigital.equalizer",
      storeUrl:
        "https://play.google.com/store/apps/details?id=com.porosdigital.equalizer",
      installs: "1K+",
      rating: "4.3",
      repoUrl: "https://github.com/amirudinR/ikanequalizer",
      year: "2025",
      featured: true,
      mockupType: "equalizer",
      challenge:
        "Deliver responsive system-level audio controls without adding perceptible latency or a heavy user experience.",
      engineering:
        "Built a native Kotlin audio pipeline around Android audio APIs with real-time band controls and a production AdMob monetization flow.",
      impact: [
        "4.3 stars from 24 Google Play reviews",
        "1K+ installs on Google Play",
        "Real-time low-latency DSP rendering",
        "AdMob banner & interstitial monetization flow",
      ],
    },
    {
      id: "proj-3",
      title: "Mindlog",
      summary:
        "Voice-first journaling app with speech-to-text capture, offline logging, biometric/PIN entry lock, and Firebase cross-device sync.",
      tech: ["React Native", "Voice-to-Text", "Firebase", "Biometric Lock"],
      liveUrl:
        "https://play.google.com/store/apps/details?id=com.porosdigital.mindlog",
      storeUrl:
        "https://play.google.com/store/apps/details?id=com.porosdigital.mindlog",
      year: "2025",
      featured: false,
      mockupType: "mindlog",
      impact: [
        "Voice-to-text with on-device capture",
        "Biometric and PIN lock for private entries",
        "Reliable cross-device Firebase sync",
      ],
    },
    {
      id: "proj-4",
      title: "Flashlight Pro Extreme",
      summary:
        "Latency-free LED utility with a Morse code engine, strobing controls, and zero unnecessary background battery drain.",
      tech: ["Android SDK", "CameraManager API"],
      liveUrl:
        "https://play.google.com/store/apps/details?id=com.porosdigital.flashlightpro",
      storeUrl:
        "https://play.google.com/store/apps/details?id=com.porosdigital.flashlightpro",
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
      id: "proj-7",
      title: "Tumbas POS & Business",
      summary:
        "All-in-one POS and business management app covering cashier flows, warehouse stock, accounts receivable, and turnover reporting.",
      tech: ["Kotlin", "SQLite", "Bluetooth Printing", "Barcode Scanner"],
      liveUrl:
        "https://play.google.com/store/apps/details?id=com.porosdigital.tumbas",
      storeUrl:
        "https://play.google.com/store/apps/details?id=com.porosdigital.tumbas",
      year: "2026",
      featured: false,
      impact: [
        "Adaptive cashier modes for retail, barbershop, and laundry",
        "Stocktaking, repacking, and low-stock alerts",
        "Daily and monthly turnover & profit-loss reports",
      ],
    },
    {
      id: "proj-8",
      title: "Tracking Actifity",
      summary:
        "Habit and task tracker with mood logging, weekly and monthly progress charts, and scheduled reminders.",
      tech: ["Kotlin", "Notifications", "Charts", "Dark Mode"],
      liveUrl:
        "https://play.google.com/store/apps/details?id=com.porosdigital.trackingactifity",
      storeUrl:
        "https://play.google.com/store/apps/details?id=com.porosdigital.trackingactifity",
      year: "2026",
      featured: false,
      impact: [
        "Daily habit, task, and mood logging in one flow",
        "Weekly and monthly completion statistics",
        "English and Indonesian localization",
      ],
    },
    {
      id: "proj-9",
      title: "Status Saver - WA",
      summary:
        "WhatsApp status saver with a floating capture bubble that auto-files saved photos and videos into per-contact folders on-device.",
      tech: ["Kotlin", "Accessibility API", "Media Storage"],
      liveUrl:
        "https://play.google.com/store/apps/details?id=com.porosdigital.wasaver",
      storeUrl:
        "https://play.google.com/store/apps/details?id=com.porosdigital.wasaver",
      year: "2026",
      featured: false,
      impact: [
        "Floating bubble capture straight from the status screen",
        "Automatic per-contact folders via the Accessibility API",
        "High-resolution image and HD video saving",
      ],
    },
    {
      id: "proj-10",
      title: "Copy Clipboard",
      summary:
        "Offline clipboard history app that captures copied text in the background and makes it searchable, pinnable, and categorisable.",
      tech: ["Kotlin", "ClipboardManager", "Room"],
      liveUrl:
        "https://play.google.com/store/apps/details?id=com.amir.copyclipboard",
      storeUrl:
        "https://play.google.com/store/apps/details?id=com.amir.copyclipboard",
      year: "2026",
      featured: false,
      impact: [
        "Background clipboard capture with no paste required",
        "Real-time search across saved clips",
        "Pinning and colour-coded categories, stored offline",
      ],
    },
    {
      id: "proj-11",
      title: "The Last Fence",
      summary:
        "Endless wave-survival game with hero progression, weekly challenges, and a global leaderboard backed by cloud saves.",
      tech: ["Kotlin", "Google Sign-In", "Cloud Save"],
      liveUrl:
        "https://play.google.com/store/apps/details?id=com.porosdigital.thelastfence",
      storeUrl:
        "https://play.google.com/store/apps/details?id=com.porosdigital.thelastfence",
      year: "2026",
      featured: false,
      impact: [
        "Wave difficulty scaling with endless runs",
        "Hero unlocking and upgrades via earned crystals",
        "Cloud save with offline guest-mode fallback",
      ],
    },
    {
      id: "proj-12",
      title: "Memory Match",
      summary:
        "Card-matching brain-training game with escalating level sizes, star rewards, and a global leaderboard.",
      tech: ["Kotlin", "Game Loop", "Local Persistence"],
      liveUrl:
        "https://play.google.com/store/apps/details?id=com.amir.memorymatch",
      storeUrl:
        "https://play.google.com/store/apps/details?id=com.amir.memorymatch",
      year: "2026",
      featured: false,
      impact: [
        "Progressive card counts across endless levels",
        "Star-based scoring per cleared board",
        "Global leaderboard for high-score comparison",
      ],
    },
    {
      id: "proj-13",
      title: "Kotoba Pro",
      summary:
        "Offline Japanese vocabulary trainer with romaji, kana and kanji views, text-to-speech audio, and flashcard study sessions.",
      tech: ["Kotlin", "Text-to-Speech", "Offline-First"],
      liveUrl:
        "https://play.google.com/store/apps/details?id=com.amir.kotobapro",
      storeUrl:
        "https://play.google.com/store/apps/details?id=com.amir.kotobapro",
      year: "2026",
      featured: false,
      impact: [
        "Hiragana, katakana, kanji, and romaji per entry",
        "Spoken audio for pronunciation practice",
        "Fully offline study mode",
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
  preferences: {
    items: [
      { label: "Current Location", value: "Blitar, East Java, Indonesia" },
      { label: "Relocation", value: "Ready to relocate" },
      { label: "Relocation Support", value: "Open to visa sponsorship" },
      { label: "Work Mode", value: "Remote or hybrid" },
      { label: "Timezone", value: "UTC+7 (WIB)" },
      { label: "EU Overlap", value: "Flexible — full-day available" },
      { label: "US Overlap", value: "Flexible — early morning or evening" },
      { label: "Languages", value: "English (working) · Indonesian (native)" },
      { label: "Notice Period", value: "30 days" },
      { label: "Travel", value: "Open to business travel" },
    ],
    note: "Based in Blitar, East Java (UTC+7) with no restriction on working hours for EU or US teams — happy to start on a hybrid basis while settling. Everything I have shipped so far has been built and shipped remotely as an independent developer.",
  },
};
