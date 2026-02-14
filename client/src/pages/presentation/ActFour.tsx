import {
  Slide,
  SlideTitle,
  SlideSubtitle,
  BodyText,
  Card,
  Grid,
  SplitLayout,
  Spacer,
  SlideImage,
  COLORS,
} from "./SlideLayout";

// ═══════════════════════════════════════════════════════════
// SLIDE 20 — THE FOUNDERS
// ═══════════════════════════════════════════════════════════
export function Slide20() {
  return (
    <Slide bg="cream" number={20} footnotes={"Lea Tuzman professional practice: leatuzman.com | Equal Footing radio: soundcloud.com/equalfooting | Startup.com: IMDB (2001) | The Entrepreneur's Success Kit: St. Martin's Press (2005)"}>
      <SlideTitle size="small" color={COLORS.black}>
        The Founders
      </SlideTitle>

      <Spacer size="lg" />

      <Grid cols={2} gap="clamp(24px, 3vw, 48px)" style={{ flex: 1 }}>
        {/* Lea */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
            <SlideImage
              src="Lola_3.png"
              alt="Lea Mazniku"
              style={{ width: "clamp(56px, 7vw, 80px)", height: "clamp(56px, 7vw, 80px)", borderRadius: "50%", flexShrink: 0 }}
            />
            <div>
              <h3 style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: "clamp(14px, 1.5vw, 18px)", margin: 0, color: COLORS.black }}>
                Lea Mazniku
              </h3>
              <p style={{ fontFamily: "Arial, sans-serif", fontSize: "clamp(10px, 1vw, 12px)", color: COLORS.footnoteDark, margin: "2px 0 0" }}>
                "Lola" &middot; Clinical Psychologist
              </p>
            </div>
          </div>
          <ul style={{ margin: 0, paddingLeft: "18px", fontFamily: "Arial, sans-serif", fontSize: "clamp(9px, 0.95vw, 12px)", lineHeight: 1.8, color: COLORS.black }}>
            <li>French- and U.S.-trained clinical psychologist</li>
            <li>Specialties: psychedelic-assisted psychotherapy, relationship trauma recovery, CNM navigation, sacred sexuality</li>
            <li>Executive Producer, <em>Equal Footing</em> radio (4th season, Talkline Network, nationwide)</li>
            <li>Areas of expertise: jealousy, sexual dysfunction, desire discrepancy, kink-affirming therapy</li>
          </ul>
        </div>

        {/* Dov */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
            <SlideImage
              src="Ber_3.png"
              alt="Dov Tuzman"
              style={{ width: "clamp(56px, 7vw, 80px)", height: "clamp(56px, 7vw, 80px)", borderRadius: "50%", flexShrink: 0 }}
            />
            <div>
              <h3 style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: "clamp(14px, 1.5vw, 18px)", margin: 0, color: COLORS.black }}>
                Dov Tuzman
              </h3>
              <p style={{ fontFamily: "Arial, sans-serif", fontSize: "clamp(10px, 1vw, 12px)", color: COLORS.footnoteDark, margin: "2px 0 0" }}>
                "Ber" &middot; Entrepreneur & Survivor
              </p>
            </div>
          </div>
          <ul style={{ margin: 0, paddingLeft: "18px", fontFamily: "Arial, sans-serif", fontSize: "clamp(9px, 0.95vw, 12px)", lineHeight: 1.8, color: COLORS.black }}>
            <li>Harvard University</li>
            <li>Goldman Sachs; took two companies public (IPOs)</li>
            <li>U.S. Trade Representative under two presidents</li>
            <li>Member, Council on Foreign Relations</li>
            <li>Subject of documentary <em>Startup.com</em> (2001)</li>
            <li>Author, <em>The Entrepreneur's Success Kit</em> (St. Martin's Press, 2005)</li>
            <li>Survivor dedicating his second act to healing and sexual empowerment</li>
          </ul>
        </div>
      </Grid>

      <Spacer size="md" />

      <div style={{ textAlign: "center" }}>
        <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic", fontSize: "clamp(12px, 1.3vw, 16px)", color: COLORS.black, margin: "0 0 4px" }}>
          "We don't give people answers. We give them the space to ask the right questions — with their breath, their body, and their truth."
        </p>
        <p style={{ fontFamily: "Arial, sans-serif", fontSize: "clamp(9px, 0.9vw, 11px)", color: COLORS.footnoteDark, margin: 0 }}>
          — Dov Tuzman
        </p>
      </div>
    </Slide>
  );
}

