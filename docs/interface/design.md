# Design System: Humanistic Minimalism (Notion x Anthropic)

## 1. Visual Theme & Atmosphere

JustBB embodies the philosophy of a high-quality physical notebook: a blank canvas that gets out of your way. The design system is built on **warm neutrals** rather than cold grays, creating a distinctly approachable minimalism that feels like **quality paper** rather than sterile glass. The page canvas is pure white (`#ffffff`) but the text isn't pure black -- it's a warm **Anthropic Black** (`#1d1d1b`) that softens the reading experience imperceptibly. The warm gray scale carries subtle yellow-brown undertones, giving the interface a tactile, almost analog warmth.

The custom font stack (Inter-based) is the backbone of the system. At display sizes (64px), it uses aggressive negative letter-spacing (-2.125px), creating headlines that feel compressed and precise. The weight range is broader than typical systems: 400 for body, 500 for UI elements, 600 for semi-bold labels, and 700 for display headings. OpenType features `"lnum"` (lining numerals) and `"locl"` (localized forms) are enabled on larger text, adding typographic sophistication.

What makes this visual language distinctive is its border philosophy. Rather than heavy borders or shadows, we use ultra-thin `1px solid rgba(29,29,27,0.1)` borders -- borders that exist as whispers, barely perceptible division lines that create structure without weight. The shadow system is equally restrained: multi-layer stacks with cumulative opacity never exceeding 0.05, creating depth that's felt rather than seen.

**Key Characteristics:**

- Inter-based typography with negative letter-spacing at display sizes (-2.125px at 64px)
- Warm neutral palette: grays carry yellow-brown undertones (`#f6f5f4` warm white, `#31302e` warm dark)
- Near-black text via **Anthropic Black** (`#1d1d1b`) -- creating micro-warmth and reducing eye strain
- Ultra-thin borders: `1px solid rgba(29,29,27,0.1)` throughout -- whisper-weight division
- Multi-layer shadow stacks with sub-0.05 opacity for barely-there depth
- **Anthropic Clay** (`#d97757`) as the singular accent color for CTAs and interactive elements
- Pill badges (9999px radius) with tinted clay backgrounds for status indicators
- 8px base spacing unit with an organic, non-rigid scale

## 2. Color Palette & Roles

### Primary

- **Anthropic Black** (`#1d1d1b`): Primary text, headings, body copy. The warm tone softens pure black without sacrificing readability.
- **Pure White** (`#ffffff`): Page background, card surfaces, button text on accent colors.
- **Anthropic Clay** (`#d97757`): Primary CTA, link color, interactive accent -- the only saturated color in the core UI chrome.

### Brand Secondary

- **Claude Purple** (`#af8fef`): Secondary brand color, used sparingly for emphasis and specialized features.
- **Active Clay** (`#c46648`): Button active/pressed state -- darker variant of Anthropic Clay.

### Warm Neutral Scale

- **Warm White** (`#f6f5f4`): Background surface tint, section alternation, subtle card fill. The yellow undertone is key.
- **Warm Dark** (`#31302e`): Dark surface background, dark section text. Warmer than standard grays.
- **Warm Gray 500** (`#6b6964`): Secondary text, descriptions, muted labels.
- **Warm Gray 300** (`#a39e98`): Placeholder text, disabled states, caption text.

### Semantic Accent Colors

- **Teal** (`#2a9d99`): Success states, positive indicators.
- **Green** (`#1aae39`): Confirmation, completion badges.
- **Orange** (`#dd5b00`): Warning states, attention indicators.
- **Pink** (`#ff64c8`): Decorative accent, feature highlights.

### Interactive

- **Link Clay** (`#d97757`): Primary link color with underline-on-hover.
- **Focus Clay** (`#d97757`): Focus ring on interactive elements.
- **Badge Clay Bg** (`#fdf5f2`): Pill badge background, tinted clay surface.
- **Badge Clay Text** (`#d97757`): Pill badge text, darker clay for readability.

### Shadows & Depth

- **Card Shadow** (`rgba(0,0,0,0.04) 0px 4px 18px, rgba(0,0,0,0.027) 0px 2.025px 7.84688px, rgba(0,0,0,0.02) 0px 0.8px 2.925px, rgba(0,0,0,0.01) 0px 0.175px 1.04062px`): Multi-layer card elevation.
- **Deep Shadow** (`rgba(0,0,0,0.01) 0px 1px 3px, rgba(0,0,0,0.02) 0px 3px 7px, rgba(0,0,0,0.02) 0px 7px 15px, rgba(0,0,0,0.04) 0px 14px 28px, rgba(0,0,0,0.05) 0px 23px 52px`): Five-layer deep elevation for modals and featured content.
- **Whisper Border** (`1px solid rgba(29,29,27,0.1)`): Standard division border -- cards, dividers, sections.

## 3. Typography Rules

### Font Family

- **Primary**: `Inter`, with fallbacks: `-apple-system, system-ui, Segoe UI, Helvetica, Apple Color Emoji, Arial, Segoe UI Emoji, Segoe UI Symbol`
- **OpenType Features**: `"lnum"` (lining numerals) and `"locl"` (localized forms) enabled on display and heading text.

### Hierarchy

