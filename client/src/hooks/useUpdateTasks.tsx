// src/hooks/useUpdateTask.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import type { ProjectDTO } from "./useCreateProjectWithAgents";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000",
});

export type UpdateTaskPayload = {
  id: number;
  data: {
    title?: string;
    description?: string | null;
    status?: "todo" | "in_progress" | "done";
    priority?: number;
    phaseId?: number;
  };
};

type UpdateTaskResponse = {
  task: {
    id: number;
    title: string;
    description: string | null;
    status: string;
    priority: number;
    createdAt: string;
    phaseId: number;
  };
};

export function useUpdateTask(projectId: number | string | undefined) {
  const queryClient = useQueryClient();

  const mutation = useMutation<UpdateTaskResponse, Error, UpdateTaskPayload>({
    mutationFn: async (payload) => {
      const { id, data } = payload;
      const res = await api.patch<UpdateTaskResponse>(`/tasks/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      // refetchne detail projektu, aby si mal nové tasky
      if (projectId) {
        queryClient.invalidateQueries({
          queryKey: ["project", String(projectId)],
        });
      }
    },
  });

  return {
    updateTask: mutation.mutateAsync,
    isUpdatingTask: mutation.isPending,
    updateTaskError: mutation.error,
  };
}
