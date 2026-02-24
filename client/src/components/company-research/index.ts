/**
 * company-research/index.ts
 *
 * Barrel export for the company-level AI market research feature.
 * This is the management-company counterpart of property-research — it
 * streams structured research from an LLM covering hospitality management
 * fee benchmarks, GAAP standards, industry operating expense ratios (USALI),
 * compensation benchmarks, and typical contract terms.
 *
 *   • useCompanyResearchStream – hook managing the SSE stream for company research
 *   • CompanyResearchSections  – renders parsed JSON into categorized section cards
 *   • companySectionColors     – color palette keyed by company research category
 */
export { CompanyResearchSections } from "./CompanyResearchSections";
export { useCompanyResearchStream } from "./useCompanyResearchStream";
export { companySectionColors } from "./types";
export type { SectionColorScheme } from "./types";
