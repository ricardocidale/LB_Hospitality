import type { SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const defaults = (p: IconProps) => ({
  width: p.size ?? 24,
  height: p.size ?? 24,
  viewBox: "0 0 24 24",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  ...p,
  size: undefined,
});

const S = { strokeLinecap: "round" as const, strokeLinejoin: "round" as const, stroke: "currentColor", strokeWidth: 1.75 };
const F = { fill: "currentColor", opacity: 0.12 };

export function IconDashboard(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <rect x="3" y="3" width="7" height="9" rx="2" {...F} />
      <rect x="3" y="3" width="7" height="9" rx="2" {...S} fill="none" />
      <rect x="14" y="3" width="7" height="5" rx="2" {...S} fill="none" />
      <rect x="14" y="12" width="7" height="9" rx="2" {...F} />
      <rect x="14" y="12" width="7" height="9" rx="2" {...S} fill="none" />
      <rect x="3" y="16" width="7" height="5" rx="2" {...S} fill="none" />
    </svg>
  );
}

export function IconProperties(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M3 21V8l9-5 9 5v13" {...F} />
      <path d="M3 21V8l9-5 9 5v13" {...S} fill="none" />
      <rect x="8" y="13" width="3" height="4" rx="0.5" {...S} fill="none" />
      <rect x="13" y="13" width="3" height="4" rx="0.5" {...S} fill="none" />
      <path d="M9 9h6" {...S} />
      <path d="M1 21h22" {...S} />
    </svg>
  );
}

export function IconBriefcase(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <rect x="2" y="7" width="20" height="14" rx="2.5" {...F} />
      <rect x="2" y="7" width="20" height="14" rx="2.5" {...S} fill="none" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" {...S} />
      <path d="M2 13h20" {...S} />
      <circle cx="12" cy="13" r="1.5" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

export function IconPropertyFinder(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <circle cx="10.5" cy="10.5" r="6.5" {...F} />
      <circle cx="10.5" cy="10.5" r="6.5" {...S} fill="none" />
      <path d="M21 21l-4.35-4.35" {...S} />
      <path d="M8 10l2 2 3.5-4" {...S} />
    </svg>
  );
}

export function IconResearch(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M9 3h6v5l3 9H6l3-9V3z" {...F} />
      <path d="M9 3h6v5l3 9H6l3-9V3z" {...S} fill="none" />
      <path d="M9 3h6" {...S} />
      <circle cx="10" cy="13" r="0.75" fill="currentColor" opacity="0.5" />
      <circle cx="13" cy="11" r="0.75" fill="currentColor" opacity="0.5" />
      <path d="M6 17h12" {...S} />
      <path d="M7 21h10" {...S} />
    </svg>
  );
}

export function IconAnalysis(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <rect x="3" y="14" width="4" height="7" rx="1" {...F} />
      <rect x="3" y="14" width="4" height="7" rx="1" {...S} fill="none" />
      <rect x="10" y="9" width="4" height="12" rx="1" {...F} />
      <rect x="10" y="9" width="4" height="12" rx="1" {...S} fill="none" />
      <rect x="17" y="4" width="4" height="17" rx="1" {...F} />
      <rect x="17" y="4" width="4" height="17" rx="1" {...S} fill="none" />
      <path d="M3 13l4-3 5-2 5-4" {...S} />
      <path d="M15 4h4v3" {...S} />
    </svg>
  );
}

export function IconMapPin(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" {...F} />
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" {...S} fill="none" />
      <circle cx="12" cy="9" r="2.5" {...S} fill="none" />
      <circle cx="12" cy="9" r="1" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

export function IconBot(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <rect x="3" y="8" width="18" height="12" rx="3" {...F} />
      <rect x="3" y="8" width="18" height="12" rx="3" {...S} fill="none" />
      <circle cx="9" cy="14" r="1.5" fill="currentColor" opacity="0.35" />
      <circle cx="15" cy="14" r="1.5" fill="currentColor" opacity="0.35" />
      <path d="M12 2v4" {...S} />
      <circle cx="12" cy="2" r="1" fill="currentColor" opacity="0.3" />
      <path d="M9 18h6" {...S} />
      <path d="M1 13h2M21 13h2" {...S} />
    </svg>
  );
}

export function IconExecutive(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" {...F} />
      <path d="M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" {...S} fill="none" />
      <path d="M7 8h4" {...S} />
      <path d="M7 11h3" {...S} />
      <rect x="14" y="8" width="4" height="6" rx="0.5" {...S} fill="none" />
      <path d="M14 11h4" {...S} />
      <path d="M7 16h10" {...S} />
    </svg>
  );
}

export function IconSettings(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <circle cx="12" cy="12" r="3" {...F} />
      <circle cx="12" cy="12" r="3" {...S} fill="none" />
      <path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" {...S} />
    </svg>
  );
}

export function IconProfile(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <circle cx="12" cy="8" r="4" {...F} />
      <circle cx="12" cy="8" r="4" {...S} fill="none" />
      <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" {...F} />
      <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" {...S} fill="none" />
    </svg>
  );
}

export function IconScenarios(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M2 6a2 2 0 0 1 2-2h5l2 2h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6z" {...F} />
      <path d="M2 6a2 2 0 0 1 2-2h5l2 2h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6z" {...S} fill="none" />
      <path d="M10 13l2 2 4-4" {...S} />
    </svg>
  );
}

export function IconHelp(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M2 4h8l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4z" {...F} opacity="0" />
      <path d="M4 19V4h6l1 1h8a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4z" {...S} fill="none" />
      <path d="M4 19l-2 2V4a1 1 0 0 1 1-1h6l1 1h9a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H6l-2 2z" {...F} />
      <path d="M2 4a1 1 0 0 1 1-1h6l1 1h9a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H6l-4 4V4z" {...S} fill="none" />
      <path d="M10 9a2 2 0 1 1 2.8 1.8c-.5.3-.8.7-.8 1.2" {...S} />
      <circle cx="12" cy="15" r="0.5" fill="currentColor" />
    </svg>
  );
}

export function IconShield(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M12 2l8 4v5c0 5.25-3.5 8.5-8 10-4.5-1.5-8-4.75-8-10V6l8-4z" {...F} />
      <path d="M12 2l8 4v5c0 5.25-3.5 8.5-8 10-4.5-1.5-8-4.75-8-10V6l8-4z" {...S} fill="none" />
      <path d="M9 12l2 2 4-4" {...S} />
    </svg>
  );
}

export function IconIncomeStatement(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M5 3h14a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" {...F} />
      <path d="M5 3h14a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" {...S} fill="none" />
      <path d="M8 7h8M8 11h5M8 15h7" {...S} />
      <circle cx="16" cy="15" r="1" fill="currentColor" opacity="0.35" />
    </svg>
  );
}

export function IconCashFlow(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <rect x="2" y="6" width="20" height="12" rx="2" {...F} />
      <rect x="2" y="6" width="20" height="12" rx="2" {...S} fill="none" />
      <circle cx="12" cy="12" r="3" {...S} fill="none" />
      <path d="M12 10v1h1.5" {...S} />
      <path d="M6 9v6M18 9v6" {...S} />
    </svg>
  );
}

export function IconBalanceSheet(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M12 3v18" {...S} />
      <path d="M4 7h16" {...S} />
      <path d="M4 7l3 7h-2l-1 2" {...F} />
      <path d="M20 7l-3 7h2l1 2" {...F} />
      <path d="M4 7l3 7" {...S} />
      <path d="M20 7l-3 7" {...S} />
      <path d="M4 14h6M14 14h6" {...S} />
      <rect x="8" y="19" width="8" height="2" rx="1" {...F} />
      <rect x="8" y="19" width="8" height="2" rx="1" {...S} fill="none" />
    </svg>
  );
}

export function IconInvestment(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M3 20L9 14l4 4 8-11" {...S} />
      <path d="M17 7h4v4" {...S} />
      <circle cx="9" cy="14" r="2" {...F} />
      <circle cx="13" cy="18" r="1.5" {...F} />
    </svg>
  );
}

export function IconPeople(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <circle cx="9" cy="7" r="3" {...F} />
      <circle cx="9" cy="7" r="3" {...S} fill="none" />
      <path d="M3 21v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1" {...S} />
      <circle cx="17" cy="8" r="2.5" {...S} fill="none" />
      <path d="M17 13.5a4 4 0 0 1 4 4V19" {...S} />
    </svg>
  );
}

