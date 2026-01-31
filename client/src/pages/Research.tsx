import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Research() {
  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground uppercase tracking-wider">Market Intelligence</p>
            <h2 className="text-3xl font-display font-bold text-foreground">Research & Assumptions</h2>
          </div>
          <div className="text-sm text-muted-foreground">1Q26 | Confidential</div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>1. ADR Growth Rate Research</CardTitle>
            <p className="text-sm text-muted-foreground">Determine appropriate ADR annual growth rates for boutique hotel properties</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold mb-3">Industry Data (2024-2026)</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead>Metric</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>STR/Tourism Economics</TableCell>
                    <TableCell>U.S. Hotels ADR Growth (2024)</TableCell>
                    <TableCell className="text-right">1.7%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>STR/Tourism Economics</TableCell>
                    <TableCell>U.S. Hotels ADR Forecast (2025)</TableCell>
                    <TableCell className="text-right">1.3% - 1.6%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>CBRE</TableCell>
                    <TableCell>U.S. Hotels ADR Forecast (2025)</TableCell>
                    <TableCell className="text-right">1.6%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>PwC</TableCell>
                    <TableCell>U.S. Hotel ADR Forecast (2025)</TableCell>
                    <TableCell className="text-right">1.3%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>CBRE</TableCell>
                    <TableCell>Luxury Hotels ADR Growth (2025 YTD)</TableCell>
                    <TableCell className="text-right">5.0%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <div className="bg-muted/30 p-4 rounded-lg border-l-4 border-primary">
              <p className="text-sm">"Boutique hotels achieved higher average daily rate than most comparable-class U.S. hotels in 2024. All boutique segments in the report have slowed in rate growth over the past two years, but have also achieved their highest rates during that time."</p>
              <p className="text-xs text-muted-foreground mt-2">— Highland Group, Boutique Hotel Report 2025</p>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Boutique Hotel ADR by Segment (2024)</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Boutique Segment</TableHead>
                    <TableHead className="text-right">ADR</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Upper Midscale Indie Boutiques</TableCell>
                    <TableCell className="text-right">$143</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Upscale Indie Boutiques</TableCell>
                    <TableCell className="text-right">$193</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Upper-Upscale Soft Brands</TableCell>
                    <TableCell className="text-right">$253</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Luxury Lifestyle</TableCell>
                    <TableCell className="text-right">$380</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Luxury Indie Boutiques</TableCell>
                    <TableCell className="text-right">$440</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <div>
              <h4 className="font-semibold mb-3">L+B Selected Rates</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Market</TableHead>
                    <TableHead className="text-right">Selected ADR Growth</TableHead>
                    <TableHead>Rationale</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">U.S. Properties</TableCell>
                    <TableCell className="text-right font-semibold text-[#257D41]">2.5%</TableCell>
                    <TableCell className="text-sm text-muted-foreground">Above industry average (1-2%) reflecting boutique premium positioning</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Medellín, Colombia</TableCell>
                    <TableCell className="text-right font-semibold text-[#257D41]">4.0%</TableCell>
                    <TableCell className="text-sm text-muted-foreground">Emerging market dynamics, lower base, tourism growth trajectory</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Hotel Management Fee Structure Research</CardTitle>
            <p className="text-sm text-muted-foreground">Industry-standard management fee structures</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/30 p-4 rounded-lg border-l-4 border-primary">
              <p className="text-sm">"Hotel management companies are typically paid a base fee equal to 2.0% to 4.0% of total operating revenue—3.0% being the most common—plus an incentive, typically an incentive management fee (IMF)."</p>
              <p className="text-xs text-muted-foreground mt-2">— HVS (Hotel Valuation Services)</p>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Base Management Fee Benchmarks</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Base Fee Range</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>HVS</TableCell>
                    <TableCell className="text-right">2.0% - 4.0% of gross revenue</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>DLA Piper (Global Survey)</TableCell>
                    <TableCell className="text-right">2% - 4% of gross revenue</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Cayuga Hospitality</TableCell>
                    <TableCell className="text-right">3% typical</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>CBRE Trends Survey</TableCell>
                    <TableCell className="text-right">3.6% average (total fees)</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Incentive Management Fee Benchmarks</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Incentive Fee Range</TableHead>
                    <TableHead>Basis</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>HVS</TableCell>
                    <TableCell className="text-right">10% - 20%</TableCell>
                    <TableCell>Cash flows exceeding threshold</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Cayuga Hospitality</TableCell>
                    <TableCell className="text-right">8% - 10%</TableCell>
                    <TableCell>GOP (standard)</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>DLA Piper</TableCell>
                    <TableCell className="text-right">8% - 12%</TableCell>
                    <TableCell>GOP</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>European Contracts</TableCell>
                    <TableCell className="text-right">8% - 10%</TableCell>
                    <TableCell>AGOP (typical)</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <div>
              <h4 className="font-semibold mb-3">L+B Selected Structure</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fee Component</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead>Rationale</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Base Management Fee</TableCell>
                    <TableCell className="text-right font-semibold text-[#257D41]">4.0%</TableCell>
                    <TableCell className="text-sm text-muted-foreground">Higher end reflecting comprehensive full-service delivery</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Incentive Fee</TableCell>
                    <TableCell className="text-right font-semibold text-[#257D41]">10.0% of GOP</TableCell>
                    <TableCell className="text-sm text-muted-foreground">Standard industry rate, aligns interests with property profitability</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. Cash Reserve Requirements Research</CardTitle>
            <p className="text-sm text-muted-foreground">Appropriate minimum cash reserve requirements for hotel operations</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/30 p-4 rounded-lg border-l-4 border-primary">
              <p className="text-sm">"Most advisors recommend keeping three to six months of operating expenses on hand."</p>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Industry Recommendations</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Recommendation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Allianz Trade</TableCell>
                    <TableCell className="text-right">6 months operating expenses</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>SCORE</TableCell>
                    <TableCell className="text-right">3-6 months operating expenses</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>American Express</TableCell>
                    <TableCell className="text-right">3-6 months operating expenses</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Relay Financial</TableCell>
                    <TableCell className="text-right">3-6 months operating expenses</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <div>
              <h4 className="font-semibold mb-3">L+B Selected Requirements</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entity</TableHead>
                    <TableHead className="text-right">Reserve Requirement</TableHead>
                    <TableHead>Rationale</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">L+B Hospitality Co.</TableCell>
                    <TableCell className="text-right font-semibold text-[#257D41]">12 months runway</TableCell>
                    <TableCell className="text-sm text-muted-foreground">Management company with no revenue initially</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Property SPVs</TableCell>
                    <TableCell className="text-right font-semibold text-[#257D41]">3 months operating expenses</TableCell>
                    <TableCell className="text-sm text-muted-foreground">Balanced approach; cash retained quarterly</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4. Boutique Hotel Performance Benchmarks</CardTitle>
            <p className="text-sm text-muted-foreground">Industry occupancy and ADR benchmarks</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Occupancy Benchmarks</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Segment</TableHead>
                      <TableHead className="text-right">Occupancy</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>U.S. National Average</TableCell>
                      <TableCell className="text-right">63% - 66%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Boutique Hotels</TableCell>
                      <TableCell className="text-right">57% - 71%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Lifestyle Hotels (Upscale)</TableCell>
                      <TableCell className="text-right">~70%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Upscale Indie Boutiques</TableCell>
                      <TableCell className="text-right">69%</TableCell>
                    </TableRow>
                    <TableRow className="bg-primary/10">
                      <TableCell className="font-medium">L+B Target</TableCell>
                      <TableCell className="text-right font-semibold text-[#257D41]">90% stabilized</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div>
                <h4 className="font-semibold mb-3">ADR Benchmarks by Segment</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Segment</TableHead>
                      <TableHead className="text-right">ADR (2024)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>U.S. National Average</TableCell>
                      <TableCell className="text-right">~$160</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Upscale Indie Boutiques</TableCell>
                      <TableCell className="text-right">$193</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Upper-Upscale Soft Brands</TableCell>
                      <TableCell className="text-right">$253</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Luxury Indie Boutiques</TableCell>
                      <TableCell className="text-right">$440</TableCell>
                    </TableRow>
                    <TableRow className="bg-primary/10">
                      <TableCell className="font-medium">L+B Portfolio Range</TableCell>
                      <TableCell className="text-right font-semibold text-[#257D41]">$150 - $325</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Occupancy Ramp Assumptions</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Phase</TableHead>
                    <TableHead>Timeline</TableHead>
                    <TableHead className="text-right">Expected Occupancy</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Soft Opening</TableCell>
                    <TableCell>Months 1-3</TableCell>
                    <TableCell className="text-right">40% - 50%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Ramp-Up</TableCell>
                    <TableCell>Months 4-12</TableCell>
                    <TableCell className="text-right">50% - 65%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Stabilization</TableCell>
                    <TableCell>Months 13-36</TableCell>
                    <TableCell className="text-right">65% - 85%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Mature</TableCell>
                    <TableCell>Month 37+</TableCell>
                    <TableCell className="text-right">85% - 95%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>5. Capitalization Rate Research</CardTitle>
            <p className="text-sm text-muted-foreground">Appropriate exit cap rate for portfolio valuation at Year 10</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">U.S. Hotel Cap Rate Benchmarks</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property Type</TableHead>
                      <TableHead className="text-right">Cap Rate Range</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>U.S. Hotels (Average)</TableCell>
                      <TableCell className="text-right">~8%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Full-Service Urban</TableCell>
                      <TableCell className="text-right">7.0% - 8.5%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Limited-Service</TableCell>
                      <TableCell className="text-right">8.0% - 9.5%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Boutique (Premium Markets)</TableCell>
                      <TableCell className="text-right">7.0% - 8.5%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Boutique (Secondary Markets)</TableCell>
                      <TableCell className="text-right">8.0% - 9.5%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div>
                <h4 className="font-semibold mb-3">International Considerations</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Market</TableHead>
                      <TableHead className="text-right">Cap Rate Range</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Western Europe</TableCell>
                      <TableCell className="text-right">6.0% - 8.0%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Latin America</TableCell>
                      <TableCell className="text-right">9.0% - 11.0%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Colombia</TableCell>
                      <TableCell className="text-right">9.5% - 11.5%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="bg-primary/10 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">L+B Selected Exit Cap Rate</h4>
                  <p className="text-sm text-muted-foreground mt-1">Portfolio blend of U.S. and international properties, boutique positioning, secondary/tertiary markets</p>
                </div>
                <div className="text-3xl font-bold text-[#257D41]">8.5%</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>6. Debt Market Conditions</CardTitle>
            <p className="text-sm text-muted-foreground">Current hotel lending terms for acquisition and refinance scenarios</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold mb-3">Current Market Conditions (2024-2025)</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parameter</TableHead>
                    <TableHead className="text-right">Market Range</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Interest Rates</TableCell>
                    <TableCell className="text-right">8% - 10%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Loan-to-Value (Acquisition)</TableCell>
                    <TableCell className="text-right">65% - 75%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Loan-to-Value (Refinance)</TableCell>
                    <TableCell className="text-right">70% - 75%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Amortization</TableCell>
                    <TableCell className="text-right">20 - 25 years</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>DSCR Requirement</TableCell>
                    <TableCell className="text-right">1.25x - 1.35x</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <div>
              <h4 className="font-semibold mb-3">L+B Selected Terms</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parameter</TableHead>
                    <TableHead className="text-right">Acquisition Loans</TableHead>
                    <TableHead className="text-right">Refinance Loans</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">LTV</TableCell>
                    <TableCell className="text-right">75% of purchase</TableCell>
                    <TableCell className="text-right">75% of (purchase + improvements)</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Interest Rate</TableCell>
                    <TableCell className="text-right font-semibold text-[#257D41]">9.0%</TableCell>
                    <TableCell className="text-right font-semibold text-[#257D41]">9.0%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Term</TableCell>
                    <TableCell className="text-right">25 years</TableCell>
                    <TableCell className="text-right">25 years</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Closing Costs</TableCell>
                    <TableCell className="text-right">2%</TableCell>
                    <TableCell className="text-right">3%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sources & References</CardTitle>
            <p className="text-sm text-muted-foreground">Industry research and data sources used in this analysis</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold mb-3">ADR & Market Performance Data</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <div>
                    <a href="https://str.com/press-release/costar-te-maintain-growth-projections-first-us-hotel-forecast-2025" target="_blank" rel="noopener noreferrer" className="text-[#5C6BC0] hover:underline font-medium">STR/CoStar Tourism Economics</a>
                    <span className="text-muted-foreground"> — U.S. Hotel Industry Forecasts 2024-2026</span>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <div>
                    <a href="https://www.cbre.com/insights/reports/2025-global-hotel-outlook" target="_blank" rel="noopener noreferrer" className="text-[#5C6BC0] hover:underline font-medium">CBRE Hotels</a>
                    <span className="text-muted-foreground"> — 2025 Global Hotel Outlook & Hotel Horizons Forecasts</span>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <div>
                    <a href="https://www.pwc.com/us/en/industries/financial-services/asset-wealth-management/real-estate/emerging-trends-in-real-estate-pwc-uli/property-type-outlook/hospitality.html" target="_blank" rel="noopener noreferrer" className="text-[#5C6BC0] hover:underline font-medium">PwC Hospitality Directions</a>
                    <span className="text-muted-foreground"> — U.S. Hotel Industry Outlook & ADR Forecasts</span>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <div>
                    <a href="https://highland-group.net/reports/the-boutique-hotel-report-2025-copy/" target="_blank" rel="noopener noreferrer" className="text-[#5C6BC0] hover:underline font-medium">The Highland Group</a>
                    <span className="text-muted-foreground"> — Boutique Hotel Report 2025 (10th Annual Edition)</span>
                  </div>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Management Fee Structure Research</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <div>
                    <a href="https://www.hvs.com/article/9912-a-new-approach-to-hotel-management-fees" target="_blank" rel="noopener noreferrer" className="text-[#5C6BC0] hover:underline font-medium">HVS (Hotel Valuation Services)</a>
                    <span className="text-muted-foreground"> — A New Approach to Hotel Management Fees</span>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <div>
                    <a href="https://hvs.com/PaidPublications/Samples/Excerpts_HVS%20Guide%20to%20Hotel%20Management%20Contracts%202020.pdf" target="_blank" rel="noopener noreferrer" className="text-[#5C6BC0] hover:underline font-medium">HVS Guide to Hotel Management Contracts</a>
                    <span className="text-muted-foreground"> — Industry standard fee structures and terms</span>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <div>
                    <a href="https://www.dlapiperintelligence.com/hotelmanagement" target="_blank" rel="noopener noreferrer" className="text-[#5C6BC0] hover:underline font-medium">DLA Piper Hotel Management Agreements</a>
                    <span className="text-muted-foreground"> — Global Survey covering 27 jurisdictions</span>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <div>
                    <a href="https://www.hospitalitynet.org/opinion/4128065.html" target="_blank" rel="noopener noreferrer" className="text-[#5C6BC0] hover:underline font-medium">HospitalityNet</a>
                    <span className="text-muted-foreground"> — Owner's Priority: The Most Important Provision in Hotel Management Contracts</span>
                  </div>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Investment & Capitalization Rate Research</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <div>
                    <a href="https://www.cbre.com/insights/reports/2025-us-hotel-investor-intentions-survey" target="_blank" rel="noopener noreferrer" className="text-[#5C6BC0] hover:underline font-medium">CBRE U.S. Hotel Investor Intentions Survey</a>
                    <span className="text-muted-foreground"> — Cap rates, investment trends, and market conditions</span>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <div>
                    <a href="https://pip.cbrehotels.com/hotelhorizons" target="_blank" rel="noopener noreferrer" className="text-[#5C6BC0] hover:underline font-medium">CBRE Hotel Horizons</a>
                    <span className="text-muted-foreground"> — 10-year forecasts for 65 U.S. markets</span>
                  </div>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Industry News & Analysis</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <div>
                    <a href="https://www.hotelmanagement.net" target="_blank" rel="noopener noreferrer" className="text-[#5C6BC0] hover:underline font-medium">Hotel Management</a>
                    <span className="text-muted-foreground"> — Industry news, data trends, and market analysis</span>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <div>
                    <a href="https://www.hoteldive.com" target="_blank" rel="noopener noreferrer" className="text-[#5C6BC0] hover:underline font-medium">Hotel Dive</a>
                    <span className="text-muted-foreground"> — Hotel industry news and trends</span>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <div>
                    <a href="https://www.businesstravelnews.com/Lodging" target="_blank" rel="noopener noreferrer" className="text-[#5C6BC0] hover:underline font-medium">Business Travel News - Lodging</a>
                    <span className="text-muted-foreground"> — Hotel performance forecasts and industry updates</span>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <div>
                    <a href="https://www.hospitalitynet.org" target="_blank" rel="noopener noreferrer" className="text-[#5C6BC0] hover:underline font-medium">Hospitality Net</a>
                    <span className="text-muted-foreground"> — Global hospitality industry news and research</span>
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-muted/30 p-4 rounded-lg border-l-4 border-primary">
              <p className="text-sm"><strong>Note:</strong> Data and benchmarks in this document are based on publicly available industry research and are intended for financial modeling purposes. Actual market conditions may vary. Research data current as of Q1 2026.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
