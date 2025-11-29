import { useProjectLayout } from "../../layouts/project-layout";

function ProjectSettingsTab() {
  const { project } = useProjectLayout();

  return (
    <section className="grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4">
        <h2 className="text-sm font-medium text-neutral-100">
          Project settings
        </h2>
        <p className="mt-1 text-[11px] text-neutral-500">
          Základné meta-informácie. Logiku uloženia môžeš doplniť neskôr cez
          vlastný hook.
        </p>

        <div className="mt-4 space-y-3 text-xs">
          <div>
            <label className="mb-1 block text-[11px] text-neutral-400">
              Name
            </label>
            <input
              type="text"
              defaultValue={project.name}
              className="w-full rounded-xl border border-neutral-800 bg-black/80 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40"
              readOnly
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] text-neutral-400">
              Idea / description
            </label>
            <textarea
              rows={4}
              defaultValue={project.idea || ""}
              className="w-full resize-none rounded-xl border border-neutral-800 bg-black/80 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40"
              readOnly
            />
          </div>

          <p className="mt-2 text-[11px] text-neutral-500">
            Neskôr sem môžeš doplniť form na premenovanie projektu, archive flag
            alebo nastavenie stavu (draft / active / done).
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4">
        <h2 className="text-sm font-medium text-neutral-100">Danger zone</h2>
        <p className="mt-1 text-[11px] text-neutral-500">
          Demo-only placeholder – sem môžeš dať zmazanie projektu, archiváciu,
          reset plánu atď.
        </p>

        <div className="mt-4 space-y-3 text-xs">
          <button
            type="button"
            disabled
            className="w-full rounded-xl border border-red-900 bg-red-950/40 px-3 py-2 text-center font-medium text-red-300 opacity-60"
          >
            Delete workspace (TODO)
          </button>
          <button
            type="button"
            disabled
            className="w-full rounded-xl border border-amber-900 bg-amber-950/40 px-3 py-2 text-center font-medium text-amber-300 opacity-60"
          >
            Archive project (TODO)
          </button>
        </div>
      </div>
    </section>
  );
}

export default ProjectSettingsTab;
