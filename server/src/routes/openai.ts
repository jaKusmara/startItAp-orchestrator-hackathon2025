// src/routes/openai.ts
import { Router, Request, Response } from "express";
import openai from "../lib/openai";
import { prisma } from "../lib/prisma"; // ← PRIDANÉ

const openaiRoutes = Router();

/**
 * POST /openai/draft-brief
 * ...
 */
openaiRoutes.post(
  "/draft-brief",
  async (req: Request, res: Response): Promise<void> => {
    const { name, idea, teamSize, timeframe, devSkills } = req.body as {
      name?: string;
      idea?: string;
      teamSize?: string;
      timeframe?: string;
      devSkills?: string; // napr. "TypeScript, React, Node.js"
    };

    if (!idea || typeof idea !== "string") {
      res.status(400).json({ error: "Field 'idea' is required as string." });
      return;
    }

    try {
      const response = await openai.responses.create({
        model: "gpt-5.1",
        input: `
You are a product assistant. Draft a short, clear software project brief.

Include sections:
- Problem
- Proposed solution
- Target users
- Constraints (team size, timeframe)
- 3–5 high-level goals as bullet points
- Technical context:
  - If developer skills are provided, align the suggested stack with these skills.
  - If developer skills are NOT provided, briefly propose a pragmatic end-to-end stack (frontend, backend, database, hosting/runtime) that is sufficient to build and deploy an MVP for this problem.

Use markdown. Maximum 250–300 words.

Base information:
- Name: ${name || "N/A"}
- Idea: ${idea}
- Team size: ${teamSize || "N/A"}
- Timeframe: ${timeframe || "N/A"}
- Developer skills: ${devSkills || "not specified"}
        `,
      });

      const brief = response.output_text ?? "";

      res.status(200).json({ brief });
    } catch (err: any) {
      console.error("draft-brief error:", err);

      if (err?.status) {
        res
          .status(err.status)
          .json({
            error: "OpenAI API error",
            details: err.error ?? err.message,
          });
        return;
      }

      res
        .status(500)
        .json({ error: "Failed to generate brief", details: err?.message });
    }
  }
);

/**
 * POST /openai/plan-from-brief
 * ...
 */
