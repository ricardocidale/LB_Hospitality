import {
  Slide,
  SlideTitle,
  SlideSubtitle,
  BodyText,
  StatCallout,
  Quote,
  Card,
  Grid,
  SplitLayout,
  Spacer,
  SlideImage,
  COLORS,
} from "./SlideLayout";

// ═══════════════════════════════════════════════════════════
// SLIDE 26 — APPENDIX DIVIDER
// ═══════════════════════════════════════════════════════════
export function Slide26() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: COLORS.darkForest,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <div style={{ textAlign: "center", color: COLORS.white }}>
        <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: "clamp(28px, 3.5vw, 36px)", margin: "0 0 12px" }}>
          Appendix
        </p>
        <p style={{ fontFamily: "Arial, sans-serif", fontSize: "clamp(13px, 1.4vw, 16px)", opacity: 0.8, margin: 0 }}>
          Supplementary Information
        </p>
      </div>
      <div style={{ position: "absolute", bottom: "8px", right: "16px", fontSize: "8px", color: COLORS.mutedGold }}>26</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// APPENDIX A — WHAT IF EXPERIENCE DETAIL (Slides 27-33)
// ═══════════════════════════════════════════════════════════
export function Slide27() {
  const goals = [
    "Create a safe, consent-centered space for exploration",
    "Facilitate deeper communication between partners",
    "Build emotional resilience and relational intelligence",
    "Integrate somatic and breathwork practices for embodied connection",
    "Explore boundaries, desires, and relational design with expert guidance",
    "Provide post-retreat integration support and community continuity",
    "Honor diverse relationship structures without hierarchy or judgment",
    "Bridge the gap between clinical depth and experiential play",
  ];

  return (
    <Slide bg="cream" number={27}>
      <SlideTitle size="small" color={COLORS.black}>A-1: Retreat Goals</SlideTitle>
      <Spacer size="xs" />
      <SlideSubtitle color={COLORS.footnoteDark}>Eight core goals guiding every What If retreat</SlideSubtitle>
      <Spacer size="lg" />
      <div style={{ display: "flex", flexDirection: "column", gap: "clamp(10px, 1.3vh, 16px)", flex: 1 }}>
        {goals.map((g, i) => (
          <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
            <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: "clamp(16px, 1.8vw, 22px)", color: COLORS.richGreen, flexShrink: 0, width: "28px", textAlign: "right" }}>
              {i + 1}
            </span>
            <BodyText color={COLORS.black}>{g}</BodyText>
          </div>
        ))}
      </div>
    </Slide>
  );
}

export function Slide28() {
  return (
    <Slide bg="cream" number={28}>
      <SlideTitle size="small" color={COLORS.black}>A-2: Format, Timing & Locations</SlideTitle>
      <Spacer size="lg" />
      <Grid cols={2} gap="clamp(20px, 2.5vw, 36px)" style={{ flex: 1 }}>
        <div>
          <h4 style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: "clamp(11px, 1.1vw, 14px)", margin: "0 0 10px", color: COLORS.black }}>Weekend Schedule</h4>
          <BodyText size="small" color={COLORS.black}>
            <strong>Friday:</strong> 7 PM arrival, welcome ceremony, intention setting, orientation<br />
            <strong>Saturday:</strong> Full day — workshops (AM), somatic practices (PM), evening ritual & sacred play<br />
            <strong>Sunday:</strong> Integration circle, closing ceremony, departure by 3 PM
          </BodyText>
          <Spacer size="lg" />
          <h4 style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: "clamp(11px, 1.1vw, 14px)", margin: "0 0 10px", color: COLORS.black }}>Deep Dive Week</h4>
          <BodyText size="small" color={COLORS.black}>
            5 days / 4 nights of intensive programming. Deeper somatic work, extended workshops, optional plant medicine integration, multiple evening experiences.
          </BodyText>
        </div>
        <div>
          <h4 style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: "clamp(11px, 1.1vw, 14px)", margin: "0 0 10px", color: COLORS.black }}>Participant Structure</h4>
          <BodyText size="small" color={COLORS.black}>
            Maximum 5 couples + 4 singles per retreat (14 participants). Each participant vetted through individual video intake with both founders. Curated for emotional intelligence, diversity, gender balance, and group fit.
          </BodyText>
          <Spacer size="lg" />
          <h4 style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: "clamp(11px, 1.1vw, 14px)", margin: "0 0 10px", color: COLORS.black }}>Active Locations</h4>
          <ul style={{ margin: 0, paddingLeft: "16px", fontFamily: "Arial, sans-serif", fontSize: "clamp(10px, 1vw, 13px)", lineHeight: 1.8, color: COLORS.black }}>
            <li>Western Catskills, NY</li>
            <li>Niagara, Ontario</li>
            <li>Cartagena, Colombia</li>
            <li>Park City, Utah</li>
            <li>Paris & Cannes, France</li>
          </ul>
        </div>
      </Grid>
    </Slide>
  );
}

