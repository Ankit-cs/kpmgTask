"use client";
import React, { useEffect, useRef } from "react";
import { observeElementResize } from "../../lib/observeResize";

const lerp = (a, b, t) => a + (b - a) * t;
const rgba = (hex, a) => {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
};

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

export const COMPLEX_ALGO_CONFIGS = {
  nqueens: {
    color: "#f59e0b",
    label: "N-Queens",
    sub: "Backtracking",
    complexity: "O(N!)",
    desc: "Places queens row-by-row using backtracking so no two queens attack each other.",
    isNQueens: true,
    size: 8,
  },
  sudoku: {
    color: "#22d3ee",
    label: "Sudoku Solver",
    sub: "Backtracking",
    complexity: "Exponential",
    desc: "Fills empty cells with valid digits using constraints and backtracking.",
    isSudoku: true,
    size: 9,
  },
  snakesladders: {
    color: "#f43f5e",
    label: "Snakes & Ladders",
    sub: "Simulation",
    complexity: "O(T)",
    desc: "Simulates dice rolls, climbs ladders, and slips on snakes over a 100-cell board.",
    isSnakesLadders: true,
  },
  knightstour: {
    color: "#8b5cf6",
    label: "Knight's Tour",
    sub: "Backtracking",
    complexity: "O(8^(N²))",
    desc: "Visits every square exactly once using legal knight moves.",
    isKnightsTour: true,
    size: 8,
  },
};

function buildNQueenSteps(n) {
  const board = Array(n).fill(-1);
  const colUsed = Array(n).fill(false);
  const diag1Used = Array(2 * n + 1).fill(false); // r-c+n
  const diag2Used = Array(2 * n + 1).fill(false); // r+c
  const steps = [];

  const gatherConflicts = (row, col) => {
    const conflicts = [];
    for (let r = 0; r < row; r++) {
      const c = board[r];
      if (c < 0) continue;
      if (c === col || (r - c) === (row - col) || (r + c) === (row + col)) {
        conflicts.push({ r, c });
      }
    }
    return conflicts;
  };

  const solve = (row) => {
    if (row === n) {
      steps.push({ kind: "solution", row: n - 1, col: board[n - 1], board: [...board], conflicts: [] });
      return true;
    }

    for (let col = 0; col < n; col++) {
      const conflicts = gatherConflicts(row, col);
      steps.push({ kind: "try", row, col, board: [...board], conflicts });

      const d1 = row - col + n;
      const d2 = row + col;
      if (!colUsed[col] && !diag1Used[d1] && !diag2Used[d2]) {
        board[row] = col;
        colUsed[col] = true;
        diag1Used[d1] = true;
        diag2Used[d2] = true;
        steps.push({ kind: "place", row, col, board: [...board], conflicts: [] });

        if (solve(row + 1)) return true;

        steps.push({ kind: "remove", row, col, board: [...board], conflicts: [] });
        board[row] = -1;
        colUsed[col] = false;
        diag1Used[d1] = false;
        diag2Used[d2] = false;
        steps.push({ kind: "backtrack", row, col, board: [...board], conflicts: [] });
      } else {
        steps.push({ kind: "reject", row, col, board: [...board], conflicts });
      }
    }

    return false;
  };

  solve(0);
  return steps;
}

