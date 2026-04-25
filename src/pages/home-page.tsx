import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trophy01,
  Wallet01,
  User01,
  MarkerPin01,
  CheckCircle,
  Calendar,
  Plus,
  XCircle,
  Clock,
  ChevronRight,
  Link04,
} from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Avatar } from "@/components/base/avatar/avatar";
import { AppLayout } from "@/components/application/app-layout/app-layout";
import { useAuth } from "@/providers/auth-provider";
import { supabase } from "@/lib/supabase";
import {
  getNextPelada,
  getParticipants,
  joinPelada,
  declinePelada,
  formatDate,
  formatTime,
  getGreeting,
  type Pelada,
  type Participant,
} from "@/lib/peladas";
import { cx } from "@/utils/cx";

const STATUS_CONFIG: Record<
  string,
  { label: string; bgClass: string; textClass: string }
> = {
  confirmed: {
    label: "Confirmado",
    bgClass: "bg-success-primary",
    textClass: "text-success-primary",
  },
  declined: {
    label: "Não vou",
    bgClass: "bg-error-primary",
    textClass: "text-error-primary",
  },
  pending: {
    label: "Pendente",
    bgClass: "bg-warning-primary",
    textClass: "text-warning-primary",
  },
  guest: {
    label: "Convidado",
    bgClass: "bg-secondary",
    textClass: "text-secondary",
  },
};

function ParticipantRow({ participant }: { participant: Participant }) {
  const config = STATUS_CONFIG[participant.status] ?? STATUS_CONFIG.pending;
  const profile = participant.profile;

  return (
    <div className="flex items-center justify-between rounded-2xl border border-secondary bg-primary p-4">
      <div className="flex items-center gap-3">
        {profile?.avatar_url ? (
          <Avatar
            src={profile.avatar_url}
            alt={profile.name ?? ""}
            size="lg"
            rounded
          />
        ) : (
          <div className="flex size-12 items-center justify-center rounded-full bg-quaternary">
            <User01 className="size-5 text-fg-quaternary" />
          </div>
        )}
        <div>
          <p className="text-[15px] font-medium text-primary">
            {profile?.name ?? "Jogador"}
          </p>
          <p className="text-xs text-secondary">
            {profile?.positions?.join(", ") ?? ""}
          </p>
        </div>
      </div>
      <span
        className={cx(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-display text-[10px] font-bold uppercase",
          config.bgClass,
          config.textClass,
        )}
      >
        {config.label}
      </span>
    </div>
  );
}