export function IconSwatchBook(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <rect x="3" y="3" width="8" height="18" rx="2" {...F} />
      <rect x="3" y="3" width="8" height="18" rx="2" {...S} fill="none" />
      <path d="M13 3h6a2 2 0 0 1 2 2v3l-8 8V5a2 2 0 0 1 2-2z" {...F} />
      <path d="M13 3h6a2 2 0 0 1 2 2v3l-8 8V5a2 2 0 0 1 2-2z" {...S} fill="none" />
      <circle cx="7" cy="17" r="1.5" fill="currentColor" opacity="0.35" />
      <path d="M13 16l3-3 3 3v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-4z" {...S} fill="none" />
    </svg>
  );
}

export function IconUserCog(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <circle cx="10" cy="7" r="4" {...F} />
      <circle cx="10" cy="7" r="4" {...S} fill="none" />
      <path d="M3 21v-1a6 6 0 0 1 6-6h2" {...S} />
      <circle cx="18" cy="18" r="2" {...S} fill="none" />
      <path d="M18 14v1.5M18 20.5V22M14.5 16l1.3.75M20.2 19.25L21.5 20M14.5 20l1.3-.75M20.2 16.75L21.5 16" {...S} />
    </svg>
  );
}

export function IconActivity(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M3 12h4l3-8 4 16 3-8h4" {...S} />
      <circle cx="12" cy="12" r="8" {...F} />
    </svg>
  );
}

export function IconImage(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <rect x="3" y="3" width="18" height="18" rx="2.5" {...F} />
      <rect x="3" y="3" width="18" height="18" rx="2.5" {...S} fill="none" />
      <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" opacity="0.35" />
      <path d="M21 15l-5-5-9 9" {...S} />
    </svg>
  );
}

export function IconUpload(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M4 14v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" {...S} />
      <path d="M12 3v12" {...S} />
      <path d="M8 7l4-4 4 4" {...S} />
      <path d="M8 7l4-4 4 4" {...F} opacity="0.15" />
    </svg>
  );
}

export function IconPanelLeft(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <rect x="3" y="3" width="18" height="18" rx="2" {...F} />
      <rect x="3" y="3" width="18" height="18" rx="2" {...S} fill="none" />
      <path d="M9 3v18" {...S} />
      <path d="M14 8h4M14 12h3M14 16h4" {...S} />
    </svg>
  );
}

export function IconPackage(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M12 2l9 4.5v11L12 22l-9-4.5v-11L12 2z" {...F} />
      <path d="M12 2l9 4.5v11L12 22l-9-4.5v-11L12 2z" {...S} fill="none" />
      <path d="M12 12l9-4.5M12 12v10M12 12L3 7.5" {...S} />
      <path d="M7.5 4.25L16.5 9" {...S} />
    </svg>
  );
}

export function IconTrending(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M2 20l5-6 4 3 5-5 5-6" {...S} />
      <path d="M17 6h4v4" {...S} />
      <path d="M2 20l5-6 4 3 5-5 5-6v12H2z" {...F} />
    </svg>
  );
}

export function IconFileCheck(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M5 3h10l4 4v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" {...F} />
      <path d="M5 3h10l4 4v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" {...S} fill="none" />
      <path d="M15 3v4h4" {...S} />
      <path d="M9 13l2 2 4-4" {...S} />
    </svg>
  );
}

export function IconDatabase(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <ellipse cx="12" cy="5" rx="8" ry="3" {...F} />
      <ellipse cx="12" cy="5" rx="8" ry="3" {...S} fill="none" />
      <path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5" {...S} />
      <path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" {...S} />
    </svg>
  );
}

export function IconSettingsGear(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M10.3 2h3.4l.5 2.3a7 7 0 0 1 1.7 1l2.2-.7 1.7 2.9-1.7 1.6a7 7 0 0 1 0 2l1.7 1.6-1.7 2.9-2.2-.7a7 7 0 0 1-1.7 1L13.7 22h-3.4l-.5-2.3a7 7 0 0 1-1.7-1l-2.2.7-1.7-2.9 1.7-1.6a7 7 0 0 1 0-2L4.2 11.3l1.7-2.9 2.2.7a7 7 0 0 1 1.7-1L10.3 2z" {...F} />
      <path d="M10.3 2h3.4l.5 2.3a7 7 0 0 1 1.7 1l2.2-.7 1.7 2.9-1.7 1.6a7 7 0 0 1 0 2l1.7 1.6-1.7 2.9-2.2-.7a7 7 0 0 1-1.7 1L13.7 22h-3.4l-.5-2.3a7 7 0 0 1-1.7-1l-2.2.7-1.7-2.9 1.7-1.6a7 7 0 0 1 0-2L4.2 11.3l1.7-2.9 2.2.7a7 7 0 0 1 1.7-1L10.3 2z" {...S} fill="none" />
      <circle cx="12" cy="12" r="3" {...S} fill="none" />
    </svg>
  );
}

export function IconCalculator(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <rect x="4" y="2" width="16" height="20" rx="2" {...F} />
      <rect x="4" y="2" width="16" height="20" rx="2" {...S} fill="none" />
      <rect x="7" y="5" width="10" height="4" rx="1" {...S} fill="none" />
      <circle cx="8.5" cy="13" r="0.75" fill="currentColor" />
      <circle cx="12" cy="13" r="0.75" fill="currentColor" />
      <circle cx="15.5" cy="13" r="0.75" fill="currentColor" />
      <circle cx="8.5" cy="16.5" r="0.75" fill="currentColor" />
      <circle cx="12" cy="16.5" r="0.75" fill="currentColor" />
      <circle cx="15.5" cy="16.5" r="0.75" fill="currentColor" />
      <circle cx="8.5" cy="19.5" r="0.75" fill="currentColor" />
      <path d="M11 19.5h5" {...S} />
    </svg>
  );
}

export function IconCompare(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M8 3v18" {...S} />
      <path d="M16 3v18" {...S} />
      <path d="M8 8l4-3 4 3" {...S} />
      <path d="M8 16l4 3 4-3" {...S} />
      <rect x="3" y="8" width="10" height="8" rx="1.5" {...F} />
      <rect x="11" y="8" width="10" height="8" rx="1.5" {...F} />
    </svg>
  );
}

export function IconTimeline(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <circle cx="5" cy="12" r="2" {...F} />
      <circle cx="5" cy="12" r="2" {...S} fill="none" />
      <circle cx="12" cy="12" r="2" {...F} />
      <circle cx="12" cy="12" r="2" {...S} fill="none" />
      <circle cx="19" cy="12" r="2" {...F} />
      <circle cx="19" cy="12" r="2" {...S} fill="none" />
      <path d="M7 12h3M14 12h3" {...S} />
      <path d="M5 8V6M12 8V5M19 8V6" {...S} />
    </svg>
  );
}

export function IconExport(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7l-6-4z" {...F} />
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7l-6-4z" {...S} fill="none" />
      <path d="M14 3v4h4" {...S} />
      <path d="M12 12v5" {...S} />
      <path d="M9 15l3 3 3-3" {...S} />
    </svg>
  );
}

export function IconVerify(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <circle cx="12" cy="12" r="9" {...F} />
      <circle cx="12" cy="12" r="9" {...S} fill="none" />
      <path d="M9 12l2 2 4-4" {...S} />
    </svg>
  );
}

export function IconRefresh(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" {...S} />
      <path d="M21 3v5h-5" {...S} />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" {...S} />
      <path d="M3 21v-5h5" {...S} />
    </svg>
  );
}

export function IconUserPlus(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <circle cx="10" cy="8" r="4" {...F} />
      <circle cx="10" cy="8" r="4" {...S} fill="none" />
      <path d="M10 14c-4.42 0-8 1.79-8 4v2h16v-2c0-.73-.4-1.42-1.1-2" {...S} />
      <path d="M19 8v6" {...S} />
      <path d="M16 11h6" {...S} />
    </svg>
  );
}

