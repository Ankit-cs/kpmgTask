"use client";
import React, { useEffect, useRef } from "react";
import { observeElementResize } from "../../lib/observeResize";

const rgba = (hex, a) => {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
};

const keyOf = (x, y) => `${x},${y}`;
const parseKey = (k) => {
  const [x, y] = k.split(",").map(Number);
  return { x, y };
};

function getCanvasPerfProfile() {
  const reducedMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const hc = typeof navigator !== "undefined" ? (navigator.hardwareConcurrency || 8) : 8;
  const dm = typeof navigator !== "undefined" ? (navigator.deviceMemory || 8) : 8;
  const lowPower = !!reducedMotion || hc <= 6 || dm <= 4;
  return {
    dprCap: lowPower ? 1.25 : 1.5,
    glowScale: lowPower ? 0.72 : 1,
  };
}

export const MID_ANIMATONS_CONFIGS = {
  astar: {
    color: "#60a5fa",
    label: "A* Pathfinding",
    sub: "Graph Search",
    complexity: "O(E)",
    desc: "Uses g(n)+h(n) to focus search and recover an optimal path.",
    isAStar: true,
  },
  unionfind: {
    color: "#34d399",
    label: "Union-Find",
    sub: "Disjoint Set Union",
    complexity: "~O(α(n))",
    desc: "Union by rank with path compression.",
    isUnionFind: true,
  },
  kmp: {
    color: "#f59e0b",
    label: "KMP",
    sub: "String Matching",
    complexity: "O(n+m)",
    desc: "Pattern matching with LPS fallback jumps.",
    isKmp: true,
  },
  palindrome: {
    color: "#a78bfa",
    label: "Longest Palindrome",
    sub: "String",
    complexity: "O(n²)",
    desc: "Expand around centers to find the longest palindromic substring.",
    isPalindrome: true,
  },
};

function cloneArr(a) {
  return a.slice();
}

function buildUnionFindSteps(n = 8) {
  const parent = Array.from({ length: n }, (_, i) => i);
  const rank = Array(n).fill(0);
  const steps = [];

  const snapshot = (label, active = []) => {
    steps.push({ label, active, parent: cloneArr(parent), rank: cloneArr(rank) });
  };

  const find = (x) => {
    let cur = x;
    while (parent[cur] !== cur) cur = parent[cur];
    const root = cur;
    cur = x;
    while (parent[cur] !== cur) {
      const p = parent[cur];
      parent[cur] = root;
      cur = p;
    }
    return root;
  };

  const unite = (a, b) => {
    const ra = find(a);
    const rb = find(b);
    if (ra === rb) {
      snapshot(`union(${a},${b}) no-op`, [a, b]);
      return;
    }
    if (rank[ra] < rank[rb]) parent[ra] = rb;
    else if (rank[ra] > rank[rb]) parent[rb] = ra;
    else {
      parent[rb] = ra;
      rank[ra]++;
    }
    snapshot(`union(${a},${b})`, [a, b]);
  };

  snapshot("init", []);
  [[0, 1], [2, 3], [4, 5], [6, 7], [1, 3], [5, 7], [3, 7], [0, 6]].forEach(([a, b]) => unite(a, b));
  [7, 6, 5, 4, 3, 2, 1, 0].forEach((x) => {
    find(x);
    snapshot(`find(${x}) compress`, [x]);
  });

  return steps;
}

function buildKmpEvents(text, pattern) {
  const events = [];

  const buildLps = (p) => {
    const lps = Array(p.length).fill(0);
    let len = 0;
    for (let i = 1; i < p.length;) {
      if (p[i] === p[len]) lps[i++] = ++len;
      else if (len) len = lps[len - 1];
      else lps[i++] = 0;
    }
    return lps;
  };

  const lps = buildLps(pattern);
  let i = 0, j = 0;

  while (i < text.length) {
    events.push({ kind: "compare", i, j, align: i - j, foundAt: null });
    if (text[i] === pattern[j]) {
      i++; j++;
      if (j === pattern.length) {
        events.push({ kind: "found", i: i - 1, j: j - 1, align: i - j, foundAt: i - j });
        j = lps[j - 1];
      }
    } else if (j !== 0) {
      events.push({ kind: "jump", i, j, align: i - j, foundAt: null, to: lps[j - 1] });
      j = lps[j - 1];
    } else {
      i++;
    }
  }

  return { events, lps };
}

