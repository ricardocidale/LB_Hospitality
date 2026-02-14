import {
  Slide,
  SlideTitle,
  SlideSubtitle,
  BodyText,
  StatCallout,
  Quote,
  Card,
  Grid,
  Spacer,
  SlideImage,
  COLORS,
} from "./SlideLayout";

// ═══════════════════════════════════════════════════════════
// SLIDE 1 — TITLE
// ═══════════════════════════════════════════════════════════
export function Slide1() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
      }}
    >
      {/* Left panel — cream */}
      <div
        style={{
          width: "50%",
          backgroundColor: COLORS.warmCream,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "clamp(32px, 5vw, 72px)",
        }}
      >
        {/* L&B logo placeholder */}
        <div
          style={{
            width: "60px",
            height: "60px",
            marginBottom: "24px",
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${COLORS.richGreen}, ${COLORS.darkForest})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: COLORS.white,
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "18px",
            fontWeight: 700,
          }}
        >
          L&B
        </div>

        <h1
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontWeight: 700,
            fontSize: "clamp(28px, 3vw, 36px)",
            color: COLORS.black,
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          Lola and Ber
        </h1>
        <h1
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontWeight: 700,
            fontSize: "clamp(36px, 4vw, 48px)",
            color: COLORS.black,
            margin: "4px 0 0",
            lineHeight: 1.2,
          }}
        >
          What If
        </h1>

        <Spacer size="lg" />

        <p
          style={{
            fontFamily: "Arial, sans-serif",
            fontSize: "clamp(13px, 1.3vw, 16px)",
            color: COLORS.black,
            margin: 0,
          }}
        >
          Where Intimacy Meets Artistry
        </p>

        <Spacer size="lg" />

        <p
          style={{
            fontFamily: "Arial, sans-serif",
            fontSize: "clamp(10px, 1vw, 12px)",
            color: COLORS.footnoteDark,
            margin: 0,
          }}
        >
          Investor Presentation | Hospitality Track
        </p>
        <p
          style={{
            fontFamily: "Arial, sans-serif",
            fontSize: "clamp(8px, 0.9vw, 10px)",
            color: COLORS.footnoteDark,
            margin: "4px 0 0",
          }}
        >
          February 2026
        </p>
      </div>

      {/* Right panel — photo */}
      <SlideImage
        src="AdobeStock_744485198.jpeg"
        alt="Couple in warm, natural setting"
        style={{ width: "50%", height: "100%" }}
      />

      {/* Slide number */}
      <div
        style={{
          position: "absolute",
          bottom: "8px",
          right: "16px",
          fontSize: "8px",
          color: COLORS.mutedGold,
        }}
      >
        1
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SLIDE 2 — THE BROKEN PROMISE
// ═══════════════════════════════════════════════════════════
export function Slide2() {
  return (
    <Slide
      bg="dark"
      number={2}
      footnotes="Sources: Pew Research Center, '8 Facts About Divorce' (Oct 2025), pewresearch.org | Psychology Today (Jan 2024) | APA, apa.org/topics/divorce-child-custody | Institute for Family Studies / General Social Survey (2018), ifstudies.org"
    >
      <SlideTitle>Half of all marriages fail.</SlideTitle>
      <SlideTitle italic>
        <em>The other half aren't telling the truth.</em>
      </SlideTitle>

      <Spacer size="xl" />

      <Grid cols={2} gap="clamp(20px, 3vw, 48px)" style={{ flex: 1, alignContent: "center" }}>
        <StatCallout value="40-50%" label="of first marriages end in divorce" />
        <StatCallout value="~60%" label="of second marriages fail" />
        <StatCallout value="20-40%" label="of divorces involve infidelity" />
        <StatCallout value="~33%" label="of Americans report some form of infidelity" />
      </Grid>

      <Spacer size="lg" />

      <Quote
        text="The rules aren't working. People aren't breaking them because they're immoral — they're breaking them because the rules were never designed for how humans actually love."
        attribution="— Dov Tuzman, Co-Founder, Lola and Ber"
      />
    </Slide>
  );
}

