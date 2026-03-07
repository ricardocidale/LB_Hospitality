import { Card } from "@/components/ui/card";
import { UserManualSection } from "./constants";

interface UserManualTOCProps {
  sections: UserManualSection[];
  scrollToSection: (id: string) => void;
}

export function UserManualTOC({ sections, scrollToSection }: UserManualTOCProps) {
  return (
    <aside className="hidden lg:block w-72 flex-shrink-0">
      <div className="sticky top-24">
        <Card className="bg-white border-gray-200 shadow-sm">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Table of Contents</h3>
            <nav className="space-y-1">
              {sections.map((s) => (
                <button
                  key={s.id}
                  data-testid={`um-toc-${s.id}`}
                  onClick={() => scrollToSection(s.id)}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-colors truncate"
                >
                  {s.title}
                </button>
              ))}
            </nav>
          </div>
        </Card>
      </div>
    </aside>
  );
}
