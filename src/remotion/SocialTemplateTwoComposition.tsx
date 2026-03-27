import React from 'react'
import { AbsoluteFill, Img, interpolate, useCurrentFrame } from 'remotion'

export type SocialTemplateTwoProps = {
  brand?: string
  title: string
  subtitle: string
  bullets: string[]
  cta: string
  image?: string | null
}

export const defaultSocialTemplateTwoProps: SocialTemplateTwoProps = {
  brand: 'R4D News',
  title: 'News Brief',
  subtitle: 'Key points in a quick snapshot.',
  bullets: ['Latest update just released', 'Officials outline next steps', 'More impact expected soon'],
  cta: 'Share this update.',
  image: null
}

export const SocialTemplateTwoComposition: React.FC<SocialTemplateTwoProps> = ({
  brand = 'R4D News',
  title,
  subtitle,
  bullets,
  cta,
  image
}) => {
  const frame = useCurrentFrame()
  const fade = 1
  const shift = 0
  const accent = '#00f5d4'
  const hot = '#ff4d6d'

  return (
    <AbsoluteFill
      style={{
        background: '#0b1020',
        color: '#f8fafc',
        fontFamily: 'Inter, Montserrat, Arial, sans-serif'
      }}
    >
      <AbsoluteFill style={{ padding: 50, display: 'flex', gap: 32 }}>
        <div style={{ flex: 1.15, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 12, height: 12, borderRadius: 999, background: hot }} />
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 1.4, color: accent }}>{brand}</div>
          </div>
          <div style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.1 }}>{title}</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: '#e2e8f0' }}>{subtitle}</div>
          <div style={{ display: 'grid', gap: 14, marginTop: 4 }}>
            {bullets.slice(0, 5).map((item, idx) => (
              <div
                key={`bullet-${idx}`}
                style={{
                  padding: '14px 18px',
                  borderRadius: 16,
                  background: 'rgba(8,12,22,0.72)',
                  border: `1px solid rgba(0,245,212,${0.2 + idx * 0.05})`,
                  fontSize: 16,
                  fontWeight: 600
                }}
              >
                {item}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: hot }}>{cta}</div>
        </div>

        <div
          style={{
            flex: 0.85,
            borderRadius: 26,
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.18)',
            boxShadow: '0 18px 50px rgba(2,6,23,0.55)',
            transform: `translateY(${shift}px)`,
            opacity: fade
          }}
        >
          {image ? (
            <Img src={image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                background:
                  'radial-gradient(circle at 20% 20%, rgba(255,77,109,0.35), transparent 40%), radial-gradient(circle at 80% 80%, rgba(0,245,212,0.3), transparent 45%), linear-gradient(160deg, #0b1220, #111827)'
              }}
            />
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