function buildSegmentTreeModel() {
  const arr = [5, 2, 7, 3, 6, 1, 4, 8];
  let idGen = 0;

  const build = (l, r, depth = 0) => {
    const id = idGen++;
    const node = { id, l, r, depth, left: null, right: null, val: 0, x: 0, y: 0 };
    if (l === r) {
      node.val = arr[l];
      return node;
    }
    const m = Math.floor((l + r) / 2);
    node.left = build(l, m, depth + 1);
    node.right = build(m + 1, r, depth + 1);
    node.val = node.left.val + node.right.val;
    return node;
  };

  const root = build(0, arr.length - 1);
  const nodes = [];
  const walk = (n) => { if (!n) return; nodes.push(n); walk(n.left); walk(n.right); };
  walk(root);

  const events = [];
  const snapshot = (label, active = []) => {
    events.push({ label, active: active.slice(), values: Object.fromEntries(nodes.map((n) => [n.id, n.val])), arr: arr.slice() });
  };

  const query = (n, ql, qr) => {
    snapshot(`visit [${n.l},${n.r}]`, [n.id]);
    if (n.r < ql || n.l > qr) return 0;
    if (ql <= n.l && n.r <= qr) {
      snapshot(`take [${n.l},${n.r}]`, [n.id]);
      return n.val;
    }
    return query(n.left, ql, qr) + query(n.right, ql, qr);
  };

  const update = (n, idx, val) => {
    snapshot(`update path [${n.l},${n.r}]`, [n.id]);
    if (n.l === n.r) {
      n.val = val;
      arr[idx] = val;
      snapshot(`set a[${idx}] = ${val}`, [n.id]);
      return;
    }
    const m = Math.floor((n.l + n.r) / 2);
    if (idx <= m) update(n.left, idx, val);
    else update(n.right, idx, val);
    n.val = n.left.val + n.right.val;
    snapshot(`recompute [${n.l},${n.r}]`, [n.id]);
  };

  snapshot("build done", [root.id]);
  query(root, 2, 6);
  snapshot("Q[2,6] complete", [root.id]);
  update(root, 4, arr[4] + 3);
  query(root, 1, 5);
  snapshot("Q[1,5] complete", [root.id]);

  return { root, nodes, events, arrSize: arr.length };
}

function buildPalindromeEvents(s) {
  const events = [];
  let bestL = 0, bestR = 0;

  const expand = (l0, r0, center) => {
    let l = l0, r = r0;
    while (l >= 0 && r < s.length && s[l] === s[r]) {
      events.push({ kind: "expand", l, r, center, bestL, bestR });
      if (r - l > bestR - bestL) {
        bestL = l;
        bestR = r;
        events.push({ kind: "best", l, r, center, bestL, bestR });
      }
      l--; r++;
    }
    events.push({ kind: "shift", l: Math.max(0, l + 1), r: Math.min(s.length - 1, r - 1), center, bestL, bestR });
  };

  for (let c = 0; c < s.length; c++) {
    expand(c, c, c);       // odd
    expand(c, c + 1, c);   // even
  }

  events.push({ kind: "done", l: bestL, r: bestR, center: -1, bestL, bestR });
  return events;
}

