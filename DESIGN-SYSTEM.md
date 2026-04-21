# Persept Design System
## Retro-Modern Aesthetic

A warm, accessible design system with nostalgic aesthetic and professional polish.

---

## 🎨 Color Palette

### Primary Colors
- **Coral Red:** `#ff4757` - Main brand color, CTAs, links
- **Primary Dark:** `#ee5a6f` - Hover states
- **Warm Orange:** `#ffa502` - Accents, highlights

### Backgrounds (Warm, Never Pure Black)
- **Background:** `#1a1a2e` - Main page background (warm navy)
- **Surface:** `#16213e` - Elevated sections
- **Card:** `#0f3460` - Card backgrounds
- **Elevated:** `#1e3a5f` - Modals, popovers

### Text
- **Primary:** `#eeeeee` - Headings, body text
- **Secondary:** `#a8b2d1` - Subheadings, labels
- **Muted:** `#6b7a99` - Captions, disabled
- **Accent:** `#64ffda` - Special highlights (cyan)

### Accessibility
All color combinations meet WCAG 2.2 AA standards:
- Text on backgrounds: 4.5:1 minimum
- UI components: 3:1 minimum

---

## 📏 Spacing System

8px grid system for consistency:

```css
--space-1:  8px   (0.5rem)
--space-2:  16px  (1rem)
--space-3:  24px  (1.5rem)
--space-4:  32px  (2rem)
--space-6:  48px  (3rem)
--space-8:  64px  (4rem)
--space-12: 96px  (6rem)
--space-16: 128px (8rem)
```

**Usage:**
- Component padding: 16-24px
- Section spacing: 48-64px
- Page margins: 96px+

---

## 🔤 Typography

### Font Stack
- **Body:** Inter (fallback: system-ui)
- **Headings:** Inter (bold weight)

### Scale (Modular 1.25)
```css
xs:   12px / 16px line-height
sm:   14px / 20px
base: 16px / 24px  ← Body default
lg:   18px / 28px
xl:   20px / 28px
2xl:  24px / 32px  ← Section headers
3xl:  30px / 36px
4xl:  36px / 40px
5xl:  48px / 1     ← Hero titles
6xl:  60px / 1
```

### Usage Guidelines
- Body: `text-base` (16px)
- Small text: `text-sm` (14px)
- Section headers: `text-2xl` or `text-3xl`
- Hero: `text-5xl` or `text-6xl`
- Line height: 1.5 for body, 1.2 for headings

---

## 🔲 Border Radius

Rounded, friendly feel:
```css
sm:   8px   - Buttons, inputs
md:   12px  - Default cards
lg:   16px  - Large cards, modals
xl:   24px  - Hero sections
full: 9999px - Pills, avatars
```

---

## 🌟 Shadows

Soft shadows with color tints (not pure black):
```css
sm:   0 2px 8px rgba(15, 52, 96, 0.2)
md:   0 4px 16px rgba(15, 52, 96, 0.3)
lg:   0 8px 32px rgba(15, 52, 96, 0.4)
glow: 0 0 20px rgba(255, 71, 87, 0.3)  ← Hover effects
```

---

## 🎭 Animations

### Timing Function
**Smooth, natural motion:**
```css
cubic-bezier(0.16, 1, 0.3, 1)
```
❌ Never use `ease-in-out`, `bounce`, or `elastic` (feels cheap)

### Duration
- **Fast:** 150ms - Micro-interactions (hover)
- **Base:** 250ms - Default transitions
- **Slow:** 400ms - Page transitions

### Properties to Animate
✅ `transform`, `opacity` (GPU accelerated)
❌ Avoid animating `width`, `height`, `margin` (janky)

### Keyframes
```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
```

---

## 🧩 Components

### Buttons
```html
<button class="btn-retro">
  Get Started
</button>
```
**Hover:** Lift 2px + glow
**Active:** Return to 0

### Cards
```html
<div class="card-retro">
  Content here
</div>
```
**Hover:** Border glow + lift 4px

### Text Gradient
```html
<h1 class="text-gradient-primary">
  AI Workforce Solutions
</h1>
```

---

## 🎨 Special Effects

### Grain Texture
Subtle noise overlay on body:
```css
.bg-grain {
  background-image: url("data:image/svg+xml...");
}
```

### Glassmorphism
```css
.glass {
  background: rgba(22, 33, 62, 0.6);
  backdrop-filter: blur(12px);
}
```

### Dot Pattern
```css
.bg-dots {
  background-image: radial-gradient(...);
  background-size: 24px 24px;
}
```

---

## 📱 Responsive Breakpoints

Mobile-first approach:
```css
sm:  640px  - Large phones
md:  768px  - Tablets
lg:  1024px - Laptops
xl:  1280px - Desktops
2xl: 1536px - Large screens
```

---

## ♿ Accessibility

### Checklist
- [ ] Color contrast 4.5:1 minimum (text)
- [ ] Color contrast 3:1 minimum (UI)
- [ ] Keyboard navigation works
- [ ] Focus states visible (outline)
- [ ] ARIA labels on interactive elements
- [ ] `prefers-reduced-motion` respected

### Code Example
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 🚀 Usage

### Import Design System
```tsx
// In your layout.tsx or globals.css
import './design-system.css';
```

### Use Design Tokens (TypeScript)
```tsx
import { colors, spacing, transitions } from '@/lib/design-tokens';

const MyComponent = () => (
  <div style={{ 
    backgroundColor: colors.background.card,
    padding: spacing[4],
    transition: transitions.base,
  }}>
    Content
  </div>
);
```

### Use CSS Variables
```css
.my-component {
  background: var(--color-card);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  transition: var(--transition-base);
}
```

---

## 🎯 Design Principles

1. **Warm > Cold** - Never pure black/gray, always add warmth
2. **Contrast Creates Hierarchy** - Big vs small, dark vs light
3. **Whitespace Creates Calm** - Generous spacing, breathing room
4. **Consistency Builds Trust** - Repeat patterns across pages
5. **Accessibility Includes Everyone** - Design for all users

---

## 📚 Resources

- **Color Tool:** [Coolors.co](https://coolors.co)
- **Contrast Checker:** [WebAIM](https://webaim.org/resources/contrastchecker/)
- **Inspiration:** Linear, Stripe, Vercel
- **Icons:** Lucide React

---

**Version:** 1.0.0  
**Last Updated:** 2026-04-21  
**Maintained by:** Ricky (Developer Agent)
