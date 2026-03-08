import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Image, Palette } from "lucide-react";
import LogosTab from "./LogosTab";
import ThemesTab from "./ThemesTab";

export default function DesignTab() {
  const [activeTab, setActiveTab] = useState("logos");

  return (
    <div className="space-y-6 mt-2">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground" data-testid="text-design-tab-title">Design & Assets</h2>
          <p className="text-muted-foreground text-sm">Manage platform visual identity, logos, and color themes.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 h-auto p-1 bg-muted border border-border" data-testid="tabs-design">
          <TabsTrigger value="logos" className="py-2.5 gap-2" data-testid="tab-logos">
            <Image className="w-4 h-4" />
            <span>Logos</span>
          </TabsTrigger>
          <TabsTrigger value="themes" className="py-2.5 gap-2" data-testid="tab-themes">
            <Palette className="w-4 h-4" />
            <span>Themes</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logos" className="mt-6">
          <LogosTab />
        </TabsContent>

        <TabsContent value="themes" className="mt-6">
          <ThemesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
