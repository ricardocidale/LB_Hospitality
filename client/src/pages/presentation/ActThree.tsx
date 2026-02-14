import {
  Slide,
  SlideTitle,
  SlideSubtitle,
  BodyText,
  StatCallout,
  Card,
  Grid,
  SplitLayout,
  Spacer,
  SlideImage,
  COLORS,
} from "./SlideLayout";

// ═══════════════════════════════════════════════════════════
// SLIDE 13 — MARKET PRECEDENTS
// ═══════════════════════════════════════════════════════════
export function Slide13() {
  const comps = [
    { brand: "Axel Hotels", community: "LGBTQ+", track: '10+ properties across Europe & Americas; category-defining "heterofriendly" positioning' },
    { brand: "Mama's Shelter", community: "Creative Class", track: "Global expansion; acquired by Accor/Ennismore for cult-status community following" },
    { brand: "Hedonism II", community: "Lifestyle", track: "Operating since 1976 — nearly 50 years of profitability. 22 acres, 280 rooms, Negril, Jamaica" },
    { brand: "Desire Resorts", community: "Couples (lifestyle)", track: "Two resorts in Riviera Maya + cruises. TripAdvisor Travelers' Choice. Among highest-rated lifestyle destinations globally" },
    { brand: "Habitas", community: "Wellness / Festival", track: "$70M+ in VC + $400M Saudi expansion fund. 10+ properties across 4 continents. Acquired by Ennismore (Accor) in 2024" },
  ];

  return (
    <Slide
      bg="dark"
      number={13}
      footnotes="Sources: axelhotels.com | group.accor.com (Mama's Shelter) | en.wikipedia.org/wiki/Hedonism_Resorts | tripadvisor.com (Desire Pearl) | pitchbook.com (Habitas) | blisscruise.com"
    >
      <SlideTitle size="small">
        When Communities Are Underserved, Brands Get Built
      </SlideTitle>

      <Spacer size="lg" />

      <div style={{ flex: 1, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "clamp(9px, 1vw, 13px)", fontFamily: "Arial, sans-serif" }}>
          <thead>
            <tr>
              {["Brand", "Community", "Track Record"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.2)", fontWeight: 700, color: COLORS.white }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comps.map((row) => (
              <tr key={row.brand}>
                <td style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)", fontWeight: 700, verticalAlign: "top" }}>
                  {row.brand}
                </td>
                <td style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)", color: COLORS.richGreen, verticalAlign: "top" }}>
                  {row.community}
                </td>
                <td style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)", opacity: 0.8, verticalAlign: "top", lineHeight: 1.5 }}>
                  {row.track}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Spacer size="lg" />

      <div style={{ textAlign: "center" }}>
        <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: "clamp(16px, 2vw, 24px)", margin: "0 0 12px" }}>
          6,000 passengers on a single Bliss Cruise charter — Wonder of the Seas, November 2026
        </p>
        <BodyText size="normal">
          When a community is underserved, purpose-built destinations create fierce loyalty — and outsized returns.
        </BodyText>
      </div>
    </Slide>
  );
}

// ═══════════════════════════════════════════════════════════
// SLIDE 14 — THE VISION
// ═══════════════════════════════════════════════════════════
export function Slide14() {
  return (
    <Slide bg="dark" number={14}>
      <SlideTitle size="small">Brand-First, Asset-Backed Hospitality</SlideTitle>

      <Spacer size="lg" />

      <BodyText size="large" style={{ maxWidth: "90%" }}>
        Acquire unique private estates in strategic, accessible markets. Transform each into an intimate boutique destination for Lola and Ber's signature programming — where safety, depth, and play meet across the vast middle of CNM.
      </BodyText>

      <Spacer size="xl" />

      <Grid cols={2} gap="clamp(24px, 3vw, 48px)">
        <div>
          <h4 style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: "clamp(11px, 1.1vw, 14px)", margin: "0 0 10px" }}>
            01 Scalable Operating Revenue
          </h4>
          <BodyText size="small" opacity={0.8}>
            Year-round retreats, alumni weekends, weddings, corporate off-sites, and partner residencies generate recurring cash flow.
          </BodyText>
        </div>
        <div>
          <h4 style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: "clamp(11px, 1.1vw, 14px)", margin: "0 0 10px" }}>
            02 Long-Term Asset Value
          </h4>
          <BodyText size="small" opacity={0.8}>
            Appreciation of underlying real estate in high-demand leisure markets. Brand premium drives above-market valuations.
          </BodyText>
        </div>
      </Grid>

      <div style={{ flex: 1 }} />

      <BodyText size="small" opacity={0.6} style={{ textAlign: "center" }}>
        Target: 30-50 guest capacity &middot; distinctive architectural character &middot; diverse revenue potential &middot; accessible from major metros
      </BodyText>
    </Slide>
  );
}

