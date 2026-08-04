# DESIGN SINGLE SOURCE OF TRUTH

This document serves as the absolute source of truth for all colors, fonts, and core design tokens used in the Sandbox UI.

## Colors
- **Background (Base)**: `#000000`
- **Background (Surface)**: `#111111`
- **Background (Elevated)**: `#222222`
- **Text (Primary)**: `#FFFFFF`
- **Text (Muted)**: `#A3A3A3`
- **Accent (Primary)**: `#EDFF66`
- **Accent (Muted)**: `#EDFF6633`
- **Border**: `#333333`

## Typography
- **Primary Font**: `JetBrains Mono`
- **Heading Font**: `Monument Extended` (or generic `sans-serif` with uppercase styling)

## Spacing & Borders
- **Padding**: `16px` standard
- **Border Radius**: `4px` or `0px` for brutalist panels.
- **Border Width**: `1px` standard.

Any `.tsx` or `.jsx` component in the UI MUST stick to these tokens and avoid using arbitrary hex colors.
