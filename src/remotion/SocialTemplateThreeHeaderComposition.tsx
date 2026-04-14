import React from 'react'
import { AbsoluteFill, Audio, Img } from 'remotion'

export type SocialTemplateThreeHeaderProps = {
  title: string
  subtitle?: string
  kicker?: string
  image?: string | null
  audioUrl?: string | null
  brand?: string
  imageMode?: 'custom' | 'original'
}

export const defaultSocialTemplateThreeHeaderProps: SocialTemplateThreeHeaderProps = {
  title: 'Top Story',
  subtitle: 'A strong cover slide for a carousel or story sequence.',
  kicker: 'Swipe for the full breakdown',
  image: null,
  audioUrl: null,
  brand: 'Run4Dream',
  imageMode: 'custom'
}

export const SocialTemplateThreeHeaderComposition: React.FC<SocialTemplateThreeHeaderProps> = ({
  title,
  subtitle,
  kicker,
  image,
  audioUrl,
  brand = 'Run4Dream',
  imageMode = 'custom'
}) => {
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
        <AbsoluteFill style={{ background: 'linear-gradient(140deg, #0b1220, #1f2937)' }} />
      )}
      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            background: '#111827',
            padding: '22px 48px',
            borderBottom: '3px solid #facc15',
            boxShadow: '0 12px 24px rgba(0,0,0,0.35)'
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 1.4, color: '#facc15' }}>{brand}</div>
          <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.1, marginTop: 6 }}>{title}</div>
          {subtitle ? (
            <div style={{ fontSize: 18, fontWeight: 600, color: '#cbd5e1', lineHeight: 1.35, marginTop: 8 }}>
              {subtitle}
            </div>
          ) : null}
          {kicker ? (
            <div style={{ fontSize: 14, fontWeight: 700, color: '#facc15', marginTop: 10, letterSpacing: 1 }}>
              {kicker}
            </div>
          ) : null}
        </div>
      </AbsoluteFill>

      {audioUrl ? <Audio src={audioUrl} volume={0.9} /> : null}
    </AbsoluteFill>
  )
}
