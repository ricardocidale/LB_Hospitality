import Layout from "@/components/Layout";
import { useProperty, useGlobalAssumptions } from "@/lib/api";
import { generatePropertyProForma, formatMoney } from "@/lib/financialEngine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinancialStatement } from "@/components/FinancialStatement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, MapPin, Loader2 } from "lucide-react";
import { Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function PropertyDetail() {
  const [, params] = useRoute("/property/:id");
  const propertyId = params?.id ? parseInt(params.id) : 0;
  
  const { data: property, isLoading: propertyLoading } = useProperty(propertyId);
  const { data: global, isLoading: globalLoading } = useGlobalAssumptions();

  if (propertyLoading || globalLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!property || !global) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
          <h2 className="text-2xl font-serif font-bold">Property Not Found</h2>
          <Link href="/portfolio">
            <Button>Return to Portfolio</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const financials = generatePropertyProForma(property, global, 60);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/portfolio">
            <Button variant="ghost" className="pl-0">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Portfolio
            </Button>
          </Link>
          <Link href="/settings">
            <Button variant="outline" size="sm">Edit Assumptions</Button>
          </Link>
        </div>

        <div className="relative h-[280px] rounded-xl overflow-hidden">
          <img src={property.imageUrl} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6 text-white">
            <h1 className="text-3xl font-serif font-bold mb-2">{property.name}</h1>
            <div className="flex items-center gap-4 text-white/80 text-sm">
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {property.location}</span>
              <span>{property.roomCount} Rooms</span>
              <Badge variant="outline" className="border-white/40 text-white">{property.status}</Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Year 1 Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">
                {formatMoney(financials.slice(0, 12).reduce((acc, m) => acc + m.revenueTotal, 0))}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Year 1 NOI</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatMoney(financials.slice(0, 12).reduce((acc, m) => acc + m.noi, 0))}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Stabilized ADR</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatMoney(financials[35]?.adr || property.startAdr)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Cash on Cash (Y1)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-accent">
                {((financials.slice(0, 12).reduce((acc, m) => acc + m.cashFlow, 0) / (property.purchasePrice * 0.25)) * 100).toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="y1" className="w-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-serif font-bold">Pro Forma Financials</h3>
            <TabsList>
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
