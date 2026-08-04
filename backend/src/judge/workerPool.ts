import { execSync, execFileSync } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

// ─── Configuration ───
const POOL_SIZE = parseInt(process.env.WORKER_POOL_SIZE || "3", 10);
const MEMORY_LIMIT = process.env.WORKER_MEMORY || "256m";
const CPU_LIMIT = process.env.WORKER_CPU || "1";
const ACQUIRE_TIMEOUT = parseInt(process.env.ACQUIRE_TIMEOUT || "30000", 10); // ms to wait for a free worker

export type Language = 'cpp' | 'java' | 'c' | 'go' | 'nodejs' | 'python';

const IMAGES: Record<Language, string> = {
  cpp: "vantage-sandbox-cpp",
  java: "vantage-sandbox-java",
  c: "vantage-sandbox-c",
  go: "vantage-sandbox-go",
  nodejs: "vantage-sandbox-nodejs",
  python: "vantage-sandbox-python",
};

export interface Worker {
  id: string;
  name: string;
  language: Language;
  busy: boolean;
  execCount: number;
}

interface WaitQueueItem {
  resolve: (value: Worker) => void;
  timer: NodeJS.Timeout;
}

/** Map<Language, Worker[]> */
const pools = new Map<Language, Worker[]>();

/** Map<Language, WaitQueueItem[]> */
const waitQueues = new Map<Language, WaitQueueItem[]>();

let initialized = false;

// ─── Public API ───

/**
 * Boot the worker pool. Call once on server start.
 * Builds sandbox images if needed, then spins up POOL_SIZE containers per language.
 */
export async function initPool(): Promise<void> {
  if (initialized) return;

  console.log(`\n🏗️  Initializing worker pool (${POOL_SIZE} per language)...\n`);

  for (const lang of Object.keys(IMAGES) as Language[]) {
    ensureImage(lang);
    pools.set(lang, []);
    waitQueues.set(lang, []);

    for (let i = 0; i < POOL_SIZE; i++) {
      const worker = startWorker(lang, i);
      pools.get(lang)!.push(worker);
    }

    console.log(`  ✅ ${lang}: ${POOL_SIZE} workers ready`);
  }

  initialized = true;
  console.log(`\n⚡ Worker pool ready - ${POOL_SIZE * Object.keys(IMAGES).length} total workers\n`);
}

/**
 * Acquire an idle worker for the given language.
 * If all workers are busy, waits up to ACQUIRE_TIMEOUT ms.
 *
 * @param language - "cpp" | "java"
 */
export function acquire(language: Language): Promise<Worker> {
  const pool = pools.get(language);
  if (!pool) throw new Error(`No pool for language: ${language}`);

  // Try to find a free worker immediately
  const idle = pool.find((w) => !w.busy && isAlive(w));
  if (idle) {
    idle.busy = true;
    return Promise.resolve(idle);
  }

  // Check for dead workers and revive them
  for (let i = 0; i < pool.length; i++) {
    if (!isAlive(pool[i])) {
      console.log(`🔄 Reviving dead worker ${pool[i].name}`);
      killSafe(pool[i]);
      pool[i] = startWorker(language, i);
      pool[i].busy = true;
      return Promise.resolve(pool[i]);
    }
  }

  // All busy - queue the request
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const queue = waitQueues.get(language)!;
      const idx = queue.findIndex((item) => item.resolve === resolve);
      if (idx !== -1) queue.splice(idx, 1);
      reject(new Error(`Worker pool exhausted - all ${POOL_SIZE} ${language} workers busy. Try again later.`));
    }, ACQUIRE_TIMEOUT);

    waitQueues.get(language)!.push({ resolve, timer });
  });
}

/**
 * Release a worker back to the pool.
 * Cleans up /workspace inside the container so the next submission starts fresh.
 */
export function release(worker: Worker): void {
  // Clean workspace inside the container
  try {
    execSync(`docker exec ${worker.name} sh -c "rm -rf /workspace/* /workspace/.* 2>/dev/null; true"`, {
      timeout: 5000,
      stdio: "ignore",
    });
  } catch {
    // If cleanup fails, the worker might be dead - it'll be revived on next acquire
  }

  worker.busy = false;
  worker.execCount++;

  // Wake up the next waiting request, if any
  const queue = waitQueues.get(worker.language);
  if (queue && queue.length > 0) {
    const next = queue.shift()!;
    clearTimeout(next.timer);
    worker.busy = true;
    next.resolve(worker);
  }
}