function buildAStarSteps(cols, rows) {
  const start = { x: 1, y: 1 };
  const goal = { x: cols - 2, y: rows - 2 };

  const walls = new Set();
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const isBorder = x === 0 || y === 0 || x === cols - 1 || y === rows - 1;
      if (isBorder) {
        walls.add(keyOf(x, y));
        continue;
      }
      // Structured + pseudo-random clutter for richer search frontier visuals.
      const band = (y % 4 === 0 && x > 1 && x < cols - 2);
      const pillars = (x % 6 === 0 && y > 1 && y < rows - 2);
      const noise = ((x * 13 + y * 7) % 17) < 5;
      if (band || pillars || noise) walls.add(keyOf(x, y));
    }
  }

  const inBounds = (x, y) => x > 0 && y > 0 && x < cols - 1 && y < rows - 1;

  const carvePoint = (x, y, radius = 0) => {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (inBounds(nx, ny)) walls.delete(keyOf(nx, ny));
      }
    }
  };

  const carveSegment = (a, b, preferXFirst = true) => {
    let x = a.x;
    let y = a.y;
    carvePoint(x, y, 1);

    const moveX = () => {
      while (x !== b.x) {
        x += Math.sign(b.x - x);
        carvePoint(x, y, 1);
      }
    };
    const moveY = () => {
      while (y !== b.y) {
        y += Math.sign(b.y - y);
        carvePoint(x, y, 1);
      }
    };

    if (preferXFirst) {
      moveX();
      moveY();
    } else {
      moveY();
      moveX();
    }
  };

  // Winding guaranteed corridor + decoy branches.
  const waypoints = [
    start,
    { x: Math.floor(cols * 0.18), y: rows - 3 },
    { x: Math.floor(cols * 0.33), y: 2 },
    { x: Math.floor(cols * 0.52), y: rows - 4 },
    { x: Math.floor(cols * 0.7), y: 3 },
    { x: Math.floor(cols * 0.84), y: rows - 3 },
    goal,
  ];

  for (let i = 0; i < waypoints.length - 1; i++) {
    carveSegment(waypoints[i], waypoints[i + 1], i % 2 === 0);
  }

  // Decoy side corridors so A* frontier expansion looks richer.
  for (let i = 1; i < waypoints.length - 1; i++) {
    const p = waypoints[i];
    const offX = (i % 2 === 0 ? 3 : -3);
    const offY = (i % 3 === 0 ? 2 : -2);
    const ex = Math.max(1, Math.min(cols - 2, p.x + offX));
    const ey = Math.max(1, Math.min(rows - 2, p.y + offY));
    carveSegment(p, { x: ex, y: ey }, i % 2 === 1);
  }

  walls.delete(keyOf(start.x, start.y));
  walls.delete(keyOf(goal.x, goal.y));

  const h = (x, y) => Math.abs(x - goal.x) + Math.abs(y - goal.y);

  const open = new Set([keyOf(start.x, start.y)]);
  const closed = new Set();
  const cameFrom = new Map();
  const gScore = new Map([[keyOf(start.x, start.y), 0]]);
  const fScore = new Map([[keyOf(start.x, start.y), h(start.x, start.y)]]);

  const neighbors = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];

  const steps = [];

  while (open.size) {
    let current = null;
    let bestF = Infinity;
    for (const k of open) {
      const f = fScore.get(k) ?? Infinity;
      if (f < bestF) {
        bestF = f;
        current = k;
      }
    }

    if (!current) break;

    const { x, y } = parseKey(current);
    steps.push({
      kind: "scan",
      current,
      open: [...open],
      closed: [...closed],
      path: [],
    });

    if (x === goal.x && y === goal.y) {
      const path = [current];
      let cur = current;
      while (cameFrom.has(cur)) {
        cur = cameFrom.get(cur);
        path.push(cur);
      }
      path.reverse();

      steps.push({
        kind: "path",
        current,
        open: [...open],
        closed: [...closed],
        path,
      });
      return { steps, walls, start, goal, cols, rows };
    }

    open.delete(current);
    closed.add(current);

    for (const [dx, dy] of neighbors) {
      const nx = x + dx;
      const ny = y + dy;
      const nk = keyOf(nx, ny);

      if (walls.has(nk) || closed.has(nk)) continue;

      const tentativeG = (gScore.get(current) ?? Infinity) + 1;
      if (!open.has(nk)) open.add(nk);
      if (tentativeG >= (gScore.get(nk) ?? Infinity)) continue;

      cameFrom.set(nk, current);
      gScore.set(nk, tentativeG);
      fScore.set(nk, tentativeG + h(nx, ny));
    }
  }

  return { steps, walls, start, goal, cols, rows };
}

