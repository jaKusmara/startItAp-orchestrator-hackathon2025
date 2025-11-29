// src/pages/project-activity-tab.tsx
import { useMemo } from "react";
import { useProjectLayout } from "../../layouts/project-layout";

function ProjectActivityTab() {
  const { project } = useProjectLayout();

  const stats = useMemo(() => {
    const phases = project.phases?.length ?? 0;
    const tasks =
      project.phases?.reduce(
        (sum, phase) => sum + (phase.tasks?.length ?? 0),
        0
      ) ?? 0;
    return { phases, tasks };
  }, [project]);

  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4">
      <h2 className="text-sm font-medium text-neutral-100">Activity</h2>
      <p className="mt-1 text-[11px] text-neutral-500">
        Timeline udalostí pre tento workspace. Zatiaľ len generované z
        existujúcich dát.
      </p>

      <ol className="mt-4 space-y-3 border-l border-neutral-800 pl-4 text-xs">
        <li className="relative">
          <span className="absolute -left-[9px] mt-0.5 h-2 w-2 rounded-full bg-emerald-400" />
          <div>
            <p className="text-neutral-100">
              Project created{" "}
              <span className="text-neutral-400">(ID {project.id})</span>
            </p>
            <p className="text-[11px] text-neutral-500">
              {new Date(project.createdAt).toLocaleString()}
            </p>
          </div>
        </li>

        <li className="relative">
          <span className="absolute -left-[9px] mt-0.5 h-2 w-2 rounded-full bg-sky-400" />
          <div>
            <p className="text-neutral-100">
              Planning agent generated {stats.phases} phases and {stats.tasks}{" "}
              tasks
            </p>
            <p className="text-[11px] text-neutral-500">
              stored in your workspace DB via Prisma
            </p>
          </div>
        </li>

        {stats.phases === 0 && (
          <li className="relative">
            <span className="absolute -left-[9px] mt-0.5 h-2 w-2 rounded-full bg-amber-400" />
            <div>
              <p className="text-neutral-100">No phases or tasks yet</p>
              <p className="text-[11px] text-neutral-500">
                Skús vytvoriť projekt s bohatším briefom alebo pridať ďalšie
                AI kolo.
              </p>
            </div>
          </li>
        )}
      </ol>
    </section>
  );
}

export default ProjectActivityTab;
