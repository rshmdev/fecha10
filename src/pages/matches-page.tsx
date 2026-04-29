/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy01, Plus, FilterLines, Link04, XCircle } from "@untitledui/icons";
import { AppLayout } from "@/components/application/app-layout/app-layout";
import { FilterChips } from "@/components/application/filter-chips/filter-chips";
import { FeaturedMatchCard } from "@/components/application/featured-match-card/featured-match-card";
import {
  MatchCard,
  type MatchStatus,
} from "@/components/application/match-card/match-card";
import { useAuth } from "@/providers/auth-provider";
import {
  getUserPeladas,
  getConfirmedParticipants,
  formatDate,
  formatTime,
  closePastPeladasAndGenerateRecurring,
  type Pelada,
  type Participant,
} from "@/lib/peladas";

const FILTER_CHIPS = [
  { label: "Todas", value: "all" },
  { label: "Próximas", value: "upcoming" },
  { label: "Passadas", value: "past" },
];

type FilterValue = "all" | "upcoming" | "past";

function MatchesPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [filter, setFilter] = useState<FilterValue>("all");
  const [peladas, setPeladas] = useState<
    (Pelada & { confirmed_count: number })[]
  >([]);
  const [participantsMap, setParticipantsMap] = useState<
    Record<string, Participant[]>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteCode, setInviteCode] = useState("");

  const loadPeladas = useCallback(async () => {
    if (!profile) {
      setIsLoading(false);
      return;
    }

    await closePastPeladasAndGenerateRecurring(profile.id);

    const allPeladas = await getUserPeladas(profile.id);
    const peladasWithCounts = allPeladas.map((p) => ({
      ...p,
      confirmed_count: p.confirmed_count ?? 0,
    }));

    const countsMap: Record<string, number> = {};
    const partsMap: Record<string, Participant[]> = {};

    await Promise.all(
      peladasWithCounts.map(async (p) => {
        const confirmed = await getConfirmedParticipants(p.id);
        partsMap[p.id] = confirmed;
        countsMap[p.id] = confirmed.length;
      }),
    );

    setPeladas(
      peladasWithCounts.map((p) => ({
        ...p,
        confirmed_count: countsMap[p.id] ?? p.confirmed_count,
      })),
    );
    setParticipantsMap(partsMap);
    setIsLoading(false);
  }, [profile]);

  useEffect(() => {
    loadPeladas();
  }, [loadPeladas]);

  const today = new Date().toISOString().split("T")[0];

  const filteredPeladas = peladas.filter((p) => {
    if (p.status === "cancelled") return false;
    if (filter === "upcoming") return p.date >= today && p.status !== "closed";
    if (filter === "past") return p.date < today || p.status === "closed";
    return true;
  });

  const upcomingPeladas = filteredPeladas
    .filter((p) => p.date >= today && p.status !== "closed")
    .sort((a, b) => {
      const da = new Date(`${a.date}T${a.start_time}`);
      const db = new Date(`${b.date}T${b.start_time}`);
      return da.getTime() - db.getTime();
    });

  const pastPeladas = filteredPeladas
    .filter((p) => p.date < today || p.status === "closed")
    .sort((a, b) => {
      const da = new Date(`${b.date}T${b.start_time}`);
      const db = new Date(`${a.date}T${a.start_time}`);
      return da.getTime() - db.getTime();
    });

  const featured = upcomingPeladas.find((p) => !p.parent_pelada_id) ?? upcomingPeladas[0];
  const restUpcoming = upcomingPeladas.filter((p) => p.id !== featured?.id);

  const getMatchStatus = (
    pelada: Pelada & { confirmed_count: number },
  ): MatchStatus => {
    if (pelada.status === "closed") return "closed";
    if (pelada.confirmed_count >= pelada.max_players) return "full";
    return "open";
  };

  return (
    <AppLayout>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-32 pt-20">
        <section className="mb-8" aria-label="Título">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">
            Partidas
          </h1>
          <p className="mt-1 text-sm text-secondary">
            Organize seu time e domine o campo hoje.
          </p>
        </section>

        <FilterChips
          chips={FILTER_CHIPS}
          defaultValue="all"
          onChange={(v) => setFilter(v as FilterValue)}
          className="mb-8"
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="size-8 animate-spin rounded-full border-4 border-brand-solid border-t-transparent" />
          </div>
        ) : peladas.length === 0 ? (
          <section className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-secondary bg-primary px-6 py-16 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-secondary">
              <Trophy01 className="size-8 text-fg-quaternary" />
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold text-primary">
              Nenhuma pelada ainda
            </h3>
            <p className="mt-1 text-sm text-tertiary">
              Crie uma pelada ou entre com um código de convite.
            </p>
            <button
              type="button"
              onClick={() => navigate("/create-match")}
              className="mt-6 rounded-2xl bg-brand-solid px-6 py-3 font-display text-sm font-semibold text-primary_on-brand shadow-md transition-transform active:scale-95"
            >
              Criar pelada
            </button>
          </section>
        ) : (
          <>
            {featured && (
              <section className="mb-10" aria-label="Partida em destaque">
                <FeaturedMatchCard
                  title={featured.name}
                  time={`${formatDate(featured.date)}, ${formatTime(featured.start_time)} - ${formatTime(featured.end_time)}`}
                  location={featured.location}
                  currentPlayers={featured.confirmed_count}
                  maxPlayers={featured.max_players}
                  avatars={(participantsMap[featured.id] ?? [])
                    .slice(0, 3)
                    .map((p) => ({
                      src: p.profile?.avatar_url ?? "",
                      alt: p.profile?.name ?? "",
                    }))}
                  remainingCount={Math.max(
                    0,
                    featured.max_players - featured.confirmed_count,
                  )}
                  isConfirmed={(participantsMap[featured.id] ?? []).some(
                    (p) => p.profile_id === profile?.id,
                  )}
                  onCtaClick={() => navigate(`/match-detail/${featured.id}`)}
                  onCardClick={() => navigate(`/match-detail/${featured.id}`)}
                />
              </section>
            )}

            <section aria-label="Lista de partidas">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold text-primary">
                  {filter === "past"
                    ? "Partidas Passadas"
                    : "Próximas Partidas"}
                </h3>
                <button type="button" className="text-fg-quaternary">
                  <FilterLines className="size-5" />
                </button>
              </div>

              <div className="space-y-3">
                {(filter === "past" ? pastPeladas : restUpcoming).map(
                  (pelada) => {
                    const date = new Date(pelada.date + "T00:00:00");
                    const day = date.getDate().toString().padStart(2, "0");
                    const months = [
                      "JAN",
                      "FEV",
                      "MAR",
                      "ABR",
                      "MAI",
                      "JUN",
                      "JUL",
                      "AGO",
                      "SET",
                      "OUT",
                      "NOV",
                      "DEZ",
                    ];
                    const month = months[date.getMonth()];
                    const status = getMatchStatus(pelada);

                    return (
                      <button
                        key={pelada.id}
                        type="button"
                        onClick={() => navigate(`/match-detail/${pelada.id}`)}
                        className="w-full text-left"
                      >
                        <MatchCard
                          title={pelada.name}
                          date={day}
                          month={month}
                          time={
                            status === "closed"
                              ? ""
                              : `${formatTime(pelada.start_time)} - ${formatTime(pelada.end_time)}`
                          }
                          location={pelada.location}
                          currentPlayers={pelada.confirmed_count}
                          maxPlayers={pelada.max_players}
                          status={status}
                        />
                      </button>
                    );
                  },
                )}

                {filter !== "past" &&
                  pastPeladas.length > 0 &&
                  pastPeladas.map((pelada) => {
                    const date = new Date(pelada.date + "T00:00:00");
                    const day = date.getDate().toString().padStart(2, "0");
                    const months = [
                      "JAN",
                      "FEV",
                      "MAR",
                      "ABR",
                      "MAI",
                      "JUN",
                      "JUL",
                      "AGO",
                      "SET",
                      "OUT",
                      "NOV",
                      "DEZ",
                    ];
                    const month = months[date.getMonth()];

                    return (
                      <button
                        key={pelada.id}
                        type="button"
                        onClick={() => navigate(`/match-detail/${pelada.id}`)}
                        className="w-full text-left"
                      >
                        <MatchCard
                          title={pelada.name}
                          date={day}
                          month={month}
                          time=""
                          location={pelada.location}
                          currentPlayers={pelada.confirmed_count}
                          maxPlayers={pelada.max_players}
                          status="closed"
                        />
                      </button>
                    );
                  })}
              </div>

              {filteredPeladas.length === 0 && (
                <div className="py-12 text-center text-sm text-quaternary">
                  Nenhuma partida encontrada para este filtro.
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowInviteModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-primary p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-primary">
                Entrar em uma Pelada
              </h3>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="rounded-full p-1 text-fg-quaternary transition-colors hover:bg-secondary"
              >
                <XCircle className="size-5" />
              </button>
            </div>

            <p className="mb-4 text-sm text-secondary">
              Cole o código de convite ou o link que você recebeu do organizador.
            </p>

            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Código de convite (ex: ABC123)"
              className="mb-4 w-full rounded-xl border-2 border-secondary bg-secondary px-4 py-3 font-display text-lg font-bold uppercase tracking-widest text-primary placeholder:text-quaternary focus:border-brand-solid focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const code = inviteCode.trim();
                  if (code) {
                    if (code.includes("/")) {
                      navigate(code);
                    } else {
                      navigate(`/join/${code}`);
                    }
                  }
                }
              }}
            />

            <div className="flex gap-3">
              <button
                type="button"
                disabled={!inviteCode.trim()}
                onClick={() => {
                  const code = inviteCode.trim();
                  if (code) {
                    if (code.includes("/")) {
                      navigate(code);
                    } else {
                      navigate(`/join/${code}`);
                    }
                  }
                }}
                className="flex-1 rounded-xl bg-brand-solid py-3 font-display text-sm font-bold uppercase tracking-wider text-primary_on-brand shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="flex-1 rounded-xl border-2 border-secondary py-3 font-display text-sm font-bold uppercase tracking-wider text-secondary transition-colors hover:bg-secondary active:scale-95"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowInviteModal(true)}
        className="fixed bottom-40 right-6 z-40 flex size-14 items-center justify-center rounded-full border-2 border-brand-solid bg-brand-solid/10 text-brand-secondary shadow-xl transition-transform active:scale-90"
      >
        <Link04 className="size-6" />
      </button>

      <button
        type="button"
        onClick={() => navigate("/create-match")}
        className="fixed bottom-24 right-6 z-40 flex size-14 items-center justify-center rounded-full bg-brand-solid text-primary_on-brand shadow-xl transition-transform active:scale-90"
      >
        <Plus className="size-6" />
      </button>
    </AppLayout>
  );
}

export default MatchesPage;
