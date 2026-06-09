# Fix Button Active State Dark Mode Issue

## Problem
Active buttons (FIRE Calculator nav link, Start Planning button) use `bg-ink text-white`:
- In light mode: dark background (#171717) + white text ✓ (works)
- In dark mode: light background (#ededed) + white text ✗ (broken contrast)

## Solution
Replace `text-white` with `text-canvas` in all active button styles. This leverages CSS variables that switch in dark mode:
- Light mode: `bg-ink=#171717`, `text-canvas=#ffffff` → dark bg + white text ✓
- Dark mode: `bg-ink=#ededed`, `text-canvas=#171717` → light bg + dark text ✓

## Files to Modify
1. **src/components/layout/Header.astro** - Lines 23, 33, 42, 54
2. **src/components/ui/Button.astro** - Line 24 (primary variant)

## Changes
### Header.astro
- Line 23: `'bg-ink text-white'` → `'bg-ink text-canvas'`
- Line 33: `'bg-ink text-white'` → `'bg-ink text-canvas'`
- Line 42: `'bg-ink text-white'` → `'bg-ink text-canvas'`
- Line 54: `text-white` → `text-canvas`

### Button.astro
- Line 24: `'bg-ink text-white'` → `'bg-ink text-canvas'`

## Verification
Run dev server and check dark mode toggle on both buttons.