export function MidAnimatonsCanvas({ color = "#60a5fa" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    const perf = getCanvasPerfProfile();
    const dpr = Math.min(window.devicePixelRatio || 1, perf.dprCap);

    const setup = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    setup();

    const stopResizeObserver = observeElementResize(canvas, setup);

    let isInView = true;
    let isPageVisible = document.visibilityState !== "hidden";
    const io = new IntersectionObserver(([entry]) => { isInView = !!entry?.isIntersecting; }, { threshold: 0.01 });
    io.observe(canvas);
    const onVisibilityChange = () => { isPageVisible = document.visibilityState !== "hidden"; };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const W = () => canvas.offsetWidth;
    const H = () => canvas.offsetHeight;

    const model = buildAStarSteps(24, 14);
    const { steps, walls, start, goal, cols, rows } = model;

    let stepIdx = 0;
    let state = steps[0] || { kind: "idle", current: null, open: [], closed: [], path: [] };
    let revealPath = 0;
    let lastStepTs = 0;
    let paused = false;
    let animId;
    let resetTimer;

    const glow = (blur = 10, c = color) => {
      ctx.shadowColor = c;
      ctx.shadowBlur = blur * perf.glowScale;
    };
    const noGlow = () => {
      ctx.shadowBlur = 0;
      ctx.shadowColor = "transparent";
    };

    const clearCanvas = () => {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    };

    const loop = (ts) => {
      animId = requestAnimationFrame(loop);
      if (!isInView || !isPageVisible) return;
      if (W() === 0 || H() === 0) return;

      clearCanvas();

      if (!paused && ts - lastStepTs > 110) {
        lastStepTs = ts;
        if (stepIdx < steps.length) {
          state = steps[stepIdx++];
          if (state.kind === "path") revealPath = 0;
        } else {
          paused = true;
          resetTimer = setTimeout(() => {
            stepIdx = 0;
            state = steps[0] || { kind: "idle", current: null, open: [], closed: [], path: [] };
            revealPath = 0;
            paused = false;
            lastStepTs = ts + 120;
          }, 2200);
        }
      }

      if (state.kind === "path") revealPath = Math.min(state.path.length, revealPath + 0.35);

      const margin = 10;
      const hudH = 28;
      const boardW = W() - margin * 2;
      const boardH = H() - margin * 2 - hudH;
      const cell = Math.min(boardW / cols, boardH / rows);
      const gridW = cols * cell;
      const gridH = rows * cell;
      const bx = (W() - gridW) / 2;
      const by = margin + 4;

      const openSet = new Set(state.open || []);
      const closedSet = new Set(state.closed || []);
      const pathList = state.path || [];

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const k = keyOf(x, y);
          const cx = bx + x * cell;
          const cy = by + y * cell;

          ctx.save();
          if (walls.has(k)) {
            ctx.fillStyle = "rgba(20,20,26,0.95)";
          } else if (k === keyOf(start.x, start.y)) {
            ctx.fillStyle = "rgba(52,211,153,0.9)";
          } else if (k === keyOf(goal.x, goal.y)) {
            ctx.fillStyle = "rgba(248,113,113,0.9)";
          } else if (k === state.current) {
            glow(8);
            ctx.fillStyle = rgba(color, 0.88);
          } else if (openSet.has(k)) {
            ctx.fillStyle = rgba(color, 0.28);
          } else if (closedSet.has(k)) {
            ctx.fillStyle = "rgba(99,102,241,0.25)";
          } else {
            ctx.fillStyle = "rgba(255,255,255,0.06)";
          }

          ctx.fillRect(cx, cy, cell, cell);
          noGlow();
          ctx.strokeStyle = "rgba(255,255,255,0.08)";
          ctx.lineWidth = 0.6;
          ctx.strokeRect(cx, cy, cell, cell);
          ctx.restore();
        }
      }

      if (pathList.length > 1) {
        ctx.save();
        glow(10);
        ctx.strokeStyle = rgba(color, 0.95);
        ctx.lineWidth = Math.max(1.4, cell * 0.12);
        ctx.beginPath();
        const visibleCount = Math.max(1, Math.floor(revealPath));
        for (let i = 0; i < visibleCount; i++) {
          const { x, y } = parseKey(pathList[i]);
          const px = bx + x * cell + cell / 2;
          const py = by + y * cell + cell / 2;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        noGlow();
        ctx.restore();
      }

      ctx.save();
      ctx.fillStyle = rgba(color, 0.88);
      ctx.font = "700 8px 'JetBrains Mono', monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      const modeText = state.kind === "path" ? "PATH RECONSTRUCTION" : "A* SEARCH";
      ctx.fillText(modeText, 8, H() - 12);

      ctx.fillStyle = rgba(color, 0.5);
      ctx.font = "600 7px 'JetBrains Mono', monospace";
      ctx.textAlign = "right";
      const pathLen = pathList.length ? ` • PATH ${pathList.length}` : "";
      ctx.fillText(`STEP ${Math.min(stepIdx, steps.length)}/${steps.length}${pathLen}`, W() - 8, H() - 12);

      const p = steps.length ? Math.min(1, stepIdx / steps.length) : 0;
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.beginPath();
      ctx.roundRect(8, H() - 8, W() - 16, 3, 2);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(8, H() - 8, (W() - 16) * p, 3, 2);
      ctx.fill();
      ctx.restore();
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      if (resetTimer) clearTimeout(resetTimer);
      stopResizeObserver();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [color]);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block", contain: "strict" }} />;
}

