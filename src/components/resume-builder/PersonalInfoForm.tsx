import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";

const personalInfoSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  location: z.string().optional(),
  linkedin: z.string().optional(),
  website: z.string().optional(),
  summary: z.string().max(500, "Summary must be less than 500 characters").optional(),
});

type PersonalInfoFormValues = z.infer<typeof personalInfoSchema>;

interface PersonalInfoFormProps {
  data: PersonalInfoFormValues;
  updateData: (data: PersonalInfoFormValues) => void;
}

export default function PersonalInfoForm({ data, updateData }: PersonalInfoFormProps) {
  const form = useForm<PersonalInfoFormValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      name: data.name || "",
      email: data.email || "",
      phone: data.phone || "",
      location: data.location || "",
      linkedin: data.linkedin || "",
      website: data.website || "",
      summary: data.summary || "",
    },
  });

  // Update form whenever data changes
  useEffect(() => {
    form.reset({
      name: data.name || "",
      email: data.email || "",
      phone: data.phone || "",
      location: data.location || "",
      linkedin: data.linkedin || "",
      website: data.website || "",
      summary: data.summary || "",
    });
  }, [data, form]);

  // Update parent data when form changes
  const onSubmit = (values: PersonalInfoFormValues) => {
    updateData(values);
  };

  // Update parent data on field change
  useEffect(() => {
    const subscription = form.watch((value) => {
      updateData(value as PersonalInfoFormValues);
    });
    return () => subscription.unsubscribe();
  }, [form, updateData]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Jane Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address *</FormLabel>
                <FormControl>
                  <Input placeholder="jane@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="(123) 456-7890" {...field} />
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
                  <Input placeholder="City, State" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="linkedin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>LinkedIn URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://linkedin.com/in/janedoe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website/Portfolio</FormLabel>
                <FormControl>
                  <Input placeholder="https://janedoe.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="summary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Professional Summary</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Brief overview of your professional background and key qualifications"
                  className="h-32 resize-none"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
              <div className="text-xs text-muted-foreground mt-1">
                {field.value?.length || 0}/500 characters
              </div>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
} 