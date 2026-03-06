import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAdminLogos } from "./hooks";
import { LOGO_PREVIEW } from "./styles";
import defaultLogo from "@/assets/logo.png";

interface LogoSelectorProps {
  label: string;
  value: number | null | undefined;
  onChange: (logoId: number | null) => void;
  emptyLabel?: string;
  helpText?: string;
  testId?: string;
  fallbackUrl?: string;
}

export default function LogoSelector({
  label,
  value,
  onChange,
  emptyLabel = "No Logo",
  helpText = "Select from Logo Portfolio",
  testId = "select-logo",
  fallbackUrl,
}: LogoSelectorProps) {
  const { data: logos } = useAdminLogos();

  const resolvedUrl = (() => {
    if (value) {
      const logo = logos?.find(l => l.id === value);
      if (logo) return logo.url;
    }
    return fallbackUrl || defaultLogo;
  })();

  return (
    <div className="space-y-2">
      <Label className="label-text text-gray-700">{label}</Label>
      <div className="flex items-center gap-4">
        <div className={LOGO_PREVIEW}>
          <img src={resolvedUrl} alt={label} className="w-full h-full object-contain" />
        </div>
        <div className="flex-1 space-y-1 max-w-sm">
          <Select
            value={value ? String(value) : "none"}
            onValueChange={(v) => onChange(v === "none" ? null : Number(v))}
          >
            <SelectTrigger data-testid={testId}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{emptyLabel}</SelectItem>
              {logos?.map(logo => (
                <SelectItem key={logo.id} value={String(logo.id)}>
                  {logo.name}{logo.isDefault ? " (Default)" : ""}
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