export function UnionFindCanvas({ color = "#34d399" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    const perf = getCanvasPerfProfile();
    const dpr = Math.min(window.devicePixelRatio || 1, perf.dprCap);

    const setup = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    setup();
    const stopResizeObserver = observeElementResize(canvas, setup);

    const steps = buildUnionFindSteps(8);
    let idx = 0;
    let state = steps[0];
    let lastTs = 0;
    let paused = false;
    let animId;
    let resetTimer;

    const loop = (ts) => {
      animId = requestAnimationFrame(loop);
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      if (!W || !H) return;

      if (!paused && ts - lastTs > 620) {
        lastTs = ts;
        if (idx < steps.length) state = steps[idx++];
        else {
          paused = true;
          resetTimer = setTimeout(() => {
            idx = 0;
            state = steps[0];
            paused = false;
          }, 1800);
        }
      }

      ctx.clearRect(0, 0, W, H);

      const cx = W / 2;
      const cy = H * 0.47;
      const R = Math.min(W, H) * 0.3;
      const pos = Array.from({ length: 8 }, (_, i) => {
        const a = (-Math.PI / 2) + (i / 8) * Math.PI * 2;
        return { x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R };
      });

      for (let i = 0; i < 8; i++) {
        const p = state.parent[i];
        if (p === i) continue;
        ctx.save();
        ctx.strokeStyle = "rgba(255,255,255,0.2)";
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(pos[i].x, pos[i].y);
        ctx.lineTo(pos[p].x, pos[p].y);
        ctx.stroke();
        ctx.restore();
      }

      for (let i = 0; i < 8; i++) {
        const root = state.parent[i] === i;
        const active = state.active.includes(i);
        ctx.save();
        ctx.fillStyle = root ? "rgba(52,211,153,0.9)" : rgba(color, 0.65);
        if (active) {
          ctx.shadowColor = color;
          ctx.shadowBlur = 12 * perf.glowScale;
        }
        ctx.beginPath();
        ctx.arc(pos[i].x, pos[i].y, active ? 11 : 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#09090b";
        ctx.font = "700 8px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(i), pos[i].x, pos[i].y + 0.5);
        ctx.restore();
      }

      ctx.save();
      ctx.fillStyle = rgba(color, 0.88);
      ctx.font = "700 8px 'JetBrains Mono', monospace";
      ctx.textAlign = "left";
      ctx.fillText(state.label, 8, H - 12);
      ctx.fillStyle = rgba(color, 0.45);
      ctx.textAlign = "right";
      ctx.fillText(`STEP ${Math.min(idx, steps.length)}/${steps.length}`, W - 8, H - 12);
      ctx.restore();
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      if (resetTimer) clearTimeout(resetTimer);
      stopResizeObserver();
    };
  }, [color]);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block", contain: "strict" }} />;
}

