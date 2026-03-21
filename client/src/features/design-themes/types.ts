export interface DesignColor {
  rank: number;
  name: string;
  hexCode: string;
  description: string;
}

export type IconSetType = "lucide" | "phosphor";

export interface DesignTheme {
  id: number;
  name: string;
  description: string;
  colors: DesignColor[];
  iconSet: IconSetType;
  isDefault: boolean;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}
