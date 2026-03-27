import React from 'react'
import { AbsoluteFill, Audio, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Video } from 'remotion'

export type ShortScriptAudioPreviewProps = {
  title: string
  script: string
  audioUrl?: string
  companyBadges?: string[]
  highlightKeywords?: string[]
  positiveHighlightKeywords?: string[]
  negativeHighlightKeywords?: string[]
  stylePreset?: 'flash' | 'data' | 'story'
  clips?: Array<{
    sentenceIdx: number[]
    images?: Array<{ url: string }>
    imageWithText?: boolean
    useRandomImages?: boolean
    transition?: 'fade' | 'slide-left' | 'slide-right' | 'zoom-in' | 'zoom-out' | 'pan-left-right' | 'pan-right-left' | 'pan-top-bottom' | 'pan-bottom-top' | 'zoom' | 'slide'
  }>
  sentences?: string[]
  sentenceFrames?: number[]
  perSentenceSec?: number
  showBackgroundVideo?: boolean
  transitionMode?: 'single' | 'cycle_images' | 'cycle_time' | 'hybrid'
  inheritClipTransitions?: boolean
  transitionSet?: Array<
    | 'fade'
    | 'slide-left'
    | 'slide-right'
    | 'zoom-in'
    | 'zoom-out'
    | 'zoom'
    | 'pan-left-right'
    | 'pan-right-left'
    | 'pan-top-bottom'
    | 'pan-bottom-top'
  >
  imagesPerTransition?: number
  secondsPerTransition?: number
  minTransitionDurationSec?: number
  skipShortTransitions?: boolean
  shortTransitionFallback?: 'fade' | 'none' | 'slide-left' | 'slide-right' | 'zoom-in' | 'zoom-out' | 'zoom' | 'pan-left-right' | 'pan-right-left' | 'pan-top-bottom' | 'pan-bottom-top'
  timeline?: {
    segments?: Array<{
      path?: string
      durationSec?: number
      transition?: string
      imageWithText?: boolean
      startIdx?: number
      endIdx?: number
      imageIdx?: number
      imagesInRange?: number
    }>
    overlays?: Array<{
      startSec?: number
      endSec?: number
      text?: string
      showFooter?: boolean
    }>
    totalFrames?: number
  }
  mediaOverlays?: Array<{
    type: 'image' | 'video'
    url: string
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
    size: 'sm' | 'md' | 'lg'
    startSec: number
    endSec: number
    animation?: 'none' | 'fade'
    scheduleMode?: 'single' | 'interval' | 'timeline_list' | 'random'
    repeat?: boolean
    repeatEverySec?: number
    timelineStarts?: string
    randomCount?: number
    randomDurationSec?: number
    label?: string
  }>
}

export const defaultShortScriptAudioPreviewProps: ShortScriptAudioPreviewProps = {
  title: 'R4D News',
  script:
    'Namaskar dosto. Quick market bulletin mein aaj ke key points dekhte hain. Dhanyavaad for watching.',
  audioUrl: '',
  stylePreset: 'flash',
  transitionMode: 'single',
  inheritClipTransitions: true,
  transitionSet: ['fade', 'zoom', 'pan-left-right'],
  imagesPerTransition: 5,
  secondsPerTransition: 10,
  minTransitionDurationSec: 1,
  skipShortTransitions: true,
  shortTransitionFallback: 'fade'
  ,
  mediaOverlays: []
}

const AUTO_HIGHLIGHT_REGEX =
  /(\b\d+(?:\.\d+)?\s*%|\b(?:rs\.?|inr)\s*\d[\d,]*(?:\.\d+)?|\b\d[\d,]*(?:\.\d+)?\s*(?:rs\.?|inr)|\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b|\b\d{4}-\d{2}-\d{2}\b|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)\s+\d{1,2}(?:,)?\s+\d{4}\b)/gi

const paletteByPreset = (stylePreset: 'flash' | 'data' | 'story') => {
  if (stylePreset === 'data') {
    return {
      bg: 'radial-gradient(circle at 15% 12%, rgba(34,197,94,0.22), transparent 35%), radial-gradient(circle at 85% 82%, rgba(56,189,248,0.2), transparent 36%), linear-gradient(150deg, #0f172a 0%, #111827 48%, #0b1220 100%)',
      panel: 'rgba(2,6,23,0.62)',
      pillBorder: 'rgba(34,197,94,0.5)',
      pillText: '#86efac'
    }
  }
  if (stylePreset === 'story') {
    return {
      bg: 'radial-gradient(circle at 15% 12%, rgba(251,191,36,0.22), transparent 35%), radial-gradient(circle at 85% 82%, rgba(244,114,182,0.2), transparent 36%), linear-gradient(150deg, #1f2937 0%, #111827 48%, #0f172a 100%)',
      panel: 'rgba(31,41,55,0.64)',
      pillBorder: 'rgba(251,191,36,0.5)',
      pillText: '#fde68a'
    }
  }
  return {
    bg: 'radial-gradient(circle at 15% 12%, rgba(56,189,248,0.2), transparent 35%), radial-gradient(circle at 85% 82%, rgba(251,191,36,0.2), transparent 36%), linear-gradient(150deg, #0f172a 0%, #111827 48%, #1f2937 100%)',
    panel: 'rgba(2,6,23,0.62)',
    pillBorder: 'rgba(251,191,36,0.45)',
    pillText: '#fde68a'
  }
}

const extractBulletItems = (text: string) => {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)

  const bullets = lines
    .map(line => line.replace(/^[-*•]\s+|^\d+[.)]\s+/, '').trim())
    .filter((line, idx) => /^[-*•]\s+/.test(lines[idx]) || /^\d+[.)]\s+/.test(lines[idx]))

  if (bullets.length >= 2) return bullets.slice(0, 6)
  return []
}

