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
// SLIDE 7 — WE BUILT THE CONTAINER
// ═══════════════════════════════════════════════════════════
export function Slide7() {
  return (
    <Slide bg="cream" number={7}>
      <SlideTitle size="small" color={COLORS.black}>
        We Built What Was Missing
      </SlideTitle>
      <Spacer size="sm" />
      <BodyText color={COLORS.black}>
        Lola and Ber created what the market lacked: immersive experiences with clinical depth — without the clinical coldness.
      </BodyText>

      <Spacer size="lg" />

      <SplitLayout
        left={
          <div style={{ display: "flex", gap: "clamp(16px, 2.5vw, 32px)" }}>
            {/* Column 1 */}
            <div style={{ flex: 1 }}>
              <h4 style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: "clamp(11px, 1.1vw, 14px)", margin: "0 0 10px", color: COLORS.black }}>
                What We Offer
              </h4>
              <ul style={{ margin: 0, paddingLeft: "16px", fontFamily: "Arial, sans-serif", fontSize: "clamp(10px, 1vw, 13px)", lineHeight: 1.8, color: COLORS.black }}>
                <li>Intimate retreats blending safety with play</li>
                <li>Maximum 5 couples + 4 singles per retreat</li>
                <li>Every participant vetted through 1-on-1 video intake</li>
                <li>Curated for emotional intelligence, diversity, and fit</li>
              </ul>
            </div>
            {/* Column 2 */}
            <div style={{ flex: 1 }}>
              <h4 style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: "clamp(11px, 1.1vw, 14px)", margin: "0 0 10px", color: COLORS.black }}>
                Our Approach
              </h4>
              <ul style={{ margin: 0, paddingLeft: "16px", fontFamily: "Arial, sans-serif", fontSize: "clamp(10px, 1vw, 13px)", lineHeight: 1.8, color: COLORS.black }}>
                <li>Consent-centered, trauma-informed facilitation</li>
                <li>Bridge between erotic intelligence and practical life design</li>
                <li>Settings designed for safety, beauty, and depth</li>
                <li>California-sober (no alcohol; optional plant medicine integration)</li>
              </ul>
            </div>
          </div>
        }
        right={
          <SlideImage
            src="Insta_03.png"
            alt="Community retreat setting"
            style={{ width: "100%", height: "100%", borderRadius: "12px" }}
          />
        }
        leftWidth="58%"
      />
    </Slide>
  );
}

// ═══════════════════════════════════════════════════════════
// SLIDE 8 — INSIDE A WHAT IF RETREAT
// ═══════════════════════════════════════════════════════════
export function Slide8() {
  const pillars = [
    {
      title: "Relational Workshops",
      body: "Expert-led sessions on communication, boundaries, jealousy, and relational design. Structured to invite both insight and emotional release. Name your desires. Negotiate. Repair.",
    },
    {
      title: "Somatic & Breathwork",
      body: "Guided touch, breathwork, eye-gazing, body-based exercises. Experiencing intimacy — not just talking about it. Building trust, pleasure, and presence in the body.",
    },
    {
      title: "Ritual & Nature",
      body: "Fire circles, lake swims, star-gazing, opening and closing ceremonies. Nature as co-facilitator. The setting isn't backdrop — it's methodology.",
    },
    {
      title: "Sacred Play",
      body: "Themed celebrations, ecstatic dance, conscious touch. The depth of ritual meets the lightness of play. Full-spectrum expression in a safe container.",
    },
  ];

  return (
    <Slide bg="dark" number={8}>
      {/* Photo strip */}
      <div style={{ display: "flex", gap: "8px", height: "clamp(60px, 10vh, 100px)", marginBottom: "16px", borderRadius: "8px", overflow: "hidden" }}>
        <SlideImage
          src="70_FreENM_2025_Diamond_Girl_Studio.jpg"
          alt="Community gathering"
          overlay={20}
          style={{ flex: 1 }}
        />
        <SlideImage
          src="Insta_05.png"
          alt="Nature connection"
          overlay={20}
          style={{ flex: 1 }}
        />
      </div>

      <SlideTitle size="small">Inside a What If Retreat</SlideTitle>
      <Spacer size="xs" />
      <SlideSubtitle color="rgba(255,255,255,0.8)">
        Four pillars of a transformational weekend
      </SlideSubtitle>

      <Spacer size="lg" />

      <Grid cols={2} gap="clamp(12px, 2vw, 24px)" style={{ flex: 1 }}>
        {pillars.map((p) => (
          <div key={p.title}>
            <h4 style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: "clamp(11px, 1.1vw, 14px)", margin: "0 0 8px", color: COLORS.white }}>
              {p.title}
            </h4>
            <BodyText size="small" opacity={0.7}>
              {p.body}
            </BodyText>
          </div>
        ))}
      </Grid>
    </Slide>
  );
}

