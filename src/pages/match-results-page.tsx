import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash02,
  Trophy01,
  XClose,
} from "@untitledui/icons";
import { AppLayout } from "@/components/application/app-layout/app-layout";
import { useAuth } from "@/providers/auth-provider";
import {
  getPeladaById,
  getMatchResults,
  createMatchResult,
  deleteMatchResult,
  type Pelada,
  type MatchResult,
} from "@/lib/peladas";
import { cx } from "@/utils/cx";

function MatchResultsPage() {
  const navigate = useNavigate();
  const { peladaId } = useParams();
  const { profile } = useAuth();

  const [pelada, setPelada] = useState<Pelada | null>(null);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [form, setForm] = useState({
    teamAName: "Time A",
    teamBName: "Time B",
    teamAScore: 0,
    teamBScore: 0,
    durationMinutes: 15,
    notes: "",
  });

  const currentPeladaId = peladaId ?? "";

  const loadData = useCallback(async () => {
    if (!currentPeladaId) return;
    setIsLoading(true);
    const [peladaData, resultsData] = await Promise.all([
      getPeladaById(currentPeladaId),
      getMatchResults(currentPeladaId),
    ]);
    setPelada(peladaData);
    setResults(resultsData);
    setIsLoading(false);
  }, [currentPeladaId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddResult = async () => {
    if (!profile?.id) return;
    setIsSaving(true);
    const { data, error } = await createMatchResult(
      currentPeladaId,
      profile.id,
      form.teamAName,
      form.teamBName,
      form.teamAScore,
      form.teamBScore,
      form.durationMinutes,
      form.notes,
    );
    setIsSaving(false);
    if (!error && data) {
      setResults((prev) => [...prev, data]);
      setShowAddModal(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      setForm({
        teamAName: "Time A",
        teamBName: "Time B",
        teamAScore: 0,
        teamBScore: 0,
        durationMinutes: 15,
        notes: "",
      });
    }
  };

  const handleDeleteResult = async (id: string) => {
    const { error } = await deleteMatchResult(id);
    if (!error) {
      setResults((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const totalA = results.reduce((sum, r) => sum + r.team_a_score, 0);
  const totalB = results.reduce((sum, r) => sum + r.team_b_score, 0);
  const matchCount = results.length;

  if (isLoading) {
    return (
      <AppLayout
        topAppBarProps={{
          leading: (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-full p-2 text-fg-quaternary transition-colors hover:bg-primary_hover active:scale-95"
            >
              <ArrowLeft className="size-5" />
            </button>
          ),
        }}
      >
        <main className="flex min-h-screen items-center justify-center px-4 pb-28 pt-20">
          <div className="size-8 animate-spin rounded-full border-4 border-brand-solid border-t-transparent" />
        </main>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      topAppBarProps={{
        leading: (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-full p-2 text-fg-quaternary transition-colors hover:bg-primary_hover active:scale-95"
          >
            <ArrowLeft className="size-5" />
          </button>
        ),
      }}
    >
      <main className="mx-auto w-full max-w-lg flex-1 px-5 pb-28 pt-20">
        <section className="mb-6">
          <h1 className="font-display text-2xl font-bold text-primary">
            Placar
          </h1>
          <p className="mt-1 text-[15px] text-secondary">{pelada?.name}</p>
        </section>

        {matchCount > 0 && (
          <section className="mb-6" aria-label="Resumo">
            <div className="grid grid-cols-3 gap-4 rounded-2xl bg-primary p-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
              <div className="text-center">
                <p className="font-display text-[10px] font-bold uppercase text-quaternary">
                  Partidas
                </p>
                <p className="font-display text-2xl font-bold text-primary">
                  {matchCount}
                </p>
              </div>
              <div className="text-center">
                <p className="font-display text-[10px] font-bold uppercase text-quaternary">
                  Total A
                </p>
                <p className="font-display text-2xl font-bold text-success-primary">
                  {totalA}
                </p>
              </div>
              <div className="text-center">
                <p className="font-display text-[10px] font-bold uppercase text-quaternary">
                  Total B
                </p>
                <p className="font-display text-2xl font-bold text-brand-secondary">
                  {totalB}
                </p>
              </div>
            </div>
          </section>
        )}

        <section aria-label="Partidas">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-primary">
              Partidas
            </h2>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 rounded-full bg-brand-solid px-4 py-2 font-display text-sm font-bold text-primary_on-brand shadow-md transition-all active:scale-95"
            >
              <Plus className="size-4" />
              Adicionar
            </button>
          </div>

          {results.length === 0 ? (
            <div className="rounded-2xl bg-primary p-8 text-center shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
              <Trophy01 className="mx-auto mb-3 size-10 text-fg-quaternary" />
              <p className="font-display text-base font-semibold text-secondary">
                Nenhuma partida registrada
              </p>
              <p className="mt-1 text-sm text-tertiary">
                Adicione o placar de cada partida
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((result, index) => (
                <div
                  key={result.id}
                  className="flex items-center justify-between rounded-2xl bg-primary p-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-brand-primary/10 font-display text-xs font-bold text-brand-secondary">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-display text-sm font-semibold text-primary">
                        {result.team_a_name}{" "}
                        <span className="text-success-primary">
                          {result.team_a_score}
                        </span>{" "}
                        ×{" "}
                        <span className="text-brand-secondary">
                          {result.team_b_score}
                        </span>{" "}
                        {result.team_b_name}
                      </p>
                      <p className="text-xs text-quaternary">
                        {result.duration_minutes}min
                        {result.notes && ` • ${result.notes}`}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteResult(result.id)}
                    className="rounded-full p-1.5 text-fg-quaternary transition-colors hover:bg-error-primary/10 hover:text-error-primary"
                  >
                    <Trash02 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-t-2xl bg-primary p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-primary">
                Nova Partida
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-full p-1 text-fg-quaternary transition-colors hover:bg-secondary"
              >
                <XClose className="size-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-quaternary">
                    Time A
                  </label>
                  <input
                    type="text"
                    value={form.teamAName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, teamAName: e.target.value }))
                    }
                    className="w-full rounded-xl border border-primary bg-primary px-4 py-3 text-sm text-primary outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-quaternary">
                    Time B
                  </label>
                  <input
                    type="text"
                    value={form.teamBName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, teamBName: e.target.value }))
                    }
                    className="w-full rounded-xl border border-primary bg-primary px-4 py-3 text-sm text-primary outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-quaternary">
                    Gols A
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          teamAScore: Math.max(0, f.teamAScore - 1),
                        }))
                      }
                      className="flex size-10 items-center justify-center rounded-lg bg-secondary text-secondary transition-colors hover:bg-tertiary"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-display text-xl font-bold text-primary">
                      {form.teamAScore}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => ({ ...f, teamAScore: f.teamAScore + 1 }))
                      }
                      className="flex size-10 items-center justify-center rounded-lg bg-secondary text-secondary transition-colors hover:bg-tertiary"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-quaternary">
                    Gols B
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          teamBScore: Math.max(0, f.teamBScore - 1),
                        }))
                      }
                      className="flex size-10 items-center justify-center rounded-lg bg-secondary text-secondary transition-colors hover:bg-tertiary"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-display text-xl font-bold text-primary">
                      {form.teamBScore}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => ({ ...f, teamBScore: f.teamBScore + 1 }))
                      }
                      className="flex size-10 items-center justify-center rounded-lg bg-secondary text-secondary transition-colors hover:bg-tertiary"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-quaternary">
                  Duração (min)
                </label>
                <select
                  value={form.durationMinutes}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      durationMinutes: parseInt(e.target.value),
                    }))
                  }
                  className="w-full rounded-xl border border-primary bg-primary px-4 py-3 text-sm text-primary outline-none focus:ring-2 focus:ring-brand"
                >
                  <option value={5}>5 minutos</option>
                  <option value={10}>10 minutos</option>
                  <option value={15}>15 minutos</option>
                  <option value={20}>20 minutos</option>
                  <option value={25}>25 minutos</option>
                  <option value={30}>30 minutos</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-quaternary">
                  Observação (opcional)
                </label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  placeholder="Ex: times misturados, gol de ouro..."
                  className="w-full rounded-xl border border-primary bg-primary px-4 py-3 text-sm text-primary outline-none focus:ring-2 focus:ring-brand"
                />
              </div>

              <button
                type="button"
                onClick={handleAddResult}
                disabled={isSaving}
                className={cx(
                  "w-full rounded-xl py-3 font-display text-sm font-bold uppercase transition-all",
                  saveSuccess
                    ? "bg-success-primary text-white"
                    : "bg-brand-solid text-primary_on-brand hover:bg-brand-solid_hover",
                )}
              >
                {isSaving
                  ? "Salvando..."
                  : saveSuccess
                    ? "Registrado!"
                    : "Registrar Partida"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export default MatchResultsPage;