export function IconKey(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <circle cx="8" cy="15" r="5" {...F} />
      <circle cx="8" cy="15" r="5" {...S} fill="none" />
      <path d="M11.5 11.5L21 2" {...S} />
      <path d="M18 5l3 3" {...S} />
      <path d="M15 8l3 3" {...S} />
      <circle cx="8" cy="15" r="1.5" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

export function IconTrash(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M4 7h16l-1.5 13a2 2 0 0 1-2 1.5H7.5a2 2 0 0 1-2-1.5L4 7z" {...F} />
      <path d="M4 7h16l-1.5 13a2 2 0 0 1-2 1.5H7.5a2 2 0 0 1-2-1.5L4 7z" {...S} fill="none" />
      <path d="M2 7h20" {...S} />
      <path d="M9 3h6a1 1 0 0 1 1 1v3H8V4a1 1 0 0 1 1-1z" {...S} fill="none" />
      <path d="M10 11v6" {...S} />
      <path d="M14 11v6" {...S} />
    </svg>
  );
}

export function IconPencil(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M16.5 3.5l4 4L7 21H3v-4L16.5 3.5z" {...F} />
      <path d="M16.5 3.5l4 4L7 21H3v-4L16.5 3.5z" {...S} fill="none" />
      <path d="M13 7l4 4" {...S} />
    </svg>
  );
}

export function IconMail(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <rect x="2" y="4" width="20" height="16" rx="2.5" {...F} />
      <rect x="2" y="4" width="20" height="16" rx="2.5" {...S} fill="none" />
      <path d="M2 7l10 6 10-6" {...S} />
    </svg>
  );
}

export function IconGroupUsers(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <circle cx="9" cy="7" r="4" {...F} />
      <circle cx="9" cy="7" r="4" {...S} fill="none" />
      <path d="M1 21v-2c0-2.21 3.58-4 8-4s8 1.79 8 4v2" {...S} />
      <circle cx="17" cy="7" r="3" {...S} fill="none" />
      <path d="M21 21v-2c0-1.16-1.46-2.16-3.5-2.7" {...S} />
    </svg>
  );
}

export function IconSave(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M5 3h11l5 5v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" {...F} />
      <path d="M5 3h11l5 5v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" {...S} fill="none" />
      <path d="M7 3v5h8V3" {...S} />
      <rect x="7" y="14" width="10" height="7" rx="1" {...S} fill="none" />
    </svg>
  );
}

export function IconPalette(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M12 2a10 10 0 0 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.4c3 0 5.6-2.5 5.6-5.5C23 5.4 18 2 12 2z" {...F} />
      <path d="M12 2a10 10 0 0 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.4c3 0 5.6-2.5 5.6-5.5C23 5.4 18 2 12 2z" {...S} fill="none" />
      <circle cx="7.5" cy="11.5" r="1.5" fill="currentColor" opacity="0.35" />
      <circle cx="10" cy="7.5" r="1.5" fill="currentColor" opacity="0.35" />
      <circle cx="14.5" cy="7.5" r="1.5" fill="currentColor" opacity="0.35" />
      <circle cx="17" cy="11.5" r="1.5" fill="currentColor" opacity="0.35" />
    </svg>
  );
}

export function IconEye(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" {...F} />
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" {...S} fill="none" />
      <circle cx="12" cy="12" r="3" {...S} fill="none" />
      <circle cx="12" cy="12" r="1" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

export function IconBuilding(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <rect x="4" y="2" width="16" height="20" rx="2" {...F} />
      <rect x="4" y="2" width="16" height="20" rx="2" {...S} fill="none" />
      <path d="M9 22V12h6v10" {...S} />
      <rect x="8" y="6" width="3" height="2.5" rx="0.5" {...S} fill="none" />
      <rect x="13" y="6" width="3" height="2.5" rx="0.5" {...S} fill="none" />
    </svg>
  );
}

export function IconTag(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M12.6 2.4l9 9a2 2 0 0 1 0 2.8l-6.4 6.4a2 2 0 0 1-2.8 0l-9-9A2 2 0 0 1 2.8 10l.6-5.6A2 2 0 0 1 5.2 2.6L10.8 2a2 2 0 0 1 1.8.4z" {...F} />
      <path d="M12.6 2.4l9 9a2 2 0 0 1 0 2.8l-6.4 6.4a2 2 0 0 1-2.8 0l-9-9A2 2 0 0 1 2.8 10l.6-5.6A2 2 0 0 1 5.2 2.6L10.8 2a2 2 0 0 1 1.8.4z" {...S} fill="none" />
      <circle cx="7.5" cy="7.5" r="1.5" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

export function IconPlus(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <circle cx="12" cy="12" r="9" {...F} />
      <circle cx="12" cy="12" r="9" {...S} fill="none" />
      <path d="M12 8v8" {...S} />
      <path d="M8 12h8" {...S} />
    </svg>
  );
}

export function IconStar(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z" {...F} />
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z" {...S} fill="none" />
    </svg>
  );
}

export function IconGlobe(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <circle cx="12" cy="12" r="10" {...F} />
      <circle cx="12" cy="12" r="10" {...S} fill="none" />
      <path d="M2 12h20" {...S} />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" {...S} fill="none" />
    </svg>
  );
}

export function IconPhone(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.81.36 1.6.68 2.34a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.74.32 1.53.55 2.34.68A2 2 0 0 1 22 16.92z" {...F} />
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.81.36 1.6.68 2.34a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.74.32 1.53.55 2.34.68A2 2 0 0 1 22 16.92z" {...S} fill="none" />
    </svg>
  );
}

export function IconBookOpen(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" {...F} />
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" {...S} fill="none" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" {...S} fill="none" />
    </svg>
  );
}

export function IconPPE(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <rect x="2" y="10" width="20" height="11" rx="1.5" {...F} />
      <rect x="2" y="10" width="20" height="11" rx="1.5" {...S} fill="none" />
      <path d="M6 10V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5" {...S} />
      <path d="M12 10v4" {...S} />
      <path d="M8 15h8" {...S} />
    </svg>
  );
}

export function IconAlertCircle(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <circle cx="12" cy="12" r="10" {...F} />
      <circle cx="12" cy="12" r="10" {...S} fill="none" />
      <path d="M12 8v4" {...S} />
      <circle cx="12" cy="16" r="0.5" fill="currentColor" />
    </svg>
  );
}

export function IconAlertTriangle(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" {...F} />
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" {...S} fill="none" />
      <path d="M12 9v4" {...S} />
      <circle cx="12" cy="17" r="0.5" fill="currentColor" />
    </svg>
  );
}

export function IconCheckCircle(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <circle cx="12" cy="12" r="10" {...F} />
      <circle cx="12" cy="12" r="10" {...S} fill="none" />
      <path d="M9 12l2 2 4-4" {...S} />
    </svg>
  );
}

export function IconCheckCircle2(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <circle cx="12" cy="12" r="10" {...F} />
      <circle cx="12" cy="12" r="10" {...S} fill="none" />
      <path d="M9 12l2 2 4-4" {...S} />
    </svg>
  );
}

export function IconInfo(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <circle cx="12" cy="12" r="10" {...F} />
      <circle cx="12" cy="12" r="10" {...S} fill="none" />
      <path d="M12 16v-4" {...S} />
      <circle cx="12" cy="8" r="0.5" fill="currentColor" />
    </svg>
  );
}

export function IconHelpCircle(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <circle cx="12" cy="12" r="10" {...F} />
      <circle cx="12" cy="12" r="10" {...S} fill="none" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" {...S} />
      <circle cx="12" cy="17" r="0.5" fill="currentColor" />
    </svg>
  );
}

export function IconXCircle(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <circle cx="12" cy="12" r="10" {...F} />
      <circle cx="12" cy="12" r="10" {...S} fill="none" />
      <path d="M15 9l-6 6" {...S} />
      <path d="M9 9l6 6" {...S} />
    </svg>
  );
}

export function IconShieldAlert(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M12 2l8 4v5c0 5.25-3.5 8.5-8 10-4.5-1.5-8-4.75-8-10V6l8-4z" {...F} />
      <path d="M12 2l8 4v5c0 5.25-3.5 8.5-8 10-4.5-1.5-8-4.75-8-10V6l8-4z" {...S} fill="none" />
      <path d="M12 8v4" {...S} />
      <circle cx="12" cy="16" r="0.5" fill="currentColor" />
    </svg>
  );
}

export function IconBell(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" {...F} />
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" {...S} fill="none" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" {...S} />
    </svg>
  );
}

export function IconClock(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <circle cx="12" cy="12" r="10" {...F} />
      <circle cx="12" cy="12" r="10" {...S} fill="none" />
      <path d="M12 6v6l4 2" {...S} />
    </svg>
  );
}

