import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Wallet01, CheckCircle, Clock, Calendar } from "@untitledui/icons";
import { AppLayout } from "@/components/application/app-layout/app-layout";
import { useAuth } from "@/providers/auth-provider";
import {
  getUserPayments,
  getUserParticipantPeladas,
  formatCurrency,
  formatDate,
  formatTime,
  formatMonthLabel,
  getCurrentMonth,
  type UserPaymentRecord,
  type Pelada,
} from "@/lib/peladas";
import { cx } from "@/utils/cx";

function MyPaymentsPage() {
  const navigate = useNavigate();
  const { deviceId } = useAuth();
  const [payments, setPayments] = useState<UserPaymentRecord[]>([]);
  const [participantPeladas, setParticipantPeladas] = useState<Pelada[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"history" | "current">("current");

  const currentMonth = getCurrentMonth();

  const loadData = useCallback(async () => {
    if (!deviceId) return;
    setIsLoading(true);
    const [paymentsData, peladasData] = await Promise.all([
      getUserPayments(deviceId),
      getUserParticipantPeladas(deviceId),
    ]);
    setPayments(paymentsData);
    setParticipantPeladas(peladasData);
    setIsLoading(false);
  }, [deviceId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currentPeladas = participantPeladas.filter(
    (p) => p.date >= new Date().toISOString().split("T")[0] && p.status !== "cancelled",
  );

  const monthlyPayment = payments.find(
    (p) => p.payment_type === "monthly" && p.reference_month === currentMonth && p.status === "paid",
  );

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
        <section className="mb-6" aria-label="Título">
          <h1 className="font-display text-2xl font-bold text-primary">
            Meus Pagamentos
          </h1>
          <p className="mt-1 text-[15px] text-secondary">
            Acompanhe seus pagamentos e status
          </p>
        </section>

        <div className="mb-6 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("current")}
            className={cx(
              "flex-1 rounded-xl py-3 font-display text-sm font-bold transition-all",
              activeTab === "current"
                ? "bg-brand-solid text-primary_on-brand shadow-md"
                : "bg-primary text-secondary ring-1 ring-secondary",
            )}
          >
            Peladas Ativas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={cx(
              "flex-1 rounded-xl py-3 font-display text-sm font-bold transition-all",
              activeTab === "history"
                ? "bg-brand-solid text-primary_on-brand shadow-md"
                : "bg-primary text-secondary ring-1 ring-secondary",
            )}
          >
            Histórico
          </button>
        </div>

        {activeTab === "current" && (
          <>
            {monthlyPayment && (
              <section className="mb-6" aria-label="Pagamento mensal">
                <div className="overflow-hidden rounded-2xl bg-success-primary/5 p-5 ring-1 ring-success-primary/20">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-success-primary/10">
                      <CheckCircle className="size-5 text-success-primary" />
                    </div>
                    <div>
                      <p className="font-display text-sm font-bold text-success-primary">
                        Mensal Pago
                      </p>
                      <p className="text-xs text-secondary">
                        {formatMonthLabel(currentMonth)} —{" "}
                        {formatCurrency(monthlyPayment.amount)}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            <section aria-label="Peladas ativas">
              <h2 className="mb-3 font-display text-lg font-semibold text-primary">
                Próximas Peladas
              </h2>

              {currentPeladas.length === 0 ? (
                <div className="rounded-2xl bg-primary p-8 text-center shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
                  <Calendar className="mx-auto mb-3 size-10 text-fg-quaternary" />
                  <p className="font-display text-base font-semibold text-secondary">
                    Nenhuma pelada ativa
                  </p>
                  <p className="mt-1 text-sm text-tertiary">
                    Entre em uma pelada para ver aqui
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentPeladas.map((pelada) => {
                    const sessionPayment = payments.find(
                      (p) =>
                        p.pelada_id === pelada.id &&
                        p.payment_type === "session" &&
                        p.status === "paid",
                    );
                    const isPaid = !!sessionPayment || !!monthlyPayment;

                    return (
                      <div
                        key={pelada.id}
                        className="flex items-center justify-between rounded-2xl bg-primary p-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)]"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-display text-[15px] font-semibold text-primary">
                            {pelada.name}
                          </p>
                          <p className="mt-0.5 text-sm text-secondary">
                            {formatDate(pelada.date)} •{" "}
                            {formatTime(pelada.start_time)}
                          </p>
                          <p className="mt-1 text-xs text-quaternary">
                            {pelada.price
                              ? formatCurrency(pelada.price)
                              : "Grátis"}
                          </p>
                        </div>
                        <div className="ml-4">
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-success-primary/10 px-3 py-1.5 font-display text-[10px] font-bold uppercase text-success-primary">
                              <CheckCircle className="size-3" />
                              Pago
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-warning-primary/10 px-3 py-1.5 font-display text-[10px] font-bold uppercase text-warning-primary">
                              <Clock className="size-3" />
                              Pendente
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}

        {activeTab === "history" && (
          <section aria-label="Histórico de pagamentos">
            {payments.length === 0 ? (
              <div className="rounded-2xl bg-primary p-8 text-center shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
                <Wallet01 className="mx-auto mb-3 size-10 text-fg-quaternary" />
                <p className="font-display text-base font-semibold text-secondary">
                  Nenhum pagamento registrado
                </p>
                <p className="mt-1 text-sm text-tertiary">
                  Seus pagamentos aparecerão aqui
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between rounded-2xl bg-primary p-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-[15px] font-semibold text-primary">
                        {payment.pelada?.name ?? "Pagamento mensal"}
                      </p>
                      <p className="mt-0.5 text-sm text-secondary">
                        {payment.pelada
                          ? `${formatDate(payment.pelada.date)} • ${formatTime(payment.pelada.start_time)}`
                          : formatMonthLabel(payment.reference_month ?? "")}
                      </p>
                      <p className="mt-1 text-xs text-quaternary">
                        {payment.payment_type === "monthly" ? "Mensal" : "Avulso"}
                      </p>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="font-display text-sm font-bold text-primary">
                        {formatCurrency(payment.amount)}
                      </p>
                      {payment.status === "paid" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-success-primary/10 px-2 py-0.5 font-display text-[10px] font-bold uppercase text-success-primary">
                          <CheckCircle className="size-3" />
                          Pago
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-error-primary/10 px-2 py-0.5 font-display text-[10px] font-bold uppercase text-error-primary">
                          <Clock className="size-3" />
                          Pendente
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </AppLayout>
  );
}

export default MyPaymentsPage;