export function Slide29() {
  return (
    <Slide bg="cream" number={29}>
      <SlideTitle size="small" color={COLORS.black}>A-3: Intake Process & Group Design</SlideTitle>
      <Spacer size="lg" />
      <Grid cols={2} gap="clamp(20px, 2.5vw, 36px)" style={{ flex: 1 }}>
        <div>
          <h4 style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: "clamp(11px, 1.1vw, 14px)", margin: "0 0 10px", color: COLORS.black }}>Vetting Methodology</h4>
          <BodyText size="small" color={COLORS.black}>
            Every prospective attendee completes a detailed questionnaire covering relationship history, motivations, boundaries, and experience level. Both founders conduct 1-on-1 video calls with each individual (even partnered attendees are interviewed separately). This ensures emotional readiness, consent literacy, and group compatibility.
          </BodyText>
          <Spacer size="md" />
          <BodyText size="small" color={COLORS.black}>
            Rejection rate: ~20% of applicants. We do not optimize for volume — we optimize for safety and depth.
          </BodyText>
        </div>
        <div>
          <h4 style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: "clamp(11px, 1.1vw, 14px)", margin: "0 0 10px", color: COLORS.black }}>Group Composition Philosophy</h4>
          <BodyText size="small" color={COLORS.black}>
            Each group is curated for balance across multiple dimensions: experience level (newcomers + experienced), relationship structure (couples + singles), gender diversity, age range, ethnic diversity, and personality type. The goal is a micro-community that reflects the real world — not an echo chamber.
          </BodyText>
        </div>
      </Grid>
    </Slide>
  );
}

export function Slide30() {
  return (
    <Slide bg="cream" number={30}>
      <SlideTitle size="small" color={COLORS.black}>A-4: Focus Areas — Part 1</SlideTitle>
      <Spacer size="lg" />
      <Grid cols={2} gap="clamp(20px, 2.5vw, 36px)" style={{ flex: 1 }}>
        <Card bg="outlined">
          <h4 style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: "clamp(11px, 1.1vw, 14px)", margin: "0 0 10px", color: COLORS.richGreen }}>CNM Navigation</h4>
          <BodyText size="small" color={COLORS.black}>
            Communication frameworks, jealousy management, boundary negotiation, relationship design. Practical tools for navigating non-traditional relationship structures with integrity.
          </BodyText>
        </Card>
        <Card bg="outlined">
          <h4 style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: "clamp(11px, 1.1vw, 14px)", margin: "0 0 10px", color: COLORS.richGreen }}>Intimacy & Connection</h4>
          <BodyText size="small" color={COLORS.black}>
            Eye-gazing, trust-building exercises, vulnerability practices, attachment awareness. Moving beyond intellectual understanding into embodied connection.
          </BodyText>
        </Card>
        <Card bg="outlined">
          <h4 style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: "clamp(11px, 1.1vw, 14px)", margin: "0 0 10px", color: COLORS.richGreen }}>Healing & Growth</h4>
          <BodyText size="small" color={COLORS.black}>
            Trauma-informed practices, shame resilience, inner child work, grief rituals. Creating space for emotional release and integration in a held container.
          </BodyText>
        </Card>
        <Card bg="outlined">
          <h4 style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: "clamp(11px, 1.1vw, 14px)", margin: "0 0 10px", color: COLORS.richGreen }}>Erotic Intelligence</h4>
          <BodyText size="small" color={COLORS.black}>
            Desire mapping, pleasure practices, consent in action, erotic storytelling. Reclaiming sexuality as a dimension of wholeness, not performance.
          </BodyText>
        </Card>
      </Grid>
    </Slide>
  );
}

