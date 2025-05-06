import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { useQuery } from "@tanstack/react-query";
import { JobCard } from "@/components/jobs/JobCard";
import { SearchBar } from "@/components/jobs/SearchBar";
import type { Database } from "@/integrations/supabase/types";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Briefcase,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  Filter,
  MapPin,
  Save,
  Search,
  SlidersHorizontal,
  Star,
  Trash2,
  TrendingUp,
} from "lucide-react";

type Job = Database["public"]["Tables"]["jobs"]["Row"];

interface JobApplication {
  id: string;
  job_id: string;
  user_id: string;
  status: "applied" | "interviewing" | "offered" | "rejected";
  created_at: string;
}

interface SavedJob {
  id: string;
  job_id: string;
  user_id: string;
  created_at: string;
}

const jobCategories = [
  "All Categories",
  "Software Development",
  "Data Science",
  "Design",
  "Marketing",
  "Sales",
  "Customer Service",
  "Finance",
  "Healthcare",
  "Education",
];

const experienceLevels = [
  "All Levels",
  "Entry Level",
  "Junior",
  "Mid Level",
  "Senior",
  "Lead",
  "Manager",
];

const employmentTypes = [
  "All Types",
  "Full-time",
  "Part-time",
  "Contract",
  "Freelance",
  "Internship",
];

