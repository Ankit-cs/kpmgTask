// @ts-nocheck
"use client";
import React from "react";
import { V, MONO, LABEL_STYLE } from "./theme";

/**
 * Panel — Terminal-window chrome wrapper.
 *
 * Every major section in a visualizer (code, board, log) lives inside a Panel.
 * Features traffic-light dots, a separator, an icon, and an uppercase title.
 *
 * @param {string}  title            – Panel title (displayed uppercase)
 * @param {React.ElementType} [icon] – Lucide icon component
 * @param {string}  [accent]         – Accent color for icon (default: V.accent)
 * @param {object}  [style]          – Extra styles merged onto the outer container
 * @param {React.ReactNode} children – Panel content
 */
export default function Panel({ title, icon: Icon, accent = V.accent, children, style }) {
    return (
        <div
            style={{
                background: V.surface,
                border: `1px solid ${V.border}`,
                display: "flex",
                flexDirection: "column",
                ...style,
            }}
        >
            {/* ── Title bar ── */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "9px 14px",
                    borderBottom: `1px solid ${V.border}`,
                    background: V.bg,
                    flexShrink: 0,
                }}
            >
                {/* Traffic lights */}
                <div style={{ display: "flex", gap: 5 }}>
                    {["rgba(248,113,113,0.7)", "rgba(251,191,36,0.7)", "rgba(52,211,153,0.7)"].map(
                        (c, i) => (
                            <div
                                key={i}
                                style={{ width: 8, height: 8, borderRadius: "50%", background: c }}
                            />
                        )
                    )}
                </div>
                <div style={{ width: 1, height: 12, background: V.border, marginLeft: 4 }} />
                {Icon && <Icon size={11} style={{ color: accent }} />}
                <span style={{ ...LABEL_STYLE, letterSpacing: "0.14em" }}>{title}</span>
            </div>

            {/* ── Content ── */}
            <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                {children}
            </div>
        </div>
    );
}

