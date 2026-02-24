/**
 * tabs.tsx — Radix-based tab components with custom themed variants.
 *
 * Extends the shadcn/Radix Tabs primitives with a CurrentThemeTab variant
 * that matches the platform's glass-card visual style. Used for switching
 * between Income Statement, Cash Flow, and Balance Sheet views.
 */
import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-primary/80 data-[state=active]:backdrop-blur-md data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/30 data-[state=active]:border data-[state=active]:border-white/30",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

interface CurrentThemeTabItem {
  value: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface CurrentThemeTabProps {
  tabs: CurrentThemeTabItem[];
  activeTab: string;
  onTabChange: (value: string) => void;
  rightContent?: React.ReactNode;
}

function CurrentThemeTab({ tabs, activeTab, onTabChange, rightContent }: CurrentThemeTabProps) {
  return (
    <div className="relative rounded-2xl w-full">
      <div className="absolute inset-0 bg-[#0a0a0f] rounded-2xl" />
      <div className="absolute inset-0 bg-gradient-to-r from-white/[0.02] via-transparent to-white/[0.02] rounded-2xl" />
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute inset-0 rounded-2xl border border-white/10" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
        <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full bg-primary/15 blur-[50px]" />
        <div className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full bg-secondary/15 blur-[40px]" />
      </div>
      <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(159,188,164,0.05)] rounded-2xl" />
      <div className="relative flex flex-wrap items-center justify-between gap-1 p-1.5">
        <div className="flex flex-wrap gap-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.value;
            const Icon = tab.icon;
            return (
              <button
                key={tab.value}
                onClick={() => onTabChange(tab.value)}
                className={`group relative overflow-hidden flex items-center gap-1.5 sm:gap-3 px-2.5 py-2 sm:px-4 sm:py-3 text-sm font-medium rounded-2xl transition-all duration-300 ease-out ${
                  isActive ? "text-white" : "text-background/60 hover:text-white"
                }`}
                data-testid={`tab-${tab.value}`}
              >
                {isActive && (
                  <>
                    <div className="absolute inset-0 bg-white/12 backdrop-blur-xl rounded-2xl" />
                    <div className="absolute inset-0 rounded-2xl border border-white/20" />
                    <div className="absolute top-0 left-2 right-2 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                    <div className="absolute inset-0 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_4px_16px_rgba(0,0,0,0.2)]" />
                  </>
                )}
                {!isActive && (
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-all duration-300 rounded-2xl" />
                )}
                {Icon && (
                  <div className={cn(
                    "relative w-6 h-6 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center transition-all duration-300",
                    isActive
                      ? "bg-gradient-to-br from-primary to-secondary shadow-[0_0_16px_rgba(159,188,164,0.5)]"
                      : "bg-white/5 group-hover:bg-white/10"
                  )}>
                    <Icon className={cn("w-3 h-3 sm:w-4 sm:h-4 transition-all duration-300", isActive ? "text-white" : "text-background/60 group-hover:text-white")} />
                  </div>
                )}
                <span className="relative text-xs sm:text-sm">{tab.label}</span>
              </button>
            );
          })}
        </div>
        {rightContent && (
          <div className="relative flex items-center gap-2 pr-1.5">
            {rightContent}
          </div>
        )}
      </div>
    </div>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent, CurrentThemeTab }
export type { CurrentThemeTabItem }