export const ShortScriptAudioPreviewComposition: React.FC<ShortScriptAudioPreviewProps> = ({
  title,
  script,
  audioUrl,
  companyBadges = [],
  highlightKeywords = [],
  positiveHighlightKeywords = [],
  negativeHighlightKeywords = [],
  stylePreset = 'flash',
  clips = [],
  sentences: providedSentences,
  sentenceFrames: providedSentenceFrames,
  perSentenceSec,
  showBackgroundVideo = true,
  transitionMode = 'single',
  inheritClipTransitions = true,
  transitionSet = ['fade', 'zoom', 'pan-left-right'],
  imagesPerTransition = 5,
  secondsPerTransition = 10,
  minTransitionDurationSec = 1,
  skipShortTransitions = true,
  shortTransitionFallback = 'fade',
  timeline,
  mediaOverlays = []
}) => {
  const frame = useCurrentFrame()
  const { fps, durationInFrames, width, height } = useVideoConfig()
  const isShort = height > width

  const palette = paletteByPreset(stylePreset)
  const entry = spring({ frame, fps, config: { damping: 180 } })
  const fadeOut = interpolate(frame, [durationInFrames - 16, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  })
  const cardY = interpolate(entry, [0, 1], [20, 0])
  const cardX = interpolate(entry, [0, 1], [36, 0])
  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  })

  const displayText = String(script || '').trim()
  const bulletItems = extractBulletItems(displayText)
  const listMode = bulletItems.length > 0
  const sentences =
    Array.isArray(providedSentences) && providedSentences.length
      ? providedSentences.map(s => String(s || '').trim()).filter(Boolean)
      : displayText
          .split(/[.!?।|]+/)
          .map(s => s.trim())
          .filter(Boolean)
  const lineCount = Math.max(1, sentences.length)
  const wordCounts = sentences.map(sentence => sentence.split(/\s+/).filter(Boolean).length)
  const totalWords = wordCounts.reduce((sum, count) => sum + count, 0)
  const weightedFrames = React.useMemo(() => {
    const fixedFrames =
      Array.isArray(providedSentenceFrames) && providedSentenceFrames.length === lineCount
        ? providedSentenceFrames.map(val => Math.max(1, Math.round(Number(val || 1))))
        : null
    if (fixedFrames && fixedFrames.length) {
      const sumFrames = fixedFrames.reduce((sum, count) => sum + count, 0)
      const diff = durationInFrames - sumFrames
      if (diff === 0) return fixedFrames
      const next = fixedFrames.slice()
      const step = diff > 0 ? 1 : -1
      for (let i = 0; i < Math.abs(diff); i += 1) {
        const idx = i % next.length
        next[idx] = Math.max(1, next[idx] + step)
      }
      return next
    }

    if (!totalWords) {
      const fallback = Math.max(6, Math.floor(durationInFrames / lineCount))
      return new Array(lineCount).fill(fallback)
    }

    const baseFrames = wordCounts.map(count => Math.max(1, Math.round((count / totalWords) * durationInFrames)))
    const sumFrames = baseFrames.reduce((sum, count) => sum + count, 0)
    const diff = durationInFrames - sumFrames
    if (diff === 0) return baseFrames
    const next = baseFrames.slice()
    const step = diff > 0 ? 1 : -1
    for (let i = 0; i < Math.abs(diff); i += 1) {
      const idx = i % next.length
      next[idx] = Math.max(1, next[idx] + step)
    }
    return next
  }, [durationInFrames, lineCount, providedSentenceFrames, totalWords, wordCounts])
  const sentenceBoundaries = React.useMemo(() => {
    const boundaries: number[] = []
    let acc = 0
    weightedFrames.forEach(count => {
      acc += count
      boundaries.push(acc)
    })
    return boundaries
  }, [weightedFrames])
  const timelineOverlays = React.useMemo(
    () =>
      (Array.isArray(timeline?.overlays) ? timeline.overlays : [])
        .map(item => ({
          startSec: Math.max(0, Number(item?.startSec || 0)),
          endSec: Math.max(0, Number(item?.endSec || 0)),
          text: String(item?.text || '').trim(),
          showFooter: Boolean(item?.showFooter)
        }))
        .filter(item => item.endSec > item.startSec),
    [timeline]
  )
  const currentLineIdx = Math.min(
    lineCount - 1,
    Math.max(0, sentenceBoundaries.findIndex(boundary => frame < boundary))
  )
  const currentLineStart = currentLineIdx > 0 ? sentenceBoundaries[currentLineIdx - 1] : 0
  const currentLineDuration = Math.max(1, weightedFrames[currentLineIdx] || 1)
  const currentLine = sentences[currentLineIdx] || displayText
  const activeTimelineOverlay =
    timelineOverlays.find(item => frame / fps >= item.startSec && frame / fps < item.endSec) || null
  const resolvedLine = String(activeTimelineOverlay?.text || currentLine || '').trim() || currentLine
  const resolvedLineStart = activeTimelineOverlay
    ? Math.max(0, Math.round(Number(activeTimelineOverlay.startSec || 0) * fps))
    : currentLineStart
  const resolvedLineDuration = activeTimelineOverlay
    ? Math.max(1, Math.round((Number(activeTimelineOverlay.endSec || 0) - Number(activeTimelineOverlay.startSec || 0)) * fps))
    : currentLineDuration
  const lineFade = interpolate(
    frame - resolvedLineStart,
    [0, 4, Math.max(1, resolvedLineDuration - 4), resolvedLineDuration],
    [0, 1, 1, 0],
    {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
    }
  )
  const lineReveal = interpolate(
    frame - resolvedLineStart,
    [0, Math.max(1, resolvedLineDuration - 4)],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )
  const lineWords = resolvedLine.split(/\s+/).filter(Boolean)
  const wordProgress = interpolate(
    frame - resolvedLineStart,
    [0, Math.max(1, resolvedLineDuration - 4)],
    [0, lineWords.length],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )
  const wordsToShow = Math.max(1, Math.floor(wordProgress))
  const currentLinePreview = lineWords.slice(0, wordsToShow).join(' ')
  const titleLabel = String(title || '').trim()

  const isBroadcast = stylePreset === 'flash'
  const headline = (titleLabel || sentences[0] || 'Breaking News').slice(0, 110)
  const tickerText = (displayText || '').replace(/\s+/g, ' ').slice(0, 420)
  const tickerOffset = interpolate(frame, [0, durationInFrames], [0, -1200], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  })
  const bulletColors = ['#ef4444', '#84cc16', '#06b6d4', '#a855f7', '#f97316', '#22c55e']
  const activeIdx = listMode ? Math.min(bulletItems.length - 1, Math.floor(progress * bulletItems.length * 1.02)) : 0
  const derivedBullets = sentences.slice(0, 4)
  const takeawayItems = listMode ? bulletItems : derivedBullets
  const badges = (Array.isArray(companyBadges) ? companyBadges : [])
    .map(item => String(item || '').trim())
    .filter(Boolean)
    .slice(0, 10)
  const dateLabel = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date())
  const bgVideoUrl = staticFile('images/news/news-channel-starting-video.mp4')
  const clipRanges = React.useMemo(() => {
    if (!clips.length) return []
    return clips
      .map(clip => {
        const indices = Array.isArray(clip.sentenceIdx) ? clip.sentenceIdx.slice().sort((a, b) => a - b) : []
        if (!indices.length) return null
        const startIdx = indices[0]
        const endIdx = indices[indices.length - 1]
        return {
          startIdx,
          endIdx,
          images: Array.isArray(clip.images) ? clip.images : [],
          imageWithText: Boolean(clip.imageWithText),
          useRandomImages: Boolean(clip.useRandomImages),
          transition: clip.transition || 'fade'
        }
      })
      .filter(Boolean) as Array<{
        startIdx: number
        endIdx: number
        images: Array<{ url: string }>
        imageWithText: boolean
        useRandomImages: boolean
        transition: 'fade' | 'slide-left' | 'slide-right' | 'zoom-in' | 'zoom-out' | 'pan-left-right' | 'pan-right-left' | 'pan-top-bottom' | 'pan-bottom-top' | 'zoom' | 'slide'
      }>
  }, [clips])
  const allClipImages = React.useMemo(
    () => clipRanges.flatMap(range => (Array.isArray(range.images) ? range.images : [])),
    [clipRanges]
  )
  const seedKey = `${titleLabel}:${displayText}:${lineCount}`
  let seed = 0
  for (let i = 0; i < seedKey.length; i += 1) {
    seed = (seed * 31 + seedKey.charCodeAt(i)) % 100000
  }
  const fallbackImages = React.useMemo(() => [{ url: staticFile('news-background-tempalte.jpg') }], [])
  const previewSegments = React.useMemo(() => {
    const timelineSegments = (Array.isArray(timeline?.segments) ? timeline.segments : [])
      .map(item => ({
        path: String(item?.path || ''),
        durationSec: Math.max(1 / Math.max(1, fps), Number(item?.durationSec || 0)),
        transition: String(item?.transition || 'fade'),
        imageWithText: Boolean(item?.imageWithText),
        startIdx: Number.isFinite(Number(item?.startIdx)) ? Number(item?.startIdx) : 0,
        endIdx: Number.isFinite(Number(item?.endIdx)) ? Number(item?.endIdx) : 0,
        imageIdx: Number.isFinite(Number(item?.imageIdx)) ? Number(item?.imageIdx) : 0,
        imagesInRange: Number.isFinite(Number(item?.imagesInRange)) ? Number(item?.imagesInRange) : 1
      }))
      .filter(item => item.path && item.durationSec > 0)

    if (timelineSegments.length) {
      let startFrame = 0
      return timelineSegments.map(item => {
        const durationFrames = Math.max(1, Math.round(item.durationSec * fps))
        const endFrame = startFrame + durationFrames
        const built = {
          startFrame,
          endFrame,
          durationFrames,
          durationSec: durationFrames / fps,
          imageIndex: Math.max(0, item.imageIdx),
          imagesInRange: Math.max(1, item.imagesInRange),
          url: item.path,
          imageWithText: item.imageWithText,
          transition: item.transition,
          startIdx: Math.max(0, item.startIdx),
          endIdx: Math.max(0, item.endIdx)
        }
        startFrame = endFrame
        return built
      })
    }

    const sourceClipRanges = clipRanges.length
      ? clipRanges
      : currentLineIdx <= 2
      ? [
          {
            startIdx: 0,
            endIdx: Math.min(2, lineCount - 1),
            images: fallbackImages,
            imageWithText: false,
            useRandomImages: false,
            transition: 'fade' as const
          }
        ]
      : []

    const transitionCatalog = [
      'fade',
      'slide-left',
      'slide-right',
      'zoom-in',
      'zoom-out',
      'zoom',
      'pan-left-right',
      'pan-right-left',
      'pan-top-bottom',
      'pan-bottom-top'
    ] as const
    const normalizedTransitionSet = (Array.isArray(transitionSet) ? transitionSet : [])
      .map(item => String(item))
      .filter(item => transitionCatalog.includes(item as any))
    const transitionSequence = normalizedTransitionSet.length ? normalizedTransitionSet : ['fade']
    const minDur = Math.max(0, Number(minTransitionDurationSec || 0))
    const imagesTarget = Math.max(1, Number(imagesPerTransition || 1))
    const timeTarget = Math.max(0.1, Number(secondsPerTransition || 0.1))

    let transitionIndex = 0
    let imageCount = 0
    let timeCount = 0

    const segments: Array<{
      startFrame: number
      endFrame: number
      durationFrames: number
      durationSec: number
      imageIndex: number
      imagesInRange: number
      url: string
      imageWithText: boolean
      transition: string
      startIdx: number
      endIdx: number
    }> = []

    sourceClipRanges.forEach(range => {
      const sentenceCount = Math.max(1, range.endIdx - range.startIdx + 1)
      let resolvedImages = Array.isArray(range.images) ? range.images : []

      if (range.useRandomImages && allClipImages.length) {
        const randomSet: Array<{ url: string }> = []
        for (let i = 0; i < sentenceCount; i += 1) {
          const idx = (seed + i * 17 + range.startIdx * 13) % allClipImages.length
          randomSet.push(allClipImages[idx])
        }
        resolvedImages = randomSet
      }

      const clipStartFrame = range.startIdx === 0 ? 0 : sentenceBoundaries[range.startIdx - 1] || 0
      const clipEndFrame = sentenceBoundaries[range.endIdx] || durationInFrames
      const clipDurationFrames = Math.max(1, clipEndFrame - clipStartFrame)
      const imagesToUse = resolvedImages.length ? resolvedImages : []

      if (!imagesToUse.length) return

      const segmentFrames = Math.max(1, Math.floor(clipDurationFrames / imagesToUse.length))
      imagesToUse.forEach((img, idx) => {
        const frameStart = clipStartFrame + idx * segmentFrames
        const frameEnd = idx === imagesToUse.length - 1 ? clipEndFrame : Math.min(clipEndFrame, clipStartFrame + (idx + 1) * segmentFrames)
        const durationFrames = Math.max(1, frameEnd - frameStart)
        const durationSec = durationFrames / fps
        const tooShort = skipShortTransitions && minDur > 0 && durationSec < minDur
        const transition = inheritClipTransitions
          ? range.transition || 'fade'
          : transitionMode === 'single'
          ? transitionSequence[0] || 'fade'
          : tooShort
          ? shortTransitionFallback === 'none'
            ? 'none'
            : shortTransitionFallback
          : transitionSequence[transitionIndex % transitionSequence.length]

        segments.push({
          startFrame: frameStart,
          endFrame: frameEnd,
          durationFrames,
          durationSec,
          imageIndex: idx,
          imagesInRange: imagesToUse.length,
          url: String(img?.url || ''),
          imageWithText: Boolean(range.imageWithText),
          transition,
          startIdx: range.startIdx,
          endIdx: range.endIdx
        })

        if (!inheritClipTransitions && transitionMode !== 'single' && !tooShort) {
          imageCount += 1
          timeCount += durationSec
          const hitImages = imageCount >= imagesTarget
          const hitTime = timeCount >= timeTarget
          if (
            (transitionMode === 'cycle_images' && hitImages) ||
            (transitionMode === 'cycle_time' && hitTime) ||
            (transitionMode === 'hybrid' && (hitImages || hitTime))
          ) {
            transitionIndex += 1
            imageCount = 0
            timeCount = 0
          }
        }
      })
    })

    return segments
  }, [
    allClipImages,
    clipRanges,
    currentLineIdx,
    durationInFrames,
    fallbackImages,
    fps,
    imagesPerTransition,
    inheritClipTransitions,
    lineCount,
    minTransitionDurationSec,
    secondsPerTransition,
    seed,
    sentenceBoundaries,
    shortTransitionFallback,
    skipShortTransitions,
    transitionMode,
    transitionSet
  ])
  const activeSegment =
    previewSegments.find(segment => frame >= segment.startFrame && frame < segment.endFrame) ||
    previewSegments[previewSegments.length - 1] ||
    null
  const hasClipImages = Boolean(activeSegment?.url)
  const showTextContainer = true
  const showImagePanel = hasClipImages && Boolean(activeSegment?.imageWithText) && !listMode
  const showFullscreenImage = hasClipImages && !Boolean(activeSegment?.imageWithText)
  const segmentFrames = Math.max(1, Number(activeSegment?.durationFrames || weightedFrames[0] || 1))
  const segmentProgress = Math.min(1, Math.max(0, (frame - Number(activeSegment?.startFrame || 0)) / Math.max(1, segmentFrames)))
  const segmentDurationSec = Number(activeSegment?.durationSec || segmentFrames / fps)
  const transIn = Math.min(1, segmentProgress * 1.4)
  const transOut = Math.max(0, (segmentProgress - 0.8) / 0.2)
  const zoomScaleIn = 1.3 - 0.3 * transIn
  const zoomScaleOut = 1 + 0.3 * transOut
  const zoomScale = transOut > 0 ? zoomScaleOut : zoomScaleIn
  const zoomInOutScale =
    segmentProgress <= 0.5 ? 1.3 - 0.6 * segmentProgress : 1 + 0.6 * (segmentProgress - 0.5)
  const slideDistance = isShort ? 60 : 80
  const panDistanceX = isShort ? 36 : 60
  const panDistanceY = isShort ? 28 : 48
  const panProgress = Math.min(1, Math.max(0, segmentProgress))
  const panShift = (panProgress - 0.5) * 2
  const panScale = 1.08

  const effectiveTransition = String(activeSegment?.transition || 'fade')

  const resolveImageStyle = () => {
    const transition = effectiveTransition
    let opacity = 1
    let transform = 'scale(1)'

    if (transition === 'fade') {
      opacity = 0.2 + 0.8 * transIn - 0.2 * transOut
    }
    if (transition === 'none') {
      opacity = 1
      transform = 'scale(1)'
      return { opacity, transform }
    }

    if (transition === 'slide-left') {
      transform = `translateX(${Math.round((1 - transIn) * slideDistance)}px)`
    } else if (transition === 'slide-right') {
      transform = `translateX(-${Math.round((1 - transIn) * slideDistance)}px)`
    } else if (transition === 'zoom-in') {
      transform = `scale(${1 + 0.12 * transIn})`
    } else if (transition === 'zoom-out') {
      transform = `scale(${1.12 - 0.12 * transIn})`
    } else if (transition === 'pan-left-right') {
      transform = `translateX(${Math.round(panShift * panDistanceX)}px) scale(${panScale})`
    } else if (transition === 'pan-right-left') {
      transform = `translateX(${Math.round(-panShift * panDistanceX)}px) scale(${panScale})`
    } else if (transition === 'pan-top-bottom') {
      transform = `translateY(${Math.round(panShift * panDistanceY)}px) scale(${panScale})`
    } else if (transition === 'pan-bottom-top') {
      transform = `translateY(${Math.round(-panShift * panDistanceY)}px) scale(${panScale})`
    } else if (transition === 'zoom') {
      transform = `scale(${zoomInOutScale})`
    } else if (transition === 'slide') {
      transform = `translateX(${Math.round((1 - transIn) * slideDistance)}px)`
    }

    return { opacity, transform }
  }
  const imageStyle = resolveImageStyle()
  const showFooter = activeTimelineOverlay ? activeTimelineOverlay.showFooter : currentLineIdx >= Math.max(0, lineCount - 3)
  const overlaySizeMap = isShort
    ? { sm: 120, md: 160, lg: 220 }
    : { sm: 140, md: 200, lg: 260 }
  const overlayMargin = isShort ? 24 : 36
  const overlayItems = React.useMemo(() => {
    const baseItems = (Array.isArray(mediaOverlays) ? mediaOverlays : []).filter(item => item && item.url)
    const totalDurationSec = durationInFrames / fps
    return baseItems.flatMap(item => {
      const startSec = Math.max(0, Number(item.startSec || 0))
      const endSec = Math.max(startSec + 0.01, Number(item.endSec || startSec + 0.01))
      const durationSec = Math.max(0.01, endSec - startSec)
      const scheduleMode = item.scheduleMode || (item.repeat ? 'interval' : 'single')
      if (scheduleMode === 'timeline_list') {
        const starts = String(item.timelineStarts || '')
          .split(',')
          .map(entry => Number(String(entry).trim()))
          .filter(value => Number.isFinite(value) && value >= 0)
        return starts.map(nextStart => ({
          ...item,
          startSec: nextStart,
          endSec: Math.min(totalDurationSec, nextStart + durationSec)
        }))
      }
      if (scheduleMode === 'random') {
        const count = Math.max(1, Number(item.randomCount || 1))
        const randomDurationSec = Math.max(0.5, Number(item.randomDurationSec || durationSec))
        const windowStart = startSec
        const windowEnd = Math.max(windowStart + randomDurationSec, endSec)
        const available = Math.max(0, windowEnd - windowStart - randomDurationSec)
        const seedSource = `${item.url}:${item.label || ''}:${item.position}:${item.size}`
        let seed = 0
        for (let i = 0; i < seedSource.length; i += 1) {
          seed = (seed * 31 + seedSource.charCodeAt(i)) % 2147483647
        }
        const randomStarts: number[] = []
        for (let i = 0; i < count; i += 1) {
          seed = (seed * 48271) % 2147483647
          const ratio = seed / 2147483647
          const nextStart = windowStart + ratio * available
          randomStarts.push(Number(nextStart.toFixed(3)))
        }
        randomStarts.sort((a, b) => a - b)
        return randomStarts.map(nextStart => ({
          ...item,
          startSec: nextStart,
          endSec: Math.min(totalDurationSec, nextStart + randomDurationSec)
        }))
      }
      if (scheduleMode !== 'interval') {
        return [{ ...item, startSec, endSec }]
      }
      const repeatEverySec = Math.max(durationSec, Number(item.repeatEverySec || 30))
      const expanded = []
      for (let nextStart = startSec; nextStart < totalDurationSec; nextStart += repeatEverySec) {
        expanded.push({
          ...item,
          startSec: nextStart,
          endSec: Math.min(totalDurationSec, nextStart + durationSec)
        })
      }
      return expanded
    })
  }, [mediaOverlays, durationInFrames, fps])
  const renderHighlighted = (value: string) => {
    const src = String(value || '')
    const keywords = (Array.isArray(highlightKeywords) ? highlightKeywords : [])
      .map(item => String(item || '').trim())
      .filter(Boolean)
    const positiveKeywords = (Array.isArray(positiveHighlightKeywords) ? positiveHighlightKeywords : [])
      .map(item => String(item || '').trim())
      .filter(Boolean)
    const negativeKeywords = (Array.isArray(negativeHighlightKeywords) ? negativeHighlightKeywords : [])
      .map(item => String(item || '').trim())
      .filter(Boolean)
    if (!keywords.length) {
      const autoParts = src.split(AUTO_HIGHLIGHT_REGEX)
      return autoParts.map((part, idx) => {
        if (!part) return null
        if (AUTO_HIGHLIGHT_REGEX.test(part)) {
          AUTO_HIGHLIGHT_REGEX.lastIndex = 0
          return (
            <span
              key={`ah-${idx}-${part}`}
              style={{
                background: 'rgba(250,204,21,0.35)',
                color: '#7c2d12',
                borderRadius: 6,
                padding: '0 4px',
                fontWeight: 900
              }}
            >
              {part}
            </span>
          )
        }
        AUTO_HIGHLIGHT_REGEX.lastIndex = 0
        return <span key={`an-${idx}`}>{part}</span>
      })
    }
    const escaped = keywords.map(item => item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    const regex = new RegExp(`(${escaped.join('|')})`, 'gi')
    const parts = src.split(regex)
    let explicitHit = false
    const rendered = parts.map((part, idx) => {
      if (!part) return null
      const token = part.toLowerCase().trim()
      const isExact = keywords.some(item => item.toLowerCase().trim() === token)
      if (isExact) {
        explicitHit = true
        const isPositive = positiveKeywords.some(item => item.toLowerCase().trim() === token)
        const isNegative = negativeKeywords.some(item => item.toLowerCase().trim() === token)
        const style = isPositive
          ? { background: 'rgba(34,197,94,0.26)', color: '#14532d' }
          : isNegative
          ? { background: 'rgba(239,68,68,0.26)', color: '#7f1d1d' }
          : { background: 'rgba(250,204,21,0.35)', color: '#7c2d12' }
        return (
          <span
            key={`h-${idx}-${part}`}
            style={{
              ...style,
              borderRadius: 6,
              padding: '0 4px',
              fontWeight: 900
            }}
          >
            {part}
          </span>
        )
      }
      return <span key={`n-${idx}`}>{part}</span>
    })
    if (explicitHit) return rendered

    const autoParts = src.split(AUTO_HIGHLIGHT_REGEX)
    return autoParts.map((part, idx) => {
      if (!part) return null
      if (AUTO_HIGHLIGHT_REGEX.test(part)) {
        AUTO_HIGHLIGHT_REGEX.lastIndex = 0
        return (
          <span
            key={`fh-${idx}-${part}`}
            style={{
              background: 'rgba(250,204,21,0.35)',
              color: '#7c2d12',
              borderRadius: 6,
              padding: '0 4px',
              fontWeight: 900
            }}
          >
            {part}
          </span>
        )
      }
      AUTO_HIGHLIGHT_REGEX.lastIndex = 0
      return <span key={`fn-${idx}`}>{part}</span>
    })
  }

  return (
    <AbsoluteFill
      style={{
        // background: isBroadcast ? '#0b1f3a' : palette.bg,
        color: '#f8fafc',
        fontFamily: stylePreset === 'data' ? "'IBM Plex Sans', 'Segoe UI', sans-serif" : "'Merriweather', Georgia, serif",
        opacity: fadeOut,
        overflow: 'hidden'
      }}
    >
      {showBackgroundVideo ? (
        <Video
          src={bgVideoUrl}
          style={{
            position: 'absolute',
            top: '-10%',
            left: 0,
            width: '100%',
            height: '110%',
            objectFit: 'cover',
            filter: 'none',
            transform: 'scale(1)',
            opacity: 1
          }}
        />
      ) : null}
      {showFullscreenImage ? (
        <div
          style={{
            position: 'absolute',
            top: isShort ? '20%' : 0,
            left: 0,
            width: '100%',
            height: isShort ? '60%' : '100%',
            overflow: 'hidden'
          }}
        >
          <Img
            src={String(activeSegment?.url || '')}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              opacity: imageStyle.opacity,
              transform: imageStyle.transform,
              filter: 'none'
            }}
          />
        </div>
      ) : null}
      {overlayItems.map((overlay, idx) => {
        const startFrame = Math.max(0, Math.round((overlay.startSec || 0) * fps))
        const endFrame = Math.max(startFrame + 1, Math.round((overlay.endSec || 0) * fps))
        if (frame < startFrame || frame > endFrame) return null
        const overlayDuration = Math.max(1, endFrame - startFrame)
        const localFrame = frame - startFrame
        const fadeIn = Math.min(1, localFrame / Math.min(10, overlayDuration / 3))
        const fadeOut = Math.min(1, (endFrame - frame) / Math.min(10, overlayDuration / 3))
        const opacity = overlay.animation === 'fade' ? Math.min(fadeIn, fadeOut) : 1
        const boxSize = overlaySizeMap[overlay.size || 'md'] || overlaySizeMap.md
        const pos = overlay.position || 'bottom-right'
        const style: React.CSSProperties = {
          position: 'absolute',
          width: boxSize,
          height: boxSize,
          opacity,
          objectFit: 'contain',
          zIndex: 30
        }
        if (pos === 'top-left') {
          style.top = overlayMargin
          style.left = overlayMargin
        } else if (pos === 'top-right') {
          style.top = overlayMargin
          style.right = overlayMargin
        } else if (pos === 'bottom-left') {
          style.bottom = overlayMargin
          style.left = overlayMargin
        } else if (pos === 'center') {
          style.top = '50%'
          style.left = '50%'
          style.transform = 'translate(-50%, -50%)'
        } else {
          style.bottom = overlayMargin
          style.right = overlayMargin
        }

        if (overlay.type === 'video') {
          return (
            <Video
              key={`overlay-${idx}`}
              src={overlay.url}
              style={style}
              muted
            />
          )
        }
        return <Img key={`overlay-${idx}`} src={overlay.url} style={style} />
      })}

      <AbsoluteFill style={{ background: 'transparent' }} />

      <AbsoluteFill
        style={{
          pointerEvents: 'none',
          background: 'transparent',
          transform: 'none'
        }}
      />

      <AbsoluteFill style={{ padding: isShort ? 28 : 64, justifyContent: 'flex-end' }}>
        {!isBroadcast ? (
          !listMode ? (
            <div
              style={{
                transform: `translateX(${cardX}px) translateY(${cardY}px)`,
                display: 'grid',
                gridTemplateColumns: showImagePanel ? '1fr 1fr' : '1fr',
                gap: isShort ? 18 : 26,
                alignItems: 'end',
                padding: isShort ? '0 16px' : '0 20px'
              }}
            >
              {showTextContainer ? (
                <div
                  style={{
                    border: '1px solid rgba(148,163,184,0.35)',
                    borderRadius: isShort ? 30 : 26,
                    background: palette.panel,
                    padding: isShort ? '20px 24px' : '18px 22px',
                    minHeight: isShort ? 200 : 220,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}
                >
                  <div
                    style={{
                      fontSize: isShort ? 56 : 44,
                      lineHeight: 1.24,
                      fontWeight: 700,
                      opacity: lineFade,
                      transition: 'opacity 0.2s linear',
                      overflow: 'hidden',
                      whiteSpace: 'normal',
                      clipPath: `inset(0 ${Math.max(0, 100 - lineReveal * 100)}% 0 0)`
                    }}
                  >
                    {currentLinePreview}
                  </div>
                </div>
              ) : null}
              {showImagePanel ? (
                <div
                  style={{
                    width: '100%',
                    height: isShort ? 360 : 420,
                    borderRadius: 20,
                    overflow: 'hidden',
                    border: '1px solid rgba(148,163,184,0.5)',
                    boxShadow: '0 14px 24px rgba(2,6,23,0.35)',
                    background: 'rgba(15,23,42,0.6)'
                  }}
                >
                  <Img
                    src={String(activeSegment?.url || '')}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      opacity: imageStyle.opacity,
                      transform: imageStyle.transform
                    }}
                  />
                </div>
              ) : null}
            </div>
          ) : (
            <div
              style={{
                transform: `translateX(${cardX}px) translateY(${cardY}px)`,
                width: '100%',
                borderRadius: isShort ? 10 : 6,
                border: '2px solid #5a7ea8',
                background: 'linear-gradient(145deg, rgba(198,220,242,0.58) 0%, rgba(173,201,229,0.52) 48%, rgba(188,212,236,0.56) 100%)',
                boxShadow: '0 14px 34px rgba(15,23,42,0.22)',
                padding: isShort ? '34px 34px' : '26px 28px',
                position: 'relative'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: -2,
                  left: -2,
                  width: 168,
                  height: 94,
                  borderTop: '10px solid #2f5f95',
                  borderLeft: '10px solid #2f5f95'
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: 168,
                  height: 94,
                  borderBottom: '10px solid #2f5f95',
                  borderRight: '10px solid #2f5f95'
                }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: isShort ? '148px 1fr' : '124px 1fr', gap: isShort ? 18 : 14, alignItems: 'start' }}>
                <div
                  style={{
                    width: isShort ? 148 : 124,
                    height: isShort ? 148 : 124,
                    color: '#2f5f95',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: isShort ? 106 : 88,
                    fontWeight: 800,
                    marginTop: 0
                  }}
                >
                  {'🌐'}
                </div>
                <div style={{ fontSize: isShort ? 68 : 56, fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', lineHeight: 1.04 }}>
                  {headline}
                </div>
              </div>
              <div style={{ display: 'grid', gap: isShort ? 12 : 8 }}>
                {badges.length > 0 ? (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 8,
                      marginBottom: 8
                    }}
                  >
                    {badges.map((item, idx) => (
                      <div
                        key={`${item}-${idx}`}
                        style={{
                          borderRadius: 999,
                          border: '1px solid rgba(47,95,149,0.55)',
                          background: 'rgba(15,23,42,0.08)',
                          padding: '4px 10px',
                          color: '#0f172a',
                          fontSize: isShort ? 24 : 22,
                          fontWeight: 700
                        }}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                ) : null}
                {takeawayItems.map((item, idx) => {
                  const isActive = idx === activeIdx
                  const rowSpring = spring({
                    fps,
                    frame: frame - idx * Math.max(7, Math.round(durationInFrames / 24)),
                    config: { damping: 210, stiffness: 130 }
                  })
                  const rowX = interpolate(rowSpring, [0, 1], [95, 0], {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp'
                  })
                  const rowOpacity = interpolate(rowSpring, [0, 1], [0, 1], {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp'
                  })
                  const separator = item.indexOf(':')
                  const lead = separator > 0 ? item.slice(0, separator + 1) : ''
                  const rest = separator > 0 ? item.slice(separator + 1).trim() : item
                  return (
                    <div
                      key={`${idx}-${item.slice(0, 10)}`}
                      style={{
                        transform: `translateX(${rowX}px)`,
                        opacity: isActive ? rowOpacity : rowOpacity * 0.62,
                        display: 'grid',
                        gridTemplateColumns: isShort ? '52px 1fr' : '44px 1fr',
                        gap: 8,
                        alignItems: 'start'
                      }}
                    >
                      <div style={{ color: '#2f5f95', fontSize: isShort ? 42 : 34, lineHeight: 1, marginTop: 4 }}>{'➤'}</div>
                      <div style={{ color: '#0f172a', fontSize: isActive ? (isShort ? 52 : 42) : isShort ? 42 : 34, lineHeight: 1.16, fontWeight: 700 }}>
                        {idx + 1}. {lead ? <span style={{ fontWeight: 900 }}>{lead}</span> : null}
                        {lead ? <span> {renderHighlighted(rest)}</span> : renderHighlighted(rest)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        ) : (
          <div style={{ transform: `translateX(${cardX}px) translateY(${cardY}px)`, width: '100%', height: '100%', position: 'relative' }}>
            <AbsoluteFill
              style={{
                opacity: 0.2,
                backgroundImage:
                  'linear-gradient(rgba(51,65,85,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(51,65,85,0.18) 1px, transparent 1px)',
                backgroundSize: '60px 60px'
              }}
            />
            <AbsoluteFill
              style={{
                opacity: 0.24,
                background:
                  'radial-gradient(circle at 85% 18%, rgba(191,219,254,0.35), transparent 42%), radial-gradient(circle at 15% 80%, rgba(186,230,253,0.3), transparent 38%)'
              }}
            />

            <div
              style={{
                position: 'absolute',
                left: 120,
                right: 120,
                top: 176,
                bottom: 170,
                borderRadius: 8,
                border: '3px solid rgba(241,245,249,0.97)',
                background: 'linear-gradient(145deg, rgba(248,250,252,0.96), rgba(226,232,240,0.92))',
                boxShadow: '0 20px 60px rgba(15,23,42,0.22)',
                padding: '28px 36px 20px 36px',
                overflow: 'hidden'
              }}
            >
              <div style={{ fontSize: 62, lineHeight: 1.05, color: '#0f172a', fontWeight: 900, marginBottom: 18, textTransform: 'uppercase' }}>
                {headline}
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                {badges.length > 0 ? (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 10,
                      marginBottom: 10
                    }}
                  >
                    {badges.map((item, idx) => (
                      <div
                        key={`${item}-${idx}`}
                        style={{
                          borderRadius: 999,
                          border: '2px solid rgba(59,130,246,0.45)',
                          background: 'rgba(255,255,255,0.75)',
                          padding: '5px 12px',
                          color: '#0f172a',
                          fontSize: 24,
                          fontWeight: 800
                        }}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                ) : null}
                {takeawayItems.map((item, idx) => {
                  const isActive = idx === activeIdx
                  const clr = bulletColors[idx % bulletColors.length]
                  const rowSpring = spring({
                    fps,
                    frame: frame - idx * Math.max(7, Math.round(durationInFrames / 24)),
                    config: { damping: 210, stiffness: 130 }
                  })
                  const rowX = interpolate(rowSpring, [0, 1], [120, 0], {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp'
                  })
                  const rowOpacity = interpolate(rowSpring, [0, 1], [0, 1], {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp'
                  })
                  return (
                    <div
                      key={`${idx}-${item.slice(0, 8)}`}
                      style={{
                        transform: `translateX(${rowX}px)`,
                        opacity: isActive ? rowOpacity : rowOpacity * 0.56,
                        display: 'grid',
                        gridTemplateColumns: '56px 1fr',
                        alignItems: 'start',
                        gap: 10
                      }}
                    >
                      <div style={{ color: clr, fontSize: 46, fontWeight: 900, lineHeight: 1 }}>{'>'}</div>
                      <div style={{ color: '#111827', fontSize: isActive ? 52 : 42, fontWeight: 800, lineHeight: 1.14 }}>
                        {idx + 1}. {renderHighlighted(item)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 64, display: 'grid', gap: 6 }}>
              <div
                style={{
                  borderTop: '3px solid rgba(185,28,28,0.85)',
                  borderBottom: '3px solid rgba(30,58,138,0.85)',
                  background: 'linear-gradient(90deg, rgba(127,29,29,0.9), rgba(30,58,138,0.92))',
                  color: '#f8fafc',
                  fontSize: 48,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  padding: '6px 16px'
                }}
              >
                Breaking: {headline}
              </div>
              <div
                style={{
                  overflow: 'hidden',
                  background: 'rgba(255,255,255,0.92)',
                  color: '#0f172a',
                  whiteSpace: 'nowrap',
                  padding: '8px 0',
                  borderTop: '2px solid rgba(148,163,184,0.55)',
                  borderBottom: '2px solid rgba(148,163,184,0.55)'
                }}
              >
                <div
                  style={{
                    display: 'inline-block',
                    transform: `translateX(${tickerOffset}px)`,
                    fontSize: 38,
                    fontWeight: 700,
                    letterSpacing: 0.3
                  }}
                >
                  {tickerText}      {tickerText}
                </div>
              </div>
              <div
                style={{
                  color: '#0f172a',
                  fontSize: 24,
                  textAlign: 'right',
                  paddingRight: 8,
                  fontWeight: 500
                }}
              >
                Not financial advice. For informational purposes only.
              </div>
            </div>
          </div>
        )}
      </AbsoluteFill>

      <div
        style={{
          position: 'absolute',
          top: isShort ? 26 : 22,
          left: isShort ? 26 : 36,
          display: 'grid',
          gridTemplateColumns: '10px 1fr',
          columnGap: 14,
          alignItems: 'center',
          padding: '12px 16px 12px 0',
          borderRadius: 10,
          background: 'linear-gradient(90deg, rgba(2,6,23,0.78), rgba(2,6,23,0))',
          borderLeft: '3px solid rgba(59,130,246,0.9)',
          boxShadow: '0 8px 20px rgba(2,6,23,0.35)'
        }}
      >
        <div style={{ width: 10, height: 90, borderRadius: 3, background: 'linear-gradient(180deg, #60a5fa, #fbbf24)' }} />
        <div>
          <div
            style={{
              fontSize: isShort ? 48 : 56,
              fontWeight: 900,
              color: '#e2e8f0',
              letterSpacing: 0.8,
              textTransform: 'uppercase',
              lineHeight: 1.05,
              textShadow: '0 4px 16px rgba(2,6,23,0.6)'
            }}
          >
            R4D News
          </div>
          <div
            style={{
              marginTop: 6,
              fontSize: isShort ? 24 : 28,
              color: '#93c5fd',
              fontWeight: 700,
              textTransform: 'uppercase',
              lineHeight: 1
            }}
          >
            Subscribe for daily updates
          </div>
        </div>
      </div>

      {showFooter ? (
      <div
        style={{
          position: 'absolute',
          left: isShort ? 22 : 40,
          right: isShort ? 22 : 40,
          bottom: isShort ? 38 : 32,
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          alignItems: 'center',
          gap: 16,
          padding: isShort ? '12px 16px' : '10px 18px',
          borderRadius: 14,
          background: 'linear-gradient(90deg, rgba(2,6,23,0.78), rgba(30,58,138,0.7))',
          border: '1px solid rgba(148,163,184,0.35)',
          boxShadow: '0 10px 24px rgba(2,6,23,0.35)'
        }}
      >
        <div
          style={{
            display: 'grid',
            gap: 4,
            color: '#e2e8f0'
          }}
        >
          <div style={{ fontSize: isShort ? 24 : 26, fontWeight: 800, letterSpacing: 0.4 }}>
            R4D News
          </div>
          <div style={{ fontSize: isShort ? 18 : 20, color: '#bae6fd', fontWeight: 600 }}>
            Thanks for watching • Like, Share & Subscribe
          </div>
        </div>
        <div
          style={{
            fontSize: isShort ? 20 : 22,
            fontWeight: 800,
            color: '#fbbf24',
            padding: '6px 14px',
            borderRadius: 999,
            border: '1px solid rgba(251,191,36,0.6)',
            background: 'rgba(15,23,42,0.55)',
            textTransform: 'uppercase',
            letterSpacing: 0.6
          }}
        >
          Subscribe
        </div>
      </div>
      ) : null}

      {audioUrl ? <Audio src={audioUrl} /> : null}
    </AbsoluteFill>
  )
}









