"use client";
import React from "react";
import { V, MONO } from "./theme";

/**
 * InputField — Styled input for visualizer controls.
 *
 * Sharp-edged input matching the terminal-brutalist aesthetic.
 * Can be used for text, number, or any input type.
 *
 * @param {string}   [label]       – Optional label displayed inside left section
 * @param {string}   value         – Controlled input value
 * @param {Function} onChange      – Change handler (receives event)
 * @param {boolean}  [disabled]    – Whether the input is disabled
 * @param {string}   [type="text"] – Input type
 * @param {string}   [placeholder] – Placeholder text
 * @param {number}   [width]       – Input width in px
 * @param {object}   [style]       – Extra styles on the wrapper
 * @param {object}   [inputProps]  – Extra props spread onto the \<input\>
 */
export default function InputField({
    label,
    value,
    onChange,
    disabled = false,
    type = "text",
    placeholder,
    width,
    style: extraStyle,
    inputProps = {},
}) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: 0,
                border: `1px solid ${V.borderHi}`,
                background: V.surface,
                opacity: disabled ? 0.5 : 1,
                ...extraStyle,
            }}
        >
            {label && (
                <span
                    style={{
                        padding: "0 10px",
                        fontFamily: MONO,
                        fontSize: 11,
                        color: V.accent,
                        borderRight: `1px solid ${V.border}`,
                        height: 36,
                        display: "flex",
                        alignItems: "center",
                        flexShrink: 0,
                    }}
                >
                    {label}
                </span>
            )}
            <input
                type={type}
                value={value}
                onChange={onChange}
                disabled={disabled}
                placeholder={placeholder}
                style={{
                    width: width || "auto",
                    height: 36,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    padding: "0 10px",
                    fontFamily: MONO,
                    fontSize: 13,
                    color: V.text,
                    textAlign: label ? "center" : "left",
                    ...(type === "number" ? { MozAppearance: "textfield" } : {}),
                }}
                {...inputProps}
            />
            <style>{`
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
      `}</style>
        </div>
    );
}

