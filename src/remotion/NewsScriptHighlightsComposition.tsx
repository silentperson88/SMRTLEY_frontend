import React from 'react'
import { AbsoluteFill, Audio, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'

type SceneItem = {
  id: number
  heading: string
  onScreenText?: string
  durationSec: number
  audioUrl?: string
}

export type NewsScriptHighlightsProps = {
  title: string
  scenes: SceneItem[]
  stylePreset?: 'flash' | 'data' | 'story'
}

export const defaultNewsScriptHighlightsProps: NewsScriptHighlightsProps = {
  title: 'Daily News Brief',
  stylePreset: 'flash',
  scenes: [
    {
      id: 1,
      heading: 'Opening',
      onScreenText: 'Top market headlines for today. Key updates in one minute.',
      durationSec: 6
    },
    {
      id: 2,
      heading: 'Main Update',
      onScreenText: '- Revenue growth improved\n- Margin expanded\n- Next quarter guidance raised',
      durationSec: 8
    },
    {
      id: 3,
      heading: 'Conclusion',
      onScreenText: 'Thanks for watching. Follow for the next market breakdown.',
      durationSec: 5
    }
  ]
}

const parseHighlights = (text: string) => {
  const raw = String(text || '').trim()
  if (!raw) return []
  const lines = raw
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
  const explicitBullets = lines
    .filter(line => /^[-*•]\s+/.test(line) || /^\d+[.)]\s+/.test(line))
    .map(line => line.replace(/^[-*•]\s+|^\d+[.)]\s+/, '').trim())
  if (explicitBullets.length >= 2) return explicitBullets.slice(0, 6)

  return raw
    .split(/[.!?।]+/)
    .map(item => item.trim())
    .filter(Boolean)
    .slice(0, 4)
}

const isGreetingScene = (heading: string, text: string) => {
  const probe = `${heading} ${text}`.toLowerCase()
  
return ['greeting', 'welcome', 'hello', 'hi everyone', 'namaskar', 'नमस्कार', 'स्वागत'].some(k => probe.includes(k))
}

const isConclusionScene = (heading: string, text: string) => {
  const probe = `${heading} ${text}`.toLowerCase()
  
return ['conclusion', 'thanks', 'thank you', 'wrap', 'समापन', 'धन्यवाद'].some(k => probe.includes(k))
}

const paletteByPreset = (stylePreset: 'flash' | 'data' | 'story') => {
  if (stylePreset === 'data') {
    return {
      bg: 'radial-gradient(circle at 18% 15%, rgba(34,197,94,0.2), transparent 35%), radial-gradient(circle at 82% 80%, rgba(56,189,248,0.24), transparent 40%), linear-gradient(160deg, #0f172a 0%, #111827 42%, #0b1220 100%)',
      text: '#ecfeff',
      panel: 'rgba(2,6,23,0.58)',
      pill: 'rgba(34,197,94,0.26)',
      accent: '#86efac'
    }
  }
  if (stylePreset === 'story') {
    return {
      bg: 'radial-gradient(circle at 22% 12%, rgba(251,191,36,0.24), transparent 34%), radial-gradient(circle at 78% 84%, rgba(244,114,182,0.18), transparent 36%), linear-gradient(155deg, #1f2937 0%, #111827 45%, #0f172a 100%)',
      text: '#fffbeb',
      panel: 'rgba(30,41,59,0.58)',
      pill: 'rgba(251,191,36,0.18)',
      accent: '#fde68a'
    }
  }
  
return {
    bg: 'radial-gradient(circle at 18% 15%, rgba(251,191,36,0.22), transparent 35%), radial-gradient(circle at 82% 80%, rgba(14,165,233,0.26), transparent 40%), linear-gradient(160deg, #0f172a 0%, #111827 42%, #1f2937 100%)',
    text: '#f8fafc',
    panel: 'rgba(15,23,42,0.6)',
    pill: 'rgba(2,6,23,0.45)',
    accent: '#fef3c7'
  }
}

