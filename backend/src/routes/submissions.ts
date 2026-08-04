import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = express.Router();

// Get submissions for a student
router.get("/student/:studentId", async (req: Request, res: Response) => {
    try {
        const { studentId } = req.params;
        const submissions = await prisma.submission.findMany({
            where: { studentId },
            include: { assignment: true },
            orderBy: { createdAt: "desc" }
        });
        res.json(submissions);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// Get all submissions (Teacher only)
router.get("/", async (req: Request, res: Response) => {
    try {
        const submissions = await prisma.submission.findMany({
            include: { 
                student: { select: { name: true, email: true } },
                assignment: { select: { title: true } }
            },
            orderBy: { createdAt: "desc" }
        });
        res.json(submissions);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
