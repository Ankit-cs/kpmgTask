import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import { initPool } from "./src/judge/workerPool.js";
import { executeCode } from "./src/judge/executor.js";
import doubtsRouter from "./src/routes/doubts.js";
import assignmentsRouter from "./src/routes/assignments.js";
import submissionsRouter from "./src/routes/submissions.js";

const app = express();
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.LOCAL_FRONTEND_URL
].filter(Boolean) as string[];

app.use(cors({
  origin: allowedOrigins,
}));
app.use(express.json());

app.use("/api/doubts", doubtsRouter);
app.use("/api/assignments", assignmentsRouter);
app.use("/api/submissions", submissionsRouter);

app.get("/", (req: Request, res: Response) => {
    res.send("Hello world")
});

// Mock jobs for polling (Bypassing Redis for now)
const mockJobs = new Map<string, any>();

app.post("/api/execute", async (req: Request, res: Response): Promise<void> => {
    try {
        const { language, code, input } = req.body;
        if (!language || !code) {
            res.status(400).json({ error: "Missing language or code" });
            return;
        }

        if (language !== "cpp" && language !== "java" && language !== "python" && language !== "nodejs" && language !== "c" && language !== "go") {
            res.status(400).json({ error: "Language not supported yet" });
            return;
        }

        // Generate mock job ID
        const jobId = Math.random().toString(36).substring(7);
        mockJobs.set(jobId, { status: "waiting" });
        
        // Return 202 Accepted with Job ID
        res.status(202).json({ jobId, status: "queued" });
        
        // Run asynchronously
        executeCode(language, code, input).then(result => {
            mockJobs.set(jobId, { status: "completed", result });
            io.emit(`job_completed_${jobId}`, { result });
        }).catch(error => {
            mockJobs.set(jobId, { status: "failed", error: error.message });
            io.emit(`job_failed_${jobId}`, { error: error.message });
        });
    } catch (error: any) {
        console.error("Queue error:", error);
        res.status(500).json({ error: "Internal server error queuing job" });
    }
});

import { analyzeRuntimeError } from "./src/ai/reviewers.js";

app.post("/api/analyze-error", async (req: Request, res: Response): Promise<void> => {
    try {
        const { language, code, stderr } = req.body;
        if (!language || !code || !stderr) {
            res.status(400).json({ error: "Missing required fields" });
            return;
        }
        const analysis = await analyzeRuntimeError(language, code, stderr);
        res.json(analysis);
    } catch (error) {
        console.error("Analysis error:", error);
        res.status(500).json({ error: "Failed to analyze error" });
    }
});

// Polling endpoint for frontend to check job status
app.get("/api/execute/:jobId", async (req: Request, res: Response): Promise<void> => {
    try {
        const jobId = req.params.jobId as string;
        const job = mockJobs.get(jobId);
        
        if (!job) {
            res.status(404).json({ error: "Job not found" });
            return;
        }

        res.json(job);
    } catch (error) {
        res.status(500).json({ error: "Error fetching job status" });
    }
});

import http from 'http';
import { Server } from 'socket.io';

const PORT = process.env.PORT || 5000;
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    socket.on('execute_code', async (payload) => {
        try {
            const { language, code, input } = payload;
            const jobId = Math.random().toString(36).substring(7);
            
            socket.emit('job_queued', { jobId });
            
            executeCode(language, code, input).then(result => {
                io.emit(`job_completed_${jobId}`, { result });
            }).catch(error => {
                io.emit(`job_failed_${jobId}`, { error: error.message });
            });
        } catch (error) {
            socket.emit('execution_error', { error: 'Failed to queue job' });
        }
    });
});

httpServer.listen(PORT, async () => {
    console.log(`Server running on port ${PORT} (Redis Disabled)`);
    // Initialize the docker worker pool when server starts
    try {
        if (process.env.MODE !== "host") {
            const { initPool } = await import("./src/judge/workerPool.js");
            await initPool();
        }
        
        // Graceful shutdown
        const shutdown = async () => {
            console.log("\n🛑 Gracefully shutting down...");
            process.exit(0);
        };
        process.on("SIGTERM", shutdown);
        process.on("SIGINT", shutdown);
        process.on("SIGUSR2", shutdown); // nodemon restart signal

    } catch (e) {
        console.error("Failed to initialize worker pool:", e);
    }
});
