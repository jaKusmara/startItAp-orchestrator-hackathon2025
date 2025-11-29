// src/routes/projects.ts
import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import openai from "../lib/openai";

const projectRoutes = Router();

/**
 * GET /projects
 * Vráti zoznam projektov vrátane phases + tasks.
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
 * Orchestrácia:
 * 1) vytvorí Project (vrátane devSkills)
 * 2) zavolá planning + architecture + techStack agenta
 * 3) uloží Phase + Task
 * 4) vráti celý projekt + planMeta (team, architecture, techStack, phases)
 */
projectRoutes.post(
  "/create-with-agents",
  async (req: Request, res: Response): Promise<void> => {
    const { name, brief, idea, teamSize, timeframe, devSkills } = req.body as {
      name?: string;
      brief?: string;
      idea?: string;
      teamSize?: string;
      timeframe?: string;
      devSkills?: string; // napr. "TypeScript, React, Node.js"
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
          idea: idea ?? brief,
          devSkills: devSkills || null,
        },
      });

      // Typy pre plán podľa /openai/plan-from-brief
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

      type PlanTeamRole = {
        role: string;
        level: "junior" | "mid" | "senior";
        primaryTech: string[];
      };

      type PlanTeam = {
        assumptions: string;
        roles: PlanTeamRole[];
      };

      type PlanArchitectureModule = {
        name: string;
        responsibility: string;
        notes: string;
      };

      type PlanArchitecture = {
        overview: string;
        style: string;
        modules: PlanArchitectureModule[];
        dataFlow: string;
      };

      type PlanTechStack = {
        frontend: string[];
        backend: string[];
        database: string[];
        infrastructure: string[];
        testingAndTooling: string[];
        rationale: string;
      };

      type Plan = {
        projectSummary: string;
        team: PlanTeam;
        architecture: PlanArchitecture;
        techStack: PlanTechStack;
        phases: PlanPhase[];
      };

      // 2) Planning + architecture + techStack agent
      const planningResponse = await openai.responses.create({
        model: "gpt-5.1",
        input: `
You are an AI project planner and software architect. The user has written and approved the following project brief:

---
${brief}
---

Team size: ${teamSize || "unknown"}
Timeframe: ${timeframe || "unknown"}
Developer skills (comma-separated, optional): ${
          devSkills || "unknown / not specified"
        }

Your goals:
1) Design an implementation plan (phases + tasks).
2) Propose a realistic software architecture.
3) Propose a concrete tech stack with NO marketing text:
   - Only plain technology names in arrays (e.g. "React", "Node.js", "PostgreSQL").
   - Explanations are allowed ONLY in dedicated summary fields.
4) Propose a default team composition with levels, which the user can later override.

Behavior for tech stack:
- If developer skills are provided, strongly prefer these languages/frameworks while still proposing a complete, end-to-end stack.
- If developer skills are NOT provided, infer an optimal stack purely from the problem and constraints:
  - Choose a minimal but complete combination of technologies that allows you to BUILD, TEST and DEPLOY the application.
  - Always cover at least: frontend (if applicable), backend/API, database/persistence, infrastructure/runtime (hosting, container, serverless or similar) and basic testing/tooling.
- Avoid over-engineering:
  - Small / hackathon-style projects -> simple monolith or serverless.
  - Only large, long-lived systems -> more complex architecture.

Return ONLY a valid JSON object with this EXACT shape:

{
  "projectSummary": string,
  "team": {
    "assumptions": string,
    "roles": [
      {
        "role": string,
        "level": "junior" | "mid" | "senior",
        "primaryTech": string[]
      }
    ]
  },
  "architecture": {
    "overview": string,
    "style": string,
    "modules": [
      {
        "name": string,
        "responsibility": string,
        "notes": string
      }
    ],
    "dataFlow": string
  },
  "techStack": {
    "frontend": string[],
    "backend": string[],
    "database": string[],
    "infrastructure": string[],
    "testingAndTooling": string[],
    "rationale": string
  },
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

STRICT rules for techStack:
- In "frontend", "backend", "database", "infrastructure", "testingAndTooling" use ONLY bare technology identifiers, no sentences, no extra words.
  Examples of VALID entries: "React", "Next.js", "Node.js", "Express", "PostgreSQL", "Redis", "Docker", "Jest", "Playwright".
  Examples of INVALID entries: "React (for UI)", "Node.js backend", "Primary database: PostgreSQL".
- Each of "overview", "dataFlow" and "rationale" must be at most 2 sentences: short and concrete.
- Never recommend more than 3 core technologies per layer (frontend/backend/database).
- Do NOT add any extra keys.
- Do NOT add comments or explanations.
- Do NOT wrap JSON in backticks.
- Keep all text concise but clear.
        `,
      });

      const rawPlan = planningResponse.output_text ?? "{}";

      let plan: Plan;
      try {
        plan = JSON.parse(rawPlan) as Plan;
      } catch (parseErr) {
        console.error(
          "Failed to parse JSON from OpenAI in /create-with-agents:",
          rawPlan
        );
        res.status(500).json({
          error: "Failed to parse JSON from OpenAI.",
          raw: rawPlan,
        });
        return;
      }

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

      // 4) vráť komplet projekt + planMeta (vrátane team / architecture / techStack)
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

