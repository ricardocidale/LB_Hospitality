#!/usr/bin/env npx ts-node
/**
 * Test TTS with a voice — generates audio and saves to file.
 * Usage: ELEVENLABS_API_KEY=xxx npx ts-node .claude/skills/elevenlabs/scripts/test-tts.ts <voice_id> [text] [output.mp3]
 */
import { ElevenLabsClient } from "elevenlabs";
import fs from "fs";

async function main() {
  const voiceId = process.argv[2];
  const text = process.argv[3] || "Hello! This is a test of the ElevenLabs text to speech system.";
  const outputFile = process.argv[4] || "test-output.mp3";

  if (!voiceId) {
    console.error("Usage: test-tts.ts <voice_id> [text] [output.mp3]");
    process.exit(1);
  }

  const client = new ElevenLabsClient({
    apiKey: process.env.ELEVENLABS_API_KEY,
  });

  console.log(`Voice: ${voiceId}`);
  console.log(`Text: "${text}"`);
  console.log(`Output: ${outputFile}`);
  console.log("Generating...");

  const audio = await client.textToSpeech.convert(voiceId, {
    text,
    modelId: "eleven_flash_v2_5",
    outputFormat: "mp3_44100_128",
  });

  const chunks: Buffer[] = [];
  for await (const chunk of audio as AsyncIterable<Buffer>) {
    chunks.push(Buffer.from(chunk));
  }

  const buffer = Buffer.concat(chunks);
  fs.writeFileSync(outputFile, buffer);

  console.log(`Done! Saved ${buffer.length} bytes to ${outputFile}`);
}

main().catch(console.error);
