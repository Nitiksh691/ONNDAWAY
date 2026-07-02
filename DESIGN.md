---
name: Kinetic Azure
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#444657'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#747689'
  outline-variant: '#c4c5da'
  surface-tint: '#1c41ff'
  primary: '#0026be'
  on-primary: '#ffffff'
  primary-container: '#0135fb'
  on-primary-container: '#c4caff'
  inverse-primary: '#bbc3ff'
  secondary: '#4c5d8a'
  on-secondary: '#ffffff'
  secondary-container: '#bacbfe'
  on-secondary-container: '#445581'
  tertiary: '#15349f'
  on-tertiary: '#ffffff'
  tertiary-container: '#344eb7'
  on-tertiary-container: '#c2cbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dfe0ff'
  primary-fixed-dim: '#bbc3ff'
  on-primary-fixed: '#000e5f'
  on-primary-fixed-variant: '#002ad0'
  secondary-fixed: '#dae2ff'
  secondary-fixed-dim: '#b4c5f9'
  on-secondary-fixed: '#041943'
  on-secondary-fixed-variant: '#344571'
  tertiary-fixed: '#dde1ff'
  tertiary-fixed-dim: '#b8c3ff'
  on-tertiary-fixed: '#001356'
  on-tertiary-fixed-variant: '#1f3ca6'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
  surface-ice: '#F8FAFF'
  midnight-base: '#010816'
  accent-electric: '#0135FB'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-margin-mob: 16px
  container-margin-desk: 40px
  gutter: 24px
  card-padding: 20px
---

## Brand & Style

The design system evolves the brand into a premium, service-oriented platform that balances student-focused energy with professional reliability. The aesthetic moves away from basic web patterns toward a **Corporate / Modern** style, characterized by intentional whitespace, high-contrast typography, and depth-driven layering.

The visual narrative centers on "Efficiency in Motion," utilizing a sophisticated dark navy foundation to make the signature electric blue pop as a functional accent rather than a background filler. This creates a high-quality environment that feels trustworthy for financial transactions while remaining vibrant enough for a campus lifestyle.

## Colors

The palette transition introduces **Midnight Base** (#011640) as the primary anchor for text and structural elements, providing the "sophisticated depth" requested. 

- **Primary:** The legacy vibrant blue is preserved for high-action touchpoints (CTAs, active states).
- **Secondary:** Deep Navy is used for headers, primary text, and deep-background sections to provide a premium feel.
- **Surface:** A cool-toned "Ice" white (#F8FAFF) replaces standard white for backgrounds to reduce eye strain and maintain the blue-spectrum brand identity.
- **Functional:** Success, warning, and error states should be tinted with 10% of the primary blue to keep the palette cohesive.

## Typography

This design system utilizes **Plus Jakarta Sans** for its modern, geometric structure and exceptional legibility at small sizes. 

- **Headlines:** Use heavy weights (700-800) with slight negative letter-spacing for a bold, impactful "editorial" look.
- **Body:** Standardized on 16px for optimal readability across mobile devices.
- **Labels:** Uppercase styling is reserved for micro-copy and category tags to create a clear hierarchy against body text.
- **Contrast:** Always use the Secondary (Midnight) color for headlines to ensure maximum accessibility against the light backgrounds.

## Layout & Spacing

The system employs a **12-column fixed-width grid** for desktop (max-width 1280px) and a **fluid 4-column grid** for mobile. 

- **Generous Spacing:** A baseline 8px grid governs all layout decisions. Vertical rhythm between card elements is set to 24px (3 units) to create the requested "airy" and modern feel.
- **Grid Philosophy:** Content is encapsulated in containers. For the "Full Menu," use a 2-column grid on tablet and a single-column stack on mobile to allow food imagery to be the focal point.
- **Margins:** Mobile margins are kept tight (16px) to maximize screen real estate for product images, while desktop margins expand to 40px to frame the content.

## Elevation & Depth

The system uses **Tonal Layers** combined with **Ambient Shadows** to define hierarchy:

1.  **Level 0 (Background):** Surface-Ice (#F8FAFF). Flat.
2.  **Level 1 (Cards/Inputs):** Pure White (#FFFFFF) with a very soft, diffused shadow (0px 4px 20px rgba(1, 22, 64, 0.06)). This makes cards appear to "float" slightly above the surface.
3.  **Level 2 (Modals/Popovers):** Pure White with a more defined shadow and a 1px border in a lightened secondary color (10% opacity) to provide crisp edges without looking "heavy."

Avoid heavy black shadows; all shadows must be tinted with the Secondary Midnight color to maintain color harmony.

## Shapes

The shape language is defined by "Soft Precision." 

- **Cards & Large Containers:** Use a radius of 24px to create a friendly, approachable container.
- **Buttons & Inputs:** Scaled down to 12px or 16px to maintain a professional, clickable appearance.
- **Icon Enclosures:** Small circular or 8px rounded squares for secondary actions.
- **Visual Continuity:** Every interactive element must follow the rounded-lg (16px) or rounded-xl (24px) standard to ensure the UI feels cohesive and modern.

## Components

### Buttons
- **Primary:** Solid Electric Blue with white text. High-contrast, 16px rounded corners, height of 48px or 56px for mobile tap targets.
- **Secondary:** Midnight Navy background with White text for high-importance alternative actions.
- **Ghost:** Transparent background with a 1.5px stroke in Primary Blue.

### Cards
- Food/Product cards should feature a top-aligned or left-aligned image with a subtle 5% midnight-navy border. 
- Ensure a consistent internal padding of 20px. 
- Price points should be bolded using the `title-md` typography level.

### Input Fields
- Clean, minimal style with a 1px border in a neutral slate. 
- On focus, the border transitions to Primary Blue with a 3px soft outer glow (the same color as the border at 20% opacity).

### Chips & Tags
- Used for categories (e.g., "Coffee," "Snacks"). These use a light tint of the brand blue (EEF1FF) with dark blue text for a "pill" look that is distinct from buttons.

### Navigation
- A floating bottom navigation bar for mobile with active states indicated by a Primary Blue dot and icon tint.