export function KmpCanvas({ color = "#f59e0b" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    const perf = getCanvasPerfProfile();
    const dpr = Math.min(window.devicePixelRatio || 1, perf.dprCap);

    const setup = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    setup();
    const stopResizeObserver = observeElementResize(canvas, setup);

    const text = "ABABDABACDABABCABAB";
    const pattern = "ABABCABAB";
    const { events, lps } = buildKmpEvents(text, pattern);
    let idx = 0;
    let state = events[0] || { i: 0, j: 0, align: 0, kind: "idle", foundAt: null };
    let foundFlash = 0;
    let lastTs = 0;
    let paused = false;
    let animId;
    let resetTimer;

    const loop = (ts) => {
      animId = requestAnimationFrame(loop);
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      if (!W || !H) return;

      if (!paused && ts - lastTs > 360) {
        lastTs = ts;
        if (idx < events.length) {
          state = events[idx++];
          if (state.kind === "found") foundFlash = 1;
        } else {
          paused = true;
          resetTimer = setTimeout(() => {
            idx = 0;
            state = events[0] || { i: 0, j: 0, align: 0, kind: "idle", foundAt: null };
            foundFlash = 0;
            paused = false;
          }, 1800);
        }
      }

      foundFlash = Math.max(0, foundFlash - 0.04);
      ctx.clearRect(0, 0, W, H);

      const cell = Math.max(12, Math.min(18, (W - 24) / text.length));
      const tx = (W - text.length * cell) / 2;
      const ty = H * 0.34;

      for (let i = 0; i < text.length; i++) {
        const x = tx + i * cell;
        ctx.fillStyle = i === state.i ? rgba(color, 0.8) : "rgba(255,255,255,0.08)";
        ctx.fillRect(x, ty, cell - 1, cell - 1);
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.font = "700 9px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text[i], x + (cell - 1) / 2, ty + (cell - 1) / 2 + 0.5);
      }

      const align = Math.max(0, state.align || 0);
      const py = ty + cell + 10;
      for (let j = 0; j < pattern.length; j++) {
        const x = tx + (align + j) * cell;
        if (x < tx || x > tx + text.length * cell - cell) continue;
        ctx.fillStyle = j === state.j ? rgba(color, 0.85) : "rgba(245,158,11,0.22)";
        ctx.fillRect(x, py, cell - 1, cell - 1);
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.font = "700 9px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(pattern[j], x + (cell - 1) / 2, py + (cell - 1) / 2 + 0.5);
      }

      // LPS strip
      const ly = py + cell + 10;
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.font = "600 7px 'JetBrains Mono', monospace";
      ctx.textAlign = "left";
      ctx.fillText("LPS:", tx, ly + 8);
      for (let j = 0; j < lps.length; j++) {
        const x = tx + 28 + j * cell;
        ctx.fillStyle = "rgba(255,255,255,0.1)";
        ctx.fillRect(x, ly, cell - 1, 14);
        ctx.fillStyle = "rgba(255,255,255,0.75)";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(lps[j]), x + (cell - 1) / 2, ly + 7.5);
      }

      if (state.kind === "found" || foundFlash > 0) {
        ctx.fillStyle = `rgba(52,211,153,${0.75 * Math.max(foundFlash, 0.4)})`;
        ctx.font = "700 8px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText(`MATCH @ ${state.foundAt ?? "?"}`, W / 2, ly + 28);
      }

      const kindLabel = state.kind === "jump" ? `jump j -> ${state.to}` : state.kind;
      ctx.fillStyle = rgba(color, 0.88);
      ctx.font = "700 8px 'JetBrains Mono', monospace";
      ctx.textAlign = "left";
      ctx.fillText(`KMP ${kindLabel}`, 8, H - 12);
      ctx.fillStyle = rgba(color, 0.45);
      ctx.textAlign = "right";
      ctx.fillText(`STEP ${Math.min(idx, events.length)}/${events.length}`, W - 8, H - 12);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      if (resetTimer) clearTimeout(resetTimer);
      stopResizeObserver();
    };
  }, [color]);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block", contain: "strict" }} />;
}

