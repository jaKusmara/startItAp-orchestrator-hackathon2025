import axios from "axios";
import { useMutation } from "@tanstack/react-query";

// ---- typy, nech máš TS pohodlie ----

export type DraftBriefInput = {
  name?: string;
  idea: string;
  teamSize?: string;
  timeframe?: string;
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

export type ProjectPlan = {
  projectSummary: string;
  phases: PlanPhase[];
};

export type PlanFromBriefInput = {
  name: string;
  brief: string;
  teamSize?: string;
  timeframe?: string;
};

export type PlanFromBriefResponse = {
  plan: ProjectPlan;
};

// ---- axios client ----
// môžeš si nastaviť VITE_API_URL vo .env, inak to padne na localhost:3000

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

    // generate plan from final brief
    generatePlanFromBrief: planFromBriefMutation.mutateAsync,
    isGeneratingPlan: planFromBriefMutation.isPending,
    generatePlanError: planFromBriefMutation.error,
  };
}
