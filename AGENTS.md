# CV Keren — Project Contract (WAJIB dibaca semua agent)

Personal CV website: **React 19 + TypeScript + Vite**, tema dark "Midnight Signal", efek 3D (React Three Fiber) + parallax (GSAP ScrollTrigger + Lenis). Professional tapi keren.

## Aturan Keras
- TypeScript strict. JSX runtime otomatis (tidak perlu `import React`).
- Styling: **CSS Modules** (`NamaFile.module.css`) per komponen/section + token global dari `src/styles/global.css`. Dilarang Tailwind/UI lib/inline style berlebihan.
- Dilarang menambah dependency npm baru. Tersedia: react, react-dom, three, @react-three/fiber, @react-three/drei, gsap, lenis.
- Path alias `@/` = `src/`.
- Setiap file HANYA menulis di path yang ditugaskan. Jangan sentuh file milik agent lain, jangan ubah package.json/config/index.html.
- Semua animasi WAJIB respect `prefers-reduced-motion` (pakai hook `usePrefersReducedMotion`).
- Konten teks: English placeholder yang profesional. Komentar kode boleh singkat.
- Warna/font HANYA via CSS custom properties di bawah (jangan hardcode hex di module css kecuali token belum ada).

## Design Tokens (didefinisikan di src/styles/global.css)
```
--bg: #0A0A0F        --surface: #14141C     --border: rgba(255,255,255,0.08)
--accent: #4D7CFE    --accent-2: #A78BFA
--text: #F2F2F5      --text-muted: #8A8A98
--font-display: 'Space Grotesk'   --font-body: 'Inter'   --font-mono: 'Space Mono'
--text-sm, --text-base, --text-h3, --text-h2, --text-h1, --text-hero (semua clamp())
--space-1 (8px) s/d --space-20 (160px), skala 8px
--radius: 16px   --max-w: 1200px
```
Kelas utilitas global yang tersedia: `.container` (max-w + padding), `.reveal` + `.is-visible` (scroll reveal), `.eyebrow` (label mono uppercase), `.skip-link`.

## Data Model (src/data/types.ts)
```ts
export interface Social { platform: string; label: string; url: string }
export interface Stat { label: string; value: string }
export interface Profile { name: string; role: string; tagline: string; location: string; availability: string; email: string; avatarUrl?: string }
export interface About { bio: string[]; stats: Stat[]; currentFocus: string }
export interface ExperienceItem { id: string; company: string; role: string; start: string; end: string | null; location: string; summary: string; achievements: string[]; tech: string[] }
export interface Skill { name: string; level: 1 | 2 | 3 }
export interface SkillGroup { category: string; skills: Skill[] }
export interface Project { id: string; title: string; summary: string; tech: string[]; liveUrl?: string; repoUrl?: string; year: string; featured: boolean }
export interface EducationItem { id: string; institution: string; degree: string; field: string; start: string; end: string }
export interface CV { profile: Profile; socials: Social[]; about: About; experience: ExperienceItem[]; skills: SkillGroup[]; projects: Project[]; education: EducationItem[] }
```
`src/data/cv.ts` mengekspor `export const cv: CV`.

## API Kontrak (nama export & props PERSIS seperti ini)

### src/lib/gsap.ts
- `export { gsap, ScrollTrigger }` (ScrollTrigger sudah di-register)
- `export function initSmoothScroll(): () => void` — Lenis + gsap ticker + ScrollTrigger.update; return cleanup. Nonaktif total jika `prefers-reduced-motion`.

### src/hooks/
- `usePrefersReducedMotion.ts` → `export function usePrefersReducedMotion(): boolean` (live listener)
- `useSectionReveal.ts` → `export function useSectionReveal<T extends HTMLElement = HTMLElement>(): RefObject<T | null>` — observe elemen `.reveal` di dalam ref, tambah `.is-visible`, sekali saja.
- `useMagnetic.ts` → `export function useMagnetic<T extends HTMLElement = HTMLElement>(strength?: number): RefObject<T | null>` — magnetic hover max ~6px, skip touch/reduced-motion.

### src/three/HeroScene.tsx
- `export default function HeroScene({ reducedMotion }: { reducedMotion: boolean })`
- R3F `<Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 6], fov: 45 }}>`, background transparan.
- Isi: icosahedron besar `MeshDistortMaterial` warna `--accent` (#4D7CFE) + ~600-1000 instanced partikel kecil (tetra/box) warna accent & accent-2, rotasi lambat, kamera parallax mengikuti pointer (lerp). Jika `reducedMotion`: render statis (frameloop="never" setelah 1 frame).
- Boleh pecah file di dalam `src/three/` (mis. `Particles.tsx`).

### src/components/ (masing-masing + .module.css)
- `Nav.tsx` → `export function Nav({ links }: { links: { id: string; label: string }[] })` — fixed glass nav, scroll-spy aktif, smooth scroll ke anchor, mobile hamburger.
- `Section.tsx` → `export function Section({ id, eyebrow, title, children, className }: { id: string; eyebrow: string; title: string; children: ReactNode; className?: string })` — wrapper `<section id>` + header (eyebrow + h2) + reveal.
- `Badge.tsx` → `export function Badge({ label, level }: { label: string; level?: 1 | 2 | 3 })` — chip; level = intensitas aksen.
- `TimelineItem.tsx` → `export function TimelineItem({ item, index }: { item: ExperienceItem; index: number })` — kartu pengalaman: role, company, periode (mono), achievements, tech badges.
- `ProjectCard.tsx` → `export function ProjectCard({ project }: { project: Project })` — kartu bento dengan tilt hover halus (≤4°), tech badges, link live/repo.
- `Footer.tsx` → `export function Footer({ profile, socials }: { profile: Profile; socials: Social[] })` — socials, copyright, back-to-top.

### src/sections/ (masing-masing + .module.css, named export)
- `Hero.tsx` → `export function Hero({ profile, socials }: { profile: Profile; socials: Social[] })` — full viewport; `React.lazy` + `Suspense` untuk `HeroScene` (fallback gradient statis); entrance sequence GSAP (nama → role → CTA → sosial); parallax scroll (bg lambat, teks counter-drift, fade out); canvas `aria-hidden`; CTA "View Projects" + "Download CV" (`/resume.pdf`).
- `About.tsx` → `export function About({ about }: { about: About })` — bio + stats counter animasi + currentFocus; pakai `Section`.
- `Skills.tsx` → `export function Skills({ groups }: { groups: SkillGroup[] })` — grid grup skill dengan Badge, stagger reveal; pakai `Section`.
- `Experience.tsx` → `export function Experience({ items }: { items: ExperienceItem[] })` — timeline vertikal, garis progress scaleY scrub GSAP ScrollTrigger, node aktif saat dilewati; render `TimelineItem`; pakai `Section`.
- `Projects.tsx` → `export function Projects({ projects }: { projects: Project[] })` — grid bento `ProjectCard`, featured lebih besar; pakai `Section`.
- `Education.tsx` → `export function Education({ items }: { items: EducationItem[] })` — daftar ringkas, motion minimal; pakai `Section`.
- `Contact.tsx` → `export function Contact({ profile, socials }: { profile: Profile; socials: Social[] })` — heading besar, tombol email (mailto + copy-to-clipboard), social links, tombol Download CV; pakai `Section`.

## A11y & Perf
- Satu `<h1>` (di Hero). Section title `<h2>`. Canvas dekoratif `aria-hidden`.
- Kontras teks ≥ 4.5:1. `:focus-visible` jelas.
- Animasi hanya transform/opacity. Parallax dikurangi di mobile (`gsap.matchMedia`).
