import React from 'react'
import { AbsoluteFill, Img } from 'remotion'

export type SocialTemplateTwoOverlayProps = {
  heading: string[]
  image?: string | null
  brand?: string
}

export const defaultSocialTemplateTwoOverlayProps: SocialTemplateTwoOverlayProps = {
  heading: ['Breaking update', 'What just happened', 'Key details inside'],
  image: null,
  brand: 'R4D News'
}

export const SocialTemplateTwoOverlayComposition: React.FC<SocialTemplateTwoOverlayProps> = ({
  heading,
  image,
  brand = 'R4D News'
}) => {
  const lines = Array.isArray(heading) ? heading.filter(Boolean).slice(0, 4) : []

  return (
    <AbsoluteFill style={{ background: '#0b1220', color: '#f8fafc', fontFamily: 'Inter, Montserrat, Arial, sans-serif' }}>
      {image ? (
        <AbsoluteFill>
          <Img src={image} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
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
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
