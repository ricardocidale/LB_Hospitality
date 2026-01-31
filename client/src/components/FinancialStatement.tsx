import { MonthlyFinancials, formatMoney } from "@/lib/financialEngine";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GlassCard } from "./ui/glass-card";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface FinancialStatementProps {
  data: MonthlyFinancials[];
  title: string;
  startYear?: number;
}

export function FinancialStatement({ data, title, startYear = 2026 }: FinancialStatementProps) {
  const first12Months = data.slice(0, 12);
  
  return (
    <GlassCard className="w-full overflow-hidden">
      <div className="p-6 border-b border-white/20">
        <h3 className="text-xl font-display font-semibold text-primary">{title} - {startYear} Pro Forma</h3>
      </div>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="p-0">
          <Table>
            <TableHeader className="bg-primary/5">
              <TableRow className="border-white/20 hover:bg-transparent">
                <TableHead className="w-[200px] font-bold text-primary sticky left-0 bg-white/80 backdrop-blur-md z-10 border-r border-white/20">Line Item</TableHead>
                {first12Months.map((m) => (
                  <TableHead key={m.monthIndex} className="text-right min-w-[120px]">
                    {format(m.date, "MMM yyyy")}
                  </TableHead>
                ))}
                <TableHead className="text-right font-bold bg-primary/10">{startYear} Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* OPERATIONAL METRICS */}
              <TableRow className="bg-muted/30 border-white/20 font-medium">
                <TableCell className="sticky left-0 bg-muted/80 backdrop-blur-md z-10 border-r border-white/20">Occupancy %</TableCell>
                {first12Months.map((m, i) => (
                  <TableCell key={i} className="text-right text-muted-foreground font-mono">{(m.occupancy * 100).toFixed(0)}%</TableCell>
                ))}
                 <TableCell className="text-right font-bold">-</TableCell>
              </TableRow>
              
              {/* REVENUE SECTION */}
              <TableRow className="hover:bg-primary/5 border-white/20">
                <TableCell className="font-medium sticky left-0 bg-white/80 dark:bg-black/50 backdrop-blur-md z-10 border-r border-white/20">Room Revenue</TableCell>
                {first12Months.map((m, i) => (
                  <TableCell key={i} className="text-right font-mono">{formatMoney(m.revenueRooms)}</TableCell>
                ))}
                <TableCell className="text-right font-bold bg-primary/5 font-mono">{formatMoney(first12Months.reduce((a, b) => a + b.revenueRooms, 0))}</TableCell>
              </TableRow>
              <TableRow className="hover:bg-primary/5 border-white/20">
                <TableCell className="font-medium sticky left-0 bg-white/80 dark:bg-black/50 backdrop-blur-md z-10 border-r border-white/20">F&B Revenue</TableCell>
                {first12Months.map((m, i) => (
                  <TableCell key={i} className="text-right font-mono">{formatMoney(m.revenueFB)}</TableCell>
                ))}
                <TableCell className="text-right font-bold bg-primary/5 font-mono">{formatMoney(first12Months.reduce((a, b) => a + b.revenueFB, 0))}</TableCell>
              </TableRow>
              <TableRow className="hover:bg-primary/5 border-white/20">
                <TableCell className="font-medium sticky left-0 bg-white/80 dark:bg-black/50 backdrop-blur-md z-10 border-r border-white/20">Event Revenue</TableCell>
                {first12Months.map((m, i) => (
                  <TableCell key={i} className="text-right font-mono">{formatMoney(m.revenueEvents)}</TableCell>
                ))}
                <TableCell className="text-right font-bold bg-primary/5 font-mono">{formatMoney(first12Months.reduce((a, b) => a + b.revenueEvents, 0))}</TableCell>
              </TableRow>
              <TableRow className="bg-primary/5 border-white/20 font-bold text-primary">
                <TableCell className="sticky left-0 bg-primary/10 backdrop-blur-md z-10 border-r border-white/20">Total Revenue</TableCell>
                {first12Months.map((m, i) => (
                  <TableCell key={i} className="text-right font-mono">{formatMoney(m.revenueTotal)}</TableCell>
                ))}
                <TableCell className="text-right bg-primary/20 font-mono">{formatMoney(first12Months.reduce((a, b) => a + b.revenueTotal, 0))}</TableCell>
              </TableRow>

              {/* SPACE */}
              <TableRow className="h-4 border-none hover:bg-transparent"><TableCell colSpan={14}></TableCell></TableRow>

              {/* GOP */}
              <TableRow className="bg-accent/10 border-white/20 font-bold">
                <TableCell className="sticky left-0 bg-accent/20 backdrop-blur-md z-10 border-r border-white/20">Gross Operating Profit</TableCell>
                {first12Months.map((m, i) => (
                  <TableCell key={i} className="text-right font-mono">{formatMoney(m.gop)}</TableCell>
                ))}
                <TableCell className="text-right bg-accent/30 font-mono">{formatMoney(first12Months.reduce((a, b) => a + b.gop, 0))}</TableCell>
              </TableRow>

              {/* NET INCOME */}
              <TableRow className="bg-primary/10 border-white/20 font-bold text-lg">
                <TableCell className="sticky left-0 bg-primary/20 backdrop-blur-md z-10 border-r border-white/20">Net Operating Income</TableCell>
                {first12Months.map((m, i) => (
                  <TableCell key={i} className="text-right font-mono">{formatMoney(m.noi)}</TableCell>
                ))}
                <TableCell className="text-right bg-primary/30 font-mono">{formatMoney(first12Months.reduce((a, b) => a + b.noi, 0))}</TableCell>
              </TableRow>
              
               {/* CASH FLOW */}
              <TableRow className="bg-green-500/10 border-white/20 font-bold text-lg">
                <TableCell className="sticky left-0 bg-green-500/20 backdrop-blur-md z-10 border-r border-white/20">Cash Flow</TableCell>
                {first12Months.map((m, i) => (
                  <TableCell key={i} className={cn("text-right font-mono", m.cashFlow < 0 ? "text-destructive" : "text-green-700 dark:text-green-400")}>
                    {formatMoney(m.cashFlow)}
                  </TableCell>
                ))}
                <TableCell className="text-right bg-green-500/30 font-mono">{formatMoney(first12Months.reduce((a, b) => a + b.cashFlow, 0))}</TableCell>
              </TableRow>

            </TableBody>
          </Table>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </GlassCard>
  );
}