export function SegmentTreeCanvas({ color = "#a78bfa" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    const perf = getCanvasPerfProfile();
    const dpr = Math.min(window.devicePixelRatio || 1, perf.dprCap);

    const setup = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    setup();
    const stopResizeObserver = observeElementResize(canvas, setup);

    const model = buildSegmentTreeModel();
    const { root, nodes, events, arrSize } = model;

    const leaves = nodes.filter((n) => n.l === n.r).sort((a, b) => a.l - b.l);
    const maxDepth = Math.max(...nodes.map((n) => n.depth));
    const getX = (n, W) => {
      if (n.l === n.r) {
        const i = leaves.findIndex((v) => v.id === n.id);
        return (W * 0.08) + (i / (arrSize - 1 || 1)) * (W * 0.84);
      }
      return (getX(n.left, W) + getX(n.right, W)) / 2;
    };
    const getY = (n, H) => H * 0.12 + (n.depth / (maxDepth || 1)) * (H * 0.48);

    let idx = 0;
    let state = events[0];
    let lastTs = 0;
    let paused = false;
    let animId;
    let resetTimer;

    const loop = (ts) => {
      animId = requestAnimationFrame(loop);
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      if (!W || !H) return;

      if (!paused && ts - lastTs > 460) {
        lastTs = ts;
        if (idx < events.length) state = events[idx++];
        else {
          paused = true;
          resetTimer = setTimeout(() => {
            idx = 0;
            state = events[0];
            paused = false;
          }, 2000);
        }
      }

      ctx.clearRect(0, 0, W, H);
      const active = new Set(state.active || []);

      for (const n of nodes) {
        if (n.left) {
          ctx.strokeStyle = "rgba(255,255,255,0.15)";
          ctx.lineWidth = 0.9;
          ctx.beginPath();
          ctx.moveTo(getX(n, W), getY(n, H));
          ctx.lineTo(getX(n.left, W), getY(n.left, H));
          ctx.stroke();
        }
        if (n.right) {
          ctx.strokeStyle = "rgba(255,255,255,0.15)";
          ctx.lineWidth = 0.9;
          ctx.beginPath();
          ctx.moveTo(getX(n, W), getY(n, H));
          ctx.lineTo(getX(n.right, W), getY(n.right, H));
          ctx.stroke();
        }
      }

      for (const n of nodes) {
        const x = getX(n, W);
        const y = getY(n, H);
        const isActive = active.has(n.id);
        ctx.save();
        ctx.fillStyle = isActive ? rgba(color, 0.9) : "rgba(255,255,255,0.12)";
        if (isActive) {
          ctx.shadowColor = color;
          ctx.shadowBlur = 12 * perf.glowScale;
        }
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = isActive ? "#09090b" : "rgba(255,255,255,0.85)";
        ctx.font = "700 7px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(state.values[n.id]), x, y + 0.5);
        ctx.restore();
      }

      // array strip
      const arr = state.arr || [];
      const bw = Math.max(14, (W * 0.84) / arr.length - 4);
      const sx = W * 0.08;
      const sy = H * 0.74;
      for (let i = 0; i < arr.length; i++) {
        const x = sx + i * (bw + 4);
        ctx.fillStyle = "rgba(255,255,255,0.1)";
        ctx.fillRect(x, sy, bw, 18);
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.font = "700 8px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(arr[i]), x + bw / 2, sy + 9.5);
      }

      ctx.fillStyle = rgba(color, 0.88);
      ctx.font = "700 8px 'JetBrains Mono', monospace";
      ctx.textAlign = "left";
      ctx.fillText(state.label, 8, H - 12);
      ctx.fillStyle = rgba(color, 0.45);
      ctx.textAlign = "right";
      ctx.fillText(`STEP ${Math.min(idx, events.length)}/${events.length}`, W - 8, H - 12);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      if (resetTimer) clearTimeout(resetTimer);
      stopResizeObserver();
    };
  }, [color]);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block", contain: "strict" }} />;
}

