import { createContext, useContext, type ReactNode } from "react";
import type { IconSetType } from "@/features/design-themes/types";

const IconSetContext = createContext<IconSetType>("lucide");

export function IconSetProvider({ value, children }: { value: IconSetType; children: ReactNode }) {
  return <IconSetContext.Provider value={value}>{children}</IconSetContext.Provider>;
}

export function useIconSet(): IconSetType {
  return useContext(IconSetContext);
}
