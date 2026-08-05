import * as fs from 'fs';
import * as path from 'path';
import { execSync, execFileSync, exec } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import * as os from 'os';
import * as pool from './workerPool.js';
import { PrismaClient } from '@prisma/client';
import { generateCodeFeedback, generateTestCase } from '../ai/reviewers.js';

const prisma = new PrismaClient();

const TEMP_DIR = path.join(os.tmpdir(), "vantage-judge");

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/** Time limit in milliseconds */
const TIME_LIMIT = 5000;
/** Compilation timeout */
const COMPILE_TIMEOUT = 30000;
/** Memory limit for containers */
const MEMORY_LIMIT_MB = 256;

export class CompilationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CompilationError";
  }
}

export class TimeLimitExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TimeLimitExceededError";
  }
}

export class RuntimeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RuntimeError";
  }
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  time: number;
  exitCode: number;
  compilationError?: boolean;
  tle?: boolean;
}

export interface TestCase {
  input: string;
  expected: string;
}

export interface TestCaseResult {
  testCase: number;
  passed: boolean;
  input: string;
  expected: string;
  actual: string;
  time: number;
}

export interface BatchExecutionResult {
  status: "Accepted" | "Wrong Answer" | "Compilation Error" | "Time Limit Exceeded" | "Runtime Error";
  error?: string;
  results: TestCaseResult[];
  totalPassed: number;
  totalTests: number;
  time: number;
}

// ─────────────────────────────────────────────────
// EXECUTION MODE DETECTION
// ─────────────────────────────────────────────────

let cachedMode: 'docker' | 'host' | null = null;
export function detectMode(): 'docker' | 'host' {
  if (cachedMode) return cachedMode;
  if (process.env.MODE === 'docker' || process.env.MODE === 'host') {
    cachedMode = process.env.MODE as 'docker' | 'host';
    return cachedMode;
  }

  try {
    execSync("docker info", { stdio: "ignore", timeout: 5000 });
    cachedMode = "docker";
  } catch {
    cachedMode = "host";
  }
  return cachedMode;
}

function cleanup(sessionDir: string) {
  try {
    if (fs.existsSync(sessionDir)) {
      fs.rmSync(sessionDir, { recursive: true, force: true });
    }
  } catch {
    // best-effort
  }
}

function getJavaFilename(code: string): string {
  const match = code.match(/(?:public\s+)?class\s+(\w+)/);
  return (match ? match[1] : "Solution") + ".java";
}

// ─────────────────────────────────────────────────
// DOCKER EXECUTION  (Production - warm worker pool)
// ─────────────────────────────────────────────────

async function executeInDockerPool(language: pool.Language, code: string, input: string): Promise<ExecutionResult> {
  const worker = await pool.acquire(language);
  try {
    let filename = "solution.cpp";
    if (language === "java") filename = getJavaFilename(code);
    else if (language === "c") filename = "solution.c";
    else if (language === "go") filename = "main.go";
    else if (language === "nodejs") filename = "index.js";
    else if (language === "python") filename = "main.py";
    
    await pool.writeToWorker(worker, filename, code);
    await pool.writeToWorker(worker, "input.txt", input);

    const compileResult = await compileInWorker(worker, language, filename);
    if (!compileResult.success) {
      return {
        stdout: "",
        stderr: `Compilation Error:\n${compileResult.error}`,
        time: 0,
        exitCode: 1,
        compilationError: true,
      };
    }

    return await runInWorker(worker, language, filename);
  } finally {
    pool.release(worker);
  }
}