projectRoutes.post(
  "/:id/apply-plan",
  async (req: Request, res: Response): Promise<void> => {
    const rawId = req.params.id;
    const id = Number(rawId);

    if (Number.isNaN(id)) {
      res.status(400).json({ error: "Project id must be a number." });
      return;
    }

    // typy plánu – stačí minimum, čo reálne používame
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

    type Plan = {
      projectSummary: string;
      // ostatné polia (team, architecture, techStack) si kľudne môžeš doplniť
      phases: PlanPhase[];
    };

    const { plan } = req.body as { plan?: Plan };

    if (!plan || !Array.isArray(plan.phases) || plan.phases.length === 0) {
      res
        .status(400)
        .json({ error: "Field 'plan.phases' must be a non-empty array." });
      return;
    }

    try {
      const existingProject = await prisma.project.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!existingProject) {
        res.status(404).json({ error: "Project not found." });
        return;
      }

      // prepíšeme phases + tasks v transakcii
      await prisma.$transaction(async (tx) => {
        // 1) delete tasks patriace k tomuto projektu
        await tx.task.deleteMany({
          where: {
            phase: {
              projectId: id,
            },
          },
        });

        // 2) delete phases projektu
        await tx.phase.deleteMany({
          where: { projectId: id },
        });

        // 3) vytvor nové phases + tasks podľa plánu
        const sortedPhases = [...plan.phases].sort((a, b) => a.order - b.order);

        for (const phase of sortedPhases) {
          const createdPhase = await tx.phase.create({
            data: {
              name: phase.name,
              order: phase.order,
              projectId: id,
            },
          });

          for (const task of phase.tasks ?? []) {
            await tx.task.create({
              data: {
                title: task.title,
                description: task.description,
                priority:
                  task.priority === "high"
                    ? 3
                    : task.priority === "medium"
                    ? 2
                    : 1,
                status: "todo", // nové AI úlohy začínajú ako TODO
                phaseId: createdPhase.id,
              },
            });
          }
        }
      });

      const updatedProject = await prisma.project.findUnique({
        where: { id },
        include: {
          phases: {
            orderBy: { order: "asc" },
            include: { tasks: true },
          },
        },
      });

      res.status(200).json({ project: updatedProject, planMeta: plan });
    } catch (err: any) {
      console.error(`POST /projects/${rawId}/apply-plan error:`, err);
      res.status(500).json({
        error: "Failed to apply AI plan to project",
        details: err?.message,
      });
    }
  }
);

export default projectRoutes;