const Jobs = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedExperience, setSelectedExperience] = useState("All Levels");
  const [selectedType, setSelectedType] = useState("All Types");
  const [salaryRange, setSalaryRange] = useState([0, 200000]);
  const [showRemoteOnly, setShowRemoteOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"relevance" | "date" | "salary">("relevance");
  const [activeTab, setActiveTab] = useState<"all" | "saved" | "applied">("all");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'all' | 'saved' | 'applied' | 'recommended'>('all');

  // Fetch jobs with React Query
  const { data: jobs = [], isLoading: isLoadingJobs, error: jobsError } = useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch user's resume
  const { data: userResume } = useQuery({
    queryKey: ["resume", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("resumes")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch saved jobs
  const { data: savedJobs = [], refetch: refetchSavedJobs } = useQuery<SavedJob[]>({
    queryKey: ["saved-jobs", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("saved_jobs")
        .select("*")
        .eq("user_id", user.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch job applications
  const { data: applications = [], refetch: refetchApplications } = useQuery<JobApplication[]>({
    queryKey: ["applications", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .eq("user_id", user.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const calculateJobMatch = (job: Job) => {
    if (!userResume?.keywords || !job.requirements) return 0;
    const matchingKeywords = job.requirements.filter((req) =>
      userResume.keywords.some(
        (keyword) =>
          keyword.toLowerCase().includes(req.toLowerCase()) ||
          req.toLowerCase().includes(keyword.toLowerCase())
      )
    );
    return (matchingKeywords.length / job.requirements.length) * 100;
  };

  const handleSaveJob = async (jobId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save jobs",
        variant: "destructive",
      });
      return;
    }

    try {
      const isSaved = savedJobs.some((saved) => saved.job_id === jobId);
      
      if (isSaved) {
        await supabase
          .from("saved_jobs")
          .delete()
          .eq("job_id", jobId)
          .eq("user_id", user.id);
        
        toast({
          title: "Job removed from saved jobs",
          description: "You can always save it again later",
        });
      } else {
        await supabase.from("saved_jobs").insert({
          job_id: jobId,
          user_id: user.id,
        });
        
        toast({
          title: "Job saved successfully",
          description: "You can find it in your saved jobs",
        });
      }
      
      refetchSavedJobs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleApplyJob = async (jobId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to apply for jobs",
        variant: "destructive",
      });
      return;
    }

    try {
      const existingApplication = applications.find(
        (app) => app.job_id === jobId
      );

      if (existingApplication) {
        toast({
          title: "Already applied",
          description: "You have already applied for this job",
          variant: "destructive",
        });
        return;
      }

      await supabase.from("applications").insert({
        job_id: jobId,
        user_id: user.id,
        status: "applied",
      });

      toast({
        title: "Application submitted",
        description: "Your application has been submitted successfully",
      });

      refetchApplications();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredJobs = jobs
    .filter((job) => {
      // Basic search filter
      const searchMatch =
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase());

      // Location filter
      const locationMatch =
        locationFilter === "all" ||
        job.location?.toLowerCase() === locationFilter.toLowerCase();

      // Category filter
      const categoryMatch =
        selectedCategory === "All Categories" ||
        job.category === selectedCategory;

      // Experience level filter
      const experienceMatch =
        selectedExperience === "All Levels" ||
        job.experience_level === selectedExperience;

      // Employment type filter
      const typeMatch =
        selectedType === "All Types" ||
        job.employment_type === selectedType;

      // Salary range filter
      const salaryMatch =
        (job.salary_range &&
          parseInt(job.salary_range.split("-")[0]) >= salaryRange[0] &&
          parseInt(job.salary_range.split("-")[1]) <= salaryRange[1]) ||
        !job.salary_range;

      // Remote filter
      const remoteMatch = !showRemoteOnly || job.remote === true;

      return (
        searchMatch &&
        locationMatch &&
        categoryMatch &&
        experienceMatch &&
        typeMatch &&
        salaryMatch &&
        remoteMatch
      );
    })
    .map((job) => ({
      ...job,
      matchScore: calculateJobMatch(job),
      isSaved: savedJobs.some((saved) => saved.job_id === job.id),
      application: applications.find((app) => app.job_id === job.id),
    }))
    .sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "salary":
          const [aMin] = a.salary_range?.split("-").map(Number) || [0];
          const [bMin] = b.salary_range?.split("-").map(Number) || [0];
          return bMin - aMin;
        default:
          return b.matchScore - a.matchScore;
      }
    });

  const savedJobsList = filteredJobs.filter((job) => job.isSaved);
  const appliedJobsList = filteredJobs.filter((job) => job.application);

  // Get top recommendations
  const topRecommendations = getPersonalizedRecommendations(
    jobs.filter(job => !job.isSaved && !job.application),
    5
  );

  if (jobsError) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <p className="text-lg text-destructive">Error loading jobs. Please try again later.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-8">
          {/* Header Section */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Find Your Next Opportunity</h1>
              <p className="text-muted-foreground mt-2">
                {filteredJobs.length} jobs available
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </Button>
          </div>

          {/* Search and Filter Section */}
          <div className="grid gap-6 md:grid-cols-[300px,1fr]">
            {/* Filters Panel */}
            {showFilters && (
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle>Filters</CardTitle>
                  <CardDescription>Refine your job search</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Category Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <Select
                      value={selectedCategory}
                      onValueChange={setSelectedCategory}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {jobCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Experience Level Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Experience Level</label>
                    <Select
                      value={selectedExperience}
                      onValueChange={setSelectedExperience}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select experience level" />
                      </SelectTrigger>
                      <SelectContent>
                        {experienceLevels.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Employment Type Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Employment Type</label>
                    <Select
                      value={selectedType}
                      onValueChange={setSelectedType}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select employment type" />
                      </SelectTrigger>
                      <SelectContent>
                        {employmentTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Salary Range Filter */}
                  <div className="space-y-4">
                    <label className="text-sm font-medium">Salary Range</label>
                    <Slider
                      value={salaryRange}
                      onValueChange={setSalaryRange}
                      min={0}
                      max={200000}
                      step={10000}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>${salaryRange[0].toLocaleString()}</span>
                      <span>${salaryRange[1].toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Remote Only Switch */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Remote Only</label>
                    <Switch
                      checked={showRemoteOnly}
                      onCheckedChange={setShowRemoteOnly}
                    />
                  </div>

                  {/* Sort Options */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sort By</label>
                    <Select value={sortBy} onValueChange={(value: typeof sortBy) => setSortBy(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sort by..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">Best Match</SelectItem>
                        <SelectItem value="date">Most Recent</SelectItem>
                        <SelectItem value="salary">Highest Salary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Main Content */}
            <div className="space-y-6">
              {/* Search Bar */}
              <SearchBar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                locationFilter={locationFilter}
                setLocationFilter={setLocationFilter}
                locations={Array.from(
                  new Set(jobs.map((job) => job.location).filter(Boolean))
                )}
              />

              {/* Add a recommendations card at the top */}
              {user && topRecommendations.length > 0 && (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                      Recommended for You
                    </CardTitle>
                    <CardDescription>
                      Based on your profile, skills, and preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {topRecommendations.slice(0, 3).map((job) => (
                        <JobCard
                          key={job.id}
                          job={job}
                          userId={user?.id}
                          onSave={() => handleSaveJob(job.id)}
                          onApply={() => handleApplyJob(job.id)}
                          isSaved={job.isSaved}
                          application={job.application}
                        />
                      ))}
                    </div>
                    {topRecommendations.length > 3 && (
                      <Button 
                        variant="link" 
                        className="mt-4 mx-auto block"
                        onClick={() => setViewMode('recommended')}
                      >
                        View all recommendations
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Tabs */}
              <Tabs value={viewMode} onValueChange={(value: typeof viewMode) => setViewMode(value as any)}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">All Jobs</TabsTrigger>
                  <TabsTrigger value="recommended">Recommended</TabsTrigger>
                  <TabsTrigger value="saved">Saved</TabsTrigger>
                  <TabsTrigger value="applied">Applied</TabsTrigger>
                </TabsList>

                <TabsContent value="all">
                  <JobsList
                    jobs={filteredJobs}
                    onSave={handleSaveJob}
                    onApply={handleApplyJob}
                    isLoading={isLoadingJobs}
                  />
                </TabsContent>

                <TabsContent value="recommended">
                  <JobsList
                    jobs={jobs.filter(job => job.matchScore >= 70)}
                    onSave={handleSaveJob}
                    onApply={handleApplyJob}
                    isLoading={isLoadingJobs}
                  />
                </TabsContent>

                <TabsContent value="saved">
                  <JobsList
                    jobs={savedJobsList}
                    onSave={handleSaveJob}
                    onApply={handleApplyJob}
                    isLoading={isLoadingJobs}
                  />
                </TabsContent>

                <TabsContent value="applied">
                  <JobsList
                    jobs={appliedJobsList}
                    onSave={handleSaveJob}
                    onApply={handleApplyJob}
                    isLoading={isLoadingJobs}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

interface JobsListProps {
  jobs: (Job & { matchScore: number; isSaved: boolean; application?: JobApplication })[];
  onSave: (jobId: string) => void;
  onApply: (jobId: string) => void;
  isLoading: boolean;
}

const JobsList = ({ jobs, onSave, onApply, isLoading }: JobsListProps) => {
  const { user } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-lg">Loading jobs...</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold">No jobs found</h3>
        <p className="text-muted-foreground">
          Try adjusting your search filters
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {jobs.map((job) => (
        <JobCard
          key={job.id}
          job={job}
          userId={user?.id}
          onSave={() => onSave(job.id)}
          onApply={() => onApply(job.id)}
          isSaved={job.isSaved}
          application={job.application}
        />
      ))}
    </div>
  );
};

// Add a new function to get personalized job recommendations
const getPersonalizedRecommendations = (jobs: Job[], topN: number = 5) => {
  if (!jobs.length) return [];
  
  // Sort jobs by match score
  const sortedJobs = [...jobs].sort((a, b) => {
    const scoreA = a.matchScore || 0;
    const scoreB = b.matchScore || 0;
    return scoreB - scoreA;
  });
  
  // Return top N recommendations
  return sortedJobs.slice(0, topN);
};

export default Jobs;
