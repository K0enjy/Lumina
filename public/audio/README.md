# Zen Mode — Ambient Audio Files

This directory contains audio files for Lumina's Zen Mode ambient soundscapes.

## Current State

Placeholder files (1 second of silence) are included so the app runs without errors:

- `rain.mp3` — placeholder (silent)
- `white-noise.mp3` — placeholder (silent)
- `deep-focus.mp3` — placeholder (silent)

**Replace these with real ambient audio for the best experience.**

## Requirements

- **Format:** MP3
- **Duration:** At least 30 seconds (tracks loop automatically)
- **Style:** Ambient, calming, suitable for background listening while writing
- **File names must match exactly:** `rain.mp3`, `white-noise.mp3`, `deep-focus.mp3`

## Quick Setup (Under 5 Minutes)

### Option 1: Pixabay (No account required)

1. **Rain:** Go to [pixabay.com/sound-effects/search/rain ambient](https://pixabay.com/sound-effects/search/rain%20ambient/) — download a rain loop, rename to `rain.mp3`
2. **White Noise:** Go to [pixabay.com/sound-effects/search/white noise](https://pixabay.com/sound-effects/search/white%20noise/) — download a white noise track, rename to `white-noise.mp3`
3. **Deep Focus:** Go to [pixabay.com/music/search/ambient lo-fi](https://pixabay.com/music/search/ambient%20lo-fi/) — download a lo-fi/ambient track, rename to `deep-focus.mp3`

### Option 2: Mixkit (No account required)

1. Visit [mixkit.co/free-sound-effects/rain](https://mixkit.co/free-sound-effects/rain/)
2. Download a rain ambience sound, rename to `rain.mp3`
3. Visit [mixkit.co/free-sound-effects/nature](https://mixkit.co/free-sound-effects/nature/) for white noise alternatives
4. Visit [mixkit.co/free-stock-music/ambient](https://mixkit.co/free-stock-music/ambient/) for a deep focus track

### Option 3: Freesound (Free account required)

1. Go to [freesound.org](https://freesound.org) and create a free account
2. Search for: `rain loop`, `white noise`, `ambient focus`
3. Download, convert to MP3 if needed, and rename to match the file names above

## After Downloading

Drop the three MP3 files into this directory (`public/audio/`), replacing the silent placeholders. No code changes needed — the AudioPlayer will pick them up automatically.

## Regenerating Placeholders

If you need to regenerate the silent placeholder files:

```bash
bun run scripts/generate-placeholder-audio.ts
```
