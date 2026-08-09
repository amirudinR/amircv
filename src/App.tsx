import { useEffect } from 'react'
import { cv } from '@/data/cv'
import { initSmoothScroll } from '@/lib/gsap'
import { Nav } from '@/components/Nav'
import { Footer } from '@/components/Footer'
import { ScrollProgress } from '@/components/ScrollProgress'
import { Hero } from '@/sections/Hero'
import { About } from '@/sections/About'
import { Skills } from '@/sections/Skills'
import { Experience } from '@/sections/Experience'
import { Projects } from '@/sections/Projects'
import { Education } from '@/sections/Education'
import { Contact } from '@/sections/Contact'

const links = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Skills' },
  { id: 'experience', label: 'Experience' },
  { id: 'projects', label: 'Projects' },
  { id: 'education', label: 'Education' },
  { id: 'contact', label: 'Contact' },
]

export default function App() {
  useEffect(() => {
    const cleanup = initSmoothScroll()
    return cleanup
  }, [])

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <ScrollProgress />
      <Nav links={links} />
      <main id="main">
        <Hero profile={cv.profile} socials={cv.socials} />
        <About about={cv.about} />
        <Skills groups={cv.skills} />
        <Experience items={cv.experience} />
        <Projects projects={cv.projects} />
        <Education items={cv.education} />
        <Contact profile={cv.profile} socials={cv.socials} />
      </main>
      <Footer profile={cv.profile} socials={cv.socials} />
    </>
  )
}
