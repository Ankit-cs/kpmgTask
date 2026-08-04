# Vantage Visualizer — Component Library Documentation

> **Location:** `src/components/visualizer/`
> **Import:** `import { ComponentName, V, MONO } from "@/components/visualizer";`

This document provides **full context** for any agent building algorithm visualizer pages in the Vantage project. Read this before creating or modifying any file in `src/pages/algorithms/`.

---

## 1. Design Philosophy

### Aesthetic: Terminal Brutalist
- **Dark mode only** — background `#09090B`, no light mode for visualizer pages
- **Sharp edges** — zero `border-radius` on all elements (no `rounded-*` Tailwind classes)
- **Flat surfaces** — no gradients, no `box-shadow`, no glassmorphism
- **Terminal chrome** — panels have macOS-style traffic light dots (red/yellow/green) in title bars
- **Data-dense** — compact layouts with minimal whitespace

### Color: Acid Yellow Accent
- Primary accent: **`#EDFF66`** (acid yellow) — used for active states, buttons, highlights
- All other UI: dark grays with **bright white text** for readability
- Semantic colors: green (success), red (error), amber (warning), purple (keywords/backtrack)

### Typography
| Usage | Font | Weight | Details |
|---|---|---|---|
| Page titles | `Monument Extended` | 900 | Uppercase, tight tracking (`-0.025em`) |
| Stat values | `Monument Extended` | 900 | Large numbers, negative tracking |
| Labels | `JetBrains Mono` (monospace) | 700 | ALL-CAPS, wide letter-spacing (`0.14–0.3em`), 9–10px |
| Body/UI text | Monospace | 400–600 | `11–13px`, `#F5F5F5` (near-white) |
| Code | Monospace | 400 | `12px`, syntax-colored |

### Text Brightness Rules
> ⚠️ **Critical:** Non-accent text must be easily readable against dark backgrounds.

| Level | Color Token | Hex / RGBA | Use For |
|---|---|---|---|
| **Bright** | `V.textBright` | `#FFFFFF` | Headings, stat values |
| **Primary** | `V.text` | `#F5F5F5` | Body text, UI labels, code |
| **Secondary** | `V.muted` | `rgba(255,255,255,0.55)` | Descriptions, secondary info |
| **Tertiary** | `V.dim` | `rgba(255,255,255,0.28)` | Line numbers, hints |

**Never** use colors below `0.20` opacity for any text the user needs to read.

### Styling Approach
- Use **inline styles** with theme tokens from `theme.js` — not Tailwind
- Import `V` (colors), `MONO` (font), `MONUMENT` (font) from `@/components/visualizer`
- CSS-in-JS via style objects — no external CSS files for visualizer pages

---

## 2. Component Reference

### Imports

```jsx
import {
  // Design tokens
  V, TOKEN_COLORS, MONO, MONUMENT, LABEL_STYLE, MONO_TEXT,

  // Layout
  VisualizerShell, VisualizerHeader, Panel, Divider,

  // Controls
  ControlBar, ProgressBar, InputField,

  // Code & Explanation
  CodePanel, ExplanationLog,

  // Data Display
  StatBlock, InfoBlock, Legend, ComplexityFooter,

  // Visualization Primitives
  ArrayBox, GraphNode, TreeNode, IdleState,
} from "@/components/visualizer";
```

---

### VisualizerShell
Full-page wrapper. Applies `#09090B` background, monospace font, padding.

```jsx
<VisualizerShell noCursor={true}>
  {/* entire page content */}
</VisualizerShell>
```

| Prop | Type | Default | Description |
|---|---|---|---|
| `children` | ReactNode | — | Page content |
| `noCursor` | boolean | `false` | Hide native cursor (for CustomCursor) |
| `style` | object | — | Extra styles |

---

### VisualizerHeader
Top-of-page algorithm title block with eyebrow label.

```jsx
<VisualizerHeader
  title="BUBBLE"
  subtitle="SORT."
  category="Sorting"
  right={<ControlBar ... />}
/>
```

