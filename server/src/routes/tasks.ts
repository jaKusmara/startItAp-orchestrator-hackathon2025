// src/routes/tasks.ts
import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";

const taskRoutes = Router();

/**
 * PATCH /tasks/:id
 * Body: { title?, description?, status?, priority?, phaseId? }
 */
taskRoutes.patch(
  "/:id",
  async (req: Request, res: Response): Promise<void> => {
    const rawId = req.params.id;
    const id = Number(rawId);

    if (Number.isNaN(id)) {
      res.status(400).json({ error: "Task id must be a number." });
      return;
    }

    const { title, description, status, priority, phaseId } = req.body as {
      title?: string;
      description?: string | null;
      status?: string;
      priority?: number;
      phaseId?: number;
    };

    // nič neposielam → chyba
    if (
      title === undefined &&
      description === undefined &&
      status === undefined &&
      priority === undefined &&
      phaseId === undefined
    ) {
      res.status(400).json({ error: "No fields to update." });
      return;
    }

    try {
      const existing = await prisma.task.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ error: "Task not found." });
        return;
      }

      // jednoduchý guard na status
      const allowedStatuses = ["todo", "in_progress", "done"];
      if (status && !allowedStatuses.includes(status)) {
        res.status(400).json({ error: "Invalid status value." });
        return;
      }

      const updated = await prisma.task.update({
        where: { id },
        data: {
          title,
          description,
          status,
          priority,
          phaseId,
        },
      });

      res.status(200).json({ task: updated });
    } catch (err: any) {
      console.error(`PATCH /tasks/${rawId} error:`, err);
      res.status(500).json({
        error: "Failed to update task",
        details: err?.message,
      });
    }
  }
);

export default taskRoutes;
