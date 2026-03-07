import React from 'react'
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'

export type StockNewsShortProps = {
  symbol: string
  companyName: string
  currentPrice: number
  dayChangePct: number
  headline: string
  summary: string
  bullets: string[]
}

const priceFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

const changeFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

export const defaultStockNewsShortProps: StockNewsShortProps = {
  symbol: 'AAPL',
  companyName: 'Apple Inc.',
  currentPrice: 224.31,
  dayChangePct: 1.87,
  headline: 'Apple rallies after stronger-than-expected iPhone demand outlook',
  summary:
    'Analysts raised near-term shipment estimates while services growth remained steady. Momentum names led broader market gains.',
  bullets: ['Volume: 2.1x average', '52W Range: $164 - $233', 'Sector move: Tech +1.4%']
}

export const StockNewsShortComposition: React.FC<StockNewsShortProps> = ({
  symbol,
  companyName,
  currentPrice,
  dayChangePct,
  headline,
  summary,
  bullets
}) => {
  const frame = useCurrentFrame()
  const { fps, durationInFrames } = useVideoConfig()

  const intro = spring({
    frame,
    fps,
    config: {
      damping: 200
    }
  })

  const outro = interpolate(frame, [durationInFrames - 28, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  })

  const cardOpacity = Math.min(intro, 1) * outro
  const cardScale = interpolate(intro, [0, 1], [0.92, 1])
  const tickerY = interpolate(frame, [0, durationInFrames], [160, -160], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  })

  const isGreen = dayChangePct >= 0
  const moveColor = isGreen ? '#22c55e' : '#ef4444'
  const sign = isGreen ? '+' : ''

  return (
    <AbsoluteFill
      style={{
        background: 'radial-gradient(circle at top, #0f172a 0%, #020617 55%, #000000 100%)',
        color: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
        overflow: 'hidden'
      }}
    >
      <AbsoluteFill
        style={{
          backgroundImage:
            'linear-gradient(115deg, rgba(34, 197, 94, 0.18), transparent 45%), linear-gradient(270deg, rgba(56, 189, 248, 0.17), transparent 55%)',
          transform: `translateY(${tickerY}px)`
        }}
      />

      <AbsoluteFill
        style={{
          justifyContent: 'space-between',
          padding: '64px 56px 56px 56px',
          transform: `scale(${cardScale})`,
          opacity: cardOpacity
        }}
      >
        <div>
          <div style={{ fontSize: 34, opacity: 0.8, marginBottom: 12 }}>Stock News Shorts</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontSize: 78, fontWeight: 800, letterSpacing: 1 }}>{symbol}</div>
            <div
              style={{
                fontSize: 34,
                fontWeight: 700,
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                border: `2px solid ${moveColor}`,
                borderRadius: 999,
                color: moveColor,
                padding: '6px 18px'
              }}
            >
              {sign}
              {changeFormatter.format(dayChangePct)}%
            </div>
          </div>
          <div style={{ fontSize: 35, opacity: 0.9, marginTop: 4 }}>{companyName}</div>
          <div style={{ fontSize: 62, fontWeight: 700, marginTop: 10 }}>${priceFormatter.format(currentPrice)}</div>
        </div>

        <div
          style={{
            border: '1px solid rgba(255,255,255,0.14)',
            backgroundColor: 'rgba(2, 6, 23, 0.7)',
            borderRadius: 24,
            padding: '24px 28px',
            backdropFilter: 'blur(6px)'
          }}
        >
          <div style={{ fontSize: 37, lineHeight: 1.25, fontWeight: 700, marginBottom: 14 }}>{headline}</div>
          <div style={{ fontSize: 26, lineHeight: 1.45, opacity: 0.9, marginBottom: 14 }}>{summary}</div>
          <div style={{ display: 'flex', gap: 18, fontSize: 22, opacity: 0.9, flexWrap: 'wrap' }}>
            {bullets.map((item, index) => (
              <div
                key={`${item}-${index}`}
                style={{
                  border: '1px solid rgba(148, 163, 184, 0.35)',
                  borderRadius: 12,
                  padding: '8px 12px',
                  background: 'rgba(15, 23, 42, 0.5)'
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            fontSize: 21,
            letterSpacing: 0.6,
            opacity: 0.75
          }}
        >
          Demo template for automated stock + news short generation with Remotion
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
