import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, RefreshCw, Loader2, Upload, Wrench } from "lucide-react";
import { useKnowledgeBaseStatus, useReindexKnowledgeBase, useUploadKnowledgeBase, useConfigureAgentTools } from "./hooks";

export function KnowledgeBaseCard() {
  const { data: kbStatus } = useKnowledgeBaseStatus();
  const reindexMutation = useReindexKnowledgeBase();
  const uploadMutation = useUploadKnowledgeBase();
  const configureToolsMutation = useConfigureAgentTools();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <CardTitle className="text-base">Knowledge Base</CardTitle>
            <CardDescription>
              Marcela's knowledge for answering questions about the platform and business model
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
            {reindexMutation.isPending ? "Indexing..." : "Reindex RAG"}
          </Button>
        </div>

        <div className="border-t pt-4 space-y-3">
          <p className="text-sm font-medium">ElevenLabs Agent Configuration</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => uploadMutation.mutate()}
              disabled={uploadMutation.isPending}
              data-testid="button-upload-kb"
            >
              {uploadMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              {uploadMutation.isPending ? "Uploading..." : "Upload Knowledge Base"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => configureToolsMutation.mutate()}
              disabled={configureToolsMutation.isPending}
              data-testid="button-configure-tools"
            >
              {configureToolsMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Wrench className="w-4 h-4 mr-2" />
              )}
              {configureToolsMutation.isPending ? "Configuring..." : "Configure Tools"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Upload sends the complete knowledge base document to ElevenLabs so Marcela can reference it during conversations.
            Configure Tools registers all 18 client and server tools with the ElevenLabs agent.
          </p>
        </div>

        <p className="text-xs text-muted-foreground border-t pt-3">
          The knowledge base includes: company overview, business model, financial formulas, GAAP compliance rules,
          property lifecycle, management company structure, verification system, platform navigation guides, and how-to instructions.
        </p>
      </CardContent>
    </Card>
  );
}
