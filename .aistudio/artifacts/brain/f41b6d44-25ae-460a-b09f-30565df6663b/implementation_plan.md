# Implementation Plan: Swiss Editorial Layout Spacing, 3×2 Telemetry Grid & SVG Callout Geometry

## 1. Overview
Retain the exact **Swiss Editorial & IEEE / Nature Research Workbench** palette (`#F4F3EE` canvas, `#FAF9F5` surfaces, `#EAE8E0` headers, `#1C1C1C` structural ink borders, `Playfair Display` + `JetBrains Mono`) and all physics/data functionality while resolving cramped spacing, text wrapping, and SVG label collisions across the interface.

---

## 2. Planned Changes by Module

### A. Top 6 Telemetry Cards — Spacious 3×2 Grid (`/src/components/View1CorridorConsole.tsx`)
1. **3×2 Grid Architecture**:
   - Replace the 6-column compressed strip with `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 my-6`.
   - Style each card with `p-6 bg-[#FAF9F5] border border-[#1C1C1C] flex flex-col justify-between min-h-[155px] rounded-none shadow-none`.
2. **Single-Line Header Row & Non-Wrapping Tag Badges**:
   - Format the card header with `flex items-center justify-between gap-2`.
   - Render the right-hand tags (`[DELHI]`, `LGBM-L2`, `α = 0.90`, `STATUTORY`, `PRE-EMPTIVE`, `θ = 314°`) as compact single-line badges: `px-2 py-0.5 text-xs font-mono border border-[#D4D2C8] bg-[#EAE8E0] whitespace-nowrap`.
3. **High-Impact Primary Readout & Full-Width Metadata Footer**:
   - Enlarge the primary numerical metric to `text-3xl font-bold font-mono tabular-nums tracking-tight my-2`.
   - Format the bottom metadata row with `text-xs font-mono leading-relaxed pt-3 border-t border-[#E2E0D8] flex justify-between items-center whitespace-nowrap` and remove width truncation (`max-w-[130px] truncate`) so full strings like `CAQM GRAP Stage-IV Severe+` display cleanly on a single line.

### B. Page Container, Control Bar & Panel Breathing Room (`/src/App.tsx`, `/src/components/View1CorridorConsole.tsx`, `/src/components/View2PhysicsDiagnosticsLab.tsx`, `/src/components/View3BenchmarksAndLatex.tsx`, `/src/components/View4ShapAndCostOptimizer.tsx`)
1. **Main Page Container (`/src/App.tsx`)**:
   - Upgrade `<main>` container spacing to `max-w-[1600px] w-full mx-auto px-8 py-6 space-y-6`.
   - Align the masthead and footer inner containers to `max-w-[1600px] mx-auto px-8` for consistent horizontal margins.
2. **Spacious Stream & Corridor Node Control Bar (`/src/App.tsx`)**:
   - Render the control bar inside the workspace container (`max-w-[1600px] mx-auto px-8 pt-6`) as a dedicated architectural bar: `flex flex-wrap items-center justify-between gap-4 p-4 bg-[#FAF9F5] border border-[#1C1C1C]`.
   - Add `gap-2` between the 5 city buttons (`Ludhiana`, `Chandigarh`, `Karnal`, `Delhi NCR`, `Lucknow`) with larger button padding (`px-3.5 py-1.5 text-xs font-mono border border-[#1C1C1C]`).
3. **Split Panel Gaps & Internal Padding (`View1`–`View4`)**:
   - Increase grid gaps between left (`Fig. 1A`) and right (`Fig. 1B`) panels (and across Views 2–4) to `gap-6` (`space-y-6` vertically).
   - Increase panel header and body padding to `p-6` with generous slider cell padding (`p-4`).

### C. Non-Overlapping Corridor SVG Map Geometry (`/src/utils/corridorTelemetryEngine.ts`, `/src/components/View1CorridorConsole.tsx`)
1. **Expanded SVG ViewBox & Diagonal Node Separation**:
   - Increase the `Fig. 1A` SVG `viewBox` to `0 0 680 380` (with `h-[320px]`) and spread the 5 station coordinates generously along the NW-to-SE diagonal:
     - `Ludhiana`: `(95, 78)`
     - `Chandigarh`: `(210, 118)`
     - `Karnal`: `(330, 185)`
     - `Delhi NCR`: `(455, 250)`
     - `Lucknow`: `(585, 310)`
2. **Staggered Callout Placement (Zero Collisions)**:
   - Position each station's coordinate label box (`124×34px`) on alternating sides of the transport axis with crisp leader lines:
     - `Ludhiana`: **above-left** (`x - 75, y - 50`)
     - `Chandigarh`: **above-right** (`x + 16, y - 48`)
     - `Karnal`: **below-left** (`x - 134, y + 14`)
     - `Delhi NCR`: **above-right** (`x + 18, y - 48`)
     - `Lucknow`: **below-left / offset** (`x - 135, y - 48` or clear bottom-right margin) so every station box, wind arrow, and transit-lag badge (`Δt = -12h..-8h`, `Δt = -6h lag`, `+10h downwind`) has dedicated whitespace with zero overlap.
