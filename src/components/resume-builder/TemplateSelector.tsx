import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface TemplateSelectorProps {
  selectedTemplate: string;
  setSelectedTemplate: (template: string) => void;
}

export default function TemplateSelector({ 
  selectedTemplate, 
  setSelectedTemplate 
}: TemplateSelectorProps) {
  const templates = [
    {
      id: "modern",
      name: "Modern",
      description: "Clean and professional design with a touch of color",
      preview: "/templates/modern.png"
    },
    {
      id: "classic",
      name: "Classic",
      description: "Traditional layout that works well for most industries",
      preview: "/templates/classic.png"
    },
    {
      id: "minimal",
      name: "Minimal",
      description: "Simple and elegant with focus on content",
      preview: "/templates/minimal.png"
    },
    {
      id: "creative",
      name: "Creative",
      description: "Bold design for creative industries",
      preview: "/templates/creative.png"
    }
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Choose a Template</h3>
        <p className="text-sm text-muted-foreground">
          Select a template that best fits your industry and personal style
        </p>
      </div>

      <RadioGroup
        value={selectedTemplate}
        onValueChange={setSelectedTemplate}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {templates.map((template) => (
          <div key={template.id} className="relative">
            <RadioGroupItem
              value={template.id}
              id={template.id}
              className="sr-only"
            />
            <Label
              htmlFor={template.id}
              className="cursor-pointer"
            >
              <Card className={`overflow-hidden border-2 transition-all ${
                selectedTemplate === template.id 
                  ? "border-primary" 
                  : "border-muted hover:border-muted-foreground/50"
              }`}>
                <div className="aspect-[3/4] relative bg-muted">
                  {/* Placeholder for template preview image */}
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    <img 
                      src={template.preview} 
                      alt={`${template.name} template preview`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback for missing images
                        e.currentTarget.src = "https://placehold.co/300x400/e2e8f0/64748b?text=Template+Preview";
                      }}
                    />
                  </div>
                </div>
                <CardContent className="p-3">
                  <div className="font-medium">{template.name}</div>
                  <div className="text-xs text-muted-foreground">{template.description}</div>
                </CardContent>
              </Card>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
} 