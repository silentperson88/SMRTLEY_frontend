import React from 'react'
import { AbsoluteFill, Audio, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'

export type MarketPreviewItem = {
  company: string
  headline: string
  category?: string
}

export type MarketUpdatesSequenceProps = {
  title: string
  dateLabel?: string
  introText: string
  outroText?: string
  items: MarketPreviewItem[]
  companyBadges?: string[]
  audioUrl?: string
}

type Segment = {
  kind: 'intro' | 'item' | 'outro'
  start: number
  duration: number
  itemIndex?: number
}

const weightFromText = (value: string) => {
  const words = String(value || '')
    .split(/\s+/)
    .map(item => item.trim())
    .filter(Boolean).length
  return Math.max(6, Math.min(44, words))
}

const buildSegments = (props: MarketUpdatesSequenceProps, totalFrames: number): Segment[] => {
  const safeTotal = Math.max(120, Number(totalFrames || 0))
  const items = Array.isArray(props.items) ? props.items : []
  const outroText = String(props.outroText || '').trim()
  const weights: number[] = []
  const keys: Array<{ kind: 'intro' | 'item' | 'outro'; itemIndex?: number }> = []

  weights.push(weightFromText(props.introText || 'Today market updates'))
  keys.push({ kind: 'intro' })

  items.forEach((item, index) => {
    weights.push(weightFromText(`${item.company} ${item.headline}`))
    keys.push({ kind: 'item', itemIndex: index })
  })

  if (outroText) {
    weights.push(weightFromText(outroText))
    keys.push({ kind: 'outro' })
  }

  const totalWeight = Math.max(1, weights.reduce((sum, n) => sum + n, 0))
  let cursor = 0
  const segments: Segment[] = keys.map((key, idx) => {
    const raw = Math.max(24, Math.round((weights[idx] / totalWeight) * safeTotal))
    return {
      kind: key.kind,
      itemIndex: key.itemIndex,
      start: 0,
      duration: raw
    }
  })

  segments.forEach((segment, idx) => {
    if (idx === segments.length - 1) {
      segment.start = cursor
      segment.duration = Math.max(24, safeTotal - cursor)
      cursor = safeTotal
      return
    }
    segment.start = cursor
    cursor += segment.duration
  })

  return segments
}

const SceneCard: React.FC<{
  title: string
  subtitle?: string
  text: string
  frameOffset: number
}> = ({ title, subtitle, text, frameOffset }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const localFrame = Math.max(0, frame - frameOffset)
  const entered = spring({
    frame: localFrame,
    fps,
    config: { damping: 200, stiffness: 120 }
  })
  const slideX = interpolate(entered, [0, 1], [90, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  })
  const fade = interpolate(entered, [0, 1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  })

  return (
    <div
      style={{
        position: 'absolute',
        left: 120,
        right: 120,
        top: 182,
        bottom: 124,
        borderRadius: 8,
        border: '3px solid rgba(47,95,149,0.78)',
        background: 'linear-gradient(145deg, rgba(214,232,248,0.76), rgba(183,210,237,0.68))',
        boxShadow: '0 16px 44px rgba(15,23,42,0.2)',
        padding: '28px 34px',
        overflow: 'hidden',
        transform: `translateX(${slideX}px)`,
        opacity: fade
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
          fontSize: 58,
          fontWeight: 900,
          color: '#0f172a',
          lineHeight: 1.05,
          textTransform: 'uppercase',
          marginBottom: 12
        }}
      >
        {title}
      </div>
      {subtitle ? (
        <div
          style={{
            display: 'inline-block',
            borderRadius: 999,
            border: '2px solid rgba(47,95,149,0.65)',
            background: 'rgba(15,23,42,0.06)',
            padding: '6px 14px',
            color: '#1e293b',
            fontSize: 24,
            fontWeight: 700,
            marginBottom: 16
          }}
        >
          {subtitle}
        </div>
      ) : null}
      <div
        style={{
          fontSize: 44,
          lineHeight: 1.26,
          color: '#0f172a',
          fontWeight: 700,
          whiteSpace: 'pre-wrap'
        }}
      >
        {text}
      </div>
    </div>
  )
}

export const MarketUpdatesSequenceComposition: React.FC<MarketUpdatesSequenceProps> = ({
  title,
  dateLabel,
  introText,
  outroText,
  items,
  companyBadges = [],
  audioUrl
}) => {
  const { durationInFrames } = useVideoConfig()
  const bgImageUrl = staticFile('stock_news_background.png')
  const segments = buildSegments({ title, dateLabel, introText, outroText, items, audioUrl }, durationInFrames)

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
            {title || "Today's Market Updates"}
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

      {companyBadges.length > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: 120,
            right: 120,
            top: 130,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8
          }}
        >
          {companyBadges.slice(0, 12).map((item, idx) => (
            <div
              key={`${item}-${idx}`}
              style={{
                borderRadius: 999,
                border: '1px solid rgba(47,95,149,0.6)',
                background: 'rgba(241,245,249,0.84)',
                color: '#0f172a',
                padding: '5px 12px',
                fontSize: 20,
                fontWeight: 700
              }}
            >
              {item}
            </div>
          ))}
        </div>
      ) : null}

      {segments.map((segment, idx) => {
        if (segment.kind === 'intro') {
          return (
            <Sequence key={`seg-${idx}`} from={segment.start} durationInFrames={segment.duration}>
              <SceneCard title={'Market Opening'} text={introText} frameOffset={segment.start} />
            </Sequence>
          )
        }

        if (segment.kind === 'item') {
          const item = items[Number(segment.itemIndex || 0)] || { company: 'Company', headline: '' }
          return (
            <Sequence key={`seg-${idx}`} from={segment.start} durationInFrames={segment.duration}>
              <SceneCard
                title={String(item.company || 'Company')}
                subtitle={String(item.category || '').trim() || undefined}
                text={String(item.headline || '').trim()}
                frameOffset={segment.start}
              />
            </Sequence>
          )
        }

        return (
          <Sequence key={`seg-${idx}`} from={segment.start} durationInFrames={segment.duration}>
            <SceneCard title={'Closing Bell'} text={String(outroText || '').trim()} frameOffset={segment.start} />
          </Sequence>
        )
      })}

      {audioUrl ? <Audio src={audioUrl} /> : null}
    </AbsoluteFill>
  )
}