// ═══════════════════════════════════════════════════════════
// SLIDE 9 — FORMAT, PRICING & LOCATIONS
// ═══════════════════════════════════════════════════════════
export function Slide9() {
  return (
    <Slide bg="cream" number={9}>
      <SlideTitle size="small" color={COLORS.black}>
        The Experience at a Glance
      </SlideTitle>

      <Spacer size="lg" />

      <SplitLayout
        left={
          <div style={{ display: "flex", flexDirection: "column", gap: "clamp(12px, 1.5vh, 20px)" }}>
            {[
              { title: "Weekend Immersion", body: "Friday 7 PM - Sunday 3 PM (3 days / 2 nights)" },
              { title: "Deep Dive Week", body: "5 days / 4 nights of intensive programming" },
              { title: "Group Size", body: "Limited to 5 couples + 4 singles. Every attendee vetted through 1-on-1 video intake with both founders." },
              { title: "Locations", body: "Western Catskills, NY \u00B7 Niagara, Ontario \u00B7 Cartagena, Colombia \u00B7 Park City, Utah \u00B7 Paris & Cannes, France" },
            ].map((item) => (
              <div key={item.title}>
                <h4 style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: "clamp(11px, 1.1vw, 14px)", margin: "0 0 4px", color: COLORS.black }}>
                  {item.title}
                </h4>
                <BodyText size="small" color={COLORS.black}>
                  {item.body}
                </BodyText>
              </div>
            ))}
          </div>
        }
        right={
          <div style={{ display: "flex", flexDirection: "column", gap: "clamp(12px, 1.5vh, 20px)" }}>
            {/* Pricing Card 1 */}
            <Card bg="green" style={{ textAlign: "center" }}>
              <p style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: "clamp(11px, 1.1vw, 14px)", margin: "0 0 4px" }}>
                Signature Weekend
              </p>
              <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: "clamp(20px, 2.5vw, 28px)", margin: "0 0 4px" }}>
                $2,000 - $3,000
              </p>
              <p style={{ fontFamily: "Arial, sans-serif", fontSize: "clamp(9px, 0.9vw, 11px)", opacity: 0.85 }}>
                3 days / 2 nights &middot; All-inclusive
              </p>
            </Card>

            {/* Pricing Card 2 */}
            <Card bg="dark" style={{ textAlign: "center" }}>
              <p style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: "clamp(11px, 1.1vw, 14px)", margin: "0 0 4px" }}>
                Deep Dive Week
              </p>
              <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: "clamp(20px, 2.5vw, 28px)", margin: "0 0 4px" }}>
                $4,500 - $6,500
              </p>
              <p style={{ fontFamily: "Arial, sans-serif", fontSize: "clamp(9px, 0.9vw, 11px)", opacity: 0.85 }}>
                6 days / 5 nights &middot; All-inclusive
              </p>
            </Card>

            <Spacer size="sm" />
            <BodyText size="small" color={COLORS.footnoteDark}>
              All-inclusive: luxury lodging, gourmet organic meals, full programming, post-retreat integration call.
            </BodyText>
          </div>
        }
        leftWidth="52%"
      />
    </Slide>
  );
}

// ═══════════════════════════════════════════════════════════
// SLIDE 10 — TRACTION
// ═══════════════════════════════════════════════════════════
export function Slide10() {
  return (
    <Slide
      bg="dark"
      number={10}
      footnotes="Source: Lola and Ber internal data (2022-2025). FreENM Fest: freenmfest.com"
    >
      <SlideTitle size="small">Proof of Concept</SlideTitle>

      <Spacer size="lg" />

      <Grid cols={3} gap="clamp(16px, 2.5vw, 40px)" style={{ flex: 0 }}>
        <StatCallout value="1,500+" label="participants served" valueSize="large" />
        <StatCallout value="30+" label="retreats delivered" valueSize="large" />
        <StatCallout value="60%" label="repeat attendance rate" valueSize="large" />
        <StatCallout value="$0" label="paid marketing spend" valueSize="large" />
        <StatCallout value="$2K+" label="average revenue per attendee" valueSize="large" />
        <StatCallout value="1.5x" label="year-over-year revenue growth" valueSize="large" />
      </Grid>

      <Spacer size="lg" />

      {/* Traction signal */}
      <div style={{ textAlign: "center" }}>
        <BodyText bold color={COLORS.richGreen}>
          FreENM Fest 2025 — inaugural community-scale festival, Loch Sheldrake, NY (July 5-6)
        </BodyText>
      </div>

      <div style={{ flex: 1 }} />

      {/* Testimonial */}
      <Quote
        text="Lea and Dov create a safe, positive space for vulnerability, healing, fun and sexy times."
        attribution="— Linh & Jon, retreat participants"
      />

      <Spacer size="md" />

      <div style={{ textAlign: "center" }}>
        <BodyText size="normal">
          This isn't marketing. This is product-market resonance.
        </BodyText>
      </div>
    </Slide>
  );
}

