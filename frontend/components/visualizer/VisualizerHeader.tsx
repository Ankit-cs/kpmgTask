// @ts-nocheck
"use client";
import React from "react";
import { Terminal } from "lucide-react";
import { MONUMENT } from "./theme";
import { V, LABEL_STYLE } from "./theme";

/**
 * VisualizerHeader — Top-of-page algorithm title block.
 *
 * Renders the eyebrow category label and a two-line Monument Extended heading
 * where the second line uses the accent yellow.
 *
 * @param {string}  title      – Main title (e.g. "N-QUEENS")
 * @param {string}  subtitle   – Second line (e.g. "SOLVER.")
 * @param {string}  category   – Eyebrow label (e.g. "Backtracking")
 * @param {React.ReactNode} [icon]  – Optional icon next to eyebrow
 * @param {React.ReactNode} [right] – Optional right-aligned content (e.g. ControlBar)
 */
export default function VisualizerHeader({
    title,
    subtitle,
    category = "",
    icon: Icon = Terminal,
    right,
}) {
    return (
        <div style={{ marginBottom: 20 }}>
            {/* Eyebrow */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Icon size={11} style={{ color: V.accent }} />
                <span style={{ ...LABEL_STYLE, letterSpacing: "0.3em" }}>
                    Algorithm Visualizer{category ? ` · ${category}` : ""}
                </span>
            </div>

            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                {/* Title block */}
                <div>
                    <h1
                        style={{
                            fontFamily: MONUMENT,
                            fontWeight: 900,
                            fontSize: "clamp(2rem,4vw,3.5rem)",
                            letterSpacing: "-0.025em",
                            lineHeight: 0.88,
                            margin: 0,
                            color: V.textBright,
                        }}
                    >
                        {title}
                    </h1>
                    {subtitle && (
                        <div
                            style={{
                                fontFamily: MONUMENT,
                                fontWeight: 900,
                                fontSize: "clamp(2rem,4vw,3.5rem)",
                                letterSpacing: "-0.025em",
                                lineHeight: 0.88,
                                color: V.accent,
                            }}
                        >
                            {subtitle}
                        </div>
                    )}
                </div>

                {/* Right slot (controls, etc.) */}
                {right && <div>{right}</div>}
            </div>
        </div>
    );
}

