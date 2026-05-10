---
name: Tecni Express Design System
colors:
  surface: '#f9f9fc'
  surface-dim: '#dadadc'
  surface-bright: '#f9f9fc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f6'
  surface-container: '#eeeef0'
  surface-container-high: '#e8e8ea'
  surface-container-highest: '#e2e2e5'
  on-surface: '#1a1c1e'
  on-surface-variant: '#3f4941'
  inverse-surface: '#2f3133'
  inverse-on-surface: '#f0f0f3'
  outline: '#6f7a70'
  outline-variant: '#bec9be'
  surface-tint: '#0f6c3f'
  primary: '#00542e'
  on-primary: '#ffffff'
  primary-container: '#126e40'
  on-primary-container: '#98edb4'
  inverse-primary: '#84d8a0'
  secondary: '#545f72'
  on-secondary: '#ffffff'
  secondary-container: '#d5e0f7'
  on-secondary-container: '#586377'
  tertiary: '#3e485a'
  on-tertiary: '#ffffff'
  tertiary-container: '#566073'
  on-tertiary-container: '#d1dbf1'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#a0f5bb'
  primary-fixed-dim: '#84d8a0'
  on-primary-fixed: '#00210f'
  on-primary-fixed-variant: '#00522d'
  secondary-fixed: '#d8e3fa'
  secondary-fixed-dim: '#bcc7dd'
  on-secondary-fixed: '#111c2c'
  on-secondary-fixed-variant: '#3c475a'
  tertiary-fixed: '#d9e3f9'
  tertiary-fixed-dim: '#bdc7dc'
  on-tertiary-fixed: '#121c2c'
  on-tertiary-fixed-variant: '#3d4759'
  background: '#f9f9fc'
  on-background: '#1a1c1e'
  surface-variant: '#e2e2e5'
typography:
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  technical-data:
    fontFamily: Hanken Grotesk
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  edge_margin: 16px
  stack_gutter: 12px
---

## Brand & Style

The visual identity of this design system is rooted in **Technical Precision** and **Operational Efficiency**. Designed specifically for internal logistics and billing, the aesthetic avoids decorative excess in favor of high-performance utility.

The brand personality is that of a "Trusted Expert"—reliable, direct, and meticulously organized. By utilizing a **Corporate / Modern** style with minimalist leanings, the interface minimizes cognitive load for technicians and inventory managers who need to process large amounts of data (SKUs, serial numbers, and pricing) under time-sensitive conditions. The result is an environment that feels as sturdy and professional as the industrial hardware the company services.

## Colors

The palette is derived from the forest green of the company logo, optimized for digital accessibility and depth.

- **Primary (Forest Green):** Used for primary actions, success states, and brand reinforcement. It conveys stability and growth.
- **Secondary (Slate/Dark Grey):** Utilized for secondary navigation and icons, providing a neutral balance that doesn't compete with primary data.
- **Surface & Backgrounds:** A clean, slightly cool white base ensures that text remains legible even in high-glare environments (e.g., technicians working outdoors or in bright workshops).
- **Semantic Accents:** High-contrast Amber and Red are reserved strictly for inventory alerts (Low Stock / Out of Stock) to ensure immediate visual recognition.

## Typography

This design system uses **Hanken Grotesk** for its sharp, geometric construction which mimics the technical manuals and engineering blueprints associated with white goods.

- **Data Hierarchy:** A specific `technical-data` style is implemented for SKUs and Serial Numbers, using a slightly heavier weight to ensure these critical identifiers are never overlooked.
- **Numerical Clarity:** All numbers should ideally use tabular lining (monospaced numbers) to ensure that prices and stock quantities align perfectly in tables and lists.
- **Mobile Optimization:** Headlines are kept compact to maximize the "above the fold" real estate for inventory lists.

## Layout & Spacing

This design system employs a **Fluid Grid** layout tailored for mobile devices, utilizing a 4-column structure with 16px side margins.

- **Density:** Given the nature of inventory management, a "Medium-High" density is preferred. Elements are spaced close enough to minimize scrolling but far enough apart to prevent "fat-finger" errors during fast-paced stock entry.
- **Vertical Rhythm:** A strict 4px baseline grid ensures that technical data tables remain aligned and professional.
- **Touch Targets:** Despite the density, all interactive elements (buttons, checkboxes) maintain a minimum height of 44px for ergonomic use.

## Elevation & Depth

Visual hierarchy in this design system is achieved through **Tonal Layering** rather than aggressive shadows. This maintains the "sober" and "professional" requirement.

- **Level 0 (Background):** Base surface (#F8FAFC).
- **Level 1 (Cards/Tables):** Pure white surfaces with a subtle, 1px neutral-200 border.
- **Level 2 (Active/Modals):** High-diffusion, low-opacity shadows (4% opacity black) to lift critical input forms above the inventory lists.
- **Focus States:** 2px solid primary green rings are used to indicate active text fields, ensuring the user knows exactly where data is being entered.

## Shapes

The shape language is **Soft (Level 1)**. Elements feature a 4px (0.25rem) corner radius.

This subtle rounding strikes a balance between the industrial, rigid nature of spare parts (washers, AC compressors) and the modern friendliness of a digital tool. It ensures the UI feels contemporary without appearing too consumer-oriented or "soft." Buttons, input fields, and inventory cards all share this uniform radius to create a cohesive, systematic feel.

## Components

### Inventory Cards
Cards are the core unit of this design system. They must display:
- **Header:** Part Name and SKU (Bold).
- **Body:** Technical specs (e.g., "Voltage: 220V") in a 2-column small-text layout.
- **Footer:** Stock status pill on the left, Price on the right.

### Stock Status Pills
High-visibility indicators:
- **Available:** Forest Green background, White text.
- **Low Stock:** Amber background, White text.
- **Out of Stock:** Grey-800 background, White text.

### Data Tables
Optimized for mobile via horizontal swiping for non-critical columns. The first column (Product/ID) remains "sticky" to ensure context is never lost.

### Action Buttons
- **Primary:** Full-width Forest Green for "Generate Invoice" or "Save Item."
- **Secondary:** Outlined Grey for "Cancel" or "Print Draft."

### Technical Inputs
Input fields for quantities should include stepper controls (+ / -) to allow for quick adjustments without opening the keyboard, specifically useful for technicians wearing work gloves.