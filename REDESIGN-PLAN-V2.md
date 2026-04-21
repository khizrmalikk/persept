# Persept Redesign Plan V2 - Comprehensive Overhaul

## 🎯 Goals
1. **Aesthetic & Retro Theme** - Less dark, warmer tones, nostalgic feel
2. **Consistent Design Language** - Unified animations, custom SVGs, cohesive styling
3. **Clean Up Structure** - Remove duplicates, complete incomplete pages
4. **Mobile-First** - Fix navbar covering content, perfect mobile experience
5. **Professional Polish** - Custom illustrations, smooth interactions

---

## 🎨 New Design System

### Color Palette (Retro-Modern)
**Primary:** Warm reds/oranges (keeping brand but warmer)
- Primary: `#ff4757` (coral red)
- Primary Dark: `#ee5a6f` 
- Accent: `#ffa502` (warm orange)

**Backgrounds:** Not pure black, warmer grays
- Background: `#1a1a2e` (dark navy blue - warmer than black)
- Surface: `#16213e` (slightly lighter navy)
- Card: `#0f3460` (muted blue for depth)

**Text:**
- Primary: `#eee` (soft white)
- Secondary: `#a8b2d1` (muted blue-gray)
- Accent: `#64ffda` (cyan accent for highlights)

### Typography
- **Headings:** Bold, slightly rounded (Inter or Poppins)
- **Body:** Clean, readable (Inter)
- **Spacing:** 8px grid system

### Retro Elements
- Subtle gradients with grain texture
- Rounded corners (12-16px)
- Soft shadows with color tints
- Animated dots/particles (retro computer aesthetic)
- Custom SVG illustrations in duotone style

---

## 📋 Task Breakdown

### Phase 1: Audit & Cleanup (30 min)
**Task 1.1:** Identify all pages and their status
- List all route files
- Mark duplicates
- Mark incomplete pages
- Document what each page should contain

**Task 1.2:** Fix navbar mobile issue
- Add proper top padding to all pages
- Ensure navbar doesn't cover content
- Test on mobile breakpoints

### Phase 2: Design System Setup (45 min)
**Task 2.1:** Create new color system
- Update globals.css with new color variables
- Create theme tokens
- Update all components to use new colors

**Task 2.2:** Create custom SVG illustrations
- Hero section illustration
- Solution cards icons (custom, not emoji or lucide)
- Section dividers/decorations
- Background patterns

**Task 2.3:** Build animation library
- Smooth fade-in-up
- Card hover effects (subtle lift + glow)
- Retro particle system (dots floating)
- Page transitions

### Phase 3: Page Redesign (Each page: 30-45 min)
**Task 3.1:** Landing Page
- Hero with custom illustration
- Solutions showcase with custom SVG icons
- Visual storytelling
- Interactive elements
- Smooth scroll animations

**Task 3.2:** Hotel Overview (`/hotel`)
- Clear value proposition
- Visual agent showcase
- Stats section with animations
- Call-to-action with custom illustration

**Task 3.3:** Our Solution (`/solution`)
- Complete this page if incomplete
- Problem → Solution flow
- Visual diagrams
- Feature breakdown

**Task 3.4:** Pricing Page
- Clear tier comparison
- Visual pricing cards
- ROI calculator (interactive)
- FAQ section

**Task 3.5:** GYST Page
- Consistent with new theme
- Custom illustrations
- Feature showcase

**Task 3.6:** DAP Page
- Consistent with new theme
- Travel-themed illustrations
- Feature showcase

### Phase 4: Components & Polish (30 min)
**Task 4.1:** Navbar redesign
- Logo refinement
- Smooth transitions
- Mobile menu animation
- Sticky behavior with backdrop blur

**Task 4.2:** Footer
- Consistent styling
- Social links
- Newsletter signup?

**Task 4.3:** Reusable components
- Button styles
- Card components
- Section headers
- Feature cards

### Phase 5: Testing & Optimization (30 min)
- Mobile responsiveness check
- Animation performance
- Load time optimization
- Cross-browser testing

---

## 🤖 Sub-Agent Strategy

### Agent 1: Design System Architect (Opus)
**Task:** Create comprehensive design system
- Color palette implementation
- Typography setup
- Component library
- Animation utilities

### Agent 2: Illustration Creator (Opus)
**Task:** Create all custom SVG illustrations
- Hero illustrations (3-4 variations)
- Icon set (15-20 custom icons)
- Background patterns
- Section decorators

### Agent 3: Page Builder - Landing (Sonnet)
**Task:** Redesign landing page with new system

### Agent 4: Page Builder - Hotel Section (Sonnet)
**Task:** Redesign hotel pages with new system

### Agent 5: Page Builder - Solutions (Sonnet)
**Task:** Redesign GYST and DAP pages

### Agent 6: QA & Polish (Haiku)
**Task:** Test everything, fix bugs, optimize

---

## 📦 Deliverables

1. **Design System Documentation**
   - Color palette with examples
   - Typography scale
   - Component library
   - Animation guidelines

2. **Custom Assets**
   - 15-20 custom SVG illustrations
   - Background patterns
   - Icon set
   - Textures/overlays

3. **Updated Pages (All redesigned)**
   - Landing page
   - Hotel overview
   - Our Solution
   - Pricing
   - GYST
   - DAP

4. **Components**
   - Navbar (desktop + mobile)
   - Footer
   - Button variants
   - Card styles
   - Section templates

---

## ⏱️ Timeline Estimate

- **Phase 1 (Audit):** 30 min
- **Phase 2 (Design System):** 45 min
- **Phase 3 (Pages):** 3 hours (6 pages × 30 min)
- **Phase 4 (Components):** 30 min
- **Phase 5 (Testing):** 30 min

**Total:** ~5 hours

**With parallel sub-agents:** ~2-3 hours

---

## 🚀 Next Steps

1. You approve this plan
2. I spawn sub-agents for parallel work
3. Design system agent starts immediately
4. Page builders wait for design system
5. QA agent does final pass

Ready to start? 🎨
