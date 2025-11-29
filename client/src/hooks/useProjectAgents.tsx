// src/hooks/useProjectAgents.ts
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ProjectPlan } from "./useOpenAI";
import type { ProjectDTO } from "./useCreateProjectWithAgents";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000",
});

type ReplanResponse = {
  plan: ProjectPlan;
};

type RisksResponse = {
  risks: string;
};

type SpecResponse = {
  spec: string;
};

type DocTexResponse = {
  tex: string;
};

type ApplyPlanResponse = {
  project: ProjectDTO;
  // môžeš si tu neskôr nechávať aj planMeta ak chceš
  planMeta?: ProjectPlan;
};

export function useProjectAgents(projectId: number | string | undefined) {
  const queryClient = useQueryClient();

  const numericId =
    typeof projectId === "string" ? Number(projectId) : projectId;

  // REPLAN (AI only, bez zápisu do DB)
  const replanMutation = useMutation<ReplanResponse, Error, void>({
    mutationFn: async () => {
      if (!numericId || Number.isNaN(numericId)) {
        throw new Error("Invalid project id");
      }
      const { data } = await api.post<ReplanResponse>("/openai/project-replan", {
        projectId: numericId,
      });
      return data;
    },
  });

  // RISK ANALYSIS
  const risksMutation = useMutation<RisksResponse, Error, void>({
    mutationFn: async () => {
      if (!numericId || Number.isNaN(numericId)) {
        throw new Error("Invalid project id");
      }
      const { data } = await api.post<RisksResponse>("/openai/project-risks", {
        projectId: numericId,
      });
      return data;
    },
  });

  // TECH SPEC
  const specMutation = useMutation<SpecResponse, Error, void>({
    mutationFn: async () => {
      if (!numericId || Number.isNaN(numericId)) {
        throw new Error("Invalid project id");
      }
      const { data } = await api.post<SpecResponse>("/openai/project-spec", {
        projectId: numericId,
      });
      return data;
    },
  });

  // APPLY PLAN → prepíše phases + tasks v DB podľa AI plánu
  const applyPlanMutation = useMutation<ApplyPlanResponse, Error, ProjectPlan>({
    mutationFn: async (plan) => {
      if (!numericId || Number.isNaN(numericId)) {
        throw new Error("Invalid project id");
      }
      const { data } = await api.post<ApplyPlanResponse>(
        `/projects/${numericId}/apply-plan`,
        { plan }
      );
      return data;
    },
    onSuccess: () => {
      if (numericId) {
        queryClient.invalidateQueries({
          queryKey: ["project", String(numericId)],
        });
      }
    },
  });

  // DOC AGENT – generuje LaTeX dokumentáciu
  const docTexMutation = useMutation<DocTexResponse, Error, void>({
    mutationFn: async () => {
      if (!numericId || Number.isNaN(numericId)) {
        throw new Error("Invalid project id");
      }
      const { data } = await api.post<DocTexResponse>(
        "/openai/project-doc-tex",
        { projectId: numericId }
      );
      return data;
    },
  });

  return {
    // replan
    replanProject: replanMutation.mutateAsync,
    replannedPlan: replanMutation.data?.plan,
    isReplanning: replanMutation.isPending,
    replanError: replanMutation.error,

    // risks
    fetchRisks: risksMutation.mutateAsync,
    risks: risksMutation.data?.risks ?? "",
    isFetchingRisks: risksMutation.isPending,
    risksError: risksMutation.error,

    // spec
    generateSpec: specMutation.mutateAsync,
    spec: specMutation.data?.spec ?? "",
    isGeneratingSpec: specMutation.isPending,
    specError: specMutation.error,

    // apply AI plan → DB
    applyPlan: applyPlanMutation.mutateAsync,
    isApplyingPlan: applyPlanMutation.isPending,
    applyPlanError: applyPlanMutation.error,

    // documentation (.tex)
    generateDocTex: docTexMutation.mutateAsync,
    docTex: docTexMutation.data?.tex ?? "",
    isGeneratingDocTex: docTexMutation.isPending,
    docTexError: docTexMutation.error,
  };
}
