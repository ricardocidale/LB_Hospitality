import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, X } from "lucide-react";
import {
  IconPlus,
  IconTrash,
  IconLink,
  IconExternalLink,
  IconUpload,
  IconFile,
  IconFileText,
  IconGlobe,
} from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import { useGlobalAssumptions, useUpdateGlobalAssumptions } from "@/lib/api";

interface UrlSource {
  id: string;
  url: string;
  label: string;
  addedAt: string;
}

interface FileSource {
  id: string;
  name: string;
  size: number;
  type: string;
  origin: "local" | "google-drive";
  objectPath?: string;
  driveUrl?: string;
  addedAt: string;
}

interface IcpSources {
  urls: UrlSource[];
  files: FileSource[];
}

const DEFAULT_URL_SEEDS: UrlSource[] = [
  { id: "default-str", url: "https://str.com", label: "STR", addedAt: new Date().toISOString() },
  { id: "default-cbre", url: "https://www.cbre.com/industries/hotels", label: "CBRE Hotels", addedAt: new Date().toISOString() },
  { id: "default-hvs", url: "https://hvs.com", label: "HVS", addedAt: new Date().toISOString() },
  { id: "default-jll", url: "https://www.jll.com/en/industries/hotels-and-hospitality", label: "JLL Hotels", addedAt: new Date().toISOString() },
  { id: "default-hnn", url: "https://hotelnewsnow.com", label: "Hotel News Now", addedAt: new Date().toISOString() },
  { id: "default-hnet", url: "https://www.hospitalitynet.org", label: "Hospitality Net", addedAt: new Date().toISOString() },
  { id: "default-pkf", url: "https://www.pkfhotels.com", label: "PKF", addedAt: new Date().toISOString() },
  { id: "default-fred", url: "https://fred.stlouisfed.org", label: "FRED", addedAt: new Date().toISOString() },
  { id: "default-ahla", url: "https://www.ahla.com", label: "AHLA", addedAt: new Date().toISOString() },
  { id: "default-lodging", url: "https://lodgingmagazine.com", label: "Lodging Magazine", addedAt: new Date().toISOString() },
];

const DEFAULT_SOURCES: IcpSources = { urls: [], files: [] };

