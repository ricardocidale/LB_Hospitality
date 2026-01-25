import Layout from "@/components/Layout";
import { useStore, formatCurrency, calculateAnnualRevenue, calculateGOP, Property } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, DollarSign, Bed, Percent, MapPin, Hotel } from "lucide-react";
import { Link, useRoute } from "wouter";
import { Separator } from "@/components/ui/separator";

export default function PropertyDetail() {
  const [, params] = useRoute("/property/:id");
  const { properties } = useStore();
  const property = properties.find(p => p.id === params?.id);

  if (!property) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
          <h2 className="text-2xl font-serif text-primary">Property Not Found</h2>
          <Link href="/portfolio">
            <Button>Return to Portfolio</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const annualRevenue = calculateAnnualRevenue(property);
  const annualGOP = calculateGOP(annualRevenue);

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Link href="/portfolio">
          <Button variant="ghost" className="mb-4 pl-0 hover:bg-transparent hover:text-primary">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Portfolio
          </Button>
        </Link>

        {/* Hero Header */}
        <div className="relative h-[300px] md:h-[400px] w-full rounded-xl overflow-hidden shadow-lg group">
          <img 
            src={property.imageUrl} 
            alt={property.name} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6 md:p-10 text-white w-full">
            <div className="flex items-center gap-2 mb-2 text-white/80 uppercase tracking-widest text-xs font-medium">
              <MapPin className="w-3 h-3" /> {property.location} • {property.market}
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">{property.name}</h1>
            <div className="flex flex-wrap gap-3">
              <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-md">
                {property.status}
              </Badge>
              <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-md">
                {property.type}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="font-serif text-2xl">Property Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-muted-foreground leading-relaxed text-lg">
                  {property.description}
                </p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Rooms</p>
                    <div className="flex items-center gap-2 text-xl font-medium">
                      <Bed className="w-5 h-5 text-primary/70" />
                      {property.roomCount}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Acquisition</p>
                    <div className="flex items-center gap-2 text-xl font-medium">
                      <Calendar className="w-5 h-5 text-primary/70" />
                      {new Date(property.acquisitionDate).getFullYear()}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">ADR (Est)</p>
                    <div className="flex items-center gap-2 text-xl font-medium">
                      <DollarSign className="w-5 h-5 text-primary/70" />
                      {property.adr}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Target Occ.</p>
                    <div className="flex items-center gap-2 text-xl font-medium">
                      <Percent className="w-5 h-5 text-primary/70" />
                      {(property.occupancyRate * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="font-serif text-2xl">Financial Projections</CardTitle>
                <CardDescription>Stabilized Annual Performance Estimates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
                    <span className="font-medium">Gross Room Revenue</span>
                    <span>{formatCurrency(property.roomCount * property.adr * property.occupancyRate * 365)}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
                    <span className="font-medium">Total Revenue (incl. F&B/Events)</span>
                    <span className="font-bold text-lg">{formatCurrency(annualRevenue)}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/10">
                    <span className="font-bold text-primary">Gross Operating Profit (GOP)</span>
                    <span className="font-bold text-xl text-primary">{formatCurrency(annualGOP)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <Card className="border-0 shadow-sm bg-sidebar text-sidebar-foreground">
              <CardHeader>
                <CardTitle className="text-sidebar-foreground font-serif">Investment Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-sm text-sidebar-foreground/60 mb-1">Purchase Price</p>
                  <p className="text-2xl font-bold font-serif">{formatCurrency(property.purchasePrice)}</p>
                </div>
                
                <Separator className="bg-sidebar-border" />
                
                <div>
                  <p className="text-sm text-sidebar-foreground/60 mb-1">Financing Structure</p>
                  <p className="font-medium">{property.type}</p>
                  <p className="text-xs text-sidebar-foreground/50 mt-1">
                    {property.type === "Full Equity" 
                      ? "100% Equity funded at acquisition with refinance at Month 36."
                      : "25% Down Payment / 75% Acquisition Loan."}
                  </p>
                </div>

                <Separator className="bg-sidebar-border" />

                <div>
                  <p className="text-sm text-sidebar-foreground/60 mb-1">Operations Start</p>
                  <p className="font-medium">{new Date(property.operationsStartDate).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
