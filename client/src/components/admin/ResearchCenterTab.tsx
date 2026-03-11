import ResearchTab from "./ResearchTab";

interface ResearchCenterTabProps {
  initialTab?: string;
}

export default function ResearchCenterTab({ initialTab }: ResearchCenterTabProps) {
  return (
    <div className="space-y-6 mt-2">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground" data-testid="text-research-center-title">Research Center</h2>
          <p className="text-muted-foreground text-sm">AI research configuration and prompt management.</p>
        </div>
      </div>

      <ResearchTab />
    </div>
  );
}