// ═══════════════════════════════════════════════════════════
// SLIDE 21 — THE EXTENDED TEAM
// ═══════════════════════════════════════════════════════════
export function Slide21() {
  const team = [
    { name: "Dov Tuzman", title: "Co-Founder", photo: "Ber_3.png", bio: "Entrepreneur, investor, and hospitality developer. Building spaces where healing and truth meet." },
    { name: "Lea Mazniku", title: "Co-Founder", photo: "Lola_3.png", bio: "Clinical psychologist specializing in relationship trauma, CNM navigation, and embodied therapy." },
    { name: "Danielle Kohler", title: "Marketing & Brand Strategy", photo: "Danielle.png", bio: "Brand strategist and creative director behind Lola and Ber's visual identity and growth architecture. Founder of Kohler Creative Consulting. Author and advocate for authentic expression in intimate communities.", placeholder: true },
    { name: "Ricardo Cialde", title: "Corporate Development", photo: "Ricardo_Cidale_BW_4.png", bio: "Operational strategist with GTM, scaling, and partnership experience — driving structure, growth, and execution across L&B's hospitality expansion." },
  ];

  return (
    <Slide bg="cream" number={21}>
      <SlideTitle size="small" color={COLORS.black}>
        The Team
      </SlideTitle>

      <Spacer size="lg" />

      <div style={{ display: "flex", flexDirection: "column", gap: "clamp(12px, 1.5vh, 20px)", flex: 1 }}>
        {team.map((t) => (
          <div
            key={t.name}
            style={{
              display: "flex",
              gap: "clamp(12px, 1.5vw, 20px)",
              alignItems: "center",
              backgroundColor: COLORS.white,
              borderRadius: "12px",
              padding: "clamp(12px, 1.5vw, 20px)",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              border: t.placeholder ? "2px dashed #C4A265" : "1px solid rgba(0,0,0,0.06)",
            }}
          >
            <SlideImage
              src={t.photo}
              alt={t.name}
              style={{ width: "clamp(44px, 5vw, 60px)", height: "clamp(44px, 5vw, 60px)", borderRadius: "50%", flexShrink: 0 }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" }}>
                <h4 style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: "clamp(11px, 1.1vw, 14px)", margin: 0, color: COLORS.black }}>
                  {t.name}
                </h4>
                <span style={{ fontFamily: "Arial, sans-serif", fontSize: "clamp(9px, 0.85vw, 11px)", color: COLORS.footnoteDark }}>
                  {t.title}
                </span>
                {t.placeholder && (
                  <span style={{ fontFamily: "Arial, sans-serif", fontSize: "clamp(8px, 0.7vw, 9px)", color: COLORS.mutedGold, fontStyle: "italic" }}>
                    [Bio placeholder — to be updated]
                  </span>
                )}
              </div>
              <BodyText size="small" color={COLORS.black} style={{ marginTop: "4px" }}>
                {t.bio}
              </BodyText>
            </div>
          </div>
        ))}
      </div>
    </Slide>
  );
}

