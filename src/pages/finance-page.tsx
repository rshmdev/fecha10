/* eslint-disable react-hooks/set-state-in-effect */
import {
  Wallet01,
  FilterLines,
  XClose,
  Trash01,
  Repeat01,
  Calendar,
  CheckCircle,
  QrCode01,
  Copy01,
} from "@untitledui/icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { Avatar } from "@/components/base/avatar/avatar";
import { AppLayout } from "@/components/application/app-layout/app-layout";
import { useAuth } from "@/providers/auth-provider";
import {
  getAdminPeladas,
  getFinanceParticipants,
  computeFinanceSummary,
  markAsPaid,
  markAsUnpaid,
  removeParticipant,
  setParticipantPaymentType,
  getCurrentMonth,
  formatCurrency,
  formatMonthLabel,
  type Pelada,
  type FinanceParticipant,
  type FinanceSummary,
} from "@/lib/peladas";
import { cx } from "@/utils/cx";
import {
  notifyPaymentConfirmed,
  notifyPaymentReverted,
  notifyPlayerRemoved,
} from "@/lib/notifications";

function FinancePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { deviceId } = useAuth();
  const [adminPeladas, setAdminPeladas] = useState<Pelada[]>([]);
  const [selectedPeladaId, setSelectedPeladaId] = useState<string | null>(
    searchParams.get("pelada") ?? null,
  );
  const [participants, setParticipants] = useState<FinanceParticipant[]>([]);
  const [summary, setSummary] = useState<FinanceSummary>({
    totalExpected: 0,
    totalCollected: 0,
    totalPending: 0,
    participantCount: 0,
    paidCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "paid" | "pending">("all");
  const [showPixModal, setShowPixModal] = useState(false);

  const currentMonth = getCurrentMonth();

  const selectedPelada = adminPeladas.find((p) => p.id === selectedPeladaId);

  const loadAdminPeladas = useCallback(async () => {
    if (!deviceId) return;
    const peladas = await getAdminPeladas(deviceId);
    setAdminPeladas(peladas);
    if (peladas.length > 0 && !selectedPeladaId) {
      setSelectedPeladaId(peladas[0].id);
    }
    setIsLoading(false);
  }, [deviceId, selectedPeladaId]);

  const loadParticipants = useCallback(async () => {
    if (!selectedPeladaId) {
      setParticipants([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const pelada = adminPeladas.find((p) => p.id === selectedPeladaId);
    const price = pelada?.price ?? 0;
    const data = await getFinanceParticipants(selectedPeladaId, currentMonth);
    setParticipants(data);
    setSummary(computeFinanceSummary(data, price, currentMonth));
    setIsLoading(false);
  }, [selectedPeladaId, adminPeladas, currentMonth]);

  useEffect(() => {
    loadAdminPeladas();
  }, [loadAdminPeladas]);

  useEffect(() => {
    loadParticipants();
  }, [loadParticipants]);

  const handleMarkPaid = useCallback(
    async (participant: FinanceParticipant) => {
      if (!selectedPeladaId || !selectedPelada) return;
      const amount = selectedPelada.price ?? 0;
      const { error } = await markAsPaid(
        selectedPeladaId,
        participant.profile_id,
        participant.payment_type,
        amount,
        currentMonth,
      );
      if (!error) {
        loadParticipants();
        notifyPaymentConfirmed(
          participant.profile_id,
          selectedPelada.name,
          selectedPeladaId,
        );
      }
    },
    [selectedPeladaId, selectedPelada, currentMonth, loadParticipants],
  );

  const handleMarkUnpaid = useCallback(
    async (participant: FinanceParticipant) => {
      if (!selectedPeladaId) return;
      const { error } = await markAsUnpaid(
        selectedPeladaId,
        participant.profile_id,
        participant.payment_type,
        currentMonth,
      );
      if (!error) {
        loadParticipants();
        notifyPaymentReverted(
          participant.profile_id,
          selectedPelada?.name ?? "",
          selectedPeladaId,
        );
      }
    },
    [selectedPeladaId, currentMonth, loadParticipants, selectedPelada],
  );

  const handleRemove = useCallback(
    async (profileId: string) => {
      if (!selectedPeladaId) return;
      const { error } = await removeParticipant(selectedPeladaId, profileId);
      if (!error) {
        loadParticipants();
        if (selectedPelada) {
          notifyPlayerRemoved(profileId, selectedPelada.name, selectedPeladaId);
        }
      }
    },
    [selectedPeladaId, loadParticipants, selectedPelada],
  );

  const handleTogglePaymentType = useCallback(
    async (participant: FinanceParticipant) => {
      if (!selectedPeladaId) return;
      const newType =
        participant.payment_type === "monthly" ? "session" : "monthly";
      const { error } = await setParticipantPaymentType(
        selectedPeladaId,
        participant.profile_id,
        newType,
      );
      if (!error) loadParticipants();
    },
    [selectedPeladaId, loadParticipants],
  );

  const visibleParticipants = participants.filter((p) => {
    if (filter === "all") return true;
    if (filter === "paid")
      return p.payment_status === "exempt" || isPaid(p, currentMonth);
    if (filter === "pending")
      return p.payment_status !== "exempt" && !isPaid(p, currentMonth);
    return true;
  });

  const progressPct =
    summary.totalExpected > 0
      ? Math.round((summary.totalCollected / summary.totalExpected) * 100)
      : 0;

  if (adminPeladas.length === 0 && !isLoading) {
    return (
      <AppLayout>
        <main className="mx-auto flex flex-1 flex-col items-center justify-center px-4 pb-28 pt-24 text-center">
          <Wallet01 className="mx-auto mb-4 size-16 text-fg-quaternary" />
          <h2 className="font-display text-2xl font-bold text-primary">
            Finanças
          </h2>
          <p className="mt-2 max-w-xs text-secondary">
            Você precisa ser administrador de uma pelada para gerenciar as
            finanças.
          </p>
          <button
            type="button"
            onClick={() => navigate("/matches")}
            className="mt-6 rounded-2xl bg-brand-solid px-6 py-3 font-display font-semibold text-primary_on-brand shadow-[0_8px_24px_rgba(16,185,129,0.2)] transition-all active:scale-95"
          >
            Ver minhas peladas
          </button>
        </main>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <main className="mx-auto w-full max-w-lg flex-1 px-5 pb-28 pt-20">
        {adminPeladas.length > 1 && (
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            {adminPeladas.map((pelada) => (
              <button
                key={pelada.id}
                type="button"
                onClick={() => setSelectedPeladaId(pelada.id)}
                className={cx(
                  "shrink-0 rounded-full px-4 py-2 font-display text-sm font-semibold transition-all",
                  selectedPeladaId === pelada.id
                    ? "bg-brand-solid text-primary_on-brand shadow-md"
                    : "bg-primary text-secondary ring-1 ring-secondary hover:bg-secondary_hover",
                )}
              >
                {pelada.name}
              </button>
            ))}
          </div>
        )}

        {selectedPelada && (
          <>
            <section className="mb-6" aria-label="Resumo financeiro">
              <div className="relative overflow-hidden rounded-2xl bg-primary p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
                <div className="absolute -right-4 -top-4 size-24 rounded-full bg-brand-solid/10 blur-2xl" />

                <p className="mb-1 font-display text-xs font-bold uppercase tracking-wider text-secondary">
                  {selectedPelada.name}
                </p>
                <p className="mb-3 font-display text-[10px] font-bold uppercase text-quaternary">
                  {formatMonthLabel(currentMonth)}
                </p>

                <div className="mb-2 flex items-baseline gap-2">
                  <span className="font-display text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">
                    {formatCurrency(summary.totalCollected)}
                  </span>
                  <span className="text-sm font-bold text-brand-secondary">
                    {summary.paidCount}/{summary.participantCount} pagaram
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-quaternary pt-4">
                  <div>
                    <p className="font-display text-[10px] font-bold uppercase text-secondary">
                      Arrecadado
                    </p>
                    <p className="font-display text-lg font-semibold text-success-primary">
                      {formatCurrency(summary.totalCollected)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-[10px] font-bold uppercase text-secondary">
                      Pendente
                    </p>
                    <p className="font-display text-lg font-semibold text-error-primary">
                      {formatCurrency(summary.totalPending)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-quaternary">
                  <div
                    className="h-full rounded-full bg-brand-solid transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <p className="mt-2 text-center font-display text-xs font-bold text-quaternary">
                  {progressPct}% arrecadado
                </p>

                <button
                  type="button"
                  onClick={() => setShowPixModal(true)}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-brand-solid/30 py-2.5 font-display text-xs font-bold text-brand-secondary transition-colors hover:bg-brand-solid/10"
                >
                  <QrCode01 className="size-4" />
                  Compartilhar QR Code PIX
                </button>
              </div>
            </section>

            <section aria-label="Lista de pagamentos">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-primary">
                  Participantes
                </h2>
                <div className="flex items-center gap-1">
                  {(["all", "paid", "pending"] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFilter(f)}
                      className={cx(
                        "rounded-full px-3 py-1 font-display text-xs font-bold transition-all",
                        filter === f
                          ? "bg-brand-solid text-primary_on-brand"
                          : "bg-secondary text-secondary hover:bg-secondary_hover",
                      )}
                    >
                      {f === "all"
                        ? "Todos"
                        : f === "paid"
                          ? "Pagos"
                          : "Pendentes"}
                    </button>
                  ))}
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="size-8 animate-spin rounded-full border-4 border-brand-solid border-t-transparent" />
                </div>
              ) : visibleParticipants.length === 0 ? (
                <div className="rounded-2xl bg-primary p-8 text-center shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
                  <p className="font-display text-base font-semibold text-secondary">
                    {filter === "paid"
                      ? "Ninguém pagou ainda"
                      : "Nenhum participante pendente"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {visibleParticipants.map((participant) => {
                    const paid =
                      participant.payment_status === "exempt" ||
                      isPaid(participant, currentMonth);
                    const participantPrice = selectedPelada.price ?? 0;

                    return (
                      <ParticipantRow
                        key={participant.id}
                        participant={participant}
                        isPaid={paid}
                        price={participantPrice}
                        onMarkPaid={() => handleMarkPaid(participant)}
                        onMarkUnpaid={() => handleMarkUnpaid(participant)}
                        onRemove={() => handleRemove(participant.profile_id)}
                        onToggleType={() =>
                          handleTogglePaymentType(participant)
                        }
                      />
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {showPixModal && selectedPelada && (
        <PixModal
          peladaName={selectedPelada.name}
          price={selectedPelada.price ?? 0}
          onClose={() => setShowPixModal(false)}
        />
      )}
    </AppLayout>
  );
}

function isPaid(p: FinanceParticipant, currentMonth: string): boolean {
  return p.payments.some(
    (pay) =>
      pay.status === "paid" &&
      (pay.payment_type === "monthly"
        ? pay.reference_month === currentMonth
        : true),
  );
}

function ParticipantRow({
  participant,
  isPaid: paid,
  price,
  onMarkPaid,
  onMarkUnpaid,
  onRemove,
  onToggleType,
}: {
  participant: FinanceParticipant;
  isPaid: boolean;
  price: number;
  onMarkPaid: () => void;
  onMarkUnpaid: () => void;
  onRemove: () => void;
  onToggleType: () => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const name = participant.name ?? "Jogador";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative">
      <div
        className={cx(
          "flex items-center justify-between rounded-2xl bg-primary p-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-opacity",
          showActions && "opacity-60",
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cx(
              "flex size-10 items-center justify-center overflow-hidden rounded-full",
              paid ? "bg-success-primary/10" : "bg-secondary",
            )}
          >
            {participant.avatar_url ? (
              <Avatar
                src={participant.avatar_url}
                alt={name}
                size="md"
                rounded
              />
            ) : (
              <span
                className={cx(
                  "font-display text-sm font-bold",
                  paid ? "text-success-primary" : "text-secondary",
                )}
              >
                {initials}
              </span>
            )}
          </div>
          <div>
            <p className="text-[15px] font-medium text-primary">
              {name}
              {participant.is_admin && (
                <span className="ml-1.5 inline-block rounded-full bg-brand-secondary/10 px-1.5 py-0.5 font-display text-[10px] font-bold uppercase text-brand-secondary">
                  Admin
                </span>
              )}
            </p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <button
                type="button"
                onClick={onToggleType}
                className={cx(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-display text-[10px] font-bold uppercase transition-all",
                  participant.payment_type === "monthly"
                    ? "bg-brand-secondary/10 text-brand-secondary"
                    : "bg-secondary text-secondary",
                )}
              >
                {participant.payment_type === "monthly" ? (
                  <Repeat01 className="size-3" />
                ) : (
                  <Calendar className="size-3" />
                )}
                {participant.payment_type === "monthly" ? "Mensal" : "Avulso"}
              </button>
              {paid && (
                <span className="inline-block rounded-full bg-success-primary px-2 py-0.5 font-display text-[10px] font-bold uppercase text-success-primary">
                  Pago
                </span>
              )}
              {participant.payment_status === "exempt" && (
                <span className="inline-block rounded-full bg-secondary px-2 py-0.5 font-display text-[10px] font-bold uppercase text-secondary">
                  Isento
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {participant.is_admin ||
          participant.payment_status === "exempt" ? null : paid ? (
            <button
              type="button"
              onClick={onMarkUnpaid}
              className="flex items-center gap-1 rounded-lg bg-success-primary/10 px-3 py-2 font-display text-xs font-bold text-success-primary transition-all active:scale-95"
            >
              <CheckCircle className="size-4" />
              {formatCurrency(price)}
            </button>
          ) : (
            <button
              type="button"
              onClick={onMarkPaid}
              className="rounded-lg bg-brand-solid px-3 py-2 font-display text-xs font-bold text-primary_on-brand shadow-sm transition-all active:scale-95"
            >
              Marcar pago
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowActions(true)}
            className="rounded-full p-1.5 text-fg-quaternary transition-colors hover:bg-secondary_hover"
          >
            <FilterLines className="size-4" />
          </button>
        </div>
      </div>

      {showActions && (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-overlay/80 backdrop-blur-sm"
          onClick={() => setShowActions(false)}
        >
          <div
            className="mb-4 w-full max-w-md rounded-2xl bg-primary p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-primary">
                {name}
              </h3>
              <button
                type="button"
                onClick={() => setShowActions(false)}
                className="rounded-full p-1.5 text-fg-quaternary hover:bg-secondary_hover"
              >
                <XClose className="size-5" />
              </button>
            </div>

            <div className="space-y-2">
              {paid ? (
                <button
                  type="button"
                  onClick={() => {
                    onMarkUnpaid();
                    setShowActions(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl bg-error-primary/10 px-4 py-3 text-left transition-colors hover:bg-error-primary/20"
                >
                  <XClose className="size-5 text-error-primary" />
                  <div>
                    <p className="font-display text-sm font-semibold text-error-primary">
                      Desmarcar pagamento
                    </p>
                    <p className="text-xs text-secondary">
                      Reverter status para pendente
                    </p>
                  </div>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onMarkPaid();
                    setShowActions(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl bg-success-primary/10 px-4 py-3 text-left transition-colors hover:bg-success-primary/20"
                >
                  <CheckCircle className="size-5 text-success-primary" />
                  <div>
                    <p className="font-display text-sm font-semibold text-success-primary">
                      Marcar como pago
                    </p>
                    <p className="text-xs text-secondary">
                      Confirmar pagamento de {formatCurrency(price)}
                    </p>
                  </div>
                </button>
              )}

              <button
                type="button"
                onClick={onToggleType}
                className="flex w-full items-center gap-3 rounded-xl bg-brand-secondary/10 px-4 py-3 text-left transition-colors hover:bg-brand-secondary/20"
              >
                {participant.payment_type === "monthly" ? (
                  <Calendar className="size-5 text-brand-secondary" />
                ) : (
                  <Repeat01 className="size-5 text-brand-secondary" />
                )}
                <div>
                  <p className="font-display text-sm font-semibold text-brand-secondary">
                    Trocar para{" "}
                    {participant.payment_type === "monthly"
                      ? "avulso"
                      : "mensal"}
                  </p>
                  <p className="text-xs text-secondary">
                    {participant.payment_type === "monthly"
                      ? "Pagar apenas quando jogar"
                      : "Pagar mensalmente"}
                  </p>
                </div>
              </button>

              {!participant.is_admin && (
                <button
                  type="button"
                  onClick={() => {
                    onRemove();
                    setShowActions(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl bg-error-primary/10 px-4 py-3 text-left transition-colors hover:bg-error-primary/20"
                >
                  <Trash01 className="size-5 text-error-primary" />
                  <div>
                    <p className="font-display text-sm font-semibold text-error-primary">
                      Remover participante
                    </p>
                    <p className="text-xs text-secondary">Remover da pelada</p>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PixModal({
  peladaName,
  price,
  onClose,
}: {
  peladaName: string;
  price: number;
  onClose: () => void;
}) {
  const [pixKey, setPixKey] = useState("");
  const [copied, setCopied] = useState(false);

  const pixPayload = pixKey
    ? `PIX - ${peladaName}\nValor: ${formatCurrency(price)}\nChave: ${pixKey}`
    : "";

  const handleCopy = async () => {
    if (!pixKey) return;
    try {
      await navigator.clipboard.writeText(pixKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = pixKey;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-2xl bg-primary p-6 pb-24 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-primary">
            QR Code PIX
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-fg-quaternary transition-colors hover:bg-secondary"
          >
            <XClose className="size-5" />
          </button>
        </div>

        <div className="mb-4 rounded-xl bg-secondary p-4">
          <p className="mb-1 font-display text-[10px] font-bold uppercase text-quaternary">
            Valor
          </p>
          <p className="font-display text-xl font-bold text-primary">
            {formatCurrency(price)}
          </p>
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-xs font-bold uppercase text-quaternary">
            Chave PIX (CPF, email, telefone ou aleatória)
          </label>
          <input
            type="text"
            value={pixKey}
            onChange={(e) => setPixKey(e.target.value)}
            placeholder="Sua chave PIX"
            className="w-full rounded-xl border border-primary bg-primary px-4 py-3 text-sm text-primary outline-none focus:ring-2 focus:ring-brand"
          />
        </div>

        {pixKey && (
          <div className="mb-4 rounded-xl bg-brand-solid/5 p-4">
            <p className="mb-2 font-display text-xs font-bold text-brand-secondary">
              Mensagem para compartilhar:
            </p>
            <p className="whitespace-pre-wrap text-sm text-secondary">
              {pixPayload}
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={handleCopy}
          disabled={!pixKey}
          className={cx(
            "w-full rounded-xl py-3 font-display text-sm font-bold uppercase transition-all",
            copied
              ? "bg-success-primary text-white"
              : "bg-brand-solid text-primary_on-brand hover:bg-brand-solid_hover disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          <span className="flex items-center justify-center gap-2">
            <Copy01 className="size-4" />
            {copied ? "Chave copiada!" : "Copiar Chave PIX"}
          </span>
        </button>

        <p className="mt-3 text-center text-xs text-quaternary">
          Compartilhe sua chave PIX com os jogadores para receber pagamentos
        </p>
      </div>
    </div>
  );
}

export default FinancePage;
