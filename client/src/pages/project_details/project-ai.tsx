// src/pages/project-tabs/project-ai-tab.tsx
import { useMemo } from "react";
import { useProjectLayout } from "../../layouts/project-layout";
import { useProjectAgents } from "../../hooks/useProjectAgents";

function ProjectAITab() {
  const { project } = useProjectLayout();

  const {
    replanProject,
    replannedPlan,
    isReplanning,
    replanError,
    fetchRisks,
    risks,
    isFetchingRisks,
    risksError,
    generateSpec,
    spec,
    isGeneratingSpec,
    specError,
    applyPlan,
    isApplyingPlan,
    applyPlanError,
    generateDocTex,
    docTex,
    isGeneratingDocTex,
    docTexError,
  } = useProjectAgents(project.id);

  const baseSnapshot = useMemo(
    () => ({
      id: project.id,
      name: project.name,
      phases: project.phases?.length ?? 0,
      tasks:
        project.phases?.reduce(
          (sum, p) => sum + (p.tasks?.length ?? 0),
          0
        ) ?? 0,
    }),
    [project]
  );

  const snapshotToShow: unknown = replannedPlan ?? baseSnapshot;

  const canApplyPlan = Boolean(replannedPlan) && !isApplyingPlan;

  return (
    <section className="grid gap-4 md:grid-cols-2">
      {/* LEFT – akčné AI tlačidlá */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4">
        <h2 className="text-sm font-medium text-neutral-100">
          AI orchestration
        </h2>
        <p className="mt-1 text-[11px] text-neutral-500">
          Spusti jednotlivé agent kolá nad aktuálnym projektom. Plán môžeš
          prepočítať, pozrieť a potom ho aplikovať do DB.
        </p>

        <div className="mt-4 space-y-3 text-xs">
          {/* REPLAN */}
          <button
            type="button"
            onClick={() => replanProject()}
            disabled={isReplanning}
            className="w-full rounded-xl border border-emerald-700/70 bg-emerald-500/10 px-3 py-2 text-center font-medium text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-60"
          >
            {isReplanning ? "Re-running planning agent…" : "Re-run planning agent"}
          </button>

          {/* APPLY PLAN → prepíše phases + tasks v DB */}
          <button
            type="button"
            onClick={() => {
              if (!replannedPlan) return;
              void applyPlan(replannedPlan);
            }}
            disabled={!canApplyPlan}
            className="w-full rounded-xl border border-amber-700/70 bg-amber-500/10 px-3 py-2 text-center font-medium text-amber-200 hover:bg-amber-500/20 disabled:opacity-60"
          >
            {isApplyingPlan
              ? "Applying AI plan to project…"
              : replannedPlan
              ? "Apply AI plan (overwrite phases & tasks)"
              : "Re-run planning first to apply"}
          </button>

          {/* RISKS */}
          <button
            type="button"
            onClick={() => fetchRisks()}
            disabled={isFetchingRisks}
            className="w-full rounded-xl border border-sky-700/70 bg-sky-500/10 px-3 py-2 text-center font-medium text-sky-200 hover:bg-sky-500/20 disabled:opacity-60"
          >
            {isFetchingRisks ? "Analysing risks…" : "Ask AI for risks"}
          </button>

          {/* SPEC */}
          <button
            type="button"
            onClick={() => generateSpec()}
            disabled={isGeneratingSpec}
            className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2 text-center font-medium text-neutral-200 hover:bg-black disabled:opacity-60"
          >
            {isGeneratingSpec ? "Generating tech spec…" : "Generate tech spec"}
          </button>

          {/* DOC .TEX */}
          <button
            type="button"
            onClick={() => generateDocTex()}
            disabled={isGeneratingDocTex}
            className="w-full rounded-xl border border-purple-700/70 bg-purple-500/10 px-3 py-2 text-center font-medium text-purple-200 hover:bg-purple-500/20 disabled:opacity-60"
          >
            {isGeneratingDocTex
              ? "Generating documentation (.tex)…"
              : "Generate documentation (.tex)"}
          </button>
        </div>

        {(replanError || risksError || specError || applyPlanError || docTexError) && (
          <p className="mt-3 text-[11px] text-red-400">
            {replanError?.message ||
              risksError?.message ||
              specError?.message ||
              applyPlanError?.message ||
              docTexError?.message}
          </p>
        )}

        <p className="mt-3 text-[11px] text-neutral-500">
          Apply tlačidlo prepíše všetky fázy a úlohy projektu podľa najnovšieho
          AI plánu. Ostatné agenti (risks, spec, documentation) sú read-only
          insight.
        </p>
      </div>

      {/* RIGHT – výstupy agentov */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4">
        <h2 className="text-sm font-medium text-neutral-100">AI outputs</h2>
        <p className="mt-1 text-[11px] text-neutral-500">
          Rýchly náhľad na nový plán, riziká, technickú špecifikáciu a
          dokumentáciu vygenerovanú agentmi.
        </p>

        <div className="mt-3 space-y-3 text-[11px]">
          {/* Plan snapshot */}
          <div>
            <p className="mb-1 font-medium text-neutral-200">Plan snapshot</p>
            <div className="max-h-40 overflow-auto rounded-xl border border-neutral-800 bg-black/70 p-3 font-mono text-[11px] text-neutral-300">
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(snapshotToShow, null, 2)}
              </pre>
            </div>
            {!replannedPlan && (
              <p className="mt-1 text-[11px] text-neutral-500">
                Tip: klikni na{" "}
                <span className="text-neutral-200">Re-run planning agent</span>{" "}
                a uvidíš kompletný plán od AI.
              </p>
            )}
          </div>

          {/* Risks */}
          <div>
            <p className="mb-1 font-medium text-neutral-200">Risks</p>
            <div className="max-h-32 overflow-auto rounded-xl border border-neutral-800 bg-black/70 p-3 text-[11px] text-neutral-300">
              {isFetchingRisks ? (
                <p className="text-neutral-500">Analysing risks…</p>
              ) : risks ? (
                <pre className="whitespace-pre-wrap">{risks}</pre>
              ) : (
                <p className="text-neutral-500">
                  Klikni na{" "}
                  <span className="text-neutral-200">Ask AI for risks</span>{" "}
                  pre analýzu rizík.
                </p>
              )}
            </div>
          </div>

          {/* Tech spec */}
          <div>
            <p className="mb-1 font-medium text-neutral-200">Tech spec</p>
            <div className="max-h-40 overflow-auto rounded-xl border border-neutral-800 bg-black/70 p-3 text-[11px] text-neutral-300">
              {isGeneratingSpec ? (
                <p className="text-neutral-500">Generating spec…</p>
              ) : spec ? (
                <pre className="whitespace-pre-wrap">{spec}</pre>
              ) : (
                <p className="text-neutral-500">
                  Klikni na{" "}
                  <span className="text-neutral-200">Generate tech spec</span>{" "}
                  pre stručnú technickú špecifikáciu.
                </p>
              )}
            </div>
          </div>

          {/* Documentation .tex */}
          <div>
            <p className="mb-1 font-medium text-neutral-200">
              Documentation (.tex)
            </p>
            <div className="max-h-40 overflow-auto rounded-xl border border-neutral-800 bg-black/70 p-3 text-[11px] font-mono text-neutral-300">
              {isGeneratingDocTex ? (
                <p className="text-neutral-500">
                  Generating documentation (.tex)…
                </p>
              ) : docTex ? (
                <pre className="whitespace-pre-wrap">{docTex}</pre>
              ) : (
                <p className="text-neutral-500">
                  Klikni na{" "}
                  <span className="text-neutral-200">
                    Generate documentation (.tex)
                  </span>{" "}
                  a skopíruj výsledok do <code>.tex</code> súboru.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProjectAITab;
