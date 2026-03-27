import React from 'react'
import { AbsoluteFill, Audio, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'

export type NewsApproachSequenceItem = {
  heading: string
  script: string
  audioUrl?: string
  category?: string
}

export type CompanyGroup = {
  category: string
  companies: string[]
}

export type NewsApproachSequenceProps = {
  title?: string
  dateLabel?: string
  items: NewsApproachSequenceItem[]
  sceneDurationsSec: number[]
  companyGroups?: CompanyGroup[]
}

export const defaultNewsApproachSequenceProps: NewsApproachSequenceProps = {
  title: "Today's Market Updates",
  dateLabel: '',
  items: [
    {
      heading: 'Market Opening',
      script: 'Welcome to today\'s market updates.',
      audioUrl: ''
    }
  ],
  sceneDurationsSec: [6],
  companyGroups: []
}

const HIGHLIGHT_REGEX =
  /(\b\d+(?:\.\d+)?\s*%|\b(?:₹|rs\.?|inr)\s*\d[\d,]*(?:\.\d+)?|\b\d[\d,]*(?:\.\d+)?\s*(?:₹|rs\.?|inr)|\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b|\b\d{4}-\d{2}-\d{2}\b|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)\s+\d{1,2}(?:,)?\s+\d{4}\b)/gi

const isHighlightedFragment = (value: string) => {
  const fragment = String(value || "").trim()
  if (!fragment) return false
  return /^(\d+(?:\.\d+)?\s*%|(?:₹|rs\.?|inr)\s*\d[\d,]*(?:\.\d+)?|\d[\d,]*(?:\.\d+)?\s*(?:₹|rs\.?|inr)|\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|\d{4}-\d{2}-\d{2}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)\s+\d{1,2}(?:,)?\s+\d{4})$/i.test(
    fragment
  )
}

const renderHighlightedText = (text: string) => {
  const src = String(text || "")
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

const ScenePanel: React.FC<{ heading: string; script: string; companyGroups?: CompanyGroup[] }> = ({ heading, script, companyGroups = [] }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const localFrame = Math.max(0, frame)
  const entry = spring({ frame: localFrame, fps, config: { damping: 175, stiffness: 120 } })
  const panelY = interpolate(entry, [0, 1], [24, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const panelX = interpolate(entry, [0, 1], [38, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const reveal = interpolate(localFrame, [0, 180], [0, script.length], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  })
  const shown = script.slice(0, Math.floor(reveal))

  return (
    <div
      style={{
        position: 'absolute',
        left: 120,
        right: 120,
        top: 182,
        bottom: 124,
        transform: `translateX(${panelX}px) translateY(${panelY}px)`,
        borderRadius: 8,
        border: '3px solid rgba(47,95,149,0.8)',
        background: 'linear-gradient(145deg, rgba(220,236,251,0.72), rgba(186,213,238,0.66))',
        boxShadow: '0 16px 44px rgba(15,23,42,0.2)',
        padding: '28px 34px',
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
          gridTemplateColumns: '124px 1fr',
          gap: 14,
          alignItems: 'center',
          marginBottom: 16
        }}
      >
        <div
          style={{
            width: 124,
            height: 124,
            color: '#2f5f95',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 84,
            fontWeight: 800
          }}
        >
          {'\u{1F310}'}
        </div>
        <div
          style={{
            fontSize: 50,
            fontWeight: 900,
            color: '#0f172a',
            textTransform: 'uppercase',
            lineHeight: 1.05,
            minHeight: 124,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {heading}
        </div>
      </div>

      <div
        style={{
          fontSize: 40,
          lineHeight: 1.32,
          color: '#0f172a',
          fontWeight: 700,
          whiteSpace: 'pre-wrap'
        }}
      >
        {renderHighlightedText(shown)}
      </div>

      {String(heading || '').toLowerCase() === 'market opening' && companyGroups.length > 0 ? (
        <div style={{ marginTop: 18, display: 'grid', gap: 8 }}>
          {companyGroups.slice(0, 6).map(group => (
            <div key={group.category} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div
                style={{
                  borderRadius: 999,
                  border: '1px solid rgba(47,95,149,0.65)',
                  background: 'rgba(15,23,42,0.08)',
                  padding: '4px 10px',
                  color: '#0f172a',
                  fontSize: 20,
                  fontWeight: 800,
                  textTransform: 'uppercase'
                }}
              >
                {group.category}
              </div>
              {group.companies.slice(0, 12).map((company, idx) => (
                <div
                  key={`${group.category}-${company}-${idx}`}
                  style={{
                    borderRadius: 999,
                    border: '1px solid rgba(47,95,149,0.55)',
                    background: 'rgba(241,245,249,0.84)',
                    color: '#0f172a',
                    padding: '4px 10px',
                    fontSize: 18,
                    fontWeight: 700
                  }}
                >
                  {company}
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export const NewsApproachSequenceComposition: React.FC<NewsApproachSequenceProps> = ({
  title = "Today's Market Updates",
  dateLabel,
  items,
  sceneDurationsSec,
  companyGroups = []
}) => {
  const { fps } = useVideoConfig()
  const bgImageUrl = staticFile('stock_news_background.png')
  const safeItems = (Array.isArray(items) ? items : []).filter(item => String(item?.script || '').trim())
  const durations = Array.isArray(sceneDurationsSec) ? sceneDurationsSec : []

  let cursor = 0
  const sequence = safeItems.map((item, index) => {
    const sec = Math.max(3, Number(durations[index] || 6))
    const durationInFrames = Math.max(1, Math.round(sec * fps))
    const out = { item, startFrame: cursor, durationInFrames }
    cursor += durationInFrames
    return out
  })

  return (
    <AbsoluteFill
      style={{
        color: '#0f172a',
        fontFamily: "'Merriweather', Georgia, serif",
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
          top: 24,
          left: 30,
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
              fontSize: 58,
              fontWeight: 900,
              color: '#0f3b73',
              letterSpacing: 0.6,
              textTransform: 'uppercase',
              lineHeight: 1
            }}
          >
            {title}
          </div>
          <div
            style={{
              marginTop: 6,
              fontSize: 30,
              color: '#111827',
              fontWeight: 700,
              textTransform: 'uppercase',
              lineHeight: 1
            }}
          >
            Daily Headlines{dateLabel ? ` | ${dateLabel}` : ''}
          </div>
        </div>
      </div>

      {sequence.map((s, idx) => (
        <Sequence key={`seq-${idx}-${s.startFrame}`} from={s.startFrame} durationInFrames={s.durationInFrames}>
          <ScenePanel heading={s.item.heading} script={s.item.script} companyGroups={companyGroups} />
          {s.item.audioUrl ? <Audio src={s.item.audioUrl} /> : null}
        </Sequence>
      ))}
    </AbsoluteFill>
  )
}