function buildSudokuSteps(puzzle) {
  const N = 9;
  const board = puzzle.map(row => [...row]);
  const steps = [];

  const clone = () => board.map(row => [...row]);

  const findEmpty = () => {
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (board[r][c] === 0) return [r, c];
      }
    }
    return null;
  };

  const gatherConflicts = (row, col, val) => {
    const conflicts = [];
    for (let c = 0; c < N; c++) {
      if (c !== col && board[row][c] === val) conflicts.push({ r: row, c });
    }
    for (let r = 0; r < N; r++) {
      if (r !== row && board[r][col] === val) conflicts.push({ r, c: col });
    }
    const br = Math.floor(row / 3) * 3;
    const bc = Math.floor(col / 3) * 3;
    for (let r = br; r < br + 3; r++) {
      for (let c = bc; c < bc + 3; c++) {
        if ((r !== row || c !== col) && board[r][c] === val) conflicts.push({ r, c });
      }
    }
    const seen = new Set();
    return conflicts.filter(({ r, c }) => {
      const k = `${r}-${c}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  };

  const isValid = (row, col, val) => gatherConflicts(row, col, val).length === 0;

  const solve = () => {
    const cell = findEmpty();
    if (!cell) {
      steps.push({ kind: "solution", row: -1, col: -1, num: 0, board: clone(), conflicts: [] });
      return true;
    }

    const [row, col] = cell;
    for (let num = 1; num <= 9; num++) {
      const conflicts = gatherConflicts(row, col, num);
      steps.push({ kind: "try", row, col, num, board: clone(), conflicts });

      if (isValid(row, col, num)) {
        board[row][col] = num;
        steps.push({ kind: "place", row, col, num, board: clone(), conflicts: [] });

        if (solve()) return true;

        steps.push({ kind: "remove", row, col, num, board: clone(), conflicts: [] });
        board[row][col] = 0;
        steps.push({ kind: "backtrack", row, col, num, board: clone(), conflicts: [] });
      } else {
        steps.push({ kind: "reject", row, col, num, board: clone(), conflicts });
      }
    }

    return false;
  };

  solve();
  return steps;
}

function buildKnightsTourPath(size = 8) {
  const dirs = [
    [2, 1], [1, 2], [-1, 2], [-2, 1],
    [-2, -1], [-1, -2], [1, -2], [2, -1],
  ];

  const inside = (r, c) => r >= 0 && r < size && c >= 0 && c < size;

  const onwardDegree = (r, c, visited) => {
    let deg = 0;
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (inside(nr, nc) && !visited[nr][nc]) deg++;
    }
    return deg;
  };

  const starts = [];
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) starts.push([r, c]);

  for (const [sr, sc] of starts) {
    const visited = Array.from({ length: size }, () => Array(size).fill(false));
    const path = [[sr, sc]];
    visited[sr][sc] = true;

    let cr = sr, cc = sc;
    let ok = true;

    for (let step = 1; step < size * size; step++) {
      const candidates = [];
      for (const [dr, dc] of dirs) {
        const nr = cr + dr, nc = cc + dc;
        if (!inside(nr, nc) || visited[nr][nc]) continue;
        const degree = onwardDegree(nr, nc, visited);
        const centerBias = Math.abs(nr - (size - 1) / 2) + Math.abs(nc - (size - 1) / 2);
        candidates.push({ nr, nc, degree, centerBias });
      }

      if (!candidates.length) {
        ok = false;
        break;
      }

      candidates.sort((a, b) => (a.degree - b.degree) || (a.centerBias - b.centerBias));
      const best = candidates[0];
      cr = best.nr; cc = best.nc;
      visited[cr][cc] = true;
      path.push([cr, cc]);
    }

    if (ok && path.length === size * size) return path;
  }

  return [[0, 0]];
}

export function NQueensCanvas({ size = 8, color = "#f59e0b" }) {
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

    const steps = buildNQueenSteps(size);
    const empty = { kind: "idle", row: 0, col: 0, board: Array(size).fill(-1), conflicts: [] };

    let stepIdx = 0;
    let state = steps[0] || empty;
    let boardState = [...state.board];
    let lastStepTs = 0;
    let paused = false;
    let successPulse = 0;
    let animId;
    let resetTimer;

    const placePulse = {};
    const rejectPulse = {};

    const clearCanvas = () => {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    };

    const glow = (blur = 10) => {
      ctx.shadowColor = color;
      ctx.shadowBlur = blur * perf.glowScale;
    };
    const noGlow = () => {
      ctx.shadowBlur = 0;
      ctx.shadowColor = "transparent";
    };

    const drawQueen = (x, y, cell, hot = false) => {
      ctx.save();
      if (hot) glow(14);
      ctx.fillStyle = hot ? "#fff" : color;
      ctx.font = `700 ${Math.max(14, cell * 0.62)}px 'JetBrains Mono', 'Fira Code', monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("♛", x, y + 0.5);
      noGlow();
      ctx.restore();
    };

    const qCount = () => boardState.filter(c => c >= 0).length;

    const loop = (ts) => {
      animId = requestAnimationFrame(loop);
      if (!isInView || !isPageVisible) return;
      if (W() === 0 || H() === 0) return;

      clearCanvas();

      Object.keys(placePulse).forEach(k => {
        placePulse[k] = Math.max(0, placePulse[k] - 0.03);
        if (placePulse[k] <= 0) delete placePulse[k];
      });
      Object.keys(rejectPulse).forEach(k => {
        rejectPulse[k] = Math.max(0, rejectPulse[k] - 0.04);
        if (rejectPulse[k] <= 0) delete rejectPulse[k];
      });
      successPulse = Math.max(0, successPulse - 0.015);

      if (!paused && ts - lastStepTs > 210) {
        lastStepTs = ts;
        if (stepIdx < steps.length) {
          state = steps[stepIdx++];
          boardState = [...state.board];

          const k = `${state.row}-${state.col}`;
          if (state.kind === "place") placePulse[k] = 1;
          if (state.kind === "reject" || state.kind === "remove") rejectPulse[k] = 1;

          if (state.kind === "solution") {
            successPulse = 1;
            paused = true;
            resetTimer = setTimeout(() => {
              stepIdx = 0;
              state = steps[0] || empty;
              boardState = [...state.board];
              successPulse = 0;
              Object.keys(placePulse).forEach(key => delete placePulse[key]);
              Object.keys(rejectPulse).forEach(key => delete rejectPulse[key]);
              paused = false;
              lastStepTs = ts + 240;
            }, 2800);
          }
        }
      }

      const margin = 12;
      const infoH = 28;
      const boardSize = Math.min(W() - margin * 2, H() - margin * 2 - infoH);
      const bx = (W() - boardSize) / 2;
      const by = margin + 6;
      const cell = boardSize / size;

      // aura
      ctx.save();
      glow(20 * successPulse);
      ctx.fillStyle = rgba(color, 0.05 + 0.04 * successPulse);
      ctx.beginPath();
      ctx.roundRect(bx - 5, by - 5, boardSize + 10, boardSize + 10, 10);
      ctx.fill();
      noGlow();
      ctx.restore();

      // board
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          const x = bx + c * cell;
          const y = by + r * cell;
          const dark = (r + c) % 2 === 1;

          ctx.save();
          ctx.fillStyle = dark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.11)";
          ctx.fillRect(x, y, cell, cell);

          if (state.row === r) {
            ctx.fillStyle = rgba(color, 0.08);
            ctx.fillRect(x, y, cell, cell);
          }

          if ((state.kind === "try" || state.kind === "reject") && state.row === r && state.col === c) {
            ctx.fillStyle = state.kind === "reject" ? "rgba(239,68,68,0.2)" : rgba(color, 0.22);
            ctx.fillRect(x, y, cell, cell);
          }

          const key = `${r}-${c}`;
          if (placePulse[key] > 0) {
            ctx.strokeStyle = rgba(color, 0.75 * placePulse[key]);
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.roundRect(x + 2, y + 2, cell - 4, cell - 4, 4);
            ctx.stroke();
          }
          if (rejectPulse[key] > 0) {
            ctx.strokeStyle = `rgba(239,68,68,${0.75 * rejectPulse[key]})`;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.roundRect(x + 3, y + 3, cell - 6, cell - 6, 4);
            ctx.stroke();
          }

          ctx.restore();
        }
      }

      // reject conflict rays
      if (state.kind === "reject" && state.conflicts?.length) {
        const tx = bx + state.col * cell + cell / 2;
        const ty = by + state.row * cell + cell / 2;

        state.conflicts.forEach(({ r, c }) => {
          const cx = bx + c * cell + cell / 2;
          const cy = by + r * cell + cell / 2;
          ctx.save();
          ctx.strokeStyle = "rgba(239,68,68,0.55)";
          ctx.lineWidth = 1.2;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(tx, ty);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
        });
      }

      // placed queens
      for (let r = 0; r < size; r++) {
        const c = boardState[r];
        if (c < 0) continue;
        drawQueen(bx + c * cell + cell / 2, by + r * cell + cell / 2, cell, state.kind === "solution");
      }

      // ghost queen
      if ((state.kind === "try" || state.kind === "reject") && state.row >= 0 && state.col >= 0) {
        ctx.save();
        ctx.globalAlpha = state.kind === "reject" ? 0.5 : 0.75;
        drawQueen(bx + state.col * cell + cell / 2, by + state.row * cell + cell / 2, cell, false);
        ctx.restore();
      }

      // axis labels
      ctx.save();
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.font = "500 6px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (let i = 0; i < size; i++) {
        ctx.fillText(String(i), bx + i * cell + cell / 2, by + boardSize + 8);
        ctx.fillText(String(i), bx - 8, by + i * cell + cell / 2);
      }
      ctx.restore();

      const statusMap = {
        try: "TRY",
        place: "PLACE",
        reject: "REJECT",
        remove: "REMOVE",
        backtrack: "BACKTRACK",
        solution: "SOLUTION",
        idle: "IDLE",
      };

      const status = statusMap[state.kind] || "STEP";
      const msg = state.kind === "solution"
        ? "Valid board found"
        : state.kind === "reject"
          ? `Conflict with ${state.conflicts?.length || 0} queen(s)`
          : `r=${state.row}, c=${state.col}`;

      // HUD
      ctx.save();
      if (state.kind === "solution") glow(10);
      ctx.fillStyle = state.kind === "solution" ? color : rgba(color, 0.85);
      ctx.font = "700 8px 'JetBrains Mono', monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(`${status}: ${msg}`, 8, H() - 12);
      noGlow();

      ctx.fillStyle = rgba(color, 0.45);
      ctx.font = "600 7px 'JetBrains Mono', monospace";
      ctx.textAlign = "right";
      ctx.fillText(`Q=${qCount()}/${size}  •  ${stepIdx}/${steps.length}`, W() - 8, H() - 12);

      const p = steps.length ? stepIdx / steps.length : 0;
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
  }, [size, color]);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block", contain: "strict" }} />;
}

