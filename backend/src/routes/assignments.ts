import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = express.Router();

// Get all assignments
router.get("/", async (req: Request, res: Response) => {
    try {
        const assignments = await prisma.assignment.findMany({
            include: { testCases: true }
        });
        res.json(assignments);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

import { putTestCase } from "../services/cloudflare-kv.js";

// Create a new assignment (Teacher only)
router.post("/", async (req: Request, res: Response) => {
    try {
        const { title, description, testCases } = req.body;
        const assignment = await prisma.assignment.create({
            data: {
                title,
                description,
                testCases: {
                    create: testCases.map((tc: any) => ({
                        input: "STORED_IN_KV",
                        expectedOut: "STORED_IN_KV"
                    }))
                }
            },
            include: { testCases: true }
        });

        // Push actual payloads to Cloudflare KV
        for (let i = 0; i < assignment.testCases.length; i++) {
            const tc = assignment.testCases[i];
            const originalTc = testCases[i];
            await putTestCase(assignment.id, tc.id, {
                input: originalTc.input,
                expectedOut: originalTc.expectedOut
            });
        }

        res.status(201).json(assignment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
