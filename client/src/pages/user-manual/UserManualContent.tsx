import { Suspense, lazy } from "react";
import { USER_MANUAL_SECTIONS } from "./constants";

const sectionComponents = [
  lazy(() => import("./sections/Section01GettingStarted")),
  lazy(() => import("./sections/Section02Navigation")),
  lazy(() => import("./sections/Section03Dashboard")),
  lazy(() => import("./sections/Section04Properties")),
  lazy(() => import("./sections/Section05PropertyDetails")),
  lazy(() => import("./sections/Section06PropertyImages")),
  lazy(() => import("./sections/Section07ManagementCompany")),
  lazy(() => import("./sections/Section08Assumptions")),
  lazy(() => import("./sections/Section09Scenarios")),
  lazy(() => import("./sections/Section10Analysis")),
  lazy(() => import("./sections/Section11PropertyFinder")),
  lazy(() => import("./sections/Section12Exports")),
  lazy(() => import("./sections/Section13Marcela")),
  lazy(() => import("./sections/Section14Profile")),
  lazy(() => import("./sections/Section15Branding")),
  lazy(() => import("./sections/Section16Admin")),
  lazy(() => import("./sections/Section17BusinessRules")),
];

interface UserManualContentProps {
  expandedSections: Set<string>;
  toggleSection: (id: string) => void;
  sectionRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
}

export function UserManualContent({ expandedSections, toggleSection, sectionRefs }: UserManualContentProps) {
  return (
    <main className="flex-1 space-y-4 min-w-0">
      {USER_MANUAL_SECTIONS.map((section, i) => {
        const Component = sectionComponents[i];
        return (
          <Suspense key={section.id} fallback={<div className="h-14 rounded-xl bg-muted/30 animate-pulse" />}>
            <Component
              expanded={expandedSections.has(section.id)}
              onToggle={() => toggleSection(section.id)}
              sectionRef={(el: HTMLDivElement | null) => { sectionRefs.current[section.id] = el; }}
            />
          </Suspense>
        );
      })}
    </main>
  );
}
