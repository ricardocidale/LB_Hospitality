import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAdminLogos } from "./hooks";
import { LOGO_PREVIEW } from "./styles";
import defaultLogo from "@/assets/logo.png";

interface LogoSelectorProps {
  label: string;
  value: number | null | undefined;
  onChange: (logoId: number | null) => void;
  showNone?: boolean;
  useDefaultFallback?: boolean;
  emptyLabel?: string;
  helpText?: string;
  testId?: string;
  fallbackUrl?: string;
}

export default function LogoSelector({
  label,
  value,
  onChange,
  showNone = true,
  useDefaultFallback = false,
  emptyLabel = "No Logo",
  helpText = "Select from Logo Portfolio",
  testId = "select-logo",
  fallbackUrl,
}: LogoSelectorProps) {
  const { data: logos } = useAdminLogos();

  const defaultLogoEntry = logos?.find(l => l.isDefault);
  const effectiveValue = useDefaultFallback && value == null ? defaultLogoEntry?.id ?? null : value;

  const resolvedUrl = (() => {
    if (effectiveValue) {
      const logo = logos?.find(l => l.id === effectiveValue);
      if (logo) return logo.url;
    }
    return fallbackUrl || defaultLogo;
  })();

  const selectValue = effectiveValue ? String(effectiveValue) : (showNone ? "none" : "");

  return (
    <div className="space-y-2">
      <Label className="label-text text-gray-700">{label}</Label>
      <div className="flex items-center gap-4">
        <div className={LOGO_PREVIEW}>
          <img src={resolvedUrl} alt={label} className="w-full h-full object-contain" />
        </div>
        <div className="flex-1 space-y-1 max-w-sm">
          <Select
            value={selectValue}
            onValueChange={(v) => onChange(v === "none" ? null : Number(v))}
          >
            <SelectTrigger data-testid={testId}><SelectValue /></SelectTrigger>
            <SelectContent>
              {showNone && <SelectItem value="none">{emptyLabel}</SelectItem>}
              {logos?.map(logo => (
                <SelectItem key={logo.id} value={String(logo.id)}>
                  <span className="flex items-center gap-2">
                    <img src={logo.url} alt="" className="w-5 h-5 rounded object-contain shrink-0" onError={(e) => { (e.target as HTMLImageElement).src = defaultLogo; }} />
                    {logo.name}{logo.isDefault ? " (Default)" : ""}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{helpText}</p>
        </div>
      </div>
    </div>
  );
}