function HomePage() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [nextPelada, setNextPelada] = useState<
    (Pelada & { confirmed_count: number }) | null
  >(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [userStatus, setUserStatus] = useState<
    "confirmed" | "pending" | "declined" | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteCode, setInviteCode] = useState("");

  useEffect(() => {
    async function fetch() {
      setIsLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      const pelada = await getNextPelada(session.user.id);
      setNextPelada(pelada);

      if (pelada) {
        const parts = await getParticipants(pelada.id);
        setParticipants(parts);
        const myPart = parts.find((p) => p.profile_id === session.user.id);
        if (myPart) {
          setUserStatus(myPart.status as "confirmed" | "pending" | "declined");
        }
      }
      setIsLoading(false);
    }
    fetch();
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!nextPelada || !profile) return;
    setIsActionLoading(true);
    const { error } = await joinPelada(nextPelada.id, profile.id);
    if (!error) {
      setUserStatus("confirmed");
      const parts = await getParticipants(nextPelada.id);
      setParticipants(parts);
      const pelada = {
        ...nextPelada,
        confirmed_count: (nextPelada.confirmed_count ?? 0) + 1,
      };
      setNextPelada(pelada);
    }
    setIsActionLoading(false);
  }, [nextPelada, profile]);

  const handleDecline = useCallback(async () => {
    if (!nextPelada || !profile) return;
    setIsActionLoading(true);
    const { error } = await declinePelada(nextPelada.id, profile.id);
    if (!error) {
      setUserStatus("declined");
    }
    setIsActionLoading(false);
  }, [nextPelada, profile]);

  const firstName = profile?.name?.split(" ")[0] ?? "Jogador";
  const confirmedList = participants.filter((p) => p.status === "confirmed");
  const friendList = participants
    .filter((p) => p.status !== "guest")
    .slice(0, 10);

  return (
    <AppLayout>

      <main className="mx-auto max-w-3xl space-y-8 px-4 pb-32 pt-20">
        <section className="space-y-1" aria-label="Saudação">
          <p className="font-display text-xs font-bold uppercase tracking-wider text-quaternary">
            {getGreeting()}, {firstName}
          </p>
          <h2 className="font-display text-2xl font-bold text-primary">
            Pronto para o jogo?
          </h2>
        </section>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="size-8 animate-spin rounded-full border-4 border-brand-solid border-t-transparent" />
          </div>
        ) : nextPelada ? (
          <>
            <section
              className="relative overflow-hidden rounded-3xl border border-primary/50 bg-primary shadow-[0_4px_20px_rgba(0,0,0,0.05)]"
              aria-label="Próxima pelada"
            >
              <div className="relative p-6">
                <div className="space-y-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-primary px-3 py-1 font-display text-[10px] font-bold uppercase text-brand-secondary">
                        Próxima Pelada
                      </span>
                      <h3 className="font-display text-2xl font-bold text-primary">
                        {nextPelada.name}
                      </h3>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-sm font-bold text-brand-secondary">
                        {formatDate(nextPelada.date)}
                      </p>
                      <p className="text-sm text-secondary">
                        <Clock className="mb-0.5 mr-1 inline size-3.5" />
                        {formatTime(nextPelada.start_time)} -{" "}
                        {formatTime(nextPelada.end_time)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-2xl bg-secondary p-3 text-secondary">
                    <MarkerPin01 className="size-5 text-fg-brand-secondary" />
                    <p className="truncate text-[15px] font-medium">
                      {nextPelada.location}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-display text-xs font-bold uppercase text-secondary">
                        Confirmados ({nextPelada.confirmed_count ?? 0}/
                        {nextPelada.max_players})
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/match-detail/${nextPelada.id}`)
                        }
                        className="flex items-center gap-1 rounded-lg bg-brand/10 px-3 py-1.5 font-display text-xs font-bold uppercase text-brand transition-colors hover:bg-brand/20"
                      >
                        Ver detalhes
                        <ChevronRight className="size-3" />
                      </button>
                    </div>
                    <div className="flex -space-x-3">
                      {confirmedList.slice(0, 5).map((p) => (
                        <div
                          key={p.id}
                          className="ring-2 size-10 rounded-full ring-primary"
                        >
                          {p.profile?.avatar_url ? (
                            <Avatar
                              src={p.profile.avatar_url}
                              alt={p.profile.name ?? ""}
                              size="md"
                              rounded
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center rounded-full bg-quaternary font-display text-xs font-bold text-secondary">
                              {(p.profile?.name ?? "?").charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      ))}
                      {nextPelada.confirmed_count > 5 && (
                        <div className="flex size-10 items-center justify-center rounded-full bg-quaternary font-display text-xs font-bold text-secondary ring-2 ring-primary">
                          +{nextPelada.confirmed_count - 5}
                        </div>
                      )}
                    </div>
                  </div>

                  {userStatus === "confirmed" ? (
                    <div className="flex items-center justify-center gap-2 rounded-2xl border border-success-primary bg-success-primary/10 px-4 py-3">
                      <CheckCircle className="size-5 text-success-primary" />
                      <span className="font-display text-sm font-bold text-success-primary">
                        Presença confirmada!
                      </span>
                    </div>
                  ) : userStatus === "declined" ? (
                    <Button
                      size="xl"
                      color="tertiary"
                      iconTrailing={CheckCircle}
                      isLoading={isActionLoading}
                      onClick={handleConfirm}
                      className="h-14 w-full rounded-2xl font-display text-lg"
                    >
                      Confirmar presença
                    </Button>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        size="xl"
                        color="primary"
                        iconLeading={CheckCircle}
                        isLoading={isActionLoading}
                        onClick={handleConfirm}
                        className="h-14 rounded-2xl font-display text-lg shadow-[0_8px_24px_rgba(16,185,129,0.2)]"
                      >
                        Vou jogar
                      </Button>
                      <Button
                        size="xl"
                        color="tertiary"
                        iconLeading={XCircle}
                        isLoading={isActionLoading}
                        onClick={handleDecline}
                        className="h-14 rounded-2xl font-display text-lg bg-quaternary"
                      >
                        Não vou
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {nextPelada.price && nextPelada.price > 0 && (
              <div className="flex items-center gap-3 rounded-2xl border border-secondary bg-primary p-4">
                <div className="flex size-10 items-center justify-center rounded-full bg-brand-primary/10">
                  <Wallet01 className="size-5 text-fg-brand-secondary" />
                </div>
                <div>
                  <p className="font-display text-[10px] font-bold uppercase text-quaternary">
                    Valor
                  </p>
                  <p className="font-display text-lg font-semibold text-primary">
                    R$ {Number(nextPelada.price).toFixed(2).replace(".", ",")}
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          <section className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-secondary bg-primary px-6 py-16 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-secondary">
              <Trophy01 className="size-8 text-fg-quaternary" />
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold text-primary">
              Nenhuma pelada agendada
            </h3>
            <p className="mt-1 text-sm text-tertiary">
              Crie uma pelada ou peça o código de convite para entrar.
            </p>
            <Button
              size="lg"
              color="primary"
              iconLeading={Plus}
              onClick={() => navigate("/create-match")}
              className="mt-6 rounded-2xl"
            >
              Criar pelada
            </Button>
          </section>
        )}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2" aria-label="Ações rápidas">
          <button
            type="button"
            onClick={() => navigate("/matches")}
            className="flex h-32 flex-col items-start justify-between rounded-3xl border border-secondary bg-primary p-5 shadow-sm transition-transform active:scale-95"
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-brand-primary text-fg-brand-primary">
              <Calendar className="size-5 text-primary" />
            </div>
            <p className="font-display text-sm font-semibold leading-tight text-primary">
              Ver todos os jogos
            </p>
          </button>
          <button
            type="button"
            onClick={() => navigate("/create-match")}
            className="flex h-32 flex-col items-start justify-between rounded-3xl bg-brand-solid p-5 shadow-md text-primary_on-brand transition-transform active:scale-95"
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-white/20">
              <Plus className="size-5" />
            </div>
            <p className="font-display text-sm font-semibold leading-tight">
              Criar nova pelada
            </p>
          </button>
        </section>

        <section>
          <button
            type="button"
            onClick={() => setShowInviteModal(true)}
            className="flex w-full items-center gap-3 rounded-2xl border-2 border-dashed border-brand-solid/30 bg-brand-solid/5 p-4 transition-colors hover:bg-brand-solid/10 active:scale-[0.98]"
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-brand-primary/20">
              <Link04 className="size-5 text-fg-brand-secondary" />
            </div>
            <div className="text-left">
              <p className="font-display text-sm font-semibold text-primary">
                Entrar com código
              </p>
              <p className="text-xs text-secondary">
                Digite o código de convite para participar de uma pelada
              </p>
            </div>
          </button>
        </section>

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

        {friendList.length > 0 && (
          <section className="space-y-4" aria-label="Status dos jogadores">
            <h3 className="font-display text-lg font-semibold text-primary">
              Jogadores da pelada
            </h3>
            <div className="space-y-3">
              {friendList.map((participant) => (
                <ParticipantRow
                  key={participant.id}
                  participant={participant}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </AppLayout>
  );
}

export default HomePage;
