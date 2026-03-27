import React from 'react'
import { AbsoluteFill, Img, interpolate, useCurrentFrame } from 'remotion'

export type SocialTemplateOneProps = {
  brand?: string
  title: string
  subtitle?: string
  highlights: string[]
  cta: string
  image?: string | null
}

export const defaultSocialTemplateOneProps: SocialTemplateOneProps = {
  brand: 'R4D News',
  title: 'Top Story',
  subtitle: 'Key developments you should know today.',
  highlights: ['Major update announced', 'Officials confirm next steps', 'Impact expected soon'],
  cta: 'See more >>',
  image: null
}

const gradient =
  'linear-gradient(135deg, rgba(12,19,33,0.82) 0%, rgba(15,23,42,0.9) 45%, rgba(8,12,20,0.95) 100%)'

export const SocialTemplateOneComposition: React.FC<SocialTemplateOneProps> = ({
  brand = 'R4D News',
  title,
  subtitle,
  highlights,
  cta,
  image
}) => {
  const frame = useCurrentFrame()
  const zoom = interpolate(frame, [0, 120], [1.06, 1], { extrapolateRight: 'clamp' })
  const bannerSlide = 0
  const bodyFade = 1
  const accent = '#ffe600'
  const accentText = '#d10000'
  const safeHighlights = Array.isArray(highlights) ? highlights.filter(Boolean) : []
  const mainLine = safeHighlights[0] || subtitle || ''
  const subLine = safeHighlights[1] || safeHighlights[2] || ''

  return (
    <AbsoluteFill
      style={{
        background: '#0a0f1f',
        color: '#f8fafc',
        fontFamily: 'Inter, Montserrat, Arial, sans-serif'
      }}
    >
      <AbsoluteFill style={{ background: '#0a0f1f' }}>
        {image ? (
          <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
            <Img src={image} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </AbsoluteFill>
        ) : (
          <AbsoluteFill style={{ background: 'linear-gradient(140deg, #0a0f1f, #1f2937)' }} />
        )}
      </AbsoluteFill>

      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            background: accent,
            padding: '18px 46px',
            transform: `translateY(${bannerSlide}px)`,
            boxShadow: '0 12px 24px rgba(0,0,0,0.35)'
          }}
        >
          <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: 0.4, color: accentText }}>
            {title}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 2, color: '#111827' }}>{brand}</div>
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'flex-end',
            padding: '0 50px 52px',
            opacity: bodyFade
          }}
        >
          <div
            style={{
              width: '100%',
              background: 'rgba(5,8,15,0.85)',
              borderRadius: 24,
              padding: '26px 32px',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.45)'
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 700, color: '#ffffff', lineHeight: 1.25 }}>
              {mainLine || subtitle}
            </div>
            {subLine ? (
              <div style={{ fontSize: 20, fontWeight: 600, color: accent, marginTop: 10 }}>{subLine}</div>
            ) : null}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#e5e7eb' }}>
                {safeHighlights.slice(2, 4).join(' • ')}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: accent }}>{cta}</div>
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
