export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  title: string;
  summary: string;
  linkedin?: string;
  website?: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  startDate: string;
  endDate: string | "Present";
  location?: string;
  description?: string;
  gpa?: string;
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  location?: string;
  startDate: string;
  endDate: string | "Present";
  description: string;
  achievements: string[];
}

export interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  link?: string;
  startDate?: string;
  endDate?: string | "Present";
}

export interface Skills {
  technical: string[];
  soft: string[];
  languages: string[];
  certifications: string[];
}

export interface ResumeType {
  personal: PersonalInfo;
  education: Education[];
  experience: Experience[];
  skills: Skills;
  projects: Project[];
}

export type ResumeTemplate = "modern" | "classic" | "professional" | "minimal" | "creative"; 