// ═══════════════════════════════════════════════════════════
// SLIDE 3 — THE CULTURAL SHIFT
// ═══════════════════════════════════════════════════════════
export function Slide3() {
  return (
    <Slide
      bg="dark"
      number={3}
      footnotes="Sources: Haupert et al. (2017), Journal of Sex & Marital Therapy; Psychology Today / Dr. Elisabeth Sheff (May 2019); Tinder / OnePoll Survey (2023); Gallup Values & Beliefs Survey (2003-2023); Pew Research Center (Sept 2023); YouGov (Jan 2020 & Feb 2023)"
    >
      {/* Three primary stats */}
      <Grid cols={3} gap="clamp(16px, 2.5vw, 40px)">
        <StatCallout value="11-13M" label="U.S. adults currently practice consensual non-monogamy (4-5% of those in relationships)" valueSize="xlarge" />
        <StatCallout value="41%" label="of Gen Z open to non-monogamous relationships" valueSize="xlarge" />
        <StatCallout value="3x" label="growth in moral acceptance of plural relationships (Gallup: 7% to 23%, 2003-2023)" valueSize="xlarge" />
      </Grid>

      <Spacer size="xl" />

      {/* Supporting stats */}
      <div style={{ textAlign: "center", opacity: 0.7 }}>
        <BodyText size="small" style={{ maxWidth: "90%", margin: "0 auto" }}>
          51% of adults under 30 say open marriages are acceptable (Pew, 2023) &middot; 43% of millennials say their ideal relationship is non-monogamous (YouGov, 2020) &middot; 55% of men aged 18-44 prefer some form of non-monogamy (YouGov, 2023)
        </BodyText>
      </div>

      <div style={{ flex: 1 }} />

      {/* Closing line */}
      <div style={{ textAlign: "center" }}>
        <p
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontStyle: "italic",
            fontSize: "clamp(14px, 1.6vw, 20px)",
            margin: 0,
          }}
        >
          1 in 5 Americans has explored CNM. This isn't fringe. This is mainstream in waiting.
        </p>
      </div>
    </Slide>
  );
}

// ═══════════════════════════════════════════════════════════
// SLIDE 4 — THE GAY CULTURE PARALLEL
// ═══════════════════════════════════════════════════════════
export function Slide4() {
  const phases = [
    {
      phase: "UNDERGROUND",
      arrow: "Hidden, pathologized",
      lgbtq: 'AIDS crisis, closeted lives, "don\'t ask don\'t tell"',
      cnm: "Viewed as cheating or deviance; limited to niche subcultures",
    },
    {
      phase: "VISIBILITY",
      arrow: "Mainstream awareness",
      lgbtq:
        "Will & Grace (1998, top sitcom by 2001); Philadelphia ($206M box office); terms become household language",
      cnm: 'Esther Perel\'s Mating in Captivity (2006); Couple to Throuple (Peacock 2023); "polycule" enters AP Stylebook; multi-partner domestic partnerships: Somerville MA (2020), Cambridge (2021), Berkeley & Oakland (2024)',
    },
    {
      phase: "MARKET POWER",
      arrow: "Commercial infrastructure",
      lgbtq:
        "$3.7T global buying power; Axel Hotels (10+ properties); Absolut Vodka ads (1981); Subaru campaign (1990s); Pride-edition SKUs",
      cnm: "Feeld revenue \u00A339.5M (2023, +107% YoY); Bliss Cruise 6,000 passengers; premium retreat waitlists at $2K+/attendee; OkCupid: 1/3 of users open to CNM",
    },
  ];

  return (
    <Slide
      bg="cream"
      number={4}
      footnotes="Sources: Gallup same-sex marriage support 27% (1996) to 71% (2023); Feeld revenue: Global Dating Insights; Bliss Cruise: blisscruise.com; Multi-partner partnerships: Harvard Law Review Vol. 135; NPR (May 2024); AP Stylebook: 2023 edition"
    >
      <SlideTitle size="small" color={COLORS.black}>
        This Has Happened Before
      </SlideTitle>
      <Spacer size="sm" />
      <SlideSubtitle color={COLORS.footnoteDark}>
        The LGBTQ+ acceptance arc created a $3.7 trillion market. CNM is following the same trajectory with a 20-30 year lag.
      </SlideSubtitle>

      <Spacer size="lg" />

      {/* Table */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "clamp(9px, 0.95vw, 12px)",
            fontFamily: "Arial, sans-serif",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  textAlign: "left",
                  padding: "10px 12px",
                  borderBottom: "2px solid rgba(0,0,0,0.15)",
                  width: "18%",
                  fontWeight: 700,
                  color: COLORS.black,
                }}
              >
                Phase
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "10px 12px",
                  borderBottom: "2px solid rgba(0,0,0,0.15)",
                  width: "41%",
                  fontWeight: 700,
                  color: COLORS.black,
                }}
              >
                LGBTQ+ (1985-2015)
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "10px 12px",
                  borderBottom: "2px solid rgba(0,0,0,0.15)",
                  width: "41%",
                  fontWeight: 700,
                  color: COLORS.black,
                }}
              >
                CNM (2010-Present)
              </th>
            </tr>
          </thead>
          <tbody>
            {phases.map((row) => (
              <tr key={row.phase}>
                <td
                  style={{
                    padding: "12px",
                    borderBottom: "1px solid rgba(0,0,0,0.08)",
                    verticalAlign: "top",
                    backgroundColor: "#E8F0EB",
                  }}
                >
                  <span style={{ fontWeight: 700, color: COLORS.richGreen, fontSize: "clamp(10px, 1vw, 13px)" }}>
                    {row.phase}
                  </span>
                  <br />
                  <span style={{ fontSize: "clamp(8px, 0.8vw, 10px)", opacity: 0.7 }}>
                    {row.arrow}
                  </span>
                </td>
                <td
                  style={{
                    padding: "12px",
                    borderBottom: "1px solid rgba(0,0,0,0.08)",
                    verticalAlign: "top",
                    lineHeight: 1.5,
                  }}
                >
                  {row.lgbtq}
                </td>
                <td
                  style={{
                    padding: "12px",
                    borderBottom: "1px solid rgba(0,0,0,0.08)",
                    verticalAlign: "top",
                    lineHeight: 1.5,
                  }}
                >
                  {row.cnm}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Spacer size="md" />

      <div style={{ textAlign: "center" }}>
        <p
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontStyle: "italic",
            fontSize: "clamp(14px, 1.4vw, 18px)",
            color: COLORS.black,
            margin: 0,
          }}
        >
          History doesn't repeat itself, but it rhymes.
        </p>
      </div>
    </Slide>
  );
}