openaiRoutes.post(
  "/plan-from-brief",
  async (req: Request, res: Response): Promise<void> => {
    const { name, brief, teamSize, timeframe, devSkills } = req.body as {
      name?: string;
      brief?: string;
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
      const response = await openai.responses.create({
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

      const raw = response.output_text ?? "{}";

      let plan;
      try {
        plan = JSON.parse(raw);
      } catch (parseErr) {
        console.error("Failed to parse JSON from OpenAI:", raw);
        res.status(500).json({
          error: "Failed to parse JSON from OpenAI.",
          raw,
        });
        return;
      }

      res.status(200).json({ plan });
    } catch (err: any) {
      console.error("plan-from-brief error:", err);

      if (err?.status) {
        res
          .status(err.status)
          .json({
            error: "OpenAI API error",
            details: err.error ?? err.message,
          });
        return;
      }

      res
        .status(500)
        .json({ error: "Failed to generate plan", details: err?.message });
    }
  }
);

/**
 * POST /openai/project-replan
 * Body: { projectId: number }
 * Zoberie aktuálny stav projektu (idea + phases + tasks) a vygeneruje nový plán
 * v rovnakom tvare ako plan-from-brief. DB zatiaľ NEMENÍ.
 */
openaiRoutes.post(
  "/project-replan",
  async (req: Request, res: Response): Promise<void> => {
    const { projectId } = req.body as { projectId?: number | string };
    const id = Number(projectId);

    if (!projectId || Number.isNaN(id)) {
      res
        .status(400)
        .json({ error: "Field 'projectId' is required as number." });
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

      const phasesSummary = project.phases.map((phase) => ({
        name: phase.name,
        order: phase.order,
        tasks: phase.tasks.map((task) => ({
          title: task.title,
          description: task.description ?? "",
          status: task.status,
          priority: task.priority,
        })),
      }));

      const response = await openai.responses.create({
        model: "gpt-5.1",
        input: `
You are an AI project planner and software architect.

You get the CURRENT state of a software project:

Meta:
- Name: ${project.name}
- Idea: ${project.idea || "N/A"}
- Developer skills: ${project.devSkills || "not specified"}

Current phases & tasks (JSON):
${JSON.stringify(phasesSummary, null, 2)}

Your job:
- Refine / re-plan the project using the SAME JSON SHAPE as the "plan-from-brief" endpoint.
- You can keep, merge or split phases and tasks, but stay pragmatic.
- Set realistic estimateHours values (rough order of magnitude is enough).

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

Rules:
- Do NOT modify keys or shape.
- Do NOT wrap JSON in backticks.
- Keep text concise but clear.
        `,
      });

      const raw = response.output_text ?? "{}";

      let plan;
      try {
        plan = JSON.parse(raw);
      } catch (parseErr) {
        console.error(
          "Failed to parse JSON from OpenAI (project-replan):",
          raw
        );
        res.status(500).json({
          error: "Failed to parse JSON from OpenAI.",
          raw,
        });
        return;
      }

      res.status(200).json({ plan });
    } catch (err: any) {
      console.error("project-replan error:", err);
      res.status(500).json({
        error: "Failed to replan project",
        details: err?.message,
      });
    }
  }
);

/**
 * POST /openai/project-risks
 * Body: { projectId: number }
 * Vráti markdown s rizikami + mitigáciou.
 */
openaiRoutes.post(
  "/project-risks",
  async (req: Request, res: Response): Promise<void> => {
    const { projectId } = req.body as { projectId?: number | string };
    const id = Number(projectId);

    if (!projectId || Number.isNaN(id)) {
      res
        .status(400)
        .json({ error: "Field 'projectId' is required as number." });
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

      const phasesSummary = project.phases.map((phase) => ({
        name: phase.name,
        order: phase.order,
        tasks: phase.tasks.map((task) => ({
          title: task.title,
          status: task.status,
          priority: task.priority,
        })),
      }));

      const response = await openai.responses.create({
        model: "gpt-5.1",
        input: `
You are a senior engineering manager. Analyse the following software project and identify the main risks.

Project:
- Name: ${project.name}
- Idea: ${project.idea || "N/A"}
- Developer skills: ${project.devSkills || "not specified"}

Current phases & tasks (JSON):
${JSON.stringify(phasesSummary, null, 2)}

Return ONLY markdown with these sections:

## Top risks
- ...

## Impact & likelihood
- ...

## Mitigation next steps
- ...

Max 400 words total.
Do NOT add any intro or outro text beyond these sections.
        `,
      });

      const risks = response.output_text ?? "";

      res.status(200).json({ risks });
    } catch (err: any) {
      console.error("project-risks error:", err);
      res.status(500).json({
        error: "Failed to analyse project risks",
        details: err?.message,
      });
    }
  }
);

/**
 * POST /openai/project-spec
 * Body: { projectId: number }
 * Vráti krátku technickú špecifikáciu v markdown.
 */
openaiRoutes.post(
  "/project-spec",
  async (req: Request, res: Response): Promise<void> => {
    const { projectId } = req.body as { projectId?: number | string };
    const id = Number(projectId);

    if (!projectId || Number.isNaN(id)) {
      res
        .status(400)
        .json({ error: "Field 'projectId' is required as number." });
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

      const phasesSummary = project.phases.map((phase) => ({
        name: phase.name,
        order: phase.order,
        tasks: phase.tasks.map((task) => ({
          title: task.title,
          status: task.status,
          priority: task.priority,
        })),
      }));

      const response = await openai.responses.create({
        model: "gpt-5.1",
        input: `
You are a senior software engineer. Create a concise technical specification for the following project.

Project:
- Name: ${project.name}
- Idea: ${project.idea || "N/A"}
- Developer skills: ${project.devSkills || "not specified"}

Current phases & tasks (JSON):
${JSON.stringify(phasesSummary, null, 2)}

Return ONLY markdown with these sections:

## Architecture
- short description of the recommended architecture (1–2 paragraphs)

## API surface
- list main endpoints or modules (bullets)

## Data model
- describe main entities and relationships (bullets or short list)

## Non-functional notes
- performance, security, observability or other relevant constraints (bullets)

Max 500 words.
Do NOT add any intro or outro text beyond these sections.
        `,
      });

      const spec = response.output_text ?? "";

      res.status(200).json({ spec });
    } catch (err: any) {
      console.error("project-spec error:", err);
      res.status(500).json({
        error: "Failed to generate tech spec",
        details: err?.message,
      });
    }
  }
);

openaiRoutes.post(
  "/project-doc-tex",
  async (req: Request, res: Response): Promise<void> => {
    const { projectId } = req.body as { projectId?: number | string };
    const id = Number(projectId);

    if (!projectId || Number.isNaN(id)) {
      res
        .status(400)
        .json({ error: "Field 'projectId' is required as number." });
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

      const phasesSummary = project.phases.map((phase) => ({
        name: phase.name,
        order: phase.order,
        tasks: phase.tasks.map((task) => ({
          title: task.title,
          status: task.status,
          priority: task.priority,
        })),
      }));

      const response = await openai.responses.create({
        model: "gpt-5.1",
        input: `
You are a senior software engineer. Write a concise project documentation as LaTeX source code.

Project:
- Name: ${project.name}
- Idea: ${project.idea || "N/A"}
- Developer skills: ${project.devSkills || "not specified"}

Current phases & tasks (JSON):
${JSON.stringify(phasesSummary, null, 2)}

Return ONLY valid LaTeX source code for a single document.
Requirements:
- Use \\documentclass{article}.
- Use UTF-8 encoding in the preamble.
- Provide clear sections:
  - Introduction
  - Architecture
  - API surface
  - Data model
  - Risks & mitigation
  - Roadmap
- Do NOT include any explanations, comments or markdown.
- Do NOT wrap the LaTeX code in backticks.
        `,
      });

      const tex = response.output_text ?? "";

      res.status(200).json({ tex });
    } catch (err: any) {
      console.error("project-doc-tex error:", err);
      res.status(500).json({
        error: "Failed to generate LaTeX documentation",
        details: err?.message,
      });
    }
  }
);

export default openaiRoutes;