// ═══════════════════════════════════════════════════════════
// SLIDE 11 — TESTIMONIALS
// ═══════════════════════════════════════════════════════════
export function Slide11() {
  return (
    <Slide bg="dark" number={11}>
      <SlideTitle size="small">In Their Words</SlideTitle>

      <Spacer size="xl" />

      <Grid cols={2} gap="clamp(16px, 3vw, 40px)" style={{ flex: 1, alignContent: "center" }}>
        {/* Card 1 */}
        <Card bg="cream" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <p
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontStyle: "italic",
              fontSize: "clamp(12px, 1.2vw, 15px)",
              lineHeight: 1.7,
              color: COLORS.black,
              margin: 0,
            }}
          >
            "Came to learn more about myself and my partner. A great way to come out of your shell, meet great people, and enjoy parts of yourself typically reserved. I'll definitely be back."
          </p>
          <Spacer size="md" />
          <p style={{ fontFamily: "Arial, sans-serif", fontSize: "clamp(9px, 0.9vw, 11px)", color: COLORS.footnoteDark, margin: 0 }}>
            — Brandi
          </p>
        </Card>

        {/* Card 2 */}
        <Card bg="cream" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <p
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontStyle: "italic",
              fontSize: "clamp(12px, 1.2vw, 15px)",
              lineHeight: 1.7,
              color: COLORS.black,
              margin: 0,
            }}
          >
            "A positive safe space for vulnerability, healing, fun and sexy times. Beautiful serene environment to disconnect from the world, reconnect with one another. A memorable experience that reignited our spark."
          </p>
          <Spacer size="md" />
          <p style={{ fontFamily: "Arial, sans-serif", fontSize: "clamp(9px, 0.9vw, 11px)", color: COLORS.footnoteDark, margin: 0 }}>
            — Linh & Jon
          </p>
        </Card>
      </Grid>
    </Slide>
  );
}

// ═══════════════════════════════════════════════════════════
// SLIDE 12 — THE LIGHTBULB MOMENT
// ═══════════════════════════════════════════════════════════
export function Slide12() {
  return (
    <Slide bg="dark" number={12}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <SlideTitle size="medium" style={{ textAlign: "center" }}>
          From Temporary Containers to Permanent Destinations
        </SlideTitle>

        <Spacer size="xl" />

        <div style={{ textAlign: "center" }}>
          <BodyText size="large">
            We've mastered the art of transformational spaces in borrowed venues. After every retreat, we hear the same question:
          </BodyText>
        </div>

        <Spacer size="lg" />

        <div style={{ textAlign: "center" }}>
          <p
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontWeight: 700,
              fontStyle: "italic",
              fontSize: "clamp(22px, 2.5vw, 28px)",
              margin: 0,
            }}
          >
            "When can we come back?"
          </p>
        </div>

        <Spacer size="xl" />

        <Grid cols={2} gap="clamp(24px, 3vw, 48px)">
          <div>
            <h4 style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: "clamp(11px, 1.1vw, 14px)", margin: "0 0 10px" }}>
              THE INSIGHT
            </h4>
            <BodyText size="small" opacity={0.8}>
              Our sold-out retreats prove a large, underserved community wants conscious, curated spaces for relational growth. The demand is validated. The model is proven.
            </BodyText>
          </div>
          <div>
            <h4 style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: "clamp(11px, 1.1vw, 14px)", margin: "0 0 10px" }}>
              THE OPPORTUNITY
            </h4>
            <BodyText size="small" opacity={0.8}>
              Build a hospitality brand that serves this community year-round — destinations where the transformation doesn't end when the retreat does.
            </BodyText>
          </div>
        </Grid>
      </div>
    </Slide>
  );
}