// ═══════════════════════════════════════════════════════════
// SLIDE 15 — ACQUISITION CRITERIA
// ═══════════════════════════════════════════════════════════
export function Slide15() {
  const criteria = [
    { num: "01", title: "Authentic Brand Fit", body: 'Distinct character aligned with a curated, high-touch experience. Not cookie-cutter. Every property should feel like it was always meant to be an L&B destination.' },
    { num: "02", title: "Optimal Capacity", body: "30-50 guest sweet spot. Supports intimate retreats (14 guests) and larger activations (50 guests). 10-20 keys: suites, A-frames, glamping pods, cottages." },
    { num: "03", title: "Diverse Revenue Streams", body: "Layout flexes for signature retreats, weddings, corporate off-sites, alumni weekends, and partner residencies. Multiple use cases, year-round demand." },
    { num: "04", title: "Market Accessibility", body: "Within 2-3 hours' drive of a major metro area or near a commercial airport. Weekend drive-to and fly-to markets both." },
    { num: "05", title: "Destination Value", body: "Region with a strong sense of place. Guests feel they've arrived somewhere. Supports premium pricing and repeat visits." },
  ];

  return (
    <Slide bg="cream" number={15}>
      <SlideTitle size="small" color={COLORS.black}>
        How We Select Properties
      </SlideTitle>

      <Spacer size="lg" />

      <div style={{ display: "flex", flexDirection: "column", gap: "clamp(12px, 1.5vh, 20px)", flex: 1 }}>
        {criteria.map((c) => (
          <div key={c.num} style={{ display: "flex", gap: "clamp(12px, 1.5vw, 20px)", alignItems: "flex-start" }}>
            <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: "clamp(18px, 2vw, 24px)", color: COLORS.richGreen, flexShrink: 0, width: "36px" }}>
              {c.num}
            </span>
            <div>
              <h4 style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: "clamp(11px, 1.1vw, 14px)", margin: "0 0 4px", color: COLORS.black }}>
                {c.title}
              </h4>
              <BodyText size="small" color={COLORS.black}>
                {c.body}
              </BodyText>
            </div>
          </div>
        ))}
      </div>
    </Slide>
  );
}

// ═══════════════════════════════════════════════════════════
// SLIDE 16 — PROPERTY SPOTLIGHT: BELLEAYRE MOUNTAIN
// ═══════════════════════════════════════════════════════════
export function Slide16() {
  return (
    <Slide bg="dark" number={16}>
      <SlideTitle size="small">
        Belleayre Mountain — A 1926 Stone Chateau
      </SlideTitle>
      <Spacer size="xs" />
      <SlideSubtitle color="rgba(255,255,255,0.8)">
        Once the private estate of opera icon Amelita Galli-Curci
      </SlideSubtitle>

      <Spacer size="lg" />

      <SplitLayout
        left={
          <div style={{ display: "flex", flexDirection: "column", gap: "clamp(8px, 1vh, 14px)" }}>
            {/* Property details */}
            {[
              ["Location", "Western Catskills, NY (2 hrs from NYC)"],
              ["Built", "1926, stone & timber construction"],
              ["Land", "61\u00B1 acres"],
              ["Structure", "8,200+ sq ft"],
              ["Asking Price", "$2.3M"],
            ].map(([label, value]) => (
              <div key={label} style={{ display: "flex", gap: "8px" }}>
                <span style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: "clamp(10px, 1vw, 12px)", minWidth: "90px" }}>
                  {label}:
                </span>
                <span style={{ fontFamily: "Arial, sans-serif", fontSize: "clamp(10px, 1vw, 12px)", opacity: 0.85 }}>
                  {value}
                </span>
              </div>
            ))}

            <Spacer size="md" />

            {/* Transformation table */}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "clamp(9px, 0.9vw, 11px)", fontFamily: "Arial, sans-serif" }}>
              <thead>
                <tr>
                  {["", "Current", "Proposed"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "6px 8px", borderBottom: "1px solid rgba(255,255,255,0.2)", fontWeight: 700 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Capacity", "8-12 guests", "30-50 guests (20 keys)"],
                  ["Accommodations", "Main house bedrooms", "Suites + A-frames + glamping pods"],
                  ["Amenities", "Pool, great room", "Spa, hot tubs, commercial kitchen, group dining hall"],
                ].map(([label, curr, proposed]) => (
                  <tr key={label}>
                    <td style={{ padding: "6px 8px", borderBottom: "1px solid rgba(255,255,255,0.08)", fontWeight: 700 }}>{label}</td>
                    <td style={{ padding: "6px 8px", borderBottom: "1px solid rgba(255,255,255,0.08)", opacity: 0.7 }}>{curr}</td>
                    <td style={{ padding: "6px 8px", borderBottom: "1px solid rgba(255,255,255,0.08)", opacity: 0.85 }}>{proposed}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Spacer size="md" />

            {/* Financial snapshot */}
            <div>
              <BodyText bold size="small">Total Investment: $2.875M</BodyText>
              <BodyText size="small" opacity={0.7}>($2.3M purchase + $575K renovation)</BodyText>
              <Spacer size="xs" />
              <BodyText bold size="small">Projected Stable Year (2028): 60% Gross Margin, 36% EBITDA</BodyText>
            </div>
          </div>
        }
        right={
          <SlideImage
            src="AdobeStock_75950301.jpeg"
            alt="Stone estate / mountain retreat"
            style={{ width: "100%", height: "100%", borderRadius: "12px" }}
            overlay={15}
          />
        }
        leftWidth="55%"
      />
    </Slide>
  );
}

