import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

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
