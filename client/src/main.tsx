// src/main.tsx (alebo routes.tsx)
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import DashboardPage from "./pages/dashboard-page";
import ProjectLayout from "./layouts/project-layout";
import ProjectDashboardTab from "./pages/project_details/project-dashboard";
import ProjectTasksTab from "./pages/project_details/project-tasks";
import ProjectAITab from "./pages/project_details/project-ai";
import ProjectActivityTab from "./pages/project_details/project-activity";
import ProjectSettingsTab from "./pages/project_details/project-settings";

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: "/",
    element: <DashboardPage />,
  },
  {
    path: "/projects/:id",
    element: <ProjectLayout />,
    children: [
      { index: true, element: <ProjectDashboardTab /> }, // /projects/:id
      { path: "tasks", element: <ProjectTasksTab /> }, // /projects/:id/tasks
      { path: "ai", element: <ProjectAITab /> }, // /projects/:id/ai
      {
        path: "settings",
        element: <ProjectSettingsTab />,
      }, // /projects/:id/settings
      { path: "activity", element: <ProjectActivityTab /> }, // /projects/:id/activity
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>
);
