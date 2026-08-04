"use client";
import React from "react";
import { V, MONO, MONUMENT, LABEL_STYLE } from "./theme";

/**
 * StatBlock — Single metric display card.
 *
 * Left-border accent, uppercase label, Monument Extended value.
 *
 * @param {string}        label – Metric label (e.g. "Recursive Calls")
 * @param {string|number} value – Metric value
 * @param {string}        color – Accent color for left border & value text
 */
export default function StatBlock({ label, value, color }) {
    return (
        <div
            style={{
                background: V.surface,
                border: `1px solid ${V.border}`,
                borderLeft: `2px solid ${color}`,
                padding: "12px 16px",
            }}
        >
            <div style={{ ...LABEL_STYLE, marginBottom: 6 }}>{label}</div>
            <div
                style={{
                    fontFamily: MONUMENT,
                    fontWeight: 900,
                    fontSize: 28,
                    color,
                    lineHeight: 1,
                    letterSpacing: "-0.02em",
                }}
            >
                {value}
            </div>
        </div>
    );
}