// ═══════════════════════════════════════════════════════════
// SLIDE 22 — WHY NOW, WHY US
// ═══════════════════════════════════════════════════════════
export function Slide22() {
  const columns = [
    {
      num: "01",
      title: "Cultural Tipping Point",
      body: "CNM is moving from fringe to mainstream, mirroring the yoga-and-meditation trajectory. Media coverage, therapeutic acceptance, and public curiosity are at all-time highs. We are positioning to be the category-defining hospitality brand.",
    },
    {
      num: "02",
      title: "Safety Meets Scale",
      body: "Rare convergence of deep clinical authority and proven business acumen. Lea's psychological expertise ensures safety and depth. Dov's track record taking companies public ensures operational excellence and scale.",
    },
    {
      num: "03",
      title: "Product-Market Resonance",
      body: "Not guessing — 30 months of sold-out retreats. Zero paid marketing. A fiercely loyal community. Demand validated. Model proven. Now we simply add the asset.",
    },
  ];

  return (
    <Slide bg="dark" number={22}>
      <SlideTitle size="small">Why Now. Why Us.</SlideTitle>

      <Spacer size="xl" />

      <Grid cols={3} gap="clamp(20px, 3vw, 40px)" style={{ flex: 1, alignContent: "center" }}>
        {columns.map((c) => (
          <div key={c.num}>
            <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: "clamp(28px, 3.5vw, 48px)", margin: "0 0 8px", opacity: 0.3 }}>
              {c.num}
            </p>
            <h4 style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: "clamp(12px, 1.3vw, 16px)", margin: "0 0 12px" }}>
              {c.title}
            </h4>
            <BodyText size="small" opacity={0.8}>
              {c.body}
            </BodyText>
          </div>
        ))}
      </Grid>
    </Slide>
  );
}

// ═══════════════════════════════════════════════════════════
// SLIDE 23 — THE ASK
// ═══════════════════════════════════════════════════════════
export function Slide23() {
  return (
    <Slide bg="dark" number={23}>
      <div style={{ textAlign: "center", marginBottom: "clamp(16px, 2vh, 24px)" }}>
        <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: "clamp(36px, 5vw, 54px)", margin: 0 }}>
          $3,000,000
        </p>
        <p style={{ fontFamily: "Arial, sans-serif", fontSize: "clamp(14px, 1.5vw, 18px)", opacity: 0.8, margin: "4px 0 0" }}>
          Seed Round Capital Raise
        </p>
      </div>

      <SplitLayout
        left={
          <div>
            <h4 style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: "clamp(11px, 1.1vw, 14px)", margin: "0 0 16px", letterSpacing: "0.04em" }}>
              USE OF FUNDS
            </h4>
            {[
              { label: "Acquisition Equity — 50%", body: "Down payment on Belleayre property and closing costs" },
              { label: "Renovation & CapEx — 30%", body: "Design, architectural updates, and conversion of spaces for programming" },
              { label: "Working Capital — 20%", body: "Key hires, pre-opening marketing, and operational runway" },
            ].map((item) => (
              <div key={item.label} style={{ marginBottom: "14px" }}>
                <BodyText bold size="small">{item.label}</BodyText>
                <BodyText size="small" opacity={0.8}>{item.body}</BodyText>
              </div>
            ))}
          </div>
        }
        right={
          <Grid cols={2} gap="clamp(8px, 1vw, 16px)">
            {[
              { metric: "Target IRR", value: "20%+" },
              { metric: "Target MOIC", value: "2.5\u00D7" },
              { metric: "Hold Period", value: "5-7 Years" },
              { metric: "Cash-on-Cash", value: "8-12%" },
            ].map((item) => (
              <div
                key={item.metric}
                style={{
                  backgroundColor: "rgba(255,255,255,0.08)",
                  borderRadius: "12px",
                  padding: "clamp(14px, 1.8vw, 24px)",
                  textAlign: "center",
                }}
              >
                <p style={{ fontFamily: "Arial, sans-serif", fontSize: "clamp(9px, 0.9vw, 11px)", opacity: 0.6, margin: "0 0 6px" }}>
                  {item.metric}
                </p>
                <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: "clamp(18px, 2vw, 24px)", margin: 0 }}>
                  {item.value}
                </p>
              </div>
            ))}
          </Grid>
        }
      />

      <Spacer size="md" />

      <BodyText size="small" opacity={0.6} style={{ textAlign: "center" }}>
        Preferred Equity with 8% preferred return hurdle, ensuring investor priority before GP promote.
      </BodyText>
    </Slide>
  );
}

