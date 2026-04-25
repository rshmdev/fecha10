import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  MarkerPin01,
  Clock,
  Wallet01,
  Users01,
  CheckCircle,
  XCircle,
  User01,
  Trophy01,
} from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { AppLayout } from "@/components/application/app-layout/app-layout";
import { useAuth } from "@/providers/auth-provider";
import {
  getPeladaByInviteCode,
  getParticipants,
  joinPelada,
  formatDate,
  formatTime,
  type Pelada,
  type Participant,
} from "@/lib/peladas";
import { cx } from "@/utils/cx";
import {
  notifyAdminPlayerJoined,
} from "@/lib/notifications";

function JoinPage() {
  const navigate = useNavigate();
  const { inviteCode } = useParams();
  const { profile, isAuthenticated } = useAuth();

  const [pelada, setPelada] = useState<Pelada | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState(false);

  useEffect(() => {
    const fetchPelada = async () => {
      if (!inviteCode) {
        setIsLoading(false);
        return;
      }

      const peladaData = await getPeladaByInviteCode(inviteCode);
      if (!peladaData) {
        setError("Pelada não encontrada. Verifique o código de convite.");
        setIsLoading(false);
        return;
      }

      if (peladaData.status === "cancelled") {
        setError("Esta pelada foi cancelada.");
        setIsLoading(false);
        return;
      }

      setPelada(peladaData);

      const participantsData = await getParticipants(peladaData.id);
      setParticipants(participantsData);

      setIsLoading(false);
    };

    fetchPelada();
  }, [inviteCode]);

  const confirmedCount = participants.filter(
    (p) => p.status === "confirmed",
  ).length;
  const isFull = pelada ? confirmedCount >= pelada.max_players : false;

  const handleJoin = async () => {
    if (!profile?.id || !pelada || isJoining) return;

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    setIsJoining(true);

    const existingParticipant = participants.find(
      (p) => p.profile_id === profile.id,
    );

    if (existingParticipant) {
      if (existingParticipant.status === "confirmed") {
        navigate(`/match-detail/${pelada.id}`);
        setIsJoining(false);
        return;
      }
      if (existingParticipant.status === "declined") {
        const { error: updateError } = await joinPelada(
          pelada.id,
          profile.id,
        );
        if (updateError) {
          setError("Erro ao confirmar participação. Tente novamente.");
          setIsJoining(false);
          return;
        }
      }
    } else {
      const result = await joinPelada(pelada.id, profile.id);
      if (result.error) {
        setError("Erro ao entrar na pelada. Tente novamente.");
        setIsJoining(false);
        return;
      }
    }

    const updatedParticipants = await getParticipants(pelada.id);
    setParticipants(updatedParticipants);
    setJoinSuccess(true);
    setIsJoining(false);
    notifyAdminPlayerJoined(
      pelada.admin_id,
      profile?.name ?? "Jogador",
      pelada.name,
      pelada.id,
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <div className="size-8 animate-spin rounded-full border-4 border-brand-solid border-t-transparent" />
      </div>
    );
  }

  if (error && !pelada) {
    return (
      <AppLayout
        topAppBarProps={{
          leading: (
            <button
              type="button"
              onClick={() => navigate("/home")}
              className="rounded-full p-2 text-fg-quaternary transition-colors hover:bg-primary_hover active:scale-95"
            >
              <ArrowLeft className="size-5" />
            </button>
          ),
        }}
      >
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-4">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-error-secondary">
              <XCircle className="size-8 text-error-primary" />
            </div>
            <h2 className="font-display text-xl font-bold text-primary">
              Convite inválido
            </h2>
            <p className="mt-2 text-sm text-secondary">{error}</p>
            <button
              type="button"
              onClick={() => navigate("/home")}
              className="mt-6 rounded-xl bg-brand-solid px-6 py-3 font-display text-sm font-bold text-primary_on-brand shadow-md transition-transform active:scale-95"
            >
              Voltar para Home
            </button>
          </div>
        </main>
      </AppLayout>
    );
  }

  if (!pelada) return null;

  if (joinSuccess) {
    return (
      <AppLayout
        topAppBarProps={{
          leading: (
            <button
              type="button"
              onClick={() => navigate(`/match-detail/${pelada.id}`)}
              className="rounded-full p-2 text-fg-quaternary transition-colors hover:bg-primary_hover active:scale-95"
            >
              <ArrowLeft className="size-5" />
            </button>
          ),
        }}
      >
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-4">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-success-secondary">
              <CheckCircle className="size-8 text-success-primary" style={{ fill: "currentColor" }} />
            </div>
            <h2 className="font-display text-xl font-bold text-primary">
              Você está dentro!
            </h2>
            <p className="mt-2 text-sm text-secondary">
              Sua participação foi confirmada em{" "}
              <span className="font-semibold text-primary">{pelada.name}</span>.
            </p>
            <button
              type="button"
              onClick={() => navigate(`/match-detail/${pelada.id}`)}
              className="mt-6 rounded-xl bg-brand-solid px-6 py-3 font-display text-sm font-bold text-primary_on-brand shadow-md transition-transform active:scale-95"
            >
              Ver Pelada
            </button>
          </div>
        </main>
      </AppLayout>
    );
  }

  const confirmedPlayers = participants.filter(
    (p) => p.status === "confirmed",
  );

  return (
    <AppLayout
      topAppBarProps={{
        leading: (
          <button
            type="button"
            onClick={() => navigate("/home")}
            className="rounded-full p-2 text-fg-quaternary transition-colors hover:bg-primary_hover active:scale-95"
          >
            <ArrowLeft className="size-5" />
          </button>
        ),
      }}
    >
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-4">
        <section className="mb-6 mt-4 text-center">
          <div className="mb-3 mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-primary/20">
            <Trophy01 className="size-7 text-fg-brand-secondary" />
          </div>
          <h1 className="font-display text-2xl font-bold text-primary">
            Convite de Pelada
          </h1>
          <p className="mt-1 text-sm text-secondary">
            Você foi convidado para participar!
          </p>
        </section>

        <div className="mb-6 overflow-hidden rounded-2xl bg-primary shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
          <div className="relative h-24 overflow-hidden bg-brand-solid">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.15),transparent)]" />
            <div className="absolute bottom-3 left-4 right-4">
              <h2 className="truncate font-display text-xl font-bold text-primary_on-brand">
                {pelada.name}
              </h2>
            </div>
          </div>

          <div className="flex flex-col gap-4 p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl bg-secondary p-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-primary/20 text-fg-brand-secondary">
                  <Clock className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-display text-[10px] font-bold uppercase text-quaternary">
                    Data
                  </p>
                  <p className="font-display text-sm font-semibold text-primary">
                    {formatDate(pelada.date)}
                  </p>
                  <p className="font-display text-xs text-secondary">
                    {formatTime(pelada.start_time)} - {formatTime(pelada.end_time)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-secondary p-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-primary/20 text-fg-brand-secondary">
                  <MarkerPin01 className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-display text-[10px] font-bold uppercase text-quaternary">
                    Local
                  </p>
                  <p className="truncate font-display text-sm font-semibold text-primary">
                    {pelada.location}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl bg-secondary p-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-primary/20 text-fg-brand-secondary">
                  <Users01 className="size-5" />
                </div>
                <div>
                  <p className="font-display text-[10px] font-bold uppercase text-quaternary">
                    Jogadores
                  </p>
                  <p className="font-display text-lg font-semibold text-primary">
                    {confirmedCount}/{pelada.max_players}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-secondary p-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-primary/20 text-fg-brand-secondary">
                  <Wallet01 className="size-5" />
                </div>
                <div>
                  <p className="font-display text-[10px] font-bold uppercase text-quaternary">
                    Custo
                  </p>
                  <p className="font-display text-lg font-semibold text-primary">
                    {pelada.price
                      ? `R$ ${pelada.price.toFixed(2).replace(".", ",")}`
                      : "Grátis"}
                  </p>
                </div>
              </div>
            </div>

            {confirmedPlayers.length > 0 && (
              <div className="mt-1">
                <p className="mb-2 font-display text-[10px] font-bold uppercase tracking-widest text-quaternary">
                  Confirmados
                </p>
                <div className="flex -space-x-2">
                  {confirmedPlayers.slice(0, 8).map((p) => (
                    <div key={p.id} className="ring-2 ring-primary">
                      {p.profile?.avatar_url ? (
                        <Avatar
                          src={p.profile.avatar_url}
                          alt={p.profile?.name ?? ""}
                          size="sm"
                          rounded
                        />
                      ) : (
                        <div className="flex size-8 items-center justify-center rounded-full bg-quaternary">
                          <User01 className="size-4 text-fg-quaternary" />
                        </div>
                      )}
                    </div>
                  ))}
                  {confirmedPlayers.length > 8 && (
                    <div className="flex size-8 items-center justify-center rounded-full bg-secondary font-display text-[10px] font-bold text-secondary">
                      +{confirmedPlayers.length - 8}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {isFull && (
          <div className="mb-6 rounded-xl bg-warning-secondary p-4 text-center">
            <p className="font-display text-sm font-bold text-warning-primary">
              Esta pelada está lotada!
            </p>
            <p className="mt-1 text-xs text-secondary">
              Todos os lugares foram preenchidos, mas você pode entrar na lista de espera.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl bg-error-secondary p-4 text-center">
            <p className="font-display text-sm font-bold text-error-primary">
              {error}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled={isJoining}
            onClick={handleJoin}
            className={cx(
              "flex h-14 items-center justify-center gap-2 rounded-xl font-display text-lg font-semibold shadow-lg shadow-brand-solid/20 transition-transform active:scale-95",
              isFull
                ? "bg-warning-solid text-white hover:bg-warning-solid/90"
                : "bg-brand-solid text-primary_on-brand hover:bg-brand-solid/90",
            )}
          >
            {isJoining ? (
              <div className="size-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <CheckCircle className="size-5" style={{ fill: "currentColor" }} />
                {isFull ? "Lista de Espera" : "Vou Jogar!"}
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate("/home")}
            className="flex h-14 items-center justify-center gap-2 rounded-xl bg-quaternary font-display text-lg font-semibold text-primary transition-transform active:scale-95 hover:bg-quaternary/80"
          >
            Agora Não
          </button>
        </div>
      </main>
    </AppLayout>
  );
}

export default JoinPage;