export function Slide31() {
  return (
    <Slide bg="cream" number={31}>
      <SlideTitle size="small" color={COLORS.black}>A-5: Focus Areas — Part 2 (Modalities)</SlideTitle>
      <Spacer size="lg" />
      <Grid cols={2} gap="clamp(20px, 2.5vw, 36px)" style={{ flex: 1 }}>
        <Card bg="outlined">
          <h4 style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: "clamp(11px, 1.1vw, 14px)", margin: "0 0 10px", color: COLORS.richGreen }}>Relational Workshops</h4>
          <BodyText size="small" color={COLORS.black}>
            Expert-led group sessions and pair exercises. Topics rotate per retreat. Co-facilitated by Lea (clinical) and guest practitioners. Structured for both insight and emotional release.
          </BodyText>
        </Card>
        <Card bg="outlined">
          <h4 style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: "clamp(11px, 1.1vw, 14px)", margin: "0 0 10px", color: COLORS.richGreen }}>Somatic & Breathwork</h4>
          <BodyText size="small" color={COLORS.black}>
            Holotropic and transformational breathwork, body scan meditations, guided touch practices. The body stores what the mind avoids — somatic practices access deeper layers.
          </BodyText>
        </Card>
        <Card bg="outlined">
          <h4 style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: "clamp(11px, 1.1vw, 14px)", margin: "0 0 10px", color: COLORS.richGreen }}>Nature Integration</h4>
          <BodyText size="small" color={COLORS.black}>
            Fire circles, cold plunges, forest bathing, star-gazing, sunrise ceremonies. Nature isn't backdrop — it's a co-facilitator. Every property is selected for its natural setting.
          </BodyText>
        </Card>
        <Card bg="outlined">
          <h4 style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: "clamp(11px, 1.1vw, 14px)", margin: "0 0 10px", color: COLORS.richGreen }}>Plant Medicine (Optional)</h4>
          <BodyText size="small" color={COLORS.black}>
            Available at select retreats and Deep Dive weeks. Facilitated by trained practitioners in controlled settings. Participants opt in with full informed consent. Integration sessions included.
          </BodyText>
        </Card>
      </Grid>
    </Slide>
  );
}

export function Slide32() {
  return (
    <Slide bg="cream" number={32}>
      <SlideTitle size="small" color={COLORS.black}>A-6: Current Season Pricing</SlideTitle>
      <Spacer size="lg" />
      <div style={{ flex: 1, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "Arial, sans-serif", fontSize: "clamp(10px, 1vw, 13px)" }}>
          <thead>
            <tr>
              {["Location", "Format", "Duration", "Price Range", "Includes"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "10px 12px", borderBottom: "2px solid rgba(0,0,0,0.15)", fontWeight: 700, color: COLORS.black }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ["Western Catskills, NY", "Signature Weekend", "3 days / 2 nights", "$2,000-$2,500", "Lodging, meals, programming, integration call"],
              ["Niagara, Ontario", "Signature Weekend", "3 days / 2 nights", "$2,000-$2,500", "Lodging, meals, programming, integration call"],
              ["Cartagena, Colombia", "Deep Dive", "6 days / 5 nights", "$4,500-$6,500", "Lodging, meals, excursions, full programming"],
              ["Park City, Utah", "Signature Weekend", "3 days / 2 nights", "$2,500-$3,000", "Premium lodging, meals, ski-adjacent activities"],
              ["Paris & Cannes, France", "Deep Dive", "6 days / 5 nights", "$5,000-$6,500", "Luxury lodging, meals, cultural experiences"],
            ].map((row) => (
              <tr key={row[0]}>
                {row.map((cell, i) => (
                  <td key={i} style={{ padding: "10px 12px", borderBottom: "1px solid rgba(0,0,0,0.08)", color: COLORS.black, verticalAlign: "top" }}>
                    {i === 0 ? <strong>{cell}</strong> : cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Slide>
  );
}

export function Slide33() {
  return (
    <Slide bg="cream" number={33}>
      <SlideTitle size="small" color={COLORS.black}>A-7: Safety, Inclusion & Transformation</SlideTitle>
      <Spacer size="lg" />
      <Grid cols={3} gap="clamp(12px, 2vw, 24px)" style={{ flex: 1 }}>
        <Card bg="outlined">
          <h4 style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: "clamp(11px, 1.1vw, 14px)", margin: "0 0 10px", color: COLORS.richGreen }}>Safety</h4>
          <BodyText size="small" color={COLORS.black}>
            Consent is non-negotiable. Every retreat begins with explicit consent frameworks. Clinical facilitation present at all times. On-call support available 24/7 during events. Clear escalation protocols for any boundary violations.
          </BodyText>
        </Card>
        <Card bg="outlined">
          <h4 style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: "clamp(11px, 1.1vw, 14px)", margin: "0 0 10px", color: COLORS.richGreen }}>Inclusion</h4>
          <BodyText size="small" color={COLORS.black}>
            All genders, orientations, relationship structures, body types, and ethnic backgrounds welcome. Pricing includes sliding-scale options. Accessibility accommodations available upon request. Diversity is curated intentionally — not performatively.
          </BodyText>
        </Card>
        <Card bg="outlined">
          <h4 style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: "clamp(11px, 1.1vw, 14px)", margin: "0 0 10px", color: COLORS.richGreen }}>Transformation</h4>
          <BodyText size="small" color={COLORS.black}>
            The retreat is the beginning, not the end. Post-retreat integration calls, alumni community, ongoing digital support, and reunion weekends ensure the work continues. 60% return rate speaks to lasting impact.
          </BodyText>
        </Card>
      </Grid>
    </Slide>
  );
}

