// @ts-nocheck
"use client";
import React, { useRef, useEffect } from "react";
import { V, MONO } from "./theme";

/**
 * ExplanationLog — Scrolling terminal-style execution log.
 *
 * Used inside a Panel to show step-by-step algorithm messages.
 * Each entry has a phase-colored prefix symbol and message.
 *
 * @param {Array}   entries    – Array of { msg: string, phase: string }
 * @param {boolean} [autoPlay] – Whether auto-play is currently active (shows blinking cursor)
 * @param {number}  [maxHeight=160] – Max height before scrolling
 * @param {object}  [phaseColors] – Override the default phase→color mapping
 * @param {object}  [phasePrefixes] – Override the default phase→prefix mapping
 */

const DEFAULT_PHASE_COLORS = {
    solution: V.accent,
    place: V.green,
    conflict: V.red,
    backtrack: V.purple,
    done: V.accent,
    start: V.muted,
    success: V.green,
    error: V.red,
    warning: V.amber,
    info: V.cyan,
};

const DEFAULT_PHASE_PREFIXES = {
    solution: "✓",
    place: "+",
    conflict: "✗",
    backtrack: "↩",
    done: "■",
    start: "▶",
    try: "→",
    success: "✓",
    error: "✗",
    warning: "⚠",
    info: "·",
};

export default function ExplanationLog({
    entries = [],
    autoPlay = false,
    maxHeight = 160,
    phaseColors,
    phasePrefixes,
}) {
    const logRef = useRef<HTMLDivElement>(null);
    const colors = { ...DEFAULT_PHASE_COLORS, ...phaseColors };
    const prefixes = { ...DEFAULT_PHASE_PREFIXES, ...phasePrefixes };

    useEffect(() => {
        if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
    }, [entries.length]);

    return (
        <div
            ref={logRef}
            style={{
                padding: "10px 14px",
                flex: 1,
                overflowY: "auto",
                maxHeight,
            }}
        >
            {entries.map((entry, i) => {
                const color = colors[entry.phase] || V.text;
                const prefix = prefixes[entry.phase] || "·";
                return (
                    <div
                        key={i}
                        style={{
                            fontFamily: MONO,
                            fontSize: 11,
                            color,
                            lineHeight: "18px",
                            display: "flex",
                            gap: 8,
                            padding: "1px 0",
                        }}
                    >
                        <span style={{ color: V.dim, flexShrink: 0 }}>{prefix}</span>
                        <span>{entry.msg}</span>
                    </div>
                );
            })}

            {/* Blinking cursor when auto-playing */}
            {autoPlay && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontFamily: MONO,
                        fontSize: 11,
                        color: V.dim,
                        marginTop: 4,
                    }}
                >
                    <span>running</span>
                    <span
                        style={{
                            display: "inline-block",
                            width: 7,
                            height: 13,
                            background: V.accent,
                            marginLeft: 2,
                            animation: "viz-blink 1s step-end infinite",
                            verticalAlign: "text-bottom",
                        }}
                    />
                </div>
            )}

            {/* Inject blink keyframe once */}
            <style>{`@keyframes viz-blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
        </div>
    );
}

