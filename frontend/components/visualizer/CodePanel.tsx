"use client";
import React, { useEffect, useRef } from "react";
import { V, TOKEN_COLORS, MONO } from "./theme";

/**
 * CodePanel — Syntax-highlighted pseudocode with active-line indicator.
 *
 * Expects an array of code line objects:
 *   { n: lineNumber, tokens: [{ t: "text", k: "kw"|"fn"|"var"|"dim"|"" }] }
 *
 * Active line gets an accent-dim background + accent left border.
 *
 * @param {Array}  lines      – Code line objects [{ n, tokens: [{ t, k }] }]
 * @param {number} activeLine – The currently highlighted line number
 */
export default function CodePanel({ lines, activeLine }) {
    const activeRef = useRef(null);

    useEffect(() => {
        activeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, [activeLine]);

    return (
        <div
            style={{
                fontFamily: MONO,
                fontSize: 12,
                lineHeight: "22px",
                color: V.text,
                overflowY: "auto",
                maxHeight: "100%",
                paddingBottom: 8,
            }}
        >
            {lines.map(({ n, tokens }) => {
                const active = activeLine === n;
                return (
                    <div
                        key={n}
                        ref={active ? activeRef : null}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0,
                            background: active ? V.accentDim : "transparent",
                            borderLeft: active
                                ? `2px solid ${V.accent}`
                                : "2px solid transparent",
                            paddingLeft: 0,
                            transition: "background 0.15s, border-color 0.15s",
                        }}
                    >
                        {/* Line number */}
                        <span
                            style={{
                                width: 36,
                                textAlign: "right",
                                paddingRight: 16,
                                color: active ? V.accent : V.dim,
                                flexShrink: 0,
                                fontSize: 10,
                                fontWeight: active ? 700 : 400,
                            }}
                        >
                            {n}
                        </span>
                        {/* Tokens */}
                        {tokens.map((tok, i) => (
                            <span key={i} style={{ color: TOKEN_COLORS[tok.k] || V.text, whiteSpace: "pre" }}>
                                {tok.t}
                            </span>
                        ))}
                    </div>
                );
            })}
        </div>
    );
}