export function PalindromeCanvas({ color = "#a78bfa" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    const perf = getCanvasPerfProfile();
    const dpr = Math.min(window.devicePixelRatio || 1, perf.dprCap);

    const setup = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    setup();
    const stopResizeObserver = observeElementResize(canvas, setup);

    const str = "forgeeksskeegforlevelmadam";
    const events = buildPalindromeEvents(str);
    let idx = 0;
    let state = events[0];
    let pulse = 0;
    let lastTs = 0;
    let paused = false;
    let animId;
    let resetTimer;

    const loop = (ts) => {
      animId = requestAnimationFrame(loop);
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      if (!W || !H) return;

      if (!paused && ts - lastTs > 130) {
        lastTs = ts;
        if (idx < events.length) {
          state = events[idx++];
          if (state.kind === "best") pulse = 1;
        } else {
          paused = true;
          resetTimer = setTimeout(() => {
            idx = 0;
            state = events[0];
            pulse = 0;
            paused = false;
          }, 1800);
        }
      }

      pulse = Math.max(0, pulse - 0.04);
      ctx.clearRect(0, 0, W, H);

      const cell = Math.max(10, Math.min(18, (W - 28) / str.length));
      const sx = (W - cell * str.length) / 2;
      const y = H * 0.42;

      for (let i = 0; i < str.length; i++) {
        const x = sx + i * cell;
        const inWindow = i >= state.l && i <= state.r;
        const inBest = i >= state.bestL && i <= state.bestR;

        ctx.save();
        if (inBest) {
          ctx.fillStyle = rgba(color, 0.7 + pulse * 0.2);
          ctx.shadowColor = color;
          ctx.shadowBlur = (10 + pulse * 8) * perf.glowScale;
        } else if (inWindow) {
          ctx.fillStyle = rgba(color, 0.35);
        } else {
          ctx.fillStyle = "rgba(255,255,255,0.08)";
        }
        ctx.fillRect(x, y, cell - 1, 20);
        ctx.shadowBlur = 0;

        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.font = "700 9px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(str[i], x + (cell - 1) / 2, y + 10.5);
        ctx.restore();
      }

      // center pointer
      if (state.center >= 0) {
        const cx = sx + state.center * cell + cell / 2;
        ctx.strokeStyle = rgba(color, 0.7);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, y - 12);
        ctx.lineTo(cx, y - 2);
        ctx.stroke();
        ctx.fillStyle = rgba(color, 0.85);
        ctx.font = "700 7px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText("C", cx, y - 15);
      }

      const best = str.slice(state.bestL, state.bestR + 1);
      ctx.fillStyle = rgba(color, 0.88);
      ctx.font = "700 8px 'JetBrains Mono', monospace";
      ctx.textAlign = "left";
      ctx.fillText(`BEST: \"${best}\"`, 8, H - 12);

      ctx.fillStyle = rgba(color, 0.45);
      ctx.textAlign = "right";
      ctx.fillText(`STEP ${Math.min(idx, events.length)}/${events.length}`, W - 8, H - 12);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      if (resetTimer) clearTimeout(resetTimer);
      stopResizeObserver();
    };
  }, [color]);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block", contain: "strict" }} />;
}

export function MidAnimatonsAlgoCanvas({ algo }) {
  if (algo?.isAStar) {
    return <MidAnimatonsCanvas color={algo.color || "#60a5fa"} />;
  }
  if (algo?.isUnionFind) {
    return <UnionFindCanvas color={algo.color || "#34d399"} />;
  }
  if (algo?.isKmp) {
    return <KmpCanvas color={algo.color || "#f59e0b"} />;
  }
  if (algo?.isPalindrome) {
    return <PalindromeCanvas color={algo.color || "#a78bfa"} />;
  }
  return null;
}

