"use client";
import React from "react";
import { V } from "./theme";

/**
 * ProgressBar — Thin accent-colored progress indicator.
 *
 * Sits below the header/controls, full width.
 *
 * @param {number} step       – Current step (0-based)
 * @param {number} totalSteps – Total number of steps
 */
export default function ProgressBar({ step, totalSteps }) {
    const pct = totalSteps > 1 ? Math.round((step / (totalSteps - 1)) * 100) : 0;

    return (
        <div style={{ height: 2, background: V.border, position: "relative" }}>
            <div
                style={{
                    height: "100%",
                    width: `${pct}%`,
                    background: V.accent,
                    transition: "width 0.1s",
                }}
            />
        </div>
    );
}

