"use client";
import React from "react";
import { V, MONO } from "./theme";

/**
 * ArrayBox — Single array element visualization box.
 *
 * A sharp-edged rectangular box that represents one element in an array.
 * Supports multiple visual states via the `variant` prop.
 *
 * @param {string|number} value     – The value to display
 * @param {number}        index     – Element index (used for positioning)
 * @param {string}        [variant] – Visual state:
 *   "default" | "comparing" | "pivot" | "sorted" | "active" |
 *   "swapping" | "found" | "visited" | "current" | "range"
 * @param {number}  [size=56]       – Box width/height in px
 * @param {boolean} [showIndex]     – Show index label below the box
 * @param {object}  [style]         – Extra styles
 * @param {string}  [id]            – HTML id for pointer targeting
 */

const VARIANT_STYLES = {
    default: { bg: V.elevated, border: V.border, text: V.text },
    comparing: { bg: V.amberDim, border: V.amber, text: V.amber },
    pivot: { bg: V.redDim, border: V.red, text: V.red },
    sorted: { bg: V.greenDim, border: V.green, text: V.green },
    active: { bg: V.accentDim, border: V.accent, text: V.accent },
    swapping: { bg: V.purpleDim, border: V.purple, text: V.purple },
    found: { bg: V.greenDim, border: V.green, text: V.green },
    visited: { bg: V.blueDim, border: V.blue, text: V.blue },
    current: { bg: V.accentDim, border: V.accent, text: V.accent },
    range: { bg: V.cyanDim, border: V.cyan, text: V.cyan },
};

export default function ArrayBox({
    value,
    index,
    variant = "default",
    size = 56,
    showIndex = false,
    style: extraStyle,
    id,
}) {
    const vs = VARIANT_STYLES[variant] || VARIANT_STYLES.default;

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
            }}
        >
            <div
                id={id}
                style={{
                    width: size,
                    height: size,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: vs.bg,
                    border: `2px solid ${vs.border}`,
                    fontFamily: MONO,
                    fontSize: size > 40 ? 18 : 14,
                    fontWeight: 700,
                    color: vs.text,
                    transition: "all 0.2s ease",
                    flexShrink: 0,
                    ...extraStyle,
                }}
            >
                {value}
            </div>
            {showIndex && (
                <span
                    style={{
                        fontFamily: MONO,
                        fontSize: 9,
                        color: V.dim,
                        letterSpacing: "0.08em",
                    }}
                >
                    {index}
                </span>
            )}
        </div>
    );
}

