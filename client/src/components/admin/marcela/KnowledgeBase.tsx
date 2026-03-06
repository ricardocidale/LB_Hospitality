import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, RefreshCw, Loader2 } from "lucide-react";
import { useKnowledgeBaseStatus, useReindexKnowledgeBase } from "./hooks";

export function KnowledgeBaseCard() {
  const { data: kbStatus } = useKnowledgeBaseStatus();
  const reindexMutation = useReindexKnowledgeBase();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <CardTitle className="text-base">Knowledge Base (RAG)</CardTitle>
            <CardDescription>
              Marcela searches this knowledge base to answer questions about the platform
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge
                variant={kbStatus?.indexed ? "default" : "secondary"}
                className={kbStatus?.indexed ? "bg-green-100 text-green-700" : ""}
                data-testid="badge-kb-status"
              >
                {kbStatus?.indexed ? "Indexed" : "Not Indexed"}
              </Badge>
              {kbStatus?.chunkCount ? (
                <span className="text-sm text-muted-foreground" data-testid="text-kb-chunks">
                  {kbStatus.chunkCount} chunks
                </span>
              ) : null}
            </div>
            {kbStatus?.indexedAt && (
              <p className="text-xs text-muted-foreground">
                Last indexed: {new Date(kbStatus.indexedAt).toLocaleString()}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => reindexMutation.mutate()}
            disabled={reindexMutation.isPending}
            data-testid="button-reindex-kb"
          >
            {reindexMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            {reindexMutation.isPending ? "Indexing..." : "Reindex"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          The knowledge base includes: User Manual, Checker Manual, business model specification,
          market research documents, financial formulas, GAAP rules, and platform guides.
          It is automatically indexed on first use.
        </p>
      </CardContent>
    </Card>
  );
}