export function IconFileText(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" {...F} />
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" {...S} fill="none" />
      <path d="M14 2v6h6" {...S} />
      <path d="M16 13H8" {...S} />
      <path d="M16 17H8" {...S} />
      <path d="M10 9H8" {...S} />
    </svg>
  );
}

export function IconFileDown(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" {...F} />
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" {...S} fill="none" />
      <path d="M14 2v6h6" {...S} />
      <path d="M12 18v-6" {...S} />
      <path d="M9 15l3 3 3-3" {...S} />
    </svg>
  );
}

export function IconFileSpreadsheet(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" {...F} />
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" {...S} fill="none" />
      <path d="M14 2v6h6" {...S} />
      <path d="M8 13h2" {...S} />
      <path d="M8 17h2" {...S} />
      <path d="M14 13h2" {...S} />
      <path d="M14 17h2" {...S} />
    </svg>
  );
}

export function IconFileStack(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M16 2H8a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" {...F} />
      <path d="M16 2H8a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" {...S} fill="none" />
      <path d="M4 7v11a2 2 0 0 0 2 2h8" {...S} />
      <path d="M2 10v8a2 2 0 0 0 2 2h8" {...S} />
    </svg>
  );
}

export function IconFileBarChart(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" {...F} />
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" {...S} fill="none" />
      <path d="M14 2v6h6" {...S} />
      <path d="M8 18v-4" {...S} />
      <path d="M12 18v-6" {...S} />
      <path d="M16 18v-2" {...S} />
    </svg>
  );
}

export function IconFolderOpen(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M2 19V6a2 2 0 0 1 2-2h5l2 2h9a2 2 0 0 1 2 2v2" {...S} />
      <path d="M2 19l2.4-7.2A2 2 0 0 1 6.3 10h15.4a1 1 0 0 1 .95 1.32l-2.5 7.36A2 2 0 0 1 18.25 20H4a2 2 0 0 1-2-1z" {...F} />
      <path d="M2 19l2.4-7.2A2 2 0 0 1 6.3 10h15.4a1 1 0 0 1 .95 1.32l-2.5 7.36A2 2 0 0 1 18.25 20H4a2 2 0 0 1-2-1z" {...S} fill="none" />
    </svg>
  );
}

export function IconClipboardCheck(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <rect x="5" y="2" width="14" height="20" rx="2" {...F} />
      <rect x="5" y="2" width="14" height="20" rx="2" {...S} fill="none" />
      <path d="M9 2h6v3H9z" {...S} fill="none" />
      <path d="M9 14l2 2 4-4" {...S} />
    </svg>
  );
}

export function IconCopy(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <rect x="9" y="9" width="13" height="13" rx="2" {...F} />
      <rect x="9" y="9" width="13" height="13" rx="2" {...S} fill="none" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" {...S} />
    </svg>
  );
}

export function IconDownload(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" {...S} />
      <path d="M7 10l5 5 5-5" {...S} />
      <path d="M12 15V3" {...S} />
      <rect x="3" y="15" width="18" height="6" rx="2" {...F} />
    </svg>
  );
}

export function IconReceipt(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2-3-2z" {...F} />
      <path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2-3-2z" {...S} fill="none" />
      <path d="M8 10h8" {...S} />
      <path d="M8 14h4" {...S} />
    </svg>
  );
}

export function IconMic(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <rect x="9" y="2" width="6" height="11" rx="3" {...F} />
      <rect x="9" y="2" width="6" height="11" rx="3" {...S} fill="none" />
      <path d="M19 10v1a7 7 0 0 1-14 0v-1" {...S} />
      <path d="M12 18v4" {...S} />
      <path d="M8 22h8" {...S} />
    </svg>
  );
}

export function IconMic2(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" {...F} />
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" {...S} fill="none" />
      <path d="M19 10v1a7 7 0 0 1-14 0v-1" {...S} />
      <path d="M12 18v4" {...S} />
      <path d="M8 22h8" {...S} />
    </svg>
  );
}

export function IconMicOff(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <rect x="9" y="2" width="6" height="11" rx="3" {...F} />
      <rect x="9" y="2" width="6" height="11" rx="3" {...S} fill="none" />
      <path d="M19 10v1a7 7 0 0 1-11.46 5.38" {...S} />
      <path d="M5 10v1a7 7 0 0 0 .54 2.7" {...S} />
      <path d="M12 18v4" {...S} />
      <path d="M8 22h8" {...S} />
      <path d="M2 2l20 20" {...S} />
    </svg>
  );
}

export function IconMusic(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <circle cx="6" cy="18" r="3" {...F} />
      <circle cx="6" cy="18" r="3" {...S} fill="none" />
      <path d="M9 18V5l12-2v13" {...S} />
      <circle cx="18" cy="16" r="3" {...F} />
      <circle cx="18" cy="16" r="3" {...S} fill="none" />
    </svg>
  );
}

export function IconMusic2(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <circle cx="8" cy="18" r="4" {...F} />
      <circle cx="8" cy="18" r="4" {...S} fill="none" />
      <path d="M12 18V2l7 4" {...S} />
    </svg>
  );
}

export function IconAudioLines(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M2 10v4" {...S} />
      <path d="M6 6v12" {...S} />
      <path d="M10 3v18" {...S} />
      <path d="M14 8v8" {...S} />
      <path d="M18 5v14" {...S} />
      <path d="M22 10v4" {...S} />
    </svg>
  );
}

export function IconVolume2(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M11 5L6 9H2v6h4l5 4V5z" {...F} />
      <path d="M11 5L6 9H2v6h4l5 4V5z" {...S} fill="none" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" {...S} />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" {...S} />
    </svg>
  );
}

export function IconPlay(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <polygon points="5,3 19,12 5,21" {...F} />
      <polygon points="5,3 19,12 5,21" {...S} fill="none" />
    </svg>
  );
}

export function IconPause(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <rect x="6" y="4" width="4" height="16" rx="1" {...F} />
      <rect x="6" y="4" width="4" height="16" rx="1" {...S} fill="none" />
      <rect x="14" y="4" width="4" height="16" rx="1" {...F} />
      <rect x="14" y="4" width="4" height="16" rx="1" {...S} fill="none" />
    </svg>
  );
}

export function IconPlayCircle(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <circle cx="12" cy="12" r="10" {...F} />
      <circle cx="12" cy="12" r="10" {...S} fill="none" />
      <polygon points="10,8 16,12 10,16" {...F} opacity="0.3" />
      <polygon points="10,8 16,12 10,16" {...S} fill="none" />
    </svg>
  );
}

export function IconMessageCircle(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" {...F} />
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" {...S} fill="none" />
    </svg>
  );
}

export function IconMessageSquare(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" {...F} />
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" {...S} fill="none" />
    </svg>
  );
}

export function IconSend(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M22 2L11 13" {...S} />
      <path d="M22 2l-7 20-4-9-9-4 20-7z" {...F} />
      <path d="M22 2l-7 20-4-9-9-4 20-7z" {...S} fill="none" />
    </svg>
  );
}

export function IconExternalLink(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" {...S} />
      <path d="M15 3h6v6" {...S} />
      <path d="M10 14L21 3" {...S} />
      <rect x="3" y="6" width="13" height="15" rx="2" {...F} />
    </svg>
  );
}

export function IconLink(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" {...S} />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" {...S} />
    </svg>
  );
}

export function IconMenu(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M4 6h16" {...S} />
      <path d="M4 12h16" {...S} />
      <path d="M4 18h16" {...S} />
    </svg>
  );
}

export function IconBookmark(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" {...F} />
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" {...S} fill="none" />
    </svg>
  );
}

export function IconCamera(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2v11z" {...F} />
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2v11z" {...S} fill="none" />
      <circle cx="12" cy="13" r="4" {...S} fill="none" />
      <circle cx="12" cy="13" r="1.5" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

export function IconCaptions(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <rect x="1" y="4" width="22" height="16" rx="2.5" {...F} />
      <rect x="1" y="4" width="22" height="16" rx="2.5" {...S} fill="none" />
      <path d="M7 15h4M13 15h4" {...S} />
      <path d="M7 11h10" {...S} />
    </svg>
  );
}

export function IconNavigation(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <polygon points="3,11 22,2 13,21 11,13" {...F} />
      <polygon points="3,11 22,2 13,21 11,13" {...S} fill="none" />
    </svg>
  );
}

