"use client";
import React from "react";
import { V, MONO } from "./theme";

/**
 * TreeNode — Single tree node for tree-based visualizations.
 *
 * Renders a circular node with value, optional annotations (height, balance factor),
 * and supports visual states. Used with SVG edges for tree structures.
 *
 * @param {string|number} value      – Node value
 * @param {string}        [variant]  – Visual state:
 *   "default" | "current" | "highlighted" | "new" | "root" | "balanced" | "unbalanced"
 * @param {number}  [size=44]        – Diameter in px
 * @param {number}  [x]              – X position for absolute positioning
 * @param {number}  [y]              – Y position for absolute positioning
 * @param {boolean} [positioned]     – Whether to use absolute positioning
 * @param {number}  [balanceFactor]  – AVL balance factor (shows as badge)
 * @param {number}  [height]         – Tree height annotation
 * @param {object}  [style]          – Extra styles
 */

const VARIANT_STYLES = {
    default: { bg: V.elevated, border: V.borderHi, text: V.text },
    current: { bg: V.accentDim, border: V.accent, text: V.accent },
    highlighted: { bg: V.cyanDim, border: V.cyan, text: V.cyan },
    new: { bg: V.greenDim, border: V.green, text: V.green },
    root: { bg: V.purpleDim, border: V.purple, text: V.purple },
    balanced: { bg: V.greenDim, border: V.green, text: V.green },
    unbalanced: { bg: V.redDim, border: V.red, text: V.red },
};

export default function TreeNode({
    value,
    variant = "default",
    size = 44,
    x,
    y,
    positioned = false,
    balanceFactor,
    height,
    style: extraStyle,
}) {
    const vs = VARIANT_STYLES[variant] || VARIANT_STYLES.default;

    const positionStyle = positioned
        ? { position: "absolute", left: `${(x || 0) - size / 2}px`, top: `${(y || 0) - size / 2}px` }
        : {};

    return (
        <div style={{ ...positionStyle, display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
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
                    fontFamily: MONO,
                    fontSize: size > 40 ? 14 : 11,
                    fontWeight: 700,
                    color: vs.text,
                    transition: "all 0.25s ease",
                    position: "relative",
                    ...extraStyle,
                }}
            >
                {value}

                {/* Balance factor badge */}
                {balanceFactor !== undefined && balanceFactor !== null && (
                    <div
                        style={{
                            position: "absolute",
                            top: -6,
                            right: -6,
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: Math.abs(balanceFactor) > 1 ? V.red : V.green,
                            color: V.bg,
                            fontSize: 9,
                            fontWeight: 700,
                            fontFamily: MONO,
                        }}
                    >
                        {balanceFactor}
                    </div>
                )}
            </div>

            {/* Height annotation */}
            {height !== undefined && height !== null && (
                <span
                    style={{
                        fontFamily: MONO,
                        fontSize: 8,
                        color: V.dim,
                        marginTop: 2,
                        letterSpacing: "0.06em",
                    }}
                >
                    h={height}
                </span>
            )}
        </div>
    );
}

