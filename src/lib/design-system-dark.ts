export const darkTheme = {
  background: {
    primary: '#0a0a0a',
    secondary: '#111111',
    tertiary: '#1a1a1a',
    elevated: '#1f1f1f',
  },

  brand: {
    red: '#b91c1c',
    redGlow: '#dc2626',
    redDark: '#991b1b',
    redLight: 'rgba(185, 28, 28, 0.1)',
  },

  text: {
    primary: '#ffffff',
    secondary: '#a3a3a3',
    muted: '#737373',
    accent: '#b91c1c',
  },

  border: {
    default: '#262626',
    subtle: '#1f1f1f',
    hover: '#333333',
  },

  gradients: {
    redGlow: 'radial-gradient(circle at 50% 50%, rgba(185, 28, 28, 0.2) 0%, transparent 70%)',
    darkToRed: 'linear-gradient(135deg, #0a0a0a 0%, #1a0505 100%)',
    heroOverlay: 'radial-gradient(ellipse at 50% 0%, rgba(185, 28, 28, 0.15) 0%, transparent 60%)',
  },
} as const;
