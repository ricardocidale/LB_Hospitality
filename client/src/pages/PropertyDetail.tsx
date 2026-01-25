import Layout from "@/components/Layout";
import { useProperty, useGlobalAssumptions } from "@/lib/api";
import { generatePropertyProForma, formatMoney } from "@/lib/financialEngine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { YearlyIncomeStatement } from "@/components/YearlyIncomeStatement";
import { YearlyCashFlowStatement } from "@/components/YearlyCashFlowStatement";
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

  const financials = generatePropertyProForma(property, global, 120);
  const year1Revenue = financials.slice(0, 12).reduce((acc, m) => acc + m.revenueTotal, 0);
  const year1NOI = financials.slice(0, 12).reduce((acc, m) => acc + m.noi, 0);
  const year1CashFlow = financials.slice(0, 12).reduce((acc, m) => acc + m.cashFlow, 0);
  const totalInvestment = property.purchasePrice + property.buildingImprovements + property.preOpeningCosts + property.operatingReserve;
  const equityInvested = property.type === "Financed" ? totalInvestment * 0.25 : totalInvestment;

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
          <img src={property.imageUrl} alt={property.name} className="w-full h-full object-cover" />
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
              <p className="text-2xl font-bold text-primary">{formatMoney(year1Revenue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Year 1 NOI</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatMoney(year1NOI)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Year 1 Cash Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${year1CashFlow < 0 ? 'text-destructive' : 'text-accent'}`}>
                {formatMoney(year1CashFlow)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Cash on Cash (Y1)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-accent">
                {equityInvested > 0 ? `${((year1CashFlow / equityInvested) * 100).toFixed(1)}%` : 'N/A'}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="income" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="income">Income Statement</TabsTrigger>
            <TabsTrigger value="cashflow">Cash Flows</TabsTrigger>
          </TabsList>
          
          <TabsContent value="income" className="mt-6">
            <YearlyIncomeStatement data={financials} years={10} />
          </TabsContent>
          
          <TabsContent value="cashflow" className="mt-6">
            <YearlyCashFlowStatement data={financials} property={property} years={10} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
