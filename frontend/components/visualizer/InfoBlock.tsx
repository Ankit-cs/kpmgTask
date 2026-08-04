"use client";
import React from "react";
import { V, MONO, LABEL_STYLE, MONUMENT } from "./theme";

/**
 * InfoBlock — Compact info/metric card with label, value, and optional details.
 *
 * Used in stat side-panels. Smaller than StatBlock — meant for secondary data
 * like "Phase", "Row/Col", "Current Line", etc.
 *
 * @param {string}        label   – Small uppercase label
 * @param {string|number} value   – Main value
 * @param {string}        [color] – Value text color (default: V.text)
 * @param {React.ReactNode} [children] – Extra detail content below the value
 */
export default function InfoBlock({ label, value, color = V.text, children }) {
    return (
        <div
            style={{
                background: V.surface,
                border: `1px solid ${V.border}`,
                padding: "10px 12px",
            }}
        >
            <div style={{ ...LABEL_STYLE, marginBottom: 8 }}>{label}</div>
            <div
                style={{
                    fontFamily: MONO,
                    fontSize: 13,
                    color,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                }}
            >
                {value}
            </div>
            {children && (
                <>
                    <div style={{ marginTop: 10, height: 1, background: V.border }} />
                    <div style={{ marginTop: 8 }}>{children}</div>
                </>
            )}
        </div>
    );
}