const SceneBlock: React.FC<{
  scene: SceneItem
  startFrame: number
  sceneIndex: number
  sceneCount: number
  stylePreset: 'flash' | 'data' | 'story'
}> = ({ scene, startFrame, sceneIndex, sceneCount, stylePreset }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const durationInFrames = Math.max(1, Math.round(Math.max(1, Number(scene.durationSec || 1)) * fps))
  const localFrame = Math.max(0, frame - startFrame)
  const palette = paletteByPreset(stylePreset)

  const direction = sceneIndex % 2 === 0 ? 1 : -1
  const enter = spring({ fps, frame: localFrame, config: { damping: 180, stiffness: 120 } })
  const contentShiftX = interpolate(enter, [0, 1], [direction * 80, 0])
  const contentShiftY = interpolate(enter, [0, 1], [22, 0])
  const fadeOut = interpolate(localFrame, [durationInFrames - 14, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  })
  const bullets = parseHighlights(scene.onScreenText || scene.heading || '')
  const greeting = isGreetingScene(scene.heading, scene.onScreenText || '')
  const conclusion = isConclusionScene(scene.heading, scene.onScreenText || '')

  const enterWipeX = interpolate(localFrame, [0, 8], [0, 110], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  })
  const exitWipeX = interpolate(localFrame, [durationInFrames - 8, durationInFrames], [-110, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  })

  return (
    <AbsoluteFill
      style={{
        opacity: fadeOut,
        background: palette.bg,
        color: palette.text,
        fontFamily: stylePreset === 'data' ? "'IBM Plex Sans', 'Segoe UI', sans-serif" : "'Merriweather', Georgia, serif",
        padding: 64,
        justifyContent: 'space-between',
        overflow: 'hidden'
      }}
    >
      <AbsoluteFill
        style={{
          pointerEvents: 'none',
          background: 'linear-gradient(90deg, rgba(2,6,23,0) 0%, rgba(2,6,23,0.65) 35%, rgba(2,6,23,0) 100%)',
          transform: `translateX(${enterWipeX}%)`
        }}
      />

      <div style={{ transform: `translateX(${contentShiftX}px) translateY(${contentShiftY}px)` }}>
        <div
          style={{
            display: 'inline-block',
            border: `1px solid ${palette.accent}`,
            borderRadius: 999,
            padding: '8px 16px',
            fontSize: 22,
            letterSpacing: 0.6,
            marginBottom: 16,
            background: palette.pill
          }}
        >
          {scene.heading}
        </div>

        {greeting ? (
          <div
            style={{
              border: '1px solid rgba(148,163,184,0.4)',
              borderRadius: 18,
              background: palette.panel,
              padding: 18,
              fontSize: 34,
              fontWeight: 700,
              lineHeight: 1.22,
              maxWidth: 940
            }}
          >
            Welcome Bulletin
          </div>
        ) : null}

        {!greeting ? (
          <div style={{ fontSize: 58, lineHeight: 1.12, fontWeight: 700, maxWidth: 940 }}>
            {(scene.onScreenText || scene.heading || '').slice(0, 220)}
          </div>
        ) : null}
      </div>

      <div style={{ display: 'grid', gap: 14 }}>
        {bullets.map((line, idx) => {
          const rowIn = spring({ fps, frame: localFrame - idx * 4, config: { damping: 210 } })
          const rowOpacity = Math.min(1, rowIn) * fadeOut
          
return (
            <div
              key={`${scene.id}-${idx}`}
              style={{
                opacity: rowOpacity,
                border: '1px solid rgba(148,163,184,0.45)',
                borderRadius: 18,
                padding: '12px 16px',
                background: palette.panel,
                fontSize: 30,
                lineHeight: 1.34,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10
              }}
            >
              <span style={{ color: palette.accent, fontWeight: 800 }}>{idx + 1}.</span>
              <span>{line}</span>
            </div>
          )
        })}
      </div>

      {conclusion ? (
        <div
          style={{
            position: 'absolute',
            left: 64,
            right: 64,
            bottom: 24,
            border: '1px solid rgba(148,163,184,0.42)',
            borderRadius: 16,
            padding: '10px 16px',
            background: 'rgba(2,6,23,0.55)',
            fontSize: 24,
            textAlign: 'center',
            fontWeight: 700
          }}
        >
          Thank you for watching
        </div>
      ) : null}

      <AbsoluteFill
        style={{
          pointerEvents: 'none',
          background: 'linear-gradient(90deg, rgba(2,6,23,0) 0%, rgba(2,6,23,0.75) 60%, rgba(2,6,23,0) 100%)',
          transform: `translateX(${exitWipeX}%)`
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 24,
          right: 28,
          fontSize: 18,
          color: '#cbd5e1',
          opacity: 0.9
        }}
      >
        Scene {sceneIndex + 1}/{sceneCount}
      </div>

      {scene.audioUrl ? (
        <Audio
          src={scene.audioUrl}
          volume={f =>
            interpolate(f, [0, Math.round(fps * 0.08), durationInFrames - Math.round(fps * 0.08), durationInFrames], [0, 1, 1, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp'
            })
          }
        />
      ) : null}
    </AbsoluteFill>
  )
}

export const NewsScriptHighlightsComposition: React.FC<NewsScriptHighlightsProps> = ({ title, scenes, stylePreset = 'flash' }) => {
  const { fps } = useVideoConfig()
  const validScenes = (Array.isArray(scenes) ? scenes : []).filter(scene => Number(scene?.durationSec || 0) > 0)
  let cursor = 0
  const sequence = validScenes.map(scene => {
    const durationInFrames = Math.max(1, Math.round(Number(scene.durationSec || 1) * fps))
    const item = { scene, startFrame: cursor, durationInFrames }
    cursor += durationInFrames
    
return item
  })

  return (
    <AbsoluteFill style={{ backgroundColor: '#111827' }}>
      {sequence.map((item, idx) => (
        <Sequence key={`${item.scene.id}-${item.startFrame}`} from={item.startFrame} durationInFrames={item.durationInFrames}>
          <SceneBlock
            scene={item.scene}
            startFrame={item.startFrame}
            sceneIndex={idx}
            sceneCount={sequence.length}
            stylePreset={stylePreset}
          />
        </Sequence>
      ))}

      <AbsoluteFill style={{ justifyContent: 'flex-start', padding: 24, pointerEvents: 'none' }}>
        <div
          style={{
            alignSelf: 'flex-start',
            borderRadius: 999,
            border: '1px solid rgba(251,191,36,0.5)',
            color: '#fef3c7',
            background: 'rgba(17,24,39,0.65)',
            padding: '8px 14px',
            fontSize: 20,
            fontWeight: 700,
            fontFamily: "'Libre Baskerville', Georgia, serif"
          }}
        >
          {title || 'News Script Video'}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

