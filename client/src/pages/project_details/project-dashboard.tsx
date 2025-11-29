// src/pages/project-tabs/project-dashboard-tab.tsx
import { useMemo } from "react";
import { useProjectLayout } from "../../layouts/project-layout";

function priorityLabel(priority: number) {
  if (priority >= 3) return "High";
  if (priority === 2) return "Medium";
  return "Low";
}

function priorityClasses(priority: number) {
  if (priority >= 3) {
    return "bg-red-500/10 text-red-300 border border-red-500/40";
  }
  if (priority === 2) {
    return "bg-amber-500/10 text-amber-300 border border-amber-500/40";
  }
  return "bg-neutral-700/40 text-neutral-200 border border-neutral-600/60";
}

function ProjectDashboardTab() {
  const { project } = useProjectLayout();

  const { phases, tasks, tasksByPriority, lastActivity } = useMemo(() => {
    const phasesCount = project.phases?.length ?? 0;
    const allTasks =
      project.phases?.flatMap((phase) => phase.tasks ?? []) ?? [];
    const tasksCount = allTasks.length;

    const tasksByPriority = {
      high: 0,
      medium: 0,
      low: 0,
    };

    for (const t of allTasks) {
      if (t.priority >= 3) tasksByPriority.high += 1;
      else if (t.priority === 2) tasksByPriority.medium += 1;
      else tasksByPriority.low += 1;
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
    };
  }, [project]);

  const sortedPhases = useMemo(() => {
    if (!project?.phases) return [];
    return [...project.phases].sort((a, b) => a.order - b.order);
  }, [project]);

  const recentTasks = useMemo(() => {
    const allTasks =
      project.phases?.flatMap((phase) => phase.tasks ?? []) ?? [];
    return [...allTasks]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 3);
  }, [project]);

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
              <p className="text-[11px] text-neutral-500">Tasks</p>
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

        {/* Load breakdown */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
            Workload
          </p>
          <h2 className="mt-1 text-sm font-semibold text-neutral-50">
            Task priority
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
        </div>

        {/* Quick glance / meta */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
            Overview
          </p>
          <h2 className="mt-1 text-sm font-semibold text-neutral-50">
            Base info
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
            <div className="flex gap-2">
              <dt className="w-16 text-neutral-500">Status</dt>
              <dd className="flex-1 text-emerald-300">Draft (AI planned)</dd>
            </div>
          </dl>

          <div className="mt-3 rounded-xl border border-dashed border-neutral-800 bg-black/50 px-3 py-2 text-[11px] text-neutral-500">
            Tento dashboard je len čítací – neskôr sem môžeš pridať úpravu
            fáz/úloh alebo ďalšie agent kolá.
          </div>
        </div>
      </section>

      {/* MAIN: board + right column */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1.1fr)]">
        {/* LEFT: phases / tasks board */}
        <section className="flex flex-col rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-medium text-neutral-100">
                Delivery board
              </h2>
              <p className="text-[11px] text-neutral-500">
                Fázy, ktoré vygenerovali agenti, s rozdelenými úlohami.
              </p>
            </div>
          </div>

          {sortedPhases.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-neutral-800 bg-black/60 p-6 text-center text-sm text-neutral-400">
              Zatiaľ neboli vytvorené žiadne fázy pre tento projekt.
            </div>
          ) : (
            <div className="mt-2 overflow-x-auto pb-2">
              <div className="flex min-w-full gap-4">
                {sortedPhases.map((phase) => (
                  <div
                    key={phase.id}
                    className="flex min-w-[240px] max-w-xs flex-1 flex-col rounded-2xl border border-neutral-800 bg-neutral-900/80 p-3"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
                          Phase {phase.order}
                        </p>
                        <h3 className="text-sm font-semibold text-neutral-50">
                          {phase.name}
                        </h3>
                      </div>
                      <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[11px] text-neutral-400">
                        {phase.tasks.length} tasks
                      </span>
                    </div>

                    <div className="flex flex-col gap-2">
                      {phase.tasks.length === 0 && (
                        <div className="rounded-xl border border-dashed border-neutral-800 bg-black/50 px-3 py-2 text-[11px] text-neutral-500">
                          Zatiaľ žiadne úlohy v tejto fáze.
                        </div>
                      )}

                      {phase.tasks.map((task) => (
                        <div
                          key={task.id}
                          className="rounded-xl border border-neutral-800 bg-black/70 px-3 py-2 text-xs text-neutral-100"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-[13px] font-medium">
                              {task.title}
                            </h4>
                          </div>
                          {task.description && (
                            <p className="mt-1 line-clamp-3 text-[11px] text-neutral-400">
                              {task.description}
                            </p>
                          )}

                          <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-neutral-500">
                            <span
                              className={
                                "rounded-full px-2 py-0.5 " +
                                priorityClasses(task.priority)
                              }
                            >
                              {priorityLabel(task.priority)} priority
                            </span>
                            <span>
                              {new Date(
                                task.createdAt
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* RIGHT: agents + activity / recent tasks */}
        <section className="flex flex-col gap-4">
          {/* Agents panel */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4">
            <h2 className="text-sm font-medium text-neutral-100">
              Orchestration agents
            </h2>
            <p className="mt-1 text-[11px] text-neutral-500">
              Tieto agenti prebehli pri vytváraní projektu. Neskôr im vieš
              pridať ďalšie kolá (refinement, risk check…).
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

          {/* Activity / recent tasks */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4">
            <h2 className="text-sm font-medium text-neutral-100">
              Activity & recent tasks
            </h2>
            <p className="mt-1 text-[11px] text-neutral-500">
              Rýchly prehľad toho, čo už workspace obsahuje.
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

              {recentTasks.length > 0 && (
                <li className="mt-3 border-t border-neutral-800 pt-3">
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                    Recent tasks
                  </p>
                  <div className="space-y-2">
                    {recentTasks.map((task) => (
                      <div
                        key={task.id}
                        className="rounded-xl bg-black/70 px-3 py-2 text-[11px]"
                      >
                        <p className="text-neutral-100">{task.title}</p>
                        {task.description && (
                          <p className="mt-1 line-clamp-2 text-neutral-500">
                            {task.description}
                          </p>
                        )}
                        <p className="mt-1 text-[10px] text-neutral-500">
                          {new Date(task.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </li>
              )}

              {tasks === 0 && (
                <li className="flex gap-2">
                  <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-amber-400" />
                  <div>
                    <p className="text-neutral-100">
                      No tasks generated yet
                    </p>
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
