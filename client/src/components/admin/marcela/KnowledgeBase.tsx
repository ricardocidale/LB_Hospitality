import { useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BookOpen, RefreshCw, Loader2, Upload, FileUp, Database, CheckCircle2, AlertCircle, FileText, Clock, Trash2 } from "lucide-react";
import { useKnowledgeBaseStatus, useReindexKnowledgeBase, useUploadKnowledgeBase, useUploadKBFile, useAgentConfig, useRemoveKBDocument } from "./hooks";

interface KnowledgeBaseCardProps {
  agentName: string;
}

export function KnowledgeBaseCard({ agentName }: KnowledgeBaseCardProps) {
  const { data: kbStatus } = useKnowledgeBaseStatus();
  const { data: agentConfig } = useAgentConfig();
  const reindexMutation = useReindexKnowledgeBase();
  const uploadMutation = useUploadKnowledgeBase();
  const uploadFileMutation = useUploadKBFile();
  const removeDocMutation = useRemoveKBDocument();

  const elevenlabsKbDocs: any[] = (agentConfig?.conversation_config?.agent as any)?.knowledge_base
    ?? (agentConfig?.conversation_config?.agent?.prompt as any)?.knowledge_base ?? [];
  const hasElevenlabsDocs = elevenlabsKbDocs.length > 0;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleFileUpload = () => {
    if (!selectedFile) return;
    uploadFileMutation.mutate(selectedFile, {
      onSuccess: () => {
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      },
    });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white border border-gray-200/80 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/15 to-violet-500/5 flex items-center justify-center">
              <Database className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-gray-900">RAG Knowledge Base</CardTitle>
              <CardDescription className="label-text mt-0.5">
                In-memory vector embeddings for real-time retrieval during conversations
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-muted/40 to-muted/20 rounded-xl border border-muted/60">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className={`w-2.5 h-2.5 rounded-full ${kbStatus?.indexed ? "bg-green-500 animate-pulse" : "bg-muted-foreground/30"}`} />
                <span className="text-sm font-semibold">
                  {kbStatus?.indexed ? "Indexed" : "Not Indexed"}
                </span>
                {kbStatus?.chunkCount ? (
                  <Badge variant="outline" className="text-[10px] font-mono" data-testid="badge-kb-chunks">
                    {kbStatus.chunkCount} chunks
                  </Badge>
                ) : null}
              </div>
              {kbStatus?.indexedAt && (
                <p className="text-[11px] text-muted-foreground/60 flex items-center gap-1.5 pl-5">
                  <Clock className="w-3 h-3" />
                  Last indexed {new Date(kbStatus.indexedAt).toLocaleString()}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => reindexMutation.mutate()}
              disabled={reindexMutation.isPending}
              className="gap-1.5 shadow-sm"
              data-testid="button-reindex-kb"
            >
              {reindexMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              {reindexMutation.isPending ? "Indexing..." : "Reindex"}
            </Button>
          </div>

          <div className="text-xs text-muted-foreground/60 px-1 leading-relaxed">
            Covers company overview, business model, financial formulas, GAAP compliance, property lifecycle,
            management company structure, verification system, and platform navigation guides.
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border border-gray-200/80 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-gray-900">ElevenLabs Knowledge Base</CardTitle>
              <CardDescription className="label-text mt-0.5">
                Documents attached to {agentName}'s Conversational AI agent for reference during voice and text conversations
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {!hasElevenlabsDocs && agentConfig !== undefined && (
            <div className="flex items-start gap-3 p-3.5 bg-gradient-to-br from-amber-50 to-orange-50/50 rounded-xl border border-amber-200/60">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-900">No documents attached to ElevenLabs agent</p>
                <p className="text-xs text-amber-700/80 mt-0.5">Push the built-in knowledge base below so {agentName} can reference platform information during conversations.</p>
              </div>
            </div>
          )}
          {hasElevenlabsDocs && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                  Attached Documents ({elevenlabsKbDocs.length})
                </span>
              </div>
              <div className="space-y-1.5">
                {elevenlabsKbDocs.map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50/50 to-emerald-50/30 rounded-xl border border-green-200/40">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-3.5 h-3.5 text-green-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{doc.name || doc.id}</p>
                        <p className="text-[10px] text-muted-foreground/50 font-mono">{doc.type || "document"}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 text-muted-foreground/40 hover:text-red-500 shrink-0"
                      onClick={() => removeDocMutation.mutate(doc.id)}
                      disabled={removeDocMutation.isPending}
                    >
                      {removeDocMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground/60" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Built-in Document</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-muted/40 to-muted/20 rounded-xl border border-muted/60">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Hospitality Business Group Knowledge Base</p>
                  <p className="text-[11px] text-muted-foreground/60">Auto-generated from platform data — 15 sections, ~17K characters</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => uploadMutation.mutate()}
                disabled={uploadMutation.isPending}
                className="gap-1.5 shadow-sm"
                data-testid="button-upload-kb"
              >
                {uploadMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                {uploadMutation.isPending ? "Uploading..." : "Push to Agent"}
              </Button>
            </div>
          </div>

          <Separator className="bg-primary/8" />

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileUp className="w-4 h-4 text-muted-foreground/60" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Upload Additional Document</span>
            </div>
            <div className="p-4 bg-gradient-to-r from-muted/30 to-muted/10 rounded-xl border border-dashed border-muted-foreground/20">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.pdf,.doc,.docx,.md,.csv"
                onChange={handleFileSelect}
                className="hidden"
                data-testid="input-kb-file"
              />
              {!selectedFile ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-6 flex flex-col items-center gap-2 text-muted-foreground/50 hover:text-muted-foreground/70 transition-colors cursor-pointer"
                  data-testid="button-select-kb-file"
                >
                  <FileUp className="w-8 h-8" />
                  <span className="text-sm font-medium">Select a file to upload</span>
                  <span className="text-[11px]">Supported: TXT, PDF, DOC, DOCX, MD, CSV</span>
                </button>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                      <p className="text-[11px] text-muted-foreground/60">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="text-muted-foreground/60 hover:text-foreground"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleFileUpload}
                      disabled={uploadFileMutation.isPending}
                      className="gap-1.5 shadow-sm"
                      data-testid="button-upload-kb-file"
                    >
                      {uploadFileMutation.isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      {uploadFileMutation.isPending ? "Uploading..." : "Upload & Attach"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground/50 px-1">
              Uploaded documents are sent to ElevenLabs and attached to {agentName}'s agent for reference during conversations.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
