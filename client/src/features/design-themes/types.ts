export interface DesignColor {
  rank: number;
  name: string;
  hexCode: string;
  description: string;
}

export interface DesignTheme {
  id: number;
  userId: number | null;
  name: string;
  description: string;
  isActive: boolean;
  colors: DesignColor[];
  createdAt: string;
  updatedAt: string;
}
