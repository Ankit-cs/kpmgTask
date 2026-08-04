// @ts-nocheck
"use client";
import algoLogo from "@/assets/algo.svg"

export default function Logo({ size = 24, alt = "Vantage logo", style, className }) {
  return (
    <img
      src={algoLogo}
      alt={alt}
      width={size}
      height={size}
      className={className}
      draggable={false}
      style={{ width: size, height: size, display: "block", ...style }}
    />
  )
}

