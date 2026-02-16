import React from 'react'

type Variant = 'icon-only' | 'horizontal' | 'stacked' | 'shield-filled'

interface LogoProps {
  variant?: Variant
  size?: number
  primaryColor?: string
  accentColor?: string
  className?: string
}

const Run4DreamLogo: React.FC<LogoProps> = ({
  variant = 'horizontal',
  size = 200,
  primaryColor = '#0f172a', // Dark Navy
  accentColor = '#22c55e', // Green accent
  className = ''
}) => {
  // The Running Person Path
  const PersonPath = () => (
    <g transform='translate(28, 25) scale(0.5)'>
      {/* Head */}
      <circle cx='90' cy='20' r='12' fill='currentColor' />
      {/* Body & Legs */}
      <path
        d='M85 40 L60 60 L40 90 M60 60 L80 100 L110 120 M85 40 L110 60 L100 90'
        stroke='currentColor'
        strokeWidth='12'
        strokeLinecap='round'
        fill='none'
      />
      {/* Motion Lines */}
      <path d='M10 45 L35 45 M5 60 L30 60 M15 75 L35 75' stroke='currentColor' strokeWidth='6' strokeLinecap='round' />
      {/* Spark/Star */}
      <path
        d='M110 15 L115 25 L125 20 L118 30 L128 35 L118 38 L120 48 L110 40 L100 48 L103 38 L93 35 L103 30 L98 20 L108 25 Z'
        fill={accentColor}
      />
    </g>
  )

  // The Shield/Diamond Shape
  const Shield = ({ filled = false }) => (
    <path
      d='M50 5 L90 20 L90 60 C90 85 50 95 50 95 C50 95 10 85 10 60 L10 20 L50 5 Z'
      fill={filled ? primaryColor : 'none'}
      stroke={filled ? 'none' : accentColor}
      strokeWidth='4'
    />
  )

  const renderLogo = () => {
    switch (variant) {
      case 'icon-only':
        return (
          <svg viewBox='0 0 100 100' width={size} height={size} className={className} style={{ color: primaryColor }}>
            <Shield />
            <PersonPath />
          </svg>
        )

      case 'shield-filled':
        return (
          <svg viewBox='0 0 100 100' width={size} height={size} className={className} style={{ color: '#ffffff' }}>
            <Shield filled />
            <PersonPath />
          </svg>
        )

      case 'stacked':
        return (
          <svg viewBox='0 0 100 140' width={size} height={size * 1.4} className={className}>
            <g style={{ color: primaryColor }}>
              <Shield />
              <PersonPath />
            </g>
            <text
              x='50'
              y='115'
              textAnchor='middle'
              fontWeight='bold'
              fontSize='12'
              fontFamily='Arial'
              fill={primaryColor}
            >
              RUN 4
            </text>
            <text
              x='50'
              y='132'
              textAnchor='middle'
              fontWeight='900'
              fontSize='16'
              fontFamily='Arial'
              fill={primaryColor}
            >
              DREAM
            </text>
          </svg>
        )

      default:
        // horizontal
        return (
          <svg viewBox='0 0 250 100' width={size * 2.5} height={size} className={className}>
            <g style={{ color: primaryColor }}>
              <Shield />
              <PersonPath />
            </g>
            <text x='110' y='45' fontWeight='bold' fontSize='24' fontFamily='sans-serif' fill={primaryColor}>
              RUN <tspan fill={accentColor}>4</tspan>
            </text>
            <text x='110' y='80' fontWeight='900' fontSize='32' fontFamily='sans-serif' fill={primaryColor}>
              DREAM
            </text>
          </svg>
        )
    }
  }

  return <>{renderLogo()}</>
}

export default Run4DreamLogo