// ═══════════════════════════════════════════════════════════
// SLIDE 17 — PIPELINE MARKETS
// ═══════════════════════════════════════════════════════════
export function Slide17() {
  const markets = [
    { name: "Medellin, Colombia", tag: "INTERNATIONAL HUB", bullets: "Leverages established L&B international community \u00B7 Strategic Latin America hub \u00B7 Vibrant culture and lifestyle reputation \u00B7 Premium fly-to programming" },
    { name: "Park City, Utah", tag: "LUXURY MOUNTAIN", bullets: "Premier U.S. mountain destination \u00B7 High-end national clientele \u00B7 Proximity to SLC for accessibility \u00B7 Luxury cachet supports high-margin corporate off-sites" },
    { name: "Asheville, North Carolina", tag: "CREATIVE & WELLNESS", bullets: "Vibrant Blue Ridge hub aligned with holistic well-being \u00B7 Strong wedding and retreat market potential \u00B7 Diverse Southeast pipeline" },
    { name: "Loch Sheldrake, New York", tag: "HISTORIC DRIVE-TO", bullets: "Historic Catskills renovation opportunity \u00B7 High NYC metro accessibility \u00B7 Consistent weekend demand \u00B7 Natural complement to Belleayre" },
  ];

  return (
    <Slide bg="cream" number={17}>
      <SlideTitle size="small" color={COLORS.black}>
        Strategic Expansion Pipeline
      </SlideTitle>

      <Spacer size="lg" />

      <Grid cols={2} gap="clamp(12px, 2vw, 24px)" style={{ flex: 1 }}>
        {markets.map((m) => (
          <div
            key={m.name}
            style={{
              backgroundColor: COLORS.white,
              borderRadius: "12px",
              padding: "clamp(14px, 1.8vw, 24px)",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              border: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            <h4 style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: "clamp(12px, 1.3vw, 16px)", margin: "0 0 4px", color: COLORS.black }}>
              {m.name}
            </h4>
            <p style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: "clamp(9px, 0.85vw, 11px)", color: COLORS.richGreen, margin: "0 0 10px", letterSpacing: "0.04em" }}>
              {m.tag}
            </p>
            <BodyText size="small" color={COLORS.black}>
              {m.bullets}
            </BodyText>
          </div>
        ))}
      </Grid>
    </Slide>
  );
}

