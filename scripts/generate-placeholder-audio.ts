/**
 * Generate minimal valid MP3 placeholder files (silent) for Zen Mode.
 *
 * Creates ~1 second of silence as valid MPEG Layer 3 audio.
 * These are meant as placeholders — replace with real ambient audio
 * for the best experience. See public/audio/README.md for sources.
 *
 * Usage: bun run scripts/generate-placeholder-audio.ts
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

const outputDir = join(import.meta.dir, '..', 'public', 'audio')

// Ensure output directory exists
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true })
}

/**
 * Build a minimal valid MP3 file containing silent frames.
 *
 * MP3 frame structure (MPEG1 Layer3, 128kbps, 44100Hz, stereo):
 * - Sync word: 0xFF 0xFB (11 sync bits + MPEG1 + Layer3 + no CRC)
 * - Bitrate index 1001 (128kbps), Sample rate 00 (44100Hz), padding 0, private 0
 * - Channel mode 00 (stereo), mode ext 00, copyright 0, original 1, emphasis 00
 *
 * Frame header bytes: FF FB 90 04
 * Frame size for 128kbps @ 44100Hz = 417 bytes (no padding) or 418 (with padding)
 * We use 417 bytes per frame. ~38 frames per second at 44100Hz.
 */
function generateSilentMp3(durationSeconds: number): Buffer {
  const FRAME_HEADER = Buffer.from([0xff, 0xfb, 0x90, 0x04])
  const FRAME_SIZE = 417 // bytes per frame (128kbps, 44100Hz, no padding)
  const FRAMES_PER_SECOND = Math.ceil(44100 / 1152) // ~38.28 frames/sec for MPEG1 Layer3
  const totalFrames = Math.ceil(durationSeconds * FRAMES_PER_SECOND)

  const frameBody = Buffer.alloc(FRAME_SIZE - FRAME_HEADER.length, 0) // silent data
  const frames: Buffer[] = []

  for (let i = 0; i < totalFrames; i++) {
    frames.push(FRAME_HEADER, frameBody)
  }

  return Buffer.concat(frames)
}

const files = ['rain.mp3', 'white-noise.mp3', 'deep-focus.mp3']
const silentMp3 = generateSilentMp3(1)

for (const file of files) {
  const filePath = join(outputDir, file)
  writeFileSync(filePath, silentMp3)
  console.log(`Created: ${filePath} (${silentMp3.length} bytes)`)
}

console.log('\nDone! Placeholder audio files created.')
console.log('Replace these with real ambient audio for the best experience.')
console.log('See public/audio/README.md for recommended sources.')