| Prop | Type | Default | Description |
|---|---|---|---|
| `title` | string | — | Main heading (white, Monument Extended) |
| `subtitle` | string | — | Second line (accent yellow) |
| `category` | string | `""` | Eyebrow category label |
| `icon` | ElementType | `Terminal` | Eyebrow icon |
| `right` | ReactNode | — | Right-aligned content (usually ControlBar) |

---

### ControlBar
Playback controls with two states: pre-load (Run button) and post-load (full transport).

```jsx
<ControlBar
  loaded={isLoaded}
  playing={autoPlay}
  step={step}
  totalSteps={history.length}
  speed={speed}
  onRun={handleRun}
  onReset={handleReset}
  onForward={stepForward}
  onBackward={stepBackward}
  onPlayPause={() => setAutoPlay(p => !p)}
  onSpeedChange={setSpeed}
>
  {/* Pre-load inputs (shown before Run is clicked) */}
  <InputField label="n =" value={n} onChange={e => setN(e.target.value)} type="number" width={48} />
</ControlBar>
```

| Prop | Type | Default | Description |
|---|---|---|---|
| `loaded` | boolean | — | Whether algorithm is loaded |
| `playing` | boolean | — | Auto-play active |
| `step` | number | — | Current step (0-based) |
| `totalSteps` | number | — | Total steps in history |
| `speed` | number | — | Speed value (lower = faster) |
| `minSpeed` | number | `20` | Speed slider minimum |
| `maxSpeed` | number | `400` | Speed slider maximum |
| `onRun` | Function | — | Run button handler |
| `onReset` | Function | — | Reset handler |
| `onForward` | Function | — | Step forward |
| `onBackward` | Function | — | Step backward |
| `onPlayPause` | Function | — | Toggle play/pause |
| `onSpeedChange` | Function | — | Speed change (receives value) |
| `children` | ReactNode | — | Pre-load inputs |

---

### ProgressBar
Thin 2px accent-yellow progress bar.

```jsx
<ProgressBar step={step} totalSteps={history.length} />
```

---

### Panel
Terminal-window chrome wrapper with traffic lights and title bar.

```jsx
<Panel title="pseudocode.js" icon={Terminal} accent={V.accent}>
  <CodePanel lines={codeLines} activeLine={currentLine} />
</Panel>
```

| Prop | Type | Default | Description |
|---|---|---|---|
| `title` | string | — | Uppercase panel title |
| `icon` | ElementType | — | Lucide icon for title bar |
| `accent` | string | `V.accent` | Title bar icon color |
| `style` | object | — | Extra styles on outer div |
| `children` | ReactNode | — | Panel content |

---

### CodePanel
Syntax-highlighted pseudocode with active-line indicator.

```jsx
const codeLines = [
  { n: 1, tokens: [{ t: "function ", k: "kw" }, { t: "sort(arr) {", k: "" }] },
  { n: 2, tokens: [{ t: "  for ", k: "kw" }, { t: "(i = 0; i < n; i++) {", k: "" }] },
];

<CodePanel lines={codeLines} activeLine={state.line} />
```

**Token `k` values:** `"kw"` (purple), `"fn"` (green), `"var"` (amber), `"str"` (green), `"num"` (amber), `"comment"` (muted), `"dim"` (dim), `"type"` (cyan), `""` (white)

---

### StatBlock
Large metric display card with Monument Extended value.

```jsx
<StatBlock label="Recursive Calls" value={42} color={V.green} />
<StatBlock label="Solutions Found" value={3} color={V.accent} />
```

---

### InfoBlock
Compact info card for secondary metadata.

```jsx
<InfoBlock label="Phase" value="BACKTRACK" color={V.purple}>
  <div style={{ fontFamily: MONO, fontSize: 9, color: V.dim }}>
    row: <span style={{ color: V.muted }}>4</span>
  </div>
</InfoBlock>
```

---

### Legend
Horizontal color legend strip.

