import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { draftDoubtAnswer, checkSecurity } from "../ai/reviewers.js";

const prisma = new PrismaClient();
const router = express.Router();

// Student posts a new doubt
router.post("/", async (req: Request, res: Response) => {
    try {
        const { studentId, content } = req.body;
        if (!studentId || !content) {
            res.status(400).json({ error: "Missing studentId or content" });
            return;
        }

        // 1. Security Check against Prompt Injection
        const isSafe = await checkSecurity(content, studentId);
        if (!isSafe) {
            res.status(403).json({ error: "Query rejected due to security policy violation." });
            return;
        }

        // Ensure dummy student exists for demo (match executor.ts dummy user)
        const user = await prisma.user.upsert({
            where: { email: 'student@example.com' },
            update: {},
            create: {
                email: 'student@example.com',
                name: 'Demo Student'
            }
        });

        // 2. Save the doubt
        const doubt = await prisma.doubt.create({
            data: { studentId: user.id, content }
        });

        // 3. Draft AI answer asynchronously (so student doesn't have to wait)
        draftDoubtAnswer(content, user.id).then(async (draft) => {
            await prisma.doubtResponse.create({
                data: {
                    doubtId: doubt.id,
                    author: "AI",
                    content: draft,
                    status: "DRAFT"
                }
            });
        }).catch(err => console.error("Failed to draft answer", err));

        res.status(201).json({ message: "Doubt posted. AI is drafting a response for teacher review.", doubt });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Student/Teacher views all doubts with approved responses
router.get("/", async (req: Request, res: Response) => {
    try {
        const doubts = await prisma.doubt.findMany({
            include: {
                responses: {
                    where: { status: { in: ["APPROVED", "DRAFT"] } }
                },
                student: {
                    select: { name: true, email: true }
                }
            },
            orderBy: { createdAt: "desc" }
        });
        res.json(doubts);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// Teacher views pending drafts
router.get("/pending", async (req: Request, res: Response) => {
    try {
        const pending = await prisma.doubtResponse.findMany({
            where: { status: "DRAFT" },
            include: { 
                doubt: {
                    include: {
                        student: { select: { name: true, email: true } }
                    }
                } 
            },
            orderBy: { createdAt: "desc" }
        });
        res.json(pending);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// Teacher approves a draft
router.post("/:responseId/approve", async (req: Request, res: Response) => {
    try {
        const responseId = req.params.responseId as string;
        const response = await prisma.doubtResponse.update({
            where: { id: responseId },
            data: { status: "APPROVED" }
        });
        res.json(response);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// Teacher rejects a draft
router.post("/:responseId/reject", async (req: Request, res: Response) => {
    try {
        const responseId = req.params.responseId as string;
        const response = await prisma.doubtResponse.update({
            where: { id: responseId },
            data: { status: "REJECTED" }
        });
        res.json(response);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// Teacher edits a draft before approving
router.put("/:responseId/edit", async (req: Request, res: Response): Promise<void> => {
    try {
        const responseId = req.params.responseId as string;
        const { content } = req.body;
        
        if (!content) {
            res.status(400).json({ error: "Missing content to edit" });
            return;
        }

        const response = await prisma.doubtResponse.update({
            where: { id: responseId },
            data: { content: content, status: "APPROVED" } // Auto-approving upon edit
        });
        res.json(response);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// Delete a doubt
router.delete("/:id", async (req: Request, res: Response) => {
    try {
        const doubtId = req.params.id as string;
        // Delete responses first due to foreign key constraint
        await prisma.doubtResponse.deleteMany({ where: { doubtId } });
        await prisma.doubt.delete({ where: { id: doubtId } });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
