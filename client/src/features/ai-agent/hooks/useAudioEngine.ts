import { useCallback, useEffect, useRef, useState } from "react"
import type { useAudioPlayer } from "@/features/ai-agent/components/audio-player"

export type AudioState = { isPlaying: boolean; volume: number; isDark: boolean }

export function useAudioEngine(playerApiRef: React.RefObject<ReturnType<typeof useAudioPlayer>>) {
  const isPlayingRef = useRef(false)
  const audioStateRef = useRef<AudioState>({ isPlaying: false, volume: 0.7, isDark: false })
  const audioDataRef = useRef<number[]>([])
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const audioBufferRef = useRef<AudioBuffer | null>(null)
  const scratchBufferRef = useRef<AudioBufferSourceNode | null>(null)
  const convolverRef = useRef<ConvolverNode | null>(null)
  const delayRef = useRef<DelayNode | null>(null)
  const feedbackRef = useRef<GainNode | null>(null)
  const wetGainRef = useRef<GainNode | null>(null)
  const dryGainRef = useRef<GainNode | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)
  const lowPassFilterRef = useRef<BiquadFilterNode | null>(null)
  const highPassFilterRef = useRef<BiquadFilterNode | null>(null)

  const [isDark, setIsDark] = useState(false)
  const [ambienceMode, setAmbienceMode] = useState(false)
  const [precomputedWaveform, setPrecomputedWaveform] = useState<number[]>([])

  useEffect(() => {
    const checkTheme = () => {
      const isDarkMode = document.documentElement.classList.contains("dark")
      setIsDark(isDarkMode)
    }
    checkTheme()
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    audioStateRef.current.isDark = isDark
  }, [isDark])

  const createImpulseResponse = (
    audioContext: AudioContext, duration: number, decay: number
  ) => {
    const sampleRate = audioContext.sampleRate
    const length = sampleRate * duration
    const impulse = audioContext.createBuffer(2, length, sampleRate)
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel)
      for (let i = 0; i < length; i++) {
        const envelope = Math.pow(1 - i / length, decay)
        const earlyReflections = i < length * 0.1 ? Math.random() * 0.5 : 0
        const diffusion = (Math.random() * 2 - 1) * envelope
        const stereoWidth = channel === 0 ? 0.9 : 1.1
        channelData[i] = (diffusion + earlyReflections) * stereoWidth * 0.8
      }
    }
    return impulse
  }

  const setupAudioContext = useCallback((ambience: boolean) => {
    if (!playerApiRef.current.ref.current) return
    if (
      audioContextRef.current && sourceRef.current &&
      wetGainRef.current && dryGainRef.current
    ) return

    try {
      let audioContext = audioContextRef.current
      let source = sourceRef.current
      let analyser = analyserRef.current

      if (!audioContext) {
        audioContext = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
        audioContextRef.current = audioContext
      }
      if (audioContext.state === "suspended") audioContext.resume()

      if (!source) {
        source = audioContext.createMediaElementSource(playerApiRef.current.ref.current)
        sourceRef.current = source
      }
      if (!analyser) {
        analyser = audioContext.createAnalyser()
        analyser.fftSize = 512
        analyser.smoothingTimeConstant = 0.7
        analyserRef.current = analyser
      }

      const convolver = audioContext.createConvolver()
      convolver.buffer = createImpulseResponse(audioContext, 6, 1.5)
      const delay = audioContext.createDelay(2)
      delay.delayTime.value = 0.001
      const feedback = audioContext.createGain()
      feedback.gain.value = 0.05
      const lowPassFilter = audioContext.createBiquadFilter()
      lowPassFilter.type = "lowpass"
      lowPassFilter.frequency.value = 1500
      lowPassFilter.Q.value = 0.5
      const highPassFilter = audioContext.createBiquadFilter()
      highPassFilter.type = "highpass"
      highPassFilter.frequency.value = 100
      highPassFilter.Q.value = 0.7
      const wetGain = audioContext.createGain()
      wetGain.gain.value = ambience ? 0.85 : 0
      const dryGain = audioContext.createGain()
      dryGain.gain.value = ambience ? 0.4 : 1
      const masterGain = audioContext.createGain()
      masterGain.gain.value = 1
      const compressor = audioContext.createDynamicsCompressor()
      compressor.threshold.value = -12
      compressor.knee.value = 2
      compressor.ratio.value = 8
      compressor.attack.value = 0.003
      compressor.release.value = 0.1

      try {
        source.disconnect()
        if (analyserRef.current) analyserRef.current.disconnect()
      } catch { /* ignore */ }

      source.connect(dryGain)
      dryGain.connect(masterGain)
      source.connect(highPassFilter)
      highPassFilter.connect(convolver)
      convolver.connect(delay)
      delay.connect(feedback)
      feedback.connect(lowPassFilter)
      lowPassFilter.connect(delay)
      delay.connect(wetGain)
      wetGain.connect(masterGain)
      masterGain.connect(compressor)
      compressor.connect(analyser)
      analyser.connect(audioContext.destination)

      convolverRef.current = convolver
      delayRef.current = delay
      feedbackRef.current = feedback
      wetGainRef.current = wetGain
      dryGainRef.current = dryGain
      masterGainRef.current = masterGain
      lowPassFilterRef.current = lowPassFilter
      highPassFilterRef.current = highPassFilter
    } catch (error) {
      console.error("Error setting up audio context:", error)
    }
  }, [])

  useEffect(() => {
    const handlePlay = () => {
      isPlayingRef.current = true
      audioStateRef.current.isPlaying = true
      if (!analyserRef.current) {
        setTimeout(() => setupAudioContext(ambienceMode), 100)
      }
    }
    const handlePause = () => {
      isPlayingRef.current = false
      audioStateRef.current.isPlaying = false
    }

    const checkInterval = setInterval(() => {
      const audioEl = playerApiRef.current.ref.current
      if (audioEl) {
        clearInterval(checkInterval)
        audioEl.addEventListener("play", handlePlay)
        audioEl.addEventListener("pause", handlePause)
        audioEl.addEventListener("ended", handlePause)
        if (!audioEl.paused) handlePlay()
      }
    }, 100)

    return () => {
      clearInterval(checkInterval)
      const audioEl = playerApiRef.current.ref.current
      if (audioEl) {
        audioEl.removeEventListener("play", handlePlay)
        audioEl.removeEventListener("pause", handlePause)
        audioEl.removeEventListener("ended", handlePause)
      }
    }
  }, [ambienceMode, setupAudioContext])

  useEffect(() => {
    if (!audioContextRef.current) return
    const targetWet = ambienceMode ? 0.7 : 0
    const targetDry = ambienceMode ? 0.5 : 1
    const currentTime = audioContextRef.current.currentTime

    if (wetGainRef.current && dryGainRef.current) {
      wetGainRef.current.gain.cancelScheduledValues(currentTime)
      dryGainRef.current.gain.cancelScheduledValues(currentTime)
      wetGainRef.current.gain.setValueAtTime(wetGainRef.current.gain.value, currentTime)
      dryGainRef.current.gain.setValueAtTime(dryGainRef.current.gain.value, currentTime)
      wetGainRef.current.gain.linearRampToValueAtTime(targetWet, currentTime + 0.5)
      dryGainRef.current.gain.linearRampToValueAtTime(targetDry, currentTime + 0.5)
    }
    if (feedbackRef.current) {
      feedbackRef.current.gain.cancelScheduledValues(currentTime)
      feedbackRef.current.gain.setValueAtTime(feedbackRef.current.gain.value, currentTime)
      feedbackRef.current.gain.linearRampToValueAtTime(ambienceMode ? 0.25 : 0.05, currentTime + 0.5)
    }
    if (delayRef.current) {
      delayRef.current.delayTime.cancelScheduledValues(currentTime)
      delayRef.current.delayTime.setValueAtTime(delayRef.current.delayTime.value, currentTime)
      delayRef.current.delayTime.linearRampToValueAtTime(ambienceMode ? 0.25 : 0.001, currentTime + 0.5)
    }
    if (lowPassFilterRef.current) {
      lowPassFilterRef.current.frequency.cancelScheduledValues(currentTime)
      lowPassFilterRef.current.frequency.setValueAtTime(lowPassFilterRef.current.frequency.value, currentTime)
      lowPassFilterRef.current.frequency.linearRampToValueAtTime(ambienceMode ? 800 : 1500, currentTime + 0.5)
      lowPassFilterRef.current.Q.linearRampToValueAtTime(ambienceMode ? 0.7 : 0.5, currentTime + 0.5)
    }
    if (highPassFilterRef.current) {
      highPassFilterRef.current.frequency.cancelScheduledValues(currentTime)
      highPassFilterRef.current.frequency.setValueAtTime(highPassFilterRef.current.frequency.value, currentTime)
      highPassFilterRef.current.frequency.linearRampToValueAtTime(ambienceMode ? 200 : 100, currentTime + 0.5)
    }
    if (masterGainRef.current) {
      masterGainRef.current.gain.cancelScheduledValues(currentTime)
      masterGainRef.current.gain.setValueAtTime(masterGainRef.current.gain.value, currentTime)
      masterGainRef.current.gain.linearRampToValueAtTime(ambienceMode ? 1.2 : 1, currentTime + 0.5)
    }
  }, [ambienceMode])

  useEffect(() => {
    let animationId: number
    const updateWaveform = () => {
      if (analyserRef.current && isPlayingRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
        analyserRef.current.getByteFrequencyData(dataArray)
        audioDataRef.current = Array.from(dataArray).map((value) => value / 255)
      } else if (!isPlayingRef.current && audioDataRef.current.length > 0) {
        audioDataRef.current = audioDataRef.current.map((v) => v * 0.9)
      }
      animationId = requestAnimationFrame(updateWaveform)
    }
    animationId = requestAnimationFrame(updateWaveform)
    return () => { if (animationId) cancelAnimationFrame(animationId) }
  }, [])

  const precomputeWaveform = useCallback(async (audioUrl: string) => {
    try {
      const response = await fetch(audioUrl)
      const arrayBuffer = await response.arrayBuffer()
      const offlineContext = new OfflineAudioContext(1, 44100 * 5, 44100)
      const audioBuffer = await offlineContext.decodeAudioData(arrayBuffer.slice(0))

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      }
      audioBufferRef.current = await audioContextRef.current.decodeAudioData(arrayBuffer)

      const channelData = audioBuffer.getChannelData(0)
      const totalBars = 600
      const samplesPerBar = Math.floor(channelData.length / totalBars)
      const waveformData: number[] = []
      for (let i = 0; i < totalBars; i++) {
        const start = i * samplesPerBar
        const end = start + samplesPerBar
        let sum = 0
        let count = 0
        for (let j = start; j < end && j < channelData.length; j += 100) {
          sum += Math.abs(channelData[j])
          count++
        }
        waveformData.push(Math.min(1, (count > 0 ? sum / count : 0) * 3))
      }
      setPrecomputedWaveform(waveformData)
    } catch (error) {
      console.error("Error precomputing waveform:", error)
    }
  }, [])

  const playScratchSound = useCallback((position: number, speed: number = 1) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }
    if (audioContextRef.current.state === "suspended") audioContextRef.current.resume()
    if (!audioBufferRef.current) return

    stopScratchSound()
    try {
      const source = audioContextRef.current.createBufferSource()
      source.buffer = audioBufferRef.current
      const startTime = Math.max(0, Math.min(audioBufferRef.current.duration - 0.1, position * audioBufferRef.current.duration))
      const filter = audioContextRef.current.createBiquadFilter()
      filter.type = "lowpass"
      filter.frequency.value = Math.max(800, 2500 - speed * 1500)
      filter.Q.value = 3
      source.playbackRate.value = Math.max(0.4, Math.min(2.5, 1 + speed * 0.5))
      const gainNode = audioContextRef.current.createGain()
      gainNode.gain.value = 1.0
      source.connect(filter)
      filter.connect(gainNode)
      gainNode.connect(audioContextRef.current.destination)
      source.start(0, startTime, 0.06)
      scratchBufferRef.current = source
    } catch (error) {
      console.error("Error playing scratch sound:", error)
    }
  }, [])

  const stopScratchSound = useCallback(() => {
    if (scratchBufferRef.current) {
      try { scratchBufferRef.current.stop() } catch { /* ignore */ }
      scratchBufferRef.current = null
    }
  }, [])

  return {
    isPlayingRef,
    audioStateRef,
    audioDataRef,
    isDark,
    ambienceMode,
    setAmbienceMode,
    precomputedWaveform,
    precomputeWaveform,
    playScratchSound,
    stopScratchSound,
  }
}
