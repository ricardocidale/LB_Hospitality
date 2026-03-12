import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  FileSignature,
  Send,
  Eye,
  CheckCircle2,
  Clock,
  Mail,
  Download,
  Loader2,
  ChevronRight,
  FileText,
  AlertCircle,
} from "lucide-react";

interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface DocuSignEnvelope {
  id: number;
  propertyId: number;
  envelopeId: string | null;
  templateType: string;
  recipientName: string;
  recipientEmail: string;
  status: string;
  statusHistory: Array<{ status: string; timestamp: string }>;
  signedDocumentPath: string | null;
  sentAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

function SigningStatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; icon: any; label: string }> = {
    created: { color: "bg-gray-100 text-gray-700 border-gray-200", icon: Clock, label: "Created" },
    sent: { color: "bg-blue-100 text-blue-700 border-blue-200", icon: Send, label: "Sent" },
    delivered: { color: "bg-indigo-100 text-indigo-700 border-indigo-200", icon: Mail, label: "Delivered" },
    viewed: { color: "bg-purple-100 text-purple-700 border-purple-200", icon: Eye, label: "Viewed" },
    signed: { color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: FileSignature, label: "Signed" },
    completed: { color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle2, label: "Completed" },
    declined: { color: "bg-red-100 text-red-700 border-red-200", icon: AlertCircle, label: "Declined" },
  };

  const c = config[status] || config.created;
  const Icon = c.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${c.color}`} data-testid={`badge-status-${status}`}>
      <Icon className="w-3 h-3" />
      {c.label}
    </span>
  );
}

function SigningTimeline({ history }: { history: Array<{ status: string; timestamp: string }> }) {
  if (!history || history.length === 0) return null;

  return (
    <div className="mt-2 space-y-1">
      {history.map((entry, idx) => (
        <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span className="capitalize">{entry.status}</span>
          <span>&mdash;</span>
          <span>
            {new Date(entry.timestamp).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function DocumentSigningPanel({ propertyId }: { propertyId: number }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const { data: templates = [] } = useQuery<DocumentTemplate[]>({
    queryKey: ["/api/documents/templates"],
  });

  const { data: envelopes = [] } = useQuery<DocuSignEnvelope[]>({
    queryKey: [`/api/documents/envelopes/${propertyId}`],
  });

  const previewMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/documents/templates/preview", {
        templateId: selectedTemplate,
        propertyId,
        recipientName: recipientName || "Recipient",
      });
      return res.json();
    },
    onSuccess: (data) => {
      setPreviewHtml(data.html);
      setShowPreview(true);
    },
    onError: (error) => {
      toast({ title: "Preview failed", description: error.message, variant: "destructive" });
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/documents/send", {
        templateId: selectedTemplate,
        propertyId,
        recipientName,
        recipientEmail,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Document sent", description: `Sent to ${recipientEmail} for signature.` });
      queryClient.invalidateQueries({ queryKey: [`/api/documents/envelopes/${propertyId}`] });
      setSelectedTemplate(null);
      setRecipientName("");
      setRecipientEmail("");
      setPreviewHtml(null);
      setShowPreview(false);
    },
    onError: (error) => {
      toast({ title: "Send failed", description: error.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileSignature className="w-5 h-5" />
            Document Signing
          </CardTitle>
          <CardDescription>
            Generate and send pre-filled documents (LOI, Investment Memo, Management Agreement) for e-signature via DocuSign.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedTemplate ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <button
                  key={template.id}
                  className="text-left p-4 rounded-lg border hover:border-primary/50 hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedTemplate(template.id)}
                  data-testid={`button-template-${template.id}`}
                >
                  <div className="flex items-start justify-between">
                    <FileText className="w-5 h-5 text-primary mt-0.5" />
                    <Badge variant="outline" className="text-[10px]">
                      {template.category}
                    </Badge>
                  </div>
                  <h3 className="font-medium mt-2">{template.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                  <div className="flex items-center gap-1 text-xs text-primary mt-2">
                    Select <ChevronRight className="w-3 h-3" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">
                  {templates.find((t) => t.id === selectedTemplate)?.name}
                </h3>
                <Button variant="ghost" size="sm" onClick={() => { setSelectedTemplate(null); setShowPreview(false); setPreviewHtml(null); }}>
                  Back to templates
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="recipientName">Recipient Name</Label>
                  <Input
                    id="recipientName"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="John Doe"
                    data-testid="input-recipient-name"
                  />
                </div>
                <div>
                  <Label htmlFor="recipientEmail">Recipient Email</Label>
                  <Input
                    id="recipientEmail"
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="john@example.com"
                    data-testid="input-recipient-email"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => previewMutation.mutate()}
                  disabled={previewMutation.isPending}
                  data-testid="button-preview-document"
                >
                  {previewMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Eye className="w-4 h-4 mr-2" />
                  )}
                  Preview
                </Button>
                <Button
                  onClick={() => sendMutation.mutate()}
                  disabled={sendMutation.isPending || !recipientName || !recipientEmail}
                  data-testid="button-send-signature"
                >
                  {sendMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Send for Signature
                </Button>
              </div>

              {showPreview && previewHtml && (
                <div className="mt-4 border rounded-lg overflow-hidden">
                  <div className="bg-muted px-3 py-2 text-sm font-medium border-b flex items-center justify-between">
                    <span>Document Preview</span>
                    <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>
                      Close
                    </Button>
                  </div>
                  <div className="bg-white p-4 max-h-[600px] overflow-y-auto">
                    <iframe
                      srcDoc={previewHtml}
                      className="w-full min-h-[500px] border-0"
                      title="Document Preview"
                      sandbox="allow-same-origin"
                      data-testid="iframe-document-preview"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {envelopes.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Signing Status ({envelopes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {envelopes.map((envelope) => (
                <div key={envelope.id} className="p-3 rounded-lg border" data-testid={`card-envelope-${envelope.id}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm capitalize">
                        {envelope.templateType.replace(/-/g, " ")}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        To: {envelope.recipientName} ({envelope.recipientEmail})
                      </p>
                    </div>
                    <SigningStatusBadge status={envelope.status} />
                  </div>

                  <SigningTimeline history={envelope.statusHistory} />

                  {envelope.signedDocumentPath && (
                    <div className="mt-2">
                      <a
                        href={envelope.signedDocumentPath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        data-testid={`link-download-${envelope.id}`}
                      >
                        <Download className="w-3 h-3" />
                        Download signed document
                      </a>
                    </div>
                  )}

                  <p className="text-[10px] text-muted-foreground mt-2">
                    {envelope.sentAt
                      ? `Sent ${new Date(envelope.sentAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                      : `Created ${new Date(envelope.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