export function IconDollarSign(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <circle cx="12" cy="12" r="10" {...F} />
      <circle cx="12" cy="12" r="10" {...S} fill="none" />
      <path d="M16 8h-2a3 3 0 0 0 0 6h0a3 3 0 0 1 0 6H8" {...S} />
      <path d="M12 5v2M12 17v2" {...S} />
    </svg>
  );
}

export function IconWallet(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <rect x="2" y="5" width="20" height="16" rx="2" {...F} />
      <rect x="2" y="5" width="20" height="16" rx="2" {...S} fill="none" />
      <path d="M2 10h20" {...S} />
      <circle cx="17" cy="15" r="1.5" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

export function IconLandmark(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M3 22h18" {...S} />
      <path d="M6 18v-7" {...S} />
      <path d="M10 18v-7" {...S} />
      <path d="M14 18v-7" {...S} />
      <path d="M18 18v-7" {...S} />
      <path d="M12 2l10 7H2l10-7z" {...F} />
      <path d="M12 2l10 7H2l10-7z" {...S} fill="none" />
      <rect x="2" y="18" width="20" height="2" rx="0.5" {...F} />
      <rect x="2" y="18" width="20" height="2" rx="0.5" {...S} fill="none" />
    </svg>
  );
}

export function IconScale(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M12 3v18" {...S} />
      <path d="M16 7l-4-4-4 4" {...S} />
      <path d="M5 10l3 7h-2l-1 2" {...F} />
      <path d="M19 10l-3 7h2l1 2" {...F} />
      <path d="M5 10l3 7" {...S} />
      <path d="M19 10l-3 7" {...S} />
      <path d="M5 17h6M13 17h6" {...S} />
      <rect x="8" y="19" width="8" height="2" rx="1" {...F} />
      <rect x="8" y="19" width="8" height="2" rx="1" {...S} fill="none" />
    </svg>
  );
}

export function IconPercent(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M19 5L5 19" {...S} />
      <circle cx="7" cy="7" r="3" {...F} />
      <circle cx="7" cy="7" r="3" {...S} fill="none" />
      <circle cx="17" cy="17" r="3" {...F} />
      <circle cx="17" cy="17" r="3" {...S} fill="none" />
    </svg>
  );
}

export function IconBarChart3(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <rect x="3" y="14" width="4" height="7" rx="1" {...F} />
      <rect x="3" y="14" width="4" height="7" rx="1" {...S} fill="none" />
      <rect x="10" y="8" width="4" height="13" rx="1" {...F} />
      <rect x="10" y="8" width="4" height="13" rx="1" {...S} fill="none" />
      <rect x="17" y="3" width="4" height="18" rx="1" {...F} />
      <rect x="17" y="3" width="4" height="18" rx="1" {...S} fill="none" />
    </svg>
  );
}

export function IconTrendingUp(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M2 17l5-5 4 4 5-6 5-5" {...S} />
      <path d="M17 5h4v4" {...S} />
      <path d="M2 17l5-5 4 4 5-6 5-5v12H2z" {...F} />
    </svg>
  );
}

export function IconTrendingDown(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M2 7l5 5 4-4 5 6 5 5" {...S} />
      <path d="M17 19h4v-4" {...S} />
      <path d="M2 7l5 5 4-4 5 6 5 5V7H2z" {...F} />
    </svg>
  );
}

export function IconPlusCircle(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <circle cx="12" cy="12" r="10" {...F} />
      <circle cx="12" cy="12" r="10" {...S} fill="none" />
      <path d="M12 8v8" {...S} />
      <path d="M8 12h8" {...S} />
    </svg>
  );
}

export function IconTarget(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <circle cx="12" cy="12" r="10" {...F} />
      <circle cx="12" cy="12" r="10" {...S} fill="none" />
      <circle cx="12" cy="12" r="6" {...S} fill="none" />
      <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

export function IconCpu(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <rect x="4" y="4" width="16" height="16" rx="2" {...F} />
      <rect x="4" y="4" width="16" height="16" rx="2" {...S} fill="none" />
      <rect x="9" y="9" width="6" height="6" rx="1" {...S} fill="none" />
      <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3" {...S} />
    </svg>
  );
}

export function IconServer(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <rect x="2" y="2" width="20" height="8" rx="2" {...F} />
      <rect x="2" y="2" width="20" height="8" rx="2" {...S} fill="none" />
      <rect x="2" y="14" width="20" height="8" rx="2" {...F} />
      <rect x="2" y="14" width="20" height="8" rx="2" {...S} fill="none" />
      <circle cx="6" cy="6" r="1" fill="currentColor" opacity="0.35" />
      <circle cx="6" cy="18" r="1" fill="currentColor" opacity="0.35" />
    </svg>
  );
}

export function IconHardDrive(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M22 12H2" {...S} />
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" {...F} />
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" {...S} fill="none" />
      <circle cx="6" cy="16" r="1" fill="currentColor" opacity="0.35" />
      <path d="M10 16h8" {...S} />
    </svg>
  );
}

export function IconMonitor(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <rect x="2" y="3" width="20" height="14" rx="2" {...F} />
      <rect x="2" y="3" width="20" height="14" rx="2" {...S} fill="none" />
      <path d="M8 21h8" {...S} />
      <path d="M12 17v4" {...S} />
    </svg>
  );
}

export function IconHash(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M4 9h16" {...S} />
      <path d="M4 15h16" {...S} />
      <path d="M10 3l-2 18" {...S} />
      <path d="M16 3l-2 18" {...S} />
    </svg>
  );
}

export function IconGauge(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" {...F} />
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" {...S} fill="none" />
      <path d="M12 12l4-6" {...S} />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

export function IconSliders(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M4 21v-7" {...S} />
      <path d="M4 10V3" {...S} />
      <path d="M12 21v-9" {...S} />
      <path d="M12 8V3" {...S} />
      <path d="M20 21v-5" {...S} />
      <path d="M20 12V3" {...S} />
      <circle cx="4" cy="12" r="2" {...F} />
      <circle cx="4" cy="12" r="2" {...S} fill="none" />
      <circle cx="12" cy="10" r="2" {...F} />
      <circle cx="12" cy="10" r="2" {...S} fill="none" />
      <circle cx="20" cy="14" r="2" {...F} />
      <circle cx="20" cy="14" r="2" {...S} fill="none" />
    </svg>
  );
}

export function IconSettings2(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M20 7h-9" {...S} />
      <path d="M14 17H5" {...S} />
      <circle cx="17" cy="17" r="3" {...F} />
      <circle cx="17" cy="17" r="3" {...S} fill="none" />
      <circle cx="7" cy="7" r="3" {...F} />
      <circle cx="7" cy="7" r="3" {...S} fill="none" />
    </svg>
  );
}

export function IconWrench(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" {...F} />
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" {...S} fill="none" />
    </svg>
  );
}

export function IconBrain(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M12 2a5 5 0 0 0-4.6 3A4.5 4.5 0 0 0 4 9.5a4.5 4.5 0 0 0 1.4 3.3A5 5 0 0 0 4 16a5 5 0 0 0 5 5h1V2h-1z" {...F} />
      <path d="M12 2a5 5 0 0 1 4.6 3A4.5 4.5 0 0 1 20 9.5a4.5 4.5 0 0 1-1.4 3.3A5 5 0 0 1 20 16a5 5 0 0 1-5 5h-3V2z" {...F} opacity="0.08" />
      <path d="M12 2a5 5 0 0 0-4.6 3A4.5 4.5 0 0 0 4 9.5a4.5 4.5 0 0 0 1.4 3.3A5 5 0 0 0 4 16a5 5 0 0 0 5 5" {...S} />
      <path d="M12 2a5 5 0 0 1 4.6 3A4.5 4.5 0 0 1 20 9.5a4.5 4.5 0 0 1-1.4 3.3A5 5 0 0 1 20 16a5 5 0 0 1-5 5" {...S} />
      <path d="M12 2v19" {...S} />
    </svg>
  );
}

export function IconHome(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" {...F} />
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" {...S} fill="none" />
      <path d="M9 22V12h6v10" {...S} />
    </svg>
  );
}

