import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import { initPool } from "./src/judge/workerPool.js";
import { executeCode } from "./src/judge/executor.js";
import doubtsRouter from "./src/routes/doubts.js";
import assignmentsRouter from "./src/routes/assignments.js";
import submissionsRouter from "./src/routes/submissions.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/doubts", doubtsRouter);
app.use("/api/assignments", assignmentsRouter);
app.use("/api/submissions", submissionsRouter);

app.get("/", (req: Request, res: Response) => {
    res.send("Hello world")
});

import { executionQueue } from "./src/queue/executionQueue.js";

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

        // Add job to the queue
        const job = await executionQueue.add("execute", { language, code, input });
        
        // Return 202 Accepted with Job ID
        res.status(202).json({ jobId: job.id, status: "queued" });
    } catch (error: any) {
        console.error("Queue error:", error);
        res.status(500).json({ error: "Internal server error queuing job" });
    }
});

// Polling endpoint for frontend to check job status
app.get("/api/execute/:jobId", async (req: Request, res: Response): Promise<void> => {
    try {
        const jobId = req.params.jobId as string;
        const job = await executionQueue.getJob(jobId);
        
        if (!job) {
            res.status(404).json({ error: "Job not found" });
            return;
        }

        const state = await job.getState();
        if (state === "completed") {
            res.json({ status: "completed", result: job.returnvalue });
        } else if (state === "failed") {
            res.json({ status: "failed", error: job.failedReason });
        } else {
            res.json({ status: state }); // "waiting", "active", etc.
        }
    } catch (error) {
        res.status(500).json({ error: "Error fetching job status" });
    }
});

const PORT = 3001;
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    // Initialize the docker worker pool when server starts
    try {
        await initPool();
    } catch (error) {
        console.error("Failed to initialize worker pool:", error);
    }
});
// Server initialized with dynamic docker detection




