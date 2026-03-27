import React from 'react'
import { AbsoluteFill, Img } from 'remotion'

export type SocialTemplateThreeHeaderProps = {
  title: string
  image?: string | null
  brand?: string
}

export const defaultSocialTemplateThreeHeaderProps: SocialTemplateThreeHeaderProps = {
  title: 'Top Story',
  image: null,
  brand: 'R4D News'
}

export const SocialTemplateThreeHeaderComposition: React.FC<SocialTemplateThreeHeaderProps> = ({
  title,
  image,
  brand = 'R4D News'
}) => {
  return (
    <AbsoluteFill style={{ background: '#0b1220', color: '#f8fafc', fontFamily: 'Inter, Montserrat, Arial, sans-serif' }}>
      {image ? (
        <AbsoluteFill>
          <Img src={image} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
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
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
