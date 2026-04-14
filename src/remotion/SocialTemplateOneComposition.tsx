import React from 'react'
import { AbsoluteFill, Audio, Img, interpolate, useCurrentFrame } from 'remotion'

export type SocialTemplateOneProps = {
  brand?: string
  title: string
  subtitle?: string
  shortText?: string
  mediumText?: string
  highlights: string[]
  cta?: string
  image?: string | null
  audioUrl?: string | null
  imageMode?: 'custom' | 'original'
}

export const defaultSocialTemplateOneProps: SocialTemplateOneProps = {
  brand: 'Run4Dream',
  title: 'Big Deal',
  subtitle: 'A short social-ready line under 100 characters.',
  shortText: 'A short social-ready line under 100 characters.',
  mediumText: 'A slightly longer version for the same story.',
  highlights: ['Major update announced', 'Officials confirm next steps', 'Impact expected soon'],
  cta: '',
  image: null,
  audioUrl: null,
  imageMode: 'custom',
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

export const SocialTemplateOneComposition: React.FC<SocialTemplateOneProps> = ({
  brand = 'Run4Dream',
  title,
  subtitle,
  shortText,
  mediumText,
  highlights,
  cta,
  image,
  audioUrl,
  imageMode = 'custom',
}) => {
  const frame = useCurrentFrame()
  const isOriginal = imageMode === 'original'
  const zoom = isOriginal ? 1 : interpolate(frame, [0, 120], [1.08, 1], { extrapolateRight: 'clamp' })
  const safeHighlights = Array.isArray(highlights) ? highlights.filter(Boolean) : []
  const bodyLine = shortText || subtitle || mediumText || safeHighlights[0] || ''
  const bottomAccent = safeHighlights[1] || safeHighlights[2] || ''
  const titleWords = String(title || 'Top Story').trim().split(/\s+/).filter(Boolean).slice(0, 3).join(' ')
  const titleLines = Math.max(1, Math.ceil(titleWords.length / 14))
  const bodyLines = Math.max(1, Math.ceil(String(bodyLine || '').length / 32))
  const accentLines = bottomAccent ? 1 : 0
  const textBlockHeight = clamp(110 + titleLines * 28 + bodyLines * 20 + accentLines * 18, 150, 300)
  const imageHeight = 1080 - textBlockHeight

  return (
    <AbsoluteFill
      style={{
        background: '#000000',
        color: '#f8fafc',
        fontFamily: 'Inter, Montserrat, Arial, sans-serif',
      }}
    >
      <AbsoluteFill style={{ background: '#000000' }} />

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: imageHeight,
          overflow: 'hidden',
          background: '#0b1220',
        }}
        >
          {image ? (
          <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
            <Img
              src={image}
              style={{
                width: '100%',
                height: '100%',
                objectFit: isOriginal ? 'contain' : 'cover',
                objectPosition: isOriginal ? 'center center' : 'center top',
                background: '#000',
              }}
            />
          </AbsoluteFill>
        ) : (
          <AbsoluteFill style={{ background: 'linear-gradient(140deg, #0a0f1f, #1f2937)' }} />
        )}

        <AbsoluteFill
          style={{
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.02) 64%, rgba(0,0,0,0.14) 100%)',
          }}
        />

        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            padding: '18px 34px',
            color: '#facc15',
            fontSize: 18,
            fontWeight: 900,
            letterSpacing: 1.7,
            textTransform: 'uppercase',
            textShadow: '0 2px 10px rgba(0,0,0,0.6)',
            textAlign: 'right',
          }}
        >
          {brand}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: textBlockHeight,
          background: '#050505',
          padding: '18px 32px 20px',
          boxShadow: '0 -22px 42px rgba(0,0,0,0.75)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -20,
            left: 0,
            right: 0,
            height: 20,
            background: 'linear-gradient(180deg, rgba(5,5,5,0) 0%, rgba(5,5,5,0.88) 100%)',
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div
            style={{
              fontSize: 27,
              lineHeight: 1.02,
              fontWeight: 900,
              color: '#facc15',
              textTransform: 'uppercase',
              letterSpacing: 0.3,
              maxWidth: 930,
            }}
          >
            {titleWords}
          </div>

          <div
            style={{
              marginTop: 8,
              maxWidth: 980,
              fontSize: 31,
              lineHeight: 1.08,
              fontWeight: 800,
              color: '#ffffff',
            }}
          >
            {bodyLine}
          </div>

          {bottomAccent ? (
            <div
              style={{
                marginTop: 8,
                maxWidth: 900,
                fontSize: 17,
                lineHeight: 1.22,
                fontWeight: 600,
                color: '#cbd5e1',
              }}
            >
              {bottomAccent}
            </div>
          ) : null}

          {cta ? (
            <div
              style={{
                marginTop: 10,
                fontSize: 16,
                fontWeight: 700,
                color: '#facc15',
              }}
            >
              {cta}
            </div>
          ) : null}
        </div>
      </div>

      {audioUrl ? <Audio src={audioUrl} volume={0.9} /> : null}
    </AbsoluteFill>
  )
}
