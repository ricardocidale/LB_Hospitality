import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useDesignThemes, useUpdateTheme } from "@/features/design-themes/useDesignThemes";
import type { IconSetType } from "@/features/design-themes/types";
import {
  Star as LucideStar, Bell as LucideBell, Search as LucideSearch,
  Check as LucideCheck, AlertTriangle as LucideAlert, Home as LucideHome,
  Settings as LucideSettings, Users as LucideUsers, Mail as LucideMail,
  Heart as LucideHeart, Calendar as LucideCalendar, Map as LucideMap,
  Camera as LucideCamera, Download as LucideDownload, Upload as LucideUpload,
  Shield as LucideShield, Zap as LucideZap, Eye as LucideEye,
} from "lucide-react";
import {
  Star as PhStar, Bell as PhBell, MagnifyingGlass as PhSearch,
  Check as PhCheck, Warning as PhAlert, House as PhHome,
  Gear as PhSettings, Users as PhUsers, Envelope as PhMail,
  Heart as PhHeart, Calendar as PhCalendar, MapPin as PhMap,
  Camera as PhCamera, DownloadSimple as PhDownload, UploadSimple as PhUpload,
  Shield as PhShield, Lightning as PhZap, Eye as PhEye,
} from "@phosphor-icons/react";
import { IconLayers } from "@/components/icons";

const LUCIDE_ICONS = [
  LucideStar, LucideBell, LucideSearch, LucideCheck, LucideAlert,
  LucideHome, LucideSettings, LucideUsers, LucideMail, LucideHeart,
  LucideCalendar, LucideMap, LucideCamera, LucideDownload, LucideUpload,
  LucideShield, LucideZap, LucideEye,
];

const PHOSPHOR_ICONS = [
  PhStar, PhBell, PhSearch, PhCheck, PhAlert,
  PhHome, PhSettings, PhUsers, PhMail, PhHeart,
  PhCalendar, PhMap, PhCamera, PhDownload, PhUpload,
  PhShield, PhZap, PhEye,
];

export default function IconSetsTab() {
  const { data: designThemes } = useDesignThemes();
  const updateThemeMutation = useUpdateTheme();

  const activeTheme = designThemes?.find(t => t.isDefault);
  const activeIconSet: IconSetType = activeTheme?.iconSet ?? "lucide";

  function handleIconSetChange(value: string) {
    if (!activeTheme) return;
    updateThemeMutation.mutate({
      id: activeTheme.id,
      data: { iconSet: value },
    });
  }

  return (
    <RadioGroup
      value={activeIconSet}
      onValueChange={handleIconSetChange}
      className="grid grid-cols-1 md:grid-cols-3 gap-4"
      data-testid="icon-sets-radio-group"
    >
      <Card className={`relative cursor-pointer transition-all ${activeIconSet === "lucide" ? "border-primary ring-2 ring-primary/20" : "border-border"}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <RadioGroupItem value="lucide" id="icon-set-lucide" data-testid="radio-icon-set-lucide" />
            <div>
              <Label htmlFor="icon-set-lucide" className="cursor-pointer">
                <CardTitle className="text-base">Lucide</CardTitle>
              </Label>
              <CardDescription className="text-xs mt-0.5">Clean, consistent stroke icons</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 gap-3" data-testid="icon-grid-lucide">
            {LUCIDE_ICONS.map((Icon, i) => (
              <div key={i} className="flex items-center justify-center p-2 rounded-lg bg-muted/50 border border-border/40">
                <Icon className="w-5 h-5 text-foreground" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className={`relative cursor-pointer transition-all ${activeIconSet === "phosphor" ? "border-primary ring-2 ring-primary/20" : "border-border"}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <RadioGroupItem value="phosphor" id="icon-set-phosphor" data-testid="radio-icon-set-phosphor" />
            <div>
              <Label htmlFor="icon-set-phosphor" className="cursor-pointer">
                <CardTitle className="text-base">Phosphor</CardTitle>
              </Label>
              <CardDescription className="text-xs mt-0.5">Flexible, expressive icon family</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 gap-3" data-testid="icon-grid-phosphor">
            {PHOSPHOR_ICONS.map((Icon, i) => (
              <div key={i} className="flex items-center justify-center p-2 rounded-lg bg-muted/50 border border-border/40">
                <Icon className="w-5 h-5 text-foreground" size={20} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="relative border-border opacity-60">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <RadioGroupItem value="coming-soon" id="icon-set-future" disabled data-testid="radio-icon-set-future" />
            <div>
              <Label htmlFor="icon-set-future" className="cursor-default">
                <CardTitle className="text-base text-muted-foreground">Coming Soon</CardTitle>
              </Label>
              <CardDescription className="text-xs mt-0.5">Tabler, Vecteezy, and more</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 gap-3" data-testid="icon-grid-future">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="flex items-center justify-center p-2 rounded-lg bg-muted/30 border border-dashed border-border/30">
                <IconLayers className="w-5 h-5 text-muted-foreground/30" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </RadioGroup>
  );
}