function isValidUrl(str: string): boolean {
  try {
    const u = new URL(str);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function IcpSourcesTab() {
  const { data: ga } = useGlobalAssumptions();
  const updateMutation = useUpdateGlobalAssumptions();
  const { toast } = useToast();

  const [sources, setSources] = useState<IcpSources>(DEFAULT_SOURCES);

  const [newUrl, setNewUrl] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [urlSearch, setUrlSearch] = useState("");

  const [driveUrl, setDriveUrl] = useState("");
  const [driveName, setDriveName] = useState("");

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const seededRef = useRef(false);

  useEffect(() => {
    if (!ga) return;
    const cfg = (ga.icpConfig as Record<string, any>) || {};
    if (cfg._sources) {
      setSources(cfg._sources as IcpSources);
    } else if (!seededRef.current) {
      seededRef.current = true;
      const seeded: IcpSources = { urls: [...DEFAULT_URL_SEEDS], files: [] };
      setSources(seeded);
      const existing = (ga.icpConfig as Record<string, any>) || {};
      updateMutation.mutate(
        { icpConfig: { ...existing, _sources: seeded } },
        {
          onSuccess: () => {
            toast({ title: "Sources Loaded", description: "10 default research sources have been added." });
          },
        }
      );
    }
  }, [ga]);

  const save = (updated: IcpSources) => {
    const existing = (ga?.icpConfig as Record<string, any>) || {};
    updateMutation.mutate(
      { icpConfig: { ...existing, _sources: updated } },
      {
        onSuccess: () => {
          toast({ title: "Saved", description: "Research sources updated." });
        },
      }
    );
  };

  const handleAddUrl = () => {
    const trimmedUrl = newUrl.trim();
    if (!trimmedUrl) return;
    if (!isValidUrl(trimmedUrl)) {
      toast({ title: "Invalid URL", description: "Please enter a valid URL starting with http:// or https://", variant: "destructive" });
      return;
    }
    if (sources.urls.some((s) => s.url === trimmedUrl)) {
      toast({ title: "Duplicate", description: "This URL is already in your sources.", variant: "destructive" });
      return;
    }
    const updated: IcpSources = {
      ...sources,
      urls: [
        ...sources.urls,
        {
          id: `url-${Date.now()}`,
          url: trimmedUrl,
          label: newLabel.trim() || new URL(trimmedUrl).hostname,
          addedAt: new Date().toISOString(),
        },
      ],
    };
    setSources(updated);
    save(updated);
    setNewUrl("");
    setNewLabel("");
  };

  const handleRemoveUrl = (id: string) => {
    const updated: IcpSources = {
      ...sources,
      urls: sources.urls.filter((u) => u.id !== id),
    };
    setSources(updated);
    save(updated);
  };

  const handleLocalFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);

    try {
      const newFiles: FileSource[] = [];
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/uploads/direct", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: await file.arrayBuffer().then((b) => new Uint8Array(b)),
        });

        let objectPath = "";
        if (res.ok) {
          const data = await res.json();
          objectPath = data.url || data.objectPath || "";
        }

        newFiles.push({
          id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: file.name,
          size: file.size,
          type: file.type || "application/octet-stream",
          origin: "local",
          objectPath,
          addedAt: new Date().toISOString(),
        });
      }

      const updated: IcpSources = {
        ...sources,
        files: [...sources.files, ...newFiles],
      };
      setSources(updated);
      save(updated);
      toast({ title: "Files Added", description: `${newFiles.length} file(s) added to research sources.` });
    } catch (err: any) {
      toast({ title: "Upload Error", description: err.message || "Failed to upload files", variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddGoogleDrive = () => {
    const trimmedUrl = driveUrl.trim();
    if (!trimmedUrl) return;
    if (!isValidUrl(trimmedUrl)) {
      toast({ title: "Invalid URL", description: "Please enter a valid Google Drive link.", variant: "destructive" });
      return;
    }
    if (sources.files.some((f) => f.driveUrl === trimmedUrl)) {
      toast({ title: "Duplicate", description: "This Google Drive file is already in your sources.", variant: "destructive" });
      return;
    }
    const name = driveName.trim() || trimmedUrl.split("/").pop() || "Google Drive File";
    const updated: IcpSources = {
      ...sources,
      files: [
        ...sources.files,
        {
          id: `gdrive-${Date.now()}`,
          name,
          size: 0,
          type: "application/google-drive",
          origin: "google-drive",
          driveUrl: trimmedUrl,
          addedAt: new Date().toISOString(),
        },
      ],
    };
    setSources(updated);
    save(updated);
    setDriveUrl("");
    setDriveName("");
  };

  const handleRemoveFile = (id: string) => {
    const updated: IcpSources = {
      ...sources,
      files: sources.files.filter((f) => f.id !== id),
    };
    setSources(updated);
    save(updated);
  };

  const filteredUrls = urlSearch.trim()
    ? sources.urls.filter(
        (u) =>
          u.url.toLowerCase().includes(urlSearch.toLowerCase()) ||
          u.label.toLowerCase().includes(urlSearch.toLowerCase())
      )
    : sources.urls;

  return (
    <div className="space-y-5">
      <Card className="bg-card border border-border/80 shadow-sm">
        <CardContent className="pt-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <IconLink className="w-4 h-4 text-muted-foreground" />
              URL Sources
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Add links to market reports, articles, competitor websites, or any online resources relevant to the research.
            </p>
          </div>

          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1">
              <Label className="text-xs">URL</Label>
              <Input
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://example.com/market-report"
                className="h-9 text-xs bg-card"
                onKeyDown={(e) => e.key === "Enter" && handleAddUrl()}
                data-testid="input-new-url"
              />
            </div>
            <div className="w-48 space-y-1">
              <Label className="text-xs">Label (optional)</Label>
              <Input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Market Report 2025"
                className="h-9 text-xs bg-card"
                onKeyDown={(e) => e.key === "Enter" && handleAddUrl()}
                data-testid="input-url-label"
              />
            </div>
            <Button
              size="sm"
              variant="default"
              onClick={handleAddUrl}
              disabled={!newUrl.trim() || updateMutation.isPending}
              className="h-9 text-xs gap-1.5"
              data-testid="button-add-url"
            >
              <IconPlus className="w-3.5 h-3.5" />
              Add
            </Button>
          </div>

          {sources.urls.length > 3 && (
            <Input
              value={urlSearch}
              onChange={(e) => setUrlSearch(e.target.value)}
              placeholder="Search sources..."
              className="h-8 text-xs bg-muted/30"
              data-testid="input-search-urls"
            />
          )}

          {filteredUrls.length > 0 ? (
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
              {filteredUrls.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-border/60 bg-muted/20 group hover:bg-muted/40 transition-colors"
                  data-testid={`url-source-${source.id}`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <IconGlobe className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground truncate">{source.label}</p>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-primary hover:underline truncate block"
                      >
                        {source.url}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <IconExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => handleRemoveUrl(source.id)}
                      className="text-muted-foreground hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      data-testid={`remove-url-${source.id}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <IconLink className="w-6 h-6 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No URL sources added yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card border border-border/80 shadow-sm">
        <CardContent className="pt-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <IconFile className="w-4 h-4 text-muted-foreground" />
              File Sources
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Upload documents from your local drive or add links to Google Drive files for the AI to reference during research.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2 p-3 rounded-lg border border-dashed border-border/60 bg-muted/10">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <IconUpload className="w-3.5 h-3.5" />
                Local Files
              </Label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleLocalFileSelect}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.json,.pptx,.rtf"
                data-testid="input-file-upload"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full text-xs h-8 gap-1.5"
                data-testid="button-upload-local"
              >
                {isUploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <IconUpload className="w-3.5 h-3.5" />
                )}
                {isUploading ? "Uploading..." : "Choose Files"}
              </Button>
              <p className="text-[10px] text-muted-foreground">
                PDF, DOC, DOCX, XLS, XLSX, CSV, TXT, PPTX
              </p>
            </div>

            <div className="space-y-2 p-3 rounded-lg border border-dashed border-border/60 bg-muted/10">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7z" />
                  <polyline points="14,2 14,8 20,8" />
                </svg>
                Google Drive
              </Label>
              <Input
                value={driveUrl}
                onChange={(e) => setDriveUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/..."
                className="h-8 text-xs bg-card"
                data-testid="input-drive-url"
              />
              <div className="flex gap-1.5">
                <Input
                  value={driveName}
                  onChange={(e) => setDriveName(e.target.value)}
                  placeholder="File name (optional)"
                  className="h-8 text-xs bg-card flex-1"
                  data-testid="input-drive-name"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddGoogleDrive}
                  disabled={!driveUrl.trim() || updateMutation.isPending}
                  className="h-8 text-xs gap-1"
                  data-testid="button-add-drive"
                >
                  <IconPlus className="w-3 h-3" />
                  Add
                </Button>
              </div>
            </div>
          </div>

          {sources.files.length > 0 ? (
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
              {sources.files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-border/60 bg-muted/20 group hover:bg-muted/40 transition-colors"
                  data-testid={`file-source-${file.id}`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {file.origin === "google-drive" ? (
                      <svg className="w-3.5 h-3.5 text-muted-foreground shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7z" />
                        <polyline points="14,2 14,8 20,8" />
                      </svg>
                    ) : (
                      <IconFileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground truncate">{file.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {file.origin === "google-drive" ? "Google Drive" : "Local upload"}
                        {file.size > 0 && ` · ${formatFileSize(file.size)}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {file.driveUrl && (
                      <a
                        href={file.driveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        <IconExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => handleRemoveFile(file.id)}
                      className="text-muted-foreground hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      data-testid={`remove-file-${file.id}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <IconFile className="w-6 h-6 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No file sources added yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
