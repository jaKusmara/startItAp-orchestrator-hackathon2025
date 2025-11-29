import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOpenAI } from "../hooks/useOpenAI";
import {
  useCreateProjectWithAgents,
  type ProjectDTO,
} from "../hooks/useCreateProjectWithAgents";
import { useProjects } from "../hooks/useProjects";

type ProjectStatus = "draft" | "active" | "done";

type Project = {
  id: string;
  name: string;
  idea: string;
  teamSize: string;
  timeframe: string;
  status: ProjectStatus;
  createdAt: string;
  phasesCount: number;
  tasksCount: number;
};

// DASHBOARD PAGE

function DashboardPage() {
  const navigate = useNavigate();

  // OpenAI hook – používame len na generovanie briefu
  const { generateBrief, isGeneratingBrief, generateBriefError } = useOpenAI();

  // hook na orchestrátora (create-with-agents)
  const {
    createProjectWithAgents,
    isCreatingProject,
    createProjectError,
  } = useCreateProjectWithAgents();

  // hook na načítanie projektov z backendu
  const {
    data: projectDtos,
    isLoading: isLoadingProjects,
    error: projectsError,
  } = useProjects();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ProjectStatus>("all");
  const [isNewOpen, setIsNewOpen] = useState(false);

  // Form state pre nový projekt
  const [newName, setNewName] = useState("");
  const [newIdea, setNewIdea] = useState("");
  const [newTeamSize, setNewTeamSize] = useState("");
  const [newTimeframe, setNewTimeframe] = useState("");

  const [draftBrief, setDraftBrief] = useState("");
  const [briefError, setBriefError] = useState<string | null>(null);

  // mapovanie DTO -> UI model
  const mapDtoToProject = (dto: ProjectDTO): Project => {
    const phasesCount = dto.phases?.length ?? 0;
    const tasksCount =
      dto.phases?.reduce(
        (sum, phase) => sum + (phase.tasks?.length ?? 0),
        0
      ) ?? 0;

    return {
      id: dto.id.toString(),
      name: dto.name,
      idea: dto.idea ?? "",
      teamSize: "n/a", // zatiaľ ich v DB nemáš – môžeš doplniť stĺpce neskôr
      timeframe: "n/a",
      status: "draft",
      createdAt: dto.createdAt,
      phasesCount,
      tasksCount,
    };
  };

  const projects: Project[] = useMemo(() => {
    if (!projectDtos) return [];
    return projectDtos.map(mapDtoToProject);
  }, [projectDtos]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.idea.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ? true : p.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [projects, search, statusFilter]);

  // vygeneruje (alebo znovu prepíše) brief pomocou OpenAI
  const handleGenerateBrief = async () => {
    if (!newIdea.trim()) {
      setBriefError("Najprv vyplň aspoň základnú ideu projektu.");
      return;
    }

    setBriefError(null);

    try {
      const data = await generateBrief({
        name: newName,
        idea: newIdea,
        teamSize: newTeamSize,
        timeframe: newTimeframe,
      });

      setDraftBrief(data.brief || "");
    } catch (e) {
      console.error(e);
      setBriefError("Nepodarilo sa vygenerovať zadanie.");
    }
  };

  // vytvorí projekt cez backend orchestrátora (DB + AI agents)
  const handleCreateProject = async () => {
    if (!newName.trim() || !draftBrief.trim()) {
      return;
    }

    try {
      const data = await createProjectWithAgents({
        name: newName.trim(),
        idea: newIdea.trim(),
        brief: draftBrief,
        teamSize: newTeamSize,
        timeframe: newTimeframe,
      });

      // reset + zavrieť modal
      setIsNewOpen(false);
      setNewName("");
      setNewIdea("");
      setNewTeamSize("");
      setNewTimeframe("");
      setDraftBrief("");
      setBriefError(null);

      // voliteľné: rovno prejsť na detail projektu
      // navigate(`/projects/${data.project.id}`);
    } catch (e) {
      console.error(e);
      setBriefError("Nepodarilo sa vytvoriť projekt z briefu.");
    }
  };

  const renderStatusChip = (status: ProjectStatus) => {
    const base =
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium";
    if (status === "active") {
      return (
        <span className={`${base} bg-emerald-500/10 text-emerald-300`}>
          ● Active
        </span>
      );
    }
    if (status === "draft") {
      return (
        <span className={`${base} bg-neutral-600/30 text-neutral-200`}>
          ● Draft
        </span>
      );
    }
    return (
      <span className={`${base} bg-amber-500/10 text-amber-300`}>● Done</span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-neutral-950 to-black text-neutral-50">
      <div className="mx-auto max-w-6xl px-4 py-6 lg:py-8">
        {/* Header */}
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Projects
            </h1>
            <p className="mt-1 text-sm text-neutral-400 sm:text-base">
              Overview of all orchestrator workspaces. Pick a project or create
              a new one to let the agents plan for you.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsNewOpen(true)}
            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-emerald-950/60 transition hover:bg-emerald-500"
          >
            + New project
          </button>
        </header>

        {/* Filters */}
        <section className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <div className="relative max-w-md">
              <input
                type="text"
                placeholder="Search by name or idea…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-black/70 px-3 py-2 pl-3 text-sm text-neutral-100 outline-none ring-0 transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>
          </div>

          <div className="flex gap-2 text-xs sm:text-sm">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`rounded-full px-3 py-1 ${
                statusFilter === "all"
                  ? "bg-neutral-100 text-neutral-900"
                  : "bg-neutral-900 text-neutral-300 border border-neutral-700"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("draft")}
              className={`rounded-full px-3 py-1 ${
                statusFilter === "draft"
                  ? "bg-neutral-100 text-neutral-900"
                  : "bg-neutral-900 text-neutral-300 border border-neutral-700"
              }`}
            >
              Draft
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("active")}
              className={`rounded-full px-3 py-1 ${
                statusFilter === "active"
                  ? "bg-neutral-100 text-neutral-900"
                  : "bg-neutral-900 text-neutral-300 border border-neutral-700"
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("done")}
              className={`rounded-full px-3 py-1 ${
                statusFilter === "done"
                  ? "bg-neutral-100 text-neutral-900"
                  : "bg-neutral-900 text-neutral-300 border border-neutral-700"
              }`}
            >
              Done
            </button>
          </div>
        </section>

        {/* Error z /projects */}
        {projectsError && (
          <div className="mb-4 rounded-xl border border-red-900 bg-red-950/40 px-3 py-2 text-xs text-red-300">
            Failed to load projects: {projectsError.message}
          </div>
        )}

        {/* Projects grid / states */}
        {isLoadingProjects ? (
          <div className="mt-10 text-center text-sm text-neutral-400">
            Loading projects…
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-neutral-800 bg-black/60 p-10 text-center">
            <p className="text-sm text-neutral-300">
              No projects match your filters yet.
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              Try adjusting the search, status filter, or create a new project.
            </p>
          </div>
        ) : (
          <section className="grid gap-4 md:grid-cols-2">
            {filteredProjects.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => navigate(`/projects/${project.id}`)}
                className="flex flex-col rounded-2xl border border-neutral-800 bg-neutral-900/80 p-4 text-left shadow-lg shadow-black/60 transition hover:border-emerald-500 hover:bg-black/70"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-base font-semibold text-neutral-50">
                      {project.name}
                    </h2>
                    <p className="mt-1 line-clamp-2 text-xs text-neutral-400">
                      {project.idea}
                    </p>
                  </div>
                  {renderStatusChip(project.status)}
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-neutral-400">
                  <span className="rounded-full bg-neutral-900 px-2 py-0.5">
                    Team: {project.teamSize}
                  </span>
                  <span className="rounded-full bg-neutral-900 px-2 py-0.5">
                    Timeframe: {project.timeframe}
                  </span>
                  <span className="rounded-full bg-neutral-900 px-2 py-0.5">
                    Phases: {project.phasesCount}
                  </span>
                  <span className="rounded-full bg-neutral-900 px-2 py-0.5">
                    Tasks: {project.tasksCount}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-neutral-500">
                  <span>
                    Created: {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                  <span className="text-emerald-300">Open project →</span>
                </div>
              </button>
            ))}
          </section>
        )}

        {/* New project modal */}
        {isNewOpen && (
          <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/75 backdrop-blur-sm">
            <div className="w-full max-w-5xl rounded-2xl border border-neutral-800 bg-neutral-950 p-5 shadow-2xl shadow-black/80">
              {/* Header */}
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-50">
                    New project
                  </h2>
                  <p className="mt-1 text-xs text-neutral-400">
                    Naľavo nastavíš základné parametre projektu, napravo spolu s
                    AI doladíš zadanie, z ktorého potom vytvoríme plán.
                  </p>
                </div>
              </div>

              {/* 2-column layout */}
              <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1.05fr)_minmax(0,1.2fr)]">
                {/* LEFT – base info */}
                <section className="rounded-2xl border border-neutral-800 bg-black/60 p-4 text-sm">
                  <h3 className="text-sm font-medium text-neutral-100">
                    Base info
                  </h3>
                  <p className="mt-1 text-[11px] text-neutral-500">
                    Tieto údaje použijeme pri generovaní zadania aj plánu.
                  </p>

                  <div className="mt-4 space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="flex flex-col gap-1">
                        <span className="text-neutral-200 text-xs">Name</span>
                        <input
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="rounded-xl border border-neutral-800 bg-black/80 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40"
                          placeholder="AI Orchestrator for X…"
                        />
                      </label>

                      <label className="flex flex-col gap-1">
                        <span className="text-neutral-200 text-xs">
                          Timeframe
                        </span>
                        <input
                          type="text"
                          value={newTimeframe}
                          onChange={(e) => setNewTimeframe(e.target.value)}
                          className="rounded-xl border border-neutral-800 bg-black/80 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40"
                          placeholder="e.g. 1 week, 2 sprints"
                        />
                      </label>
                    </div>

                    <label className="flex flex-col gap-1">
                      <span className="text-neutral-200 text-xs">
                        Idea / one-liner
                      </span>
                      <textarea
                        rows={3}
                        value={newIdea}
                        onChange={(e) => setNewIdea(e.target.value)}
                        className="resize-none rounded-xl border border-neutral-800 bg-black/80 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40"
                        placeholder="Short description of what this project should do…"
                      />
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="text-neutral-200 text-xs">
                        Team size
                      </span>
                      <input
                        type="text"
                        value={newTeamSize}
                        onChange={(e) => setNewTeamSize(e.target.value)}
                        className="rounded-xl border border-neutral-800 bg-black/80 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40"
                        placeholder="e.g. 2 devs, 1 PM"
                      />
                    </label>

                    <div className="mt-3 rounded-xl border border-dashed border-neutral-800 bg-black/40 px-3 py-2 text-[11px] text-neutral-500">
                      Tip: napíš pokojne len “todo app pre študentov” – AI ti
                      pomôže doplniť detailný brief.
                    </div>
                  </div>
                </section>

                {/* RIGHT – AI / brief panel */}
                <section className="flex flex-col rounded-2xl border border-neutral-800 bg-black/60 p-4 text-sm">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600/20 text-xs text-emerald-300">
                        AI
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-neutral-100">
                          Project brief assistant
                        </h3>
                        <p className="text-[11px] text-neutral-500">
                          Vygeneruj návrh zadania a potom ho uprav tak, aby
                          sedel tvojmu projektu.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGenerateBrief}
                      disabled={isGeneratingBrief}
                      className="inline-flex items-center rounded-xl bg-neutral-900 px-3 py-1.5 text-xs font-medium text-emerald-300 border border-emerald-700/60 hover:bg-black disabled:opacity-60"
                    >
                      {isGeneratingBrief ? "Generating…" : "Generate draft"}
                    </button>
                  </div>

                  <div className="relative mt-2 flex-1">
                    <textarea
                      rows={10}
                      value={draftBrief}
                      onChange={(e) => setDraftBrief(e.target.value)}
                      className="h-60 w-full resize-none rounded-xl border border-neutral-800 bg-black/80 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40 md:h-[280px]"
                      placeholder="Project brief will appear here. You can edit it freely before creating the project."
                    />

                    {(briefError || generateBriefError) && (
                      <p className="mt-1 text-[11px] text-red-400">
                        {briefError || generateBriefError?.message}
                      </p>
                    )}
                    {createProjectError && (
                      <p className="mt-1 text-[11px] text-red-400">
                        {createProjectError.message}
                      </p>
                    )}
                  </div>
                </section>
              </div>

              {/* ACTIONS */}
              <div className="mt-5 flex flex-col gap-2 border-t border-neutral-800 pt-4 text-sm md:flex-row md:items-center md:justify-between">
                <p className="text-[11px] text-neutral-500">
                  Po kliknutí na{" "}
                  <span className="text-neutral-200">Create project</span>{" "}
                  použijeme tento brief na vygenerovanie fáz a úloh a uložíme
                  ich do workspace.
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNewOpen(false)}
                    className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2 text-neutral-200 hover:bg-black"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateProject}
                    disabled={
                      !newName.trim() || !draftBrief.trim() || isCreatingProject
                    }
                    className="rounded-xl bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
                  >
                    {isCreatingProject
                      ? "Creating project…"
                      : "Create project from this brief"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;
