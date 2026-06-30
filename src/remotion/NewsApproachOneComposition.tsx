import React from 'react'
import { AbsoluteFill, Audio, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'

export type NewsApproachOneScene = {
  id?: number
  heading?: string
  onScreenText?: string
  narration?: string
  audioUrl?: string
  highlightKeywords?: string[]
  positiveHighlightKeywords?: string[]
  negativeHighlightKeywords?: string[]
}

export type NewsApproachOneProps = {
  title?: string
  scenes?: NewsApproachOneScene[]
}

export const defaultNewsApproachOneProps: NewsApproachOneProps = {
  title: 'Stock News Bulletin',
  scenes: [
    {
      id: 1,
      heading: 'Major Update',
      onScreenText:
        'Company announced a key business update. Management commentary indicates expected execution momentum in upcoming quarters.',
      audioUrl: ''
    }
  ]
}

const HIGHLIGHT_REGEX =
  /(\b\d+(?:\.\d+)?\s*%|\b(?:₹|rs\.?|inr)\s*\d[\d,]*(?:\.\d+)?|\b\d[\d,]*(?:\.\d+)?\s*(?:₹|rs\.?|inr)|\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b|\b\d{4}-\d{2}-\d{2}\b|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)\s+\d{1,2}(?:,)?\s+\d{4}\b)/gi

const isHighlightedFragment = (value: string) => {
  const fragment = String(value || '').trim()
  if (!fragment) return false
  
return /^(\d+(?:\.\d+)?\s*%|(?:₹|rs\.?|inr)\s*\d[\d,]*(?:\.\d+)?|\d[\d,]*(?:\.\d+)?\s*(?:₹|rs\.?|inr)|\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|\d{4}-\d{2}-\d{2}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)\s+\d{1,2}(?:,)?\s+\d{4})$/i.test(
    fragment
  )
}

