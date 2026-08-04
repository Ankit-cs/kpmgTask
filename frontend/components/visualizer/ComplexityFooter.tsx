"use client";
import React from "react";
import { V, MONO, MONUMENT, LABEL_STYLE } from "./theme";

/**
 * ComplexityFooter — Algorithm complexity analysis section.
 *
 * Renders a responsive grid of complexity entries (typically 2: Time & Space).
 * Each entry has a colored label, big-font value, and description text.
 *
 * @param {Array} items – Array of { label, value, color, description }
 *   - `label`       – e.g. "Time Complexity"
 *   - `value`       – e.g. "O(n!)"
 *   - `color`       – accent color for the value + left border
 *   - `description` – explanatory paragraph
 */
export default function ComplexityFooter({ items }) {
    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: `repeat(${Math.min(items.length, 3)}, 1fr)`,
                gap: 10,
            }}
        >
            {items.map(({ label, value, color, description }) => (
                <div
                    key={label}
                    style={{
                        background: V.surface,
                        border: `1px solid ${V.border}`,
                        borderLeft: `2px solid ${color}`,
                        padding: "14px 16px",
                        display: "flex",
                        gap: 16,
                    }}
                >
                    {/* Left: label + value */}
                    <div style={{ flexShrink: 0 }}>
                        <div style={{ ...LABEL_STYLE, marginBottom: 6 }}>{label}</div>
                        <div
                            style={{
                                fontFamily: MONUMENT,
                                fontWeight: 900,
                                fontSize: 22,
                                color,
                                letterSpacing: "-0.01em",
                            }}
                        >
                            {value}
                        </div>
                    </div>

                    {/* Divider */}
                    <div style={{ width: 1, background: V.border, flexShrink: 0 }} />

                    {/* Description */}
                    <p
                        style={{
                            fontFamily: MONO,
                            fontSize: 10.5,
                            color: V.muted,
                            lineHeight: 1.7,
                            margin: 0,
                        }}
                    >
                        {description}
                    </p>
                </div>
            ))}
        </div>
    );
}

