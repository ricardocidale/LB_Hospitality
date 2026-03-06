import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Globe, Loader2, Save, RefreshCw, AlertCircle, FileText, Type } from "lucide-react";
import { useAgentConfig, useSaveAgentPrompt } from "./hooks";

const LANGUAGES = [
  { value: "en", label: "English", region: "Americas / Europe" },
  { value: "pt", label: "Portuguese", region: "Brazil / Portugal" },
  { value: "es", label: "Spanish", region: "Americas / Spain" },
  { value: "fr", label: "French", region: "France / Canada" },
  { value: "de", label: "German", region: "Germany / Austria" },
  { value: "it", label: "Italian", region: "Italy" },
  { value: "ja", label: "Japanese", region: "Japan" },
  { value: "zh", label: "Chinese", region: "China / Taiwan" },
  { value: "ko", label: "Korean", region: "South Korea" },
  { value: "ar", label: "Arabic", region: "Middle East / North Africa" },
];

interface PromptEditorProps {
  agentName: string;
}

export function PromptEditor({ agentName }: PromptEditorProps) {
  const { data: agentConfig, isLoading, error, refetch } = useAgentConfig();
  const savePromptMutation = useSaveAgentPrompt();

  const [promptDraft, setPromptDraft] = useState<string | null>(null);
  const [firstMessageDraft, setFirstMessageDraft] = useState<string | null>(null);
  const [languageDraft, setLanguageDraft] = useState<string | null>(null);
  const [isPromptDirty, setIsPromptDirty] = useState(false);

  const agentPrompt = agentConfig?.conversation_config?.agent?.prompt;
  const currentPrompt = promptDraft ?? (agentPrompt as any)?.prompt ?? "";
  const currentFirstMessage = firstMessageDraft ?? agentConfig?.conversation_config?.agent?.first_message ?? "";
  const currentLanguage = languageDraft ?? agentConfig?.conversation_config?.agent?.language ?? "en";

  const handlePromptChange = (value: string) => {
    setPromptDraft(value);
    setIsPromptDirty(true);
  };

  const handleFirstMessageChange = (value: string) => {
    setFirstMessageDraft(value);
    setIsPromptDirty(true);
  };

  const handleLanguageChange = (value: string) => {
    setLanguageDraft(value);
    setIsPromptDirty(true);
  };

  const handleSavePrompt = () => {
    savePromptMutation.mutate({
      prompt: currentPrompt,
      first_message: currentFirstMessage,
      language: currentLanguage,
    }, {
      onSuccess: () => {
        setIsPromptDirty(false);
        refetch();
      },
    });
  };

  if (isLoading) {
    return (
      <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
        <CardContent className="py-16 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">Fetching agent configuration from ElevenLabs...</p>
          <p className="text-xs text-muted-foreground/60 mt-1">This may take a moment on first load</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
        <CardContent className="py-10">
          <div className="flex items-start gap-4 p-5 bg-gradient-to-br from-amber-50 to-orange-50/50 rounded-xl border border-amber-200/60">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-900">Agent configuration unavailable</p>
              <p className="text-xs text-amber-700/80 mt-1 leading-relaxed">{(error as Error).message}</p>
              <Button variant="ghost" size="sm" className="mt-3 gap-1.5 text-amber-700 hover:text-amber-900 hover:bg-amber-100/50 -ml-2" onClick={() => refetch()}>
                <RefreshCw className="w-3.5 h-3.5" /> Retry connection
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const promptCharCount = currentPrompt.length;
  const promptWordCount = currentPrompt.trim() ? currentPrompt.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="font-display text-base">System Prompt</CardTitle>
                <CardDescription className="label-text mt-0.5">
                  Defines {agentName}'s persona, behavior, and knowledge boundaries
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isPromptDirty && (
                <Badge variant="outline" className="text-amber-600 border-amber-300/60 bg-amber-50/80 text-xs font-medium">
                  Unsaved changes
                </Badge>
              )}
              <Button
                size="sm"
                onClick={handleSavePrompt}
                disabled={!isPromptDirty || savePromptMutation.isPending}
                className="gap-1.5 shadow-sm"
                data-testid="button-save-prompt"
              >
                {savePromptMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                Save to ElevenLabs
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              value={currentPrompt}
              onChange={(e) => handlePromptChange(e.target.value)}
              placeholder={`You are ${agentName}, an AI assistant for Hospitality Business Group. You help investors understand hotel business simulations...`}
              className="bg-white/60 min-h-[340px] font-mono text-[13px] leading-relaxed resize-y border-primary/15 focus:border-primary/30 transition-colors"
              data-testid="textarea-system-prompt"
            />
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-4 text-xs text-muted-foreground/70">
                <span className="flex items-center gap-1">
                  <Type className="w-3 h-3" />
                  {promptCharCount.toLocaleString()} characters
                </span>
                <span>{promptWordCount.toLocaleString()} words</span>
              </div>
              {promptCharCount > 8000 && (
                <span className="text-xs text-amber-600 font-medium">
                  Long prompts may increase latency
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/15 to-blue-500/5 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="font-display text-base">First Message</CardTitle>
              <CardDescription className="label-text mt-0.5">
                The opening greeting when a user begins a conversation with {agentName}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label className="label-text font-medium text-xs uppercase tracking-wider text-muted-foreground/70">Greeting Text</Label>
            <Input
              value={currentFirstMessage}
              onChange={(e) => handleFirstMessageChange(e.target.value)}
              placeholder={`Hello! I'm ${agentName}, your assistant for Hospitality Business Group...`}
              className="bg-white/60 border-primary/15 focus:border-primary/30 transition-colors"
              data-testid="input-first-message"
            />
          </div>

          <Separator className="bg-primary/8" />

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground/60" />
              <Label className="label-text font-medium text-xs uppercase tracking-wider text-muted-foreground/70">Default Language</Label>
            </div>
            <Select value={currentLanguage} onValueChange={handleLanguageChange}>
              <SelectTrigger className="bg-white/60 w-64 border-primary/15 focus:border-primary/30" data-testid="select-agent-language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{lang.label}</span>
                      <span className="text-xs text-muted-foreground">— {lang.region}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground/70 pl-6">
              {agentName} auto-detects the user's language and responds accordingly. This sets the default for new conversations.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
