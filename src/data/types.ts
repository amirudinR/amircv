export interface Social {
  platform: string;
  label: string;
  url: string;
}

export interface Stat {
  label: string;
  value: string;
}

export interface Profile {
  name: string;
  role: string;
  tagline: string;
  location: string;
  availability: string;
  email: string;
  avatarUrl?: string;
}

export interface About {
  bio: string[];
  stats: Stat[];
  currentFocus: string;
}

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  start: string;
  end: string | null;
  location: string;
  summary: string;
  achievements: string[];
  tech: string[];
}

export interface Skill {
  name: string;
  level: 1 | 2 | 3;
}

export interface SkillGroup {
  category: string;
  skills: Skill[];
}

export type MockupType = 'pos' | 'equalizer' | 'mindlog' | 'flashlight';

export interface Project {
  id: string;
  title: string;
  summary: string;
  tech: string[];
  liveUrl?: string;
  repoUrl?: string;
  year: string;
  featured: boolean;
  mockupType?: MockupType;
  impact?: string[];
  challenge?: string;
  engineering?: string;
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  field: string;
  start: string;
  end: string;
  honors?: string;
}

export interface CV {
  profile: Profile;
  socials: Social[];
  about: About;
  experience: ExperienceItem[];
  skills: SkillGroup[];
  projects: Project[];
  education: EducationItem[];
}
