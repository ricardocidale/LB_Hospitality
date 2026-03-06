import { describe, it, expect } from "vitest";
import {
  mulaw2linear,
  linear2mulaw,
  mulawBufferToWav,
  pcm16ToMulaw,
  downsample,
  escapeXml,
  buildSystemPrompt,
} from "../../server/integrations/elevenlabs-audio";

describe("Audio Encoding — mu-law codec", () => {
  it("all 256 mu-law values decode to valid 16-bit PCM range", () => {
    for (let i = 0; i < 256; i++) {
      const sample = mulaw2linear(i);
      expect(sample).toBeGreaterThanOrEqual(-32768);
      expect(sample).toBeLessThanOrEqual(32767);
    }
  });

  it("encode produces valid byte values (0-255)", () => {
    for (const sample of [0, 100, -100, 1000, -1000, 5000, -5000, 32000, -32000]) {
      const encoded = linear2mulaw(sample);
      expect(encoded).toBeGreaterThanOrEqual(0);
      expect(encoded).toBeLessThanOrEqual(255);
    }
  });

  it("distinct input ranges produce distinct encoded values", () => {
    const e1 = linear2mulaw(500);
    const e2 = linear2mulaw(5000);
    const e3 = linear2mulaw(20000);
    expect(e1).not.toBe(e2);
    expect(e2).not.toBe(e3);
  });

  it("positive and negative samples encode to different bytes", () => {
    expect(linear2mulaw(5000)).not.toBe(linear2mulaw(-5000));
  });
});

describe("mulawBufferToWav", () => {
  it("produces a valid WAV header", () => {
    const mulaw = Buffer.from([0x80, 0x80, 0x80, 0x80]);
    const wav = mulawBufferToWav(mulaw);
    expect(wav.toString("ascii", 0, 4)).toBe("RIFF");
    expect(wav.toString("ascii", 8, 12)).toBe("WAVE");
    expect(wav.readUInt16LE(20)).toBe(1);
    expect(wav.readUInt16LE(22)).toBe(1);
    expect(wav.readUInt32LE(24)).toBe(8000);
    expect(wav.readUInt16LE(34)).toBe(16);
  });

  it("total WAV size = 44 header + 2 * samples", () => {
    const n = 50;
    const wav = mulawBufferToWav(Buffer.alloc(n, 0x80));
    expect(wav.length).toBe(44 + n * 2);
    expect(wav.readUInt32LE(4)).toBe(wav.length - 8);
  });
});

describe("pcm16ToMulaw", () => {
  it("output length = input samples (input bytes / 2)", () => {
    const pcm = Buffer.alloc(160 * 2);
    expect(pcm16ToMulaw(pcm.toString("base64")).length).toBe(160);
  });

  it("roundtrips: PCM → mu-law → WAV preserves valid samples", () => {
    const pcm = Buffer.alloc(6 * 2);
    [0, 5000, -5000, 10000, -10000, 20000].forEach((v, i) => pcm.writeInt16LE(v, i * 2));
    const wav = mulawBufferToWav(pcm16ToMulaw(pcm.toString("base64")));
    const recovered = wav.subarray(44);
    expect(recovered.length).toBe(6 * 2);
    for (let i = 0; i < 6; i++) {
      const s = recovered.readInt16LE(i * 2);
      expect(s).toBeGreaterThanOrEqual(-32768);
      expect(s).toBeLessThanOrEqual(32767);
    }
  });
});

describe("downsample", () => {
  it("halves sample count when downsampling 16kHz to 8kHz", () => {
    const pcm = Buffer.alloc(160 * 2);
    expect(downsample(pcm.toString("base64"), 16000, 8000).length / 2).toBe(80);
  });

  it("preserves sample values (picks nearest sample)", () => {
    const pcm = Buffer.alloc(8);
    pcm.writeInt16LE(1000, 0);
    pcm.writeInt16LE(2000, 2);
    pcm.writeInt16LE(3000, 4);
    pcm.writeInt16LE(4000, 6);
    const result = downsample(pcm.toString("base64"), 16000, 8000);
    expect(result.readInt16LE(0)).toBe(1000);
    expect(result.readInt16LE(2)).toBe(3000);
  });
});

describe("escapeXml", () => {
  it("escapes all XML special characters", () => {
    expect(escapeXml('A & B < C > D "E" \'F\'')).toBe(
      "A &amp; B &lt; C &gt; D &quot;E&quot; &apos;F&apos;"
    );
  });

  it("passes through plain text unchanged", () => {
    expect(escapeXml("Hello World 123")).toBe("Hello World 123");
  });

  it("escapes ampersand before other entities (order matters)", () => {
    expect(escapeXml("already &lt; encoded")).toBe("already &amp;lt; encoded");
  });
});

describe("buildSystemPrompt", () => {
  it("phone channel includes phone instructions, not SMS", () => {
    const prompt = buildSystemPrompt("phone", false);
    expect(prompt).toContain("Phone Conversation Mode");
    expect(prompt).toContain("1-3 sentences maximum");
    expect(prompt).not.toContain("SMS Conversation Mode");
  });

  it("sms channel includes SMS instructions, not phone", () => {
    const prompt = buildSystemPrompt("sms", false);
    expect(prompt).toContain("SMS Conversation Mode");
    expect(prompt).toContain("300 characters");
    expect(prompt).not.toContain("Phone Conversation Mode");
  });

  it("admin flag adds admin note", () => {
    expect(buildSystemPrompt("phone", true)).toContain("## Admin Note");
    expect(buildSystemPrompt("phone", false)).not.toContain("## Admin Note");
  });

  it("always includes no-calculation directive", () => {
    for (const prompt of [buildSystemPrompt("phone", false), buildSystemPrompt("sms", true)]) {
      expect(prompt).toContain("NEVER perform financial calculations yourself");
    }
  });
});
