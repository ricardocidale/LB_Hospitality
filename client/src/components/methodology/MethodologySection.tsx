import { SectionCard } from "@/components/ui/section-card";
import { LucideIcon } from "lucide-react";

interface MethodologySectionProps {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  className?: string;
  expanded: boolean;
  onToggle: () => void;
  sectionRef: (el: HTMLDivElement | null) => void;
  children: React.ReactNode;
}

export function MethodologySection({
  id,
  title,
  subtitle,
  icon,
  className,
  expanded,
  onToggle,
  sectionRef,
  children,
}: MethodologySectionProps) {
  return (
    <SectionCard
      id={id}
      title={title}
      subtitle={subtitle}
      icon={icon}
      variant="light"
      className={className}
      expanded={expanded}
      onToggle={onToggle}
      sectionRef={sectionRef}
    >
      {children}
    </SectionCard>
  );
}
