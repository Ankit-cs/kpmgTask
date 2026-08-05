import { Queue, Worker } from "bullmq";
import Redis from "ioredis";
import { executeCode } from "../judge/executor.js";

const RedisClass = (Redis as any).default || Redis;

const createRedisConnection = () => new RedisClass(process.env.REDIS_URL || "redis://localhost:6379", {
    maxRetriesPerRequest: null, // Required by bullmq
    family: 4, // Prevent IPv6 timeout issues with Upstash
    tls: process.env.REDIS_URL?.startsWith("rediss://") ? { rejectUnauthorized: false } : undefined
});

// Create the Queue
export const executionQueue = new Queue("code-execution", {
    connection: createRedisConnection()
});

// Create the Worker that processes jobs
export const executionWorker = new Worker("code-execution", async (job) => {
    const { language, code, input } = job.data;
    console.log(`[Job ${job.id}] Executing ${language} code...`);
    
    // Run the actual sandbox execution
    const result = await executeCode(language, code, input || "");
    
    return result;
}, {
    connection: createRedisConnection(),
    concurrency: 5, // Process up to 5 executions concurrently
    lockDuration: 60000, // 60 seconds lock to prevent job stall timeouts during AI feedback
    stalledInterval: 60000,
    autorun: false,
});

executionWorker.on("completed", (job) => {
    console.log(`[Job ${job.id}] Completed successfully!`);
});

executionWorker.on("failed", (job, err) => {
    console.log(`[Job ${job?.id}] Failed with error:`, err);
});