async function compileInWorker(worker: pool.Worker, language: pool.Language, filename: string): Promise<{ success: boolean, error?: string }> {
  let cmd;
  if (language === "cpp") {
    cmd = `g++ -std=c++17 -O2 -o /workspace/solution /workspace/${filename} 2>&1`;
  } else if (language === "c") {
    cmd = `gcc -O2 -o /workspace/solution /workspace/${filename} 2>&1`;
  } else if (language === "go") {
    cmd = `cd /workspace && go build -o solution ${filename} 2>&1`;
  } else if (language === "java") {
    cmd = `javac /workspace/${filename} 2>&1`;
  } else {
    // nodejs and python don't need compilation
    return { success: true };
  }

  const result = await pool.execInWorker(worker, cmd, { timeout: COMPILE_TIMEOUT });

  if (result.exitCode !== 0) {
    return { success: false, error: result.stdout + result.stderr };
  }
  return { success: true };
}

async function runInWorker(worker: pool.Worker, language: pool.Language, filename: string): Promise<ExecutionResult> {
  let cmd = "";
  if (language === "cpp" || language === "c" || language === "go") {
    cmd = `/workspace/solution < /workspace/input.txt`;
  } else if (language === "java") {
    const className = filename.replace(".java", "");
    cmd = `java -Xmx${MEMORY_LIMIT_MB}m -cp /workspace ${className} < /workspace/input.txt`;
  } else if (language === "nodejs") {
    cmd = `node /workspace/${filename} < /workspace/input.txt`;
  } else if (language === "python") {
    cmd = `python3 /workspace/${filename} < /workspace/input.txt`;
  }

  const start = Date.now();
  const result = await pool.execInWorker(worker, cmd, { timeout: TIME_LIMIT });
  const time = Date.now() - start;

  if (result.killed) {
    return { stdout: "", stderr: "Time Limit Exceeded", time, exitCode: -1, tle: true };
  }

  if (result.exitCode !== 0) {
    return {
      stdout: result.stdout,
      stderr: `Runtime Error:\n${result.stderr || "Non-zero exit code"}`,
      time,
      exitCode: result.exitCode,
    };
  }

  return { stdout: result.stdout, stderr: "", time, exitCode: 0 };
}

function execHostAsync(cmd: string, options: any): Promise<{stdout: string, stderr: string, error: any}> {
  return new Promise((resolve) => {
    const child = exec(cmd, options, (error: any, stdout: string | Buffer, stderr: string | Buffer) => {
      resolve({
        stdout: stdout?.toString() || "",
        stderr: stderr?.toString() || "",
        error,
      });
    });
    if (options.input !== undefined && child.stdin) {
      child.stdin.write(options.input);
      child.stdin.end();
    }
  });
}

