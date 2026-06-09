# Plan: Replace ThemeToggle with shadcn Switch

## Current State
- `src/components/ui/ThemeToggle.astro` uses a custom toggle button with inline SVG icons (moon/sun)
- No shadcn/ui dependencies installed
- Uses CSS variables for dark mode styling (bg-canvas-soft-2, bg-canvas, text-ink, etc.)

## Goal
Replace the theme toggle with a shadcn-style switch component that uses dedicated moon and sun icons.

## Chosen Approach: Manual Recreation
Recreate a shadcn-style switch component manually without adding shadcn dependencies. This keeps the bundle small and aligns with the project's "no framework runtime" architecture.

## Questions Answered
- Single icon in thumb (keep current behavior, just styled as shadcn switch)

## Implementation Plan

### Visual Design (shadcn-inspired)
- Switch track: rounded-full, with subtle inset shadow
- Switch thumb: circular, slides between positions
- Single icon inside thumb (moon for dark mode, sun for light mode) - keeps current UX
- Uses existing CSS variable tokens

### File Changes
- `src/components/ui/ThemeToggle.astro`: Redesign with shadcn switch aesthetics

### Key Changes to Current Implementation
1. Track styling: Enhance with proper shadow (shadow-xs inset style)
2. Thumb styling: Adjust size for proper 44px track height
3. Dark mode: Track swaps between `bg-canvas-soft-2` (light) and `bg-ink` (dark)
4. Thumb: `bg-white` in light mode, `bg-canvas` in dark mode
5. Keep moon icon visible in dark mode only, sun visible in light mode only
6. JS logic remains unchanged

## Ready to Implement
Plan finalized. Ready for implementation phase.