// ═══════════════════════════════════════════════════════════
// SLIDE 18 — UNIT ECONOMICS
// ═══════════════════════════════════════════════════════════
export function Slide18() {
  const streams = [
    { num: "01", title: "Signature Retreats", sub: "(20 weeks/year)", body: "High-ticket, all-inclusive programming led by L&B team. Core brand driver and highest-margin product." },
    { num: "02", title: "Partner Residencies", sub: "(10 weeks/year)", body: "Hosting aligned facilitators and organizations. Fixed rental income with lower operational overhead." },
    { num: "03", title: "Private Events & Weddings", sub: "(10 weekends/year)", body: "Exclusive buyouts for CNM-aligned celebrations. Significant site fees and F&B revenue." },
  ];

  return (
    <Slide bg="dark" number={18}>
      <SlideTitle size="small">The Revenue Engine — Per Property</SlideTitle>

      <Spacer size="lg" />

      <SplitLayout
        left={
          <div style={{ display: "flex", flexDirection: "column", gap: "clamp(16px, 2vh, 24px)" }}>
            {streams.map((s) => (
              <div key={s.num}>
                <div style={{ display: "flex", gap: "10px", alignItems: "baseline" }}>
                  <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: "clamp(16px, 1.6vw, 20px)", color: COLORS.richGreen }}>
                    {s.num}
                  </span>
                  <div>
                    <span style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: "clamp(11px, 1.1vw, 14px)" }}>
                      {s.title}
                    </span>
                    <span style={{ fontFamily: "Arial, sans-serif", fontSize: "clamp(9px, 0.9vw, 11px)", opacity: 0.6, marginLeft: "6px" }}>
                      {s.sub}
                    </span>
                  </div>
                </div>
                <BodyText size="small" opacity={0.8} style={{ marginLeft: "30px", marginTop: "4px" }}>
                  {s.body}
                </BodyText>
              </div>
            ))}
          </div>
        }
        right={
          <div style={{
            backgroundColor: "rgba(255,255,255,0.08)",
            borderRadius: "12px",
            padding: "clamp(20px, 2.5vw, 32px)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}>
            <h4 style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: "clamp(11px, 1vw, 13px)", opacity: 0.6, margin: "0 0 16px", letterSpacing: "0.05em" }}>
              STABILIZED YEAR SNAPSHOT
            </h4>
            {[
              { label: "Gross Revenue", value: "$1.5M" },
              { label: "Operating Expenses", value: "($960K)" },
              { label: "Net Operating Income", value: "$540K" },
            ].map((item, i) => (
              <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.1)" : "none" }}>
                <span style={{ fontFamily: "Arial, sans-serif", fontSize: "clamp(11px, 1.1vw, 14px)" }}>{item.label}</span>
                <span style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: "clamp(11px, 1.1vw, 14px)" }}>{item.value}</span>
              </div>
            ))}
            <Spacer size="md" />
            <div style={{ textAlign: "center" }}>
              <span style={{ fontFamily: "Arial, sans-serif", fontSize: "clamp(10px, 1vw, 12px)", opacity: 0.6 }}>EBITDA Margin</span>
              <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: "clamp(28px, 3vw, 40px)", color: COLORS.richGreen }}>
                36%
              </div>
            </div>
          </div>
        }
        leftWidth="55%"
      />

      <Spacer size="md" />
      <BodyText size="small" opacity={0.6} style={{ textAlign: "center" }}>
        Per Belleayre model. Retreat business supports occupancy; investor is buying real estate with a branded operating layer.
      </BodyText>
    </Slide>
  );
}

// ═══════════════════════════════════════════════════════════
// SLIDE 19 — 5-YEAR PRO FORMA
// ═══════════════════════════════════════════════════════════
export function Slide19() {
  const rows = [
    { metric: "Properties Operational", values: ["1", "2", "3", "4", "5"], highlight: false },
    { metric: "Total Revenue", values: ["$2.8M", "$6.2M", "$10.5M", "$15.1M", "$19.8M"], highlight: false },
    { metric: "Operating Expenses", values: ["($1.9M)", "($4.0M)", "($6.5M)", "($9.2M)", "($11.8M)"], highlight: false },
    { metric: "EBITDA", values: ["$0.9M", "$2.2M", "$4.0M", "$5.9M", "$8.0M"], highlight: true },
    { metric: "EBITDA Margin", values: ["32%", "35%", "38%", "39%", "40%"], highlight: true },
  ];

  return (
    <Slide bg="dark" number={19}>
      <SlideTitle size="small">5-Year Consolidated Projection</SlideTitle>

      <Spacer size="xl" />

      <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "Arial, sans-serif" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.2)", fontWeight: 700, fontSize: "clamp(10px, 1vw, 12px)" }}>
                Metric
              </th>
              {["Year 1", "Year 2", "Year 3", "Year 4", "Year 5"].map((y) => (
                <th key={y} style={{ textAlign: "right", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.2)", fontWeight: 700, fontSize: "clamp(10px, 1vw, 12px)" }}>
                  {y}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.metric} style={{ backgroundColor: row.highlight ? "rgba(255,255,255,0.05)" : "transparent" }}>
                <td style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  fontWeight: row.highlight ? 700 : 400,
                  fontSize: "clamp(10px, 1.1vw, 13px)",
                }}>
                  {row.metric}
                </td>
                {row.values.map((v, i) => (
                  <td key={i} style={{
                    textAlign: "right",
                    padding: "12px 16px",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                    fontWeight: row.highlight ? 700 : 400,
                    fontSize: "clamp(10px, 1.1vw, 13px)",
                  }}>
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Spacer size="lg" />

      <BodyText size="small" opacity={0.5} style={{ textAlign: "center" }}>
        Assumptions: One new property acquisition per year. Revenue includes retreat programming, lodging, F&B, and ancillary services. Conservative occupancy ramp-up modeled for each new location.
      </BodyText>
    </Slide>
  );
}