export interface ExecOptions {
  input?: string;
  timeout?: number;
}

export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  killed: boolean;
}

/**
 * Execute a command inside a worker container.
 */
export function execInWorker(worker: Worker, cmd: string, opts: ExecOptions = {}): ExecResult {
  const timeout = opts.timeout || 10000;
  const args = ["exec"];

  if (opts.input !== undefined) {
    args.push("-i"); // keep stdin open
  }

  args.push(worker.name, "sh", "-c", cmd);

  try {
    const stdout = execFileSync("docker", args, {
      input: opts.input,
      timeout,
      maxBuffer: 10 * 1024 * 1024,
      stdio: ["pipe", "pipe", "pipe"],
    });
    return { stdout: stdout.toString(), stderr: "", exitCode: 0, killed: false };
  } catch (err: any) {
    return {
      stdout: err.stdout?.toString() || "",
      stderr: err.stderr?.toString() || "",
      exitCode: err.status || 1,
      killed: !!(err.killed || err.signal === "SIGTERM"),
    };
  }
}

/**
 * Write a file into the worker's /workspace.
 */
export function writeToWorker(worker: Worker, filename: string, content: string): void {
  execInWorker(worker, `cat > /workspace/${filename}`, {
    input: content,
    timeout: 5000,
  });
}

/**
 * Get pool status for health/monitoring endpoints.
 */
export function getPoolStatus(): Record<string, any> {
  const status: Record<string, any> = {};
  for (const [lang, pool] of Array.from(pools.entries())) {
    status[lang] = {
      total: pool.length,
      idle: pool.filter((w) => !w.busy).length,
      busy: pool.filter((w) => w.busy).length,
      waiting: waitQueues.get(lang)?.length || 0,
      workers: pool.map((w) => ({
        name: w.name,
        busy: w.busy,
        alive: isAlive(w),
        execCount: w.execCount,
      })),
    };
  }
  return status;
}

/**
 * Graceful shutdown - stop all workers.
 */
export function shutdownPool(): void {
  console.log("\n🛑 Shutting down worker pool...");
  for (const [lang, pool] of Array.from(pools.entries())) {
    for (const worker of pool) {
      killSafe(worker);
    }
    console.log(`  ⏹️  ${lang}: ${pool.length} workers stopped`);
  }
  initialized = false;
}

// ─── Internal helpers ───

function ensureImage(language: Language): void {
  const img = IMAGES[language];
  try {
    execSync(`docker image inspect ${img}`, { stdio: "ignore", timeout: 10000 });
  } catch {
    console.log(`📦 Building sandbox image: ${img} ...`);
    const contextPath = path.join(process.cwd(), "sandboxes", language);
    execSync(`docker build -t ${img} "${contextPath}"`, {
      stdio: "inherit",
      timeout: 300000,
    });
    console.log(`✅ ${img} built`);
  }
}

function startWorker(language: Language, index: number): Worker {
  const name = `judge-${language}-${index}`;
  const img = IMAGES[language];

  // Kill any leftover container with the same name
  try { execSync(`docker rm -f ${name}`, { stdio: "ignore", timeout: 10000 }); } catch { /* noop */ }

  // Start a long-lived container
  const dockerCmd = [
    "docker", "run", "-d",
    "--name", name,
    "--network", "none",
    `--memory=${MEMORY_LIMIT}`,
    `--memory-swap=${MEMORY_LIMIT}`,
    `--cpus=${CPU_LIMIT}`,
    "--pids-limit", "64",
    img
  ];

  execSync(dockerCmd.join(" "), { stdio: "ignore", timeout: 30000 });

  return {
    id: name,
    name,
    language,
    busy: false,
    execCount: 0,
  };
}

function isAlive(worker: Worker): boolean {
  try {
    const out = execSync(`docker inspect -f "{{.State.Running}}" ${worker.name}`, {
      timeout: 5000,
      stdio: ["pipe", "pipe", "pipe"],
    });
    return out.toString().trim() === "true";
  } catch {
    return false;
  }
}

function killSafe(worker: Worker): void {
  try { execSync(`docker rm -f ${worker.name}`, { stdio: "ignore", timeout: 10000 }); } catch { /* noop */ }
}