async function executeOnHost(language: pool.Language, code: string, input: string): Promise<ExecutionResult> {
  const sessionId = uuidv4();
  const sessionDir = path.join(TEMP_DIR, sessionId);

  try {
    fs.mkdirSync(sessionDir, { recursive: true });

    let filename = "solution.cpp";
    const exeName = process.platform === "win32" ? "solution.exe" : "solution";

    if (language === "java") {
      filename = getJavaFilename(code);
    } else if (language === "c") {
      filename = "solution.c";
    } else if (language === "go") {
      filename = "main.go";
    } else if (language === "nodejs") {
      filename = "index.js";
    } else if (language === "python") {
      filename = "main.py";
    }

    const filePath = path.join(sessionDir, filename);
    const inputPath = path.join(sessionDir, "input.txt");
    const exePath = path.join(sessionDir, exeName);

    fs.writeFileSync(filePath, code, "utf-8");
    fs.writeFileSync(inputPath, input || "", "utf-8");

    // Compilation step
    let compileCmd = "";
    if (language === "cpp") {
      compileCmd = `g++ -std=c++17 -O2 -o "${exePath}" "${filePath}"`;
    } else if (language === "c") {
      compileCmd = `gcc -O2 -o "${exePath}" "${filePath}"`;
    } else if (language === "go") {
      compileCmd = `go build -o "${exePath}" "${filePath}"`;
    } else if (language === "java") {
      compileCmd = `javac "${filePath}"`;
    }

    if (compileCmd) {
      const compileRes = await execHostAsync(compileCmd, { cwd: sessionDir, timeout: COMPILE_TIMEOUT });
      if (compileRes.error) {
        return {
          stdout: "",
          stderr: `Compilation Error:\n${compileRes.stderr || compileRes.stdout || compileRes.error.message || "Failed to compile on host"}`,
          time: 0,
          exitCode: 1,
          compilationError: true,
        };
      }
    }

    // Execution step
    let runCmd = "";
    if (language === "cpp" || language === "c" || language === "go") {
      runCmd = `"${exePath}"`;
    } else if (language === "java") {
      const className = filename.replace(".java", "");
      runCmd = `java -cp "${sessionDir}" ${className}`;
    } else if (language === "nodejs") {
      runCmd = `node "${filePath}"`;
    } else if (language === "python") {
      runCmd = `python "${filePath}"`;
    }

    const start = Date.now();
    const runRes = await execHostAsync(runCmd, {
      cwd: sessionDir,
      input: input || "",
      timeout: TIME_LIMIT,
      maxBuffer: 10 * 1024 * 1024,
    });
    const time = Date.now() - start;
    
    if (runRes.error) {
      if (runRes.error.killed || runRes.error.signal === "SIGTERM") {
        return { stdout: "", stderr: "Time Limit Exceeded", time, exitCode: -1, tle: true };
      }
      return {
        stdout: runRes.stdout,
        stderr: `Runtime Error:\n${runRes.stderr || runRes.error.message}`,
        time,
        exitCode: runRes.error.code || 1,
      };
    }
    return { stdout: runRes.stdout, stderr: "", time, exitCode: 0 };
  } finally {
    cleanup(sessionDir);
  }
}

import { getTestCase } from "../services/cloudflare-kv.js";

/**
 * Execute code against a single input string.
 */
export async function executeCode(language: pool.Language, code: string, input: string, assignmentId: string = 'demo-assignment'): Promise<ExecutionResult> {
  const mode = detectMode();
  let result: ExecutionResult;

  // Simulate fetching test case from KV if this is a real assignment
  if (assignmentId !== 'demo-assignment') {
    // Just a placeholder to show KV integration. In reality, we'd loop through all testcases.
    const testcases = await prisma.testCase.findMany({ where: { assignmentId } });
    if (testcases.length > 0) {
      const kvData = await getTestCase(assignmentId, testcases[0].id);
      if (kvData) {
        input = kvData.input; // override input with KV data
        console.log("Loaded test case from Cloudflare KV!");
      }
    }
  }

  if (mode === "docker") {
    result = await executeInDockerPool(language, code, input);
  } else {
    // Host Fallback execution
    result = await executeOnHost(language, code, input);
  }

  // Fire and forget AI feedback generation and DB save
  Promise.resolve().then(async () => {
    try {
      // 1. Generate AI Feedback
      const status = result.compilationError ? "Compilation Error" : (result.exitCode === 0 ? "Success" : "Runtime Error");
      const studentId = 'student@example.com';

      const aiFeedback = await generateCodeFeedback(language, code, status, studentId, assignmentId);

      // 2. Save immutable execution ledger to Database
      await prisma.submission.create({
          data: {
              // Hardcoding a dummy student/assignment for demo purposes since we don't have auth yet
              student: {
                  connectOrCreate: {
                      where: { email: studentId },
                      create: { email: studentId, name: 'Demo Student' }
                  }
              },
              assignment: {
                  connectOrCreate: {
                      where: { id: assignmentId },
                      create: { id: assignmentId, title: 'Demo', description: 'Demo Task' }
                  }
              },
              code,
              language,
              status,
              executionLedger: result as any,
              codeFeedback: aiFeedback
          }
      });

      // 3. Auto-generate Test Case if it failed logically (Runtime Error)
      if (status === "Runtime Error") {
          await generateTestCase(code, assignmentId);
      }
    } catch (err) {
        console.error("Failed to save execution ledger or get AI feedback:", err);
    }
  });

  return result;
}
