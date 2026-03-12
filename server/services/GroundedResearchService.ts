import { BaseIntegrationService } from "./BaseIntegrationService";
import type { GroundedSearchResult, CitedSource } from "../../shared/market-intelligence";

interface SearchQuery {
  query: string;
  focusSites?: string[];
}

export class GroundedResearchService extends BaseIntegrationService {
  private apiKey: string | undefined;
  private provider: "perplexity" | "tavily";

  constructor() {
    super("GroundedResearch", 30_000);
    if (process.env.PERPLEXITY_API_KEY) {
      this.apiKey = process.env.PERPLEXITY_API_KEY;
      this.provider = "perplexity";
    } else if (process.env.TAVILY_API_KEY) {
      this.apiKey = process.env.TAVILY_API_KEY;
      this.provider = "tavily";
    } else {
      this.provider = "perplexity";
    }
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async search(queries: SearchQuery[]): Promise<GroundedSearchResult[]> {
    if (!this.apiKey) return [];

    const results = await Promise.allSettled(
      queries.map((q) => this.executeSearch(q))
    );

    return results
      .filter((r): r is PromiseFulfilledResult<GroundedSearchResult | null> => r.status === "fulfilled")
      .map((r) => r.value)
      .filter((r): r is GroundedSearchResult => r !== null);
  }

  buildHospitalityQueries(location: string, propertyType: string): SearchQuery[] {
    const year = new Date().getFullYear();
    return [
      {
        query: `current ${year} hotel RevPAR ADR occupancy ${location} ${propertyType} segment`,
        focusSites: ["str.com", "costar.com", "hotelnewsnow.com", "hospitalitynet.org"],
      },
      {
        query: `${year} hotel market cap rate transaction ${location} hospitality investment`,
        focusSites: ["costar.com", "hvs.com", "cbre.com", "jll.com"],
      },
      {
        query: `${year} new hotel supply pipeline construction ${location}`,
        focusSites: ["hotelnewsnow.com", "costar.com", "lodgingmagazine.com"],
      },
    ];
  }

  private async executeSearch(query: SearchQuery): Promise<GroundedSearchResult | null> {
    try {
      if (this.provider === "perplexity") {
        return this.searchPerplexity(query);
      }
      return this.searchTavily(query);
    } catch (error) {
      this.warn(`Search failed: ${query.query.slice(0, 60)}...`, error);
      return null;
    }
  }

  private async searchPerplexity(query: SearchQuery): Promise<GroundedSearchResult | null> {
    const siteFilter = query.focusSites?.length
      ? ` site:${query.focusSites.join(" OR site:")}`
      : "";

    const response = await this.fetchWithTimeout("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "system",
            content: "You are a hospitality market research analyst. Provide specific, data-backed answers with current statistics. Always cite your sources.",
          },
          {
            role: "user",
            content: query.query + siteFilter,
          },
        ],
        return_citations: true,
        search_recency_filter: "year",
      }),
    });

    const data = await response.json();
    const message = data.choices?.[0]?.message;

    const sources: CitedSource[] = (data.citations ?? []).map((c: any) => ({
      title: c.title || c.url || "Source",
      url: c.url || "",
      snippet: c.snippet || "",
      publishedDate: c.published_date || undefined,
    }));

    return {
      query: query.query,
      answer: message?.content || "",
      sources,
      fetchedAt: new Date().toISOString(),
    };
  }

  private async searchTavily(query: SearchQuery): Promise<GroundedSearchResult | null> {
    const response = await this.fetchWithTimeout("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: this.apiKey,
        query: query.query,
        include_domains: query.focusSites,
        search_depth: "advanced",
        include_answer: true,
      }),
    });

    const data = await response.json();

    const sources: CitedSource[] = (data.results ?? []).map((r: any) => ({
      title: r.title || "Source",
      url: r.url || "",
      snippet: r.content || "",
      publishedDate: r.published_date || undefined,
    }));

    return {
      query: query.query,
      answer: data.answer || "",
      sources,
      fetchedAt: new Date().toISOString(),
    };
  }
}
