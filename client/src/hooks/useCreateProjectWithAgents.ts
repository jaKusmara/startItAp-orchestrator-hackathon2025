import { useMutation } from "@tanstack/react-query";
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000",
});

// payload z frontu
export type CreateProjectPayload = {
  name: string;
  brief: string;
  idea?: string;
  teamSize?: string;
  timeframe?: string;
};

// typy podľa očakávaného response z /projects/create-with-agents
type TaskDTO = {
  id: number;
  title: string;
  description: string | null;
  priority: number;
  createdAt: string;
  phaseId: number;
};

type PhaseDTO = {
  id: number;
  name: string;
  order: number;
  projectId: number;
  tasks: TaskDTO[];
};

export type ProjectDTO = {
  id: number;
  name: string;
  idea: string | null;
  createdAt: string;
  phases: PhaseDTO[];
};

type CreateProjectResponse = {
  project: ProjectDTO;
  // planMeta?: ...  // ak niečo také vrátiš z backendu, môžeš doplniť
};

export function useCreateProjectWithAgents() {
  const mutation = useMutation<CreateProjectResponse, Error, CreateProjectPayload>(
    {
      mutationFn: async (payload) => {
        const { data } = await api.post<CreateProjectResponse>(
          "/projects/create-with-agents",
          payload
        );
        return data;
      },
    }
  );

  return {
    createProjectWithAgents: mutation.mutateAsync,
    isCreatingProject: mutation.isPending,
    createProjectError: mutation.error,
  };
}
