import { SectionCard } from "@/components/ui/section-card";
import { ImagePlus } from "lucide-react";

interface SectionProps {
  expanded: boolean;
  onToggle: () => void;
  sectionRef: (el: HTMLDivElement | null) => void;
}

export default function Section06PropertyImages({ expanded, onToggle, sectionRef }: SectionProps) {
  return (
    <SectionCard
      id="property-images"
      title="6. Property Images"
      icon={ImagePlus}
      variant="light"
      expanded={expanded}
      onToggle={onToggle}
      sectionRef={sectionRef}
    >
      <p className="text-sm text-muted-foreground">
        Each property can have images uploaded or generated using AI. Images appear on property cards and detail pages.
      </p>

      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-semibold mb-2">Uploading Images</h4>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li>&#8226; On the property detail page, click the image area or the upload button.</li>
          <li>&#8226; Select an image file from your device (JPEG, PNG, or WebP).</li>
          <li>&#8226; The image is uploaded to cloud storage and displayed on the property card.</li>
        </ul>
      </div>

      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-semibold mb-2">AI Image Generation</h4>
        <p className="text-sm text-muted-foreground">
          Click <strong>"Generate with AI"</strong> to create a photorealistic rendering of the property based on its
          name and description. The system uses the property details to produce a unique image.
        </p>
      </div>
    </SectionCard>
  );
}
