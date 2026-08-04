// @ts-nocheck
"use client";
import React from "react";
import { V } from "./theme";

/**
 * Divider — Thin horizontal separator line.
 *
 * @param {number} [spacing=16] – Vertical margin (top & bottom) in px
 * @param {object} [style]      – Extra styles
 */
export default function Divider({ spacing = 16, style }) {
    return (
        <div
            style={{
                height: 1,
                background: V.border,
                marginTop: spacing,
                marginBottom: spacing,
                ...style,
            }}
        />
    );
}

