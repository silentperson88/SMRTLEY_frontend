import React from 'react'
import { AbsoluteFill, Audio, Img } from 'remotion'

export type SocialTemplateTwoOverlayProps = {
  heading: string[]
  bullets?: string[]
  shortText?: string
  mediumText?: string
  image?: string | null
  audioUrl?: string | null
  brand?: string
  imageMode?: 'custom' | 'original'
}

export const defaultSocialTemplateTwoOverlayProps: SocialTemplateTwoOverlayProps = {
  heading: ['Breaking update', 'What just happened', 'Key details inside'],
  bullets: ['Quick context', 'What changes now', 'Why it matters'],
  shortText: 'A short social-first summary of the update.',
  mediumText: 'A slightly longer one-paragraph summary for the feed.',
  image: null,
  audioUrl: null,
  brand: 'Run4Dream',
  imageMode: 'custom'
}

export const SocialTemplateTwoOverlayComposition: React.FC<SocialTemplateTwoOverlayProps> = ({
  heading,
  bullets,
  shortText,
  mediumText,
  image,
  audioUrl,
  brand = 'Run4Dream',
  imageMode = 'custom'
}) => {
  const lines = Array.isArray(heading) ? heading.filter(Boolean).slice(0, 4) : []
  const bulletLines = Array.isArray(bullets) ? bullets.filter(Boolean).slice(0, 4) : []
  const isOriginal = imageMode === 'original'

  return (
    <AbsoluteFill style={{ background: '#0b1220', color: '#f8fafc', fontFamily: 'Inter, Montserrat, Arial, sans-serif' }}>
      {image ? (
        <AbsoluteFill>
          <Img
            src={image}
            style={{
              width: '100%',
              height: '100%',
              objectFit: isOriginal ? 'contain' : 'cover',
              objectPosition: isOriginal ? 'center center' : 'center top',
              background: '#000'
            }}
          />
        </AbsoluteFill>
      ) : (
        <AbsoluteFill style={{ background: 'linear-gradient(150deg, #0b1220, #1f2937)' }} />
      )}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '0 48px 52px'
        }}
      >
        <div
          style={{
            background: 'rgba(0,0,0,0.78)',
            borderRadius: 24,
            padding: '26px 28px',
            boxShadow: '0 -12px 24px rgba(0,0,0,0.45)'
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 1.6, color: '#facc15' }}>{brand}</div>
          <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
            {lines.map((line, idx) => (
              <div key={`line-${idx}`} style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.15 }}>
                {line}
              </div>
            ))}
          </div>
          {(mediumText || shortText) ? (
            <div style={{ marginTop: 16, fontSize: 18, lineHeight: 1.45, color: '#cbd5e1' }}>
              {mediumText || shortText}
            </div>
          ) : null}
          {bulletLines.length ? (
            <div style={{ marginTop: 14, display: 'grid', gap: 6 }}>
              {bulletLines.map((line, idx) => (
                <div key={`bullet-${idx}`} style={{ fontSize: 16, fontWeight: 600, color: '#facc15' }}>
                  • {line}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </AbsoluteFill>

      {audioUrl ? <Audio src={audioUrl} volume={0.9} /> : null}
    </AbsoluteFill>
  )
}
