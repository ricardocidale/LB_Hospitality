import { LucideIcon } from "lucide-react";

export interface ManualSection {
  id: string;
  title: string;
  icon: LucideIcon;
}

export interface CheckerManualProps {
  embedded?: boolean;
}