// ═══════════════════════════════════════════════════════════
// SLIDE 5 — THE CNM SPECTRUM
// ═══════════════════════════════════════════════════════════
export function Slide5() {
  const labels = [
    "MONOGAMY",
    "MONOGAMISH",
    "OPEN",
    "SWINGING",
    "POLYAMORY",
    "RELATIONSHIP ANARCHY",
  ];

  return (
    <Slide
      bg="cream"
      number={5}
      footnotes='Source: Haupert et al. (2017), Journal of Sex & Marital Therapy. 1-in-5 figure: Levine et al. (2018), Journal of Sex Research.'
    >
      <SlideTitle size="small" color={COLORS.black}>
        A Spectrum, Not a Binary
      </SlideTitle>

      <Spacer size="xl" />

      {/* Spectrum graphic */}
      <div style={{ position: "relative", padding: "0 20px" }}>
        {/* "THE VAST MIDDLE" label */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "8px",
            fontSize: "clamp(9px, 1vw, 12px)",
            fontWeight: 700,
            color: COLORS.richGreen,
            letterSpacing: "0.1em",
          }}
        >
          <span style={{ fontSize: "clamp(16px, 1.8vw, 22px)", marginRight: "8px" }}>&infin;</span>
          THE VAST MIDDLE
        </div>

        {/* Bar */}
        <div
          style={{
            display: "flex",
            height: "clamp(40px, 5vh, 56px)",
            borderRadius: "28px",
            overflow: "hidden",
          }}
        >
          {/* Muted left */}
          <div style={{ flex: 1, backgroundColor: "#8B9E8F" }} />
          {/* Highlighted center */}
          <div style={{ flex: 4, backgroundColor: COLORS.richGreen }} />
          {/* Muted right */}
          <div style={{ flex: 1, backgroundColor: "#8B9E8F" }} />
        </div>

        {/* Labels below */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "10px",
            padding: "0 4px",
          }}
        >
          {labels.map((label) => (
            <div
              key={label}
              style={{
                fontSize: "clamp(7px, 0.75vw, 10px)",
                fontWeight: 700,
                textAlign: "center",
                color: COLORS.black,
                letterSpacing: "0.02em",
                flex: 1,
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>

      <Spacer size="xl" />

      {/* Body text */}
      <div style={{ textAlign: "center", maxWidth: "80%", margin: "0 auto" }}>
        <BodyText size="normal" color={COLORS.black}>
          CNM is not one identity — it's a spectrum. Most of the 1-in-5 Americans who have explored it sit in the middle: curious, thoughtful, seeking safe spaces to explore. Not swingers' clubs. Not radical polyamory. Something in between.
        </BodyText>
      </div>

      <Spacer size="lg" />

      <div style={{ textAlign: "center" }}>
        <BodyText bold color={COLORS.richGreen} size="normal">
          Lola and Ber serves the vast middle.
        </BodyText>
      </div>
    </Slide>
  );
}

// ═══════════════════════════════════════════════════════════
// SLIDE 6 — THE GAP IN THE MARKET
// ═══════════════════════════════════════════════════════════
export function Slide6() {
  return (
    <Slide bg="cream" number={6}>
      <SlideTitle size="small" color={COLORS.black} style={{ textAlign: "center" }}>
        Where Does the Vast Middle Go?
      </SlideTitle>

      <Spacer size="xl" />

      <Grid cols={3} gap="clamp(12px, 2vw, 28px)" style={{ flex: 1 }}>
        {/* Card 1 — Clinical Therapy */}
        <Card bg="outlined">
          <h3
            style={{
              fontFamily: "Arial, sans-serif",
              fontWeight: 700,
              fontSize: "clamp(12px, 1.2vw, 16px)",
              margin: "0 0 4px",
              color: COLORS.black,
            }}
          >
            CLINICAL THERAPY
          </h3>
          <p
            style={{
              fontFamily: "Arial, sans-serif",
              fontSize: "clamp(10px, 0.9vw, 12px)",
              color: COLORS.footnoteDark,
              margin: "0 0 12px",
            }}
          >
            Too Sterile
          </p>
          <BodyText size="small" color={COLORS.black}>
            Defaults to mononormative frameworks. Tiptoes around sexuality. Lacks CNM-specific training. Rarely addresses the erotic dimension.
          </BodyText>
        </Card>

        {/* Card 2 — The Vast Middle */}
        <Card bg="dark">
          <div style={{ textAlign: "center", marginBottom: "12px" }}>
            <span
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "clamp(24px, 3vw, 36px)",
                color: COLORS.white,
              }}
            >
              &infin;
            </span>
          </div>
          <h3
            style={{
              fontFamily: "Arial, sans-serif",
              fontWeight: 700,
              fontSize: "clamp(12px, 1.2vw, 16px)",
              margin: "0 0 12px",
              color: COLORS.white,
              textAlign: "center",
            }}
          >
            THE VAST MIDDLE
          </h3>
          <BodyText size="small" color={COLORS.white}>
            Seekers wanting depth, honesty, and safety. Emotionally intelligent. Looking for permission to be more alive. Not broken — curious.
          </BodyText>
          <Spacer size="md" />
          <div
            style={{
              backgroundColor: "rgba(37, 125, 65, 0.3)",
              borderRadius: "8px",
              padding: "8px 12px",
              textAlign: "center",
            }}
          >
            <BodyText bold size="small" color={COLORS.richGreen}>
              LOLA AND BER OPERATES HERE
            </BodyText>
          </div>
        </Card>

        {/* Card 3 — Lifestyle Scenes */}
        <Card bg="outlined">
          <h3
            style={{
              fontFamily: "Arial, sans-serif",
              fontWeight: 700,
              fontSize: "clamp(12px, 1.2vw, 16px)",
              margin: "0 0 4px",
              color: COLORS.black,
            }}
          >
            LIFESTYLE SCENES
          </h3>
          <p
            style={{
              fontFamily: "Arial, sans-serif",
              fontSize: "clamp(10px, 0.9vw, 12px)",
              color: COLORS.footnoteDark,
              margin: "0 0 12px",
            }}
          >
            Too Shallow
          </p>
          <BodyText size="small" color={COLORS.black}>
            Stimulation without transformation. Access without a safe container. Crappy experiences at luxury prices.
          </BodyText>
        </Card>
      </Grid>
    </Slide>
  );
}
