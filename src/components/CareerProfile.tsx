import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { Upload, Award, FileText, User, Briefcase, Mail, Building2, MapPin, Edit2, Save, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Navbar } from "@/components/Navbar";
import { Database } from "@/integrations/supabase/types";

type Resume = Database["public"]["Tables"]["resumes"]["Row"];
type ResumeInsert = Database["public"]["Tables"]["resumes"]["Insert"];

interface Skill {
  id: string;
  user_id: string;
  skill_name: string;
  score: number;
  created_at: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = {
  'pdf': 'application/pdf',
  'doc': 'application/msword',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'txt': 'text/plain'
};

const CareerProfile = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState<'idle' | 'uploading' | 'analyzing' | 'saving'>('idle');
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: "",
    title: "",
    company: "",
    location: "",
    bio: "",
    email: "",
  });

  // Update profile data when user or profile changes
  useEffect(() => {
    if (user && profile) {
      setProfileData({
        full_name: profile.full_name || "",
        title: profile.title || "",
        company: profile.company || "",
        location: profile.location || "",
        bio: profile.bio || "",
        email: user.email || "",
      });
    }
  }, [user, profile]);

  // Create a ref for the ATS score section
  const atsScoreSectionRef = useRef<HTMLDivElement>(null);

  const { data: resume, refetch: refetchResume } = useQuery<Resume | null>({
    queryKey: ["resume", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resumes")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No data found
        throw error;
      }

      return data;
    },
    enabled: !!user,
    staleTime: 0, // Always consider data stale to encourage refetching
    refetchOnMount: true, // Refetch on component mount
    refetchOnWindowFocus: true, // Refetch when window gets focus
    onSuccess: (data) => {
      // If we have a valid ATS score, scroll to the section
      if (data?.ats_score && typeof data.ats_score === 'number') {
        setTimeout(() => {
          if (atsScoreSectionRef.current) {
            atsScoreSectionRef.current.scrollIntoView({ behavior: 'smooth' });
          }
        }, 500);
      }
    }
  });

  const { data: skills, refetch: refetchSkills } = useQuery<Skill[]>({
    queryKey: ["skills", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("skill_assessments")
        .select("*")
        .eq("user_id", user?.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user && !profile) {
      navigate("/login");
    }
  }, [user, profile, navigate]);

  // Log resume data when it changes to help with debugging
  // and ensure ATS score is properly displayed
  useEffect(() => {
    if (resume) {
      console.log("Resume data updated:", resume);
      console.log("ATS Score:", resume.ats_score);
      console.log("Keywords:", resume.keywords);
      console.log("Recommendations:", resume.recommendations);
      
      // If ATS score is not a valid number, try to update it
      if (resume.id && (typeof resume.ats_score !== 'number' || isNaN(resume.ats_score))) {
        console.warn("Invalid ATS score detected, attempting to fix");
        (async () => {
          try {
            const { error } = await supabase
              .from("resumes")
              .update({
                ats_score: 70, // Default fallback score
                updated_at: new Date().toISOString()
              })
              .eq("id", resume.id);
              
            if (!error) {
              console.log("Applied fallback ATS score");
              setTimeout(() => refetchResume(), 500);
            }
          } catch (err) {
            console.error("Error fixing ATS score:", err);
          }
        })();
      }
    }
  }, [resume]);

  const handleStartAssessment = () => {
    navigate("/interview");
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) {
        toast({
          title: "Error",
          description: "Please select a file to upload",
          variant: "destructive",
        });
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "Error",
          description: "File size should be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      // Validate file type
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "";
      const allowedExtensions = Object.keys(ALLOWED_FILE_TYPES);
      if (!fileExt || !allowedExtensions.includes(fileExt)) {
        toast({
          title: "Error",
          description: "Please upload a PDF, DOC, DOCX, or TXT file",
          variant: "destructive",
        });
        return;
      }

      // Validate file content type if browser supports it
      if (file.type && !Object.values(ALLOWED_FILE_TYPES).includes(file.type)) {
        console.warn(`File content type (${file.type}) might not match the extension (${fileExt})`);
      }

      setUploading(true);
      setUploadStage('uploading');

      // Create a safe file name
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const timestamp = Date.now();
      const filePath = `${user?.id}/resumes/${timestamp}-${safeFileName}`;

      try {
      // Upload file to storage
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from("resumes")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }

      if (!uploadData?.path) {
        throw new Error("No upload path returned");
      }

      // Get public URL
      const { data: publicURL } = supabase.storage
        .from("resumes")
        .getPublicUrl(uploadData.path);

      if (!publicURL?.publicUrl) {
        throw new Error("Failed to get public URL");
      }

        // Process resume content
        setUploadStage('analyzing');

      // Process resume content
      const processResumeContent = async (file: File): Promise<{
        parsed_content: string;
        ats_score: number;
        keywords: string[];
        recommendations: string[];
      }> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          
          reader.onload = async () => {
            try {
              let content = reader.result as string;
              
              // Sanitize content to remove unsupported characters
              content = content.replace(/\\u[0-9a-fA-F]{4}/g, '');
              content = content.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
              
                try {
              // Call OpenAI API for analysis
                  console.log("Calling OpenAI API...");
              const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                  model: "gpt-4",
                  messages: [
                    {
                      role: "system",
                      content: "You are an expert ATS system analyzer. Analyze the resume and provide an ATS score, extract keywords, and give recommendations for improvement."
                    },
                    {
                      role: "user",
                      content: content
                    }
                  ],
                  response_format: { type: "json_object" }
                })
              });
                  
                  console.log("OpenAI API response status:", response.status);
                  
                  if (!response.ok) {
                    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
                  }
              
              const data = await response.json();
                  console.log("OpenAI API response:", data);
                  
                  if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
                    throw new Error("Invalid response from OpenAI API");
                  }
                  
                  let analysis;
                  try {
                    analysis = JSON.parse(data.choices[0].message.content);
                    console.log("Parsed analysis:", analysis);
                  } catch (parseError) {
                    console.error("Parse error:", parseError);
                    throw new Error("Failed to parse OpenAI API response");
                  }
              
              resolve({
                parsed_content: content,
                    ats_score: analysis.ats_score || 70, // Default score if missing
                    keywords: analysis.keywords || [],
                    recommendations: analysis.recommendations || []
              });
                } catch (apiError) {
                  console.error("OpenAI API Error:", apiError);
                  // Fallback: Use local analysis
                  console.log("Using local resume analysis fallback");
                  const localAnalysis = analyzeResumeLocally(content);
                  resolve({
                    parsed_content: content,
                    ats_score: localAnalysis.ats_score,
                    keywords: localAnalysis.keywords,
                    recommendations: localAnalysis.recommendations
                  });
                }
            } catch (error) {
              reject(error);
            }
          };
          
          reader.onerror = () => {
            reject(new Error('Failed to read file'));
          };
          
          reader.readAsText(file);
        });
      };

        // Create a simplified function to analyze resume content locally without API
        const analyzeResumeLocally = (content: string): {
          ats_score: number;
          keywords: string[];
          recommendations: string[];
        } => {
          // Simple keyword-based scoring
          const commonKeywords = [
            "javascript", "typescript", "react", "node", "python", "java", "c#", "c++",
            "aws", "azure", "gcp", "cloud", "devops", "docker", "kubernetes",
            "agile", "scrum", "project management", "leadership", "communication",
            "frontend", "backend", "fullstack", "database", "sql", "nosql",
            "analytics", "data science", "machine learning", "ai", "software", "developer",
            "engineer", "development", "architecture", "testing", "qa", "quality"
          ];
          
          // Extract found keywords
          const foundKeywords = commonKeywords.filter(keyword => 
            content.toLowerCase().includes(keyword.toLowerCase())
          ).slice(0, 15); // Limit to 15 keywords
          
          // Calculate score based on number of keywords found and content length
          const keywordScore = Math.min(100, (foundKeywords.length / 10) * 100);
          const contentLengthScore = Math.min(100, (content.length / 3000) * 100);
          const finalScore = Math.round((keywordScore * 0.7) + (contentLengthScore * 0.3));
          
          // Generate recommendations
          const recommendations = [
            "Include more specific technical skills relevant to your target role",
            "Quantify your achievements with numbers and metrics",
            "Make sure your resume is properly formatted for ATS systems",
            "Include relevant keywords from job descriptions",
            "Keep your resume concise and focused on relevant experience"
          ];
          
          return {
            ats_score: finalScore,
            keywords: foundKeywords,
            recommendations: recommendations.slice(0, 5)
          };
        };
        
      const atsResults = await processResumeContent(file);

        try {
      // Save to resumes table
          setUploadStage('saving');
          
          // Ensure all fields have valid values
          const resumeData = {
          user_id: user?.id,
          file_url: publicURL.publicUrl,
          file_name: file.name,
            parsed_content: atsResults.parsed_content || '',
            ats_score: typeof atsResults.ats_score === 'number' ? atsResults.ats_score : 70,
            keywords: Array.isArray(atsResults.keywords) ? atsResults.keywords : [],
            recommendations: Array.isArray(atsResults.recommendations) ? atsResults.recommendations : [],
          updated_at: new Date().toISOString()
          };
          
          // Double-check that ATS score is a valid number to prevent display issues
          if (typeof resumeData.ats_score !== 'number' || isNaN(resumeData.ats_score)) {
            console.warn("Invalid ATS score detected, using fallback score");
            resumeData.ats_score = 70; // Fallback score
          }
          
          console.log("Saving resume data:", resumeData);
          
          const { error: dbError, data: dbData } = await supabase
            .from("resumes")
            .upsert(resumeData)
            .select();

      if (dbError) {
        console.error("Database error:", dbError);
        // If the file was uploaded but database insert failed, try to clean up the uploaded file
        await supabase.storage.from("resumes").remove([uploadData.path]);
        throw new Error(`Failed to save resume information: ${dbError.message}`);
      }
          
          console.log("Resume saved successfully:", dbData);

      // Show success toast with ATS score information
      toast({
        title: "Resume Uploaded Successfully",
        description: `Your resume has been analyzed with an ATS score of ${Math.round(resumeData.ats_score)}%. Scroll down to see detailed analysis.`,
        variant: "default",
      });

          // Refresh the resume data immediately and then with a delay
      refetchResume();

          // Add a small delay before refetching to ensure data consistency
          setTimeout(() => {
            refetchResume();
            
            // After a longer delay, check if we have a valid ATS score, if not, try to update it
            setTimeout(async () => {
              const { data: currentResume } = await supabase
                .from("resumes")
                .select("*")
                .eq("user_id", user?.id)
                .single();
                
              console.log("Checking resume data after delay:", currentResume);
              
              if (currentResume && (typeof currentResume.ats_score !== 'number' || isNaN(currentResume.ats_score))) {
                console.warn("ATS score still invalid after delay, applying fallback update");
                const { error } = await supabase
                  .from("resumes")
                  .update({
                    ats_score: 70,
                    updated_at: new Date().toISOString()
                  })
                  .eq("id", currentResume.id);
                  
                if (!error) {
                  refetchResume();
                }
              }
            }, 3000);
          }, 1000);
        } catch (dbError) {
          console.error("Database operation error:", dbError);
          // Attempt to clean up the storage file if the database operation failed
          await supabase.storage.from("resumes").remove([uploadData.path]);
          throw dbError;
        }
      } catch (storageError) {
        console.error("Storage operation error:", storageError);
        throw storageError;
      }
    } catch (error) {
      console.error("Error uploading resume:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload resume",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadStage('idle');
      // Reset the file input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profileData.full_name,
          title: profileData.title,
          company: profileData.company,
          location: profileData.location,
          bio: profileData.bio,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      setEditMode(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const calculateProfileCompletion = () => {
    const fields = Object.values(profileData).filter(field => field !== profileData.email); // Don't count email in completion
    const filledFields = fields.filter(field => field && field.trim() !== "").length;
    return (filledFields / fields.length) * 100;
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Career Dashboard</h1>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Section */}
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile
                </CardTitle>
                <div className="flex items-center gap-4">
                  <Badge variant="secondary">
                    Profile Completion: {Math.round(calculateProfileCompletion())}%
                  </Badge>
                  {!editMode ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditMode(true)}
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleSaveProfile}
                      disabled={saving}
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save Changes
                    </Button>
                  )}
                </div>
              </div>
              <Progress value={calculateProfileCompletion()} className="mt-2" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <Label>Full Name</Label>
                    {editMode ? (
                      <Input
                        value={profileData.full_name}
                        onChange={(e) =>
                          setProfileData({ ...profileData, full_name: e.target.value })
                        }
                        placeholder="Enter your full name"
                      />
                    ) : (
                      <p className="text-muted-foreground mt-1">
                        {profileData.full_name || "Not specified"}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p className="text-muted-foreground mt-1">{profileData.email}</p>
                  </div>
                  <div>
                    <Label>Job Title</Label>
                    {editMode ? (
                      <Input
                        value={profileData.title}
                        onChange={(e) =>
                          setProfileData({ ...profileData, title: e.target.value })
                        }
                        placeholder="Enter your job title"
                      />
                    ) : (
                      <p className="text-muted-foreground mt-1">
                        {profileData.title || "Not specified"}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>Company</Label>
                    {editMode ? (
                      <Input
                        value={profileData.company}
                        onChange={(e) =>
                          setProfileData({ ...profileData, company: e.target.value })
                        }
                        placeholder="Enter your company name"
                      />
                    ) : (
                      <p className="text-muted-foreground mt-1">
                        {profileData.company || "Not specified"}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>Location</Label>
                    {editMode ? (
                      <Input
                        value={profileData.location}
                        onChange={(e) =>
                          setProfileData({ ...profileData, location: e.target.value })
                        }
                        placeholder="Enter your location"
                      />
                    ) : (
                      <p className="text-muted-foreground mt-1">
                        {profileData.location || "Not specified"}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>Professional Bio</Label>
                    {editMode ? (
                      <Textarea
                        value={profileData.bio}
                        onChange={(e) =>
                          setProfileData({ ...profileData, bio: e.target.value })
                        }
                        placeholder="Write a brief professional bio"
                        className="h-[100px]"
                      />
                    ) : (
                      <p className="text-muted-foreground mt-1">
                        {profileData.bio || "No bio provided"}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {!editMode && calculateProfileCompletion() < 80 && (
                <Card className="mt-6 bg-amber-50 border-amber-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-amber-100 p-2">
                        <User className="h-4 w-4 text-amber-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-amber-800">Complete your profile</h4>
                        <p className="text-sm text-amber-700 mt-1">
                          A complete profile increases your chances of matching with the right job opportunities.
                          {calculateProfileCompletion() < 50 && " Your profile needs significant improvement."}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          {/* Resume Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Resume
              </CardTitle>
              <CardDescription>
                Upload and manage your professional resume
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {resume ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>{resume.file_name || "Current Resume"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                      {resume.file_url && (
                        <a
                          href={resume.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          View Resume
                        </a>
                      )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => refetchResume()}
                          title="Refresh resume data"
                        >
                          <Loader2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* ATS Score Section */}
                    {resume.ats_score !== null && resume.ats_score !== undefined ? (
                      <div className="space-y-4" ref={atsScoreSectionRef}>
                        <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-lg">ATS Score</span>
                            <Badge 
                              variant={resume.ats_score >= 70 ? "default" : "secondary"}
                              className="text-md px-3 py-1"
                            >
                              {Math.round(resume.ats_score)}%
                            </Badge>
                          </div>
                          <Progress 
                            value={resume.ats_score} 
                            className="h-3" 
                            indicatorClassName={`${resume.ats_score >= 80 ? 'bg-green-500' : resume.ats_score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                          />
                          <p className="text-sm mt-2 text-muted-foreground">
                            {resume.ats_score >= 80 ? 'Excellent! Your resume is well-optimized for ATS systems.' :
                             resume.ats_score >= 60 ? 'Good. Your resume is reasonably optimized but has room for improvement.' :
                             'Your resume needs optimization to perform better with ATS systems.'}
                          </p>
                        </div>
                        
                        {/* Debug info - only visible in development */}
                        {import.meta.env.DEV && (
                          <div className="bg-slate-100 p-2 rounded text-xs my-2">
                            <div>Debug: ATS Score raw value: {JSON.stringify(resume.ats_score)}</div>
                            <div>Debug: Score type: {typeof resume.ats_score}</div>
                          </div>
                        )}
                        
                        {/* Keywords Found */}
                        {resume.keywords && resume.keywords.length > 0 && (
                          <div className="space-y-2">
                            <Label>Keywords Found</Label>
                            <div className="flex flex-wrap gap-2">
                              {resume.keywords.map((keyword, index) => (
                                <Badge key={index} variant="outline">
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recommendations */}
                        {resume.recommendations && resume.recommendations.length > 0 && (
                          <div className="space-y-2">
                            <Label>Recommendations</Label>
                            <Card className="bg-muted">
                              <CardContent className="p-4">
                                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                  {resume.recommendations.map((rec, index) => (
                                    <li key={index}>{rec}</li>
                                  ))}
                                </ul>
                              </CardContent>
                            </Card>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4 my-4">
                        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                          <div className="flex items-start gap-3">
                            <div className="rounded-full bg-amber-100 p-2">
                              <Loader2 className="h-4 w-4 text-amber-600 animate-spin" />
                            </div>
                            <div>
                              <h4 className="font-medium text-amber-800">ATS Score Processing</h4>
                              <p className="text-sm text-amber-700 mt-1">
                                Your resume has been uploaded successfully, but the ATS score analysis is still processing. 
                                This may take a few moments to complete.
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              toast({
                                title: "Refreshing Analysis",
                                description: "Checking for your ATS score..."
                              });
                              refetchResume();
                            }}
                            className="flex items-center gap-2"
                          >
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Refresh Analysis
                          </Button>
                          
                          {/* Force ATS Score button - only in development */}
                          {import.meta.env.DEV && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={async () => {
                                if (!resume || !user?.id) return;
                                
                                // Force a local analysis
                                const mockScore = Math.floor(Math.random() * 30) + 60; // Score between 60-90
                                console.log("Forcing ATS score update:", mockScore);
                                
                                try {
                                  const { error } = await supabase
                                    .from("resumes")
                                    .update({
                                      ats_score: mockScore,
                                      keywords: ["javascript", "react", "typescript", "development"],
                                      recommendations: [
                                        "Add more specific skills",
                                        "Quantify your achievements"
                                      ],
                                      updated_at: new Date().toISOString()
                                    })
                                    .eq("id", resume.id);
                                    
                                  if (error) throw error;
                                  refetchResume();
                                  toast({
                                    title: "Debug",
                                    description: "Forced ATS score update"
                                  });
                                } catch (error) {
                                  console.error("Error updating score:", error);
                                }
                              }}
                            >
                              Force ATS Score (DEV)
                            </Button>
                          )}
                        </div>
                        
                        {/* Debug info - only visible in development */}
                        {import.meta.env.DEV && resume && (
                          <div className="bg-slate-100 p-2 rounded text-xs mt-4">
                            <div>Debug info:</div>
                            <div>Resume ID: {resume.id}</div>
                            <div>ATS Score: {JSON.stringify(resume.ats_score)}</div>
                            <div>Keywords: {JSON.stringify(resume.keywords)}</div>
                            <div>User ID: {user?.id}</div>
                            <div>Updated at: {resume.updated_at}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      No resume uploaded yet. Upload your resume to get started with ATS analysis and recommendations.
                    </p>
                  </div>
                )}

                {/* Always show the upload section */}
                <div className="space-y-2">
                  <Label htmlFor="resume">{resume ? "Upload New Resume" : "Upload Resume"}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="resume"
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                    {uploading && (
                      <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">
                          {uploadStage === 'uploading' && 'Uploading...'}
                          {uploadStage === 'analyzing' && 'Analyzing...'}
                          {uploadStage === 'saving' && 'Saving...'}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Supported formats: PDF, DOC, DOCX, TXT (Max size: 5MB)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Skills Assessment Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Skills Assessment
              </CardTitle>
              <CardDescription>
                Track your skill assessments and take new tests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {skills && skills.length > 0 ? (
                <div className="space-y-4">
                  <ScrollArea className="h-[200px] pr-4">
                    <div className="space-y-4">
                      {skills.map((skill) => (
                        <div key={skill.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{skill.skill_name}</span>
                            <Badge
                              variant={skill.score >= 70 ? "default" : "secondary"}
                            >
                              {skill.score}%
                            </Badge>
                          </div>
                          <Progress
                            value={skill.score}
                            className="h-2"
                          />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <Button
                    className="w-full"
                    onClick={handleStartAssessment}
                    variant="outline"
                  >
                    <Award className="h-4 w-4 mr-2" />
                    Take New Assessment
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No skills assessed yet. Take an assessment to showcase your
                      abilities to potential employers.
                    </p>
                  </div>
                  <Button className="w-full" onClick={handleStartAssessment}>
                    <Award className="h-4 w-4 mr-2" />
                    Start First Assessment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Job Matching Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Job Matching
              </CardTitle>
              <CardDescription>
                View your job matches and improve your profile to get better matches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(skills && skills.length > 0 && resume) ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Job Match Score</span>
                      <Badge variant={calculateProfileCompletion() >= 70 ? "default" : "secondary"}>
                        {Math.round(calculateProfileCompletion())}%
                      </Badge>
                    </div>
                    <Progress value={calculateProfileCompletion()} className="h-2" />
                    
                    <div className="bg-muted p-4 rounded-md">
                      <h4 className="text-sm font-medium mb-2">Improve Your Matches</h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        {calculateProfileCompletion() < 100 && (
                          <li>Complete your profile information</li>
                        )}
                        {!resume && (
                          <li>Upload your resume for better job matching</li>
                        )}
                        {(!skills || skills.length < 3) && (
                          <li>Complete more skill assessments</li>
                        )}
                      </ul>
                    </div>
                    
                    <Button className="w-full" onClick={() => navigate("/jobs")}>
                      <Briefcase className="h-4 w-4 mr-2" />
                      View Matching Jobs
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      Complete your profile, upload your resume, and take skill assessments to get matched with job opportunities.
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={() => {
                        if (!resume) navigate("#resume-section");
                        else handleStartAssessment();
                      }}
                    >
                      {!resume ? "Upload Resume" : "Take Assessment"}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CareerProfile;