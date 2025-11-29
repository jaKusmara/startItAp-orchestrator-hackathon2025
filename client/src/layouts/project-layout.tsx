// src/layouts/ProjectLayout.tsx
import {
  NavLink,
  Outlet,
  useNavigate,
  useOutletContext,
  useParams,
} from "react-router-dom";
import { useProject } from "../hooks/useProjects";
import type { ProjectDTO } from "../hooks/useCreateProjectWithAgents";

type ProjectLayoutContext = {
  project: ProjectDTO;
};

export function useProjectLayout() {
  return useOutletContext<ProjectLayoutContext>();
}

function ProjectLayout() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    data: project,
    isLoading,
    error,
  } = useProject(id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-neutral-950 to-black text-neutral-50">
      <div className="mx-auto max-w-6xl px-4 py-6 lg:py-8">
        {/* Top bar */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-200 hover:bg-black"
          >
            ← Back
          </button>

          <span className="rounded-full border border-emerald-700/60 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-300">
            Orchestrated workspace
          </span>
        </div>

        {/* Loading & error states */}
        {isLoading && (
          <div className="mt-10 text-center text-sm text-neutral-400">
            Loading project…
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-200">
            Failed to load project: {error.message}
          </div>
        )}

        {!isLoading && !error && !project && (
          <div className="mt-10 rounded-2xl border border-dashed border-neutral-800 bg-black/60 p-10 text-center">
            <p className="text-sm text-neutral-300">
              Project not found or no data loaded.
            </p>
          </div>
        )}

        {project && (
          <>
            {/* Header */}
            <header className="mb-4">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {project.name}
              </h1>
              {project.idea && (
                <p className="mt-2 max-w-2xl text-sm text-neutral-400">
                  {project.idea}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-3 text-xs text-neutral-400">
                <span className="rounded-full bg-neutral-900 px-3 py-1">
                  ID: {project.id}
                </span>
                <span className="rounded-full bg-neutral-900 px-3 py-1">
                  Created:{" "}
                  {new Date(project.createdAt).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
                <span className="rounded-full bg-neutral-900 px-3 py-1">
                  Phases: {project.phases?.length ?? 0}
                </span>
              </div>
            </header>

            {/* Tabs navbar */}
            <nav className="mb-5 border-b border-neutral-800">
              <ul className="-mb-px flex flex-wrap gap-2 text-xs sm:text-sm">
                <TabLink to="." end label="Dashboard" />
                <TabLink to="tasks" label="Tasks" />
                <TabLink to="ai" label="AI orchestration" />
                <TabLink to="settings" label="Settings" />
                <TabLink to="activity" label="Activity" />
              </ul>
            </nav>

            {/* Tab content – outlet s contextom */}
            <Outlet context={{ project }} />
          </>
        )}
      </div>
    </div>
  );
}

type TabLinkProps = {
  to: string;
  label: string;
  end?: boolean;
};

function TabLink({ to, label, end }: TabLinkProps) {
  return (
    <li>
      <NavLink
        to={to}
        end={end}
        className={({ isActive }) =>
          [
            "rounded-t-xl px-3 py-2 transition",
            isActive
              ? "border-b-2 border-emerald-500 bg-neutral-900 text-neutral-50"
              : "border-b-2 border-transparent text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900/60",
          ].join(" ")
        }
      >
        {label}
      </NavLink>
    </li>
  );
}

export default ProjectLayout;
