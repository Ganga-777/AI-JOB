import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Plus, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const experienceSchema = z.object({
  company: z.string().min(1, "Company name is required"),
  position: z.string().min(1, "Position is required"),
  location: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  current: z.boolean().default(false),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

type ExperienceEntry = z.infer<typeof experienceSchema>;

interface ExperienceFormProps {
  data: ExperienceEntry[];
  updateData: (data: ExperienceEntry[]) => void;
}

export default function ExperienceForm({ data, updateData }: ExperienceFormProps) {
  const [experiences, setExperiences] = useState<ExperienceEntry[]>(data || []);
  const [isAdding, setIsAdding] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const form = useForm<ExperienceEntry>({
    resolver: zodResolver(experienceSchema),
    defaultValues: {
      company: "",
      position: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      description: "",
    },
  });

  // Update parent data when experiences change
  useEffect(() => {
    updateData(experiences);
  }, [experiences, updateData]);

  const onSubmit = (values: ExperienceEntry) => {
    if (editIndex !== null) {
      // Update existing experience
      const updatedExperiences = [...experiences];
      updatedExperiences[editIndex] = values;
      setExperiences(updatedExperiences);
      setEditIndex(null);
    } else {
      // Add new experience
      setExperiences((prev) => [...prev, values]);
    }

    // Reset form and state
    form.reset({
      company: "",
      position: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      description: "",
    });
    setIsAdding(false);
  };

  const handleEdit = (index: number) => {
    const experience = experiences[index];
    form.reset({
      company: experience.company,
      position: experience.position,
      location: experience.location || "",
      startDate: experience.startDate,
      endDate: experience.endDate || "",
      current: experience.current || false,
      description: experience.description,
    });
    setEditIndex(index);
    setIsAdding(true);
  };

  const handleDelete = (index: number) => {
    setExperiences((prev) => prev.filter((_, i) => i !== index));
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
  
  // Handle current job checkbox
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (value.current) {
        form.setValue("endDate", "");
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);
  
  return (
    <div className="space-y-6">
      {/* Experience list */}
      {experiences.length > 0 && (
        <div className="space-y-4">
          {experiences.map((experience, index) => (
            <Card key={index} className="relative">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{experience.position}</CardTitle>
                    <CardDescription>{experience.company}</CardDescription>
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
                <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                  <div>
                    <span className="text-muted-foreground">Location: </span>
                    {experience.location || "N/A"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Duration: </span>
                    {experience.startDate} - {experience.current ? "Present" : experience.endDate}
                  </div>
                </div>
                <p className="text-sm">{experience.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit form */}
      {isAdding ? (
        <Card>
          <CardHeader>
            <CardTitle>{editIndex !== null ? "Edit Experience" : "Add Experience"}</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company *</FormLabel>
                        <FormControl>
                          <Input placeholder="Google, Inc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Title *</FormLabel>
                        <FormControl>
                          <Input placeholder="Senior Developer" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="Mountain View, CA" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date *</FormLabel>
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
                              placeholder="MM/YYYY" 
                              {...field} 
                              disabled={form.watch("current")}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="current"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>I currently work here</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Description *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your responsibilities, achievements, and key contributions..."
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
                    {editIndex !== null ? "Update" : "Add"} Experience
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
          <Plus className="mr-2 h-4 w-4" /> Add Work Experience
        </Button>
      )}
      
      {/* ATS Tips */}
      {!isAdding && (
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <h3 className="font-medium mb-2">Tips for Work Experience</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Use action verbs to start your bullet points (e.g., Developed, Managed, Led)</li>
              <li>• Quantify your achievements with numbers and metrics</li>
              <li>• Match keywords from the job descriptions you're targeting</li>
              <li>• Focus on achievements rather than just responsibilities</li>
              <li>• List your experience in reverse chronological order (most recent first)</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 