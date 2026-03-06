import { Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AIReviewPanelProps {
  review: string;
  loading: boolean;
  onRun: () => void;
}

export function AIReviewPanel({ review, loading, onRun }: AIReviewPanelProps) {
  const { toast } = useToast();

  const runAiVerification = async () => {
    onRun();
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between border-b pb-2">
        <h3 className="text-lg font-bold text-gray-900">AI Financial Narrative Review</h3>
        <button
          onClick={runAiVerification}
          disabled={loading}
          className="flex items-center gap-2 text-xs font-bold text-secondary hover:text-secondary/80 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          REFRESH AI REVIEW
        </button>
      </div>
      
      {loading && !review && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400 space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-secondary" />
          <p className="text-sm font-medium animate-pulse">Analyzing verification results and generating narrative...</p>
        </div>
      )}

      {review && (
        <div className="p-6 rounded-2xl bg-secondary/5 border border-secondary/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Sparkles className="w-12 h-12 text-secondary" />
          </div>
          <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap font-serif italic text-lg">
            {review}
          </div>
        </div>
      )}

      {!review && !loading && (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <p className="text-sm text-gray-500">Run the AI review to generate a narrative analysis of the verification findings.</p>
          <button 
            onClick={runAiVerification}
            className="mt-4 px-6 py-2 bg-secondary text-white rounded-full text-sm font-bold shadow-lg shadow-secondary/20 hover:scale-105 transition-transform"
          >
            Start Analysis
          </button>
        </div>
      )}
    </div>
  );
}
