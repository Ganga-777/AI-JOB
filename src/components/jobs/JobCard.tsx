import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, MapPin, Building2, DollarSign, Calendar, Save, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface JobApplication {
  id: string;
  job_id: string;
  user_id: string;
  status: "applied" | "interviewing" | "offered" | "rejected";
  created_at: string;
}

interface JobCardProps {
  job: {
    id: string;
    title: string;
    company: string;
    location?: string;
    salary_range?: string;
    min_salary?: number;
    max_salary?: number;
    description: string;
    requirements?: string[];
    posted_date?: string;
    remote?: boolean;
    matchScore: number;
  };
  userId?: string;
  onSave?: (jobId: string) => void;
  onApply?: (jobId: string) => void;
  isSaved?: boolean;
  application?: JobApplication;
}

export const JobCard = ({ 
  job, 
  userId, 
  onSave, 
  onApply, 
  isSaved = false, 
  application 
}: JobCardProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleApply = () => {
    if (!userId) {
      toast({
        title: "Sign in required",
        description: "Please sign in to apply for jobs",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    if (onApply) {
      onApply(job.id);
    }
  };

  const handleSave = () => {
    if (!userId) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save jobs",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    if (onSave) {
      onSave(job.id);
    }
  };

  // Format posted date
  const formatPostedDate = (dateString?: string) => {
    if (!dateString) return "";
    
    const postedDate = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - postedDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    
    return postedDate.toLocaleDateString();
  };

  // Get application status badge
  const getApplicationStatusBadge = () => {
    if (!application) return null;
    
    const statusColors: Record<string, string> = {
      applied: "bg-blue-100 text-blue-800 border-blue-200",
      interviewing: "bg-purple-100 text-purple-800 border-purple-200",
      offered: "bg-green-100 text-green-800 border-green-200",
      rejected: "bg-red-100 text-red-800 border-red-200"
    };
    
    return (
      <Badge variant="outline" className={statusColors[application.status]}>
        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
      </Badge>
    );
  };

  return (
    <Card className="relative h-full flex flex-col">
      {job.matchScore > 0 && (
        <div className="absolute top-4 right-4 bg-primary text-white px-2 py-1 rounded-full text-sm">
          {Math.round(job.matchScore)}% Match
        </div>
      )}
      <CardHeader className="pb-2">
        <CardTitle className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-semibold">{job.title}</h3>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>{job.company}</span>
            </div>
          </div>
          <Briefcase className="h-6 w-6 text-primary" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 flex-grow">
        <div className="grid grid-cols-2 gap-2">
          {job.location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4" />
              <span>{job.location}{job.remote ? " (Remote)" : ""}</span>
            </div>
          )}
          {(job.salary_range || job.min_salary || job.max_salary) && (
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4" />
              <span>
                {job.salary_range || (job.min_salary && job.max_salary 
                  ? `$${job.min_salary.toLocaleString()} - $${job.max_salary.toLocaleString()}`
                  : job.min_salary
                    ? `From $${job.min_salary.toLocaleString()}`
                    : "Unspecified")}
              </span>
            </div>
          )}
          {job.posted_date && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              <span>{formatPostedDate(job.posted_date)}</span>
            </div>
          )}
          {application && (
            <div className="flex items-center">
              {getApplicationStatusBadge()}
            </div>
          )}
        </div>
        
        <p className="text-sm text-muted-foreground line-clamp-3">
          {job.description}
        </p>
        
        {job.requirements && job.requirements.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {job.requirements.map((req: string, index: number) => (
              <span
                key={index}
                className="bg-secondary/10 text-secondary text-xs px-2 py-1 rounded-full"
              >
                {req}
              </span>
            ))}
          </div>
        )}
      </CardContent>
      <div className="px-6 pb-6 pt-2 flex gap-2 mt-auto">
        <Button
          variant={isSaved ? "default" : "outline"}
          size="sm"
          className="flex-1"
          onClick={handleSave}
        >
          {isSaved ? <Check className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          {isSaved ? "Saved" : "Save"}
        </Button>
        <Button
          className="flex-1"
          size="sm"
          onClick={handleApply}
          disabled={!!application}
        >
          {application ? "Applied" : "Apply Now"}
        </Button>
      </div>
    </Card>
  );
};