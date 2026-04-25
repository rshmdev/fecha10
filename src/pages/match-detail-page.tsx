import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Wallet01,
  User01,
  MarkerPin01,
  Clock,
  CheckCircle,
  XCircle,
  Settings01,
  Shuffle01,
  UserEdit,
  AlertHexagon,
  Share07,
  Copy01,
} from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { AppLayout } from "@/components/application/app-layout/app-layout";
import { PeladaNotes } from "@/components/application/pelada-notes/pelada-notes";
import { useAuth } from "@/providers/auth-provider";
import {
  getUserRole,
  getPeladaById,
  getParticipants,
  joinPelada,
  declinePelada,
  type Pelada,
  type Participant,
} from "@/lib/peladas";
import {
  notifyAdminPlayerJoined,
  notifyAdminPlayerDeclined,
} from "@/lib/notifications";
import { supabase } from "@/lib/supabase";
import { cx } from "@/utils/cx";

type TabKey = "confirmed" | "declined" | "pending";

const POSITION_BADGE_COLORS: Record<string, string> = {
  Zagueiro: "bg-brand-primary text-brand-secondary",
  "Meio-campo": "bg-brand-primary text-brand-secondary",
  Atacante: "bg-secondary text-secondary",
  Goleiro: "bg-brand-primary text-brand-secondary",
};

function PlayerRow({ participant }: { participant: Participant }) {
  const profile = participant.profile;
  const name = profile?.name ?? "Jogador";
  const avatar = profile?.avatar_url;
  const isPaid = participant.payment_status === "paid";
  const position = profile?.positions?.[0] ?? "Jogador";

  return (
    <div className="flex items-center justify-between rounded-2xl border border-black/5 bg-primary p-3 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="relative">
          {avatar ? (
            <Avatar src={avatar} alt={name} size="lg" rounded />
          ) : (
            <div className="flex size-12 items-center justify-center rounded-full bg-quaternary">
              <User01 className="size-5 text-fg-quaternary" />
            </div>
          )}
          {participant.status === "confirmed" && (
            <div className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full border-2 border-primary bg-success-solid">
              <svg
                className="size-3 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="min-w-0 truncate font-display text-lg font-semibold text-primary">
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
              POSITION_BADGE_COLORS[position] ?? "bg-secondary text-secondary",
            )}
          >
            {position}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isPaid ? (
          <>
            <Wallet01
              className="size-4 text-fg-success-primary"
              style={{ fill: "currentColor" }}
            />
            <span className="font-display text-[10px] font-bold uppercase text-success-primary">
              Pago
            </span>
          </>
        ) : (
          <>
            <Wallet01 className="size-4 text-fg-quaternary" />
            <span className="font-display text-[10px] font-bold uppercase text-quaternary">
              Pendente
            </span>
          </>
        )}
      </div>
    </div>
  );
}

