import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface SkillsFormProps {
  data: {
    technical: string[];
    soft: string[];
    languages: string[];
  };
  updateData: (data: {
    technical: string[];
    soft: string[];
    languages: string[];
  }) => void;
}

export default function SkillsForm({ data, updateData }: SkillsFormProps) {
  const [skills, setSkills] = useState({
    technical: data.technical || [],
    soft: data.soft || [],
    languages: data.languages || [],
  });
  
  const [newSkill, setNewSkill] = useState("");
  const [skillType, setSkillType] = useState<"technical" | "soft" | "languages">("technical");
  
  // Update parent data when skills change
  useEffect(() => {
    updateData(skills);
  }, [skills, updateData]);
  
  const addSkill = () => {
    if (newSkill.trim() === "") return;
    
    // Don't add duplicates
    if (skills[skillType].includes(newSkill.trim())) {
      setNewSkill("");
      return;
    }
    
    setSkills((prev) => ({
      ...prev,
      [skillType]: [...prev[skillType], newSkill.trim()],
    }));
    
    setNewSkill("");
  };
  
  const removeSkill = (type: "technical" | "soft" | "languages", index: number) => {
    setSkills((prev) => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }));
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    }
  };
  
  // Popular skills suggestions
  const skillSuggestions = {
    technical: [
      "JavaScript", "TypeScript", "React", "Node.js", "Python", 
      "Java", "AWS", "Docker", "Kubernetes", "Git", 
      "SQL", "NoSQL", "GraphQL", "REST API", "Express", 
      "Vue.js", "Angular", "C#", "PHP", "Ruby", 
      "Swift", "Kotlin", "Go", "Rust", "C++",
      "HTML", "CSS", "SASS", "Tailwind CSS", "Bootstrap",
      "Redux", "Zustand", "Next.js", "Gatsby", "Svelte",
      "MongoDB", "PostgreSQL", "MySQL", "Firebase", "Supabase",
      "CI/CD", "Jenkins", "GitHub Actions", "Linux", "Bash"
    ],
    soft: [
      "Leadership", "Communication", "Problem Solving", "Teamwork", 
      "Time Management", "Adaptability", "Critical Thinking", 
      "Creativity", "Collaboration", "Project Management", 
      "Emotional Intelligence", "Negotiation", "Conflict Resolution", 
      "Decision Making", "Strategic Planning", "Empathy", 
      "Attention to Detail", "Customer Service", "Public Speaking", 
      "Active Listening"
    ],
    languages: [
      "English", "Spanish", "French", "German", "Chinese", 
      "Japanese", "Korean", "Russian", "Portuguese", "Italian", 
      "Hindi", "Arabic", "Dutch", "Swedish", "Norwegian"
    ]
  };
  
  const addSuggestedSkill = (skill: string) => {
    if (skills[skillType].includes(skill)) return;
    
    setSkills((prev) => ({
      ...prev,
      [skillType]: [...prev[skillType], skill],
    }));
  };
  
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label>Add Skills</Label>
          <div className="flex mt-1.5 space-x-2">
            <div className="flex-grow">
              <Input
                placeholder="Enter a skill..."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            <Button onClick={addSkill}>Add</Button>
          </div>
          
          <RadioGroup 
            defaultValue="technical" 
            className="flex mt-2"
            value={skillType}
            onValueChange={(value) => setSkillType(value as "technical" | "soft" | "languages")}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="technical" id="technical" />
              <Label htmlFor="technical" className="cursor-pointer">Technical</Label>
            </div>
            <div className="flex items-center space-x-2 ml-4">
              <RadioGroupItem value="soft" id="soft" />
              <Label htmlFor="soft" className="cursor-pointer">Soft Skills</Label>
            </div>
            <div className="flex items-center space-x-2 ml-4">
              <RadioGroupItem value="languages" id="languages" />
              <Label htmlFor="languages" className="cursor-pointer">Languages</Label>
            </div>
          </RadioGroup>
        </div>
        
        {/* Technical Skills */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Technical Skills</CardTitle>
            <CardDescription>
              Hard skills related to your profession
            </CardDescription>
          </CardHeader>
          <CardContent>
            {skills.technical.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {skills.technical.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="pl-2 pr-1 py-1.5 flex items-center gap-1">
                    {skill}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 rounded-full"
                      onClick={() => removeSkill("technical", index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No technical skills added yet.</p>
            )}
            
            {skillType === "technical" && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Suggestions:</p>
                <div className="flex flex-wrap gap-1.5">
                  {skillSuggestions.technical
                    .filter(skill => !skills.technical.includes(skill))
                    .slice(0, 10)
                    .map((skill, index) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className="cursor-pointer hover:bg-secondary"
                        onClick={() => addSuggestedSkill(skill)}
                      >
                        <Plus className="h-3 w-3 mr-1" /> {skill}
                      </Badge>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Soft Skills */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Soft Skills</CardTitle>
            <CardDescription>
              Personal attributes and interpersonal abilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            {skills.soft.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {skills.soft.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="pl-2 pr-1 py-1.5 flex items-center gap-1">
                    {skill}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 rounded-full"
                      onClick={() => removeSkill("soft", index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No soft skills added yet.</p>
            )}
            
            {skillType === "soft" && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Suggestions:</p>
                <div className="flex flex-wrap gap-1.5">
                  {skillSuggestions.soft
                    .filter(skill => !skills.soft.includes(skill))
                    .slice(0, 10)
                    .map((skill, index) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className="cursor-pointer hover:bg-secondary"
                        onClick={() => addSuggestedSkill(skill)}
                      >
                        <Plus className="h-3 w-3 mr-1" /> {skill}
                      </Badge>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Languages */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Languages</CardTitle>
            <CardDescription>
              Languages you speak or write
            </CardDescription>
          </CardHeader>
          <CardContent>
            {skills.languages.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {skills.languages.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="pl-2 pr-1 py-1.5 flex items-center gap-1">
                    {skill}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 rounded-full"
                      onClick={() => removeSkill("languages", index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No languages added yet.</p>
            )}
            
            {skillType === "languages" && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Suggestions:</p>
                <div className="flex flex-wrap gap-1.5">
                  {skillSuggestions.languages
                    .filter(skill => !skills.languages.includes(skill))
                    .slice(0, 10)
                    .map((skill, index) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className="cursor-pointer hover:bg-secondary"
                        onClick={() => addSuggestedSkill(skill)}
                      >
                        <Plus className="h-3 w-3 mr-1" /> {skill}
                      </Badge>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* ATS Tips */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <h3 className="font-medium mb-2">Tips for Skills Section</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Include skills mentioned in the job description</li>
            <li>• Use industry-standard terminology</li>
            <li>• Include both technical and soft skills</li>
            <li>• List relevant programming languages and tools</li>
            <li>• Avoid generic skills like "Microsoft Office" unless specifically required</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
} 