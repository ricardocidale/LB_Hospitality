import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Check } from "@/components/icons/themed-icons";
import { IconMessageSquare, IconGlobe, IconSave, IconRefreshCw, IconAlertCircle, IconFileText, IconType, IconSparkles, IconCopy } from "@/components/icons";

import { useAgentConfig, useSaveAgentPrompt } from "@/features/ai-agent/hooks/use-convai-api";

const DYNAMIC_VARS = [
  { name: "{{user_name}}", description: "Full name of the logged-in user" },
  { name: "{{user_role}}", description: "User's role (admin, user, investor…)" },
  { name: "{{current_page}}", description: "Current page path the user is on" },
];

const DEFAULT_PROMPT_TEMPLATE = `You are a knowledgeable AI assistant for a hospitality investment portal. You help users understand the platform's methodology, hospitality concepts, and how to navigate the application.

You are speaking with {{user_name}}, who has the role of {{user_role}}. They are currently on the {{current_page}} page.

Your capabilities:
- Explain hospitality financial concepts (ADR, RevPAR, NOI, IRR, cap rates, DSCR, USALI waterfall)
- Describe the platform's methodology, business rules, and verification system
- Guide users to the right pages and features
- Help users understand how to use the portal's tools and reports

Guidelines:
- Be concise and professional. Use hospitality industry terminology appropriately.
- You do NOT have access to live financial data or property metrics. Refer users to the Dashboard or Rebecca for specific portfolio numbers.
- If a user asks to navigate somewhere, guide them to the correct page.
- Keep responses focused — users are busy professionals reviewing investments.`;

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
  companyName: string;
}

export function PromptEditor({ agentName, companyName }: PromptEditorProps) {
  const { data: agentConfig, isLoading, error, refetch } = useAgentConfig();
  const savePromptMutation = useSaveAgentPrompt();

  const [promptDraft, setPromptDraft] = useState<string | null>(null);
  const [firstMessageDraft, setFirstMessageDraft] = useState<string | null>(null);
  const [languageDraft, setLanguageDraft] = useState<string | null>(null);
  const [isPromptDirty, setIsPromptDirty] = useState(false);
  const [copiedVar, setCopiedVar] = useState<string | null>(null);

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

  const handleCopyVar = (varName: string) => {
    navigator.clipboard.writeText(varName);
    setCopiedVar(varName);
    setTimeout(() => setCopiedVar(null), 1500);
  };

  const handleLoadTemplate = () => {
    setPromptDraft(DEFAULT_PROMPT_TEMPLATE);
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
      <Card className="bg-card border border-border/80 shadow-sm">
        <CardContent className="py-16 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-muted mb-4">
            <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">Fetching agent configuration from ElevenLabs...</p>
          <p className="text-xs text-muted-foreground/60 mt-1">This may take a moment on first load</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-card border border-border/80 shadow-sm">
        <CardContent className="py-10">
          <div className="flex items-start gap-4 p-5 bg-gradient-to-br from-amber-50 to-orange-50/50 rounded-xl border border-amber-200/60">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <IconAlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-900">Agent configuration unavailable</p>
              <p className="text-xs text-amber-700/80 mt-1 leading-relaxed">{(error as Error).message}</p>
              <Button variant="ghost" size="sm" className="mt-3 gap-1.5 text-amber-700 hover:text-amber-900 hover:bg-amber-100/50 -ml-2" onClick={() => refetch()}>
                <IconRefreshCw className="w-3.5 h-3.5" /> Retry connection
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const promptCharCount = currentPrompt.length;
  const promptWordCount = currentPrompt.trim() ? currentPrompt.trim().split(/\s+/).length : 0;
  const promptIsEmpty = !currentPrompt.trim();

  return (
    <div className="space-y-6">
      <Card className="bg-card border border-border/80 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <IconFileText className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold text-foreground">System Prompt</CardTitle>
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
              {!currentPrompt && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleLoadTemplate}
                  className="gap-1.5 border-border text-muted-foreground hover:bg-muted"
                >
                  <IconSparkles className="w-3.5 h-3.5" />
                  Load template
                </Button>
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
                  <IconSave className="w-3.5 h-3.5" />
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
              placeholder={`You are ${agentName}, an AI assistant for ${companyName}. You help investors understand hotel business simulations...`}
              className="bg-card min-h-[340px] font-mono text-[13px] leading-relaxed resize-y border-border focus:border-border transition-colors"
              data-testid="textarea-system-prompt"
            />
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-4 text-xs text-muted-foreground/70">
                <span className="flex items-center gap-1">
                  <IconType className="w-3 h-3" />
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

          <div className="p-3 bg-muted/50 rounded-xl border border-border/60 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Available dynamic variables — click to copy</p>
            <div className="flex flex-wrap gap-2">
              {DYNAMIC_VARS.map((v) => (
                <Button
                  key={v.name}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyVar(v.name)}
                  title={v.description}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 h-auto rounded-lg bg-card text-xs font-mono text-muted-foreground hover:bg-muted"
                >
                  {copiedVar === v.name ? <Check className="w-3 h-3 text-green-500" /> : <IconCopy className="w-3 h-3 opacity-50" />}
                  {v.name}
                </Button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground/50">These are populated at runtime with the user's real data. Paste them into the prompt above.</p>
          </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border border-border/80 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/15 to-blue-500/5 flex items-center justify-center">
              <IconMessageSquare className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">First Message</CardTitle>
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
              placeholder={`Hello! I'm ${agentName}, your assistant for ${companyName}...`}
              className="bg-card border-border focus:border-border transition-colors"
              data-testid="input-first-message"
            />
          </div>

          <Separator className="bg-primary/8" />

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <IconGlobe className="w-4 h-4 text-muted-foreground/60" />
              <Label className="label-text font-medium text-xs uppercase tracking-wider text-muted-foreground/70">Default Language</Label>
            </div>
            <Select value={currentLanguage} onValueChange={handleLanguageChange}>
              <SelectTrigger className="bg-card w-64 border-border focus:border-border" data-testid="select-agent-language">
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