export function SudokuCanvas({ color = "#22d3ee" }) {
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

    // Near-solved board for lightweight homepage animation.
    // Blanks are scattered pseudo-randomly across the grid to look natural
    // while still keeping total backtracking steps low.
    const puzzle = [
      [0, 3, 0, 6, 7, 0, 9, 1, 2],
      [6, 0, 2, 1, 9, 5, 0, 4, 8],
      [1, 9, 8, 3, 4, 0, 5, 6, 0],
      [8, 0, 9, 0, 6, 1, 4, 2, 3],
      [4, 0, 6, 8, 0, 3, 7, 9, 1],
      [7, 1, 3, 0, 2, 4, 0, 5, 6],
      [9, 6, 1, 0, 3, 7, 2, 0, 4],
      [2, 8, 7, 4, 0, 9, 0, 3, 5],
      [3, 4, 5, 2, 8, 6, 0, 7, 0],
    ];
    const givenMask = puzzle.map(row => row.map(v => v !== 0));
    const steps = buildSudokuSteps(puzzle);
    const empty = { kind: "idle", row: -1, col: -1, num: 0, board: puzzle.map(r => [...r]), conflicts: [] };

    let stepIdx = 0;
    let state = steps[0] || empty;
    let boardState = state.board.map(r => [...r]);
    let lastStepTs = 0;
    let paused = false;
    let successPulse = 0;
    let animId;
    let resetTimer;

    const placePulse = {};
    const rejectPulse = {};

    const clearCanvas = () => {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    };

    const glow = (blur = 10) => {
      ctx.shadowColor = color;
      ctx.shadowBlur = blur * perf.glowScale;
    };
    const noGlow = () => {
      ctx.shadowBlur = 0;
      ctx.shadowColor = "transparent";
    };

    const filledCount = () => boardState.flat().filter(v => v > 0).length;

    const loop = (ts) => {
      animId = requestAnimationFrame(loop);
      if (!isInView || !isPageVisible) return;
      if (W() === 0 || H() === 0) return;

      clearCanvas();

      Object.keys(placePulse).forEach(k => {
        placePulse[k] = Math.max(0, placePulse[k] - 0.035);
        if (placePulse[k] <= 0) delete placePulse[k];
      });
      Object.keys(rejectPulse).forEach(k => {
        rejectPulse[k] = Math.max(0, rejectPulse[k] - 0.045);
        if (rejectPulse[k] <= 0) delete rejectPulse[k];
      });
      successPulse = Math.max(0, successPulse - 0.014);

      if (!paused && ts - lastStepTs > 95) {
        lastStepTs = ts;
        if (stepIdx < steps.length) {
          state = steps[stepIdx++];
          boardState = state.board.map(r => [...r]);

          const k = `${state.row}-${state.col}`;
          if (state.kind === "place") placePulse[k] = 1;
          if (state.kind === "reject" || state.kind === "remove") rejectPulse[k] = 1;

          if (state.kind === "solution") {
            successPulse = 1;
            paused = true;
            resetTimer = setTimeout(() => {
              stepIdx = 0;
              state = steps[0] || empty;
              boardState = state.board.map(r => [...r]);
              successPulse = 0;
              Object.keys(placePulse).forEach(key => delete placePulse[key]);
              Object.keys(rejectPulse).forEach(key => delete rejectPulse[key]);
              paused = false;
              lastStepTs = ts + 240;
            }, 2600);
          }
        }
      }

      const margin = 10;
      const infoH = 30;
      const size = 9;
      const boardSize = Math.min(W() - margin * 2, H() - margin * 2 - infoH);
      const bx = (W() - boardSize) / 2;
      const by = margin + 2;
      const cell = boardSize / size;

      // panel aura
      ctx.save();
      glow(20 * successPulse);
      ctx.fillStyle = rgba(color, 0.04 + 0.05 * successPulse);
      ctx.beginPath();
      ctx.roundRect(bx - 6, by - 6, boardSize + 12, boardSize + 12, 10);
      ctx.fill();
      noGlow();
      ctx.restore();

      // cells
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          const x = bx + c * cell;
          const y = by + r * cell;
          const boxTone = (Math.floor(r / 3) + Math.floor(c / 3)) % 2 === 0;

          ctx.save();
          ctx.fillStyle = boxTone ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.03)";
          ctx.fillRect(x, y, cell, cell);

          // row/col focus
          if (state.row === r || state.col === c) {
            ctx.fillStyle = rgba(color, 0.06);
            ctx.fillRect(x, y, cell, cell);
          }

          // active candidate cell
          if (state.row === r && state.col === c) {
            ctx.fillStyle = state.kind === "reject" ? "rgba(239,68,68,0.2)" : rgba(color, 0.18);
            ctx.fillRect(x, y, cell, cell);
          }

          const key = `${r}-${c}`;
          if (placePulse[key] > 0) {
            ctx.strokeStyle = rgba(color, 0.8 * placePulse[key]);
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.roundRect(x + 2, y + 2, cell - 4, cell - 4, 3);
            ctx.stroke();
          }
          if (rejectPulse[key] > 0) {
            ctx.strokeStyle = `rgba(239,68,68,${0.8 * rejectPulse[key]})`;
            ctx.lineWidth = 1.1;
            ctx.beginPath();
            ctx.roundRect(x + 3, y + 3, cell - 6, cell - 6, 3);
            ctx.stroke();
          }
          ctx.restore();
        }
      }

      // conflict rays
      if (state.kind === "reject" && state.conflicts?.length && state.row >= 0 && state.col >= 0) {
        const tx = bx + state.col * cell + cell / 2;
        const ty = by + state.row * cell + cell / 2;
        state.conflicts.forEach(({ r, c }) => {
          const cx = bx + c * cell + cell / 2;
          const cy = by + r * cell + cell / 2;
          ctx.save();
          ctx.strokeStyle = "rgba(239,68,68,0.52)";
          ctx.lineWidth = 1.1;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(tx, ty);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
        });
      }

      // grid lines
      ctx.save();
      for (let i = 0; i <= 9; i++) {
        ctx.beginPath();
        ctx.moveTo(bx + i * cell, by);
        ctx.lineTo(bx + i * cell, by + boardSize);
        ctx.strokeStyle = i % 3 === 0 ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.12)";
        ctx.lineWidth = i % 3 === 0 ? 1.6 : 0.7;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(bx, by + i * cell);
        ctx.lineTo(bx + boardSize, by + i * cell);
        ctx.strokeStyle = i % 3 === 0 ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.12)";
        ctx.lineWidth = i % 3 === 0 ? 1.6 : 0.7;
        ctx.stroke();
      }
      ctx.restore();

      // numbers
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          const v = boardState[r][c];
          if (!v) continue;
          const x = bx + c * cell + cell / 2;
          const y = by + r * cell + cell / 2;
          const given = givenMask[r][c];
          const active = state.row === r && state.col === c;

          ctx.save();
          if (active && !given) glow(8);
          ctx.fillStyle = given ? "rgba(255,255,255,0.92)" : (active ? color : "rgba(178,242,255,0.9)");
          ctx.font = `700 ${Math.max(10, cell * 0.5)}px 'JetBrains Mono', monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(String(v), x, y + 0.5);
          noGlow();
          ctx.restore();
        }
      }

      // try digit ghost
      if ((state.kind === "try" || state.kind === "reject") && state.row >= 0 && state.col >= 0) {
        const x = bx + state.col * cell + cell / 2;
        const y = by + state.row * cell + cell / 2;
        ctx.save();
        ctx.globalAlpha = state.kind === "reject" ? 0.5 : 0.75;
        ctx.fillStyle = state.kind === "reject" ? "rgba(248,113,113,0.9)" : "rgba(34,211,238,0.95)";
        ctx.font = `700 ${Math.max(10, cell * 0.48)}px 'JetBrains Mono', monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(state.num), x, y + 0.5);
        ctx.restore();
      }

      const statusMap = {
        try: "TRY",
        place: "PLACE",
        reject: "REJECT",
        remove: "REMOVE",
        backtrack: "BACKTRACK",
        solution: "SOLUTION",
        idle: "IDLE",
      };
      const status = statusMap[state.kind] || "STEP";
      const msg = state.kind === "solution"
        ? "Solved grid"
        : state.kind === "reject"
          ? `r${state.row} c${state.col} = ${state.num} conflicts`
          : state.row >= 0
            ? `r${state.row} c${state.col}${state.num ? ` = ${state.num}` : ""}`
            : "initializing";

      ctx.save();
      if (state.kind === "solution") glow(10);
      ctx.fillStyle = state.kind === "solution" ? color : rgba(color, 0.86);
      ctx.font = "700 8px 'JetBrains Mono', monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(`${status}: ${msg}`, 8, H() - 12);
      noGlow();

      ctx.fillStyle = rgba(color, 0.5);
      ctx.font = "600 7px 'JetBrains Mono', monospace";
      ctx.textAlign = "right";
      ctx.fillText(`filled ${filledCount()}/81  •  ${stepIdx}/${steps.length}`, W() - 8, H() - 12);

      const p = steps.length ? stepIdx / steps.length : 0;
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

