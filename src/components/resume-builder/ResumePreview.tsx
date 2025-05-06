import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, ZoomIn, ZoomOut, Mail, Phone, MapPin, Linkedin, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Define the resume data type that will be received
interface ResumeData {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    website: string;
    summary: string;
  };
  experience: Array<{
    company: string;
    position: string;
    location: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    fieldOfStudy: string;
    location: string;
    startDate: string;
    endDate: string;
    current: boolean;
    gpa: string;
    achievements: string;
  }>;
  skills: {
    technical: string[];
    soft: string[];
    languages: string[];
  };
  projects: Array<{
    title: string;
    description: string;
    technologies: string;
    startDate: string;
    endDate: string;
    link: string;
  }>;
}

interface ResumePreviewProps {
  data: ResumeData;
  template: string;
}

export default function ResumePreview({ data, template }: ResumePreviewProps) {
  const [zoom, setZoom] = useState(1);
  const resumeRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.1, 1.5));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.1, 0.5));
  };

  const downloadAsPDF = () => {
    // In a real-world implementation, this would generate a PDF
    // For now, we'll just show an alert
    alert("This would download the resume as PDF in a real implementation");
  };

  // Determine which template to render
  const renderResumeTemplate = () => {
    switch (template) {
      case "classic":
        return <ClassicTemplate data={data} />;
      case "minimal":
        return <MinimalTemplate data={data} />;
      case "creative":
        return <CreativeTemplate data={data} />;
      case "modern":
      default:
        return <ModernTemplate data={data} />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Resume Preview</h3>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm w-12 text-center">{Math.round(zoom * 100)}%</span>
          <Button variant="outline" size="icon" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={downloadAsPDF}>
            <Download className="h-4 w-4 mr-2" /> Download
          </Button>
        </div>
      </div>

      <div className="overflow-auto border rounded-md bg-white p-4">
        <div 
          ref={resumeRef}
          style={{ 
            transform: `scale(${zoom})`, 
            transformOrigin: 'top center',
            width: `${100 / zoom}%`,
            margin: '0 auto'
          }}
        >
          {renderResumeTemplate()}
        </div>
      </div>
    </div>
  );
}

