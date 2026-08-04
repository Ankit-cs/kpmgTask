// @ts-nocheck
"use client";
import React from "react";
import { V, MONO } from "./theme";

/**
 * GraphNode — Circular node for graph-based visualizations.
 *
 * Renders a positioned or inline circle with a label.
 * Supports multiple visual states for BFS/DFS/Dijkstra etc.
 *
 * @param {string|number} label     – Node label (e.g. "A", 0, 1)
 * @param {string}        [variant] – Visual state:
 *   "default" | "current" | "visited" | "queued" | "discovered" | "source" | "target"
 * @param {number}  [size=48]       – Diameter in px
 * @param {number}  [x]             – Absolute x position (if positioned)
 * @param {number}  [y]             – Absolute y position (if positioned)
 * @param {boolean} [positioned]    – Use absolute positioning (for graph layouts)
 * @param {object}  [style]         – Extra styles
 */

const VARIANT_STYLES = {
    default: { bg: V.elevated, border: V.borderHi, text: V.text, glow: "none" },
    current: { bg: V.accentDim, border: V.accent, text: V.accent, glow: `0 0 12px ${V.accentDim}` },
    visited: { bg: V.greenDim, border: V.green, text: V.green, glow: "none" },
    queued: { bg: V.purpleDim, border: V.purple, text: V.purple, glow: "none" },
    discovered: { bg: V.blueDim, border: V.blue, text: V.blue, glow: "none" },
    source: { bg: V.accentDim, border: V.accent, text: V.accent, glow: `0 0 16px ${V.accentDim}` },
    target: { bg: V.redDim, border: V.red, text: V.red, glow: `0 0 12px ${V.redDim}` },
    processing: { bg: V.amberDim, border: V.amber, text: V.amber, glow: `0 0 10px ${V.amberDim}` },
};

export default function GraphNode({
    label,
    variant = "default",
    size = 48,
    x,
    y,
    positioned = false,
    style: extraStyle,
}) {
    const vs = VARIANT_STYLES[variant] || VARIANT_STYLES.default;

    const positionStyle: React.CSSProperties = positioned
        ? { position: "absolute", left: `${(x || 0) - size / 2}px`, top: `${(y || 0) - size / 2}px` }
        : {};

    return (
        <div style={positionStyle}>
            <div
                style={{
                    width: size,
                    height: size,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: vs.bg,
                    border: `2px solid ${vs.border}`,
                    boxShadow: vs.glow,
                    fontFamily: MONO,
                    fontSize: size > 40 ? 14 : 11,
                    fontWeight: 700,
                    color: vs.text,
                    transition: "all 0.25s ease",
                    ...extraStyle,
                }}
            >
                {label}
            </div>
        </div>
    );
}

