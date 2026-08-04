// @ts-nocheck
"use client";
import React from "react";
import { V, MONO, MONUMENT, LABEL_STYLE } from "./theme";

/**
 * IdleState — Empty/awaiting-input placeholder.
 *
 * Shown before the algorithm is loaded.
 * Displays a centered dimmed icon, Monument heading, and instruction text.
 *
 * @param {React.ElementType} icon        – Lucide icon component
 * @param {string}            [heading]   – Main heading text (default: "AWAITING INPUT")
 * @param {string}            [message]   – Instruction message
 * @param {React.ReactNode}   [children]  – Override for custom content
 */
export default function IdleState({
    icon: Icon,
    heading = "AWAITING INPUT",
    message,
    children,
}) {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "80px 0",
                gap: 16,
                textAlign: "center",
            }}
        >
            {Icon && <Icon size={36} style={{ color: V.accentDim }} />}

            <div>
                <div
                    style={{
                        fontFamily: MONUMENT,
                        fontWeight: 900,
                        fontSize: 18,
                        color: "rgba(255,255,255,0.18)",
                        letterSpacing: "0.04em",
                    }}
                >
                    {heading}
                </div>

                {message && (
                    <div
                        style={{
                            fontFamily: MONO,
                            fontSize: 11,
                            color: V.dim,
                            marginTop: 6,
                        }}
                        dangerouslySetInnerHTML={{ __html: message }}
                    />
                )}

                {children}
            </div>
        </div>
    );
}

