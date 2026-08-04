// @ts-nocheck
"use client";
import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const mouse = useRef({ x: -300, y: -300 });
  const ring = useRef({ x: -300, y: -300 });
  const scale = useRef({ value: 1 });
  const hasMovedRef = useRef(false);
  const [label, setLabel] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onMove = (e) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      const cursorTarget = document
        .elementFromPoint(e.clientX, e.clientY)
        ?.closest?.("[data-cursor]");
      setLabel(cursorTarget?.dataset?.cursor || "");
      if (!hasMovedRef.current) {
        hasMovedRef.current = true;
        setVisible(true);
      }
    };
    document.addEventListener("mousemove", onMove);

    let raf;
    const tick = () => {
      ring.current.x += (mouse.current.x - ring.current.x) * 0.11;
      ring.current.y += (mouse.current.y - ring.current.y) * 0.11;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${mouse.current.x - 3}px, ${mouse.current.y - 3}px)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ring.current.x - 16}px, ${ring.current.y - 16}px) scale(${scale.current.value})`;
      }
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <>
      <div
        ref={dotRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "#EDFF66",
          pointerEvents: "none",
          zIndex: 9999,
          mixBlendMode: "difference",
          opacity: visible ? 1 : 0,
        }}
      />
      <div
        ref={ringRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 32,
          height: 32,
          borderRadius: "50%",
          border: "1px solid rgba(237,255,102,0.55)",
          pointerEvents: "none",
          zIndex: 9998,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mixBlendMode: "difference",
          opacity: visible ? 1 : 0,
        }}
      >
        {label && (
          <span
            style={{
              fontSize: 6,
              fontWeight: 900,
              letterSpacing: "0.08em",
              color: "#EDFF66",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              lineHeight: 1,
            }}
          >
            {label}
          </span>
        )}
      </div>
    </>
  );
}

