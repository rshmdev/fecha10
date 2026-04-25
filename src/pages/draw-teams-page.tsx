import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Users01,
  User01,
  Shuffle01,
  Settings01,
  Calendar,
  Plus,
  Minus,
  Lightning01,
  UsersPlus,
  CheckCircle,
} from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { Toggle } from "@/components/base/toggle/toggle";
import { AppLayout } from "@/components/application/app-layout/app-layout";
import { cx } from "@/utils/cx";
import {
  getPeladaById,
  getParticipants,
  type Pelada,
  type Participant,
} from "@/lib/peladas";

const POSITION_COLORS: Record<string, string> = {
  Atacante: "bg-secondary text-secondary",
  "Meio-campo": "bg-brand-primary text-brand-secondary",
  Zagueiro: "bg-brand-primary text-brand-secondary",
  Goleiro: "bg-secondary text-secondary",
};

type TeamAssignment = Record<string, "a" | "b" | "bench">;

function StepperControl({
  value,
  onChange,
  min = 1,
  max = 20,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center rounded-lg border border-secondary bg-secondary p-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="flex size-8 items-center justify-center rounded transition-colors hover:bg-primary disabled:opacity-30"
      >
        <Minus className="size-4" />
      </button>
      <span className="w-8 text-center font-display text-sm font-bold">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="flex size-8 items-center justify-center rounded transition-colors hover:bg-primary disabled:opacity-30"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}

function PlayerCard({
  participant,
  team,
  onMoveToTeam,
}: {
  participant: Participant;
  team?: "a" | "b" | "bench";
  onMoveToTeam?: (playerId: string, team: "a" | "b" | "bench") => void;
}) {
  const profile = participant.profile;
  const name = profile?.name ?? "Jogador";
  const avatar = profile?.avatar_url;
  const position = profile?.positions?.[0] ?? "Jogador";

  return (
    <div className="flex items-center gap-3 rounded-lg border border-black/5 bg-primary p-3 shadow-sm transition-shadow hover:shadow-md">
      {avatar ? (
        <Avatar src={avatar} alt={name} size="lg" rounded />
      ) : (
        <div className="flex size-12 items-center justify-center rounded-full bg-quaternary">
          <User01 className="size-5 text-fg-quaternary" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="font-display text-[15px] font-semibold text-primary">
          {name}
          {participant.is_admin && (
            <span className="ml-2 rounded bg-brand/20 px-1.5 py-0.5 font-display text-[10px] font-bold text-brand">
              ADMIN
            </span>
          )}
        </p>
        <span
          className={cx(
            "mt-0.5 inline-block rounded px-2 py-0.5 font-display text-[10px] font-bold uppercase",
            POSITION_COLORS[position] ?? "bg-secondary text-secondary",
          )}
        >
          {position}
        </span>
      </div>
      {onMoveToTeam && team && (
        <div className="flex gap-1">
          {team !== "a" && (
            <button
              type="button"
              onClick={() => onMoveToTeam(participant.id, "a")}
              className="rounded-lg bg-success-primary/20 px-2 py-1 font-display text-[10px] font-bold uppercase text-success-primary transition-colors hover:bg-success-primary/30"
            >
              A
            </button>
          )}
          {team !== "b" && (
            <button
              type="button"
              onClick={() => onMoveToTeam(participant.id, "b")}
              className="rounded-lg bg-secondary px-2 py-1 font-display text-[10px] font-bold uppercase text-secondary transition-colors hover:bg-tertiary"
            >
              B
            </button>
          )}
          {team !== "bench" && (
            <button
              type="button"
              onClick={() => onMoveToTeam(participant.id, "bench")}
              className="rounded-lg bg-secondary px-2 py-1 font-display text-[10px] font-bold uppercase text-quaternary transition-colors hover:bg-tertiary"
            >
              Banco
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function DrawTeamsPage() {
  const navigate = useNavigate();
  const { peladaId } = useParams();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") ?? "draw";

  const [pelada, setPelada] = useState<Pelada | null>(null);
  const [confirmedParticipants, setConfirmedParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [balanceByAge, setBalanceByAge] = useState(true);
  const [youthAgeLimit, setYouthAgeLimit] = useState(25);
  const [maxYouthPerTeam, setMaxYouthPerTeam] = useState(2);
  const [playersPerTeam, setPlayersPerTeam] = useState(5);
  const [levelCriteria, setLevelCriteria] = useState("equilibrado");
  const [isDrawn, setIsDrawn] = useState(mode === "manual");

  const [teamAssignments, setTeamAssignments] = useState<TeamAssignment>({});

  const currentPeladaId = peladaId ?? "";

  const loadData = useCallback(async () => {
    if (!currentPeladaId) {
      setIsLoading(false);
      return;
    }

    const peladaData = await getPeladaById(currentPeladaId);
    setPelada(peladaData);

    if (peladaData) {
      setPlayersPerTeam(Math.floor(peladaData.max_players / 2));
    }

    const participantsData = await getParticipants(currentPeladaId);
    const confirmed = participantsData.filter((p) => p.status === "confirmed");
    setConfirmedParticipants(confirmed);

    const initialAssignments: TeamAssignment = {};
    confirmed.forEach((p) => {
      initialAssignments[p.id] = "bench";
    });
    setTeamAssignments(initialAssignments);

    setIsLoading(false);
  }, [currentPeladaId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleMovePlayer = (playerId: string, team: "a" | "b" | "bench") => {
    setTeamAssignments((prev) => ({
      ...prev,
      [playerId]: team,
    }));
  };

  const handleDraw = () => {
    const shuffled = [...confirmedParticipants].sort(() => Math.random() - 0.5);
    const newAssignments: TeamAssignment = {};

    if (balanceByAge) {
      const goalkeepers = shuffled.filter(
        (p) => p.profile?.positions?.[0] === "Goleiro",
      );
      const others = shuffled.filter(
        (p) => p.profile?.positions?.[0] !== "Goleiro",
      );

      const goalkeepersPerTeam = Math.ceil(goalkeepers.length / 2);
      goalkeepers.forEach((p, i) => {
        newAssignments[p.id] =
          i < goalkeepersPerTeam
            ? "a"
            : i < goalkeepersPerTeam * 2
              ? "b"
              : "bench";
      });

      const spotsA = playersPerTeam - goalkeepers.filter((_, i) => newAssignments[goalkeepers[i]?.id] === "a").length;

      others.forEach((p) => {
        const teamACount = Object.values(newAssignments).filter((t) => t === "a").length;
        const teamBCount = Object.values(newAssignments).filter((t) => t === "b").length;

        if (teamACount < spotsA + goalkeepers.filter((_, j) => newAssignments[goalkeepers[j]?.id] === "a").length && teamACount < playersPerTeam) {
          newAssignments[p.id] = "a";
        } else if (teamBCount < playersPerTeam) {
          newAssignments[p.id] = "b";
        } else {
          newAssignments[p.id] = "bench";
        }
      });
    } else {
      shuffled.forEach((p, i) => {
        const teamACount = Object.values(newAssignments).filter((t) => t === "a").length;
        if (teamACount < playersPerTeam) {
          newAssignments[p.id] = i % 2 === 0 ? "a" : "b";
        } else {
          const teamBCount = Object.values(newAssignments).filter((t) => t === "b").length;
          if (teamBCount < playersPerTeam) {
            newAssignments[p.id] = "b";
          } else {
            newAssignments[p.id] = "bench";
          }
        }
      });
    }

    setTeamAssignments(newAssignments);
    setIsDrawn(true);
  };

  const teamAPlayers = confirmedParticipants.filter(
    (p) => teamAssignments[p.id] === "a",
  );
  const teamBPlayers = confirmedParticipants.filter(
    (p) => teamAssignments[p.id] === "b",
  );
  const benchPlayers = confirmedParticipants.filter(
    (p) => teamAssignments[p.id] === "bench" || !teamAssignments[p.id],
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <div className="size-8 animate-spin rounded-full border-4 border-brand-solid border-t-transparent" />
      </div>
    );
  }

  if (!pelada) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-secondary text-primary">
        <p className="text-lg font-medium">Pelada não encontrada</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-brand-secondary hover:underline"
        >
          Voltar
        </button>
      </div>
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
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-20">
        <section className="mb-6 mt-4">
          <h1 className="font-display text-2xl font-bold text-primary">
            {mode === "manual" ? "Dividir Manualmente" : "Sortear Times"}
          </h1>
          <p className="mt-1 text-[15px] text-secondary">
            {mode === "manual"
              ? "Arraste os jogadores para cada time como preferir."
              : "Equilibre o campo sorteando jogadores ou ajustando manualmente."}
          </p>
          <p className="mt-2 font-display text-sm font-semibold text-brand-secondary">
            {pelada.name}
          </p>
        </section>

        {mode === "draw" && (
<section className="mb-6 rounded-2xl border border-secondary bg-primary p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Settings01 className="size-5 text-fg-brand-secondary" />
                <h3 className="font-display text-lg font-semibold">
                  Regras do Sorteio
                </h3>
              </div>

              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-brand-primary/10">
                      <Calendar className="size-[18px] text-fg-brand-secondary" />
                    </div>
                    <span className="font-display text-[15px] font-medium">
                      Equilibrar por Idade
                    </span>
                  </div>
                  <Toggle
                    isSelected={balanceByAge}
                    onChange={setBalanceByAge}
                    aria-label="Equilibrar por Idade"
                  />
                </div>

                {balanceByAge && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-secondary">
                        <Users01 className="size-[18px] text-secondary" />
                      </div>
                      <div>
                        <span className="font-display text-[15px] font-medium">
                          Idade Limite (Jovem)
                        </span>
                        <p className="text-[11px] text-quaternary">
                          Até {youthAgeLimit} anos = jovem
                        </p>
                      </div>
                    </div>
                    <StepperControl
                      value={youthAgeLimit}
                      onChange={setYouthAgeLimit}
                      min={14}
                      max={60}
                    />
                  </div>
                )}

                {balanceByAge && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-secondary">
                        <Users01 className="size-[18px] text-secondary" />
                      </div>
                      <span className="font-display text-[15px] font-medium">
                        Máx. Jovens por Time
                      </span>
                    </div>
                    <StepperControl
                      value={maxYouthPerTeam}
                      onChange={setMaxYouthPerTeam}
                      min={1}
                      max={10}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-secondary">
                      <UsersPlus className="size-[18px] text-secondary" />
                    </div>
                    <span className="font-display text-[15px] font-medium">
                      Jogadores por Time
                    </span>
                  </div>
                  <StepperControl
                    value={playersPerTeam}
                    onChange={setPlayersPerTeam}
                    min={2}
                    max={11}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-brand-primary/10">
                      <Lightning01 className="size-[18px] text-fg-brand-secondary" />
                    </div>
                    <span className="font-display text-[15px] font-medium">
                      Critério de Nível
                    </span>
                  </div>
                  <select
                    value={levelCriteria}
                    onChange={(e) => setLevelCriteria(e.target.value)}
                    className="rounded-lg border-none bg-secondary py-1.5 pl-3 pr-8 font-display text-sm font-medium text-primary focus:ring-1 focus:ring-brand"
                  >
                    <option value="equilibrado">Equilibrado</option>
                    <option value="aleatorio">Aleatório</option>
                  </select>
                </div>
              </div>
            </section>
        )}

        {mode === "draw" && (
          <section className="mb-6">
            <button
              type="button"
              onClick={handleDraw}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-solid px-6 py-4 font-display text-sm font-bold uppercase tracking-wider text-primary_on-brand shadow-md shadow-brand-solid/20 transition-all active:scale-95 hover:bg-brand-solid_hover"
            >
              <Shuffle01 className="size-5" />
              Sortear times
            </button>
          </section>
        )}

        {mode === "manual" && !isDrawn && (
          <section className="mb-6">
            <p className="text-center text-sm text-quaternary">
              Mova os jogadores entre os times usando os botões abaixo de cada um.
            </p>
          </section>
        )}

        {isDrawn && (
          <section className="mb-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <span className="size-3 rounded-full bg-success-solid" />
                    <h2 className="font-display text-lg font-semibold">
                      Time A
                    </h2>
                  </div>
                  <span className="rounded-full bg-secondary px-3 py-1 font-display text-[10px] font-bold uppercase text-secondary">
                    {teamAPlayers.length} jogadores
                  </span>
                </div>
                <div className="space-y-2 rounded-xl border border-secondary bg-primary p-2">
                  {teamAPlayers.length > 0 ? (
                    teamAPlayers.map((p) => (
                      <PlayerCard
                        key={p.id}
                        participant={p}
                        team="a"
                        onMoveToTeam={handleMovePlayer}
                      />
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-secondary p-6 text-quaternary">
                      <Users01 className="mb-2 size-8 opacity-40" />
                      <p className="font-display text-[10px] font-bold uppercase">
                        Nenhum jogador
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <span className="size-3 rounded-full bg-brand-solid" />
                    <h2 className="font-display text-lg font-semibold">
                      Time B
                    </h2>
                  </div>
                  <span className="rounded-full bg-secondary px-3 py-1 font-display text-[10px] font-bold uppercase text-secondary">
                    {teamBPlayers.length} jogadores
                  </span>
                </div>
                <div className="space-y-2 rounded-xl border border-secondary bg-primary p-2">
                  {teamBPlayers.length > 0 ? (
                    teamBPlayers.map((p) => (
                      <PlayerCard
                        key={p.id}
                        participant={p}
                        team="b"
                        onMoveToTeam={handleMovePlayer}
                      />
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-secondary p-6 text-quaternary">
                      <Users01 className="mb-2 size-8 opacity-40" />
                      <p className="font-display text-[10px] font-bold uppercase">
                        Nenhum jogador
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {isDrawn && benchPlayers.length > 0 && (
          <section className="mb-8 overflow-hidden rounded-2xl border border-secondary bg-primary p-6 shadow-sm">
            <div className="relative z-10">
              <h3 className="mb-4 font-display text-lg font-semibold">
                Banco / Lista de Espera
              </h3>
              <div className="space-y-2">
                {benchPlayers.map((p) => (
                  <PlayerCard
                    key={p.id}
                    participant={p}
                    team="bench"
                    onMoveToTeam={handleMovePlayer}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {!isDrawn && mode === "manual" && (
          <section className="mb-8 overflow-hidden rounded-2xl border border-secondary bg-primary p-6 shadow-sm">
            <h3 className="mb-4 font-display text-lg font-semibold">
              Jogadores Disponíveis
            </h3>
            <div className="space-y-2">
              {confirmedParticipants.map((p) => (
                <PlayerCard
                  key={p.id}
                  participant={p}
                  team="bench"
                  onMoveToTeam={handleMovePlayer}
                />
              ))}
            </div>
          </section>
        )}

        {isDrawn && (
          <section className="mb-8">
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-solid px-6 py-4 font-display text-sm font-bold uppercase tracking-wider text-primary_on-brand shadow-md shadow-brand-solid/20 transition-all active:scale-95 hover:bg-brand-solid_hover"
            >
              <CheckCircle className="size-5" style={{ fill: "currentColor" }} />
              Confirmar Times
            </button>
          </section>
        )}
      </main>
    </AppLayout>
  );
}

export default DrawTeamsPage;