// Modern Template Component
function ModernTemplate({ data }: { data: ResumeData }) {
  const hasPersonalInfo = data.personalInfo && data.personalInfo.name;
  const hasExperience = data.experience && data.experience.length > 0;
  const hasEducation = data.education && data.education.length > 0;
  const hasSkills = data.skills && (
    data.skills.technical.length > 0 || 
    data.skills.soft.length > 0 || 
    data.skills.languages.length > 0
  );
  const hasProjects = data.projects && data.projects.length > 0;

  if (!hasPersonalInfo) {
    return <EmptyState />;
  }

  return (
    <div className="min-h-[1056px] w-[816px] mx-auto bg-white shadow-sm p-8 font-sans">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          {data.personalInfo.name || "Your Name"}
        </h1>
        
        <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600">
          {data.personalInfo.email && (
            <div className="flex items-center">
              <Mail className="h-4 w-4 mr-1" />
              <span>{data.personalInfo.email}</span>
            </div>
          )}
          
          {data.personalInfo.phone && (
            <div className="flex items-center">
              <Phone className="h-4 w-4 mr-1" />
              <span>{data.personalInfo.phone}</span>
            </div>
          )}
          
          {data.personalInfo.location && (
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{data.personalInfo.location}</span>
            </div>
          )}
          
          {data.personalInfo.linkedin && (
            <div className="flex items-center">
              <Linkedin className="h-4 w-4 mr-1" />
              <span>{data.personalInfo.linkedin}</span>
            </div>
          )}
          
          {data.personalInfo.website && (
            <div className="flex items-center">
              <Globe className="h-4 w-4 mr-1" />
              <span>{data.personalInfo.website}</span>
            </div>
          )}
        </div>

        {data.personalInfo.summary && (
          <p className="mt-3 text-sm text-gray-700 leading-relaxed">
            {data.personalInfo.summary}
          </p>
        )}
      </div>

      <Separator className="my-4" />

      {/* Main Content - Two Columns */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="col-span-1">
          {/* Skills Section */}
          {hasSkills && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Skills</h2>
              
              {data.skills.technical.length > 0 && (
                <div className="mb-3">
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Technical</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {data.skills.technical.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="font-normal">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {data.skills.soft.length > 0 && (
                <div className="mb-3">
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Soft Skills</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {data.skills.soft.map((skill, index) => (
                      <Badge key={index} variant="outline" className="font-normal">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {data.skills.languages.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Languages</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {data.skills.languages.map((language, index) => (
                      <Badge key={index} variant="outline" className="font-normal">
                        {language}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Education Section */}
          {hasEducation && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Education</h2>
              
              <div className="space-y-3">
                {data.education.map((edu, index) => (
                  <div key={index} className="text-sm">
                    <div className="font-medium">{edu.degree}{edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : ''}</div>
                    <div className="text-gray-600">{edu.institution}</div>
                    <div className="text-gray-500">
                      {edu.startDate} - {edu.current ? "Present" : edu.endDate}
                    </div>
                    {edu.gpa && <div className="text-gray-600">GPA: {edu.gpa}</div>}
                    {edu.achievements && <div className="text-gray-700 mt-1">{edu.achievements}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Right Column */}
        <div className="col-span-2">
          {/* Experience Section */}
          {hasExperience && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Experience</h2>
              
              <div className="space-y-4">
                {data.experience.map((exp, index) => (
                  <div key={index} className="text-sm">
                    <div className="font-medium">{exp.position}</div>
                    <div className="text-gray-600">{exp.company}{exp.location ? ` | ${exp.location}` : ''}</div>
                    <div className="text-gray-500 mb-1">
                      {exp.startDate} - {exp.current ? "Present" : exp.endDate}
                    </div>
                    <p className="text-gray-700 whitespace-pre-line">{exp.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Projects Section */}
          {hasProjects && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Projects</h2>
              
              <div className="space-y-4">
                {data.projects.map((project, index) => (
                  <div key={index} className="text-sm">
                    <div className="font-medium flex items-center">
                      {project.title}
                      {project.link && (
                        <a 
                          href={project.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-700 ml-2 inline-flex items-center"
                        >
                          <Globe className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    {project.technologies && (
                      <div className="text-gray-600 mb-1">
                        {project.technologies}
                      </div>
                    )}
                    {(project.startDate || project.endDate) && (
                      <div className="text-gray-500 mb-1">
                        {project.startDate || ""} {project.startDate && project.endDate && "–"} {project.endDate || ""}
                      </div>
                    )}
                    <p className="text-gray-700">{project.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Simplified Classic Template Component
function ClassicTemplate({ data }: { data: ResumeData }) {
  if (!data.personalInfo || !data.personalInfo.name) {
    return <EmptyState />;
  }

  return (
    <div className="min-h-[1056px] w-[816px] mx-auto bg-white shadow-sm p-8 font-serif">
      {/* Header - Centered */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold uppercase tracking-wider">
          {data.personalInfo.name || "Your Name"}
        </h1>
        
        <div className="flex justify-center flex-wrap gap-4 mt-2 text-sm">
          {data.personalInfo.email && <span>{data.personalInfo.email}</span>}
          {data.personalInfo.phone && <span>{data.personalInfo.phone}</span>}
          {data.personalInfo.location && <span>{data.personalInfo.location}</span>}
        </div>
        
        {data.personalInfo.summary && (
          <p className="mt-4 text-sm leading-relaxed">
            {data.personalInfo.summary}
          </p>
        )}
      </div>
      
      {/* Simple One Column Layout */}
      <div>
        {/* Experience Section */}
        {data.experience && data.experience.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold uppercase border-b border-gray-300 pb-1 mb-3">
              Professional Experience
            </h2>
            
            <div className="space-y-4">
              {data.experience.map((exp, index) => (
                <div key={index} className="text-sm">
                  <div className="flex justify-between">
                    <div className="font-bold">{exp.position}</div>
                    <div>
                      {exp.startDate} - {exp.current ? "Present" : exp.endDate}
                    </div>
                  </div>
                  <div className="font-italic">{exp.company}, {exp.location}</div>
                  <p className="mt-1">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Education Section */}
        {data.education && data.education.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold uppercase border-b border-gray-300 pb-1 mb-3">
              Education
            </h2>
            
            <div className="space-y-3">
              {data.education.map((edu, index) => (
                <div key={index} className="text-sm">
                  <div className="flex justify-between">
                    <div className="font-bold">{edu.degree}{edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : ''}</div>
                    <div>
                      {edu.startDate} - {edu.current ? "Present" : edu.endDate}
                    </div>
                  </div>
                  <div>{edu.institution}, {edu.location}</div>
                  {edu.gpa && <div>GPA: {edu.gpa}</div>}
                  {edu.achievements && <div className="mt-1">{edu.achievements}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Skills Section */}
        {data.skills && (
          data.skills.technical.length > 0 || 
          data.skills.soft.length > 0 || 
          data.skills.languages.length > 0
        ) && (
          <div className="mb-6">
            <h2 className="text-lg font-bold uppercase border-b border-gray-300 pb-1 mb-3">
              Skills
            </h2>
            
            <div className="space-y-2 text-sm">
              {data.skills.technical.length > 0 && (
                <div>
                  <span className="font-bold">Technical Skills:</span> {data.skills.technical.join(", ")}
                </div>
              )}
              
              {data.skills.soft.length > 0 && (
                <div>
                  <span className="font-bold">Soft Skills:</span> {data.skills.soft.join(", ")}
                </div>
              )}
              
              {data.skills.languages.length > 0 && (
                <div>
                  <span className="font-bold">Languages:</span> {data.skills.languages.join(", ")}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Projects Section */}
        {data.projects && data.projects.length > 0 && (
          <div>
            <h2 className="text-lg font-bold uppercase border-b border-gray-300 pb-1 mb-3">
              Projects
            </h2>
            
            <div className="space-y-3 text-sm">
              {data.projects.map((project, index) => (
                <div key={index}>
                  <div className="font-bold">
                    {project.title}
                    {project.link && (
                      <a 
                        href={project.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 ml-2 font-normal text-xs"
                      >
                        (Link)
                      </a>
                    )}
                  </div>
                  {project.technologies && <div className="italic">{project.technologies}</div>}
                  <p className="mt-1">{project.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Minimal Template Placeholder
function MinimalTemplate({ data }: { data: ResumeData }) {
  if (!data.personalInfo || !data.personalInfo.name) {
    return <EmptyState />;
  }
  
  return (
    <div className="min-h-[1056px] w-[816px] mx-auto bg-white shadow-sm p-12 font-sans">
      <h1 className="text-3xl font-light tracking-tight mb-6">
        {data.personalInfo.name || "Your Name"}
      </h1>
      
      {/* Contact Info - Minimal Line */}
      <div className="flex flex-wrap items-center text-sm text-gray-500 mb-8">
        {data.personalInfo.email && <span className="mr-3">{data.personalInfo.email}</span>}
        {data.personalInfo.phone && <span className="mr-3">{data.personalInfo.phone}</span>}
        {data.personalInfo.location && <span className="mr-3">{data.personalInfo.location}</span>}
        {data.personalInfo.linkedin && <span className="mr-3">{data.personalInfo.linkedin}</span>}
        {data.personalInfo.website && <span>{data.personalInfo.website}</span>}
      </div>
      
      {/* Summary */}
      {data.personalInfo.summary && (
        <div className="mb-8">
          <p className="text-sm leading-relaxed">
            {data.personalInfo.summary}
          </p>
        </div>
      )}
      
      {/* Rest of the content in a minimal style */}
      <div className="space-y-8">
        {/* Minimalist display of other sections - limited content for brevity */}
        {data.experience && data.experience.length > 0 && (
          <div>
            <h2 className="text-sm uppercase tracking-widest text-gray-400 mb-4">Experience</h2>
            <div className="space-y-4">
              {data.experience.map((exp, index) => (
                <div key={index} className="text-sm">
                  <div className="font-medium">{exp.position} · {exp.company}</div>
                  <div className="text-gray-500 text-xs mb-1">
                    {exp.startDate} – {exp.current ? "Present" : exp.endDate}
                  </div>
                  <p className="text-xs text-gray-600">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Additional sections would follow the same minimal pattern */}
        {/* Limited preview for this template */}
      </div>
    </div>
  );
}

// Creative Template Placeholder
function CreativeTemplate({ data }: { data: ResumeData }) {
  if (!data.personalInfo || !data.personalInfo.name) {
    return <EmptyState />;
  }
  
  return (
    <div className="min-h-[1056px] w-[816px] mx-auto bg-gradient-to-br from-slate-50 to-slate-100 shadow-sm p-8 font-sans">
      {/* Creative Header with Background */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6 rounded-lg mb-6">
        <h1 className="text-3xl font-bold">
          {data.personalInfo.name || "Your Name"}
        </h1>
        
        <div className="mt-2 text-blue-50">
          {data.personalInfo.email && <div>{data.personalInfo.email}</div>}
          {data.personalInfo.phone && <div>{data.personalInfo.phone}</div>}
          {data.personalInfo.location && <div>{data.personalInfo.location}</div>}
        </div>
      </div>
      
      {/* Summary in a card */}
      {data.personalInfo.summary && (
        <Card className="mb-6 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <p className="italic text-sm">
              "{data.personalInfo.summary}"
            </p>
          </CardContent>
        </Card>
      )}
      
      {/* Creative layout for other sections */}
      <div className="grid grid-cols-6 gap-4">
        {/* Limited preview for this template */}
        <div className="col-span-6">
          <div className="text-center text-sm text-gray-500 mt-4">
            Creative template preview - full template would show all resume sections in a creative layout
          </div>
        </div>
      </div>
    </div>
  );
}

// Empty State Component
function EmptyState() {
  return (
    <div className="min-h-[1056px] w-[816px] mx-auto bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-500">Resume Preview</h3>
        <p className="text-sm text-gray-400 mt-1">
          Fill in your information to see your resume preview
        </p>
      </div>
    </div>
  );
} 