function MatchDetailPage() {
  const navigate = useNavigate();
  const { peladaId } = useParams();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>("confirmed");
  const [isAdmin, setIsAdmin] = useState(false);
  const [pelada, setPelada] = useState<Pelada | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userStatus, setUserStatus] = useState<
    "confirmed" | "pending" | "declined" | "guest" | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const currentPeladaId = peladaId ?? "mock-pelada-id";

  useEffect(() => {
    if (!currentPeladaId || currentPeladaId === "test-pelada-id") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      const peladaData = await getPeladaById(currentPeladaId);
      setPelada(peladaData);

      const participantsData = await getParticipants(currentPeladaId);
      setParticipants(participantsData);

      if (profile?.id) {
        const role = await getUserRole(currentPeladaId, profile.id);
        setIsAdmin(role.isAdmin);

        const currentUser = participantsData.find(
          (p) => p.profile_id === profile.id,
        );
        if (currentUser) {
          setUserStatus(currentUser.status);
        }
      }

      setIsLoading(false);
    };

    fetchData();
  }, [currentPeladaId, profile?.id]);

  const handleJoin = async () => {
    if (!profile?.id || isSubmitting || userStatus === "confirmed") return;
    setIsSubmitting(true);

    if (userStatus === "declined" || userStatus === "pending") {
      await declinePelada(currentPeladaId, profile.id);
    }

    const result = await joinPelada(currentPeladaId, profile.id);

    if (!result.error) {
      const participantsData = await getParticipants(currentPeladaId);
      setParticipants(participantsData);
      const currentUser = participantsData.find(
        (p) => p.profile_id === profile.id,
      );
      if (currentUser) {
        setUserStatus(currentUser.status);
      }
      notifyAdminPlayerJoined(
        pelada?.admin_id ?? "",
        profile.name ?? "Jogador",
        pelada?.name ?? "",
        currentPeladaId,
      );
    }
    setIsSubmitting(false);
  };

  const handleDecline = async () => {
    if (!profile?.id || isSubmitting || userStatus === "declined") return;
    setIsSubmitting(true);

    if (userStatus === "confirmed" || userStatus === "pending") {
      const { error } = await supabase
        .from("participants")
        .update({ status: "declined" })
        .eq("pelada_id", currentPeladaId)
        .eq("profile_id", profile.id);
      if (error) {
        console.error("Error declining:", error);
      }
    } else if (userStatus === null) {
      await supabase.from("participants").insert({
        pelada_id: currentPeladaId,
        profile_id: profile.id,
        status: "declined",
      });
    }

    const participantsData = await getParticipants(currentPeladaId);
    setParticipants(participantsData);
    const currentUser = participantsData.find(
      (p) => p.profile_id === profile.id,
    );
    if (currentUser) {
      setUserStatus(currentUser.status);
    } else {
      setUserStatus(null);
    }
    setIsSubmitting(false);
    notifyAdminPlayerDeclined(
      pelada?.admin_id ?? "",
      profile.name ?? "Jogador",
      pelada?.name ?? "",
      currentPeladaId,
    );
  };

  const confirmedCount = participants.filter(
    (p) => p.status === "confirmed",
  ).length;
  const pendingCount = participants.filter(
    (p) => p.status === "pending",
  ).length;
  const declinedCount = participants.filter(
    (p) => p.status === "declined",
  ).length;

  const appBaseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
  const inviteLink = pelada ? `${appBaseUrl}/join/${pelada.invite_code}` : "";
  const shareText = pelada
    ? `Venha jogar! 🏟️\n${pelada.name}\n📅 ${pelada.date} às ${pelada.start_time.slice(0, 5)}\n📍 ${pelada.location}${pelada.price ? `\n💰 R$ ${pelada.price.toFixed(2).replace(".", ",")}` : ""}\n\nEntre pelo link: ${inviteLink}`
    : "";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = shareText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Pelada: ${pelada?.name}`,
          text: shareText,
          url: inviteLink,
        });
      } catch {
        setShowShareModal(true);
      }
    } else {
      setShowShareModal(true);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <div className="size-8 animate-spin rounded-full border-2 border-brand-solid border-t-transparent" />
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
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-4">
        <div className="mb-6 overflow-hidden rounded-2xl bg-primary shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
          <div className="relative h-32 overflow-hidden bg-brand-solid">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.2),transparent)]" />
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB1Lgwes2PJSqYtGUfzN_L9OrcXq7YjQPjKOvl800S2VDsfbmsxB2ccAiZoAaA4QzbsE03YbRjsecBG9oJKIxIO8watvXKZ1SboGmoJIeWGsKIMQm4q3QRm2_hv9KwW2MgCBVuRTUj8gwbHsmXC5Gt2zgiDL7o_oqgA8GhyJ4BxTMBLfWfizjkRGBtrFpb1ed6m7vpq2h2UzT82xQnAF0C-IFlDLZ0Sieq8Mx6lB31Thf95E0p7zrWpp2ujFAPGVwD3u4wjg1Th8hs"
              alt="Campo de futebol"
              className="h-full w-full object-cover mix-blend-overlay"
            />
            <div className="absolute bottom-4 left-4">
              <span className="inline-block rounded-full border border-white/30 bg-white/20 px-2 py-1 font-display text-[10px] font-bold uppercase tracking-widest text-primary_on-brand backdrop-blur-md">
                Próxima Pelada
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-4 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-2xl font-bold text-primary">
                  {pelada.name}
                </h2>
                <div className="mt-1 flex items-center gap-1 text-secondary min-w-0">
                  <MarkerPin01 className="size-[18px] shrink-0" />
                  <span className="truncate text-[15px] font-medium">
                    {pelada.location}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-center rounded-xl bg-secondary px-3 py-1">
                <span className="font-display text-[10px] font-bold uppercase text-secondary">
                  VAGAS
                </span>
                <span className="font-display text-xl font-bold text-primary">
                  {pelada.max_players - confirmedCount}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl bg-secondary p-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-brand-primary/20 text-fg-brand-secondary">
                  <Clock className="size-5" />
                </div>
                <div>
                  <p className="font-display text-[10px] font-bold uppercase text-quaternary">
                    Horário
                  </p>
                  <p className="font-display text-lg font-semibold text-primary">
                    {pelada.start_time.slice(0, 5)} -{" "}
                    {pelada.end_time.slice(0, 5)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-secondary p-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-brand-primary/20 text-fg-brand-secondary">
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
          </div>
        </div>

        <div className="mb-6 flex items-center gap-2">
          <AlertHexagon className="size-5 text-fg-brand-secondary" />
          <h3 className="font-display text-xs font-bold uppercase tracking-widest text-quaternary">
            Avisos
          </h3>
        </div>
        <div className="mb-8 rounded-2xl bg-primary p-4 shadow-sm">
          <PeladaNotes peladaId={currentPeladaId} isAdmin={isAdmin} />
        </div>

        <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4">
          <button
            type="button"
            disabled={userStatus === "confirmed" || isSubmitting}
            onClick={handleJoin}
            className={cx(
              "flex h-14 items-center justify-center gap-2 rounded-xl font-display text-lg font-semibold shadow-lg shadow-brand-solid/20 transition-transform active:scale-95",
              userStatus === "confirmed"
                ? "bg-brand-primary text-brand-secondary cursor-not-allowed opacity-50"
                : "bg-brand-solid text-primary_on-brand hover:bg-brand-solid_hover",
            )}
          >
            <CheckCircle className="size-5" style={{ fill: "currentColor" }} />
            {userStatus === "confirmed" ? "Confirmado" : "Vou jogar"}
          </button>
          <button
            type="button"
            disabled={userStatus === "declined" || isSubmitting}
            onClick={handleDecline}
            className={cx(
              "flex h-14 items-center justify-center gap-2 rounded-xl font-display text-lg font-semibold transition-transform active:scale-95",
              userStatus === "declined"
                ? "bg-error-secondary text-error-primary cursor-not-allowed opacity-50"
                : "bg-quaternary text-primary hover:bg-quaternary/80",
            )}
          >
            <XCircle className="size-5" />
            {userStatus === "declined" ? "Recusado" : "Não vou"}
          </button>
        </div>

        <div className="mb-8">
          <button
            type="button"
            onClick={handleShare}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-brand-solid bg-brand-solid/5 py-3 font-display text-sm font-bold uppercase tracking-wider text-brand-secondary transition-colors hover:bg-brand-solid/10 active:scale-95"
          >
            <Share07 className="size-5" />
            Compartilhar Convite
          </button>
        </div>

        {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowShareModal(false)}>
            <div className="w-full max-w-md rounded-2xl bg-primary p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-lg font-bold text-primary">
                  Compartilhar Convite
                </h3>
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  className="rounded-full p-1 text-fg-quaternary transition-colors hover:bg-secondary"
                >
                  <XCircle className="size-5" />
                </button>
              </div>

              <p className="mb-4 text-sm text-secondary">
                Envie o link ou código de convite para seus amigos entrarem nesta pelada.
              </p>

              <div className="mb-4 rounded-xl bg-secondary p-4">
                <p className="mb-1 font-display text-[10px] font-bold uppercase tracking-widest text-quaternary">
                  Código de Convite
                </p>
                <p className="font-display text-xl font-bold break-all text-brand-secondary">
                  {pelada?.invite_code}
                </p>
              </div>

              <div className="mb-4 rounded-xl bg-secondary p-4">
                <p className="mb-1 font-display text-[10px] font-bold uppercase tracking-widest text-quaternary">
                  Link de Convite
                </p>
                <p className="break-all text-sm text-primary">
                  {inviteLink}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={cx(
                    "flex flex-1 items-center justify-center gap-2 rounded-xl py-3 font-display text-sm font-bold uppercase tracking-wider transition-all active:scale-95",
                    copiedToClipboard
                      ? "bg-success-solid text-white"
                      : "bg-brand-solid text-primary_on-brand hover:bg-brand-solid_hover",
                  )}
                >
                  <Copy01 className="size-5" />
                  {copiedToClipboard ? "Copiado!" : "Copiar Link"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  className="flex-1 rounded-xl border-2 border-secondary py-3 font-display text-sm font-bold uppercase tracking-wider text-secondary transition-colors hover:bg-secondary active:scale-95"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {isAdmin && (
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <Settings01 className="size-5 text-fg-brand-secondary" />
            <h3 className="font-display text-xs font-bold uppercase tracking-widest text-quaternary">
              Ações do Organizador
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => navigate(`/draw-teams/${currentPeladaId}`)}
              className="flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-secondary text-secondary font-medium transition-colors hover:bg-secondary"
            >
              <Shuffle01 className="size-5" />
              Sortear times
            </button>
            <button
              type="button"
              onClick={() => navigate(`/draw-teams/${currentPeladaId}?mode=manual`)}
              className="flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-secondary text-secondary font-medium transition-colors hover:bg-secondary"
            >
              <UserEdit className="size-5" />
              Dividir manualmente
            </button>
          </div>
        </div>
      )}

        <div className="flex flex-col">
<div className="mb-4 flex overflow-x-auto border-b border-quaternary scrollbar-hide">
            <button
              type="button"
              onClick={() => setActiveTab("confirmed")}
              className={cx(
              "flex-1 whitespace-nowrap px-2 py-3 font-display text-[11px] font-bold uppercase tracking-wider transition-colors sm:text-xs",
              activeTab === "confirmed"
                ? "border-b-2 border-brand-solid text-brand-secondary"
                : "text-quaternary hover:text-secondary",
            )}
            >
              Confirmados ({confirmedCount})
            </button>
<button
              type="button"
              onClick={() => setActiveTab("pending")}
              className={cx(
              "flex-1 whitespace-nowrap px-2 py-3 font-display text-[11px] font-bold uppercase tracking-wider transition-colors sm:text-xs",
              activeTab === "pending"
                ? "border-b-2 border-brand-solid text-brand-secondary"
                : "text-quaternary hover:text-secondary",
            )}
            >
              Pendentes ({pendingCount})
            </button>
<button
              type="button"
              onClick={() => setActiveTab("declined")}
              className={cx(
              "flex-1 whitespace-nowrap px-2 py-3 font-display text-[11px] font-bold uppercase tracking-wider transition-colors sm:text-xs",
              activeTab === "declined"
                ? "border-b-2 border-brand-solid text-brand-secondary"
                : "text-quaternary hover:text-secondary",
            )}
            >
              Recusados ({declinedCount})
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {activeTab === "confirmed" &&
              participants
                .filter((p) => p.status === "confirmed")
                .map((player) => (
                  <PlayerRow key={player.id} participant={player} />
                ))}
            {activeTab === "pending" &&
              participants
                .filter((p) => p.status === "pending")
                .map((player) => (
                  <PlayerRow key={player.id} participant={player} />
                ))}
            {activeTab === "declined" &&
              participants
                .filter((p) => p.status === "declined")
                .map((player) => (
                  <PlayerRow key={player.id} participant={player} />
                ))}
            {((activeTab === "confirmed" &&
              !participants.some((p) => p.status === "confirmed")) ||
              (activeTab === "pending" &&
                !participants.some((p) => p.status === "pending")) ||
              (activeTab === "declined" &&
                !participants.some((p) => p.status === "declined"))) && (
              <p className="py-8 text-center text-sm text-quaternary">
                Nenhum jogador nesta categoria.
              </p>
            )}
          </div>
        </div>
      </main>
    </AppLayout>
  );
}

export default MatchDetailPage;
