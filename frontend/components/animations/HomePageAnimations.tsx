"use client";
import React, { useEffect, useRef } from "react";
import { observeElementResize } from "../../lib/observeResize";

/* ═══════════════════════════════════════════════════════════════════
   MATH & COLOR UTILITIES
═══════════════════════════════════════════════════════════════════ */
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeOutElastic = (t) => {
  const c4 = (2 * Math.PI) / 3;
  return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
};
const easeInOutQuart = (t) => t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
const easeOutBack = (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const dist = (x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}
function rgba(hex, a) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}
function lerpColor(hex1, hex2, t) {
  const c1 = hexToRgb(hex1), c2 = hexToRgb(hex2);
  return `rgb(${Math.round(lerp(c1.r, c2.r, t))},${Math.round(lerp(c1.g, c2.g, t))},${Math.round(lerp(c1.b, c2.b, t))})`;
}

function getCanvasPerfProfile() {
  const reducedMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const hc = typeof navigator !== "undefined" ? (navigator.hardwareConcurrency || 8) : 8;
  const dm = typeof navigator !== "undefined" ? (navigator.deviceMemory || 8) : 8;
  const lowPower = !!reducedMotion || hc <= 6 || dm <= 4;
  return {
    lowPower,
    dprCap: lowPower ? 1.25 : 1.5,
    glowScale: lowPower ? 0.72 : 1,
  };
}

/* ═══════════════════════════════════════════════════════════════════
   PARTICLE SYSTEM — multi-type particles
═══════════════════════════════════════════════════════════════════ */
class Particle {
  constructor(x, y, color, opts = {}) {
    this.x = x; this.y = y;
    const speed = opts.speed ?? (1.5 + Math.random() * 3);
    const angle = opts.angle ?? (Math.random() * Math.PI * 2);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.life = 1;
    this.decay = opts.decay ?? (0.025 + Math.random() * 0.035);
    this.size = opts.size ?? (2 + Math.random() * 3);
    this.color = color;
    this.gravity = opts.gravity ?? 0;
    this.trail = opts.trail ?? false;
    this.history = [];
  }
  update() {
    if (this.trail) this.history.push({ x: this.x, y: this.y, life: this.life });
    if (this.history.length > 8) this.history.shift();
    this.x += this.vx; this.y += this.vy;
    this.vx *= 0.92; this.vy *= 0.92;
    this.vy += this.gravity;
    this.life -= this.decay;
  }
  draw(ctx) {
    if (this.life <= 0) return;
    // trail
    if (this.trail && this.history.length > 1) {
      ctx.save();
      for (let i = 1; i < this.history.length; i++) {
        const t = i / this.history.length;
        ctx.globalAlpha = Math.max(0, this.history[i].life * t * 0.4);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.size * t * 0.6;
        ctx.beginPath();
        ctx.moveTo(this.history[i - 1].x, this.history[i - 1].y);
        ctx.lineTo(this.history[i].x, this.history[i].y);
        ctx.stroke();
      }
      ctx.restore();
    }
    const r = Math.max(0, this.size * this.life);
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life * 0.9);
    ctx.shadowColor = this.color;
    ctx.shadowBlur = r * 4;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}



/* ═══════════════════════════════════════════════════════════════════
   GRAPH DATA
═══════════════════════════════════════════════════════════════════ */
const GRAPH_NODES = [
  { id: 0, x: 50, y: 12, label: "S" },
  { id: 1, x: 22, y: 38, label: "A" },
  { id: 2, x: 50, y: 38, label: "B" },
  { id: 3, x: 78, y: 38, label: "C" },
  { id: 4, x: 10, y: 68, label: "D" },
  { id: 5, x: 36, y: 68, label: "E" },
  { id: 6, x: 64, y: 68, label: "F" },
  { id: 7, x: 88, y: 68, label: "G" },
];
const GRAPH_EDGES = [[0, 1], [0, 2], [0, 3], [1, 4], [1, 5], [2, 5], [3, 6], [3, 7]];

const TREE_NODES = [
  { id: 0, x: 50, y: 12, label: "4" },
  { id: 1, x: 28, y: 35, label: "2" },
  { id: 2, x: 72, y: 35, label: "6" },
  { id: 3, x: 16, y: 60, label: "1" },
  { id: 4, x: 40, y: 60, label: "3" },
  { id: 5, x: 62, y: 60, label: "5" },
  { id: 6, x: 84, y: 60, label: "7" },
];
const TREE_EDGES = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]];

const DIJKSTRA_NODES = [
  { id: 0, x: 15, y: 50, label: "A" },
  { id: 1, x: 38, y: 18, label: "B" },
  { id: 2, x: 65, y: 18, label: "C" },
  { id: 3, x: 85, y: 50, label: "D" },
  { id: 4, x: 38, y: 82, label: "E" },
  { id: 5, x: 65, y: 82, label: "F" },
];
const DIJKSTRA_EDGES_W = [[0, 1, 4], [0, 4, 2], [1, 2, 3], [1, 4, 1], [2, 3, 2], [2, 5, 3], [3, 5, 1], [4, 5, 5]];

const TOPO_NODES = [
  { id: 0, x: 8, y: 50, label: "A" },
  { id: 1, x: 30, y: 22, label: "B" },
  { id: 2, x: 30, y: 78, label: "C" },
  { id: 3, x: 55, y: 50, label: "D" },
  { id: 4, x: 76, y: 22, label: "E" },
  { id: 5, x: 92, y: 50, label: "F" },
];
const TOPO_EDGES = [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [3, 5], [4, 5]];

const PRIM_NODES = [
  { id: 0, x: 50, y: 12, label: "0" },
  { id: 1, x: 18, y: 40, label: "1" },
  { id: 2, x: 82, y: 40, label: "2" },
  { id: 3, x: 30, y: 75, label: "3" },
  { id: 4, x: 70, y: 75, label: "4" },
];
const PRIM_EDGES_W = [[0, 1, 2], [0, 2, 3], [1, 3, 4], [1, 2, 6], [2, 4, 1], [3, 4, 5], [0, 3, 7]];

const KRUSKAL_NODES = [
  { id: 0, x: 12, y: 50, label: "A" },
  { id: 1, x: 34, y: 18, label: "B" },
  { id: 2, x: 66, y: 18, label: "C" },
  { id: 3, x: 88, y: 50, label: "D" },
  { id: 4, x: 34, y: 82, label: "E" },
  { id: 5, x: 66, y: 82, label: "F" },
];
const KRUSKAL_EDGES_W = [[0, 1, 4], [0, 4, 3], [1, 2, 2], [1, 4, 6], [2, 3, 5], [2, 5, 4], [3, 5, 1], [4, 5, 7]];

const FW_NODES = [
  { id: 0, x: 14, y: 22, label: "0" },
  { id: 1, x: 44, y: 22, label: "1" },
  { id: 2, x: 14, y: 78, label: "2" },
  { id: 3, x: 44, y: 78, label: "3" },
];
const FW_EDGES_W = [[0, 1, 3], [0, 2, 8], [1, 2, 2], [1, 3, 5], [2, 3, 1], [0, 3, 12]];

export const ALGO_CONFIGS = {
  bfs: {
    nodes: GRAPH_NODES, edges: GRAPH_EDGES,
    steps: [0, 1, 2, 3, 4, 5, 6, 7],
    color: "#38bdf8", label: "BFS", sub: "Breadth-First Search", complexity: "O(V+E)",
    desc: "Visits nodes level by level using a queue. Guarantees shortest path in unweighted graphs.",
    edgeWeights: null,
  },
  dfs: {
    nodes: GRAPH_NODES, edges: GRAPH_EDGES,
    steps: [0, 1, 4, 5, 2, 3, 6, 7],
    color: "#a78bfa", label: "DFS", sub: "Depth-First Search", complexity: "O(V+E)",
    desc: "Dives deep before backtracking. Powers cycle detection, topological sort, and maze solving.",
    edgeWeights: null,
  },
  inorder: {
    nodes: TREE_NODES, edges: TREE_EDGES,
    steps: [3, 1, 4, 0, 5, 2, 6],
    color: "#34d399", label: "Inorder", sub: "BST Traversal", complexity: "O(n)",
    desc: "Left → Root → Right through a BST yields a perfectly sorted sequence.",
    edgeWeights: null, isTree: true,
  },
  dijkstra: {
    nodes: DIJKSTRA_NODES,
    edges: DIJKSTRA_EDGES_W.map(([a, b]) => [a, b]),
    steps: [0, 4, 1, 2, 5, 3],
    color: "#fb923c", label: "Dijkstra", sub: "Shortest Path", complexity: "O(E log V)",
    desc: "Greedy shortest-path using a min-heap. Foundation of GPS and routing.",
    edgeWeights: DIJKSTRA_EDGES_W.map(([a, b, w]) => ({ a, b, w })),
  },
  topo: {
    nodes: TOPO_NODES, edges: TOPO_EDGES,
    steps: [0, 1, 2, 3, 4, 5],
    color: "#fbbf24", label: "Topo Sort", sub: "DAG Ordering", complexity: "O(V+E)",
    desc: "Orders a DAG so every edge points forward. Critical for scheduling and build systems.",
    edgeWeights: null, isDirected: true,
  },
  prim: {
    nodes: PRIM_NODES,
    edges: PRIM_EDGES_W.map(([a, b]) => [a, b]),
    steps: [0, 2, 4, 1, 3],
    color: "#22d3ee", label: "Prim's", sub: "Min Spanning Tree", complexity: "O(E log V)",
    desc: "Grows a minimum spanning tree greedily from a seed node.",
    edgeWeights: PRIM_EDGES_W.map(([a, b, w]) => ({ a, b, w })),
  },
  bsearch: {
    nodes: [], edges: [],
    steps: [],
    color: "#e879f9", label: "Binary Search", sub: "Divide & Conquer", complexity: "O(log n)",
    desc: "Halves the search space every step. Finds any target in 50M items in 26 steps.",
    isBinarySearch: true, target: 31,
    values: [2, 7, 11, 15, 22, 31, 45],
  },
  floydwarshall: {
    nodes: FW_NODES, edges: FW_EDGES_W.map(([a, b]) => [a, b]),
    steps: [0, 1, 2, 3],
    color: "#f43f5e", label: "Floyd-Warshall", sub: "All-Pairs Shortest Path", complexity: "O(V³)",
    desc: "Finds shortest paths between ALL pairs of nodes simultaneously.",
    edgeWeights: FW_EDGES_W.map(([a, b, w]) => ({ a, b, w })),
    isFloydWarshall: true,
  },
  slidingwindow: {
    nodes: [], edges: [], steps: [],
    color: "#06b6d4", label: "Sliding Window", sub: "Array Pattern", complexity: "O(n)",
    desc: "Moves a fixed-size window across an array to compute rolling answers in linear time.",
    isSlidingWindow: true,
    values: [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5],
    windowSize: 3,
  },
  twopointers: {
    nodes: [], edges: [], steps: [],
    color: "#60a5fa", label: "Two Pointers", sub: "Array Pattern", complexity: "O(n)",
    desc: "Moves left and right pointers inward on sorted arrays to find target pairs.",
    isTwoPointers: true,
    values: [1, 2, 4, 6, 8, 9, 11, 15],
    target: 14,
  },
  kadane: {
    nodes: [], edges: [], steps: [],
    color: "#c084fc", label: "Kadane", sub: "Dynamic Programming", complexity: "O(n)",
    desc: "Tracks running best subarray in one pass: extend vs restart at each position.",
    isKadane: true,
    values: [-2, 1, -3, 4, -1, 2, 1, -5, 4],
  },
  kruskal: {
    nodes: KRUSKAL_NODES,
    edges: KRUSKAL_EDGES_W.map(([a, b]) => [a, b]),
    steps: [],
    color: "#2dd4bf", label: "Kruskal", sub: "Min Spanning Tree", complexity: "O(E log E)",
    desc: "Sorts edges by weight and uses disjoint sets to build an MST without cycles.",
    edgeWeights: KRUSKAL_EDGES_W.map(([a, b, w]) => ({ a, b, w })),
    isKruskal: true,
  },
  heapsort: {
    nodes: [], edges: [], steps: [],
    color: "#f97316", label: "Heap Sort", sub: "Sorting", complexity: "O(n log n)",
    desc: "Builds a max-heap then repeatedly extracts max to the sorted tail.",
    isHeapSort: true,
    values: [7, 3, 12, 1, 9, 5, 10, 2, 8, 6, 4, 11],
  },
};

