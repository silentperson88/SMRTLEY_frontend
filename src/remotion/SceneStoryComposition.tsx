import React from 'react'
import { AbsoluteFill, Audio, Img, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'

export type SceneStoryItem = {
  id: number
  heading: string
  narration?: string
  onScreenText?: string
  durationSec: number
  imageUrl?: string
  audioUrl?: string
}

export type SceneStoryProps = {
  title: string
  scenes: SceneStoryItem[]
}

export const defaultSceneStoryProps: SceneStoryProps = {
  title: 'AI Content Video',
  scenes: [
    {
      id: 1,
      heading: 'Scene 1',
      narration: 'This is a demo narration for scene 1.',
      onScreenText: 'Market momentum builds up',
      durationSec: 4,
      imageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80'
    },
    {
      id: 2,
      heading: 'Scene 2',
      narration: 'This is a demo narration for scene 2.',
      onScreenText: 'Investors tracking key levels',
      durationSec: 4,
      imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80'
    }
  ]
}

const SceneCard: React.FC<{
  scene: SceneStoryItem
  startFrame: number
}> = ({ scene, startFrame }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const sceneFrames = Math.max(1, Math.round(Number(scene.durationSec || 1) * fps))
  const localFrame = Math.max(0, frame - startFrame)

  const inSpring = spring({
    fps,
    frame: localFrame,
    config: { damping: 200 }
  })

  const outOpacity = interpolate(localFrame, [sceneFrames - 10, sceneFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  })

  const zoom = interpolate(localFrame, [0, sceneFrames], [1.02, 1.08], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  })

  const headingY = interpolate(inSpring, [0, 1], [18, 0])
  const headingOpacity = Math.min(1, inSpring) * outOpacity
  const audioFadeFrames = Math.max(1, Math.round(fps * 0.04))

  return (
    <AbsoluteFill
      style={{
        overflow: 'hidden',
        backgroundColor: '#020617'
      }}
    >
      {scene.imageUrl ? (
        <Img
          src={scene.imageUrl}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: `scale(${zoom})`
          }}
        />
      ) : (
        <AbsoluteFill
          style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
          }}
        />
      )}

      <AbsoluteFill
        style={{
          background: 'linear-gradient(180deg, rgba(2,6,23,0.05) 0%, rgba(2,6,23,0.4) 55%, rgba(2,6,23,0.8) 100%)'
        }}
      />

      <AbsoluteFill
        style={{
          justifyContent: 'flex-end',
          padding: 64,
          opacity: outOpacity
        }}
      >
        <div
          style={{
            transform: `translateY(${headingY}px)`,
            opacity: headingOpacity
          }}
        >
          <div
            style={{
              display: 'inline-block',
              marginBottom: 16,
              color: '#e2e8f0',
              border: '1px solid rgba(148,163,184,0.45)',
              borderRadius: 999,
              padding: '8px 18px',
              fontSize: 26,
              fontWeight: 700,
              background: 'rgba(2,6,23,0.55)'
            }}
          >
            {scene.heading}
          </div>

          {scene.onScreenText ? (
            <div
              style={{
                color: '#f8fafc',
                fontSize: 54,
                lineHeight: 1.18,
                fontWeight: 800,
                letterSpacing: 0.2,
                textShadow: '0 6px 26px rgba(2,6,23,0.6)'
              }}
            >
              {scene.onScreenText}
            </div>
          ) : null}
        </div>
      </AbsoluteFill>

      {scene.audioUrl ? (
        <Audio
          src={scene.audioUrl}
          volume={f =>
            interpolate(
              f,
              [0, audioFadeFrames, Math.max(audioFadeFrames + 1, sceneFrames - audioFadeFrames), sceneFrames],
              [0, 1, 1, 0],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
            )
          }
        />
      ) : null}
    </AbsoluteFill>
  )
}

export const SceneStoryComposition: React.FC<SceneStoryProps> = ({ title, scenes }) => {
  const { fps } = useVideoConfig()
  const validScenes = (Array.isArray(scenes) ? scenes : []).filter(scene => Number(scene?.durationSec || 0) > 0)

  let cursor = 0
  const sequenceConfigs = validScenes.map(scene => {
    const durationInFrames = Math.max(1, Math.round(Number(scene.durationSec) * fps))
    const config = {
      scene,
      startFrame: cursor,
      durationInFrames
    }
    cursor += durationInFrames

    return config
  })

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#020617',
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif'
      }}
    >
      {sequenceConfigs.map(config => (
        <Sequence key={`${config.scene.id}-${config.startFrame}`} from={config.startFrame} durationInFrames={config.durationInFrames}>
          <SceneCard scene={config.scene} startFrame={config.startFrame} />
        </Sequence>
      ))}

      <AbsoluteFill
        style={{
          justifyContent: 'flex-start',
          padding: 28
        }}
      >
        <div
          style={{
            alignSelf: 'flex-start',
            color: '#f1f5f9',
            fontSize: 22,
            fontWeight: 700,
            border: '1px solid rgba(148,163,184,0.4)',
            borderRadius: 999,
            padding: '8px 14px',
            background: 'rgba(2,6,23,0.5)'
          }}
        >
          {title || 'AI Content Video'}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
