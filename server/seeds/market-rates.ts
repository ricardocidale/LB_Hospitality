/**
 * market-rates seed — Defines which rates to track (not the values).
 *
 * On first boot, this creates rows in the market_rates table for each rate.
 * Actual values are fetched on the first periodic refresh cycle.
 */

import { db } from "../db";
import { marketRates } from "@shared/schema";
import { eq } from "drizzle-orm";

interface RateDefinition {
  rateKey: string;
  source: string;
  seriesId: string | null;
  sourceUrl: string;
  maxStalenessHours: number;
  displayValue: string;
}

const RATE_DEFINITIONS: RateDefinition[] = [
  // --- FRED (Federal Reserve Economic Data) ---
  {
    rateKey: "fed_funds",
    source: "fred",
    seriesId: "FEDFUNDS",
    sourceUrl: "https://fred.stlouisfed.org/series/FEDFUNDS",
    maxStalenessHours: 24,
    displayValue: "Fed Funds Rate",
  },
  {
    rateKey: "sofr",
    source: "fred",
    seriesId: "SOFR",
    sourceUrl: "https://fred.stlouisfed.org/series/SOFR",
    maxStalenessHours: 24,
    displayValue: "SOFR",
  },
  {
    rateKey: "treasury_10y",
    source: "fred",
    seriesId: "DGS10",
    sourceUrl: "https://fred.stlouisfed.org/series/DGS10",
    maxStalenessHours: 24,
    displayValue: "10-Year Treasury",
  },
  {
    rateKey: "mortgage_30y",
    source: "fred",
    seriesId: "MORTGAGE30US",
    sourceUrl: "https://fred.stlouisfed.org/series/MORTGAGE30US",
    maxStalenessHours: 168,
    displayValue: "30-Year Mortgage",
  },
  {
    rateKey: "cpi_yoy",
    source: "fred",
    seriesId: "CPIAUCSL",
    sourceUrl: "https://fred.stlouisfed.org/series/CPIAUCSL",
    maxStalenessHours: 168,
    displayValue: "CPI (YoY)",
  },
  {
    rateKey: "cpi_food_bev",
    source: "fred",
    seriesId: "CPIFABSL",
    sourceUrl: "https://fred.stlouisfed.org/series/CPIFABSL",
    maxStalenessHours: 168,
    displayValue: "CPI Food & Beverages",
  },
  {
    rateKey: "ppi_construction",
    source: "fred",
    seriesId: "WPUSI012011",
    sourceUrl: "https://fred.stlouisfed.org/series/WPUSI012011",
    maxStalenessHours: 168,
    displayValue: "PPI Construction Materials",
  },

  // --- Frankfurter (Currency Exchange) ---
  {
    rateKey: "usd_cop",
    source: "frankfurter",
    seriesId: "COP",
    sourceUrl: "https://frankfurter.dev",
    maxStalenessHours: 24,
    displayValue: "USD/COP",
  },
  {
    rateKey: "usd_mxn",
    source: "frankfurter",
    seriesId: "MXN",
    sourceUrl: "https://frankfurter.dev",
    maxStalenessHours: 24,
    displayValue: "USD/MXN",
  },
  {
    rateKey: "usd_crc",
    source: "frankfurter",
    seriesId: "CRC",
    sourceUrl: "https://frankfurter.dev",
    maxStalenessHours: 24,
    displayValue: "USD/CRC",
  },

  // --- Admin-Maintained (no auto-fetch) ---
  {
    rateKey: "hotel_lending_spread",
    source: "admin_manual",
    seriesId: null,
    sourceUrl: "",
    maxStalenessHours: 2160, // 90 days
    displayValue: "Hotel Lending Spread (bps)",
  },
  {
    rateKey: "hotel_cap_rate_range",
    source: "admin_manual",
    seriesId: null,
    sourceUrl: "",
    maxStalenessHours: 2160, // 90 days
    displayValue: "Hotel Cap Rate Range",
  },
];

export async function seedMarketRates(): Promise<void> {
  for (const def of RATE_DEFINITIONS) {
    const existing = await db.select()
      .from(marketRates)
      .where(eq(marketRates.rateKey, def.rateKey))
      .limit(1);

    if (existing.length > 0) continue;

    await db.insert(marketRates).values({
      rateKey: def.rateKey,
      value: def.source === "admin_manual" && def.rateKey === "hotel_lending_spread" ? 275 : null,
      displayValue: def.source === "admin_manual" && def.rateKey === "hotel_lending_spread" ? "275 bps" : def.displayValue,
      source: def.source,
      sourceUrl: def.sourceUrl,
      seriesId: def.seriesId,
      isManual: def.source === "admin_manual",
      maxStalenessHours: def.maxStalenessHours,
    });
  }

  console.log(`Seeded ${RATE_DEFINITIONS.length} market rate definitions`);
}