export function SnakesLaddersCanvas({ color = "#f43f5e" }) {
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

    const LADDERS = {
      4: 14,
      9: 31,
      21: 42,
      28: 84,
      51: 67,
      72: 91,
      80: 99,
    };
    const SNAKES = {
      17: 7,
      54: 34,
      62: 19,
      64: 60,
      87: 24,
      93: 73,
      95: 75,
      98: 79,
    };

    const DICE = [4, 6, 2, 5, 1, 3, 6, 2, 4, 5, 2, 6, 1, 3, 4, 5, 6, 2, 1, 6, 3, 4, 2, 5, 6];

    const buildEvents = () => {
      const events = [];
      let pos = 1;
      let turn = 0;
      for (let i = 0; i < DICE.length; i++) {
        turn += 1;
        const dice = DICE[i];
        let next = pos + dice;
        if (next > 100) next = pos;
        events.push({ kind: "move", from: pos, to: next, dice, turn });
        pos = next;

        if (LADDERS[pos]) {
          const to = LADDERS[pos];
          events.push({ kind: "ladder", from: pos, to, dice, turn });
          pos = to;
        } else if (SNAKES[pos]) {
          const to = SNAKES[pos];
          events.push({ kind: "snake", from: pos, to, dice, turn });
          pos = to;
        }

        if (pos === 100) break;
      }
      return events;
    };

    const events = buildEvents();
    const empty = { kind: "idle", from: 1, to: 1, dice: 0, turn: 0 };
    let eventIdx = 0;
    let event = empty;
    let currentPos = 1;
    let lastStepTs = 0;
    let pulse = 0;
    let paused = false;
    let animId;
    let resetTimer;

    const clearCanvas = () => {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    };

    const glow = (blur = 10, c = color) => {
      ctx.shadowColor = c;
      ctx.shadowBlur = blur * perf.glowScale;
    };
    const noGlow = () => {
      ctx.shadowBlur = 0;
      ctx.shadowColor = "transparent";
    };

    const cellCenter = (n, bx, by, boardSize, cell) => {
      const z = n - 1;
      const row = Math.floor(z / 10);
      const colInRow = z % 10;
      const col = row % 2 === 0 ? colInRow : 9 - colInRow;
      const yRow = 9 - row;
      return { x: bx + col * cell + cell / 2, y: by + yRow * cell + cell / 2 };
    };

    const drawConnector = (from, to, bx, by, boardSize, cell, isLadder) => {
      const a = cellCenter(from, bx, by, boardSize, cell);
      const b = cellCenter(to, bx, by, boardSize, cell);
      ctx.save();
      const c = isLadder ? "#34d399" : "#f87171";
      glow(8, c);
      ctx.strokeStyle = rgba(c, 0.8);
      ctx.lineWidth = isLadder ? 2 : 1.8;
      if (isLadder) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.max(1, Math.hypot(dx, dy));
        const nx = -dy / len;
        const ny = dx / len;
        const off = 3;
        ctx.beginPath();
        ctx.moveTo(a.x + nx * off, a.y + ny * off);
        ctx.lineTo(b.x + nx * off, b.y + ny * off);
        ctx.moveTo(a.x - nx * off, a.y - ny * off);
        ctx.lineTo(b.x - nx * off, b.y - ny * off);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.bezierCurveTo((a.x + b.x) / 2 + 8, (a.y + b.y) / 2 - 12, (a.x + b.x) / 2 - 8, (a.y + b.y) / 2 + 12, b.x, b.y);
        ctx.stroke();
      }
      noGlow();
      ctx.restore();
    };

    const loop = (ts) => {
      animId = requestAnimationFrame(loop);
      if (!isInView || !isPageVisible) return;
      if (W() === 0 || H() === 0) return;

      clearCanvas();

      pulse = Math.max(0, pulse - 0.03);

      if (!paused && ts - lastStepTs > 620) {
        lastStepTs = ts;
        if (eventIdx < events.length) {
          event = events[eventIdx++];
          currentPos = event.to;
          pulse = 1;
        } else {
          paused = true;
          resetTimer = setTimeout(() => {
            eventIdx = 0;
            event = empty;
            currentPos = 1;
            lastStepTs = 0;
            pulse = 0;
            paused = false;
          }, 2200);
        }
      }

      const margin = 10;
      const hudH = 28;
      const boardSize = Math.min(W() - margin * 2, H() - margin * 2 - hudH);
      const bx = (W() - boardSize) / 2;
      const by = margin + 4;
      const cell = boardSize / 10;

      // board cells
      for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 10; c++) {
          const x = bx + c * cell;
          const y = by + r * cell;
          const dark = (r + c) % 2 === 1;
          ctx.save();
          ctx.fillStyle = dark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.1)";
          ctx.fillRect(x, y, cell, cell);
          ctx.strokeStyle = "rgba(255,255,255,0.08)";
          ctx.lineWidth = 0.6;
          ctx.strokeRect(x, y, cell, cell);
          ctx.restore();
        }
      }

      // numbers
      ctx.save();
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.font = `${Math.max(5, cell * 0.18)}px 'JetBrains Mono', monospace`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      for (let n = 1; n <= 100; n++) {
        const p = cellCenter(n, bx, by, boardSize, cell);
        ctx.fillText(String(n), p.x - cell * 0.42, p.y - cell * 0.42);
      }
      ctx.restore();

      // ladders/snakes
      Object.entries(LADDERS).forEach(([a, b]) => drawConnector(Number(a), b, bx, by, boardSize, cell, true));
      Object.entries(SNAKES).forEach(([a, b]) => drawConnector(Number(a), b, bx, by, boardSize, cell, false));

      // token
      const tp = cellCenter(Math.max(1, Math.min(100, currentPos)), bx, by, boardSize, cell);
      ctx.save();
      glow(14);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(tp.x, tp.y, Math.max(4, cell * 0.18 + pulse * 2), 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(tp.x, tp.y, Math.max(1.8, cell * 0.07), 0, Math.PI * 2);
      ctx.fill();
      noGlow();
      ctx.restore();

      // HUD
      const label = event.kind === "ladder"
        ? `LADDER ${event.from}→${event.to}`
        : event.kind === "snake"
          ? `SNAKE ${event.from}→${event.to}`
          : `ROLL ${event.dice || 0}`;
      ctx.save();
      ctx.fillStyle = rgba(color, 0.88);
      ctx.font = "700 8px 'JetBrains Mono', monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(`${label}`, 8, H() - 12);
      ctx.fillStyle = rgba(color, 0.5);
      ctx.font = "600 7px 'JetBrains Mono', monospace";
      ctx.textAlign = "right";
      ctx.fillText(`POS ${currentPos}  •  TURN ${event.turn || 0}`, W() - 8, H() - 12);

      const p = events.length ? eventIdx / events.length : 0;
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

export function KnightsTourCanvas({ color = "#8b5cf6", size = 8 }) {
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

    const path = buildKnightsTourPath(size);
    const total = path.length;

    let currentStep = 0;
    let fromStep = 0;
    let toStep = 0;
    let moving = false;
    let moveStartTs = 0;
    let nextMoveTs = 0;
    let paused = false;
    let pulse = 0;
    let animId;
    let resetTimer;

    const clearCanvas = () => {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    };

    const glow = (blur = 10, c = color) => {
      ctx.shadowColor = c;
      ctx.shadowBlur = blur * perf.glowScale;
    };
    const noGlow = () => {
      ctx.shadowBlur = 0;
      ctx.shadowColor = "transparent";
    };

    const center = (r, c, bx, by, cell) => ({ x: bx + c * cell + cell / 2, y: by + r * cell + cell / 2 });

    const loop = (ts) => {
      animId = requestAnimationFrame(loop);
      if (!isInView || !isPageVisible) return;
      if (W() === 0 || H() === 0) return;

      clearCanvas();

      pulse = Math.max(0, pulse - 0.03);

      if (moving) {
        const t = Math.max(0, Math.min(1, (ts - moveStartTs) / 260));
        if (t >= 1) {
          currentStep = toStep;
          moving = false;
          nextMoveTs = ts + 50;
        }
      } else if (!paused && ts >= nextMoveTs) {
        if (currentStep < total - 1) {
          fromStep = currentStep;
          toStep = currentStep + 1;
          moving = true;
          moveStartTs = ts;
          pulse = 1;
        } else {
          paused = true;
          resetTimer = setTimeout(() => {
            currentStep = 0;
            fromStep = 0;
            toStep = 0;
            moving = false;
            nextMoveTs = 0;
            pulse = 0;
            paused = false;
          }, 2200);
        }
      }

      const margin = 12;
      const hudH = 28;
      const boardSize = Math.min(W() - margin * 2, H() - margin * 2 - hudH);
      const bx = (W() - boardSize) / 2;
      const by = margin + 6;
      const cell = boardSize / size;

      const completed = total > 0 && currentStep >= total - 1 && !moving;

      // static board aura (no pulsing)
      ctx.save();
      ctx.fillStyle = rgba(color, 0.05);
      ctx.beginPath();
      ctx.roundRect(bx - 5, by - 5, boardSize + 10, boardSize + 10, 10);
      ctx.fill();
      ctx.restore();

      // board
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          const x = bx + c * cell;
          const y = by + r * cell;
          const dark = (r + c) % 2 === 1;

          const [kr, kc] = path[currentStep] || [0, 0];
          const isKnightCell = r === kr && c === kc;

          ctx.save();
          ctx.fillStyle = dark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.11)";
          ctx.fillRect(x, y, cell, cell);

          if (isKnightCell) {
            ctx.fillStyle = rgba(color, 0.2);
            ctx.fillRect(x, y, cell, cell);
          }

          ctx.restore();
        }
      }

      // visited trail
      if (currentStep > 0) {
        ctx.save();
        ctx.strokeStyle = rgba(color, 0.35);
        ctx.lineWidth = Math.max(1.2, cell * 0.08);
        ctx.beginPath();
        for (let i = 0; i <= currentStep; i++) {
          const [r, c] = path[i];
          const p = center(r, c, bx, by, cell);
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
        ctx.restore();
      }

      // token position (smooth between current and next step)
      let px;
      let py;
      if (moving) {
        const t = Math.max(0, Math.min(1, (ts - moveStartTs) / 260));
        const et = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const [fr, fc] = path[fromStep];
        const [tr, tc] = path[toStep];
        const a = center(fr, fc, bx, by, cell);
        const b = center(tr, tc, bx, by, cell);
        px = lerp(a.x, b.x, et);
        py = lerp(a.y, b.y, et);
      } else {
        const [r, c] = path[currentStep] || [0, 0];
        const p = center(r, c, bx, by, cell);
        px = p.x;
        py = p.y;
      }

      // knight token
      ctx.save();
      const iconSize = Math.max(20, cell * 0.56 + pulse * 2.2);
      glow(14);
      ctx.fillStyle = color;
      ctx.font = `700 ${Math.max(20, iconSize * 0.74)}px 'Segoe UI Symbol', 'JetBrains Mono', monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("♞", px, py + 0.6);
      noGlow();
      ctx.restore();

      // axis labels (N-Queens-style)
      ctx.save();
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.font = "500 6px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (let i = 0; i < size; i++) {
        ctx.fillText(String(i), bx + i * cell + cell / 2, by + boardSize + 8);
        ctx.fillText(String(i), bx - 8, by + i * cell + cell / 2);
      }
      ctx.restore();

      // HUD
      ctx.save();
      if (completed) glow(10);
      ctx.fillStyle = completed ? color : rgba(color, 0.85);
      ctx.font = "700 8px 'JetBrains Mono', monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(completed ? "SOLUTION: Full tour complete" : "TRY: exploring legal knight moves", 8, H() - 12);
      noGlow();

      ctx.fillStyle = rgba(color, 0.45);
      ctx.font = "600 7px 'JetBrains Mono', monospace";
      ctx.textAlign = "right";
      ctx.fillText(`STEP ${Math.min(currentStep + 1, total)}/${total}`, W() - 8, H() - 12);

      const prog = total > 0 ? (currentStep + (moving ? 0.5 : 0)) / total : 0;
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.beginPath();
      ctx.roundRect(8, H() - 8, W() - 16, 3, 2);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(8, H() - 8, (W() - 16) * Math.max(0, Math.min(1, prog)), 3, 2);
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
  }, [color, size]);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block", contain: "strict" }} />;
}

export function ComplexAlgoCanvas({ algo }) {
  if (algo?.isNQueens) {
    return <NQueensCanvas size={algo.size || 8} color={algo.color || "#f59e0b"} />;
  }
  if (algo?.isSudoku) {
    return <SudokuCanvas color={algo.color || "#22d3ee"} />;
  }
  if (algo?.isSnakesLadders) {
    return <SnakesLaddersCanvas color={algo.color || "#f43f5e"} />;
  }
  if (algo?.isKnightsTour) {
    return <KnightsTourCanvas color={algo.color || "#8b5cf6"} size={algo.size || 8} />;
  }
  return null;
}