export function IconHotel(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" {...F} />
      <path d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" {...S} fill="none" />
      <path d="M9 22V18h6v4" {...S} />
      <rect x="8" y="6" width="3" height="3" rx="0.5" {...S} fill="none" />
      <rect x="13" y="6" width="3" height="3" rx="0.5" {...S} fill="none" />
      <rect x="8" y="11" width="3" height="3" rx="0.5" {...S} fill="none" />
      <rect x="13" y="11" width="3" height="3" rx="0.5" {...S} fill="none" />
    </svg>
  );
}

export function IconBed(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M2 4v16" {...S} />
      <path d="M2 8h18a2 2 0 0 1 2 2v10" {...S} />
      <path d="M2 17h20" {...S} />
      <rect x="6" y="11" width="5" height="3" rx="1" {...F} />
      <rect x="6" y="11" width="5" height="3" rx="1" {...S} fill="none" />
      <rect x="13" y="11" width="5" height="3" rx="1" {...F} />
      <rect x="13" y="11" width="5" height="3" rx="1" {...S} fill="none" />
    </svg>
  );
}

export function IconBuilding2(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <rect x="4" y="2" width="16" height="20" rx="2" {...F} />
      <rect x="4" y="2" width="16" height="20" rx="2" {...S} fill="none" />
      <path d="M9 22V12h6v10" {...S} />
      <rect x="8" y="6" width="3" height="2.5" rx="0.5" {...S} fill="none" />
      <rect x="13" y="6" width="3" height="2.5" rx="0.5" {...S} fill="none" />
    </svg>
  );
}

export function IconMap(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z" {...F} />
      <path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z" {...S} fill="none" />
      <path d="M8 2v16" {...S} />
      <path d="M16 6v16" {...S} />
    </svg>
  );
}

export function IconMountain(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M8 3l-6 18h20L14 7l-3 4-3-8z" {...F} />
      <path d="M8 3l-6 18h20L14 7l-3 4-3-8z" {...S} fill="none" />
    </svg>
  );
}

export function IconCompass(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <circle cx="12" cy="12" r="10" {...F} />
      <circle cx="12" cy="12" r="10" {...S} fill="none" />
      <polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88" {...F} opacity="0.3" />
      <polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88" {...S} fill="none" />
    </svg>
  );
}

export function IconCalendar(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <rect x="3" y="4" width="18" height="18" rx="2" {...F} />
      <rect x="3" y="4" width="18" height="18" rx="2" {...S} fill="none" />
      <path d="M16 2v4" {...S} />
      <path d="M8 2v4" {...S} />
      <path d="M3 10h18" {...S} />
      <circle cx="8" cy="15" r="0.75" fill="currentColor" opacity="0.35" />
      <circle cx="12" cy="15" r="0.75" fill="currentColor" opacity="0.35" />
      <circle cx="16" cy="15" r="0.75" fill="currentColor" opacity="0.35" />
    </svg>
  );
}

export function IconPresentation(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <rect x="2" y="3" width="20" height="14" rx="2" {...F} />
      <rect x="2" y="3" width="20" height="14" rx="2" {...S} fill="none" />
      <path d="M8 21l4-4 4 4" {...S} />
      <path d="M12 17v-4" {...S} />
      <path d="M7 10l3-3 2 2 4-4" {...S} />
    </svg>
  );
}

export function IconLayoutGrid(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" {...F} />
      <rect x="3" y="3" width="7" height="7" rx="1.5" {...S} fill="none" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" {...F} />
      <rect x="14" y="3" width="7" height="7" rx="1.5" {...S} fill="none" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" {...F} />
      <rect x="3" y="14" width="7" height="7" rx="1.5" {...S} fill="none" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" {...F} />
      <rect x="14" y="14" width="7" height="7" rx="1.5" {...S} fill="none" />
    </svg>
  );
}

export function IconLogIn(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" {...S} />
      <path d="M10 17l5-5-5-5" {...S} />
      <path d="M15 12H3" {...S} />
      <rect x="15" y="3" width="6" height="18" rx="2" {...F} />
    </svg>
  );
}

export function IconLogOut(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" {...S} />
      <path d="M16 17l5-5-5-5" {...S} />
      <path d="M21 12H9" {...S} />
      <rect x="3" y="3" width="6" height="18" rx="2" {...F} />
    </svg>
  );
}

export function IconUser(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <circle cx="12" cy="8" r="5" {...F} />
      <circle cx="12" cy="8" r="5" {...S} fill="none" />
      <path d="M20 21a8 8 0 0 0-16 0" {...F} />
      <path d="M20 21a8 8 0 0 0-16 0" {...S} fill="none" />
    </svg>
  );
}

export function IconUsers(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <circle cx="9" cy="7" r="4" {...F} />
      <circle cx="9" cy="7" r="4" {...S} fill="none" />
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" {...S} />
      <circle cx="17" cy="7" r="3" {...S} fill="none" />
      <path d="M21 21v-2a4 4 0 0 0-3-3.87" {...S} />
    </svg>
  );
}

export function IconSparkles(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" {...F} />
      <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" {...S} fill="none" />
    </svg>
  );
}

export function IconWand2(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M15 4V2" {...S} />
      <path d="M15 16v-2" {...S} />
      <path d="M8 9h2" {...S} />
      <path d="M20 9h2" {...S} />
      <path d="M17.8 11.8l1.4 1.4" {...S} />
      <path d="M15 9h.01" {...S} />
      <path d="M17.8 6.2l1.4-1.4" {...S} />
      <path d="M3 21l9-9" {...S} />
      <path d="M12.2 6.2l1.4-1.4" {...S} />
      <circle cx="15" cy="9" r="4" {...F} />
    </svg>
  );
}

export function IconZap(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" {...F} />
      <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" {...S} fill="none" />
    </svg>
  );
}

export function IconType(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M4 7V4h16v3" {...S} />
      <path d="M9 20h6" {...S} />
      <path d="M12 4v16" {...S} />
    </svg>
  );
}

export function IconLibrary(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <rect x="3" y="3" width="4" height="18" rx="1" {...F} />
      <rect x="3" y="3" width="4" height="18" rx="1" {...S} fill="none" />
      <rect x="10" y="3" width="4" height="18" rx="1" {...F} />
      <rect x="10" y="3" width="4" height="18" rx="1" {...S} fill="none" />
      <rect x="17" y="3" width="4" height="18" rx="1" {...F} />
      <rect x="17" y="3" width="4" height="18" rx="1" {...S} fill="none" />
    </svg>
  );
}

export function IconSquare(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <rect x="3" y="3" width="18" height="18" rx="2" {...F} />
      <rect x="3" y="3" width="18" height="18" rx="2" {...S} fill="none" />
    </svg>
  );
}

export function IconArrowRightLeft(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M21 7H3" {...S} />
      <path d="M18 4l3 3-3 3" {...S} />
      <path d="M3 17h18" {...S} />
      <path d="M6 20l-3-3 3-3" {...S} />
    </svg>
  );
}

export function IconArrowUpRight(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M7 17L17 7" {...S} />
      <path d="M7 7h10v10" {...S} />
    </svg>
  );
}

export function IconGitCompareArrows(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <circle cx="5" cy="6" r="3" {...F} />
      <circle cx="5" cy="6" r="3" {...S} fill="none" />
      <circle cx="19" cy="18" r="3" {...F} />
      <circle cx="19" cy="18" r="3" {...S} fill="none" />
      <path d="M12 2l-3 3 3 3" {...S} />
      <path d="M9 5h7a4 4 0 0 1 4 4v4" {...S} />
      <path d="M12 22l3-3-3-3" {...S} />
      <path d="M15 19H8a4 4 0 0 1-4-4v-4" {...S} />
    </svg>
  );
}

export function IconCrop(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M6 2v4" {...S} />
      <path d="M18 22v-4" {...S} />
      <rect x="6" y="6" width="12" height="12" rx="1" {...F} />
      <path d="M6 6h14v12H6z" {...S} fill="none" />
      <path d="M2 6h4" {...S} />
      <path d="M18 18h4" {...S} />
    </svg>
  );
}

export function IconEyeOff(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" {...S} />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" {...S} />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" {...S} />
      <path d="M1 1l22 22" {...S} />
    </svg>
  );
}

export function IconRefreshCw(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" {...S} />
      <path d="M21 3v5h-5" {...S} />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" {...S} />
      <path d="M3 21v-5h5" {...S} />
    </svg>
  );
}

export function IconTimer(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <circle cx="12" cy="13" r="8" {...F} />
      <circle cx="12" cy="13" r="8" {...S} fill="none" />
      <path d="M12 9v4l2 2" {...S} />
      <path d="M10 2h4" {...S} />
      <path d="M12 2v3" {...S} />
    </svg>
  );
}

