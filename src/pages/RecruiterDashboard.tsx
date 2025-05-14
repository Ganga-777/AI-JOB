import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

const initialJob = {
  title: "",
  description: "",
  requirements: "",
  salary: "",
  location: "",
};

export default function RecruiterDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [job, setJob] = useState(initialJob);
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState([]);

  React.useEffect(() => {
    if (!user || profile?.role !== "recruiter") {
      navigate("/login");
    } else {
      fetchJobs();
    }
    // eslint-disable-next-line
  }, [user, profile]);

  const fetchJobs = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("company", profile?.company || "");
    if (!error) setJobs(data || []);
  };

  const handleChange = (e) => {
    setJob({ ...job, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from("jobs").insert({
        title: job.title,
        description: job.description,
        requirements: job.requirements.split(",").map((r) => r.trim()),
        salary_range: job.salary,
        location: job.location,
        company: profile?.company || "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      toast({ title: "Job Posted", description: "Your job listing has been posted." });
      setJob(initialJob);
      fetchJobs();
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Recruiter Dashboard</h1>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Post a New Job</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input name="title" placeholder="Job Title" value={job.title} onChange={handleChange} required />
            <Textarea name="description" placeholder="Job Description" value={job.description} onChange={handleChange} required />
            <Textarea name="requirements" placeholder="Requirements (comma separated)" value={job.requirements} onChange={handleChange} required />
            <Input name="salary" placeholder="Salary Range (e.g. 60000-80000)" value={job.salary} onChange={handleChange} />
            <Input name="location" placeholder="Location" value={job.location} onChange={handleChange} />
            <Button type="submit" disabled={loading}>{loading ? "Posting..." : "Post Job"}</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Your Job Listings</CardTitle>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <p>No jobs posted yet.</p>
          ) : (
            <ul className="space-y-4">
              {jobs.map((j) => (
                <li key={j.id} className="border-b pb-2">
                  <div className="font-semibold">{j.title}</div>
                  <div className="text-sm text-muted-foreground">{j.location} | {j.salary_range}</div>
                  <div className="text-xs">{j.description}</div>
                  <div className="text-xs text-muted-foreground">Requirements: {j.requirements?.join(", ")}</div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}