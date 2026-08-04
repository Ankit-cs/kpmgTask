# Algorithm Visualizer — Copilot Prompt

Use this prompt when asking Copilot to design new algorithm visualizer pages using the reusable component library.

---

## Prompt

You are building an algorithm visualizer page for the **Vantage** project. Every algorithm page MUST follow the **terminal-brutalist** design system and use the reusable component library at `@/components/visualizer`. Do NOT use Tailwind utilities or custom inline colors — everything comes from the shared `V` tokens.

### Design Philosophy
- **Palette**: Pure dark background (`#09090B`), acid yellow accent (`#EDFF66`), bright non-accent text (`#F5F5F5`) for readability.
- **Typography**: `Monument Extended` (weight 900) for the two-line page title only. `JetBrains Mono` for everything else — labels, code, stat values, logs.
- **Edges**: Zero border-radius everywhere. No rounded corners, no gradients, no shadows. Sharp, flat, terminal aesthetic.
- **Styling**: Inline styles using tokens from `V` object. No Tailwind classes on visualizer content.

### Architecture Pattern
Every visualizer file follows this exact structure:

```
1. IMPORTS — React hooks, lucide icons, visualizer components, VisualizerPointer, CustomCursor
2. CODE_LINES — Array of { n, tokens: [{ t, k }] } objects for pseudocode display
3. LEGEND_ITEMS — Color legend entries: { color, border, label }
4. COMPONENT — Functional component with:
   a. STATE: history[], step, input, loaded, autoPlay, speed (default 300)
   b. generateHistory() — algorithm logic producing snapshot array (PRESERVE ORIGINAL LOGIC)
   c. Controls: load, reset, fwd, back
   d. Auto-play useEffect with Math.max(50, speed) interval floor
   e. Keyboard handler (ArrowRight/Left, Space)
   f. getVariant() — maps state to ArrayBox variant strings
   g. RENDER — uses component library exclusively
```

### Component Library (import from `@/components/visualizer`)

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `VisualizerShell` | Full-page wrapper — dark bg, mono font, full-width padding | `noCursor` |
| `VisualizerHeader` | Monument Extended two-line title + controls slot | `title`, `subtitle`, `category`, `icon`, `right` |
| `ControlBar` | Play/pause/step/speed/reset — pre-load shows children + Run | `loaded`, `playing`, `step`, `totalSteps`, `speed`, `onRun`, `onReset`, `onForward`, `onBackward`, `onPlayPause`, `onSpeedChange` |
| `ProgressBar` | Thin accent progress bar | `step`, `totalSteps` |
| `Panel` | Terminal-window chrome (traffic lights + title) | `title`, `icon`, `accent`, `style` |
| `CodePanel` | Syntax-highlighted pseudocode with active line | `lines`, `activeLine` |
| `ExplanationLog` | Scrolling terminal log | `entries: [{msg, phase}]`, `autoPlay` |
| `ArrayBox` | Array element box with variant coloring | `value`, `index`, `variant`, `size`, `showIndex` |
| `StatBlock` | Metric card | `label`, `value`, `color` |
| `Legend` | Color legend strip | `items: [{color, border, label}]` |
| `ComplexityFooter` | Time/space complexity footer | `items: [{label, value, color, description}]` |
| `InputField` | Terminal-styled input | `label`, `value`, `onChange`, `disabled`, `inputProps` |
| `IdleState` | Awaiting-input placeholder | `icon`, `message` |
| `Divider` | Horizontal line separator | `spacing` |
| `InfoBlock` | Secondary metric card | `label`, `value`, `color` |
| `TreeNode` | Tree node visualization | `value`, `variant`, `level` |
| `GraphNode` | Graph node visualization | `value`, `variant`, `x`, `y` |

Also import separately:
- `VisualizerPointer` from `@/components/VisualizerPointer` — animated arrow pointer for array elements
- `CustomCursor` from `@/components/CustomCursor` — custom cursor replacement

### Design Tokens (`V` object from `@/components/visualizer`)

```js
V.bg          // #09090B — page background
V.surface     // #0C0C0F — panel background
V.elevated    // #151519 — default element background
V.accent      // #EDFF66 — acid yellow
V.accentDim   // rgba(237,255,102,0.12)
V.text        // #F5F5F5 — primary text (bright)
V.muted       // rgba(255,255,255,0.55) — secondary
V.dim         // rgba(255,255,255,0.28) — labels
V.border      // rgba(255,255,255,0.08)
V.borderHi    // rgba(255,255,255,0.16)
V.green / V.greenDim   // sorted state
V.red / V.redDim       // pivot / max
V.amber / V.amberDim   // comparing
V.purple / V.purpleDim // swapping
V.cyan / V.cyanDim     // range / merge pointer
V.blue / V.blueDim     // visited
```

### ArrayBox Variant Names
`"default"` | `"comparing"` | `"pivot"` | `"sorted"` | `"active"` | `"swapping"` | `"found"` | `"visited"` | `"current"` | `"range"`

### Layout Grid (post-load)
```jsx
<div style={{ display: "grid", gridTemplateColumns: "300px 1fr 220px", gridTemplateRows: "auto auto", gap: 14 }}>
  {/* Col 1: Code panel spanning both rows */}
  {/* Col 2 Row 1: Array/visualization panel */}
  {/* Col 3: Stat blocks */}
  {/* Col 2 Row 2: Execution log */}
</div>
```

### VisualizerPointer Rules
- Always use `direction="up"` — places pointer arrows BELOW array boxes (inside the container)
- Container must have `height: "8rem"` for absolute-positioned arrays to fit boxes + pointers
- For flex-layout arrays (HeapSort style), use `paddingBottom: "3rem"` on the container instead
- Pointer references elements by ID pattern: `${containerId}-element-${index}`

### Play-After-Finish Pattern
```jsx
onPlayPause={() => {
  if (step >= history.length - 1) setStep(0);
  setAutoPlay((p) => !p);
}}
```

### Speed Control Pattern
- Default speed: `useState(300)` (300ms between steps)
- Interval floor: `Math.max(50, speed)` in the setInterval
- ControlBar slider inverts the value: high slider = fast, low slider = slow

### CODE_LINES Format
```js
const CODE_LINES = [
  { n: 1, tokens: [{ t: "function ", k: "kw" }, { t: "algoName(arr) {", k: "" }] },
  { n: 2, tokens: [{ t: "  for ", k: "kw" }, { t: "(i = 0; i < n; i++) {", k: "" }] },
  // Use leading spaces in token text for indentation (whiteSpace: pre is set)
  // Token kinds: "kw" (purple), "fn" (green), "var" (amber), "dim" (faded), "" (white)
];
```

### Reference Implementation
See `src/pages/algorithms/Sorting/BubbleSort.jsx` as the canonical reference for the exact file structure, imports, state management, and render pattern.

### Critical Rules
1. **NEVER use Tailwind** classes on visualizer content — inline styles with V tokens only
2. **NEVER use border-radius** — everything is sharp-edged
3. **NEVER hardcode colors** — always reference V.xxx tokens
4. **Always use `VisualizerShell`** as the outermost wrapper
5. **Always include `<CustomCursor />`** as first child of VisualizerShell
6. **Preserve algorithm logic exactly** — only rewrite the render/JSX section
7. **Speed default is 300ms**, not 80ms
8. **Pointers use `direction="up"`** — arrows appear below elements, inside the container
9. **Full-width layout** — no maxWidth constraint on the page
