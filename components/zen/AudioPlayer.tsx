'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { useZenMode } from '@/components/zen/ZenModeContext'

type SoundOption = {
  id: string
  label: string
  src: string
}

const SOUNDS: SoundOption[] = [
  { id: 'rain', label: 'Rain', src: '/audio/rain.mp3' },
  { id: 'white-noise', label: 'White Noise', src: '/audio/white-noise.mp3' },
  { id: 'deep-focus', label: 'Deep Focus', src: '/audio/deep-focus.mp3' },
]

export default function AudioPlayer() {
  const { isZen } = useZenMode()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [activeSound, setActiveSound] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.5)

  // Stop audio when exiting zen mode
  useEffect(() => {
    if (!isZen) {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
      setIsPlaying(false)
    }
  }, [isZen])

  // Sync volume to audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  const playSound = useCallback(
    (sound: SoundOption) => {
      // If same sound is clicked, toggle play/pause
      if (activeSound === sound.id) {
        if (isPlaying) {
          audioRef.current?.pause()
          setIsPlaying(false)
        } else {
          audioRef.current?.play().then(() => {
            setIsPlaying(true)
          }).catch(() => {
            setIsPlaying(false)
          })
        }
        return
      }

      // Switch to new sound
      if (audioRef.current) {
        audioRef.current.pause()
      }

      const audio = new Audio(sound.src)
      audio.loop = true
      audio.volume = volume
      audioRef.current = audio

      audio.play().then(() => {
        setIsPlaying(true)
      }).catch(() => {
        // Audio playback may be blocked by browser autoplay policy
        setIsPlaying(false)
      })

      setActiveSound(sound.id)
    },
    [activeSound, isPlaying, volume],
  )

  const togglePlayPause = useCallback(() => {
    if (!audioRef.current || !activeSound) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true)
      }).catch(() => {
        setIsPlaying(false)
      })
    }
  }, [isPlaying, activeSound])

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
  }, [])

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-full bg-[var(--surface)]/90 px-4 py-2 shadow-lg backdrop-blur-sm"
    >
      {/* Sound selection chips */}
      <div className="flex items-center gap-1.5">
        {SOUNDS.map((sound) => (
          <button
            key={sound.id}
            type="button"
            onClick={() => playSound(sound)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              activeSound === sound.id
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--bg)]/60 text-[var(--text-secondary)] hover:bg-[var(--bg)] hover:text-[var(--text)]'
            }`}
          >
            {sound.label}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="h-5 w-px bg-[var(--border)]" />

      {/* Play/Pause button */}
      <button
        type="button"
        onClick={togglePlayPause}
        disabled={!activeSound}
        className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:text-[var(--text)] disabled:opacity-40"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      {/* Volume slider */}
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        onChange={handleVolumeChange}
        className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-[var(--bg)]/60 accent-[var(--accent)]"
        aria-label="Volume"
      />
    </motion.div>
  )
}
