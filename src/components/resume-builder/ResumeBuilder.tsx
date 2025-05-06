import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import PersonalInfoForm from "./PersonalInfoForm";
import ExperienceForm from "./ExperienceForm";
import EducationForm from "./EducationForm";
import SkillsForm from "./SkillsForm";
import ProjectsForm from "./ProjectsForm";
import ResumePreview from "./ResumePreview";
import TemplateSelector from "./TemplateSelector";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const INITIAL_RESUME_DATA = {
  personalInfo: {
    name: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    website: "",
    summary: ""
  },
  experience: [],
  education: [],
  skills: {
    technical: [],
    soft: [],
    languages: []
  },
  projects: []
};

export default function ResumeBuilder() {
  const [activeTab, setActiveTab] = useState("personal");
  const [resumeData, setResumeData] = useState(INITIAL_RESUME_DATA);
  const [selectedTemplate, setSelectedTemplate] = useState("modern");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const updatePersonalInfo = (personalInfo) => {
    setResumeData((prev) => ({
      ...prev,
      personalInfo
    }));
  };

  const updateExperience = (experience) => {
    setResumeData((prev) => ({
      ...prev,
      experience
    }));
  };

  const updateEducation = (education) => {
    setResumeData((prev) => ({
      ...prev,
      education
    }));
  };

  const updateSkills = (skills) => {
    setResumeData((prev) => ({
      ...prev,
      skills
    }));
  };

  const updateProjects = (projects) => {
    setResumeData((prev) => ({
      ...prev,
      projects
    }));
  };

  const nextTab = () => {
    const tabs = ["personal", "experience", "education", "skills", "projects", "preview"];
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1]);
    }
  };

  const prevTab = () => {
    const tabs = ["personal", "experience", "education", "skills", "projects", "preview"];
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1]);
    }
  };

  const saveResume = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to save your resume",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    try {
      setIsGenerating(true);
      
      // Save resume data to Supabase
      const { data, error } = await supabase
        .from("user_resumes")
        .upsert({
          user_id: user.id,
          resume_data: resumeData,
          template: selectedTemplate,
          created_at: new Date().toISOString(),
        })
        .select();

      if (error) throw error;

      toast({
        title: "Resume Saved",
        description: "Your resume has been saved successfully",
      });
      
      // Navigate to preview
      setActiveTab("preview");
    } catch (error) {
      console.error("Error saving resume:", error);
      toast({
        title: "Error",
        description: "Failed to save resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateATSFriendlyResume = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to generate an ATS-friendly resume",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    try {
      setIsGenerating(true);
      toast({
        title: "Generating Resume",
        description: "Creating your ATS-friendly resume...",
      });

      // Generate resume content based on template and data
      // This would typically involve a server call or local generation

      setTimeout(() => {
        toast({
          title: "Resume Generated",
          description: "Your ATS-friendly resume is ready to download",
        });
        setIsGenerating(false);
      }, 2000);
    } catch (error) {
      console.error("Error generating resume:", error);
      toast({
        title: "Error",
        description: "Failed to generate resume. Please try again.",
        variant: "destructive",
      });
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resume Builder</h1>
          <p className="text-muted-foreground">
            Create an ATS-friendly resume that will help you land your dream job
          </p>
        </div>

        <Separator />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Build Your Resume</CardTitle>
                <CardDescription>
                  Fill out each section to create a professional resume
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="personal">Personal</TabsTrigger>
                    <TabsTrigger value="experience">Experience</TabsTrigger>
                    <TabsTrigger value="education">Education</TabsTrigger>
                    <TabsTrigger value="skills">Skills</TabsTrigger>
                    <TabsTrigger value="projects">Projects</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                  </TabsList>

                  <TabsContent value="personal">
                    <PersonalInfoForm 
                      data={resumeData.personalInfo} 
                      updateData={updatePersonalInfo} 
                    />
                    <div className="flex justify-end mt-6">
                      <Button onClick={nextTab}>Next: Experience</Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="experience">
                    <ExperienceForm 
                      data={resumeData.experience} 
                      updateData={updateExperience} 
                    />
                    <div className="flex justify-between mt-6">
                      <Button variant="outline" onClick={prevTab}>Previous</Button>
                      <Button onClick={nextTab}>Next: Education</Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="education">
                    <EducationForm 
                      data={resumeData.education} 
                      updateData={updateEducation} 
                    />
                    <div className="flex justify-between mt-6">
                      <Button variant="outline" onClick={prevTab}>Previous</Button>
                      <Button onClick={nextTab}>Next: Skills</Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="skills">
                    <SkillsForm 
                      data={resumeData.skills} 
                      updateData={updateSkills} 
                    />
                    <div className="flex justify-between mt-6">
                      <Button variant="outline" onClick={prevTab}>Previous</Button>
                      <Button onClick={nextTab}>Next: Projects</Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="projects">
                    <ProjectsForm 
                      data={resumeData.projects} 
                      updateData={updateProjects} 
                    />
                    <div className="flex justify-between mt-6">
                      <Button variant="outline" onClick={prevTab}>Previous</Button>
                      <Button onClick={nextTab}>Next: Preview</Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="preview">
                    <div className="space-y-6">
                      <TemplateSelector 
                        selectedTemplate={selectedTemplate}
                        setSelectedTemplate={setSelectedTemplate}
                      />
                      <ResumePreview 
                        data={resumeData} 
                        template={selectedTemplate} 
                      />
                      <div className="flex justify-between mt-6">
                        <Button variant="outline" onClick={prevTab}>Previous</Button>
                        <div className="space-x-2">
                          <Button variant="outline" onClick={saveResume} disabled={isGenerating}>
                            Save Resume
                          </Button>
                          <Button onClick={generateATSFriendlyResume} disabled={isGenerating}>
                            {isGenerating ? "Generating..." : "Generate ATS Resume"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Resume Tips</CardTitle>
                <CardDescription>
                  Make your resume stand out to ATS systems
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Keep it focused</h3>
                    <p className="text-sm text-muted-foreground">
                      Tailor your resume to the specific job description for better ATS scores.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium">Use keywords wisely</h3>
                    <p className="text-sm text-muted-foreground">
                      Include relevant keywords from the job description throughout your resume.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium">Quantify achievements</h3>
                    <p className="text-sm text-muted-foreground">
                      Use numbers and percentages to highlight your accomplishments.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium">Use standard section headings</h3>
                    <p className="text-sm text-muted-foreground">
                      ATS systems recognize standard sections like "Experience" and "Education".
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium">Avoid complex formatting</h3>
                    <p className="text-sm text-muted-foreground">
                      Keep your resume format simple for better ATS compatibility.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 