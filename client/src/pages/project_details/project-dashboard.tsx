// src/pages/project-tabs/project-dashboard-tab.tsx
import { useMemo } from "react";
import { useProjectLayout } from "../../layouts/project-layout";

type ProjectStatus = "draft" | "not_started" | "in_progress" | "done";

function ProjectDashboardTab() {
  const { project } = useProjectLayout();

  const {
    phases,
    tasks,
    tasksByPriority,
    lastActivity,
    statusCounts,
    projectStatus,
  } = useMemo(() => {
    const phasesCount = project.phases?.length ?? 0;

    const allTasks =
      project.phases?.flatMap((phase) => phase.tasks ?? []) ?? [];
    const tasksCount = allTasks.length;

    const tasksByPriority = {
      high: 0,
      medium: 0,
      low: 0,
    };

    const statusCounts = {
      todo: 0,
      in_progress: 0,
      done: 0,
    };

    for (const t of allTasks) {
      // priority mix
      if (t.priority >= 3) tasksByPriority.high += 1;
      else if (t.priority === 2) tasksByPriority.medium += 1;
      else tasksByPriority.low += 1;

      // status mix
      if (t.status === "done") statusCounts.done += 1;
      else if (t.status === "in_progress") statusCounts.in_progress += 1;
      else statusCounts.todo += 1;
    }

    // odvodený stav projektu z úloh
    let projectStatus: ProjectStatus = "draft";
    if (tasksCount === 0) {
      projectStatus = "draft";
    } else if (statusCounts.done === tasksCount) {
      projectStatus = "done";
    } else if (statusCounts.in_progress > 0) {
      projectStatus = "in_progress";
    } else {
      projectStatus = "not_started";
    }

    const lastActivityDate =
      allTasks.length > 0
        ? new Date(
            Math.max(
              ...allTasks.map((t) => new Date(t.createdAt).getTime())
            )
          )
        : new Date(project.createdAt);

    return {
      phases: phasesCount,
      tasks: tasksCount,
      tasksByPriority,
      lastActivity: lastActivityDate,
      statusCounts,
      projectStatus,
    };
  }, [project]);

  const sortedPhases = useMemo(() => {
    if (!project?.phases) return [];
    return [...project.phases].sort((a, b) => a.order - b.order);
  }, [project]);

  const statusLabel: Record<ProjectStatus, string> = {
    draft: "Draft",
    not_started: "Planned",
    in_progress: "In progress",
    done: "Done",
  };

  const statusClass: Record<ProjectStatus, string> = {
    draft:
      "bg-neutral-700/40 text-neutral-100 border border-neutral-500/60",
    not_started:
      "bg-sky-500/10 text-sky-300 border border-sky-500/40",
    in_progress:
      "bg-amber-500/10 text-amber-300 border border-amber-500/40",
    done:
      "bg-emerald-500/10 text-emerald-300 border border-emerald-500/40",
  };

  const devSkills = project.devSkills ?? ""; // očakávaš devSkills?: string | null;

  const hasDevStack = devSkills.trim().length > 0;

  return (
    <div className="space-y-4">
      {/* TOP: Project snapshot / base info */}
      <section className="grid gap-4 md:grid-cols-3">
        {/* Summary */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
            Project snapshot
          </p>
          <h2 className="mt-1 text-sm font-semibold text-neutral-50">
            Current scope
          </h2>

          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl bg-black/70 px-3 py-2">
              <p className="text-[11px] text-neutral-500">Phases</p>
              <p className="mt-1 text-lg font-semibold text-neutral-50">
                {phases}
              </p>
            </div>
            <div className="rounded-xl bg-black/70 px-3 py-2">
              <p className="text-[11px] text-neutral-500">Tasks (total)</p>
              <p className="mt-1 text-lg font-semibold text-neutral-50">
                {tasks}
              </p>
            </div>
          </div>

          <p className="mt-3 text-[11px] text-neutral-500">
            Created{" "}
            {new Date(project.createdAt).toLocaleDateString(undefined, {
              dateStyle: "medium",
            })}{" "}
            · Last activity{" "}
            {lastActivity.toLocaleString(undefined, {
              dateStyle: "short",
              timeStyle: "short",
            })}
          </p>
        </div>

        {/* Workload breakdown */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
            Workload
          </p>
          <h2 className="mt-1 text-sm font-semibold text-neutral-50">
            Task priority mix
          </h2>

          <div className="mt-4 space-y-2 text-xs">
            <div className="flex items-center justify-between rounded-xl bg-black/70 px-3 py-2">
              <span className="text-neutral-300">High</span>
              <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] text-red-300">
                {tasksByPriority.high}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-black/70 px-3 py-2">
              <span className="text-neutral-300">Medium</span>
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-300">
                {tasksByPriority.medium}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-black/70 px-3 py-2">
              <span className="text-neutral-300">Low</span>
              <span className="rounded-full bg-neutral-700/40 px-2 py-0.5 text-[11px] text-neutral-100">
                {tasksByPriority.low}
              </span>
            </div>
          </div>

          <p className="mt-3 text-[11px] text-neutral-500">
            Status mix: {statusCounts.todo} todo ·{" "}
            {statusCounts.in_progress} in progress · {statusCounts.done} done
          </p>
        </div>

        {/* Overview + dev stack */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
            Overview
          </p>
          <h2 className="mt-1 text-sm font-semibold text-neutral-50">
            Base info & team stack
          </h2>

          <dl className="mt-3 space-y-2 text-[11px]">
            <div className="flex gap-2">
              <dt className="w-16 text-neutral-500">ID</dt>
              <dd className="flex-1 truncate text-neutral-200">
                {project.id}
              </dd>
            </div>

            {project.idea && (
              <div className="flex gap-2">
                <dt className="w-16 text-neutral-500">Idea</dt>
                <dd className="flex-1 truncate text-neutral-200">
                  {project.idea}
                </dd>
              </div>
            )}

            <div className="flex items-center gap-2">
              <dt className="w-16 text-neutral-500">Status</dt>
              <dd className="flex-1">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${statusClass[projectStatus]}`}
                >
                  ● {statusLabel[projectStatus]}
                </span>
              </dd>
            </div>

            <div className="flex gap-2">
              <dt className="w-16 text-neutral-500">Dev stack</dt>
              <dd className="flex-1 truncate text-neutral-200">
                {hasDevStack
                  ? devSkills
                  : "Not specified yet – fill in developer skills when creating the project."}
              </dd>
            </div>
          </dl>

          <div className="mt-3 rounded-xl border border-dashed border-neutral-800 bg-black/50 px-3 py-2 text-[11px] text-neutral-500">
            Stav projektu je odvodený z úloh (todo / in progress / done). Dev
            stack pochádza z&nbsp;vyplnených skills pri vytváraní projektu.
          </div>
        </div>
      </section>

      {/* MAIN: phases + agents + activity */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)]">
        {/* LEFT: phases overview (bez taskov) */}
        <section className="flex flex-col rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-medium text-neutral-100">
                Phases overview
              </h2>
              <p className="text-[11px] text-neutral-500">
                Vysoký prehľad nad tým, ako je projekt rozdelený.
              </p>
            </div>
          </div>

          {sortedPhases.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-neutral-800 bg-black/60 p-6 text-center text-sm text-neutral-400">
              Zatiaľ neboli vytvorené žiadne fázy pre tento projekt.
            </div>
          ) : (
            <div className="mt-2 space-y-2 text-xs">
              {sortedPhases.map((phase) => (
                <div
                  key={phase.id}
                  className="flex items-center justify-between rounded-xl border border-neutral-800 bg-black/70 px-3 py-2"
                >
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
                      Phase {phase.order}
                    </p>
                    <p className="text-sm font-semibold text-neutral-50">
                      {phase.name}
                    </p>
                  </div>
                  <div className="text-right text-[11px] text-neutral-400">
                    <p>{phase.tasks.length} tasks</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="mt-3 text-[11px] text-neutral-500">
            Detailný rozpis úloh podľa fáz si pozrieš v karte{" "}
            <span className="text-neutral-200">Tasks</span>.
          </p>
        </section>

        {/* RIGHT: agents + activity log */}
        <section className="flex flex-col gap-4">
          {/* Agents panel */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4">
            <h2 className="text-sm font-medium text-neutral-100">
              Orchestration agents
            </h2>
            <p className="mt-1 text-[11px] text-neutral-500">
              Základné AI kroky, ktoré už prebehli pri vytváraní tohto
              workspace.
            </p>

            <div className="mt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2 rounded-xl border border-neutral-800 bg-black/70 px-3 py-2">
                <div>
                  <p className="font-medium text-neutral-100">
                    Planning agent
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    Rozbil brief na fázy a úlohy a uložil ich do DB.
                  </p>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                  Completed
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 rounded-xl border border-neutral-800 bg-black/70 px-3 py-2">
                <div>
                  <p className="font-medium text-neutral-100">
                    Consistency agent
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    Skontroluje, či fázy pokrývajú ciele briefu.
                  </p>
                </div>
                <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-[10px] font-medium text-neutral-300">
                  Soon
                </span>
              </div>
            </div>
          </div>

          {/* Activity log */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4">
            <h2 className="text-sm font-medium text-neutral-100">
              Activity log
            </h2>
            <p className="mt-1 text-[11px] text-neutral-500">
              Stručná história toho, čo sa s projektom zatiaľ stalo.
            </p>

            <ul className="mt-3 space-y-2 text-xs">
              <li className="flex gap-2">
                <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <div>
                  <p className="text-neutral-100">
                    Project created{" "}
                    <span className="text-neutral-400">
                      (ID {project.id})
                    </span>
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    {new Date(project.createdAt).toLocaleString()}
                  </p>
                </div>
              </li>

              <li className="flex gap-2">
                <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-sky-400" />
                <div>
                  <p className="text-neutral-100">
                    Planning agent generated {phases} phases and {tasks} tasks
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    uložené vo workspace cez Prisma
                  </p>
                </div>
              </li>

              {tasks === 0 && (
                <li className="flex gap-2">
                  <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-amber-400" />
                  <div>
                    <p className="text-neutral-100">No tasks generated yet</p>
                    <p className="text-[11px] text-neutral-500">
                      Skús vytvoriť projekt s detailnejším briefom, aby agent
                      vedel rozbiť prácu na konkrétne kroky.
                    </p>
                  </div>
                </li>
              )}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}

export default ProjectDashboardTab;