/* ═══════════════════════════════════════════════════════════════════
   SHARED CANVAS DRAW HELPERS
═══════════════════════════════════════════════════════════════════ */
function makeDrawHelpers(ctx, col, glowScale = 1) {
  const glow = (color, blur) => { ctx.shadowColor = color; ctx.shadowBlur = blur * glowScale; };
  const noGlow = () => { ctx.shadowBlur = 0; ctx.shadowColor = "transparent"; };

  const drawNode = (x, y, r, fillColor, strokeColor, label, glowBlur = 0, labelColor = "#fff", pulse = 0) => {
    ctx.save();
    // outer pulse ring
    if (pulse > 0) {
      ctx.beginPath();
      ctx.arc(x, y, r + 4 + pulse * 8, 0, Math.PI * 2);
      ctx.strokeStyle = rgba(strokeColor, 0.15 * (1 - pulse));
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    // glow halo
    if (glowBlur > 0) {
      glow(strokeColor, glowBlur * 2);
      ctx.beginPath();
      ctx.arc(x, y, r + 3, 0, Math.PI * 2);
      ctx.strokeStyle = rgba(strokeColor, 0.2);
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    // main circle
    glow(strokeColor, glowBlur);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = glowBlur > 0 ? 1.8 : 1.2;
    ctx.stroke();
    noGlow();
    // label
    ctx.fillStyle = labelColor;
    ctx.font = `700 ${r > 10 ? 9 : 8}px 'JetBrains Mono', 'Fira Code', monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x, y + 0.5);
    ctx.restore();
  };

  const drawArrow = (x1, y1, x2, y2, color, width = 1.2, headSize = 6) => {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const nr = 9; // node radius offset
    const sx = x1 + Math.cos(angle) * nr;
    const sy = y1 + Math.sin(angle) * nr;
    const ex = x2 - Math.cos(angle) * nr;
    const ey = y2 - Math.sin(angle) * nr;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    // arrowhead
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - headSize * Math.cos(angle - 0.45), ey - headSize * Math.sin(angle - 0.45));
    ctx.lineTo(ex - headSize * Math.cos(angle + 0.45), ey - headSize * Math.sin(angle + 0.45));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  const drawEdge = (x1, y1, x2, y2, color, width = 1, directed = false) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    if (directed) drawArrow(x1, y1, x2, y2, color, width);
    ctx.restore();
  };

  const drawEdgeBeam = (x1, y1, x2, y2, progress, color, width = 2) => {
    const ex = lerp(x1, x2, progress);
    const ey = lerp(y1, y2, progress);
    ctx.save();
    // draw glowing full path first
    glow(color, 6);
    ctx.strokeStyle = rgba(color, 0.3);
    ctx.lineWidth = width * 0.6;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    // draw bright travelled path
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.shadowBlur = 14 * glowScale;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(ex, ey); ctx.stroke();
    // leading orb
    ctx.beginPath();
    ctx.arc(ex, ey, width + 2, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.shadowBlur = 18 * glowScale;
    ctx.fill();
    noGlow();
    ctx.restore();
  };

  const drawWeightLabel = (mx, my, weight, active, color) => {
    const bg = active ? color : "rgba(255,255,255,0.1)";
    const fg = active ? "#09090b" : "rgba(255,255,255,0.5)";
    ctx.save();
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(mx - 7, my - 6, 14, 12, 3);
    ctx.fill();
    ctx.fillStyle = fg;
    ctx.font = "600 7px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(weight, mx, my);
    ctx.restore();
  };

  return { glow, noGlow, drawNode, drawEdge, drawEdgeBeam, drawArrow, drawWeightLabel };
}

/* ═══════════════════════════════════════════════════════════════════
   ALGO CANVAS
═══════════════════════════════════════════════════════════════════ */
export function AlgoCanvas({ algo }) {
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
    const io = new IntersectionObserver(
      ([entry]) => { isInView = !!entry?.isIntersecting; },
      { threshold: 0.01 }
    );
    io.observe(canvas);
    const onVisibilityChange = () => { isPageVisible = document.visibilityState !== "hidden"; };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const W = () => canvas.offsetWidth;
    const H = () => canvas.offsetHeight;
    const px = (n) => ({ x: (n.x / 100) * W(), y: (n.y / 100) * H() });
    const col = algo.color;
    const helpers = makeDrawHelpers(ctx, col, perf.glowScale);

    let animId, resetTimer;
    let particles = [];
    let ts0 = 0;

    const burst = (x, y, count = 12, opts = {}) => {
      for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, opts.color || col, {
          speed: opts.speed ?? (1.5 + Math.random() * 3),
          decay: opts.decay ?? (0.025 + Math.random() * 0.035),
          size: opts.size ?? (2 + Math.random() * 2.5),
          gravity: opts.gravity ?? 0,
          trail: opts.trail ?? false,
        }));
      }
    };

    const clearCanvas = () => {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    };

    const updateFX = () => {
      particles = particles.filter(p => p.life > 0);
      particles.forEach(p => { p.update(); p.draw(ctx); });
    };

    /* ═══════════════════════════════════════════════
       BFS / DFS — immersive graph traversal
       Proper parent-edge tracing, smooth traversal
    ═══════════════════════════════════════════════ */
    const makeGraphTraversalRenderer = () => {
      const isBFS = algo.label === "BFS";
      const STEP_INTERVAL = isBFS ? 720 : 800;

      // Build adjacency list from edges
      const adj = {};
      algo.nodes.forEach(n => { adj[n.id] = []; });
      algo.edges.forEach(([a, b]) => { adj[a].push(b); adj[b].push(a); });

      // Build parent map: for each node, which node is its actual parent in the traversal tree
      const parentMap = {};
      parentMap[algo.steps[0]] = -1;
      const simVisited = new Set([algo.steps[0]]);
      if (isBFS) {
        const q = [algo.steps[0]];
        while (q.length) {
          const u = q.shift();
          for (const v of adj[u]) {
            if (!simVisited.has(v)) {
              simVisited.add(v);
              parentMap[v] = u;
              q.push(v);
            }
          }
        }
      } else {
        const dfsStack = [algo.steps[0]];
        while (dfsStack.length) {
          const u = dfsStack.pop();
          if (!simVisited.has(u) && u !== algo.steps[0]) simVisited.add(u);
          for (const v of [...adj[u]].reverse()) {
            if (!simVisited.has(v)) {
              simVisited.add(v);
              parentMap[v] = u;
              dfsStack.push(v);
            }
          }
        }
      }

      let stepIdx = 0;
      let visited = new Set();
      let visitT = {};
      let edgeT = {};  // "a-b" -> 0..1. Only traversal-tree edges.
      let activeEdge = null;
      let nodePulse = {};
      let paused = false;
      let lastStepTs = 0;
      // Traveling orb state
      let orbFrom = null, orbTo = null, orbT = 0;

      visited.add(algo.steps[0]);
      visitT[algo.steps[0]] = 0;

      return (ts) => {
        clearCanvas();

        // animate visit entries
        for (const id in visitT) visitT[id] = Math.min(1, visitT[id] + 0.055);
        for (const ek in edgeT) edgeT[ek] = Math.min(1, edgeT[ek] + 0.05);
        orbT = Math.min(1, orbT + 0.045);

        // advance steps
        if (!paused && ts - lastStepTs > STEP_INTERVAL) {
          lastStepTs = ts;
          if (stepIdx < algo.steps.length) {
            const nodeId = algo.steps[stepIdx];
            if (!visited.has(nodeId)) visited.add(nodeId);
            visitT[nodeId] = Math.max(visitT[nodeId] || 0, 0.01);
            nodePulse[nodeId] = ts;
            // Light up the parent→child edge (the REAL edge in the traversal tree)
            if (stepIdx > 0 && parentMap[nodeId] !== undefined && parentMap[nodeId] >= 0) {
              const par = parentMap[nodeId];
              const ek = `${Math.min(par, nodeId)}-${Math.max(par, nodeId)}`;
              edgeT[ek] = 0;
              activeEdge = ek;
              // Set orb travel from parent to child
              orbFrom = px(algo.nodes[par]);
              orbTo = px(algo.nodes[nodeId]);
              orbT = 0;
            }
            stepIdx++;
          } else {
            paused = true;
            resetTimer = setTimeout(() => {
              stepIdx = 0; visited = new Set([algo.steps[0]]);
              visitT = { [algo.steps[0]]: 0.01 };
              edgeT = {}; activeEdge = null; nodePulse = {};
              orbFrom = null; orbTo = null; orbT = 0;
              paused = false; lastStepTs = ts + 300;
            }, 2000);
          }
        }

        // === DRAW BACKGROUND GRID ===
        ctx.save();
        ctx.strokeStyle = "rgba(255,255,255,0.03)";
        ctx.lineWidth = 0.5;
        for (let gx = 0; gx < W(); gx += 24) {
          ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H()); ctx.stroke();
        }
        for (let gy = 0; gy < H(); gy += 24) {
          ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W(), gy); ctx.stroke();
        }
        ctx.restore();

        // === DRAW EDGES ===
        algo.edges.forEach(([a, b]) => {
          const na = px(algo.nodes[a]), nb = px(algo.nodes[b]);
          const ek = `${Math.min(a, b)}-${Math.max(a, b)}`;
          const prog = edgeT[ek];
          const isTreeEdge = prog !== undefined; // only traversal-tree edges have entries
          const isActive = ek === activeEdge && prog !== undefined && prog < 1;

          if (isActive) {
            helpers.drawEdgeBeam(na.x, na.y, nb.x, nb.y, prog, col, 2.5);
          } else if (isTreeEdge && prog >= 1) {
            helpers.glow(col, 10);
            helpers.drawEdge(na.x, na.y, nb.x, nb.y, rgba(col, 0.8), 1.8);
            helpers.noGlow();
          } else {
            helpers.drawEdge(na.x, na.y, nb.x, nb.y, "rgba(255,255,255,0.07)", 0.8);
          }
        });

        // === TRAVELING ORB ===
        if (orbFrom && orbTo && orbT < 1) {
          const et = easeInOutQuart(orbT);
          const ox = lerp(orbFrom.x, orbTo.x, et);
          const oy = lerp(orbFrom.y, orbTo.y, et);
          ctx.save();
          helpers.glow(col, 22);
          ctx.beginPath();
          ctx.arc(ox, oy, 4, 0, Math.PI * 2);
          ctx.fillStyle = "#fff";
          ctx.fill();
          ctx.beginPath();
          ctx.arc(ox, oy, 6, 0, Math.PI * 2);
          ctx.strokeStyle = rgba(col, 0.4 * (1 - orbT));
          ctx.lineWidth = 1.5;
          ctx.stroke();
          helpers.noGlow();
          ctx.restore();
        }

        // === DRAW NODES ===
        algo.nodes.forEach(n => {
          const { x, y } = px(n);
          const isVisited = visited.has(n.id);
          const t_anim = clamp(visitT[n.id] ?? 0, 0, 1);
          const et = easeOutElastic(t_anim);
          const r = isVisited ? 8.5 + et * 2 : 7;

          // smooth pulse ring on newly visited node (no burst particles)
          let pulse = 0;
          if (nodePulse[n.id]) {
            const age = (ts - nodePulse[n.id]) / 900;
            pulse = age < 1 ? easeOutCubic(age) : 0;
          }

          const fillC = isVisited ? rgba(col, 0.15 + et * 0.7) : "rgba(10,10,20,0.6)";
          const strokeC = isVisited ? col : "rgba(255,255,255,0.15)";
          const glowB = isVisited ? 16 * et : 0;
          const labelC = isVisited ? (et > 0.7 ? "#09090b" : rgba(col, et)) : "rgba(255,255,255,0.3)";
          helpers.drawNode(x, y, r, fillC, strokeC, n.label, glowB, labelC, pulse);

          // Visit order badge
          if (isVisited) {
            const orderIdx = algo.steps.indexOf(n.id);
            if (orderIdx >= 0 && orderIdx < stepIdx) {
              ctx.save();
              ctx.fillStyle = rgba(col, 0.55);
              ctx.font = "700 5.5px 'JetBrains Mono', monospace";
              ctx.textAlign = "center";
              ctx.fillText(`#${orderIdx + 1}`, x, y + r + 8);
              ctx.restore();
            }
          }
        });

        // === BFS QUEUE VISUALIZATION ===
        if (isBFS) {
          const qItems = algo.steps.slice(stepIdx > 0 ? stepIdx - 1 : 0, Math.min(algo.steps.length, stepIdx + 3));
          const qLabel = "QUEUE";
          const boxW = 18, gap = 3, startX = 8, startY = H() - 22;
          ctx.save();
          ctx.fillStyle = rgba(col, 0.25);
          ctx.font = "500 6px 'JetBrains Mono', monospace";
          ctx.textAlign = "left";
          ctx.fillText(qLabel, startX, startY - 2);
          qItems.forEach((nid, qi) => {
            const bx = startX + qi * (boxW + gap);
            ctx.fillStyle = qi === 0 ? rgba(col, 0.8) : rgba(col, 0.2);
            ctx.strokeStyle = qi === 0 ? col : rgba(col, 0.3);
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.roundRect(bx, startY, boxW, 14, 3);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = qi === 0 ? "#09090b" : "rgba(255,255,255,0.6)";
            ctx.font = "700 7px 'JetBrains Mono', monospace";
            ctx.textAlign = "center";
            ctx.fillText(algo.nodes[nid]?.label || "", bx + boxW / 2, startY + 7);
          });
          ctx.restore();
        }

        // DFS: draw stack
        if (!isBFS) {
          const stackItems = algo.steps.slice(Math.max(0, stepIdx - 4), stepIdx).reverse();
          const sLabel = "STACK";
          ctx.save();
          ctx.fillStyle = rgba(col, 0.25);
          ctx.font = "500 6px 'JetBrains Mono', monospace";
          ctx.textAlign = "left";
          ctx.fillText(sLabel, 8, H() - 28);
          stackItems.forEach((nid, si) => {
            const bx = 8 + si * 21;
            ctx.fillStyle = si === 0 ? rgba(col, 0.8) : rgba(col, 0.18);
            ctx.strokeStyle = si === 0 ? col : rgba(col, 0.3);
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.roundRect(bx, H() - 20, 18, 14, 3);
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = si === 0 ? "#09090b" : "rgba(255,255,255,0.6)";
            ctx.font = "700 7px monospace";
            ctx.textAlign = "center";
            ctx.fillText(algo.nodes[nid]?.label || "", bx + 9, H() - 13);
          });
          ctx.restore();
        }

        // visited counter
        ctx.save();
        ctx.fillStyle = rgba(col, 0.5);
        ctx.font = "700 8px 'JetBrains Mono', monospace";
        ctx.textAlign = "right";
        ctx.fillText(`${visited.size}/${algo.nodes.length}`, W() - 8, H() - 8);
        ctx.restore();
      };
    };

    /* ═══════════════════════════════════════════════
       INORDER BST — animated traversal with proper edge lighting
    ═══════════════════════════════════════════════ */
    const makeInorderRenderer = () => {
      const STEP_INTERVAL = 680;
      let stepIdx = 0;
      let visitOrder = [];
      let visitT = {};
      let edgeT = {};  // tracks only edges that have been traversed
      let cursorPos = { x: 0, y: 0 };
      let cursorTarget = { x: 0, y: 0 };
      let paused = false, lastStepTs = 0;
      let sortedRow = [];

      // Build tree parent map: parent[child] = parentId
      const treeParent = {};
      treeParent[0] = -1; // root has no parent
      algo.edges.forEach(([a, b]) => {
        // In tree edges [0,1],[0,2],[1,3],[1,4],[2,5],[2,6], first node is parent
        treeParent[b] = a;
      });

      // Find the path from nodeA to nodeB through the tree (via LCA)
      const getAncestors = (node) => {
        const path = [];
        let cur = node;
        while (cur !== -1 && cur !== undefined) {
          path.push(cur);
          cur = treeParent[cur];
        }
        return path;
      };

      const findTreePath = (from, to) => {
        const ancFrom = getAncestors(from);
        const ancTo = getAncestors(to);
        const setFrom = new Set(ancFrom);
        let lca = to;
        for (const a of ancTo) {
          if (setFrom.has(a)) { lca = a; break; }
        }
        // Path: from → ... → lca → ... → to
        const pathUp = [];
        let c = from;
        while (c !== lca) { pathUp.push(c); c = treeParent[c]; }
        pathUp.push(lca);
        const pathDown = [];
        c = to;
        while (c !== lca) { pathDown.push(c); c = treeParent[c]; }
        pathDown.reverse();
        return [...pathUp, ...pathDown];
      };

      // Cursor path: sequence of positions the cursor will travel through
      let cursorPath = [];
      let cursorPathIdx = 0;
      let cursorLerpT = 0;

      // initialize cursor at root
      const rootPos = px(algo.nodes[0]);
      cursorPos = { ...rootPos };
      cursorTarget = { ...rootPos };

      return (ts) => {
        clearCanvas();

        // smooth cursor along path
        if (cursorPath.length > 1 && cursorPathIdx < cursorPath.length - 1) {
          cursorLerpT += 0.1;
          if (cursorLerpT >= 1) {
            cursorLerpT = 0;
            cursorPathIdx++;
          }
          if (cursorPathIdx < cursorPath.length - 1) {
            const from = px(algo.nodes[cursorPath[cursorPathIdx]]);
            const to = px(algo.nodes[cursorPath[cursorPathIdx + 1]]);
            cursorPos.x = lerp(from.x, to.x, easeInOutQuart(cursorLerpT));
            cursorPos.y = lerp(from.y, to.y, easeInOutQuart(cursorLerpT));
          } else {
            const last = px(algo.nodes[cursorPath[cursorPath.length - 1]]);
            cursorPos.x = lerp(cursorPos.x, last.x, 0.2);
            cursorPos.y = lerp(cursorPos.y, last.y, 0.2);
          }
        } else {
          cursorPos.x = lerp(cursorPos.x, cursorTarget.x, 0.15);
          cursorPos.y = lerp(cursorPos.y, cursorTarget.y, 0.15);
        }

        for (const id in visitT) visitT[id] = Math.min(1, visitT[id] + 0.06);
        for (const ek in edgeT) edgeT[ek] = Math.min(1, edgeT[ek] + 0.055);

        if (!paused && ts - lastStepTs > STEP_INTERVAL) {
          lastStepTs = ts;
          if (stepIdx < algo.steps.length) {
            const nodeId = algo.steps[stepIdx];
            visitOrder.push(nodeId);
            visitT[nodeId] = 0;
            const { x, y } = px(algo.nodes[nodeId]);
            cursorTarget = { x, y };
            sortedRow.push(algo.nodes[nodeId].label);

            // Light up ALL tree edges along the path from previous to current
            if (stepIdx > 0) {
              const prev = algo.steps[stepIdx - 1];
              const path = findTreePath(prev, nodeId);
              cursorPath = path;
              cursorPathIdx = 0;
              cursorLerpT = 0;
              for (let p = 0; p < path.length - 1; p++) {
                const a = path[p], b = path[p + 1];
                const ek = `${Math.min(a, b)}-${Math.max(a, b)}`;
                if (edgeT[ek] === undefined) edgeT[ek] = 0;
              }
            }
            stepIdx++;
          } else {
            paused = true;
            resetTimer = setTimeout(() => {
              stepIdx = 0; visitOrder = []; visitT = {}; edgeT = {};
              sortedRow = [];
              cursorPath = []; cursorPathIdx = 0; cursorLerpT = 0;
              const rp = px(algo.nodes[0]);
              cursorPos = { ...rp }; cursorTarget = { ...rp };
              paused = false; lastStepTs = ts + 300;
            }, 2200);
          }
        }

        // draw tree edges
        algo.edges.forEach(([a, b]) => {
          const na = px(algo.nodes[a]), nb = px(algo.nodes[b]);
          const ek = `${Math.min(a, b)}-${Math.max(a, b)}`;
          const prog = edgeT[ek];
          const isTraced = prog !== undefined;

          if (isTraced && prog < 1) {
            helpers.drawEdgeBeam(na.x, na.y, nb.x, nb.y, prog, col, 2.2);
          } else if (isTraced && prog >= 1) {
            helpers.glow(col, 8);
            helpers.drawEdge(na.x, na.y, nb.x, nb.y, rgba(col, 0.7), 1.6);
            helpers.noGlow();
          } else {
            helpers.drawEdge(na.x, na.y, nb.x, nb.y, "rgba(255,255,255,0.07)", 0.8);
          }
        });

        // glowing traversal path line through visited nodes in order
        if (visitOrder.length > 1) {
          ctx.save();
          ctx.strokeStyle = rgba(col, 0.15);
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 6]);
          ctx.beginPath();
          visitOrder.forEach((id, i) => {
            const { x, y } = px(algo.nodes[id]);
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          });
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
        }

        // draw cursor glow trail
        ctx.save();
        helpers.glow(col, 22);
        ctx.beginPath();
        ctx.arc(cursorPos.x, cursorPos.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cursorPos.x, cursorPos.y, 12, 0, Math.PI * 2);
        ctx.strokeStyle = rgba(col, 0.2);
        ctx.lineWidth = 1.5;
        ctx.stroke();
        helpers.noGlow();
        ctx.restore();

        // draw nodes
        algo.nodes.forEach(n => {
          const { x, y } = px(n);
          const isVisited = visitOrder.includes(n.id);
          const orderIdx = visitOrder.indexOf(n.id);
          const et = easeOutElastic(clamp(visitT[n.id] ?? 0, 0, 1));

          const fillC = isVisited ? rgba(col, 0.1 + et * 0.75) : "rgba(10,10,20,0.6)";
          const strokeC = isVisited ? col : "rgba(255,255,255,0.12)";
          helpers.drawNode(x, y, isVisited ? 9 : 7.5, fillC, strokeC, n.label,
            isVisited ? 14 * et : 0, isVisited && et > 0.6 ? "#09090b" : rgba(col, Math.max(0.2, et)));

          // order badge
          if (isVisited) {
            ctx.save();
            ctx.fillStyle = rgba(col, 0.9);
            ctx.font = "700 5.5px monospace";
            ctx.textAlign = "center";
            ctx.fillText(`#${orderIdx + 1}`, x, y - 13);
            ctx.restore();
          }
        });

        // sorted output row at bottom
        if (sortedRow.length > 0) {
          const bw = 18, gap = 3;
          const totalW = sortedRow.length * (bw + gap) - gap;
          const startX = (W() - totalW) / 2;
          const rowY = H() - 22;
          ctx.save();
          ctx.fillStyle = rgba(col, 0.3);
          ctx.font = "500 6px monospace";
          ctx.textAlign = "center";
          ctx.fillText("SORTED OUTPUT", W() / 2, rowY - 5);
          sortedRow.forEach((lbl, i) => {
            const bx = startX + i * (bw + gap);
            const entryT = Math.min(1, (visitT[algo.steps[i]] ?? 0) * 2);
            ctx.fillStyle = rgba(col, 0.15 + entryT * 0.4);
            ctx.strokeStyle = rgba(col, 0.4 + entryT * 0.4);
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.roundRect(bx, rowY, bw, 14, 3);
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = rgba(col, 0.7 + entryT * 0.3);
            ctx.font = "700 7px 'JetBrains Mono', monospace";
            ctx.textAlign = "center";
            ctx.fillText(lbl, bx + bw / 2, rowY + 7);
          });
          ctx.restore();
        }
      };
    };

    /* ═══════════════════════════════════════════════
       DIJKSTRA — shortest-path tree with distance table
    ═══════════════════════════════════════════════ */
    const makeDijkstraRenderer = () => {
      const n = algo.nodes.length;
      const INF = 9999;
      const dist_arr = Array(n).fill(INF);
      dist_arr[0] = 0;
      let visitOrder = [];
      let visitT = {};
      let edgeT = {};
      let distT = {};
      let stepIdx = 0;
      let paused = false, lastStepTs = 0;
      let currentPrev = Array(n).fill(-1);

      const dijkstraSteps = (() => {
        const d = Array(n).fill(INF); d[0] = 0;
        const vis = new Set();
        const prev = Array(n).fill(-1);
        const steps = [];
        for (let s = 0; s < n; s++) {
          let u = -1;
          for (let i = 0; i < n; i++) if (!vis.has(i) && (u === -1 || d[i] < d[u])) u = i;
          if (u === -1 || d[u] === INF) break;
          vis.add(u);
          steps.push({ visit: u, dist: [...d], prev: [...prev] });
          for (const [a, b, w] of DIJKSTRA_EDGES_W) {
            const nb = (a === u) ? b : (b === u) ? a : -1;
            if (nb === -1 || vis.has(nb)) continue;
            if (d[u] + w < d[nb]) { d[nb] = d[u] + w; prev[nb] = u; }
          }
        }
        return steps;
      })();

      for (let i = 0; i < n; i++) distT[i] = { val: INF, vis: 0 };

      const isInSPT = (a, b) => currentPrev[a] === b || currentPrev[b] === a;

      return (ts) => {
        clearCanvas();

        for (const id in visitT) visitT[id] = Math.min(1, visitT[id] + 0.06);
        for (const ek in edgeT) edgeT[ek] = Math.min(1, edgeT[ek] + 0.05);
        for (const id in distT) distT[id].vis = Math.min(1, distT[id].vis + 0.08);

        if (!paused && ts - lastStepTs > 780) {
          lastStepTs = ts;
          if (stepIdx < dijkstraSteps.length) {
            const step = dijkstraSteps[stepIdx];
            visitOrder.push(step.visit);
            visitT[step.visit] = 0;
            step.dist.forEach((d, i) => {
              if (d !== distT[i].val) { distT[i].val = d; distT[i].vis = 0; }
            });
            currentPrev = [...step.prev];
            if (step.prev[step.visit] >= 0) {
              const a = step.visit, b = step.prev[step.visit];
              const ek = `${Math.min(a, b)}-${Math.max(a, b)}`;
              edgeT[ek] = 0;
            }
            stepIdx++;
          } else {
            paused = true;
            resetTimer = setTimeout(() => {
              stepIdx = 0; visitOrder = []; visitT = {}; edgeT = {};
              currentPrev = Array(n).fill(-1);
              for (let i = 0; i < n; i++) distT[i] = { val: INF, vis: 0 };
              paused = false; lastStepTs = ts + 300;
            }, 2200);
          }
        }

        // draw edges — only SPT edges glow
        algo.edges.forEach(([a, b]) => {
          const na = px(algo.nodes[a]), nb = px(algo.nodes[b]);
          const ek = `${Math.min(a, b)}-${Math.max(a, b)}`;
          const ew = algo.edgeWeights?.find(e => (e.a === a && e.b === b) || (e.a === b && e.b === a));
          const prog = edgeT[ek];
          const sptEdge = isInSPT(a, b);
          const mx = (na.x + nb.x) / 2 + (na.y < nb.y ? -6 : 6);
          const my = (na.y + nb.y) / 2;

          if (prog !== undefined && prog < 1) {
            helpers.drawEdgeBeam(na.x, na.y, nb.x, nb.y, prog, col, 2.5);
          } else if (sptEdge && prog >= 1) {
            helpers.glow(col, 10);
            helpers.drawEdge(na.x, na.y, nb.x, nb.y, rgba(col, 0.85), 2);
            helpers.noGlow();
          } else {
            helpers.drawEdge(na.x, na.y, nb.x, nb.y, "rgba(255,255,255,0.07)", 0.8);
          }
          if (ew) helpers.drawWeightLabel(mx, my, ew.w, sptEdge && prog >= 1, col);
        });

        // draw nodes
        algo.nodes.forEach(n => {
          const { x, y } = px(n);
          const isVisited = visitOrder.includes(n.id);
          const et = easeOutElastic(clamp(visitT[n.id] ?? 0, 0, 1));
          helpers.drawNode(x, y, isVisited ? 9.5 : 7.5,
            isVisited ? rgba(col, 0.15 + et * 0.7) : "rgba(10,10,20,0.6)",
            isVisited ? col : "rgba(255,255,255,0.15)",
            n.label, isVisited ? 16 * et : 0,
            isVisited && et > 0.6 ? "#09090b" : rgba(col, Math.max(0.3, et)));

          // distance badge above node
          const d = distT[n.id];
          const dStr = d?.val === INF ? "∞" : `${d?.val}`;
          ctx.save();
          ctx.globalAlpha = d?.vis ?? 0;
          const badgeColor = isVisited ? col : "rgba(255,255,255,0.4)";
          ctx.fillStyle = badgeColor;
          ctx.font = `700 ${dStr.length > 2 ? 6 : 7}px 'JetBrains Mono', monospace`;
          ctx.textAlign = "center";
          if (isVisited) { ctx.shadowColor = col; ctx.shadowBlur = 6; }
          ctx.fillText(dStr, x, y - 14);
          ctx.restore();
        });

        // Source label
        ctx.save();
        ctx.fillStyle = rgba(col, 0.4);
        ctx.font = "600 6px 'JetBrains Mono', monospace";
        ctx.textAlign = "left";
        ctx.fillText(`SOURCE: ${algo.nodes[0].label}`, 8, H() - 8);
        ctx.restore();
      };
    };

    /* ═══════════════════════════════════════════════
       TOPO SORT — directed graph, rippling order reveal
    ═══════════════════════════════════════════════ */
    const makeTopoRenderer = () => {
      let visitOrder = [];
      let visitT = {};
      let edgeT = {};
      let stepIdx = 0;
      let paused = false, lastStepTs = 0;

      return (ts) => {
        clearCanvas();

        for (const id in visitT) visitT[id] = Math.min(1, visitT[id] + 0.065);
        for (const ek in edgeT) edgeT[ek] = Math.min(1, edgeT[ek] + 0.055);

        if (!paused && ts - lastStepTs > 580) {
          lastStepTs = ts;
          if (stepIdx < algo.steps.length) {
            const nodeId = algo.steps[stepIdx];
            visitOrder.push(nodeId);
            visitT[nodeId] = 0;
            const { x, y } = px(algo.nodes[nodeId]);
            if (stepIdx > 0) {
              const prev = algo.steps[stepIdx - 1];
              const ek = `${prev}-${nodeId}`;
              edgeT[ek] = 0;
            }
            stepIdx++;
          } else {
            paused = true;
            resetTimer = setTimeout(() => {
              stepIdx = 0; visitOrder = []; visitT = {}; edgeT = {};
              paused = false; lastStepTs = ts + 200;
            }, 1800);
          }
        }

        // Directed edges with arrows
        TOPO_EDGES.forEach(([a, b]) => {
          const na = px(algo.nodes[a]), nb = px(algo.nodes[b]);
          const ek = `${a}-${b}`;
          const prog = edgeT[ek];
          const bothActive = visitOrder.includes(a) && visitOrder.includes(b);

          if (prog !== undefined && prog < 1) {
            helpers.drawEdgeBeam(na.x, na.y, nb.x, nb.y, prog, col, 2.2);
          } else if (bothActive && prog >= 1) {
            helpers.glow(col, 8);
            helpers.drawArrow(na.x, na.y, nb.x, nb.y, rgba(col, 0.8), 1.6, 7);
            helpers.noGlow();
          } else {
            helpers.drawArrow(na.x, na.y, nb.x, nb.y, "rgba(255,255,255,0.1)", 0.8, 5);
          }
        });

        // nodes
        algo.nodes.forEach(n => {
          const { x, y } = px(n);
          const orderIdx = visitOrder.indexOf(n.id);
          const isVisited = orderIdx >= 0;
          const et = easeOutElastic(clamp(visitT[n.id] ?? 0, 0, 1));

          helpers.drawNode(x, y, isVisited ? 9 : 7.5,
            isVisited ? rgba(col, 0.12 + et * 0.72) : "rgba(10,10,20,0.6)",
            isVisited ? col : "rgba(255,255,255,0.15)",
            n.label, isVisited ? 14 * et : 0,
            isVisited && et > 0.6 ? "#09090b" : rgba(col, Math.max(0.3, et)));

          if (isVisited) {
            ctx.save();
            ctx.fillStyle = rgba(col, 0.6);
            ctx.font = "600 5.5px monospace";
            ctx.textAlign = "center";
            ctx.fillText(`${orderIdx + 1}`, x, y - 13);
            ctx.restore();
          }
        });

        // topo order strip at bottom
        if (visitOrder.length > 0) {
          const bw = 16, gap = 3, rowY = H() - 20;
          const totalW = visitOrder.length * (bw + gap) - gap;
          const startX = (W() - totalW) / 2;
          ctx.save();
          ctx.fillStyle = rgba(col, 0.25);
          ctx.font = "500 5.5px monospace";
          ctx.textAlign = "center";
          ctx.fillText("ORDER", W() / 2, rowY - 4);
          visitOrder.forEach((id, i) => {
            const bx = startX + i * (bw + gap);
            const et = clamp(visitT[id] ?? 0, 0, 1);
            ctx.fillStyle = rgba(col, et * 0.6);
            ctx.strokeStyle = rgba(col, et);
            ctx.lineWidth = 0.8;
            ctx.beginPath(); ctx.roundRect(bx, rowY, bw, 13, 3); ctx.fill(); ctx.stroke();
            ctx.fillStyle = rgba(col, Math.max(0.5, et));
            ctx.font = "700 7px monospace";
            ctx.textAlign = "center";
            ctx.fillText(algo.nodes[id].label, bx + bw / 2, rowY + 6.5);
          });
          ctx.restore();
        }
      };
    };

    /* ═══════════════════════════════════════════════
       PRIM'S MST — growing tree with cost display
    ═══════════════════════════════════════════════ */
    const makePrimRenderer = () => {
      const n = algo.nodes.length;
      const INF = 9999;

      const primSteps = (() => {
        const inMST = Array(n).fill(false);
        const key = Array(n).fill(INF); key[0] = 0;
        const parent = Array(n).fill(-1);
        const steps = [];
        for (let s = 0; s < n; s++) {
          let u = -1;
          for (let i = 0; i < n; i++) if (!inMST[i] && (u === -1 || key[i] < key[u])) u = i;
          if (u === -1) break;
          inMST[u] = true;
          steps.push({ node: u, parent: parent[u], mstEdge: parent[u] >= 0 ? `${Math.min(u, parent[u])}-${Math.max(u, parent[u])}` : null });
          for (const [a, b, w] of PRIM_EDGES_W) {
            const nb2 = (a === u) ? b : (b === u) ? a : -1;
            if (nb2 === -1 || inMST[nb2]) continue;
            if (w < key[nb2]) { key[nb2] = w; parent[nb2] = u; }
          }
        }
        return steps;
      })();

      let mstNodes = new Set();
      let mstEdges = new Set();
      let visitT = {};
      let edgeT = {};
      let totalCost = 0;
      let displayCost = 0;
      let stepIdx = 0;
      let paused = false, lastStepTs = 0;

      return (ts) => {
        clearCanvas();

        displayCost = lerp(displayCost, totalCost, 0.1);
        for (const id in visitT) visitT[id] = Math.min(1, visitT[id] + 0.065);
        for (const ek in edgeT) edgeT[ek] = Math.min(1, edgeT[ek] + 0.055);

        if (!paused && ts - lastStepTs > 680) {
          lastStepTs = ts;
          if (stepIdx < primSteps.length) {
            const step = primSteps[stepIdx];
            mstNodes.add(step.node);
            visitT[step.node] = 0;
            if (step.mstEdge) {
              mstEdges.add(step.mstEdge);
              edgeT[step.mstEdge] = 0;
              const ew = algo.edgeWeights?.find(e => {
                const ek2 = `${Math.min(e.a, e.b)}-${Math.max(e.a, e.b)}`;
                return ek2 === step.mstEdge;
              });
              if (ew) totalCost += ew.w;
            }
            const { x, y } = px(algo.nodes[step.node]);
            stepIdx++;
          } else {
            paused = true;
            resetTimer = setTimeout(() => {
              stepIdx = 0; mstNodes = new Set(); mstEdges = new Set();
              visitT = {}; edgeT = {}; totalCost = 0; displayCost = 0;
              paused = false; lastStepTs = ts + 200;
            }, 2000);
          }
        }

        // draw edges
        algo.edges.forEach(([a, b]) => {
          const na = px(algo.nodes[a]), nb = px(algo.nodes[b]);
          const ek = `${Math.min(a, b)}-${Math.max(a, b)}`;
          const ew = algo.edgeWeights?.find(e => `${Math.min(e.a, e.b)}-${Math.max(e.a, e.b)}` === ek);
          const prog = edgeT[ek];
          const inMST = mstEdges.has(ek);
          const mx = (na.x + nb.x) / 2, my = (na.y + nb.y) / 2;

          if (prog !== undefined && prog < 1) {
            helpers.drawEdgeBeam(na.x, na.y, nb.x, nb.y, prog, col, 2.5);
          } else if (inMST && prog >= 1) {
            helpers.glow(col, 10);
            helpers.drawEdge(na.x, na.y, nb.x, nb.y, rgba(col, 0.8), 2);
            helpers.noGlow();
          } else {
            helpers.drawEdge(na.x, na.y, nb.x, nb.y, "rgba(255,255,255,0.07)", 0.8);
          }
          if (ew) helpers.drawWeightLabel(mx, my - 5, ew.w, inMST, col);
        });

        // nodes
        algo.nodes.forEach(n => {
          const { x, y } = px(n);
          const inMST = mstNodes.has(n.id);
          const et = easeOutElastic(clamp(visitT[n.id] ?? 0, 0, 1));
          helpers.drawNode(x, y, inMST ? 9 : 7.5,
            inMST ? rgba(col, 0.12 + et * 0.72) : "rgba(10,10,20,0.6)",
            inMST ? col : "rgba(255,255,255,0.15)",
            n.label, inMST ? 16 * et : 0,
            inMST && et > 0.6 ? "#09090b" : rgba(col, Math.max(0.3, et)));
        });

        // cost display
        ctx.save();
        helpers.glow(col, 8);
        ctx.fillStyle = col;
        ctx.font = "700 9px 'JetBrains Mono', monospace";
        ctx.textAlign = "left";
        ctx.fillText(`COST: ${Math.round(displayCost)}`, 8, H() - 8);
        helpers.noGlow();
        ctx.fillStyle = rgba(col, 0.4);
        ctx.font = "500 7px monospace";
        ctx.textAlign = "right";
        ctx.fillText(`${mstNodes.size}/${n} nodes`, W() - 8, H() - 8);
        ctx.restore();
      };
    };

    /* ═══════════════════════════════════════════════
       BINARY SEARCH — clean, dramatic, correct upward bars
    ═══════════════════════════════════════════════ */
    const makeBSearchRenderer = () => {
      const vals = algo.values;
      let lo = 0, hi = vals.length - 1, mid = -1;
      let loV = 0, hiV = vals.length - 1, midV = -1;
      let phase = 0, paused = false, lastTs = 0;
      let foundIdx = -1;
      let eliminatedLeft = -1; // indices 0..eliminatedLeft are eliminated
      let eliminatedRight = vals.length; // indices eliminatedRight.. are eliminated

      return (ts) => {
        clearCanvas();

        loV = lerp(loV, lo, 0.14);
        hiV = lerp(hiV, hi, 0.14);
        if (mid >= 0) midV = lerp(midV < 0 ? mid : midV, mid, 0.16);

        if (!paused && ts - lastTs > 900) {
          lastTs = ts;
          if (foundIdx < 0 && lo <= hi) {
            mid = Math.floor((lo + hi) / 2);
            midV = mid;
            const midVal = vals[mid];
            if (midVal === algo.target) {
              foundIdx = mid;
              const boxW = (W() - 24) / vals.length - 4;
              const bx = 12 + mid * (boxW + 4) + boxW / 2;
              paused = true;
              resetTimer = setTimeout(() => {
                lo = 0; hi = vals.length - 1; mid = -1;
                loV = 0; hiV = vals.length - 1; midV = -1;
                phase = 0; foundIdx = -1;
                eliminatedLeft = -1; eliminatedRight = vals.length;
                paused = false; lastTs = ts + 200;
              }, 2400);
            } else if (midVal < algo.target) {
              eliminatedLeft = mid;
              lo = mid + 1;
            } else {
              eliminatedRight = mid;
              hi = mid - 1;
            }
            phase++;
          } else if (foundIdx < 0) {
            paused = true;
            resetTimer = setTimeout(() => {
              lo = 0; hi = vals.length - 1; mid = -1;
              loV = 0; hiV = vals.length - 1; midV = -1;
              phase = 0; foundIdx = -1;
              eliminatedLeft = -1; eliminatedRight = vals.length;
              paused = false; lastTs = ts + 200;
            }, 1600);
          }
        }

        const count = vals.length;
        const boxW = Math.max(24, (W() - 24) / count - 4);
        const totalW = count * (boxW + 4) - 4;
        const startX = (W() - totalW) / 2;
        const boxH = 38;
        const baseY = H() * 0.46 - boxH / 2; // boxes sit in middle, not pointing down

        // draw range bracket
        if (lo <= hi && mid >= 0) {
          const lx = startX + lo * (boxW + 4) - 3;
          const rx = startX + hi * (boxW + 4) + boxW + 3;
          const ry = baseY - 10;
          ctx.save();
          helpers.glow(col, 10);
          ctx.strokeStyle = rgba(col, 0.5);
          ctx.lineWidth = 1.2;
          // bracket
          ctx.beginPath();
          ctx.moveTo(lx + 6, ry); ctx.lineTo(lx, ry); ctx.lineTo(lx, ry + 8);
          ctx.moveTo(rx - 6, ry); ctx.lineTo(rx, ry); ctx.lineTo(rx, ry + 8);
          ctx.stroke();
          helpers.noGlow();
          ctx.restore();
        }

        vals.forEach((v, i) => {
          const x = startX + i * (boxW + 4);
          const isMid = i === mid;
          const isFound = i === foundIdx;
          const eliminated = i <= eliminatedLeft || i >= eliminatedRight;
          const inRange = i >= lo && i <= hi;

          // box
          ctx.save();
          if (isMid || isFound) helpers.glow(col, isFound ? 24 : 18);
          ctx.fillStyle = isFound ? col
            : isMid ? rgba(col, 0.3)
              : inRange ? rgba(col, 0.1)
                : "rgba(255,255,255,0.02)";
          ctx.strokeStyle = isFound ? "#fff"
            : isMid ? col
              : inRange ? rgba(col, 0.45)
                : "rgba(255,255,255,0.06)";
          ctx.lineWidth = isMid || isFound ? 1.8 : 0.8;
          ctx.beginPath();
          ctx.roundRect(x, baseY, boxW, boxH, 8);
          ctx.fill();
          ctx.stroke();
          helpers.noGlow();

          // value
          ctx.fillStyle = isFound ? "#09090b"
            : isMid ? "#fff"
              : eliminated ? "rgba(255,255,255,0.1)"
                : "rgba(255,255,255,0.75)";
          ctx.font = `700 ${boxW > 30 ? 10 : 9}px 'JetBrains Mono', monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(v, x + boxW / 2, baseY + boxH / 2);

          // index
          ctx.fillStyle = "rgba(255,255,255,0.12)";
          ctx.font = "500 6px monospace";
          ctx.textBaseline = "alphabetic";
          ctx.fillText(i, x + boxW / 2, baseY + boxH + 10);
          ctx.restore();
        });

        // MID marker above
        if (mid >= 0) {
          const mx = startX + midV * (boxW + 4) + boxW / 2;
          ctx.save();
          helpers.glow(col, 10);
          ctx.fillStyle = col;
          ctx.font = "700 7px 'JetBrains Mono', monospace";
          ctx.textAlign = "center";
          ctx.fillText("MID", mx, baseY - 14);
          // connector line
          ctx.strokeStyle = rgba(col, 0.5);
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(mx, baseY - 10); ctx.lineTo(mx, baseY); ctx.stroke();
          helpers.noGlow();
          ctx.restore();
        }

        // LO / HI markers below
        const loX = startX + loV * (boxW + 4) + boxW / 2;
        const hiX = startX + hiV * (boxW + 4) + boxW / 2;
        ctx.save();
        ctx.fillStyle = rgba(col, 0.5);
        ctx.font = "600 6.5px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        if (lo <= hi) {
          ctx.fillText("LO", loX, baseY + boxH + 20);
          ctx.fillText("HI", hiX, baseY + boxH + 20);
        }
        ctx.restore();

        // status bar
        ctx.save();
        helpers.glow(col, foundIdx >= 0 ? 10 : 0);
        ctx.fillStyle = foundIdx >= 0 ? col : rgba(col, 0.7);
        ctx.font = "700 8px 'JetBrains Mono', monospace";
        ctx.textAlign = "left";
        ctx.fillText(foundIdx >= 0 ? `✓ FOUND: ${algo.target}` : `TARGET: ${algo.target}`, 8, H() - 8);
        helpers.noGlow();
        ctx.fillStyle = "rgba(255,255,255,0.2)";
        ctx.textAlign = "right";
        ctx.fillText(`STEP ${phase}`, W() - 8, H() - 8);
        ctx.restore();
      };
    };

    /* ═══════════════════════════════════════════════
       SLIDING WINDOW — bars correctly pointing UP
    ═══════════════════════════════════════════════ */
    const makeSlidingWindowRenderer = () => {
      const vals = algo.values;
      const k = algo.windowSize;
      const maxS = vals.length - k;
      let winStart = 0, winStartV = 0;
      let bestSum = -Infinity, bestStart = 0;
      let paused = false, lastTs = 0;
      let phase = 0;
      let curSumV = 0, bestSumV = 0;

      const maxVal = Math.max(...vals);

      return (ts) => {
        clearCanvas();

        winStartV = lerp(winStartV, winStart, 0.14);
        const curSum = vals.slice(winStart, winStart + k).reduce((a, b) => a + b, 0);
        curSumV = lerp(curSumV, curSum, 0.12);
        bestSumV = lerp(bestSumV, bestSum > -Infinity ? bestSum : curSum, 0.12);

        if (!paused && ts - lastTs > 600) {
          lastTs = ts;
          if (winStart <= maxS) {
            const s = vals.slice(winStart, winStart + k).reduce((a, b) => a + b, 0);
            if (s > bestSum) { bestSum = s; bestStart = winStart; }
            if (winStart < maxS) {
              winStart++;
              phase++;
            } else {
              // done
              paused = true;
              resetTimer = setTimeout(() => {
                winStart = 0; winStartV = 0; bestSum = -Infinity;
                bestStart = 0; phase = 0; curSumV = 0; bestSumV = 0;
                paused = false; lastTs = ts + 200;
              }, 2200);
            }
          }
        }

        const count = vals.length;
        const bw = Math.max(16, (W() - 20) / count - 3);
        const totalW = count * (bw + 3) - 3;
        const startX = (W() - totalW) / 2;
        const baseY = H() - 28; // bars go UP from baseY
        const maxBarH = H() - 48; // max height of tallest bar

        // grid
        ctx.save();
        for (let g = 0.25; g <= 1; g += 0.25) {
          const gy = baseY - maxBarH * g;
          ctx.strokeStyle = "rgba(255,255,255,0.04)";
          ctx.lineWidth = 0.5;
          ctx.setLineDash([2, 6]);
          ctx.beginPath(); ctx.moveTo(startX - 8, gy); ctx.lineTo(startX + totalW + 8, gy); ctx.stroke();
          ctx.setLineDash([]);
        }
        ctx.restore();

        // baseline
        ctx.save();
        ctx.strokeStyle = "rgba(255,255,255,0.1)";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(startX - 8, baseY); ctx.lineTo(startX + totalW + 8, baseY); ctx.stroke();
        ctx.restore();

        // window highlight (animated glass)
        const winX = startX + winStartV * (bw + 3) - 3;
        const winW = k * (bw + 3) + 2;
        ctx.save();
        helpers.glow(col, 14);
        ctx.fillStyle = rgba(col, 0.06);
        ctx.strokeStyle = rgba(col, 0.65);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(winX, 12, winW, baseY - 12, 10);
        ctx.fill();
        ctx.stroke();
        helpers.noGlow();
        ctx.restore();

        // best window dotted outline
        if (bestSum > -Infinity && bestStart !== winStart) {
          const bx = startX + bestStart * (bw + 3) - 2;
          const bww = k * (bw + 3) + 1;
          ctx.save();
          ctx.strokeStyle = rgba(col, 0.3);
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 5]);
          ctx.beginPath();
          ctx.roundRect(bx, 14, bww, baseY - 14, 8);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
        }

        // bars — go UP from baseY
        vals.forEach((v, i) => {
          const x = startX + i * (bw + 3);
          const barH = (v / maxVal) * (maxBarH * 0.9);
          const by = baseY - barH; // top of bar
          const inWin = i >= winStart && i < winStart + k;
          const inBest = i >= bestStart && i < bestStart + k && bestSum > -Infinity;

          ctx.save();
          if (inWin) helpers.glow(col, 12);
          ctx.fillStyle = inWin ? col
            : inBest ? rgba(col, 0.35)
              : "rgba(255,255,255,0.07)";
          // draw bar from by upward to baseY
          ctx.beginPath();
          ctx.roundRect(x, by, bw, barH, [3, 3, 0, 0]);
          ctx.fill();

          // cap highlight
          if (inWin) {
            ctx.fillStyle = "rgba(255,255,255,0.55)";
            ctx.fillRect(x + bw * 0.15, by, bw * 0.7, 1.5);
          }
          helpers.noGlow();

          // value label above bar
          ctx.fillStyle = inWin ? "#fff" : "rgba(255,255,255,0.3)";
          ctx.font = "600 7px monospace";
          ctx.textAlign = "center";
          ctx.fillText(v, x + bw / 2, by - 4);
          ctx.restore();
        });

        // sum display
        ctx.save();
        helpers.glow(col, 8);
        ctx.fillStyle = col;
        ctx.font = "700 9px 'JetBrains Mono', monospace";
        ctx.textAlign = "left";
        ctx.fillText(`SUM: ${Math.round(curSumV)}`, 8, H() - 10);
        helpers.noGlow();
        ctx.fillStyle = rgba(col, 0.5);
        ctx.textAlign = "right";
        ctx.fillText(`BEST: ${bestSum > -Infinity ? bestSum : "—"}`, W() - 8, H() - 10);
        ctx.restore();
      };
    };

    /* ═══════════════════════════════════════════════
       TWO POINTERS — converging pointers with arc
    ═══════════════════════════════════════════════ */
    const makeTwoPointersRenderer = () => {
      const vals = algo.values;
      const n = vals.length;
      let L = 0, R = n - 1;
      let LV = 0, RV = n - 1;
      let foundL = -1, foundR = -1;
      let paused = false, lastTs = 0;
      let pulseT = 0;

      return (ts) => {
        clearCanvas();

        LV = lerp(LV, L, 0.18);
        RV = lerp(RV, R, 0.18);
        pulseT += 0.05;

        if (!paused && ts - lastTs > 720) {
          lastTs = ts;
          if (foundL < 0 && L < R) {
            const s = vals[L] + vals[R];
            if (s === algo.target) {
              foundL = L; foundR = R;
              paused = true;
              resetTimer = setTimeout(() => {
                L = 0; R = n - 1; LV = 0; RV = n - 1;
                foundL = -1; foundR = -1;
                paused = false; lastTs = ts + 300;
              }, 2500);
            } else if (s < algo.target) L++;
            else R--;
          } else if (foundL < 0) {
            // no solution found, reset
            paused = true;
            resetTimer = setTimeout(() => {
              L = 0; R = n - 1; LV = 0; RV = n - 1;
              foundL = -1; foundR = -1;
              paused = false; lastTs = ts + 200;
            }, 1400);
          }
        }

        const isFound = foundL >= 0;

        // layout: boxes in the vertical center of the canvas
        const boxH = 36;
        const gap = 4;
        const bw = Math.max(18, (W() - 16) / n - gap);
        const totalW = n * (bw + gap) - gap;
        const startX = (W() - totalW) / 2;
        const boxY = H() / 2 - boxH / 2; // perfectly centred

        // pixel centres of L and R pointers (animated)
        const lCx = startX + LV * (bw + gap) + bw / 2;
        const rCx = startX + RV * (bw + gap) + bw / 2;

        // arc above the boxes
        const arcTop = boxY - 38;
        const midX = (lCx + rCx) / 2;

        // draw arc only when L < R visually
        if (rCx - lCx > 4) {
          ctx.save();
          helpers.glow(col, isFound ? 18 : 10);
          ctx.strokeStyle = isFound ? col : rgba(col, 0.65);
          ctx.lineWidth = isFound ? 2 : 1.4;
          ctx.beginPath();
          ctx.moveTo(lCx, boxY);
          ctx.bezierCurveTo(lCx, arcTop, rCx, arcTop, rCx, boxY);
          ctx.stroke();
          helpers.noGlow();
          ctx.restore();

          // sum label at apex
          const curSum = vals[Math.round(LV)] !== undefined ? vals[L] + vals[R] : 0;
          ctx.save();
          if (isFound) helpers.glow(col, 12);
          ctx.fillStyle = isFound ? col : rgba(col, 0.85);
          ctx.font = `700 ${isFound ? 9 : 8}px 'JetBrains Mono', monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          ctx.fillText(
            isFound ? `${vals[foundL]} + ${vals[foundR]} = ${algo.target} ✓` : `${vals[L]} + ${vals[R]} = ${vals[L] + vals[R]}`,
            midX, arcTop - 4
          );
          helpers.noGlow();
          // Direction hint below sum
          if (!isFound) {
            const sumVal2 = vals[L] + vals[R];
            if (sumVal2 !== algo.target) {
              ctx.fillStyle = rgba(col, 0.5);
              ctx.font = "600 6.5px 'JetBrains Mono', monospace";
              ctx.textAlign = "center";
              ctx.textBaseline = "top";
              ctx.fillText(
                sumVal2 < algo.target ? "too small \u2192 L++" : "too big \u2192 R--",
                midX, arcTop
              );
            }
          }
          ctx.restore();
        }

        // L / R pointer labels with vertical stems
        [[lCx, "L"], [rCx, "R"]].forEach(([cx, label]) => {
          const pulse = Math.sin(pulseT + (label === "R" ? Math.PI : 0)) * 0.4 + 0.6;
          ctx.save();
          helpers.glow(col, 12 * pulse);
          // stem line
          ctx.strokeStyle = rgba(col, 0.5 * pulse);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(cx, boxY - 2);
          ctx.lineTo(cx, boxY - 14);
          ctx.stroke();
          // dot
          ctx.beginPath();
          ctx.arc(cx, boxY - 16, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = col;
          ctx.fill();
          helpers.noGlow();
          // label
          ctx.fillStyle = rgba(col, 0.9);
          ctx.font = "700 7px 'JetBrains Mono', monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          ctx.fillText(label, cx, boxY - 21);
          ctx.restore();
        });

        // draw boxes
        vals.forEach((v, i) => {
          const bx = startX + i * (bw + gap);
          const isL = i === L, isR = i === R;
          const isFoundCell = isFound && (i === foundL || i === foundR);
          const eliminated = i < L || i > R;

          ctx.save();
          if (isFoundCell) helpers.glow(col, 22);
          else if (isL || isR) helpers.glow(col, 14);
          ctx.fillStyle = isFoundCell ? col
            : (isL || isR) ? rgba(col, 0.22)
              : eliminated ? "rgba(255,255,255,0.02)"
                : rgba(col, 0.07);
          ctx.strokeStyle = isFoundCell ? "#fff"
            : (isL || isR) ? col
              : eliminated ? "rgba(255,255,255,0.06)"
                : rgba(col, 0.22);
          ctx.lineWidth = (isL || isR || isFoundCell) ? 1.8 : 0.8;
          ctx.beginPath();
          ctx.roundRect(bx, boxY, bw, boxH, 8);
          ctx.fill();
          ctx.stroke();
          helpers.noGlow();

          ctx.fillStyle = isFoundCell ? "#09090b"
            : (isL || isR) ? "#fff"
              : eliminated ? "rgba(255,255,255,0.1)"
                : "rgba(255,255,255,0.65)";
          ctx.font = `700 ${bw > 26 ? 10 : 9}px 'JetBrains Mono', monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(v, bx + bw / 2, boxY + boxH / 2);
          ctx.restore();
        });

        // bottom status
        ctx.save();
        ctx.fillStyle = isFound ? col : rgba(col, 0.45);
        ctx.font = "700 8px 'JetBrains Mono', monospace";
        ctx.textAlign = "left";
        if (isFound) helpers.glow(col, 8);
        ctx.fillText(`TARGET: ${algo.target}`, 8, H() - 8);
        helpers.noGlow();
        ctx.restore();
      };
    };

    /* ═══════════════════════════════════════════════
       KADANE — correct +/- bars from center baseline
    ═══════════════════════════════════════════════ */
    const makeKadaneRenderer = () => {
      const vals = algo.values;
      let idx = 0, curStart = 0, curSum = 0;
      let bestStart = 0, bestEnd = -1, bestSum = -Infinity;
      let paused = false, lastTs = 0;
      let beamV = 0;

      const maxAbs = Math.max(...vals.map(Math.abs));

      return (ts) => {
        clearCanvas();

        beamV = lerp(beamV, idx, 0.14);

        if (!paused && ts - lastTs > 380) {
          lastTs = ts;
          if (idx < vals.length) {
            const v = vals[idx];
            if (curSum + v < v) { curSum = v; curStart = idx; }
            else curSum += v;
            if (curSum > bestSum) { bestSum = curSum; bestStart = curStart; bestEnd = idx; }
            idx++;
          } else {
            paused = true;
            resetTimer = setTimeout(() => {
              idx = 0; curStart = 0; curSum = 0;
              bestStart = 0; bestEnd = -1; bestSum = -Infinity;
              beamV = 0; paused = false; lastTs = ts + 200;
            }, 2200);
          }
        }

        const count = vals.length;
        // leave room top/bottom: 18px top (label), 24px bottom (label)
        const TOP_PAD = 28, BOT_PAD = 28;
        const availH = H() - TOP_PAD - BOT_PAD;
        const baseY = TOP_PAD + availH * 0.5;
        const scale = (availH * 0.55) / maxAbs;

        const bw = Math.max(8, (W() - 16) / count - 2);
        const totalW = count * (bw + 2) - 2;
        const startX = (W() - totalW) / 2;

        // ── best subarray shaded region ──
        if (bestEnd >= 0) {
          const bx = startX + bestStart * (bw + 2) - 2;
          const bww = (bestEnd - bestStart + 1) * (bw + 2) + 1;
          ctx.save();
          ctx.fillStyle = rgba(col, 0.06);
          ctx.strokeStyle = rgba(col, 0.25);
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 5]);
          ctx.beginPath();
          ctx.roundRect(bx, TOP_PAD, bww, availH, 6);
          ctx.fill(); ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
        }

        // ── current subarray shaded region ──
        if (idx > 0) {
          const cx = startX + curStart * (bw + 2) - 1;
          const cw = (idx - curStart) * (bw + 2) - 1;
          ctx.save();
          ctx.fillStyle = rgba(col, 0.07);
          ctx.strokeStyle = rgba(col, 0.45);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(cx, TOP_PAD, cw, availH, 5);
          ctx.fill(); ctx.stroke();
          ctx.restore();
        }

        // ── baseline ──
        ctx.save();
        ctx.strokeStyle = "rgba(255,255,255,0.14)";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(startX - 6, baseY); ctx.lineTo(startX + totalW + 6, baseY); ctx.stroke();
        // zero label
        ctx.fillStyle = "rgba(255,255,255,0.2)";
        ctx.font = "500 6px monospace";
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillText("0", startX - 8, baseY);
        ctx.restore();

        // ── bars ──
        vals.forEach((v, i) => {
          const x = startX + i * (bw + 2);
          const barH = Math.abs(v) * scale;
          const isPos = v >= 0;
          // positive: top of rect = baseY - barH, height = barH
          // negative: top of rect = baseY,         height = barH
          const rectY = isPos ? baseY - barH : baseY;
          const isActive = i === idx - 1;
          const inCur = i >= curStart && i < idx;
          const inBest = i >= bestStart && i <= bestEnd && bestSum > -Infinity;

          ctx.save();
          if (isActive) helpers.glow(col, 16);
          ctx.fillStyle = isActive ? col
            : inCur ? rgba(col, 0.6)
              : inBest ? rgba(col, 0.3)
                : isPos ? "rgba(255,255,255,0.1)" : "rgba(248,113,113,0.3)";

          const radii = isPos ? [3, 3, 0, 0] : [0, 0, 3, 3];
          ctx.beginPath();
          ctx.roundRect(x, rectY, bw, barH, radii);
          ctx.fill();

          // bright cap on active bar
          if (isActive) {
            ctx.fillStyle = "rgba(255,255,255,0.6)";
            if (isPos) ctx.fillRect(x, rectY, bw, 1.5);
            else ctx.fillRect(x, rectY + barH - 1.5, bw, 1.5);
          }
          helpers.noGlow();

          // value label just outside the bar tip
          ctx.fillStyle = isActive ? "#fff" : "rgba(255,255,255,0.35)";
          ctx.font = "600 6px monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(v, x + bw / 2, isPos ? rectY - 6 : rectY + barH + 6);
          ctx.restore();
        });

        // ── scanning beam ──
        const beamX = startX + beamV * (bw + 2) + bw / 2;
        ctx.save();
        helpers.glow(col, 8);
        ctx.strokeStyle = rgba(col, 0.45);
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 5]);
        ctx.beginPath(); ctx.moveTo(beamX, TOP_PAD); ctx.lineTo(beamX, H() - BOT_PAD); ctx.stroke();
        ctx.setLineDash([]);
        helpers.noGlow();
        ctx.restore();

        // ── labels ──
        ctx.save();
        helpers.glow(col, 8);
        ctx.fillStyle = col;
        ctx.font = "700 8px 'JetBrains Mono', monospace";
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        ctx.fillText(`BEST: ${bestSum > -Infinity ? bestSum : "—"}`, 8, H() - 8);
        helpers.noGlow();
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.textAlign = "right";
        ctx.fillText(`CUR: ${idx > 0 ? curSum : "—"}`, W() - 8, H() - 8);
        ctx.restore();
      };
    };

    /* ═══════════════════════════════════════════════
       KRUSKAL MST — edge sorting + union-find with clear beam
    ═══════════════════════════════════════════════ */
    const makeKruskalRenderer = () => {
      const n = algo.nodes.length;
      const parent = Array.from({ length: n }, (_, i) => i);
      const rank = Array(n).fill(0);
      const find = x => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
      const unite = (a, b) => {
        const ra = find(a), rb = find(b); if (ra === rb) return false;
        if (rank[ra] < rank[rb]) parent[ra] = rb; else if (rank[ra] > rank[rb]) parent[rb] = ra;
        else { parent[rb] = ra; rank[ra]++; } return true;
      };

      const sorted = [...KRUSKAL_EDGES_W].sort((a, b) => a[2] - b[2]);
      const steps = [];
      for (let i = 0; i < n; i++) parent[i] = i;
      for (const [a, b, w] of sorted) {
        const take = unite(a, b);
        steps.push({ a, b, w, take, key: `${Math.min(a, b)}-${Math.max(a, b)}` });
      }
      // reset
      for (let i = 0; i < n; i++) { parent[i] = i; rank[i] = 0; }

      let accepted = new Set(), rejected = new Set();
      let activeKey = null;
      // edgeAnim: key -> { t: 0..1 } for accepted edges beam
      let edgeAnim = {};
      let totalCost = 0, costV = 0;
      let stepIdx = 0, paused = false, lastTs = 0;

      const pxy = nd => ({ x: (nd.x / 100) * W(), y: (nd.y / 100) * H() });

      return (ts) => {
        clearCanvas();

        costV = lerp(costV, totalCost, 0.1);
        // advance all edge beam animations
        for (const k in edgeAnim) {
          edgeAnim[k] = Math.min(1, edgeAnim[k] + 0.03); // slower = more visible beam
        }

        if (!paused && ts - lastTs > 900) {
          lastTs = ts;
          if (stepIdx < steps.length) {
            const s = steps[stepIdx];
            activeKey = s.key;
            if (s.take) {
              accepted.add(s.key);
              edgeAnim[s.key] = 0;
              totalCost += s.w;
            } else {
              rejected.add(s.key);
            }
            stepIdx++;
          } else {
            paused = true;
            resetTimer = setTimeout(() => {
              accepted.clear(); rejected.clear(); activeKey = null; edgeAnim = {};
              totalCost = 0; costV = 0; stepIdx = 0;
              for (let i = 0; i < n; i++) { parent[i] = i; rank[i] = 0; }
              paused = false; lastTs = ts + 300;
            }, 2800);
          }
        }

        // ── draw edges ──
        algo.edges.forEach(([a, b]) => {
          const ew = algo.edgeWeights?.find(e => (e.a === a && e.b === b) || (e.a === b && e.b === a));
          const key = `${Math.min(a, b)}-${Math.max(a, b)}`;
          const na = pxy(algo.nodes[a]), nb = pxy(algo.nodes[b]);
          const prog = edgeAnim[key]; // undefined if not accepted, 0..1 if accepted
          const isAcc = accepted.has(key);
          const isRej = rejected.has(key);
          const isFocus = key === activeKey;
          const mx = (na.x + nb.x) / 2, my = (na.y + nb.y) / 2;

          if (isAcc && prog !== undefined && prog < 1) {
            // animating beam
            helpers.drawEdgeBeam(na.x, na.y, nb.x, nb.y, prog, col, 2.5);
          } else if (isAcc) {
            // fully drawn MST edge
            helpers.glow(col, 10);
            ctx.save();
            ctx.strokeStyle = rgba(col, 0.85);
            ctx.lineWidth = 2.2;
            ctx.beginPath(); ctx.moveTo(na.x, na.y); ctx.lineTo(nb.x, nb.y); ctx.stroke();
            ctx.restore();
            helpers.noGlow();
          } else if (isRej) {
            ctx.save();
            ctx.setLineDash([2, 4]);
            ctx.strokeStyle = "rgba(239,68,68,0.35)";
            ctx.lineWidth = 0.8;
            ctx.beginPath(); ctx.moveTo(na.x, na.y); ctx.lineTo(nb.x, nb.y); ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
          } else if (isFocus && !isAcc && !isRej) {
            // currently being evaluated
            helpers.glow(col, 10);
            ctx.save();
            ctx.strokeStyle = rgba(col, 0.5);
            ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(na.x, na.y); ctx.lineTo(nb.x, nb.y); ctx.stroke();
            ctx.restore();
            helpers.noGlow();
          } else {
            ctx.save();
            ctx.strokeStyle = "rgba(255,255,255,0.08)";
            ctx.lineWidth = 0.8;
            ctx.beginPath(); ctx.moveTo(na.x, na.y); ctx.lineTo(nb.x, nb.y); ctx.stroke();
            ctx.restore();
          }

          // weight label
          if (ew) {
            ctx.save();
            const labelCol = isAcc ? col : isRej ? "rgba(239,68,68,0.7)" : "rgba(255,255,255,0.22)";
            ctx.fillStyle = isAcc ? rgba(col, 0.9) : labelCol;
            ctx.font = "600 7px 'JetBrains Mono', monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(ew.w, mx, my - 5);
            ctx.restore();
          }
        });

        // ── nodes ──
        algo.nodes.forEach(nd => {
          const { x, y } = pxy(nd);
          const inMST = [...accepted].some(k => {
            const [aa, bb] = k.split('-').map(Number);
            return aa === nd.id || bb === nd.id;
          });
          helpers.drawNode(x, y, inMST ? 9.5 : 7.5,
            inMST ? rgba(col, 0.75) : "rgba(10,10,20,0.7)",
            inMST ? col : "rgba(255,255,255,0.18)",
            nd.label, inMST ? 16 : 0,
            inMST ? "#09090b" : "rgba(255,255,255,0.4)");
        });

        // ── status ──
        ctx.save();
        helpers.glow(col, 6);
        ctx.fillStyle = col;
        ctx.font = "700 8px 'JetBrains Mono', monospace";
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        ctx.fillText(`COST: ${Math.round(costV)}`, 8, H() - 8);
        helpers.noGlow();
        ctx.fillStyle = rgba(col, 0.45);
        ctx.textAlign = "right";
        ctx.fillText(`${accepted.size}/${n - 1} edges`, W() - 8, H() - 8);
        ctx.restore();

        // ── step label at top ──
        if (stepIdx > 0 && stepIdx <= steps.length) {
          const curStep = steps[stepIdx - 1];
          const nA = algo.nodes[curStep.a], nB = algo.nodes[curStep.b];
          ctx.save();
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          if (curStep.take) {
            ctx.fillStyle = rgba(col, 0.8);
            ctx.font = "700 7px 'JetBrains Mono', monospace";
            ctx.fillText(`${nA.label}-${nB.label} (w=${curStep.w}) \u2713 ACCEPTED`, W() / 2, 6);
          } else {
            ctx.fillStyle = "rgba(239,68,68,0.7)";
            ctx.font = "700 7px 'JetBrains Mono', monospace";
            ctx.fillText(`${nA.label}-${nB.label} (w=${curStep.w}) \u2717 CYCLE`, W() / 2, 6);
          }
          ctx.restore();
        }
      };
    };

    /* ═══════════════════════════════════════════════
       FLOYD-WARSHALL — live distance matrix + path highlight
    ═══════════════════════════════════════════════ */
    const makeFloydRenderer = () => {
      const n = algo.nodes.length; // 4
      const INF = 999;

      // build initial dist matrix
      const initDist = () => {
        const d = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => i === j ? 0 : INF));
        FW_EDGES_W.forEach(([a, b, w]) => { d[a][b] = Math.min(d[a][b], w); d[b][a] = Math.min(d[b][a], w); });
        return d;
      };

      // pre-compute all FW steps
      const buildSteps = () => {
        const d = initDist();
        const steps = [];
        for (let k = 0; k < n; k++) for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
          if (i === j) continue;
          const via = d[i][k] + d[k][j];
          const improved = via < d[i][j];
          if (improved) d[i][j] = via;
          steps.push({ k, i, j, improved, snapshot: d.map(r => [...r]) });
        }
        return steps;
      };
      const steps = buildSteps();

      let stepIdx = 0;
      let currentDist = initDist(); // what we display in the matrix
      let focus = steps[0];
      let paused = false, lastTs = 0;
      // per-cell flash: [i][j] -> 0..1 highlight amount
      let cellFlash = Array.from({ length: n }, () => Array(n).fill(0));
      let kFlash = 0; // flashes when k changes

      return (ts) => {
        clearCanvas();

        // decay cell flashes
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) cellFlash[i][j] = Math.max(0, cellFlash[i][j] - 0.04);
        kFlash = Math.max(0, kFlash - 0.04);

        if (!paused && ts - lastTs > 200) {
          lastTs = ts;
          if (stepIdx < steps.length) {
            const prev = focus;
            focus = steps[stepIdx++];
            if (focus.improved) {
              currentDist[focus.i][focus.j] = focus.snapshot[focus.i][focus.j];
              currentDist[focus.j][focus.i] = focus.snapshot[focus.j][focus.i];
              cellFlash[focus.i][focus.j] = 1;
              cellFlash[focus.j][focus.i] = 1;
            }
            if (prev && prev.k !== focus.k) kFlash = 1;
          } else {
            paused = true;
            resetTimer = setTimeout(() => {
              stepIdx = 0; focus = steps[0];
              currentDist = initDist();
              cellFlash = Array.from({ length: n }, () => Array(n).fill(0));
              kFlash = 0; paused = false; lastTs = ts + 200;
            }, 2800);
          }
        }

        const pxy = nd => ({ x: (nd.x / 100) * W(), y: (nd.y / 100) * H() });

        // ── LAYOUT: graph on left 60%, matrix on right 40% ──
        const graphW = W() * 0.58;
        const matX = graphW + 8;
        const matW = W() - matX - 8;
        const cellSz = Math.min(Math.floor((matW - 20) / (n + 1)), Math.floor((H() - 36) / (n + 1)));
        const matOffX = matX + (matW - cellSz * (n + 1)) / 2;
        const matOffY = (H() - cellSz * (n + 1) - 16) / 2 + 8;

        // ── GRAPH SECTION ──
        // draw edges
        algo.edges.forEach(([a, b]) => {
          const na = pxy(algo.nodes[a]), nb = pxy(algo.nodes[b]);
          if (na.x > graphW || nb.x > graphW) return; // skip if outside graph area
          const ew = algo.edgeWeights?.find(e => (e.a === a && e.b === b) || (e.a === b && e.b === a));
          const isI = focus && (focus.i === a || focus.i === b);
          const isK = focus && (focus.k === a || focus.k === b);
          const isJ = focus && (focus.j === a || focus.j === b);
          const hot = (isI && isK) || (isK && isJ);
          const mx = (na.x + nb.x) / 2, my = (na.y + nb.y) / 2;

          ctx.save();
          if (hot) helpers.glow(col, 10);
          ctx.strokeStyle = hot ? rgba(col, 0.85) : "rgba(255,255,255,0.1)";
          ctx.lineWidth = hot ? 2 : 0.9;
          ctx.beginPath(); ctx.moveTo(na.x, na.y); ctx.lineTo(nb.x, nb.y); ctx.stroke();
          helpers.noGlow();
          if (ew) {
            ctx.fillStyle = hot ? col : "rgba(255,255,255,0.3)";
            ctx.font = "600 7px 'JetBrains Mono', monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(ew.w, mx - 6, my - 4);
          }
          ctx.restore();
        });

        // if improved, draw the shortcut path dashed line i→j
        if (focus && focus.improved) {
          const pi = pxy(algo.nodes[focus.i]);
          const pj = pxy(algo.nodes[focus.j]);
          ctx.save();
          helpers.glow(col, 8);
          ctx.strokeStyle = rgba(col, 0.5);
          ctx.lineWidth = 1.2;
          ctx.setLineDash([3, 5]);
          ctx.beginPath(); ctx.moveTo(pi.x, pi.y); ctx.lineTo(pj.x, pj.y); ctx.stroke();
          ctx.setLineDash([]);
          helpers.noGlow();
          ctx.restore();
        }

        // animated relay dot: i→k→j
        if (focus && focus.k !== focus.i && focus.k !== focus.j) {
          const pi = pxy(algo.nodes[focus.i]);
          const pk = pxy(algo.nodes[focus.k]);
          const pj = pxy(algo.nodes[focus.j]);
          const t2 = (ts % 800) / 800;
          const half = t2 < 0.5;
          const t3 = half ? t2 * 2 : (t2 - 0.5) * 2;
          const s = half ? pi : pk;
          const e2 = half ? pk : pj;
          const bx = lerp(s.x, e2.x, easeInOutQuart(t3));
          const by = lerp(s.y, e2.y, easeInOutQuart(t3));
          ctx.save();
          helpers.glow(col, 20);
          ctx.beginPath(); ctx.arc(bx, by, 4.5, 0, Math.PI * 2);
          ctx.fillStyle = col; ctx.fill();
          ctx.beginPath(); ctx.arc(bx, by, 2, 0, Math.PI * 2);
          ctx.fillStyle = "#fff"; ctx.fill();
          helpers.noGlow();
          ctx.restore();
        }

        // draw nodes
        algo.nodes.forEach(nd => {
          const { x, y } = pxy(nd);
          if (x > graphW + 5) return;
          const isK = focus && nd.id === focus.k;
          const isI = focus && nd.id === focus.i;
          const isJ = focus && nd.id === focus.j;
          const highlight = isK ? 1 : (isI || isJ) ? 0.8 : 0;
          helpers.drawNode(x, y, 9,
            isK ? "#f0ff00" : (isI || isJ) ? rgba(col, 0.7) : "rgba(10,10,20,0.7)",
            isK ? "#f0ff00" : (isI || isJ) ? col : "rgba(255,255,255,0.18)",
            nd.label, isK ? 18 : (isI || isJ) ? 12 : 0,
            (isK || (isI || isJ)) ? "#09090b" : "rgba(255,255,255,0.45)");
        });

        // ── DISTANCE MATRIX SECTION ──
        // divider
        ctx.save();
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(graphW + 2, 8); ctx.lineTo(graphW + 2, H() - 8); ctx.stroke();
        ctx.restore();

        // matrix title
        ctx.save();
        ctx.fillStyle = rgba(col, 0.5);
        ctx.font = "600 6.5px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.fillText("DIST[][]", matX + matW / 2, matOffY - 4);
        ctx.restore();

        // header row and col (node labels)
        const nodeLabels = algo.nodes.map(nd => nd.label);
        for (let i = 0; i < n; i++) {
          const cx = matOffX + (i + 1) * cellSz + cellSz / 2;
          const ry = matOffY + (i + 1) * cellSz + cellSz / 2;
          const isKCol = focus && focus.k === i;
          ctx.save();
          ctx.fillStyle = isKCol ? "#f0ff00" : "rgba(255,255,255,0.35)";
          ctx.font = `${isKCol ? "700" : "500"} 7px 'JetBrains Mono', monospace`;
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(nodeLabels[i], cx, matOffY + cellSz / 2); // col header
          ctx.fillText(nodeLabels[i], matOffX + cellSz / 2, ry); // row header
          ctx.restore();
        }

        // cells
        for (let i = 0; i < n; i++) {
          for (let j = 0; j < n; j++) {
            const cx = matOffX + (j + 1) * cellSz;
            const cy = matOffY + (i + 1) * cellSz;
            const val = currentDist[i][j];
            const flash = cellFlash[i][j];
            const isFocusCell = focus && focus.i === i && focus.j === j;
            const isKRow = focus && focus.k === i;
            const isKCol = focus && focus.k === j;

            // cell bg
            ctx.save();
            ctx.fillStyle = flash > 0 ? rgba(col, flash * 0.5)
              : isFocusCell ? rgba(col, 0.2)
                : (isKRow || isKCol) ? "rgba(240,255,0,0.06)"
                  : i === j ? "rgba(255,255,255,0.04)"
                    : "rgba(255,255,255,0.02)";
            ctx.strokeStyle = flash > 0 ? rgba(col, flash * 0.8)
              : isFocusCell ? rgba(col, 0.5)
                : "rgba(255,255,255,0.07)";
            ctx.lineWidth = flash > 0 ? 1.2 : 0.5;
            if (flash > 0) helpers.glow(col, 8 * flash);
            ctx.beginPath();
            ctx.rect(cx, cy, cellSz, cellSz);
            ctx.fill(); ctx.stroke();
            helpers.noGlow();

            // value
            const dispVal = val >= INF ? "∞" : String(val);
            ctx.fillStyle = flash > 0 ? "#fff"
              : isFocusCell ? col
                : val >= INF ? "rgba(255,255,255,0.2)"
                  : i === j ? "rgba(255,255,255,0.25)"
                    : "rgba(255,255,255,0.7)";
            ctx.font = `${flash > 0 ? "700" : "500"} ${cellSz > 18 ? 8 : 7}px 'JetBrains Mono', monospace`;
            ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.fillText(dispVal, cx + cellSz / 2, cy + cellSz / 2);
            ctx.restore();
          }
        }

        // progress bar at bottom
        const prog = steps.length ? stepIdx / steps.length : 0;
        ctx.save();
        ctx.fillStyle = "rgba(255,255,255,0.06)";
        ctx.beginPath(); ctx.roundRect(8, H() - 12, W() - 16, 4, 2); ctx.fill();
        helpers.glow(col, 6);
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.roundRect(8, H() - 12, (W() - 16) * prog, 4, 2); ctx.fill();
        helpers.noGlow();
        if (focus) {
          ctx.fillStyle = rgba(col, 0.5);
          ctx.font = "500 6px 'JetBrains Mono', monospace";
          ctx.textAlign = "left";
          ctx.textBaseline = "alphabetic";
          ctx.fillText(`k=${focus.k}`, 8, H() - 16);
        }
        ctx.restore();
      };
    };

    /* ═══════════════════════════════════════════════
       HEAP SORT — tree visualization with animations
    ═══════════════════════════════════════════════ */
    const makeHeapSortRenderer = () => {
      const arr = [...algo.values];
      const steps = [];

      const heapify = (a, n, i) => {
        let lg = i;
        const l = 2 * i + 1, r = 2 * i + 2;
        if (l < n && a[l] > a[lg]) lg = l;
        if (r < n && a[r] > a[lg]) lg = r;
        if (lg !== i) {
          [a[i], a[lg]] = [a[lg], a[i]];
          steps.push({ arr: [...a], swap: [i, lg], heapSize: n });
          heapify(a, n, lg);
        }
      };
      for (let i = Math.floor(arr.length / 2) - 1; i >= 0; i--) heapify(arr, arr.length, i);
      for (let end = arr.length - 1; end > 0; end--) {
        [arr[0], arr[end]] = [arr[end], arr[0]];
        steps.push({ arr: [...arr], swap: [0, end], heapSize: end });
        heapify(arr, end, 0);
      }

      let stepIdx = 0, state = { arr: [...algo.values], swap: [], heapSize: algo.values.length };
      let dispH = [...algo.values], targH = [...algo.values];
      let paused = false, lastTs = 0;

      return (ts) => {
        clearCanvas();

        dispH = dispH.map((v, i) => lerp(v, targH[i], 0.15));

        if (!paused && ts - lastTs > 180) {
          lastTs = ts;
          if (stepIdx < steps.length) {
            state = steps[stepIdx++];
            targH = [...state.arr];
            if (state.swap.length === 2) {
              const bw2 = Math.max(6, (W() - 16) / dispH.length - 2);
              const [si, sj] = state.swap;
            }
          } else {
            paused = true;
            resetTimer = setTimeout(() => {
              dispH = [...algo.values]; targH = [...dispH];
              stepIdx = 0; state = { arr: [...algo.values], swap: [], heapSize: algo.values.length };
              paused = false; lastTs = ts + 200;
            }, 2000);
          }
        }

        const count = dispH.length;
        const bw = Math.max(6, (W() - 16) / count - 2);
        const maxV = Math.max(...algo.values);
        const maxBarH = H() - 28;
        const baseY = H() - 14;
        const heapSz = state.heapSize;

        // heap zone label
        ctx.save();
        ctx.fillStyle = rgba(col, 0.15);
        const heapEndX = 8 + heapSz * (bw + 2) - 2;
        ctx.fillRect(8, 8, heapEndX - 8, maxBarH);
        ctx.restore();

        // bars — go UP from baseY
        dispH.forEach((v, i) => {
          const h = (v / maxV) * maxBarH;
          const x = 8 + i * (bw + 2);
          const by = baseY - h;
          const isSwap = state.swap.includes(i);
          const sorted = i >= heapSz;
          const isRoot = i === 0 && !sorted;

          ctx.save();
          if (isSwap) helpers.glow(col, 18);
          else if (isRoot) helpers.glow(col, 8);
          ctx.fillStyle = sorted ? rgba(col, 0.22)
            : isSwap ? col
              : isRoot ? rgba(col, 0.85)
                : "rgba(255,255,255,0.1)";
          ctx.beginPath();
          ctx.roundRect(x, by, bw, h, [Math.min(3, bw / 2), Math.min(3, bw / 2), 0, 0]);
          ctx.fill();
          if (!sorted) {
            ctx.fillStyle = isSwap ? "rgba(255,255,255,0.6)" : rgba(col, 0.35);
            ctx.fillRect(x, by, bw, 1.5);
          }
          helpers.noGlow();
          ctx.restore();
        });

        // divider
        const divX = 8 + heapSz * (bw + 2) - 1;
        if (heapSz < count) {
          ctx.save();
          helpers.glow(col, 8);
          ctx.strokeStyle = rgba(col, 0.7);
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath(); ctx.moveTo(divX, 6); ctx.lineTo(divX, H() - 6); ctx.stroke();
          ctx.setLineDash([]);
          helpers.noGlow();
          ctx.restore();
        }

        ctx.save();
        helpers.glow(col, 6);
        ctx.fillStyle = rgba(col, 0.7);
        ctx.font = "700 8px 'JetBrains Mono', monospace";
        ctx.textAlign = "left";
        ctx.fillText(`SORTED: ${count - heapSz}/${count}`, 8, H() - 2);
        helpers.noGlow();
        ctx.restore();
      };
    };

    /* ═══════════════════════════════════════════════
       SELECT RENDERER
    ═══════════════════════════════════════════════ */
    let render;
    if (algo.isBinarySearch) render = makeBSearchRenderer();
    else if (algo.isSlidingWindow) render = makeSlidingWindowRenderer();
    else if (algo.isTwoPointers) render = makeTwoPointersRenderer();
    else if (algo.isKadane) render = makeKadaneRenderer();
    else if (algo.isKruskal) render = makeKruskalRenderer();
    else if (algo.isHeapSort) render = makeHeapSortRenderer();
    else if (algo.isFloydWarshall) render = makeFloydRenderer();
    else if (algo.isTree) render = makeInorderRenderer();
    else if (algo.label === "Dijkstra") render = makeDijkstraRenderer();
    else if (algo.label === "Topo Sort") render = makeTopoRenderer();
    else if (algo.label === "Prim's") render = makePrimRenderer();
    else render = makeGraphTraversalRenderer();

    const loop = (ts) => {
      animId = requestAnimationFrame(loop);
      if (!isInView || !isPageVisible) return;
      if (W() === 0 || H() === 0) return;
      if (!ts0) ts0 = ts;
      render(ts - ts0);
    };
    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      if (resetTimer) clearTimeout(resetTimer);
      stopResizeObserver();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [algo]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", display: "block", contain: "strict" }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MERGE SORT CANVAS
═══════════════════════════════════════════════════════════════════ */
export function MergeSortCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    const COLOR = "#34d399";
    const N = 20;

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
    const io = new IntersectionObserver(
      ([entry]) => { isInView = !!entry?.isIntersecting; },
      { threshold: 0.01 }
    );
    io.observe(canvas);
    const onVisibilityChange = () => { isPageVisible = document.visibilityState !== "hidden"; };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const W = () => canvas.offsetWidth;
    const H = () => canvas.offsetHeight;

    const makeArr = () => Array.from({ length: N }, () => Math.floor(Math.random() * 80) + 12);

    const buildSteps = (src) => {
      const steps = [];
      const arr = [...src];
      const aux = [...arr];
      const merge = (lo, mid, hi) => {
        let i = lo, j = mid + 1;
        for (let k = lo; k <= hi; k++) aux[k] = arr[k];
        for (let k = lo; k <= hi; k++) {
          if (i > mid) arr[k] = aux[j++];
          else if (j > hi) arr[k] = aux[i++];
          else if (aux[j] < aux[i]) arr[k] = aux[j++];
          else arr[k] = aux[i++];
          steps.push({ arr: [...arr], active: k, lo, mid, hi });
        }
      };
      const sort = (lo, hi) => {
        if (hi <= lo) return;
        const mid = Math.floor((lo + hi) / 2);
        sort(lo, mid); sort(mid + 1, hi); merge(lo, mid, hi);
      };
      sort(0, arr.length - 1);
      return steps;
    };

    let arr, steps, stepIdx, state;
    let displayH = [], targetH = [];
    let particles = [];
    let restartTimer = null, animId;
    let lastTs = 0;

    const glow = (c, b) => { ctx.shadowColor = c; ctx.shadowBlur = b * perf.glowScale; };
    const noGlow = () => { ctx.shadowBlur = 0; ctx.shadowColor = "transparent"; };

    const init = () => {
      arr = makeArr();
      steps = buildSteps(arr);
      stepIdx = 0;
      state = { arr: [...arr], active: -1, lo: -1, mid: -1, hi: -1 };
      displayH = arr.map(v => v);
      targetH = [...displayH];
    };
    init();

    const loop = (ts) => {
      animId = requestAnimationFrame(loop);
      if (!isInView || !isPageVisible) return;
      if (W() === 0 || H() === 0) return;

      const dt = ts - lastTs;

      // throttle logic updates to ~24fps, but render every frame
      if (dt > 42) {
        lastTs = ts;
        // smooth toward target
        displayH = displayH.map((v, i) => lerp(v, targetH[i], 0.2));

        if (stepIdx < steps.length) {
          state = steps[stepIdx++];
          targetH = [...state.arr];
        } else if (!restartTimer) {
          restartTimer = setTimeout(() => {
            init();
            restartTimer = null;
          }, 1600);
        }
      } else {
        // still smooth every frame
        displayH = displayH.map((v, i) => lerp(v, targetH[i], 0.06));
      }

      // clear
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();

      // update particles
      particles = particles.filter(p => p.life > 0);
      particles.forEach(p => { p.update(); p.draw(ctx); });

      const { active, lo, mid, hi } = state;
      const count = displayH.length;
      const PAD = 8;
      const bw = Math.max(2, (W() - PAD * 2) / count - 2);
      const gap = 2;
      const totalW = count * (bw + gap) - gap;
      const startX = (W() - totalW) / 2;
      const BOT_PAD = 18; // room for labels
      const TOP_PAD = 10;
      const maxBarH = H() - BOT_PAD - TOP_PAD;
      const baseY = H() - BOT_PAD;
      const maxVal = Math.max(...arr); // use original arr max for stable scale

      // highlight merge region background
      if (lo >= 0 && hi >= 0) {
        const rx1 = startX + lo * (bw + gap);
        const rx2 = startX + hi * (bw + gap) + bw;
        ctx.save();
        ctx.fillStyle = `rgba(52,211,153,0.05)`;
        ctx.fillRect(rx1 - 1, TOP_PAD, rx2 - rx1 + 2, maxBarH);
        ctx.restore();

        // left half tint
        if (mid >= lo && mid < hi) {
          const lx1 = startX + lo * (bw + gap);
          const lx2 = startX + mid * (bw + gap) + bw;
          ctx.save();
          ctx.fillStyle = `rgba(52,211,153,0.06)`;
          ctx.fillRect(lx1, TOP_PAD, lx2 - lx1, maxBarH);
          ctx.restore();
        }
      }

      // draw bars — UP from baseY
      for (let i = 0; i < count; i++) {
        const v = displayH[i];
        const barH = Math.max(2, (v / maxVal) * maxBarH);
        const bx = startX + i * (bw + gap);
        const by = baseY - barH;

        const isActive = i === active;
        const inLeft = lo >= 0 && i >= lo && i <= mid;
        const inRight = lo >= 0 && mid >= 0 && i > mid && i <= hi;

        ctx.save();
        if (isActive) { glow(COLOR, 16); }
        ctx.fillStyle = isActive ? COLOR
          : inLeft ? `rgba(52,211,153,0.6)`
            : inRight ? `rgba(52,211,153,0.32)`
              : `rgba(255,255,255,0.1)`;

        // bar rect from by going DOWN to baseY
        const r = Math.min(2, bw / 2);
        ctx.beginPath();
        ctx.roundRect(bx, by, bw, barH, [r, r, 0, 0]);
        ctx.fill();

        // bright cap line on active bar
        if (isActive) {
          ctx.fillStyle = "rgba(255,255,255,0.7)";
          ctx.fillRect(bx, by, bw, 1.5);
        }
        noGlow();
        ctx.restore();
      }

      // baseline
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(startX - 4, baseY);
      ctx.lineTo(startX + totalW + 4, baseY);
      ctx.stroke();
      ctx.restore();

      // merge range bracket below bars
      if (lo >= 0 && hi >= 0) {
        const lx = startX + lo * (bw + gap);
        const rx = startX + hi * (bw + gap) + bw;
        ctx.save();
        glow(COLOR, 5);
        ctx.strokeStyle = `rgba(52,211,153,0.5)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(lx, baseY + 4);
        ctx.lineTo(rx, baseY + 4);
        ctx.stroke();
        noGlow();
        ctx.restore();

        // midpoint divider
        if (mid >= lo && mid < hi) {
          const mx = startX + mid * (bw + gap) + bw;
          ctx.save();
          ctx.strokeStyle = `rgba(52,211,153,0.22)`;
          ctx.lineWidth = 0.8;
          ctx.setLineDash([2, 3]);
          ctx.beginPath();
          ctx.moveTo(mx, baseY + 2);
          ctx.lineTo(mx, TOP_PAD + 4);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
        }
      }

      // labels
      ctx.save();
      ctx.fillStyle = `rgba(52,211,153,0.6)`;
      ctx.font = "700 8px 'JetBrains Mono', monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillText("MERGE SORT", startX, H() - 4);
      ctx.fillStyle = `rgba(52,211,153,0.28)`;
      ctx.textAlign = "right";
      ctx.fillText(`${stepIdx}/${steps.length}`, W() - startX, H() - 4);
      ctx.restore();

    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      stopResizeObserver();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (restartTimer) clearTimeout(restartTimer);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block", contain: "strict" }} />;
}
