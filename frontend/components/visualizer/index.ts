/**
 * Vantage Visualizer — Component Library
 *
 * Barrel export for all reusable visualizer components.
 * Import everything from "@/components/visualizer"
 *
 * Usage:
 *   import { VisualizerShell, VisualizerHeader, Panel, ControlBar, ... } from "@/components/visualizer";
 *   import { V, MONO, MONUMENT, TOKEN_COLORS } from "@/components/visualizer";
 */

// ── Design tokens ──
export { V, TOKEN_COLORS, MONO, MONUMENT, LABEL_STYLE, MONO_TEXT } from "./theme";

// ── Layout ──
export { default as VisualizerShell } from "./VisualizerShell";
export { default as VisualizerHeader } from "./VisualizerHeader";
export { default as Panel } from "./Panel";
export { default as Divider } from "./Divider";

// ── Controls ──
export { default as ControlBar } from "./ControlBar";
export { default as ProgressBar } from "./ProgressBar";
export { default as InputField } from "./InputField";

// ── Code & Explanation ──
export { default as CodePanel } from "./CodePanel";
export { default as ExplanationLog } from "./ExplanationLog";

// ── Data Display ──
export { default as StatBlock } from "./StatBlock";
export { default as InfoBlock } from "./InfoBlock";
export { default as Legend } from "./Legend";
export { default as ComplexityFooter } from "./ComplexityFooter";

// ── Visualization Primitives ──
export { default as ArrayBox } from "./ArrayBox";
export { default as GraphNode } from "./GraphNode";
export { default as TreeNode } from "./TreeNode";
export { default as IdleState } from "./IdleState";
