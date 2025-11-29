// src/routes/projects.ts
import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import openai from "../lib/openai";

const projectRoutes = Router();

/**
 * GET /projects
 * Vráti zoznam projektov vrátane phases + tasks.
 * Na dashboarde si z toho vieš vyrátať počty fáz a úloh.
 */
projectRoutes.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        phases: {
          orderBy: { order: "asc" },
          include: { tasks: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({ projects });
  } catch (err: any) {
    console.error("GET /projects error:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch projects", details: err?.message });
  }
});

/**
 * GET /projects/:id
 * Detail jedného projektu podľa ID.
 */
projectRoutes.get(
  "/:id",
  async (req: Request, res: Response): Promise<void> => {
    const rawId = req.params.id;
    const id = Number(rawId);

    if (Number.isNaN(id)) {
      res.status(400).json({ error: "Project id must be a number." });
      return;
    }

    try {
      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          phases: {
            orderBy: { order: "asc" },
            include: { tasks: true },
          },
        },
      });

      if (!project) {
        res.status(404).json({ error: "Project not found." });
        return;
      }

      res.status(200).json({ project });
    } catch (err: any) {
      console.error(`GET /projects/${rawId} error:`, err);
      res
        .status(500)
        .json({ error: "Failed to fetch project", details: err?.message });
    }
  }
);

/**
 * POST /projects/create-with-agents
 * Body: { name: string; brief: string; idea?: string; teamSize?: string; timeframe?: string }
 *
 * Orchestrácia:
 * 1) uloží Project
 * 2) zavolá "planning agenta" (ako /openai/plan-from-brief)
 * 3) uloží Phase + Task
 * 4) vráti celý projekt
 */
projectRoutes.post(
  "/create-with-agents",
  async (req: Request, res: Response): Promise<void> => {
    const { name, brief, idea, teamSize, timeframe } = req.body as {
      name?: string;
      brief?: string;
      idea?: string;
      teamSize?: string;
      timeframe?: string;
    };

    if (!name || !brief) {
      res
        .status(400)
        .json({ error: "Fields 'name' and 'brief' are required." });
      return;
    }

    try {
      // 1) Project agent – vytvor základný projekt
      const project = await prisma.project.create({
        data: {
          name,
          idea: idea ?? brief, // môžeš si neskôr pridať osobitný "brief" stĺpec
        },
      });

      // 2) Planning agent – prakticky to isté, čo máš v /openai/plan-from-brief
      const planningResponse = await openai.responses.create({
        model: "gpt-5.1",
        input: `
You are an AI project planner. The user has written and approved the following project brief:

---
${brief}
---

Team size: ${teamSize || "unknown"}
Timeframe: ${timeframe || "unknown"}

Based on this brief, create a structured implementation plan.

Return ONLY a valid JSON object with this exact shape:

{
  "projectSummary": string,
  "phases": [
    {
      "name": string,
      "order": number,
      "goal": string,
      "tasks": [
        {
          "title": string,
          "description": string,
          "priority": "low" | "medium" | "high",
          "estimateHours": number
        }
      ]
    }
  ]
}

Rules:
- Do NOT add any extra keys.
- Do NOT add comments or explanations.
- Do NOT wrap JSON in backticks.
- Keep text concise but clear.
        `,
      });

      const rawPlan = planningResponse.output_text ?? "{}";

      type PlanTask = {
        title: string;
        description: string;
        priority: "low" | "medium" | "high";
        estimateHours: number;
      };

      type PlanPhase = {
        name: string;
        order: number;
        goal: string;
        tasks: PlanTask[];
      };

      const plan = JSON.parse(rawPlan) as {
        projectSummary: string;
        phases: PlanPhase[];
      };

      // 3) Ulož phases + tasks do DB
      for (const phase of plan.phases ?? []) {
        const createdPhase = await prisma.phase.create({
          data: {
            name: phase.name,
            order: phase.order,
            projectId: project.id,
          },
        });

        for (const task of phase.tasks ?? []) {
          await prisma.task.create({
            data: {
              title: task.title,
              description: task.description,
              priority:
                task.priority === "high"
                  ? 3
                  : task.priority === "medium"
                  ? 2
                  : 1,
              phaseId: createdPhase.id,
            },
          });
        }
      }

      // 4) vráť komplet projekt
      const fullProject = await prisma.project.findUnique({
        where: { id: project.id },
        include: {
          phases: {
            orderBy: { order: "asc" },
            include: { tasks: true },
          },
        },
      });

      res.status(201).json({ project: fullProject, planMeta: plan });
    } catch (err: any) {
      console.error("create-with-agents error:", err);
      res.status(500).json({
        error: "Failed to create project with agents",
        details: err?.message,
      });
    }
  }
);

export default projectRoutes;
