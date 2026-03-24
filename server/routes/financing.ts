import type { Express, Request, Response } from "express";
import { requireAuth } from "../auth";
import { computeDSCR } from "../../calc/financing/dscr-calculator";
import { computeSensitivity } from "../../calc/financing/sensitivity";
import { computeDebtYield } from "../../calc/financing/debt-yield";
import { computePrepayment } from "../../calc/financing/prepayment";
import { DEFAULT_ROUNDING } from "../../calc/shared/utils";
import { getMarketIntelligenceAggregator } from "../services/MarketIntelligenceAggregator";

export function register(app: Express) {
  const aggregator = getMarketIntelligenceAggregator();

  app.post("/api/financing/dscr", requireAuth, async (req: Request, res: Response) => {
    try {
      const {
        noi_annual,
        interest_rate_annual,
        term_months,
        amortization_months,
        io_months,
        min_dscr,
        purchase_price,
        ltv_max,
        location,
      } = req.body;

      let effectiveRate = interest_rate_annual;
      let riskPremiumApplied: number | null = null;

      if (location && aggregator.getServiceStatus().moodys) {
        try {
          const intel = await aggregator.gather({ location });
          const premiumBps = intel.moodys?.riskPremiumBps?.value;
          if (premiumBps && premiumBps > 0) {
            riskPremiumApplied = premiumBps;
            effectiveRate = interest_rate_annual + premiumBps / 10000;
          }
        } catch {}
      }

      const result = computeDSCR({
        noi_annual,
        interest_rate_annual: effectiveRate,
        term_months,
        amortization_months,
        io_months: io_months || 0,
        min_dscr,
        purchase_price,
        ltv_max,
        rounding_policy: DEFAULT_ROUNDING,
      });

      res.json({
        ...result,
        risk_premium_bps: riskPremiumApplied,
        effective_rate: effectiveRate,
        base_rate: interest_rate_annual,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "DSCR calculation failed" });
    }
  });

  app.post("/api/financing/sensitivity", requireAuth, async (req: Request, res: Response) => {
    try {
      const {
        noi_annual,
        loan_amount,
        interest_rate_annual,
        amortization_months,
        term_months,
        io_months,
        rate_shocks_bps,
        noi_shocks_pct,
        min_dscr,
        location,
      } = req.body;

      let effectiveRate = interest_rate_annual;
      let riskPremiumApplied: number | null = null;

      if (location && aggregator.getServiceStatus().moodys) {
        try {
          const intel = await aggregator.gather({ location });
          const premiumBps = intel.moodys?.riskPremiumBps?.value;
          if (premiumBps && premiumBps > 0) {
            riskPremiumApplied = premiumBps;
            effectiveRate = interest_rate_annual + premiumBps / 10000;
          }
        } catch {}
      }

      const result = computeSensitivity({
        noi_annual,
        loan_amount,
        interest_rate_annual: effectiveRate,
        amortization_months,
        term_months,
        io_months: io_months || 0,
        rate_shocks_bps: rate_shocks_bps || [-200, -100, 0, 100, 200],
        noi_shocks_pct: noi_shocks_pct || [-20, -10, 0, 10, 20],
        min_dscr,
        rounding_policy: DEFAULT_ROUNDING,
      });

      res.json({
        ...result,
        risk_premium_bps: riskPremiumApplied,
        effective_rate: effectiveRate,
        base_rate: interest_rate_annual,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Sensitivity analysis failed" });
    }
  });

  app.post("/api/financing/debt-yield", requireAuth, async (req: Request, res: Response) => {
    try {
      const result = computeDebtYield({
        ...req.body,
        rounding_policy: DEFAULT_ROUNDING,
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Debt yield calculation failed" });
    }
  });

  app.post("/api/financing/prepayment", requireAuth, async (req: Request, res: Response) => {
    try {
      const result = computePrepayment({
        ...req.body,
        rounding_policy: DEFAULT_ROUNDING,
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Prepayment calculation failed" });
    }
  });
}
