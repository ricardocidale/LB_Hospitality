import Layout from "@/components/Layout";
import { useStore, formatCurrency } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Briefcase, TrendingUp } from "lucide-react";

export default function Company() {
  const { companyStats } = useStore();

  const tranches = [
    { name: "Tranche 1", amount: 225000, date: "April 1, 2026", status: "Active", purpose: "Initial operations, partner salaries" },
    { name: "Tranche 2", amount: 225000, date: "April 1, 2027", status: "Scheduled", purpose: "Continued operations, staff expansion" },
  ];

  return (
    <Layout>
      <div className="space-y-8 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-serif text-primary mb-2">L+B Hospitality Co.</h2>
            <p className="text-muted-foreground">Corporate Management Entity & Operations</p>
          </div>
          <Badge variant="outline" className="text-base px-4 py-1 border-primary/20 bg-primary/5 text-primary">
            Operating Year 1
          </Badge>
        </div>

        {/* Staffing Structure */}
        <section className="grid gap-6 md:grid-cols-3">
          <Card className="bg-card shadow-sm hover:border-primary/50 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Leadership</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="text-3xl font-serif font-bold text-foreground">{companyStats.partners}</div>
                <div className="text-sm text-muted-foreground">Partners</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card shadow-sm hover:border-primary/50 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Support Staff</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Briefcase className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="text-3xl font-serif font-bold text-foreground">{companyStats.staffFTE}</div>
                <div className="text-sm text-muted-foreground">Full-Time Equivalents</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card shadow-sm hover:border-primary/50 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Cash on Hand</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="text-3xl font-serif font-bold text-foreground">{formatCurrency(companyStats.cashOnHand)}</div>
                <div className="text-sm text-muted-foreground">SAFE Funding Available</div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Funding Tranches */}
        <section className="space-y-4">
          <h3 className="text-xl font-serif font-semibold text-primary">Capital Structure & SAFE Funding</h3>
          <Card className="shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[150px]">Tranche</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Release Date</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tranches.map((t) => (
                  <TableRow key={t.name} className="group hover:bg-muted/50">
                    <TableCell className="font-medium font-serif text-primary group-hover:text-accent transition-colors">{t.name}</TableCell>
                    <TableCell>{formatCurrency(t.amount)}</TableCell>
                    <TableCell>{t.date}</TableCell>
                    <TableCell className="text-muted-foreground">{t.purpose}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={t.status === "Active" ? "default" : "secondary"} className="font-normal">
                        {t.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </section>

        {/* Cost Structure */}
        <section className="space-y-4">
          <h3 className="text-xl font-serif font-semibold text-primary">Annual Fixed Cost Structure</h3>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Fixed Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-muted-foreground">Partner Compensation (3x)</span>
                    <span className="font-mono font-medium">{formatCurrency(450000)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-muted-foreground">Office Lease & Overhead</span>
                    <span className="font-mono font-medium">{formatCurrency(36000)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-muted-foreground">Professional Services</span>
                    <span className="font-mono font-medium">{formatCurrency(24000)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-muted-foreground">Tech Infrastructure</span>
                    <span className="font-mono font-medium">{formatCurrency(18000)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="font-semibold text-primary">Total Fixed Costs</span>
                    <span className="font-mono font-bold text-lg">{formatCurrency(540000)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm bg-muted/30">
              <CardHeader>
                <CardTitle className="text-lg">Revenue Model</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-foreground">Base Management Fee</span>
                      <span className="font-bold">4.0%</span>
                    </div>
                    <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-[4%]"></div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Applied to Gross Revenue</p>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-foreground">Incentive Fee</span>
                      <span className="font-bold">10.0%</span>
                    </div>
                    <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                      <div className="h-full bg-accent w-[10%]"></div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Applied to Gross Operating Profit (GOP)</p>
                  </div>

                  <div className="p-4 bg-background rounded-lg border border-border mt-4">
                    <p className="text-sm italic text-muted-foreground">
                      "This structure aligns L+B's interests with property owners—L+B earns more when properties are more profitable."
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </Layout>
  );
}
