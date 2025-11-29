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

function ProjectTasksTab() {
  const { project } = useProjectLayout();

  const allTasks = useMemo(() => {
    if (!project?.phases) return [];
    return project.phases.flatMap((phase) =>
      phase.tasks.map((task) => ({
        ...task,
        phaseName: phase.name,
        phaseOrder: phase.order,
      }))
    );
  }, [project]);

  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium text-neutral-100">All tasks</h2>
          <p className="text-[11px] text-neutral-500">
            Plochý zoznam všetkých úloh, zoradený podľa fázy a priority.
          </p>
        </div>
      </div>

      {allTasks.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-neutral-800 bg-black/60 p-6 text-center text-sm text-neutral-400">
          Tento projekt zatiaľ nemá žiadne úlohy.
        </div>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-xs text-neutral-300">
            <thead className="border-b border-neutral-800 text-[11px] uppercase text-neutral-500">
              <tr>
                <th className="py-2 pr-4">Phase</th>
                <th className="py-2 pr-4">Task</th>
                <th className="py-2 pr-4">Priority</th>
                <th className="py-2 pr-4">Created</th>
              </tr>
            </thead>
            <tbody>
              {allTasks.map((task) => (
                <tr
                  key={task.id}
                  className="border-b border-neutral-900/60 last:border-0"
                >
                  <td className="py-2 pr-4 align-top text-neutral-400">
                    <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[11px]">
                      {task.phaseOrder}. {task.phaseName}
                    </span>
                  </td>
                  <td className="py-2 pr-4 align-top">
                    <div className="text-[13px] font-medium text-neutral-100">
                      {task.title}
                    </div>
                    {task.description && (
                      <div className="mt-1 text-[11px] text-neutral-500">
                        {task.description}
                      </div>
                    )}
                  </td>
                  <td className="py-2 pr-4 align-top">
                    <span
                      className={
                        "rounded-full px-2 py-0.5 text-[11px] " +
                        priorityClasses(task.priority)
                      }
                    >
                      {priorityLabel(task.priority)}
                    </span>
                  </td>
                  <td className="py-2 pr-4 align-top text-[11px] text-neutral-500">
                    {new Date(task.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default ProjectTasksTab;
