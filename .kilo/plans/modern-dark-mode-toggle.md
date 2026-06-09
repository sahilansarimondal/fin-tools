# Plan: Modern Dark Mode Toggle Switch

## Current State
- ThemeToggle.astro uses a bulky toggle (56px × 44px) with a 36px knob
- Large footprint in the header navigation
- Current design works but feels "fat" and dated

## Goal
Create a slick, modern dark mode toggle switch that is:
- Compact (36px × 20px track, 16px knob)
- Smooth animations with proper easing
- Subtle hover/active micro-interactions
- Clean, minimal aesthetic

## Implementation Plan

### Visual Design (Modern Minimal)
- **Track**: 36px wide × 20px tall, `rounded-full`
- **Knob**: 16px × 16px circular, white background
- **Icons**: 12px sun/moon that appear based on state
- **Hover**: Scale to 105% for subtle interaction
- **Focus**: Standard focus ring from design system

### Design Tokens
- Light track: `bg-canvas-soft-2`
- Dark track: `bg-ink` 
- Knob: `bg-canvas` (white in light mode, also works in dark)
- Icon: `text-ink` / `text-body` with proper dark variants
- Shadow: `shadow-xs` on knob only

### File Changes
- `src/components/ui/ThemeToggle.astro`: Complete redesign

### Animation Details
- Knob slides 16px horizontally between states
- Smooth `transition-transform duration-200 ease-out`
- No transform on initial load (handled by JS)

## Ready to Implement
Plan finalized. Ready for implementation phase.