```jsx
<Legend items={[
  { color: V.amberDim,  border: V.amber,  label: "Trying" },
  { color: V.greenDim,  border: V.green,  label: "Placed" },
  { color: V.redDim,    border: V.red,    label: "Conflict" },
  { color: V.purpleDim, border: V.purple, label: "Backtrack" },
  { color: V.accentDim, border: V.accent, label: "Solution" },
]} />
```

---

### ExplanationLog
Scrolling terminal-style execution log.

```jsx
<Panel title="execution log" icon={Terminal} accent={V.green}>
  <ExplanationLog
    entries={history.slice(0, step + 1).filter(s => s.msg).map(s => ({ msg: s.msg, phase: s.phase }))}
    autoPlay={isPlaying}
    maxHeight={160}
  />
</Panel>
```

**Built-in phases:** `solution`, `place`, `conflict`, `backtrack`, `done`, `start`, `try`, `success`, `error`, `warning`, `info`

---

### ComplexityFooter
Algorithm complexity analysis section at page bottom.

```jsx
<ComplexityFooter items={[
  {
    label: "Time Complexity",
    value: "O(n!)",
    color: V.amber,
    description: "Worst case explores all placements..."
  },
  {
    label: "Space Complexity",
    value: "O(n)",
    color: V.green,
    description: "Recursion depth bounded by n..."
  },
]} />
```

---

### ArrayBox
Single array element box.

```jsx
<ArrayBox
  value={42}
  index={3}
  variant="comparing"   // "default"|"comparing"|"pivot"|"sorted"|"active"|"swapping"|"found"|"visited"|"current"|"range"
  size={56}
  showIndex
  id="arr-element-3"
/>
```

---

### GraphNode
Circular graph node.

```jsx
<GraphNode
  label="A"
  variant="current"    // "default"|"current"|"visited"|"queued"|"discovered"|"source"|"target"|"processing"
  size={48}
  x={200}
  y={150}
  positioned
/>
```

---

### TreeNode
Tree node with optional balance factor and height.

```jsx
<TreeNode
  value={15}
  variant="root"       // "default"|"current"|"highlighted"|"new"|"root"|"balanced"|"unbalanced"
  size={44}
  balanceFactor={-1}
  height={3}
/>
```

---

### InputField
Styled input matching the terminal aesthetic.

```jsx
<InputField
  label="n ="
  value={nInput}
  onChange={e => setNInput(e.target.value)}
  type="number"
  width={48}
  disabled={loaded}
/>
```

---

### IdleState
Awaiting-input placeholder shown before algorithm loads.

```jsx
<IdleState
  icon={Crown}
  heading="AWAITING INPUT"
  message='Set <span style="color:#EDFF66">n</span> and press <span style="color:#EDFF66">Run</span> to start'
/>
```

---

### Divider
Thin horizontal separator.

```jsx
<Divider spacing={16} />
```

---

## 3. Full Page Composition Example

Here's how to compose a complete algorithm visualizer page:

