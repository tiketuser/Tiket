---
name: tiket-page-design
description: Use when building any new page or UI section for the TIKET project. Triggers on requests like add a page, create a screen, design a view, or build a new section within the TIKET codebase.
---

# TIKET Page Design

## Overview

New TIKET pages must match the existing design system exactly: colors, typography, spacing, RTL, mobile-first. Reuse existing components before writing new ones.

## Core Design Tokens

Colors (CSS variables, dynamic per event category):
- Primary: var(--color-primary) default #B54653 (red) -> use bg-primary / text-primary
- Secondary: var(--color-secondary) #EAC4C7 (light pink) -> use bg-secondary / text-secondary
- Highlight: var(--color-highlight) #8C5A5F (dark red) -> use bg-highlight / text-highlight
- Text: main #08050A, strong #3C3E5F, muted #667085

Always use CSS variable classes (bg-primary, text-primary), not hardcoded hex.

Typography - always responsive pairs:
- text-heading-1-mobile / md:text-heading-1-desktop
- text-heading-2-mobile / md:text-heading-2-desktop
- text-heading-3-mobile / md:text-heading-3-desktop
- text-small, text-regular, text-medium, text-large (body)

Font: Google Assistant (loaded globally via layout.tsx).
Shadows: shadow-xxsmall through shadow-xxlarge (7 levels). Cards use shadow-medium or shadow-xlarge.

## Page Structure Template

Always include:
- dir=rtl on root element (Hebrew site)
- min-h-screen on main
- pb-20 lg:pb-0 for mobile bottom nav clearance
- Responsive padding: px-4 sm:px-8 and py-8 sm:py-14
- max-w-5xl mx-auto w-full to center content

Example structure:
  main[min-h-screen pb-20 lg:pb-0 dir=rtl]
    section[py-8 sm:py-14 px-4 sm:px-8]
      TitleSubtitle title subtitle
    section[py-8 px-4 sm:px-8 max-w-5xl mx-auto w-full]
      div[grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6]
        cards here

## Existing Components to Reuse

TitleSubtitle       - Page header + subtitle         - app/components/TitleSubtitle/
Card                - Event card (grid view)          - app/components/Card/
MinimalCard         - Ticket row (list view)          - app/components/MinimalCard/
SingleCard          - Ticket with seat info           - app/components/SingleCard/
BundleCard          - Multi-ticket bundle             - app/components/BundleCard/
CustomInput         - Text input with icon            - app/components/CustomInput/
CustomSelectInput   - Select dropdown                 - app/components/CustomSelectInput/
CustomDateInput     - Date picker                     - app/components/CustomDateInput/
CustomSearchInput   - Search bar with autocomplete    - app/components/CustomSearchInput/
AdjustableDialog    - Modal/dialog wrapper            - app/components/Dialogs/AdjustableDialog/
CheckBox            - Checkbox / toggle               - app/components/CheckBox/
PriceFilter         - Price range filter              - app/components/PriceFilter/
CategoryFilter      - Category filter                 - app/components/CategoryFilter/

## Button Styles

Primary:   btn btn-primary px-6 py-3 rounded-lg
Secondary: btn btn-secondary px-6 py-3 rounded-lg border-[2px]
CTA sized (like HeroSection): btn btn-primary w-[100px] h-[50px] sm:w-28 sm:h-16 text-heading-5-mobile sm:text-heading-4-desktop

## Card Patterns

Standard card styling:
  rounded-xl shadow-xlarge border border-gray-100 border-b-[4px] border-b-highlight hover:scale-105 transition-transform duration-300
  Image: h-32 sm:h-[264px] w-full object-cover rounded-t-xl
  Content: p-4

Minimal list row styling:
  flex items-center gap-3 border-b border-dashed border-gray-200 py-3
  Date sidebar: bg-secondary/30 rounded-lg p-2 text-center min-w-[52px]
    Day of week: text-extra-small text-muted
    Day number: text-heading-4-mobile font-bold text-primary (large)
    Month: text-extra-small
  Content: flex-1
  Price: text-primary font-bold (e.g. 250 shekel)

## Mobile Design Rules

1. Bottom nav is fixed - always add pb-20 lg:pb-0 to page root
2. Typography always scales - pair text-*-mobile with md:text-*-desktop
3. Buttons scale - scale-[0.87] sm:scale-100 for touch targets
4. Dialogs are near-fullwidth - w-[95%] sm:w-auto
5. Grids collapse - grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
6. For complex mobile/desktop differences use sm:hidden and hidden sm:block to render entirely different layouts (see BundleCard as reference)

## Dialog Pattern

Use AdjustableDialog for all modals - pass isOpen, onClose, heading, description props.
It handles: overlay blur, slide-up animation (0.3s), scroll, exit button, RTL support.

## Animation Reference

animate-fade-in-down  - Dropdowns, tooltips (0.2s ease-out)
animate-slideUp       - Modals, bottom sheets (0.3s ease-out)
hover:scale-105 transition-transform duration-300 - Card hover

All interactive transitions: duration-300.

## Common Mistakes

Hardcoded #B54653 color  ->  Use bg-primary / text-primary
Missing dir=rtl          ->  Add to root main element
No bottom padding mobile ->  Add pb-20 lg:pb-0
Desktop-only font size   ->  Pair text-*-mobile + md:text-*-desktop
New input from scratch   ->  Use CustomInput component
New modal from scratch   ->  Use AdjustableDialog
Themed element no anim   ->  Add transition-colors duration-300