export function IconUtensilsCrossed(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M2.27 21.7s9.87-9.87 4.67-15.06C2.27 2.27 2.27 2.27 2.27 2.27" {...S} />
      <path d="M3.69 20.32l2.82-2.82" {...S} />
      <path d="M19.5 2.5l-7 7 3 3 7-7" {...S} />
      <path d="M12 12l9 9" {...S} />
      <path d="M20 2l2 2" {...S} />
      <circle cx="7" cy="7" r="3" {...F} />
    </svg>
  );
}

export function IconWaves(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" {...S} />
      <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" {...S} />
      <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" {...S} />
    </svg>
  );
}

export function IconBanknote(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <rect x="2" y="6" width="20" height="12" rx="2" {...F} />
      <rect x="2" y="6" width="20" height="12" rx="2" {...S} fill="none" />
      <circle cx="12" cy="12" r="2" {...S} fill="none" />
      <path d="M6 12h.01" {...S} />
      <path d="M18 12h.01" {...S} />
    </svg>
  );
}

export function IconLayers(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M12 2l10 6.5-10 6.5L2 8.5 12 2z" {...F} />
      <path d="M12 2l10 6.5-10 6.5L2 8.5 12 2z" {...S} fill="none" />
      <path d="M2 15l10 6.5L22 15" {...S} />
      <path d="M2 11.5l10 6.5 10-6.5" {...S} />
    </svg>
  );
}

export function IconPieChart(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" {...F} />
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" {...S} fill="none" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" {...F} />
      <path d="M22 12A10 10 0 0 0 12 2v10z" {...S} fill="none" />
    </svg>
  );
}

export function IconShieldCheck(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" {...F} />
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" {...S} fill="none" />
      <path d="M9 12l2 2 4-4" {...S} />
    </svg>
  );
}

export function IconHeart(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7 7-7z" {...F} />
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7 7-7z" {...S} fill="none" />
    </svg>
  );
}

export function IconUserCircle(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <circle cx="12" cy="12" r="10" {...F} />
      <circle cx="12" cy="12" r="10" {...S} fill="none" />
      <circle cx="12" cy="10" r="3" {...S} fill="none" />
      <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" {...S} />
    </svg>
  );
}

export function IconFlaskConical(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2" {...F} />
      <path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2" {...S} fill="none" />
      <path d="M8.5 2h7" {...S} />
    </svg>
  );
}

export function IconBookOpenCheck(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M8 3H2v15h7c1.7 0 3 1.3 3 3V7c0-2.2-1.8-4-4-4z" {...F} />
      <path d="M8 3H2v15h7c1.7 0 3 1.3 3 3V7c0-2.2-1.8-4-4-4z" {...S} fill="none" />
      <path d="M16 3h6v15h-7c-1.7 0-3 1.3-3 3V7c0-2.2 1.8-4 4-4z" {...S} fill="none" />
      <path d="M16 12l2 2 4-4" {...S} />
    </svg>
  );
}

export function IconImageIcon(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <rect x="3" y="3" width="18" height="18" rx="2" {...F} />
      <rect x="3" y="3" width="18" height="18" rx="2" {...S} fill="none" />
      <circle cx="8.5" cy="8.5" r="1.5" {...S} fill="none" />
      <path d="M21 15l-5-5L5 21" {...S} fill="none" />
    </svg>
  );
}

export function IconLanguages(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M5 8l6 6" {...S} fill="none" />
      <path d="M4 14l6-6 2-3" {...S} fill="none" />
      <path d="M2 5h12" {...S} fill="none" />
      <path d="M7 2v3" {...S} fill="none" />
      <path d="M22 22l-5-10-5 10" {...S} fill="none" />
      <path d="M14 18h6" {...S} fill="none" />
    </svg>
  );
}

export function IconLayoutTemplate(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <rect x="3" y="3" width="18" height="18" rx="2" {...F} />
      <rect x="3" y="3" width="18" height="18" rx="2" {...S} fill="none" />
      <path d="M21 9H3" {...S} fill="none" />
      <path d="M9 21V9" {...S} fill="none" />
    </svg>
  );
}

export function IconMaximize2(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <polyline points="15 3 21 3 21 9" {...S} fill="none" />
      <polyline points="9 21 3 21 3 15" {...S} fill="none" />
      <line x1="21" y1="3" x2="14" y2="10" {...S} />
      <line x1="3" y1="21" x2="10" y2="14" {...S} />
    </svg>
  );
}

export function IconMinimize2(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <polyline points="4 14 10 14 10 20" {...S} fill="none" />
      <polyline points="20 10 14 10 14 4" {...S} fill="none" />
      <line x1="14" y1="10" x2="21" y2="3" {...S} />
      <line x1="3" y1="21" x2="10" y2="14" {...S} />
    </svg>
  );
}

export function IconMessageSquareText(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" {...F} />
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" {...S} fill="none" />
      <path d="M13 8H7" {...S} fill="none" />
      <path d="M17 12H7" {...S} fill="none" />
    </svg>
  );
}

export function IconPaintbrush(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M18.37 2.63L14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3z" {...F} />
      <path d="M18.37 2.63L14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3z" {...S} fill="none" />
      <path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7" {...S} fill="none" />
      <path d="M14.5 17.5L4.5 15" {...S} fill="none" />
    </svg>
  );
}

export function IconThumbsUp(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M7 10v12" {...S} fill="none" />
      <path d="M15 5.88L14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88z" {...F} />
      <path d="M15 5.88L14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88z" {...S} fill="none" />
    </svg>
  );
}

export function IconToggleLeft(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <rect x="1" y="5" width="22" height="14" rx="7" {...F} />
      <rect x="1" y="5" width="22" height="14" rx="7" {...S} fill="none" />
      <circle cx="8" cy="12" r="3" {...S} fill="none" />
    </svg>
  );
}

export function IconBarChart2(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <rect x="10" y="3" width="4" height="18" rx="1" {...F} />
      <line x1="18" y1="8" x2="18" y2="21" {...S} />
      <line x1="12" y1="3" x2="12" y2="21" {...S} />
      <line x1="6" y1="14" x2="6" y2="21" {...S} />
    </svg>
  );
}

export function IconBath(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M4 12h16a1 1 0 0 1 1 1v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3a1 1 0 0 1 1-1z" {...F} />
      <path d="M4 12h16a1 1 0 0 1 1 1v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3a1 1 0 0 1 1-1z" {...S} fill="none" />
      <path d="M6 12V5a2 2 0 0 1 2-2h3v2.25" {...S} fill="none" />
      <line x1="4" y1="21" x2="4" y2="20" {...S} />
      <line x1="20" y1="21" x2="20" y2="20" {...S} />
    </svg>
  );
}

export function IconCreditCard(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <rect x="1" y="4" width="22" height="16" rx="2" {...F} />
      <rect x="1" y="4" width="22" height="16" rx="2" {...S} fill="none" />
      <line x1="1" y1="10" x2="23" y2="10" {...S} />
    </svg>
  );
}

export function IconFileCode(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" {...F} />
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" {...S} fill="none" />
      <polyline points="14 2 14 8 20 8" {...S} fill="none" />
      <path d="M10 13l-2 2 2 2" {...S} fill="none" />
      <path d="M14 17l2-2-2-2" {...S} fill="none" />
    </svg>
  );
}

export function IconFile(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" {...F} />
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" {...S} fill="none" />
      <polyline points="14 2 14 8 20 8" {...S} fill="none" />
    </svg>
  );
}

export function IconFileUp(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" {...F} />
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" {...S} fill="none" />
      <polyline points="14 2 14 8 20 8" {...S} fill="none" />
      <path d="M12 18v-6" {...S} fill="none" />
      <path d="M9 15l3-3 3 3" {...S} fill="none" />
    </svg>
  );
}

export function IconFolder(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" {...F} />
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" {...S} fill="none" />
    </svg>
  );
}

export function IconForward(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <polyline points="15 17 20 12 15 7" {...S} fill="none" />
      <path d="M4 18v-2a4 4 0 0 1 4-4h12" {...S} fill="none" />
    </svg>
  );
}

export function IconHistory(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <circle cx="12" cy="12" r="10" {...F} />
      <circle cx="12" cy="12" r="10" {...S} fill="none" />
      <polyline points="12 6 12 12 16 14" {...S} fill="none" />
    </svg>
  );
}