// ═══════════════════════════════════════════════════════════
// SLIDE 24 — THE CLOSE
// ═══════════════════════════════════════════════════════════
export function Slide24() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: COLORS.darkForest,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {/* Background photo overlay */}
      <SlideImage
        src="AdobeStock_814292542.jpeg"
        alt=""
        overlay={85}
        style={{ position: "absolute", inset: 0 }}
      />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: "80%", color: COLORS.white }}>
        <p
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontWeight: 700,
            fontStyle: "italic",
            fontSize: "clamp(28px, 3.5vw, 40px)",
            lineHeight: 1.3,
            margin: "0 0 clamp(24px, 3vh, 40px)",
          }}
        >
          The Future of Intimacy Needs a Home.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "clamp(20px, 3vh, 36px)" }}>
          <p style={{ fontFamily: "Arial, sans-serif", fontSize: "clamp(13px, 1.4vw, 16px)", margin: 0 }}>We have the community.</p>
          <p style={{ fontFamily: "Arial, sans-serif", fontSize: "clamp(13px, 1.4vw, 16px)", margin: 0 }}>We have the expertise.</p>
          <p style={{ fontFamily: "Arial, sans-serif", fontSize: "clamp(13px, 1.4vw, 16px)", margin: 0 }}>We have the traction.</p>
        </div>

        <p style={{ fontFamily: "Arial, sans-serif", fontSize: "clamp(13px, 1.4vw, 16px)", margin: "0 0 clamp(24px, 3vh, 40px)" }}>
          Now, we are building the physical foundation for a cultural shift.
        </p>

        <div style={{ opacity: 0.8 }}>
          <p style={{ fontFamily: "Arial, sans-serif", fontSize: "clamp(11px, 1.2vw, 14px)", margin: "0 0 4px" }}>
            Partner With Us
          </p>
          <p style={{ fontFamily: "Arial, sans-serif", fontSize: "clamp(11px, 1.2vw, 14px)", margin: "0 0 2px" }}>
            Dov Tuzman & Lea Mazniku
          </p>
          <p style={{ fontFamily: "Arial, sans-serif", fontSize: "clamp(11px, 1.2vw, 14px)", margin: 0 }}>
            Founders, Lola and Ber
          </p>
        </div>
      </div>

      {/* Slide number */}
      <div style={{ position: "absolute", bottom: "8px", right: "16px", fontSize: "8px", color: COLORS.mutedGold }}>
        24
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SLIDE 25 — THANK YOU
// ═══════════════════════════════════════════════════════════
export function Slide25() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: COLORS.warmCream,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <div style={{ textAlign: "center" }}>
        {/* Logo placeholder */}
        <div
          style={{
            width: "80px",
            height: "80px",
            margin: "0 auto 24px",
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${COLORS.richGreen}, ${COLORS.darkForest})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: COLORS.white,
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "22px",
            fontWeight: 700,
          }}
        >
          L&B
        </div>

        <p
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontWeight: 700,
            fontSize: "clamp(24px, 3vw, 32px)",
            color: COLORS.black,
            margin: "0 0 clamp(20px, 3vh, 32px)",
          }}
        >
          Thank You
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <p style={{ fontFamily: "Arial, sans-serif", fontSize: "clamp(11px, 1.2vw, 14px)", color: COLORS.black, margin: 0 }}>
            Lola and Ber
          </p>
          <p style={{ fontFamily: "Arial, sans-serif", fontSize: "clamp(11px, 1.2vw, 14px)", color: COLORS.black, margin: 0 }}>
            www.lolaandber.com
          </p>
          <p style={{ fontFamily: "Arial, sans-serif", fontSize: "clamp(11px, 1.2vw, 14px)", color: COLORS.black, margin: 0 }}>
            investors@lolaandber.com
          </p>
        </div>
      </div>

      {/* Slide number */}
      <div style={{ position: "absolute", bottom: "8px", right: "16px", fontSize: "8px", color: COLORS.mutedGold }}>
        25
      </div>
    </div>
  );
}
