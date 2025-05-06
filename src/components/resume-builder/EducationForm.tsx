import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";

const educationSchema = z.object({
  institution: z.string().min(1, "Institution name is required"),
  degree: z.string().min(1, "Degree is required"),
  fieldOfStudy: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  current: z.boolean().default(false),
  gpa: z.string().optional(),
  achievements: z.string().optional(),
});

type EducationEntry = z.infer<typeof educationSchema>;

interface EducationFormProps {
  data: EducationEntry[];
  updateData: (data: EducationEntry[]) => void;
}

export default function EducationForm({ data, updateData }: EducationFormProps) {
  const [educations, setEducations] = useState<EducationEntry[]>(data || []);
  const [isAdding, setIsAdding] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const form = useForm<EducationEntry>({
    resolver: zodResolver(educationSchema),
    defaultValues: {
      institution: "",
      degree: "",
      fieldOfStudy: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      gpa: "",
      achievements: "",
    },
  });

  // Update parent data when educations change
  useEffect(() => {
    updateData(educations);
  }, [educations, updateData]);

  const onSubmit = (values: EducationEntry) => {
    if (editIndex !== null) {
      // Update existing education
      const updatedEducations = [...educations];
      updatedEducations[editIndex] = values;
      setEducations(updatedEducations);
      setEditIndex(null);
    } else {
      // Add new education
      setEducations((prev) => [...prev, values]);
    }

    // Reset form and state
    form.reset({
      institution: "",
      degree: "",
      fieldOfStudy: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      gpa: "",
      achievements: "",
    });
    setIsAdding(false);
  };

  const handleEdit = (index: number) => {
    const education = educations[index];
    form.reset({
      institution: education.institution,
      degree: education.degree,
      fieldOfStudy: education.fieldOfStudy || "",
      location: education.location || "",
      startDate: education.startDate,
      endDate: education.endDate || "",
      current: education.current || false,
      gpa: education.gpa || "",
      achievements: education.achievements || "",
    });
    setEditIndex(index);
    setIsAdding(true);
  };

  const handleDelete = (index: number) => {
    setEducations((prev) => prev.filter((_, i) => i !== index));
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
  
  // Handle current education checkbox
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
      {/* Education list */}
      {educations.length > 0 && (
        <div className="space-y-4">
          {educations.map((education, index) => (
            <Card key={index} className="relative">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{education.degree}{education.fieldOfStudy ? `, ${education.fieldOfStudy}` : ''}</CardTitle>
                    <CardDescription>{education.institution}</CardDescription>
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
                    {education.location || "N/A"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Duration: </span>
                    {education.startDate} - {education.current ? "Present" : education.endDate}
                  </div>
                  {education.gpa && (
                    <div>
                      <span className="text-muted-foreground">GPA: </span>
                      {education.gpa}
                    </div>
                  )}
                </div>
                {education.achievements && (
                  <div>
                    <span className="text-muted-foreground text-sm">Achievements: </span>
                    <p className="text-sm">{education.achievements}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit form */}
      {isAdding ? (
        <Card>
          <CardHeader>
            <CardTitle>{editIndex !== null ? "Edit Education" : "Add Education"}</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="institution"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Institution *</FormLabel>
                        <FormControl>
                          <Input placeholder="Harvard University" {...field} />
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
                          <Input placeholder="Cambridge, MA" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="degree"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Degree *</FormLabel>
                        <FormControl>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select degree" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="High School Diploma">High School Diploma</SelectItem>
                              <SelectItem value="Associate's Degree">Associate's Degree</SelectItem>
                              <SelectItem value="Bachelor's Degree">Bachelor's Degree</SelectItem>
                              <SelectItem value="Master's Degree">Master's Degree</SelectItem>
                              <SelectItem value="MBA">MBA</SelectItem>
                              <SelectItem value="Ph.D.">Ph.D.</SelectItem>
                              <SelectItem value="Certificate">Certificate</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fieldOfStudy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Field of Study</FormLabel>
                        <FormControl>
                          <Input placeholder="Computer Science" {...field} />
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

                  <FormField
                    control={form.control}
                    name="gpa"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GPA</FormLabel>
                        <FormControl>
                          <Input placeholder="3.8/4.0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                        <FormLabel>I am currently studying here</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="achievements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Achievements/Activities</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Relevant coursework, honors, awards, extracurricular activities..."
                          className="h-24 resize-none"
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
                    {editIndex !== null ? "Update" : "Add"} Education
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
          <Plus className="mr-2 h-4 w-4" /> Add Education
        </Button>
      )}
      
      {/* ATS Tips */}
      {!isAdding && (
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <h3 className="font-medium mb-2">Tips for Education Section</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Include your highest level of education first</li>
              <li>• Only include GPA if it's 3.0 or higher</li>
              <li>• Mention relevant coursework that aligns with job requirements</li>
              <li>• List academic achievements and honors</li>
              <li>• For recent graduates, place education before experience</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 