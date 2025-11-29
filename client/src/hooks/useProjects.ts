// src/hooks/useProjects.ts
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { ProjectDTO } from "./useCreateProjectWithAgents";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000",
});

type ProjectsResponse = {
  projects: ProjectDTO[];
};

type ProjectResponse = {
  project: ProjectDTO;
};

/**
 * Zoznam všetkých projektov – používa sa na dashboard stránke.
 */
export function useProjects() {
  return useQuery<ProjectDTO[], Error>({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data } = await api.get<ProjectsResponse>("/projects");
      return data.projects;
    },
  });
}

/**
 * Detail jedného projektu podľa ID – používa sa v ProjectLayout / tabs.
 */
export function useProject(id?: string) {
  return useQuery<ProjectDTO, Error>({
    queryKey: ["project", id],
    enabled: !!id, // spustí sa len keď máme id z URL
    queryFn: async () => {
      if (!id) {
        throw new Error("Missing project id");
      }

      const { data } = await api.get<ProjectResponse>(`/projects/${id}`);
      return data.project;
    },
  });
}
