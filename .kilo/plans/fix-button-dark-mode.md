# Fix Button Active State Dark Mode Issue

## Problem
Active buttons use `bg-ink text-white`:
- In light mode: dark background (#171717) + white text ✓ (works)
- In dark mode: light background (#ededed) + white text ✗ (broken contrast)

## Solution
Replace `text-white` with `text-canvas` in all active button styles. This leverages CSS variables that switch in dark mode:
- Light mode: `bg-ink=#171717`, `text-canvas=#ffffff` → dark bg + white text ✓
- Dark mode: `bg-ink=#ededed`, `text-canvas=#171717` → light bg + dark text ✓

## Files to Modify
1. **src/components/layout/Header.astro** (DONE)
   - Line 23: `'bg-ink text-white'` → `'bg-ink text-canvas'`
   - Line 33: `'bg-ink text-white'` → `'bg-ink text-canvas'`
   - Line 42: `'bg-ink text-white'` → `'bg-ink text-canvas'`
   - Line 54: `text-white` → `text-canvas`

2. **src/components/ui/Button.astro** (DONE)
   - Line 24: `'bg-ink text-white'` → `'bg-ink text-canvas'`

3. **src/components/calculator/FIRECalculator.astro** (DONE)
   - Lines 20, 23, 26, 29: data attribute classes updated
   - Line 225: chart type button updated
   - Lines 559, 564, 583, 586, 593, 596: JS class manipulation updated

4. **src/pages/learn/fire-number.astro** (DONE)
   - Line 81: badge text updated
   - Line 107: button text updated

5. **src/pages/learn/fire-strategies.astro** (DONE)
   - Line 91: button text updated

6. **src/pages/learn/what-is-fire.astro** (DONE)
    - Line 109: `text-white` → `text-canvas`
7. **src/pages/index.astro** (DONE)
    - Line 32: `text-white` → `text-canvas` (Start Calculating button)
    - Lines 134, 140, 146: `text-white` → `text-canvas` (number badges)
    - Line 191: `text-white` → `text-canvas` (Open Calculator button)

## Verification
Run dev server and check dark mode toggle on all buttons.
