import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Link as LinkIcon } from "lucide-react";

const projectSchema = z.object({
  title: z.string().min(1, "Project title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  technologies: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  link: z.string().url().optional().or(z.literal("")),
});

type ProjectEntry = z.infer<typeof projectSchema>;

interface ProjectsFormProps {
  data: ProjectEntry[];
  updateData: (data: ProjectEntry[]) => void;
}

export default function ProjectsForm({ data, updateData }: ProjectsFormProps) {
  const [projects, setProjects] = useState<ProjectEntry[]>(data || []);
  const [isAdding, setIsAdding] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const form = useForm<ProjectEntry>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: "",
      description: "",
      technologies: "",
      startDate: "",
      endDate: "",
      link: "",
    },
  });

  // Update parent data when projects change
  useEffect(() => {
    updateData(projects);
  }, [projects, updateData]);

  const onSubmit = (values: ProjectEntry) => {
    if (editIndex !== null) {
      // Update existing project
      const updatedProjects = [...projects];
      updatedProjects[editIndex] = values;
      setProjects(updatedProjects);
      setEditIndex(null);
    } else {
      // Add new project
      setProjects((prev) => [...prev, values]);
    }

    // Reset form and state
    form.reset({
      title: "",
      description: "",
      technologies: "",
      startDate: "",
      endDate: "",
      link: "",
    });
    setIsAdding(false);
  };

  const handleEdit = (index: number) => {
    const project = projects[index];
    form.reset({
      title: project.title,
      description: project.description,
      technologies: project.technologies || "",
      startDate: project.startDate || "",
      endDate: project.endDate || "",
      link: project.link || "",
    });
    setEditIndex(index);
    setIsAdding(true);
  };

  const handleDelete = (index: number) => {
    setProjects((prev) => prev.filter((_, i) => i !== index));
    if (editIndex === index) {
      setEditIndex(null);
      setIsAdding(false);
      form.reset();
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditIndex(null);
    form.reset();
  };
  
  return (
    <div className="space-y-6">
      {/* Projects list */}
      {projects.length > 0 && (
        <div className="space-y-4">
          {projects.map((project, index) => (
            <Card key={index} className="relative">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {project.title}
                      {project.link && (
                        <a 
                          href={project.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-700 inline-flex items-center"
                        >
                          <LinkIcon className="h-4 w-4" />
                        </a>
                      )}
                    </CardTitle>
                    {project.technologies && (
                      <CardDescription>
                        Technologies: {project.technologies}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleEdit(index)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {(project.startDate || project.endDate) && (
                  <div className="text-sm mb-2">
                    <span className="text-muted-foreground">Timeline: </span>
                    {project.startDate || ""} {project.startDate && project.endDate && "–"} {project.endDate || ""}
                  </div>
                )}
                <p className="text-sm">{project.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit form */}
      {isAdding ? (
        <Card>
          <CardHeader>
            <CardTitle>{editIndex !== null ? "Edit Project" : "Add Project"}</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="E-commerce Website" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="technologies"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Technologies Used</FormLabel>
                        <FormControl>
                          <Input placeholder="React, Node.js, MongoDB" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="link"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Link</FormLabel>
                        <FormControl>
                          <Input placeholder="https://github.com/username/project" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="month" 
                            placeholder="MM/YYYY" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="month" 
                            placeholder="MM/YYYY or 'Ongoing'" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the project, your role, challenges, and outcomes..."
                          className="min-h-32"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2 pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editIndex !== null ? "Update" : "Add"} Project
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      ) : (
        <Button 
          variant="outline" 
          onClick={() => setIsAdding(true)}
          className="w-full py-8 border-dashed"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Project
        </Button>
      )}
      
      {/* ATS Tips */}
      {!isAdding && (
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <h3 className="font-medium mb-2">Tips for Projects Section</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Focus on projects relevant to the job you're applying for</li>
              <li>• Emphasize your role and specific contributions</li>
              <li>• Include quantifiable results and impact when possible</li>
              <li>• List the technologies and methodologies used</li>
              <li>• Include links to live demos or repositories if available</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 