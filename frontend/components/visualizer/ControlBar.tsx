// @ts-nocheck
"use client";
import React from "react";
import { V, MONO, LABEL_STYLE } from "./theme";
import { ChevronLeft, ChevronRight, RotateCcw, Play, Pause } from "lucide-react";

/**
 * ControlBar — Playback controls for algorithm visualization.
 *
 * Shows different UI depending on whether the visualizer is loaded or not.
 *
 * Pre-load: renders `children` (custom inputs) + Run button.
 * Post-load: shows ‹ prev | ▶/⏸ | › next | speed slider | step counter | ↺ reset.
 *
 * @param {boolean}  loaded     – Whether the algorithm is loaded
 * @param {boolean}  playing    – Whether auto-play is active
 * @param {number}   step       – Current step index (0-based)
 * @param {number}   totalSteps – Total number of steps
 * @param {number}   speed      – Current speed value (lower = faster)
 * @param {number}   [minSpeed=20]  – Slider min
 * @param {number}   [maxSpeed=400] – Slider max
 * @param {Function} onRun      – Called when "Run" is clicked
 * @param {Function} onReset    – Called when "Reset" is clicked
 * @param {Function} onForward  – Step forward
 * @param {Function} onBackward – Step backward
 * @param {Function} onPlayPause – Toggle play/pause
 * @param {Function} onSpeedChange – Speed slider change handler, receives raw slider value
 * @param {React.ReactNode} children – Pre-load inputs (e.g. n input, array input)
 */
export default function ControlBar({
    loaded,
    playing,
    step,
    totalSteps,
    speed,
    minSpeed = 20,
    maxSpeed = 400,
    onRun,
    onReset,
    onForward,
    onBackward,
    onPlayPause,
    onSpeedChange,
    children,
}) {

    const btnBase = {
        height: 36,
        background: V.surface,
        border: `1px solid ${V.border}`,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: V.text,
        transition: "all 0.1s",
    };

    const disabledStyle = { opacity: 0.3, cursor: "not-allowed" };

    return (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {/* Pre-load: custom inputs + Run */}
            {!loaded ? (
                <>
                    {children}
                    <button
                        onClick={onRun}
                        style={{
                            height: 36,
                            padding: "0 18px",
                            background: V.accent,
                            border: "none",
                            cursor: "pointer",
                            fontFamily: MONO,
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: "0.1em",
                            color: V.bg,
                            textTransform: "uppercase",
                            display: "flex",
                            alignItems: "center",
                            gap: 7,
                        }}
                    >
                        <Play size={11} /> Run
                    </button>
                </>
            ) : (
                <>
                    {/* Backward */}
                    <button
                        onClick={onBackward}
                        disabled={step <= 0}
                        style={{ ...btnBase, width: 36, ...(step <= 0 ? disabledStyle : {}) }}
                    >
                        <ChevronLeft size={14} />
                    </button>

                    {/* Play / Pause */}
                    <button
                        onClick={onPlayPause}
                        style={{
                            ...btnBase,
                            padding: "0 14px",
                            background: playing ? V.accentDim : V.surface,
                            border: `1px solid ${playing ? V.accent : V.border}`,
                            fontFamily: MONO,
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: "0.12em",
                            color: playing ? V.accent : V.text,
                            textTransform: "uppercase",
                            gap: 6,
                        }}
                    >
                        {playing ? <><Pause size={10} /> Pause</> : <><Play size={10} /> Play</>}
                    </button>

                    {/* Forward */}
                    <button
                        onClick={onForward}
                        disabled={step >= totalSteps - 1}
                        style={{ ...btnBase, width: 36, ...(step >= totalSteps - 1 ? disabledStyle : {}) }}
                    >
                        <ChevronRight size={14} />
                    </button>

                    {/* Speed slider */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            border: `1px solid ${V.border}`,
                            background: V.surface,
                            padding: "0 10px",
                            height: 36,
                        }}
                    >
                        <span style={{ ...LABEL_STYLE, letterSpacing: "0.12em" }}>spd</span>
                        <input
                            type="range"
                            min={minSpeed}
                            max={maxSpeed}
                            value={maxSpeed - speed + minSpeed}
                            onChange={(e) => onSpeedChange(maxSpeed - parseInt(e.target.value) + minSpeed)}
                            style={{ width: 60, accentColor: V.accent, cursor: "pointer" }}
                        />
                    </div>

                    {/* Step counter */}
                    <span
                        style={{
                            fontFamily: MONO,
                            fontSize: 10,
                            color: V.text,
                            letterSpacing: "0.08em",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {step + 1}
                        <span style={{ color: V.dim }}>/{totalSteps}</span>
                    </span>

                    {/* Reset */}
                    <button
                        onClick={onReset}
                        style={{ ...btnBase, width: 36, color: V.red }}
                    >
                        <RotateCcw size={13} />
                    </button>
                </>
            )}
        </div>
    );
}

