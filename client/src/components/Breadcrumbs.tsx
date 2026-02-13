import { useLocation } from "wouter";
import { useStore } from "@/lib/store";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface BreadcrumbEntry {
  label: string;
  href?: string;
}

function useBreadcrumbs(): BreadcrumbEntry[] {
  const [location] = useLocation();
  const properties = useStore((s) => s.properties);

  const path = location.replace(/\/+$/, "") || "/";

  if (path === "/") {
    return [{ label: "Home" }];
  }

  const propertyMatch = path.match(/^\/property\/([^/]+)(\/(.+))?$/);
  if (propertyMatch) {
    const propId = propertyMatch[1];
    const sub = propertyMatch[3];
    const prop = properties.find((p) => p.id === propId);
    const propName = prop?.name ?? propId;

    const items: BreadcrumbEntry[] = [
      { label: "Home", href: "/" },
      { label: "Properties", href: "/portfolio" },
    ];

    if (!sub) {
      items.push({ label: propName });
    } else {
      items.push({ label: propName, href: `/property/${propId}` });
      if (sub === "edit") items.push({ label: "Edit" });
      else if (sub === "research") items.push({ label: "Research" });
      else items.push({ label: sub });
    }
    return items;
  }

  const staticRoutes: Record<string, BreadcrumbEntry[]> = {
    "/portfolio": [
      { label: "Home", href: "/" },
      { label: "Properties" },
    ],
    "/company": [
      { label: "Home", href: "/" },
      { label: "Management Co." },
    ],
    "/company/assumptions": [
      { label: "Home", href: "/" },
      { label: "Management Co.", href: "/company" },
      { label: "Assumptions" },
    ],
    "/company/research": [
      { label: "Home", href: "/" },
      { label: "Management Co.", href: "/company" },
      { label: "Research" },
    ],
    "/settings": [
      { label: "Home", href: "/" },
      { label: "Settings" },
    ],
    "/profile": [
      { label: "Home", href: "/" },
      { label: "Profile" },
    ],
    "/scenarios": [
      { label: "Home", href: "/" },
      { label: "Scenarios" },
    ],
    "/sensitivity": [
      { label: "Home", href: "/" },
      { label: "Sensitivity Analysis" },
    ],
    "/financing": [
      { label: "Home", href: "/" },
      { label: "Financing Analysis" },
    ],
    "/property-finder": [
      { label: "Home", href: "/" },
      { label: "Property Finder" },
    ],
    "/methodology": [
      { label: "Home", href: "/" },
      { label: "User Manual" },
    ],
    "/checker-manual": [
      { label: "Home", href: "/" },
      { label: "Checker Manual" },
    ],
    "/admin": [
      { label: "Home", href: "/" },
      { label: "Admin Settings" },
    ],
    "/global/research": [
      { label: "Home", href: "/" },
      { label: "Global Research" },
    ],
    "/compare": [
      { label: "Home", href: "/" },
      { label: "Compare Properties" },
    ],
    "/timeline": [
      { label: "Home", href: "/" },
      { label: "Timeline" },
    ],
    "/map": [
      { label: "Home", href: "/" },
      { label: "Map View" },
    ],
    "/executive-summary": [
      { label: "Home", href: "/" },
      { label: "Executive Summary" },
    ],
  };

  return staticRoutes[path] ?? [
    { label: "Home", href: "/" },
    { label: path.slice(1) },
  ];
}

export default function Breadcrumbs() {
  const items = useBreadcrumbs();

  return (
    <Breadcrumb data-testid="breadcrumbs" className="text-sm px-0">
      <BreadcrumbList>
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <BreadcrumbItem key={i}>
              {i > 0 && <BreadcrumbSeparator />}
              {isLast ? (
                <BreadcrumbPage className="text-foreground">
                  {item.label}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink
                  href={item.href}
                  className="text-muted-foreground"
                >
                  {item.label}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