```jsx
import React, { useState, useCallback, useEffect, useRef } from "react";
import { Terminal, BarChart3 } from "lucide-react";
import {
  V, MONO, MONUMENT,
  VisualizerShell, VisualizerHeader, ControlBar, ProgressBar,
  Panel, CodePanel, ExplanationLog, Divider,
  StatBlock, Legend, ComplexityFooter,
  ArrayBox, InputField, IdleState,
} from "@/components/visualizer";
import CustomCursor from "@/components/CustomCursor";

const BubbleSortVisualizer = () => {
  const [history, setHistory] = useState([]);
  const [step, setStep] = useState(-1);
  const [input, setInput] = useState("8,5,2,9,5,6,3");
  const [loaded, setLoaded] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [speed, setSpeed] = useState(80);

  // ... algorithm logic, generateHistory, etc.

  const state = history[step] || {};
  const pct = history.length > 1 ? Math.round((step / (history.length - 1)) * 100) : 0;

  return (
    <VisualizerShell noCursor>
      <CustomCursor />

      {/* ── HEADER + CONTROLS ── */}
      <VisualizerHeader
        title="BUBBLE"
        subtitle="SORT."
        category="Sorting"
        right={
          <ControlBar
            loaded={loaded}
            playing={autoPlay}
            step={step}
            totalSteps={history.length}
            speed={speed}
            onRun={() => { /* load */ }}
            onReset={() => { /* reset */ }}
            onForward={() => setStep(s => Math.min(s + 1, history.length - 1))}
            onBackward={() => setStep(s => Math.max(s - 1, 0))}
            onPlayPause={() => setAutoPlay(p => !p)}
            onSpeedChange={setSpeed}
          >
            <InputField label="Array" value={input} onChange={e => setInput(e.target.value)} disabled={loaded} />
          </ControlBar>
        }
      />

      {loaded && <ProgressBar step={step} totalSteps={history.length} />}
      <Divider spacing={12} />

      {!loaded ? (
        <IdleState icon={BarChart3} message='Enter an array and press <span style="color:#EDFF66">Run</span>' />
      ) : (
        /* ── MAIN LAYOUT ── */
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr 200px", gap: 10 }}>

          {/* Code Panel */}
          <Panel title="pseudocode.js" icon={Terminal} style={{ gridRow: "1 / 3" }}>
            <div style={{ padding: "12px 0", flex: 1, overflow: "hidden" }}>
              <CodePanel lines={CODE_LINES} activeLine={state.line} />
            </div>
          </Panel>

          {/* Array Visualization */}
          <Panel title="array" icon={BarChart3} accent={V.amber}>
            <div style={{ padding: "20px 16px", display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center" }}>
              {state.array?.map((item, i) => (
                <ArrayBox
                  key={item.id}
                  value={item.value}
                  index={i}
                  variant={getVariant(i, state)}
                  showIndex
                  id={`arr-el-${i}`}
                />
              ))}
            </div>
            <div style={{ padding: "8px 16px 12px" }}>
              <Legend items={LEGEND_ITEMS} />
            </div>
          </Panel>

          {/* Stats */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <StatBlock label="Comparisons" value={state.comparisons ?? 0} color={V.green} />
            <StatBlock label="Swaps" value={state.swaps ?? 0} color={V.accent} />
            <StatBlock label="Progress" value={`${pct}%`} color={V.purple} />
          </div>

          {/* Execution Log */}
          <Panel title="execution log" icon={Terminal} accent={V.green} style={{ gridColumn: "2 / 3" }}>
            <ExplanationLog
              entries={history.slice(0, step + 1).filter(s => s.msg).map(s => ({ msg: s.msg, phase: s.phase }))}
              autoPlay={autoPlay}
            />
          </Panel>
        </div>
      )}

      {/* Complexity Footer */}
      {loaded && (
        <div style={{ marginTop: 10 }}>
          <ComplexityFooter items={[
            { label: "Time Complexity", value: "O(N²)", color: V.amber, description: "Nested loops..." },
            { label: "Space Complexity", value: "O(1)", color: V.green, description: "In-place sorting..." },
          ]} />
        </div>
      )}
    </VisualizerShell>
  );
};
```

---

## 4. Design Rules Summary

1. **Always wrap** pages in `<VisualizerShell>` — never use Tailwind dark mode classes
2. **Always use** `V.*` tokens for colors — never hardcode hex values
3. **Never use** `border-radius`, `rounded-*`, or `shadow-*` — everything is sharp and flat
4. **Monument Extended** for headings/stat values only — everything else uses monospace
5. **Labels** are always: monospace, 9px, bold, uppercase, wide letter-spacing, `V.dim` color
6. **Buttons** are 36px height, sharp edges, monospace text
7. **Accent yellow** (`V.accent`) for: active elements, Run button, progress bars, highlights
8. **Non-accent text** must be bright (`V.text` = `#F5F5F5`) — never dim for readable content
9. **Panels** wrap every major section — always include traffic-light title bars
10. **Grid layouts** use CSS Grid with pixel column widths — not Tailwind grid
11. **Transitions** are `0.1s–0.25s ease` — no springs or bounces
12. **Import from** `@/components/visualizer` — never import individual files directly
