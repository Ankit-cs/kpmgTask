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

// Get a specific assignment by ID
router.get("/:id", async (req: Request, res: Response) => {
    try {
        const assignment = await prisma.assignment.findUnique({
            where: { id: req.params.id as string },
            include: { testCases: true } // Need testCases to show how many there are, but maybe not expectedOut? The UI can hide it.
        });
        if (!assignment) {
            res.status(404).json({ error: "Assignment not found" });
            return;
        }
        res.json(assignment);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

import { putTestCase } from "../services/cloudflare-kv.js";

// Create a new assignment (Teacher only)
router.post("/", async (req: Request, res: Response) => {
    try {
        const { title, description, constraints, testCases } = req.body;
        const assignment = await prisma.assignment.create({
            data: {
                title,
                description,
                constraints,
                testCases: {
                    create: testCases.map((tc: any) => ({
                        input: tc.input,
                        expectedOut: tc.expectedOut
                    }))
                }
            },
            include: { testCases: true }
        });

        // Also push to KV for compatibility with executor (if it uses KV)
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
// Update an assignment (Teacher only)
router.put("/:id", async (req: Request, res: Response) => {
    try {
        const { title, description, constraints, testCases } = req.body;
        const assignmentId = req.params.id as string;

        // Delete existing test cases
        await prisma.testCase.deleteMany({
            where: { assignmentId }
        });

        // Update assignment and recreate test cases
        const assignment = await prisma.assignment.update({
            where: { id: assignmentId },
            data: {
                title,
                description,
                constraints,
                testCases: {
                    create: testCases.map((tc: any) => ({
                        input: tc.input,
                        expectedOut: tc.expectedOut
                    }))
                }
            },
            include: { testCases: true }
        });

        // Also push to KV
        const updatedAssignment: any = assignment;
        for (let i = 0; i < updatedAssignment.testCases.length; i++) {
            const tc = updatedAssignment.testCases[i];
            const originalTc = testCases[i];
            await putTestCase(assignment.id, tc.id, {
                input: originalTc.input,
                expectedOut: originalTc.expectedOut
            });
        }

        res.json(assignment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});
export default router;