// ═══════════════════════════════════════════════════════════
// APPENDIX B — MARKET DEEP DIVE (Slides 34-39)
// ═══════════════════════════════════════════════════════════
export function Slide34() {
  return (
    <Slide bg="dark" number={34} footnotes="Sources: Global Wellness Institute (Nov 2025), globalwellnessinstitute.org | Fortune Business Insights, fortunebusinessinsights.com/sexual-wellness-products-market-110030">
      <SlideTitle size="small">A-8: Full Market Size</SlideTitle>
      <Spacer size="lg" />
      <Grid cols={3} gap="clamp(16px, 2.5vw, 40px)">
        <StatCallout value="$6.8T" label="Global wellness economy (GWI, 2024)" valueSize="xlarge" />
        <StatCallout value="$25B" label="Sexual wellness market (current)" valueSize="xlarge" />
        <StatCallout value="$45B" label="Projected sexual wellness by 2032" valueSize="xlarge" />
      </Grid>
      <Spacer size="xl" />
      <div style={{ flex: 1, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "Arial, sans-serif", fontSize: "clamp(9px, 0.95vw, 12px)" }}>
          <thead>
            <tr>
              {["Demographic", "% Open to CNM", "Source"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.2)", fontWeight: 700, color: COLORS.white }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ["Gen Z (18-25)", "41%", "Tinder / OnePoll (2023)"],
              ["Millennials", "43%", "YouGov (Jan 2020)"],
              ["Men 18-44", "55%", "YouGov (Feb 2023)"],
              ["Adults under 30", "51% accept open marriages", "Pew (Sept 2023)"],
              ["All U.S. adults", "4-5% currently practicing", "Haupert et al. (2017)"],
            ].map((row) => (
              <tr key={row[0]}>
                {row.map((cell, i) => (
                  <td key={i} style={{ padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)", opacity: i === 2 ? 0.6 : 0.85 }}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Slide>
  );
}

function AppendixPlaceholder({ number, title, source }: { number: number; title: string; source: string }) {
  return (
    <Slide bg="cream" number={number}>
      <SlideTitle size="small" color={COLORS.black}>{title}</SlideTitle>
      <Spacer size="lg" />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", maxWidth: "60%" }}>
          <div style={{ width: "64px", height: "64px", margin: "0 auto 16px", borderRadius: "50%", backgroundColor: `${COLORS.richGreen}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "24px", color: COLORS.richGreen }}>&#9654;</span>
          </div>
          <BodyText color={COLORS.footnoteDark} style={{ fontStyle: "italic" }}>
            Content sourced from: {source}
          </BodyText>
        </div>
      </div>
    </Slide>
  );
}

export function Slide35() {
  return <AppendixPlaceholder number={35} title="A-9: Gay Culture Parallel — Media Visibility" source="Canonical Slide 30 / Gay Culture Boom document Slide 1" />;
}
export function Slide36() {
  return <AppendixPlaceholder number={36} title="A-10: Gay Culture Parallel — Brand Activation" source="Canonical Slide 31 / Gay Culture Boom document Slide 2" />;
}
export function Slide37() {
  return <AppendixPlaceholder number={37} title="A-11: Gay Culture Parallel — Market Size" source="Canonical Slide 32 / Gay Culture Boom document Slide 3" />;
}
export function Slide38() {
  return <AppendixPlaceholder number={38} title="A-12: Gay Culture Parallel — Public Opinion" source="Canonical Slide 33 / Gay Culture Boom document Slide 4" />;
}

export function Slide39() {
  return (
    <Slide bg="cream" number={39}>
      <SlideTitle size="small" color={COLORS.black}>A-13: CNM Spectrum Detail</SlideTitle>
      <Spacer size="lg" />
      <Grid cols={3} gap="clamp(12px, 2vw, 24px)" style={{ flex: 1 }}>
        <Card bg="outlined">
          <h4 style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: "clamp(11px, 1.1vw, 14px)", margin: "0 0 10px", color: COLORS.richGreen }}>Monogamish &rarr; Open</h4>
          <BodyText size="small" color={COLORS.black}>
            Primarily partnered individuals who have negotiated specific allowances — from flirting to occasional encounters with clear rules. The "training wheels" zone of CNM. Most common entry point.
          </BodyText>
        </Card>
        <Card bg="dark">
          <h4 style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: "clamp(11px, 1.1vw, 14px)", margin: "0 0 10px", color: COLORS.richGreen }}>Swinging &rarr; Polyamory</h4>
          <BodyText size="small" color={COLORS.white} opacity={0.85}>
            Ranges from recreational, couple-centered sexual exploration (swinging) to multiple emotionally committed relationships (polyamory). The "practiced" middle where most of L&B's community lives.
          </BodyText>
        </Card>
        <Card bg="outlined">
          <h4 style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: "clamp(11px, 1.1vw, 14px)", margin: "0 0 10px", color: COLORS.richGreen }}>Relationship Anarchy</h4>
          <BodyText size="small" color={COLORS.black}>
            Rejects all prescribed relationship hierarchies. Each relationship is defined by its own terms. The philosophical end of the spectrum — smaller population but culturally influential.
          </BodyText>
        </Card>
      </Grid>
    </Slide>
  );
}

// ═══════════════════════════════════════════════════════════
// APPENDIX C — EXTENDED BIOS (Slides 40-41)
// ═══════════════════════════════════════════════════════════
export function Slide40() {
  return (
    <Slide bg="cream" number={40}>
      <SplitLayout
        left={
          <div>
            <SlideTitle size="small" color={COLORS.black}>A-14: Lea Mazniku — Full Bio</SlideTitle>
            <Spacer size="lg" />
            <BodyText size="small" color={COLORS.black} style={{ lineHeight: 1.8 }}>
              Lea Mazniku is a French- and U.S.-trained clinical psychologist with a private practice spanning two decades. Her clinical specialties include psychedelic-assisted psychotherapy, relationship trauma recovery, consensual non-monogamy navigation, and sacred sexuality.
            </BodyText>
            <Spacer size="md" />
            <BodyText size="small" color={COLORS.black} style={{ lineHeight: 1.8 }}>
              She is the Executive Producer and host of <em>Equal Footing</em>, now in its 4th season on the Talkline Network (nationwide). Her areas of deep expertise include jealousy, sexual dysfunction, desire discrepancy, and kink-affirming therapy.
            </BodyText>
            <Spacer size="md" />
            <BodyText size="small" color={COLORS.black} style={{ lineHeight: 1.8 }}>
              As co-founder of Lola and Ber, Lea brings the clinical authority that makes L&B's container safe, inclusive, and therapeutically grounded — without being clinical. Her ability to hold space for vulnerability while maintaining professional boundaries is the foundation of the L&B experience.
            </BodyText>
            <Spacer size="lg" />
            <Quote text="Out beyond ideas of wrongdoing and rightdoing, there is a field. I'll meet you there." attribution="— Rumi (as cited by Lea)" isDark={false} />
          </div>
        }
        right={
          <SlideImage src="Lola_3.png" alt="Lea Mazniku" style={{ width: "100%", height: "100%", borderRadius: "12px" }} />
        }
        leftWidth="60%"
      />
    </Slide>
  );
}

export function Slide41() {
  return (
    <Slide bg="cream" number={41}>
      <SplitLayout
        left={
          <div>
            <SlideTitle size="small" color={COLORS.black}>A-15: Dov Tuzman — Full Bio</SlideTitle>
            <Spacer size="lg" />
            <BodyText size="small" color={COLORS.black} style={{ lineHeight: 1.8 }}>
              Dov Tuzman is a Harvard-educated entrepreneur, investor, and public servant. His career spans Goldman Sachs (where he took two companies public), the U.S. Trade Representative's office (serving under two presidents), and membership in the Council on Foreign Relations.
            </BodyText>
            <Spacer size="md" />
            <BodyText size="small" color={COLORS.black} style={{ lineHeight: 1.8 }}>
              He is the subject of the documentary <em>Startup.com</em> (2001), which chronicled the rise and fall of his first venture during the dot-com era. He authored <em>The Entrepreneur's Success Kit</em> (St. Martin's Press, 2005).
            </BodyText>
            <Spacer size="md" />
            <BodyText size="small" color={COLORS.black} style={{ lineHeight: 1.8 }}>
              A survivor who has dedicated his second act to healing and sexual empowerment, Dov brings operational rigor, fundraising experience, and a deeply personal commitment to the L&B mission. His ability to merge institutional credibility with radical vulnerability defines the brand's unique positioning.
            </BodyText>
          </div>
        }
        right={
          <SlideImage src="Ber_3.png" alt="Dov Tuzman" style={{ width: "100%", height: "100%", borderRadius: "12px" }} />
        }
        leftWidth="60%"
      />
    </Slide>
  );
}

// ═══════════════════════════════════════════════════════════
// APPENDIX D — FINANCIAL DETAIL (Slides 42-45)
// ═══════════════════════════════════════════════════════════
export function Slide42() {
  return (
    <Slide bg="dark" number={42}>
      <SlideTitle size="small">A-16: Belleayre Transformation Plan</SlideTitle>
      <Spacer size="lg" />
      <Grid cols={2} gap="clamp(20px, 2.5vw, 36px)" style={{ flex: 1 }}>
        <div>
          <h4 style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: "clamp(11px, 1.1vw, 14px)", margin: "0 0 12px" }}>Existing Property</h4>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "Arial, sans-serif", fontSize: "clamp(9px, 0.95vw, 12px)" }}>
            <tbody>
              {[
                ["Built", "1926"],
                ["Construction", "Stone & timber"],
                ["Land", "61\u00B1 acres"],
                ["Structure", "8,200+ sq ft"],
                ["Current capacity", "8-12 guests"],
                ["Amenities", "Pool, great room"],
                ["Asking price", "$2.3M"],
              ].map(([k, v]) => (
                <tr key={k}>
                  <td style={{ padding: "6px 8px", borderBottom: "1px solid rgba(255,255,255,0.08)", fontWeight: 700, width: "40%" }}>{k}</td>
                  <td style={{ padding: "6px 8px", borderBottom: "1px solid rgba(255,255,255,0.08)", opacity: 0.85 }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <h4 style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: "clamp(11px, 1.1vw, 14px)", margin: "0 0 12px" }}>Proposed Transformation</h4>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "Arial, sans-serif", fontSize: "clamp(9px, 0.95vw, 12px)" }}>
            <tbody>
              {[
                ["Capacity", "30-50 guests (20 keys)"],
                ["Accommodations", "Suites + A-frames + glamping pods"],
                ["Amenities", "Spa, hot tubs, commercial kitchen, dining hall"],
                ["Renovation budget", "$575K"],
                ["Total investment", "$2.875M"],
                ["Stabilized EBITDA", "36%"],
                ["Target ROI", "60% gross margin at stabilization"],
              ].map(([k, v]) => (
                <tr key={k}>
                  <td style={{ padding: "6px 8px", borderBottom: "1px solid rgba(255,255,255,0.08)", fontWeight: 700, width: "40%" }}>{k}</td>
                  <td style={{ padding: "6px 8px", borderBottom: "1px solid rgba(255,255,255,0.08)", opacity: 0.85 }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Grid>
    </Slide>
  );
}

export function Slide43() {
  return (
    <Slide bg="dark" number={43}>
      <SlideTitle size="small">A-17: 5-Year Pro Forma Income Statement</SlideTitle>
      <Spacer size="lg" />
      <div style={{ flex: 1, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "Arial, sans-serif", fontSize: "clamp(9px, 1vw, 12px)" }}>
          <thead>
            <tr>
              {["", "Year 1", "Year 2", "Year 3", "Year 4", "Year 5"].map((h) => (
                <th key={h} style={{ textAlign: h ? "right" : "left", padding: "8px 10px", borderBottom: "1px solid rgba(255,255,255,0.2)", fontWeight: 700 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { label: "Retreat Revenue", values: ["$1.4M", "$3.1M", "$5.3M", "$7.5M", "$9.9M"], bold: false },
              { label: "Partner Residency", values: ["$560K", "$1.2M", "$2.1M", "$3.0M", "$3.9M"], bold: false },
              { label: "Events & Weddings", values: ["$840K", "$1.9M", "$3.1M", "$4.6M", "$6.0M"], bold: false },
              { label: "Total Revenue", values: ["$2.8M", "$6.2M", "$10.5M", "$15.1M", "$19.8M"], bold: true },
              { label: "Operating Expenses", values: ["($1.9M)", "($4.0M)", "($6.5M)", "($9.2M)", "($11.8M)"], bold: false },
              { label: "EBITDA", values: ["$0.9M", "$2.2M", "$4.0M", "$5.9M", "$8.0M"], bold: true },
              { label: "EBITDA Margin", values: ["32%", "35%", "38%", "39%", "40%"], bold: true },
            ].map((row) => (
              <tr key={row.label} style={{ backgroundColor: row.bold ? "rgba(255,255,255,0.05)" : "transparent" }}>
                <td style={{ padding: "8px 10px", borderBottom: "1px solid rgba(255,255,255,0.08)", fontWeight: row.bold ? 700 : 400 }}>{row.label}</td>
                {row.values.map((v, i) => (
                  <td key={i} style={{ textAlign: "right", padding: "8px 10px", borderBottom: "1px solid rgba(255,255,255,0.08)", fontWeight: row.bold ? 700 : 400 }}>{v}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Slide>
  );
}

export function Slide44() {
  return <AppendixPlaceholder number={44} title="A-18: 5-Year Pro Forma Cash Flows" source="Canonical Slide 18 — Detailed cash flow projections" />;
}

export function Slide45() {
  return <AppendixPlaceholder number={45} title="A-19: 5-Year Pro Forma Balance Sheet" source="Canonical Slide 19 — Consolidated balance sheet projections" />;
}

// ═══════════════════════════════════════════════════════════
// APPENDIX E — VISUAL/BRAND (Slides 46-49)
// ═══════════════════════════════════════════════════════════
export function Slide46() {
  return (
    <Slide bg="dark" number={46}>
      <SlideTitle size="small">A-20: Belleayre Mountain — Photo Gallery</SlideTitle>
      <Spacer size="lg" />
      <Grid cols={2} gap="clamp(8px, 1vw, 16px)" style={{ flex: 1 }}>
        <SlideImage src="AdobeStock_75950301.jpeg" alt="Belleayre estate exterior" style={{ width: "100%", height: "100%", borderRadius: "8px" }} overlay={10} />
        <SlideImage src="AdobeStock_75950411.jpeg" alt="Mountain retreat view" style={{ width: "100%", height: "100%", borderRadius: "8px" }} overlay={10} />
        <SlideImage src="AdobeStock_739940809.jpeg" alt="Estate grounds" style={{ width: "100%", height: "100%", borderRadius: "8px" }} overlay={10} />
        <SlideImage src="AdobeStock_763628967.jpeg" alt="Nature landscape" style={{ width: "100%", height: "100%", borderRadius: "8px" }} overlay={10} />
      </Grid>
    </Slide>
  );
}

export function Slide47() {
  return (
    <Slide bg="cream" number={47}>
      <SlideTitle size="small" color={COLORS.black}>A-21: Candid Moments — FreENM Fest</SlideTitle>
      <Spacer size="lg" />
      <Grid cols={2} gap="clamp(8px, 1vw, 16px)" style={{ flex: 1 }}>
        <SlideImage src="17_FreENM_2025_Diamond_Girl_Studio.jpg" alt="FreENM Fest candid 1" style={{ width: "100%", height: "100%", borderRadius: "8px" }} />
        <SlideImage src="31_FreENM_2025_Diamond_Girl_Studio.jpg" alt="FreENM Fest candid 2" style={{ width: "100%", height: "100%", borderRadius: "8px" }} />
        <SlideImage src="33_FreENM_2025_Diamond_Girl_Studio.jpg" alt="FreENM Fest candid 3" style={{ width: "100%", height: "100%", borderRadius: "8px" }} />
        <SlideImage src="76_FreENM_2025_Diamond_Girl_Studio.jpg" alt="FreENM Fest candid 4" style={{ width: "100%", height: "100%", borderRadius: "8px" }} />
      </Grid>
    </Slide>
  );
}

export function Slide48() {
  return (
    <Slide bg="cream" number={48}>
      <SlideTitle size="small" color={COLORS.black}>A-22: Instagram Content</SlideTitle>
      <Spacer size="lg" />
      <Grid cols={3} gap="clamp(8px, 1vw, 16px)" style={{ flex: 1 }}>
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <SlideImage
            key={n}
            src={`Insta_0${n}.png`}
            alt={`Instagram post ${n}`}
            style={{ width: "100%", height: "100%", borderRadius: "8px" }}
          />
        ))}
      </Grid>
    </Slide>
  );
}

export function Slide49() {
  return (
    <Slide bg="cream" number={49}>
      <SlideTitle size="small" color={COLORS.black}>A-23: Lifestyle Photography</SlideTitle>
      <Spacer size="lg" />
      <Grid cols={3} gap="clamp(8px, 1vw, 16px)" style={{ flex: 1 }}>
        {[
          "AdobeStock_744485198.jpeg",
          "AdobeStock_1587592300.jpeg",
          "AdobeStock_814696456.jpeg",
          "AdobeStock_1025317440.jpeg",
          "AdobeStock_681077127.jpeg",
          "AdobeStock_938452413.jpeg",
        ].map((src) => (
          <SlideImage key={src} src={src} alt="Lifestyle photography" style={{ width: "100%", height: "100%", borderRadius: "8px" }} />
        ))}
      </Grid>
    </Slide>
  );
}

// ═══════════════════════════════════════════════════════════
// APPENDIX F — LEGACY PROBLEM FRAMING (Slides 50-55)
// ═══════════════════════════════════════════════════════════
export function Slide50() {
  return (
    <Slide bg="cream" number={50}>
      <SlideTitle size="small" color={COLORS.black}>A-24: The Disconnect</SlideTitle>
      <Spacer size="lg" />
      <Quote text="The quality of our relationships determines the quality of our lives." attribution="— Dr. Esther Perel" isDark={false} />
      <Spacer size="lg" />
      <Grid cols={3} gap="clamp(12px, 2vw, 24px)" style={{ flex: 1 }}>
        <Card bg="outlined">
          <h4 style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: "clamp(11px, 1.1vw, 14px)", margin: "0 0 8px", color: COLORS.richGreen }}>The Promise</h4>
          <BodyText size="small" color={COLORS.black}>Find "the one." Get married. Stay faithful. Live happily ever after.</BodyText>
        </Card>
        <Card bg="outlined">
          <h4 style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: "clamp(11px, 1.1vw, 14px)", margin: "0 0 8px", color: COLORS.richGreen }}>The Reality</h4>
          <BodyText size="small" color={COLORS.black}>50% divorce. 33% infidelity. Desire fades. Resentment builds. People suffer in silence.</BodyText>
        </Card>
        <Card bg="outlined">
          <h4 style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: "clamp(11px, 1.1vw, 14px)", margin: "0 0 8px", color: COLORS.richGreen }}>The Gap</h4>
          <BodyText size="small" color={COLORS.black}>No safe, beautiful, clinically informed space for adults to explore alternatives with honesty and depth.</BodyText>
        </Card>
      </Grid>
    </Slide>
  );
}

export function Slide51() {
  return (
    <Slide bg="cream" number={51}>
      <SlideTitle size="small" color={COLORS.black}>A-25: Where Existing Solutions Fall Short</SlideTitle>
      <Spacer size="lg" />
      <Quote text="An affair is not necessarily the end of a marriage. But the way we deal with it may be." attribution="— Esther Perel" isDark={false} />
      <Spacer size="lg" />
      <Grid cols={2} gap="clamp(12px, 2vw, 24px)" style={{ flex: 1 }}>
        {[
          { title: "Traditional Therapy", problem: "Defaults to mononormative frameworks; lacks CNM-specific training; rarely addresses eroticism" },
          { title: "Swingers Clubs", problem: "Transactional; no emotional depth; poor safety standards; stigmatized aesthetics" },
          { title: "Wellness Retreats", problem: "Avoids sexuality entirely; spiritual bypassing; expensive but surface-level" },
          { title: "Dating Apps (Feeld, etc.)", problem: "Facilitates connections but not transformation; no container; no facilitation; no safety" },
        ].map((item) => (
          <Card key={item.title} bg="outlined">
            <h4 style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: "clamp(11px, 1.1vw, 14px)", margin: "0 0 8px", color: COLORS.richGreen }}>{item.title}</h4>
            <BodyText size="small" color={COLORS.black}>{item.problem}</BodyText>
          </Card>
        ))}
      </Grid>
    </Slide>
  );
}

export function Slide52() {
  return <AppendixPlaceholder number={52} title="A-26: Origin Story / Embodied Leadership" source="Canonical Slide 5 — Founders' personal narrative" />;
}

export function Slide53() {
  return <AppendixPlaceholder number={53} title='A-27: CNM Spectrum Detail — "Spectrum, Not a Side"' source="Canonical Slide 3 / V2 appendix Slide 20" />;
}

export function Slide54() {
  return (
    <Slide bg="cream" number={54}>
      <SlideTitle size="small" color={COLORS.black}>A-28: Revenue Model — Three-Pillar Ecosystem</SlideTitle>
      <Spacer size="lg" />
      <Grid cols={3} gap="clamp(12px, 2vw, 24px)" style={{ flex: 1 }}>
        <Card bg="dark">
          <h4 style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: "clamp(12px, 1.2vw, 15px)", margin: "0 0 12px", color: COLORS.richGreen, textAlign: "center" }}>01 &mdash; Immersive Experiences</h4>
          <BodyText size="small" color={COLORS.white} opacity={0.85}>
            Signature retreats, Deep Dive weeks, alumni weekends, partner residencies. Core revenue driver with highest margins and deepest brand impact.
          </BodyText>
        </Card>
        <Card bg="dark">
          <h4 style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: "clamp(12px, 1.2vw, 15px)", margin: "0 0 12px", color: COLORS.richGreen, textAlign: "center" }}>02 &mdash; Media & Content</h4>
          <BodyText size="small" color={COLORS.white} opacity={0.85}>
            Equal Footing radio, social media, educational content, podcast partnerships. Brand amplification and community nurture. Low-cost lead generation.
          </BodyText>
        </Card>
        <Card bg="dark">
          <h4 style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: "clamp(12px, 1.2vw, 15px)", margin: "0 0 12px", color: COLORS.richGreen, textAlign: "center" }}>03 &mdash; Hospitality</h4>
          <BodyText size="small" color={COLORS.white} opacity={0.85}>
            Owned & operated boutique properties. Year-round occupancy through diverse programming. Real estate appreciation + branded operating premium.
          </BodyText>
        </Card>
      </Grid>
    </Slide>
  );
}

export function Slide55() {
  return <AppendixPlaceholder number={55} title="A-29: Strategic Market Selection Methodology" source="Canonical Slide 16 — Detailed market scoring criteria" />;
}
