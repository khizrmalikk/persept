/**
 * Design Tokens - TypeScript
 * Programmatic access to design system values
 */

export const colors = {
  primary: {
    DEFAULT: '#ff4757',
    dark: '#ee5a6f',
    light: '#ff6b7a',
    rgb: '255, 71, 87',
  },
  accent: {
    DEFAULT: '#ffa502',
    dark: '#ff9500',
    light: '#ffb732',
  },
  background: {
    DEFAULT: '#1a1a2e',
    surface: '#16213e',
    card: '#0f3460',
    elevated: '#1e3a5f',
  },
  text: {
    primary: '#eeeeee',
    secondary: '#a8b2d1',
    muted: '#6b7a99',
    accent: '#64ffda',
  },
  border: {
    DEFAULT: 'rgba(168, 178, 209, 0.12)',
    hover: 'rgba(255, 71, 87, 0.3)',
  },
} as const;

export const spacing = {
  1: '0.5rem',   // 8px
  2: '1rem',     // 16px
  3: '1.5rem',   // 24px
  4: '2rem',     // 32px
  6: '3rem',     // 48px
  8: '4rem',     // 64px
  12: '6rem',    // 96px
  16: '8rem',    // 128px
} as const;

export const fontSize = {
  xs: '0.75rem',    // 12px
  sm: '0.875rem',   // 14px
  base: '1rem',     // 16px
  lg: '1.125rem',   // 18px
  xl: '1.25rem',    // 20px
  '2xl': '1.5rem',  // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem',  // 36px
  '5xl': '3rem',     // 48px
  '6xl': '3.75rem',  // 60px
} as const;

export const borderRadius = {
  sm: '0.5rem',   // 8px
  md: '0.75rem',  // 12px
  lg: '1rem',     // 16px
  xl: '1.5rem',   // 24px
  full: '9999px',
} as const;

export const shadows = {
  sm: '0 2px 8px rgba(15, 52, 96, 0.2)',
  md: '0 4px 16px rgba(15, 52, 96, 0.3)',
  lg: '0 8px 32px rgba(15, 52, 96, 0.4)',
  glow: '0 0 20px rgba(255, 71, 87, 0.3)',
} as const;

export const transitions = {
  fast: '150ms cubic-bezier(0.16, 1, 0.3, 1)',
  base: '250ms cubic-bezier(0.16, 1, 0.3, 1)',
  slow: '400ms cubic-bezier(0.16, 1, 0.3, 1)',
} as const;

export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  modalBackdrop: 1300,
  modal: 1400,
  popover: 1500,
  tooltip: 1600,
} as const;

// Breakpoints (mobile-first)
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Animation keyframes
export const animations = {
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  fadeInUp: {
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
  scaleIn: {
    from: { opacity: 0, transform: 'scale(0.95)' },
    to: { opacity: 1, transform: 'scale(1)' },
  },
  slideInRight: {
    from: { opacity: 0, transform: 'translateX(20px)' },
    to: { opacity: 1, transform: 'translateX(0)' },
  },
} as const;

export type Color = keyof typeof colors;
export type Spacing = keyof typeof spacing;
export type FontSize = keyof typeof fontSize;
export type BorderRadius = keyof typeof borderRadius;
export type Shadow = keyof typeof shadows;
export type Transition = keyof typeof transitions;
export type ZIndex = keyof typeof zIndex;
export type Breakpoint = keyof typeof breakpoints;
