import { useProjectLayout } from "../../layouts/project-layout";

function ProjectAITab() {
  const { project } = useProjectLayout();

  return (
    <section className="grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4">
        <h2 className="text-sm font-medium text-neutral-100">
          AI orchestration
        </h2>
        <p className="mt-1 text-[11px] text-neutral-500">
          Tu môžeš neskôr pridávať ďalšie „kola“ pre agentov – napr.
          preplánovanie, risk review, generovanie dokumentácie…
        </p>

        <div className="mt-4 space-y-3 text-xs">
          <button
            type="button"
            className="w-full rounded-xl border border-emerald-700/70 bg-emerald-500/10 px-3 py-2 text-center font-medium text-emerald-200 hover:bg-emerald-500/20"
          >
            Re-run planning agent (TODO)
          </button>
          <button
            type="button"
            className="w-full rounded-xl border border-sky-700/70 bg-sky-500/10 px-3 py-2 text-center font-medium text-sky-200 hover:bg-sky-500/20"
          >
            Ask AI for risks (TODO)
          </button>
          <button
            type="button"
            className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2 text-center font-medium text-neutral-200 hover:bg-black"
          >
            Generate tech spec (TODO)
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4">
        <h2 className="text-sm font-medium text-neutral-100">Plan snapshot</h2>
        <p className="mt-1 text-[11px] text-neutral-500">
          High-level zhrnutie plánov – môžeš tu neskôr zobrazovať raw JSON,
          diff medzi verziami plánu atď.
        </p>

        <div className="mt-3 max-h-64 overflow-auto rounded-xl border border-neutral-800 bg-black/70 p-3 text-[11px] font-mono text-neutral-300">
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(
              {
                id: project.id,
                name: project.name,
                phases: project.phases?.length ?? 0,
                tasks:
                  project.phases?.reduce(
                    (sum, p) => sum + (p.tasks?.length ?? 0),
                    0
                  ) ?? 0,
              },
              null,
              2
            )}
          </pre>
        </div>
      </div>
    </section>
  );
}

export default ProjectAITab;
