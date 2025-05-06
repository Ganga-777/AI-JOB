import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, DollarSign, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

// Location salary adjustment factors
const locationFactors: Record<string, number> = {
  "san_francisco": 1.5,
  "new_york": 1.4,
  "seattle": 1.3,
  "austin": 1.2,
  "chicago": 1.15,
  "boston": 1.25,
  "los_angeles": 1.35,
  "denver": 1.1,
  "remote": 1.0,
  "other": 0.9
};

// Skill salary multipliers
const skillMultipliers: Record<string, number> = {
  "javascript": 1.1,
  "python": 1.15,
  "java": 1.05,
  "react": 1.12,
  "angular": 1.08,
  "vue": 1.07,
  "node": 1.1,
  "aws": 1.2,
  "azure": 1.15,
  "gcp": 1.18,
  "docker": 1.08,
  "kubernetes": 1.15,
  "sql": 1.05,
  "nosql": 1.08,
  "machine_learning": 1.25,
  "data_science": 1.2,
  "devops": 1.15,
  "mobile": 1.1,
  "ios": 1.12,
  "android": 1.1,
  "ui_ux": 1.08,
  "product_management": 1.15,
};

// Common skill suggestions based on title
const skillSuggestionsByTitle: Record<string, string[]> = {
  "frontend_developer": ["javascript", "react", "angular", "vue", "html", "css"],
  "backend_developer": ["python", "java", "node", "sql", "nosql"],
  "fullstack_developer": ["javascript", "python", "react", "node", "sql"],
  "data_scientist": ["python", "machine_learning", "data_science", "sql"],
  "devops_engineer": ["aws", "azure", "docker", "kubernetes", "devops"],
  "product_manager": ["product_management", "ui_ux"],
  "designer": ["ui_ux"],
  "mobile_developer": ["mobile", "ios", "android", "react"],
};

// Base salary ranges by title
const baseSalaryByTitle: Record<string, { min: number; max: number }> = {
  "frontend_developer": { min: 70000, max: 120000 },
  "backend_developer": { min: 80000, max: 130000 },
  "fullstack_developer": { min: 85000, max: 140000 },
  "data_scientist": { min: 90000, max: 150000 },
  "devops_engineer": { min: 90000, max: 145000 },
  "product_manager": { min: 95000, max: 160000 },
  "designer": { min: 65000, max: 110000 },
  "mobile_developer": { min: 80000, max: 135000 },
  "other": { min: 60000, max: 100000 },
};

