// src/routes/openai.ts
import { Router, Request, Response } from "express";
import openai from "../lib/openai";

const openaiRoutes = Router();

/**
 * POST /openai/draft-brief
 * Body: { name?: string; idea: string; teamSize?: string; timeframe?: string }
 *
 * Používa sa v modálnom okne pri kliknutí na "Generate draft with AI".
 * Vráti text briefu, ktorý budeš v UI upravovať.
 */
openaiRoutes.post(
  "/draft-brief",
  async (req: Request, res: Response): Promise<void> => {
    const { name, idea, teamSize, timeframe } = req.body as {
      name?: string;
      idea?: string;
      teamSize?: string;
      timeframe?: string;
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

Use markdown. Maximum 250–300 words.

Base information:
- Name: ${name || "N/A"}
- Idea: ${idea}
- Team size: ${teamSize || "N/A"}
- Timeframe: ${timeframe || "N/A"}
        `,
      });

      const brief = response.output_text ?? "";

      res.status(200).json({ brief });
    } catch (err: any) {
      console.error("draft-brief error:", err);

      if (err?.status) {
        res
          .status(err.status)
          .json({ error: "OpenAI API error", details: err.error ?? err.message });
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
 * Body: { name: string; brief: string; teamSize?: string; timeframe?: string }
 *
 * Použije sa pri tlačidle "Create project from this brief".
 * Z finálneho briefu vygeneruje struktúrovaný plán (phases + tasks).
 * Zatiaľ ho len vrátime v JSON-e – neskôr ho môžeš uložiť do DB.
 */
openaiRoutes.post(
  "/plan-from-brief",
  async (req: Request, res: Response): Promise<void> => {
    const { name, brief, teamSize, timeframe } = req.body as {
      name?: string;
      brief?: string;
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
      const response = await openai.responses.create({
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
          .json({ error: "OpenAI API error", details: err.error ?? err.message });
        return;
      }

      res
        .status(500)
        .json({ error: "Failed to generate plan", details: err?.message });
    }
  }
);

export default openaiRoutes;
