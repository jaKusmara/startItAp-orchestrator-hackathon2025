import axios from "axios";
import { useMutation } from "@tanstack/react-query";

// ---- typy, nech máš TS pohodlie ----

export type DraftBriefInput = {
  name?: string;
  idea: string;
  teamSize?: string;
  timeframe?: string;
  devSkills?: string; // NEW – skills tímu, optional
};

export type DraftBriefResponse = {
  brief: string;
};

export type PlanPriority = "low" | "medium" | "high";

export type PlanTask = {
  title: string;
  description: string;
  priority: PlanPriority;
  estimateHours: number;
};

export type PlanPhase = {
  name: string;
  order: number;
  goal: string;
  tasks: PlanTask[];
};

// --- architektúra & stack z agenta ---

export type ProjectArchitectureModule = {
  name: string;
  responsibility: string;
  notes?: string;
};

export type ProjectArchitecture = {
  overview: string;
  style: string; // napr. "modular monolith", "microservices"…
  modules: ProjectArchitectureModule[];
  dataFlow: string;
};

export type ProjectTechStack = {
  rationale: string;
  backend: string[];
  frontend: string[];
  database: string[];
  infrastructure: string[];
  testingAndTooling?: string[];
};

export type ProjectPlan = {
  projectSummary: string;
  architecture: ProjectArchitecture;
  techStack: ProjectTechStack;
  phases: PlanPhase[];
};

export type PlanFromBriefInput = {
  name: string;
  brief: string;
  teamSize?: string;
  timeframe?: string;
  devSkills?: string; // NEW – skills tímu, optional
};

export type PlanFromBriefResponse = {
  plan: ProjectPlan;
};

// ---- axios client ----

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000",
});

export function useOpenAI() {
  // draft-brief
  const draftBriefMutation = useMutation<
    DraftBriefResponse,
    Error,
    DraftBriefInput
  >({
    mutationFn: async (payload) => {
      const { data } = await api.post<DraftBriefResponse>(
        "/openai/draft-brief",
        payload
      );
      return data;
    },
  });

  // plan-from-brief
  const planFromBriefMutation = useMutation<
    PlanFromBriefResponse,
    Error,
    PlanFromBriefInput
  >({
    mutationFn: async (payload) => {
      const { data } = await api.post<PlanFromBriefResponse>(
        "/openai/plan-from-brief",
        payload
      );
      return data;
    },
  });

  return {
    // generate brief
    generateBrief: draftBriefMutation.mutateAsync,
    isGeneratingBrief: draftBriefMutation.isPending,
    generateBriefError: draftBriefMutation.error,

    // generate plan from final brief (vrátane architecture + techStack, ak to backend vráti)
    generatePlanFromBrief: planFromBriefMutation.mutateAsync,
    isGeneratingPlan: planFromBriefMutation.isPending,
    generatePlanError: planFromBriefMutation.error,
  };
}
