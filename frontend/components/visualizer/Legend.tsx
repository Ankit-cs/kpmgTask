"use client";
import React from "react";
import { V, MONO } from "./theme";

/**
 * Legend — Color legend strip for visualization states.
 *
 * Renders a horizontal row of color swatches with labels.
 *
 * @param {Array} items – Array of { color: string, border?: string, label: string }
 *   - `color`  – background color of the swatch
 *   - `border` – optional border color (defaults to same as color)
 *   - `label`  – text label
 */
export default function Legend({ items }) {
    return (
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            {items.map(({ color, border, label }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div
                        style={{
                            width: 12,
                            height: 12,
                            background: color,
                            border: `1px solid ${border || color}`,
                        }}
                    />
                    <span
                        style={{
                            fontFamily: MONO,
                            fontSize: 10,
                            color: V.muted,
                            letterSpacing: "0.08em",
                        }}
                    >
                        {label}
                    </span>
                </div>
            ))}
        </div>
    );
}