export function SalaryPredictor() {
  const { t, i18n } = useTranslation();
  const [jobTitle, setJobTitle] = useState<string>("frontend_developer");
  const [experience, setExperience] = useState<number>(3);
  const [location, setLocation] = useState<string>("remote");
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState<string>("");
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [prediction, setPrediction] = useState<{ min: number; max: number } | null>(null);

  // Calculate suggestions based on selected job title
  const suggestedSkills = skillSuggestionsByTitle[jobTitle] || [];
  
  // Filter out already selected skills
  const filteredSuggestions = suggestedSkills.filter(skill => !skills.includes(skill));

  const handleAddSkill = (skill: string) => {
    if (skill && !skills.includes(skill)) {
      setSkills([...skills, skill]);
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(i18n.language, { 
      style: 'currency', 
      currency: 'USD',
      maximumFractionDigits: 0 
    }).format(amount);
  };

  const calculateSalary = () => {
    // Get base salary range for selected job title
    const baseSalary = baseSalaryByTitle[jobTitle] || baseSalaryByTitle.other;
    
    // Adjust for experience (0.1 increase per year of experience)
    const expMultiplier = 1 + (experience * 0.1);
    
    // Adjust for location
    const locationMultiplier = locationFactors[location] || locationFactors.other;
    
    // Calculate skill multiplier (capped at 1.5 total boost)
    let skillMultiplier = 1;
    if (skills.length > 0) {
      const totalSkillBoost = skills.reduce((acc, skill) => {
        return acc + ((skillMultipliers[skill] || 1) - 1);
      }, 0);
      
      // Cap skill boost at 0.5 (50%)
      const cappedSkillBoost = Math.min(totalSkillBoost, 0.5);
      skillMultiplier = 1 + cappedSkillBoost;
    }
    
    // Calculate adjusted min and max salary
    const minSalary = Math.round(baseSalary.min * expMultiplier * locationMultiplier * skillMultiplier);
    const maxSalary = Math.round(baseSalary.max * expMultiplier * locationMultiplier * skillMultiplier);
    
    return { min: minSalary, max: maxSalary };
  };

  const handlePredict = () => {
    const salaryRange = calculateSalary();
    setPrediction(salaryRange);
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <DollarSign className="mr-2 h-6 w-6 text-primary" />
          {t("Salary Predictor")}
        </CardTitle>
        <CardDescription>
          {t("Estimate your potential salary based on experience, location, and skills")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-1.5">
          <Label htmlFor="jobTitle">{t("Job Title")}</Label>
          <Select value={jobTitle} onValueChange={(value) => {
            setJobTitle(value);
            // Reset skills when job title changes
            setSkills([]);
          }}>
            <SelectTrigger id="jobTitle">
              <SelectValue placeholder={t("Select a job title")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="frontend_developer">{t("Frontend Developer")}</SelectItem>
              <SelectItem value="backend_developer">{t("Backend Developer")}</SelectItem>
              <SelectItem value="fullstack_developer">{t("Full Stack Developer")}</SelectItem>
              <SelectItem value="data_scientist">{t("Data Scientist")}</SelectItem>
              <SelectItem value="devops_engineer">{t("DevOps Engineer")}</SelectItem>
              <SelectItem value="product_manager">{t("Product Manager")}</SelectItem>
              <SelectItem value="designer">{t("UI/UX Designer")}</SelectItem>
              <SelectItem value="mobile_developer">{t("Mobile Developer")}</SelectItem>
              <SelectItem value="other">{t("Other")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between">
            <Label htmlFor="experience">{t("Years of Experience")}</Label>
            <span className="text-sm text-muted-foreground">{experience} {experience === 1 ? t('year') : t('years')}</span>
          </div>
          <Slider
            id="experience"
            min={0}
            max={15}
            step={1}
            value={[experience]}
            onValueChange={(value) => setExperience(value[0])}
            className="py-2"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="location">{t("Location")}</Label>
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger id="location">
              <SelectValue placeholder={t("Select a location")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="san_francisco">{t("San Francisco")}</SelectItem>
              <SelectItem value="new_york">{t("New York")}</SelectItem>
              <SelectItem value="seattle">{t("Seattle")}</SelectItem>
              <SelectItem value="austin">{t("Austin")}</SelectItem>
              <SelectItem value="chicago">{t("Chicago")}</SelectItem>
              <SelectItem value="boston">{t("Boston")}</SelectItem>
              <SelectItem value="los_angeles">{t("Los Angeles")}</SelectItem>
              <SelectItem value="denver">{t("Denver")}</SelectItem>
              <SelectItem value="remote">{t("Remote")}</SelectItem>
              <SelectItem value="other">{t("Other")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="skills">{t("Skills")}</Label>
          
          <div className="flex flex-wrap gap-2 mb-2">
            {skills.map((skill) => (
              <Badge key={skill} variant="secondary" className="flex items-center gap-1 py-1.5">
                {t(skill.replace('_', ' '))}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-destructive" 
                  onClick={() => handleRemoveSkill(skill)} 
                />
              </Badge>
            ))}
          </div>
          
          <div className="relative">
            <div className="flex">
              <Input
                id="skills"
                placeholder={t("Add a skill (e.g. javascript, python)")}
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleAddSkill(newSkill)}
                className="ml-2"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-md">
                <div className="flex justify-between items-center px-2 py-1.5 border-b">
                  <span className="text-xs font-semibold">{t("Suggested skills")}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowSuggestions(false)}
                    className="h-5 w-5"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="p-2 max-h-48 overflow-y-auto">
                  <div className="flex flex-wrap gap-2">
                    {filteredSuggestions.map((skill) => (
                      <Badge 
                        key={skill} 
                        variant="outline" 
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                        onClick={() => {
                          handleAddSkill(skill);
                          setShowSuggestions(false);
                        }}
                      >
                        {t(skill.replace('_', ' '))}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {prediction && (
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-lg font-medium">{t("Estimated Salary Range")}:</p>
            <p className="text-3xl font-bold text-primary">
              {formatCurrency(prediction.min)} - {formatCurrency(prediction.max)}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {t("Based on job title, {{experience}} {{yearLabel}} of experience, {{location}} location, and {{skillCount}} skills.", {
                experience: experience,
                yearLabel: experience === 1 ? t('year') : t('years'),
                location: t(location.replace('_', ' ')),
                skillCount: skills.length
              })}
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handlePredict} className="w-full">
          {t("Predict Salary")}
        </Button>
      </CardFooter>
    </Card>
  );
} 