| Role              | Font  | Size           | Weight | Line Height  | Letter Spacing | Color           |
| ----------------- | ----- | -------------- | ------ | ------------ | -------------- | --------------- |
| Display Hero      | Inter | 64px (4.00rem) | 700    | 1.00 (tight) | -2.125px       | Anthropic Black |
| Display Secondary | Inter | 54px (3.38rem) | 700    | 1.04 (tight) | -1.875px       | Anthropic Black |
| Section Heading   | Inter | 48px (3.00rem) | 700    | 1.00 (tight) | -1.5px         | Anthropic Black |
| Sub-heading Large | Inter | 40px (2.50rem) | 700    | 1.50         | normal         | Anthropic Black |
| Sub-heading       | Inter | 26px (1.63rem) | 700    | 1.23 (tight) | -0.625px       | Anthropic Black |
| Card Title        | Inter | 22px (1.38rem) | 700    | 1.27 (tight) | -0.25px        | Anthropic Black |
| Body Large        | Inter | 20px (1.25rem) | 600    | 1.40         | -0.125px       | Anthropic Black |
| Body              | Inter | 16px (1.00rem) | 400    | 1.60         | normal         | Anthropic Black |
| Body Medium       | Inter | 16px (1.00rem) | 500    | 1.60         | normal         | Anthropic Black |
| Body Semibold     | Inter | 16px (1.00rem) | 600    | 1.60         | normal         | Anthropic Black |
| Body Bold         | Inter | 16px (1.00rem) | 700    | 1.60         | normal         | Anthropic Black |
| Nav / Button      | Inter | 14px (0.88rem) | 500    | 1.33         | normal         | Anthropic Black |
| Caption           | Inter | 14px (0.88rem) | 500    | 1.43         | normal         | Warm Gray 500   |
| Caption Light     | Inter | 14px (0.88rem) | 400    | 1.43         | normal         | Warm Gray 500   |
| Badge             | Inter | 12px (0.75rem) | 600    | 1.33         | 0.125px        | Anthropic Clay  |
| Micro Label       | Inter | 12px (0.75rem) | 400    | 1.33         | 0.125px        | Warm Gray 500   |

### Principles

- **Compression at scale**: Inter at display sizes uses -2.125px letter-spacing at 64px, progressively relaxing to -0.625px at 26px and normal at 16px.
- **Warm scaling**: Line height is kept at a comfortable `1.60` for body text to maintain an open, humanistic feel, but tightens as size increases for headings.
- **Badge micro-tracking**: The 12px badge text uses positive letter-spacing (0.125px), creating wider, more legible small text.

## 4. Component Stylings

### Buttons

**Primary Clay**

- Background: `#d97757` (Anthropic Clay)
- Text: `#ffffff`
- Padding: 8px 16px
- Radius: 6px
- Border: `1px solid transparent`
- Hover: background darkens to `#c46648`
- Active: scale(0.95) transform
- Use: Primary CTA

**Secondary / Tertiary**

- Background: `rgba(29,29,27,0.05)` (translucent warm gray)
- Text: `#1d1d1b` (Anthropic Black)
- Padding: 8px 16px
- Radius: 6px
- Hover: scale(1.02)
- Active: scale(0.95) transform
- Use: Secondary actions

**Pill Badge Button**

- Background: `#fdf5f2` (tinted clay)
- Text: `#d97757`
- Padding: 4px 8px
- Radius: 9999px
- Font: 12px weight 600

### Cards & Containers

- Background: `#ffffff`
- Border: `1px solid rgba(29,29,27,0.1)` (whisper border)
- Radius: 12px (standard cards), 16px (featured/modals)
- Shadow: Multi-layer stack for subtle elevation.

### Inputs & Forms

- Background: `#ffffff`
- Text: `#1d1d1b`
- Border: `1px solid #dddddd`
- Radius: 4px
- Focus: Clay outline ring

## 5. Layout Principles

### Spacing System

- Base unit: 8px
- Scale: 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px

### Whitespace Philosophy

- **Generous vertical rhythm**: 64-120px between major sections. Let content breathe.
- **Warm alternation**: White sections alternate with warm white (`#f6f5f4`) sections.

### Border Radius Scale

- Micro (4px): Inputs
- Standard (6px): Buttons
- Comfortable (12px): Standard cards
- Large (16px): Dialogs and Modals

## 6. Depth & Elevation

| Level               | Treatment                        | Use              |
| ------------------- | -------------------------------- | ---------------- |
| Flat (Level 0)      | No shadow                        | Page background  |
| Whisper (Level 1)   | `1px solid rgba(29,29,27,0.1)`   | Standard borders |
| Soft Card (Level 2) | 4-layer shadow stack             | Content cards    |
| Deep Card (Level 3) | 5-layer shadow stack (52px blur) | Modals           |

## 7. Responsive Behavior

(Unchanged from original Notion specifications)

## 8. Accessibility & States

- **Focus System**: 2px solid Focus Clay indicator.
- **Interactive States**: scale(1.02) on hover, scale(0.95) on active.
- **Color Contrast**: Anthropic Black on white exceeds 14:1 ratio.

## 9. Agent Prompt Guide

### Quick Color Reference

- Primary CTA: Anthropic Clay (`#d97757`)
- Background: Pure White (`#ffffff`)
- Alt Background: Warm White (`#f6f5f4`)
- Text: Anthropic Black (`#1d1d1b`)
- Border: `1px solid rgba(29,29,27,0.1)`
- Link: Anthropic Clay (`#d97757`)
- Focus ring: Anthropic Clay (`#d97757`)
