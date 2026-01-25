import Layout from "@/components/Layout";
import { useStore } from "@/lib/store";
import { generatePropertyProForma, formatMoney } from "@/lib/financialEngine";
import { GlassCard } from "@/components/ui/glass-card";
import { FinancialStatement } from "@/components/FinancialStatement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, MapPin, Calendar, Activity } from "lucide-react";
import { Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function PropertyDetail() {
  const [, params] = useRoute("/property/:id");
  const { properties, global } = useStore();
  const property = properties.find(p => p.id === params?.id);

  if (!property) return null;

  // Generate 60 months (5 years) of data
  const financials = generatePropertyProForma(property, global, 60);

  return (
    <Layout>
      <div className="space-y-8 pb-12">
        <div className="flex items-center justify-between">
            <Link href="/portfolio">
            <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-primary">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Portfolio
            </Button>
            </Link>
            <Link href="/settings">
                <Button variant="outline" size="sm" className="glass-input hover:bg-white/50">
                    Edit Assumptions
                </Button>
            </Link>
        </div>

        {/* Hero Section */}
        <div className="relative h-[300px] rounded-3xl overflow-hidden shadow-2xl">
           <img src={property.imageUrl} className="w-full h-full object-cover" />
           <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
           <div className="absolute bottom-0 left-0 p-8 text-white">
              <h1 className="text-4xl font-serif font-bold mb-2">{property.name}</h1>
              <div className="flex items-center gap-4 text-white/80">
                 <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {property.location}</span>
                 <span className="w-1 h-1 bg-white/50 rounded-full" />
                 <span>{property.roomCount} Rooms</span>
                 <span className="w-1 h-1 bg-white/50 rounded-full" />
                 <Badge variant="outline" className="border-white/30 text-white hover:bg-white/10">{property.status}</Badge>
              </div>
           </div>
        </div>

        {/* Financial Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <GlassCard className="p-4 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Year 1 Revenue</p>
                <p className="text-2xl font-serif font-bold text-primary">
                    {formatMoney(financials.slice(0, 12).reduce((acc, m) => acc + m.revenueTotal, 0))}
                </p>
            </GlassCard>
             <GlassCard className="p-4 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Year 1 NOI</p>
                <p className="text-2xl font-serif font-bold text-foreground">
                    {formatMoney(financials.slice(0, 12).reduce((acc, m) => acc + m.noi, 0))}
                </p>
            </GlassCard>
             <GlassCard className="p-4 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Stabilized ADR</p>
                <p className="text-2xl font-serif font-bold text-foreground">
                    {formatMoney(financials[36].adr)}
                </p>
            </GlassCard>
             <GlassCard className="p-4 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Cash on Cash (Y1)</p>
                <p className="text-2xl font-serif font-bold text-accent-foreground">
                    {((financials.slice(0, 12).reduce((acc, m) => acc + m.cashFlow, 0) / (property.purchasePrice * 0.25)) * 100).toFixed(1)}%
                </p>
            </GlassCard>
        </div>

        <Tabs defaultValue="y1" className="w-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-serif font-bold">Pro Forma Financials</h3>
                <TabsList className="bg-white/20 backdrop-blur-md">
                    <TabsTrigger value="y1">Year 1</TabsTrigger>
                    <TabsTrigger value="y2">Year 2</TabsTrigger>
                    <TabsTrigger value="y3">Year 3</TabsTrigger>
                </TabsList>
            </div>
            
            <TabsContent value="y1">
                <FinancialStatement data={financials.slice(0, 12)} title="Year 1 Operations" />
            </TabsContent>
            <TabsContent value="y2">
                <FinancialStatement data={financials.slice(12, 24)} title="Year 2 Operations" />
            </TabsContent>
            <TabsContent value="y3">
                <FinancialStatement data={financials.slice(24, 36)} title="Year 3 Operations" />
            </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
