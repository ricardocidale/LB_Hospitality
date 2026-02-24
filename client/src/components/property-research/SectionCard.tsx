import type { SectionColorScheme } from "./types";

export function SectionCard({ icon: Icon, title, color, children }: { icon: any; title: string; color: SectionColorScheme; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100" style={{ borderLeftWidth: 4, borderLeftColor: color.accent }}>
        <div className={`w-9 h-9 rounded-lg ${color.iconBg} flex items-center justify-center`}>
          <Icon className={`w-[18px] h-[18px] ${color.iconText}`} />
        </div>
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}
