// src/pages/project-tabs/project-tasks-tab.tsx
import { useMemo, useState } from "react";
import { useProjectLayout } from "../../layouts/project-layout";
import { useUpdateTask } from "../../hooks/useUpdateTasks";

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

type TaskStatus = "todo" | "in_progress" | "done";

// lokálny typ pre editovaný task
type EditingTaskState = {
  id: number;
  title: string;
  description: string;
  priority: number;
  phaseId: number;
  status: TaskStatus;
};

function ProjectTasksTab() {
  const { project } = useProjectLayout();
  const { updateTask, isUpdatingTask, updateTaskError } = useUpdateTask(project.id);

  const [editingTask, setEditingTask] = useState<EditingTaskState | null>(null);

  const { columns, stats } = useMemo(() => {
    const phases = (project.phases ?? []).slice().sort((a, b) => a.order - b.order);

    const allTasks = phases.flatMap((p) => p.tasks ?? []);
    const stats = {
      total: allTasks.length,
      high: 0,
      medium: 0,
      low: 0,
    };

    for (const t of allTasks) {
      if (t.priority >= 3) stats.high += 1;
      else if (t.priority === 2) stats.medium += 1;
      else stats.low += 1;
    }

    return { columns: phases, stats };
  }, [project]);

  const openTaskModal = (task: {
    id: number;
    title: string;
    description: string | null;
    priority: number;
    phaseId: number;
    status: string;
  }) => {
    const allowedStatuses: TaskStatus[] = ["todo", "in_progress", "done"];
    const safeStatus: TaskStatus = allowedStatuses.includes(task.status as TaskStatus)
      ? (task.status as TaskStatus)
      : "todo";

    setEditingTask({
      id: task.id,
      title: task.title,
      description: task.description ?? "",
      priority: task.priority,
      phaseId: task.phaseId,
      status: safeStatus,
    });
  };

  const closeTaskModal = () => {
    setEditingTask(null);
  };

  const handleSaveTask = async () => {
    if (!editingTask) return;

    try {
      await updateTask({
        id: editingTask.id,
        data: {
          title: editingTask.title.trim(),
          description: editingTask.description.trim() || null,
          priority: editingTask.priority,
          phaseId: editingTask.phaseId,
          status: editingTask.status,
        },
      });

      closeTaskModal();
    } catch (e) {
      console.error("Failed to update task", e);
    }
  };

  return (
    <>
      <section className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4">
        {/* Header + summary row */}
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-sm font-medium text-neutral-100">Tasks board</h2>
            <p className="text-[11px] text-neutral-500">
              Kanban prehľad úloh podľa fáz. Kliknutím na úlohu otvoríš detail a môžeš ju upraviť.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-[11px]">
            <span className="rounded-full bg-neutral-900 px-3 py-1 text-neutral-300">
              Total:{" "}
              <span className="font-semibold text-neutral-50">{stats.total}</span>
            </span>
            <span className="rounded-full bg-red-500/10 px-3 py-1 text-red-300">
              High: <span className="font-semibold">{stats.high}</span>
            </span>
            <span className="rounded-full bg-amber-500/10 px-3 py-1 text-amber-300">
              Medium: <span className="font-semibold">{stats.medium}</span>
            </span>
            <span className="rounded-full bg-neutral-800 px-3 py-1 text-neutral-200">
              Low: <span className="font-semibold">{stats.low}</span>
            </span>
          </div>
        </div>

        {columns.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-neutral-800 bg-black/60 p-6 text-center text-sm text-neutral-400">
            Tento projekt zatiaľ nemá žiadne fázy ani úlohy.
          </div>
        ) : (
          <div className="mt-2 overflow-x-auto pb-2">
            <div className="flex min-w-full gap-4">
              {columns.map((phase) => {
                const tasks = phase.tasks ?? [];
                return (
                  <div
                    key={phase.id}
                    className="flex min-w-[260px] max-w-xs flex-1 flex-col rounded-2xl border border-neutral-800 bg-neutral-900/80 p-3"
                  >
                    {/* Column header */}
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
                          Phase {phase.order}
                        </p>
                        <h3 className="text-sm font-semibold text-neutral-50">
                          {phase.name}
                        </h3>
                      </div>
                      <span className="rounded-full bg-neutral-950 px-2 py-0.5 text-[11px] text-neutral-400">
                        {tasks.length} tasks
                      </span>
                    </div>

                    {/* Column body */}
                    <div className="flex flex-1 flex-col gap-2">
                      {tasks.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-neutral-800 bg-black/50 px-3 py-2 text-[11px] text-neutral-500">
                          Zatiaľ žiadne úlohy v tejto fáze.
                        </div>
                      ) : (
                        tasks.map((task) => (
                          <button
                            key={task.id}
                            type="button"
                            onClick={() =>
                              openTaskModal({
                                id: task.id,
                                title: task.title,
                                description: task.description,
                                priority: task.priority,
                                phaseId: task.phaseId,
                                status: task.status,
                              })
                            }
                            className="w-full rounded-xl border border-neutral-800 bg-black/70 px-3 py-2 text-left text-xs text-neutral-100 transition hover:border-emerald-500/70 hover:bg-black"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-[13px] font-medium">
                                {task.title}
                              </h4>
                              <span
                                className={
                                  "rounded-full px-2 py-0.5 text-[10px] " +
                                  priorityClasses(task.priority)
                                }
                              >
                                {priorityLabel(task.priority)}
                              </span>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <p className="mt-3 text-[11px] text-neutral-500">
          V náhľade vidíš len názov a prioritu. Detailný popis, prioritu, fázu a stav
          môžeš upraviť po rozkliknutí úlohy.
        </p>
      </section>

      {/* EDIT MODAL */}
      {editingTask && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-950 p-5 shadow-2xl shadow-black/80">
            <header className="mb-3 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-neutral-50">
                  Edit task
                </h3>
                <p className="text-[11px] text-neutral-500">
                  Uprav názov, popis, prioritu, fázu a stav tejto úlohy.
                </p>
              </div>
              <button
                type="button"
                onClick={closeTaskModal}
                className="rounded-xl border border-neutral-800 bg-neutral-900 px-2 py-1 text-[11px] text-neutral-300 hover:bg-black"
              >
                Close
              </button>
            </header>

            <div className="space-y-3 text-sm">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-neutral-300">Title</span>
                <input
                  type="text"
                  value={editingTask.title}
                  onChange={(e) =>
                    setEditingTask((prev) =>
                      prev ? { ...prev, title: e.target.value } : prev
                    )
                  }
                  className="rounded-xl border border-neutral-800 bg-black/80 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40"
                  placeholder="Task title…"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-neutral-300">Description</span>
                <textarea
                  rows={4}
                  value={editingTask.description}
                  onChange={(e) =>
                    setEditingTask((prev) =>
                      prev ? { ...prev, description: e.target.value } : prev
                    )
                  }
                  className="resize-none rounded-xl border border-neutral-800 bg-black/80 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40"
                  placeholder="Describe what needs to be done…"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                {/* Status */}
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] text-neutral-300">Status</span>
                  <select
                    value={editingTask.status}
                    onChange={(e) =>
                      setEditingTask((prev) =>
                        prev
                          ? { ...prev, status: e.target.value as TaskStatus }
                          : prev
                      )
                    }
                    className="rounded-xl border border-neutral-800 bg-black/80 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40"
                  >
                    <option value="todo">Not started</option>
                    <option value="in_progress">In progress</option>
                    <option value="done">Done</option>
                  </select>
                </label>

                {/* Phase select */}
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] text-neutral-300">Phase</span>
                  <select
                    value={editingTask.phaseId}
                    onChange={(e) =>
                      setEditingTask((prev) =>
                        prev
                          ? { ...prev, phaseId: Number(e.target.value) }
                          : prev
                      )
                    }
                    className="rounded-xl border border-neutral-800 bg-black/80 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40"
                  >
                    {(project.phases ?? [])
                      .slice()
                      .sort((a, b) => a.order - b.order)
                      .map((phase) => (
                        <option key={phase.id} value={phase.id}>
                          {phase.order}. {phase.name}
                        </option>
                      ))}
                  </select>
                </label>
              </div>

              {/* Priority */}
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-neutral-300">Priority</span>
                <div className="flex flex-wrap gap-1.5">
                  {[1, 2, 3].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() =>
                        setEditingTask((prev) =>
                          prev ? { ...prev, priority: p } : prev
                        )
                      }
                      className={
                        "rounded-full px-3 py-1 text-[11px] " +
                        priorityClasses(p) +
                        (editingTask.priority === p
                          ? " ring-1 ring-emerald-400/70"
                          : "")
                      }
                    >
                      {priorityLabel(p)}
                    </button>
                  ))}
                </div>
              </div>

              {updateTaskError && (
                <p className="text-[11px] text-red-400">
                  Failed to update task: {updateTaskError.message}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeTaskModal}
                className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm text-neutral-200 hover:bg-black"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTask}
                disabled={isUpdatingTask || !editingTask.title.trim()}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
              >
                {isUpdatingTask ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ProjectTasksTab;