const renderHighlightedText = (
  text: string,
  keywords: string[] = [],
  positiveKeywords: string[] = [],
  negativeKeywords: string[] = []
) => {
  const safeKeywords = (Array.isArray(keywords) ? keywords : [])
    .map(item => String(item || '').trim())
    .filter(Boolean)
  const safePositive = (Array.isArray(positiveKeywords) ? positiveKeywords : [])
    .map(item => String(item || '').trim())
    .filter(Boolean)
  const safeNegative = (Array.isArray(negativeKeywords) ? negativeKeywords : [])
    .map(item => String(item || '').trim())
    .filter(Boolean)
  if (safeKeywords.length > 0) {
    const escaped = safeKeywords.map(item => item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    const exactRegex = new RegExp(`(${escaped.join('|')})`, 'gi')
    const parts = String(text || '').split(exactRegex)
    
return parts.map((part, idx) => {
      if (!part) return null
      const token = part.toLowerCase().trim()
      const isExact = safeKeywords.some(item => item.toLowerCase().trim() === token)
      if (isExact) {
        const isPositive = safePositive.some(item => item.toLowerCase().trim() === token)
        const isNegative = safeNegative.some(item => item.toLowerCase().trim() === token)
        const style = isPositive
          ? { background: 'rgba(34,197,94,0.26)', color: '#14532d' }
          : isNegative
          ? { background: 'rgba(239,68,68,0.26)', color: '#7f1d1d' }
          : { background: 'rgba(250,204,21,0.35)', color: '#7c2d12' }
        
return (
          <span
            key={`kx-${idx}-${part}`}
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
      
return <span key={`kt-${idx}`}>{part}</span>
    })
  }

  const src = String(text || '')
  const parts = src.split(HIGHLIGHT_REGEX)
  
return parts.map((part, idx) => {
    if (!part) return null
    if (isHighlightedFragment(part)) {
      return (
        <span
          key={`hl-${idx}-${part}`}
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
    
return <span key={`tx-${idx}`}>{part}</span>
  })
}

export const NewsApproachOneComposition: React.FC<NewsApproachOneProps> = ({ title, scenes = [] }) => {
  const frame = useCurrentFrame()
  const { fps, durationInFrames, width, height } = useVideoConfig()
  const isShort = height > width
  const primary = scenes[0] || {}
  const script = String(primary?.onScreenText || primary?.narration || '').trim()
  const heading = String(primary?.heading || title || 'Major News Update').trim()
  const highlightKeywords = Array.isArray(primary?.highlightKeywords) ? primary.highlightKeywords : []
  const positiveHighlightKeywords = Array.isArray(primary?.positiveHighlightKeywords)
    ? primary.positiveHighlightKeywords
    : []
  const negativeHighlightKeywords = Array.isArray(primary?.negativeHighlightKeywords)
    ? primary.negativeHighlightKeywords
    : []
  const audioUrl = String(primary?.audioUrl || '').trim()
  const dateLabel = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date())
  const bgImageUrl = staticFile('stock_news_background.png')

  const entry = spring({ frame, fps, config: { damping: 170, stiffness: 120 } })
  const panelY = interpolate(entry, [0, 1], [24, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const panelX = interpolate(entry, [0, 1], [38, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const fadeOut = interpolate(frame, [durationInFrames - 16, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  })
  const reveal = interpolate(frame, [0, Math.max(1, durationInFrames - 22)], [0, script.length], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  })
  const shown = script.slice(0, Math.floor(reveal))

  return (
    <AbsoluteFill
      style={{
        color: '#0f172a',
        fontFamily: "'Merriweather', Georgia, serif",
        opacity: fadeOut,
        overflow: 'hidden'
      }}
    >
      <Img
        src={bgImageUrl}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
      />

      <AbsoluteFill
        style={{
          background:
            'radial-gradient(circle at 85% 15%, rgba(191,219,254,0.28), transparent 42%), radial-gradient(circle at 10% 80%, rgba(186,230,253,0.2), transparent 38%)'
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: isShort ? 30 : 24,
          left: isShort ? 20 : 30,
          display: 'grid',
          gridTemplateColumns: '8px 1fr',
          columnGap: 12,
          alignItems: 'start'
        }}
      >
        <div style={{ width: 8, height: 86, borderRadius: 2, background: '#0f4a8a' }} />
        <div>
          <div
            style={{
              fontSize: isShort ? 64 : 58,
              fontWeight: 900,
              color: '#0f3b73',
              letterSpacing: 0.6,
              textTransform: 'uppercase',
              lineHeight: 1
            }}
          >
            Stock News Bulletin
          </div>
          <div
            style={{
              marginTop: 6,
              fontSize: isShort ? 34 : 30,
              color: '#111827',
              fontWeight: 700,
              textTransform: 'uppercase',
              lineHeight: 1
            }}
          >
            Daily Headlines | {dateLabel}
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: isShort ? 34 : 120,
          right: isShort ? 34 : 120,
          top: isShort ? 224 : 182,
          bottom: isShort ? 110 : 124,
          transform: `translateX(${panelX}px) translateY(${panelY}px)`,
          borderRadius: 8,
          border: '3px solid rgba(47,95,149,0.8)',
          background: 'linear-gradient(145deg, rgba(220,236,251,0.72), rgba(186,213,238,0.66))',
          boxShadow: '0 16px 44px rgba(15,23,42,0.2)',
          padding: isShort ? '36px 36px' : '28px 34px',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -2,
            left: -2,
            width: 170,
            height: 92,
            borderTop: '10px solid #2f5f95',
            borderLeft: '10px solid #2f5f95'
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            width: 170,
            height: 92,
            borderBottom: '10px solid #2f5f95',
            borderRight: '10px solid #2f5f95'
          }}
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isShort ? '148px 1fr' : '124px 1fr',
            gap: isShort ? 18 : 14,
            alignItems: 'center',
            marginBottom: 16
          }}
        >
          <div
            style={{
              width: isShort ? 148 : 124,
              height: isShort ? 148 : 124,
              color: '#2f5f95',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: isShort ? 104 : 84,
              fontWeight: 800
            }}
          >
            {'\u{1F310}'}
          </div>
          <div
            style={{
              fontSize: isShort ? 60 : 50,
              fontWeight: 900,
              color: '#0f172a',
              textTransform: 'uppercase',
              lineHeight: 1.05,
              minHeight: isShort ? 148 : 124,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {heading}
          </div>
        </div>

        <div
          style={{
            fontSize: isShort ? 48 : 40,
            lineHeight: 1.32,
            color: '#0f172a',
            fontWeight: 700,
            whiteSpace: 'pre-wrap'
          }}
        >
          {renderHighlightedText(shown, highlightKeywords, positiveHighlightKeywords, negativeHighlightKeywords)}
        </div>
      </div>

      {audioUrl ? <Audio src={audioUrl} /> : null}
    </AbsoluteFill>
  )
}
