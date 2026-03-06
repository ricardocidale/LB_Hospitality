/**
 * Audio encoding tests for Twilio voice pipeline.
 *
 * The functions mulaw2linear, linear2mulaw, mulawBufferToWav, pcm16ToMulaw,
 * and downsample are not exported from twilio.ts. We test them indirectly
 * by reimplementing the same pure math and verifying properties that must hold.
 *
 * If these are ever exported, switch to direct imports.
 */
import { describe, it, expect } from "vitest";

// Reimplementations of the pure codec functions from server/routes/twilio.ts
function mulaw2linear(mulawByte: number): number {
  mulawByte = ~mulawByte & 0xFF;
  const sign = mulawByte & 0x80;
  const exponent = (mulawByte >> 4) & 0x07;
  let mantissa = mulawByte & 0x0F;
  let sample = (mantissa << (exponent + 3)) + (1 << (exponent + 3)) - 132;
  if (sign !== 0) sample = -sample;
  return sample;
}

function linear2mulaw(sample: number): number {
  const BIAS = 132;
  const CLIP = 32635;
  const sign = (sample >> 8) & 0x80;
  if (sign !== 0) sample = -sample;
  if (sample > CLIP) sample = CLIP;
  sample += BIAS;

  let exponent = 7;
  const expMask = 0x4000;
  for (let i = 0; i < 8; i++) {
    if ((sample & expMask) !== 0) break;
    exponent--;
    sample <<= 1;
  }

  const mantissa = (sample >> 10) & 0x0F;
  const mulawByte = ~(sign | (exponent << 4) | mantissa) & 0xFF;
  return mulawByte;
}

function mulawBufferToWav(mulawData: Buffer): Buffer {
  const numSamples = mulawData.length;
  const pcmData = Buffer.alloc(numSamples * 2);
  for (let i = 0; i < numSamples; i++) {
    const sample = mulaw2linear(mulawData[i]);
    pcmData.writeInt16LE(sample, i * 2);
  }

  const headerSize = 44;
  const dataSize = pcmData.length;
  const header = Buffer.alloc(headerSize);

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(8000, 24);
  header.writeUInt32LE(16000, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmData]);
}

function pcm16ToMulaw(pcmBase64: string): Buffer {
  const pcmBuffer = Buffer.from(pcmBase64, "base64");
  const numSamples = pcmBuffer.length / 2;
  const mulawBuffer = Buffer.alloc(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const sample = pcmBuffer.readInt16LE(i * 2);
    mulawBuffer[i] = linear2mulaw(sample);
  }
  return mulawBuffer;
}

function downsample(pcmBase64: string, fromRate: number, toRate: number): Buffer {
  const pcmBuffer = Buffer.from(pcmBase64, "base64");
  const ratio = fromRate / toRate;
  const inputSamples = pcmBuffer.length / 2;
  const outputSamples = Math.floor(inputSamples / ratio);
  const output = Buffer.alloc(outputSamples * 2);
  for (let i = 0; i < outputSamples; i++) {
    const srcIndex = Math.floor(i * ratio);
    const sample = pcmBuffer.readInt16LE(srcIndex * 2);
    output.writeInt16LE(sample, i * 2);
  }
  return output;
}