export function IconInbox(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" {...F} />
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" {...S} fill="none" />
    </svg>
  );
}

export function IconKeyboard(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <rect x="2" y="4" width="20" height="16" rx="2" {...F} />
      <rect x="2" y="4" width="20" height="16" rx="2" {...S} fill="none" />
      <path d="M6 8h.01" {...S} fill="none" />
      <path d="M10 8h.01" {...S} fill="none" />
      <path d="M14 8h.01" {...S} fill="none" />
      <path d="M18 8h.01" {...S} fill="none" />
      <path d="M8 12h.01" {...S} fill="none" />
      <path d="M12 12h.01" {...S} fill="none" />
      <path d="M16 12h.01" {...S} fill="none" />
      <path d="M7 16h10" {...S} fill="none" />
    </svg>
  );
}

export function IconMousePointerClick(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M9 9l5 12 1.8-5.2L21 14z" {...F} />
      <path d="M9 9l5 12 1.8-5.2L21 14z" {...S} fill="none" />
      <path d="M7.2 2.2L8 5.1" {...S} fill="none" />
      <path d="M5.1 8l-2.9-.8" {...S} fill="none" />
      <path d="M14 4.1L12 6" {...S} fill="none" />
      <path d="M6 12l-1.9 2" {...S} fill="none" />
    </svg>
  );
}

export function IconPhoneOff(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67" {...S} fill="none" />
      <path d="M22 2L2 22" {...S} fill="none" />
      <path d="M3.27 11.11a19.89 19.89 0 0 1-1.24-4.93A2 2 0 0 1 3.75 4H6.7a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.67 11.91" {...S} fill="none" />
    </svg>
  );
}

export function IconRadio(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <circle cx="12" cy="12" r="2" {...F} />
      <circle cx="12" cy="12" r="2" {...S} fill="none" />
      <path d="M16.24 7.76a6 6 0 0 1 0 8.49" {...S} fill="none" />
      <path d="M7.76 16.24a6 6 0 0 1 0-8.49" {...S} fill="none" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" {...S} fill="none" />
      <path d="M4.93 19.07a10 10 0 0 1 0-14.14" {...S} fill="none" />
    </svg>
  );
}

export function IconRuler(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M21.2 8.4c.5.38.8.97.8 1.6v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10a2 2 0 0 1 .8-1.6l8-6a2 2 0 0 1 2.4 0l8 6z" {...S} fill="none" />
      <path d="M2 10l10 7 10-7" {...S} fill="none" />
    </svg>
  );
}

export function IconShare(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <circle cx="18" cy="5" r="3" {...F} />
      <circle cx="18" cy="5" r="3" {...S} fill="none" />
      <circle cx="6" cy="12" r="3" {...S} fill="none" />
      <circle cx="18" cy="19" r="3" {...S} fill="none" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" {...S} />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" {...S} />
    </svg>
  );
}

export function IconSkipBack(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <polygon points="19 20 9 12 19 4" {...F} />
      <polygon points="19 20 9 12 19 4" {...S} fill="none" />
      <line x1="5" y1="19" x2="5" y2="5" {...S} />
    </svg>
  );
}

export function IconSkipForward(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <polygon points="5 4 15 12 5 20" {...F} />
      <polygon points="5 4 15 12 5 20" {...S} fill="none" />
      <line x1="19" y1="5" x2="19" y2="19" {...S} />
    </svg>
  );
}

export function IconStickyNote(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3z" {...F} />
      <path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3z" {...S} fill="none" />
      <path d="M15 3v6h6" {...S} fill="none" />
    </svg>
  );
}

export function IconTrees(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <path d="M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0z" {...F} />
      <path d="M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0z" {...S} fill="none" />
      <path d="M7 16v6" {...S} fill="none" />
      <path d="M13 19v3" {...S} fill="none" />
      <path d="M20 10v.2A3 3 0 0 1 18.9 16H15a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0z" {...S} fill="none" />
    </svg>
  );
}

export function IconVolume(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19" {...F} />
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19" {...S} fill="none" />
    </svg>
  );
}

export function IconVolume1(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19" {...F} />
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19" {...S} fill="none" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" {...S} fill="none" />
    </svg>
  );
}

export function IconVolumeX(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19" {...F} />
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19" {...S} fill="none" />
      <line x1="23" y1="9" x2="17" y2="15" {...S} />
      <line x1="17" y1="9" x2="23" y2="15" {...S} />
    </svg>
  );
}

export function IconClipboardList(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <rect x="8" y="2" width="8" height="4" rx="1" {...F} />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" {...S} fill="none" />
      <rect x="8" y="2" width="8" height="4" rx="1" {...S} fill="none" />
      <path d="M12 11h4" {...S} fill="none" />
      <path d="M12 16h4" {...S} fill="none" />
      <path d="M8 11h.01" {...S} fill="none" />
      <path d="M8 16h.01" {...S} fill="none" />
    </svg>
  );
}

export function IconColumns(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <rect x="3" y="3" width="18" height="18" rx="2" {...F} />
      <rect x="3" y="3" width="18" height="18" rx="2" {...S} fill="none" />
      <line x1="12" y1="3" x2="12" y2="21" {...S} />
    </svg>
  );
}

export function IconLayoutDashboard(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <rect x="3" y="3" width="7" height="9" rx="1" {...F} />
      <rect x="3" y="3" width="7" height="9" rx="1" {...S} fill="none" />
      <rect x="14" y="3" width="7" height="5" rx="1" {...S} fill="none" />
      <rect x="14" y="12" width="7" height="9" rx="1" {...S} fill="none" />
      <rect x="3" y="16" width="7" height="5" rx="1" {...S} fill="none" />
    </svg>
  );
}

export function IconList(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <line x1="8" y1="6" x2="21" y2="6" {...S} />
      <line x1="8" y1="12" x2="21" y2="12" {...S} />
      <line x1="8" y1="18" x2="21" y2="18" {...S} />
      <line x1="3" y1="6" x2="3.01" y2="6" {...S} />
      <line x1="3" y1="12" x2="3.01" y2="12" {...S} />
      <line x1="3" y1="18" x2="3.01" y2="18" {...S} />
    </svg>
  );
}

export function IconMoreVertical(p: IconProps) {
  const a = defaults(p);
  return (
    <svg {...a}>
      <circle cx="12" cy="12" r="1" {...S} />
      <circle cx="12" cy="5" r="1" {...S} />
      <circle cx="12" cy="19" r="1" {...S} />
    </svg>
  );
}

export const IconAudioLinesIcon = IconAudioLines;
export const IconBarChartIcon = IconBarChart3;
export const IconBellIcon = IconBell;
export const IconCameraIcon = IconCamera;
export const IconCheckCircle2Icon = IconCheckCircle2;
export const IconCheckCircleIcon = IconCheckCircle;
export const IconClipboardListIcon = IconClipboardList;
export const IconColumnsIcon = IconColumns;
export const IconCopyIcon = IconCopy;
export const IconCreditCardIcon = IconCreditCard;
export const IconDatabaseIcon = IconDatabase;
export const IconFileCodeIcon = IconFileCode;
export const IconFileIcon = IconFile;
export const IconFileTextIcon = IconFileText;
export const IconFolderIcon = IconFolder;
export const IconHelpCircleIcon = IconHelpCircle;
export const IconLayoutDashboardIcon = IconLayoutDashboard;
export const IconListIcon = IconList;
export const IconLogOutIcon = IconLogOut;
export const IconMailIcon = IconMail;
export const IconMicIcon = IconMic;
export const IconMoreVerticalIcon = IconMoreVertical;
export const IconPauseIcon = IconPause;
export const IconPhoneIcon = IconPhone;
export const IconPhoneOffIcon = IconPhoneOff;
export const IconPlayIcon = IconPlay;
export const IconPlusCircleIcon = IconPlusCircle;
export const IconPlusIcon = IconPlus;
export const IconSendIcon = IconSend;
export const IconSettingsIcon = IconSettings;
export const IconShareIcon = IconShare;
export const IconSquareIcon = IconSquare;
export const IconTrendingDownIcon = IconTrendingDown;
export const IconTrendingUpIcon = IconTrendingUp;
export const IconUserCircleIcon = IconUserCircle;
export const IconUsersIcon = IconUsers;
