import { Queue, Worker } from "bullmq";
import Redis from "ioredis";
import { executeCode } from "../judge/executor.js";

const redisConnection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
    maxRetriesPerRequest: null, // Required by bullmq
});

// Create the Queue
export const executionQueue = new Queue("code-execution", {
    connection: redisConnection
});

// Create the Worker that processes jobs
export const executionWorker = new Worker("code-execution", async (job) => {
    const { language, code, input } = job.data;
    console.log(`[Job ${job.id}] Executing ${language} code...`);
    
    // Run the actual sandbox execution
    const result = await executeCode(language, code, input || "");
    
    return result;
}, {
    connection: redisConnection,
    concurrency: 5 // Process up to 5 executions concurrently
});

executionWorker.on("completed", (job) => {
    console.log(`[Job ${job.id}] Completed successfully!`);
});

executionWorker.on("failed", (job, err) => {
    console.log(`[Job ${job?.id}] Failed with error:`, err);
});