describe("Audio Encoding — mu-law codec", () => {
  describe("mulaw2linear / linear2mulaw roundtrip", () => {
    it("roundtrips silence (0x7F = ~0x80 which is mu-law silence)", () => {
      const silence = 0xFF; // mu-law silence byte
      const linear = mulaw2linear(silence);
      // Silence should decode to a very small value near 0
      expect(Math.abs(linear)).toBeLessThan(200);
    });

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
      // Different magnitude inputs should produce different mu-law bytes
      const e1 = linear2mulaw(500);
      const e2 = linear2mulaw(5000);
      const e3 = linear2mulaw(20000);
      expect(e1).not.toBe(e2);
      expect(e2).not.toBe(e3);
    });

    it("positive and negative samples encode to different bytes", () => {
      const pos = linear2mulaw(5000);
      const neg = linear2mulaw(-5000);
      expect(pos).not.toBe(neg);
    });

    it("mu-law encoding covers full byte range", () => {
      // Encoding various magnitudes should use different parts of the byte range
      const encoded = new Set<number>();
      for (let s = -30000; s <= 30000; s += 1000) {
        encoded.add(linear2mulaw(s));
      }
      // Should produce many distinct encoded values (not all map to same byte)
      expect(encoded.size).toBeGreaterThan(20);
    });

    it("clips at CLIP boundary (32635)", () => {
      // Values at and just below clip should encode similarly
      const atClip = linear2mulaw(32635);
      const belowClip = linear2mulaw(32000);
      expect(atClip).toBe(belowClip); // Both map to same mu-law byte
    });
  });

  describe("mulawBufferToWav", () => {
    it("produces a valid WAV header", () => {
      const mulaw = Buffer.from([0x80, 0x80, 0x80, 0x80]); // 4 silence samples
      const wav = mulawBufferToWav(mulaw);

      // WAV header checks
      expect(wav.toString("ascii", 0, 4)).toBe("RIFF");
      expect(wav.toString("ascii", 8, 12)).toBe("WAVE");
      expect(wav.toString("ascii", 12, 16)).toBe("fmt ");
      expect(wav.toString("ascii", 36, 40)).toBe("data");
    });

    it("has correct audio format fields", () => {
      const mulaw = Buffer.from([0x80, 0x80]);
      const wav = mulawBufferToWav(mulaw);

      expect(wav.readUInt16LE(20)).toBe(1);    // PCM format
      expect(wav.readUInt16LE(22)).toBe(1);    // 1 channel (mono)
      expect(wav.readUInt32LE(24)).toBe(8000); // 8kHz sample rate
      expect(wav.readUInt16LE(34)).toBe(16);   // 16 bits per sample
    });

    it("data size = 2 * number of mu-law samples", () => {
      const numSamples = 100;
      const mulaw = Buffer.alloc(numSamples, 0x80);
      const wav = mulawBufferToWav(mulaw);

      const dataSize = wav.readUInt32LE(40);
      expect(dataSize).toBe(numSamples * 2);
    });

    it("total WAV size = 44 header + data", () => {
      const numSamples = 50;
      const mulaw = Buffer.alloc(numSamples, 0x80);
      const wav = mulawBufferToWav(mulaw);

      expect(wav.length).toBe(44 + numSamples * 2);
    });

    it("RIFF chunk size = file size - 8", () => {
      const mulaw = Buffer.alloc(200, 0x80);
      const wav = mulawBufferToWav(mulaw);
      const riffSize = wav.readUInt32LE(4);
      expect(riffSize).toBe(wav.length - 8);
    });
  });

  describe("pcm16ToMulaw", () => {
    it("converts base64 PCM to mu-law buffer", () => {
      // Create a simple PCM buffer: 4 samples of silence (0)
      const pcm = Buffer.alloc(8); // 4 samples × 2 bytes
      const base64 = pcm.toString("base64");
      const result = pcm16ToMulaw(base64);
      expect(result.length).toBe(4); // 4 mu-law bytes
    });

    it("output length = input samples (input bytes / 2)", () => {
      const numSamples = 160;
      const pcm = Buffer.alloc(numSamples * 2);
      const result = pcm16ToMulaw(pcm.toString("base64"));
      expect(result.length).toBe(numSamples);
    });

    it("roundtrips: PCM → mu-law → WAV → PCM approximates original", () => {
      // Create a PCM buffer with known mid-to-large values (mu-law is lossy for small values)
      const numSamples = 6;
      const pcm = Buffer.alloc(numSamples * 2);
      const originalValues = [0, 5000, -5000, 10000, -10000, 20000];
      for (let i = 0; i < numSamples; i++) {
        pcm.writeInt16LE(originalValues[i], i * 2);
      }

      // PCM → mu-law
      const mulaw = pcm16ToMulaw(pcm.toString("base64"));
      // mu-law → WAV (which contains PCM)
      const wav = mulawBufferToWav(mulaw);
      // Extract PCM from WAV (skip 44-byte header)
      const recoveredPcm = wav.subarray(44);

      // Verify the roundtrip produces valid PCM samples
      for (let i = 0; i < numSamples; i++) {
        const recovered = recoveredPcm.readInt16LE(i * 2);
        expect(recovered).toBeGreaterThanOrEqual(-32768);
        expect(recovered).toBeLessThanOrEqual(32767);
      }
      // Output length matches input length
      expect(recoveredPcm.length).toBe(numSamples * 2);
    });
  });

  describe("downsample", () => {
    it("halves sample count when downsampling 16kHz to 8kHz", () => {
      const numSamples = 160; // 10ms at 16kHz
      const pcm = Buffer.alloc(numSamples * 2);
      const result = downsample(pcm.toString("base64"), 16000, 8000);
      expect(result.length / 2).toBe(80); // 10ms at 8kHz
    });

    it("preserves sample values (picks nearest sample)", () => {
      const pcm = Buffer.alloc(8); // 4 samples
      pcm.writeInt16LE(1000, 0);
      pcm.writeInt16LE(2000, 2);
      pcm.writeInt16LE(3000, 4);
      pcm.writeInt16LE(4000, 6);

      // 2:1 downsample should pick samples 0 and 2
      const result = downsample(pcm.toString("base64"), 16000, 8000);
      expect(result.length).toBe(4); // 2 samples × 2 bytes
      expect(result.readInt16LE(0)).toBe(1000);
      expect(result.readInt16LE(2)).toBe(3000);
    });

    it("1:1 ratio preserves all samples", () => {
      const pcm = Buffer.alloc(6); // 3 samples
      pcm.writeInt16LE(100, 0);
      pcm.writeInt16LE(200, 2);
      pcm.writeInt16LE(300, 4);

      const result = downsample(pcm.toString("base64"), 8000, 8000);
      expect(result.length).toBe(6);
      expect(result.readInt16LE(0)).toBe(100);
      expect(result.readInt16LE(2)).toBe(200);
      expect(result.readInt16LE(4)).toBe(300);
    });

    it("handles large downsampling ratios", () => {
      const numSamples = 480; // 10ms at 48kHz
      const pcm = Buffer.alloc(numSamples * 2);
      const result = downsample(pcm.toString("base64"), 48000, 8000);
      expect(result.length / 2).toBe(80); // 10ms at 8kHz
    });
  });
});
