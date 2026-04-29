import {
  Trophy01,
  Wallet01,
  Settings01,
  ChevronRight,
  LogOut01,
  Pencil01,
  XClose,
} from "@untitledui/icons";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { Avatar } from "@/components/base/avatar/avatar";
import { AppLayout } from "@/components/application/app-layout/app-layout";
import { useAuth } from "@/providers/auth-provider";
import {
  getProfileStats,
  getPeladaHistory,
  formatDate,
  formatTime,
  type ProfileStats,
  type PeladaHistory,
} from "@/lib/peladas";
import { cx } from "@/utils/cx";

function ProfilePage() {
  const navigate = useNavigate();
  const { deviceId, profile, logout, updateProfile } = useAuth();
  const [stats, setStats] = useState<ProfileStats>({
    totalGames: 0,
    attendanceRate: 0,
  });
  const [history, setHistory] = useState<PeladaHistory[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAge, setEditAge] = useState("");
  const [editPositions, setEditPositions] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!deviceId) return;
    getProfileStats(deviceId).then(setStats);
    getPeladaHistory(deviceId).then(setHistory);
  }, [deviceId]);

  const startEditing = useCallback(() => {
    if (!profile) return;
    setEditName(profile.name ?? "");
    setEditAge(profile.age?.toString() ?? "");
    setEditPositions(profile.positions ?? []);
    setIsEditing(true);
  }, [profile]);

  const saveProfile = useCallback(async () => {
    const trimmedName = editName.trim();
    if (!trimmedName) return;

    setIsSaving(true);
    const result = await updateProfile({
      name: trimmedName,
      ...(editAge ? { age: Number(editAge) } : {}),
      positions: editPositions,
    });
    setIsSaving(false);

    if (!result.error) {
      setIsEditing(false);
    }
  }, [editName, editAge, editPositions, updateProfile]);

  const displayName = profile?.name ?? "Jogador";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <AppLayout>

      <main className="mx-auto w-full max-w-md flex-1 px-4 pb-28 pt-20">
        <section className="mb-8 mt-4 text-center" aria-label="Perfil">
          <div className="relative mb-4 inline-block">
            <div className="mx-auto size-28 overflow-hidden rounded-full ring-4 ring-brand-primary/20 shadow-xl">
              <Avatar
                src={profile?.avatar_url ?? undefined}
                alt={displayName}
                initials={initials}
                className="size-full"
                rounded
              />
            </div>
            <button
              type="button"
              onClick={startEditing}
              className="absolute bottom-1 right-1 flex items-center justify-center rounded-full border-2 border-primary bg-brand-solid p-1.5 text-primary_on-brand transition-colors hover:bg-brand-solid_hover active:scale-95"
            >
              <Pencil01 className="size-4" />
            </button>
          </div>
          <h2 className="font-display text-2xl font-bold text-primary">
            {displayName}
          </h2>
          {profile?.positions && profile.positions.length > 0 && (
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {profile.positions.map((pos) => (
                <span
                  key={pos}
                  className="rounded-full bg-brand-secondary/10 px-3 py-1 font-display text-xs font-semibold text-brand-secondary"
                >
                  {pos}
                </span>
              ))}
            </div>
          )}
        </section>

        <section
          className="mb-8 grid grid-cols-2 gap-4"
          aria-label="Estatísticas"
        >
          <div className="flex flex-col items-center rounded-2xl border border-primary/5 bg-primary p-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
            <span className="mb-2 font-display text-xs font-bold uppercase text-secondary">
              Histórico de peladas
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">
                {stats.totalGames}
              </span>
              <span className="font-display text-xs font-bold text-quaternary">
                JOGOS
              </span>
            </div>
          </div>
          <div className="flex flex-col items-center rounded-2xl border border-primary/5 bg-primary p-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
            <span className="mb-2 font-display text-xs font-bold uppercase text-secondary">
              Presenças
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-3xl font-extrabold tracking-tight text-brand-secondary sm:text-4xl">
                {stats.attendanceRate}
              </span>
              <span className="font-display text-xs font-bold text-brand-tertiary_alt">
                %
              </span>
            </div>
          </div>
        </section>

        <section className="mb-8" aria-label="Últimas peladas">
          <div className="mb-4 flex items-end justify-between px-1">
            <h3 className="font-display text-lg font-semibold text-primary">
              Últimas Peladas
            </h3>
            <button
              type="button"
              onClick={() => navigate("/matches")}
              className="cursor-pointer font-display text-xs font-bold uppercase text-brand-secondary hover:text-brand-secondary_hover"
            >
              VER TODAS
            </button>
          </div>

          {history.length === 0 ? (
            <div className="rounded-2xl border border-primary/5 bg-primary p-8 text-center shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
              <Trophy01 className="mx-auto mb-3 size-10 text-fg-quaternary" />
              <p className="font-display text-base font-semibold text-secondary">
                Nenhuma pelada ainda
              </p>
              <p className="mt-1 text-sm text-tertiary">
                Entre em uma pelada para ver seu histórico aqui
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.slice(0, 5).map((match) => (
                <div
                  key={match.id}
                  className="flex items-center justify-between rounded-2xl border border-primary/5 bg-primary p-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)]"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cx(
                        "flex size-12 items-center justify-center rounded-xl",
                        match.status === "confirmed"
                          ? "bg-brand-primary"
                          : match.status === "declined"
                            ? "bg-error-primary"
                            : "bg-secondary",
                      )}
                    >
                      <Trophy01
                        className={cx(
                          "size-5",
                          match.status === "confirmed"
                            ? "text-fg-brand-primary"
                            : match.status === "declined"
                              ? "text-fg-error-primary"
                              : "text-fg-quaternary",
                        )}
                      />
                    </div>
                    <div>
                      <p className="text-[15px] font-medium text-primary">
                        {match.name}
                      </p>
                      <p className="text-sm text-secondary">
                        {formatDate(match.date)} •{" "}
                        {formatTime(match.start_time)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={cx(
                        "mt-0.5 inline-block rounded-full px-2 py-0.5 font-display text-[10px] font-bold uppercase",
                        match.status === "confirmed"
                          ? "bg-success-primary text-success-primary"
                          : match.status === "declined"
                            ? "bg-error-primary text-error-primary"
                            : "bg-secondary text-secondary",
                      )}
                    >
                      {match.status === "confirmed"
                        ? "Confirmado"
                        : match.status === "declined"
                          ? "Recusado"
                          : "Pendente"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section
          className="overflow-hidden rounded-2xl border border-primary/5 bg-primary shadow-[0_4px_20px_rgba(0,0,0,0.05)]"
          aria-label="Menu"
        >
          <button
            type="button"
            onClick={startEditing}
            className="flex w-full items-center justify-between px-5 py-4 transition-colors hover:bg-primary_hover"
          >
            <div className="flex items-center gap-3">
              <Settings01 className="size-5 text-fg-quaternary" />
              <span className="text-[15px] font-medium text-primary">
                Editar Perfil
              </span>
            </div>
            <ChevronRight className="size-5 text-fg-quaternary" />
          </button>

          <div className="border-t border-secondary">
            <button
              type="button"
              onClick={() => navigate("/my-payments")}
              className="flex w-full items-center justify-between px-5 py-4 transition-colors hover:bg-primary_hover"
            >
              <div className="flex items-center gap-3">
                <Wallet01 className="size-5 text-fg-quaternary" />
                <span className="text-[15px] font-medium text-primary">
                  Meus Pagamentos
                </span>
              </div>
              <ChevronRight className="size-5 text-fg-quaternary" />
            </button>
          </div>

          <div className="border-t border-secondary">
            <button
              type="button"
              onClick={async () => {
                await logout();
                navigate("/login");
              }}
              className="flex w-full items-center gap-3 px-5 py-4 transition-colors hover:bg-error-primary"
            >
              <LogOut01 className="size-5 text-error-primary" />
              <span className="text-[15px] font-semibold text-error-primary">
                Sair da conta
              </span>
            </button>
          </div>
        </section>
      </main>

      {isEditing && (
        <EditProfileModal
          name={editName}
          age={editAge}
          positions={editPositions}
          isSaving={isSaving}
          onNameChange={setEditName}
          onAgeChange={setEditAge}
          onPositionsChange={setEditPositions}
          onSave={saveProfile}
          onClose={() => setIsEditing(false)}
        />
      )}
    </AppLayout>
  );
}

const POSITIONS = [
  { id: "goleiro", label: "Goleiro" },
  { id: "zagueiro", label: "Zagueiro" },
  { id: "lateral", label: "Lateral" },
  { id: "volante", label: "Volante" },
  { id: "meia", label: "Meia" },
  { id: "atacante", label: "Atacante" },
];

function EditProfileModal({
  name,
  age,
  positions,
  isSaving,
  onNameChange,
  onAgeChange,
  onPositionsChange,
  onSave,
  onClose,
}: {
  name: string;
  age: string;
  positions: string[];
  isSaving: boolean;
  onNameChange: (v: string) => void;
  onAgeChange: (v: string) => void;
  onPositionsChange: (v: string[]) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-overlay/80 px-4 backdrop-blur-[6px]">
      <div className="w-full max-w-md animate-in zoom-in-95 fade-in overflow-hidden rounded-2xl border border-secondary bg-primary shadow-2xl duration-300">
        <div className="flex items-center justify-between border-b border-secondary px-6 py-4">
          <h2 className="font-display text-xl font-bold text-primary">
            Editar Perfil
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-fg-quaternary transition-colors hover:bg-secondary_hover"
          >
            <XClose className="size-5" />
          </button>
        </div>

        <div className="flex flex-col gap-5 p-6">
          <div>
            <label className="mb-1.5 block font-display text-xs font-bold uppercase tracking-[0.05em] text-quaternary">
              Nome
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              className="w-full rounded-xl border border-primary bg-primary px-4 py-3 text-[15px] font-medium text-primary outline-none ring-brand-solid transition-all focus:ring-2"
              placeholder="Seu nome completo"
            />
          </div>

          <div>
            <label className="mb-1.5 block font-display text-xs font-bold uppercase tracking-[0.05em] text-quaternary">
              Idade
            </label>
            <input
              type="number"
              value={age}
              onChange={(e) => onAgeChange(e.target.value)}
              className="w-full rounded-xl border border-primary bg-primary px-4 py-3 text-[15px] font-medium text-primary outline-none ring-brand-solid transition-all focus:ring-2"
              placeholder="Ex: 25"
              min={10}
              max={99}
            />
          </div>

          <div>
            <label className="mb-3 block font-display text-xs font-bold uppercase tracking-[0.05em] text-quaternary">
              Posições
            </label>
            <div className="flex flex-wrap gap-2">
              {POSITIONS.map((pos) => (
                <button
                  key={pos.id}
                  type="button"
                  onClick={() =>
                    onPositionsChange(
                      positions.includes(pos.id)
                        ? positions.filter((p) => p !== pos.id)
                        : [...positions, pos.id],
                    )
                  }
                  className={cx(
                    "rounded-full px-4 py-2 font-display text-sm font-semibold transition-all active:scale-95",
                    positions.includes(pos.id)
                      ? "bg-brand-solid text-primary_on-brand shadow-md shadow-brand-solid/20"
                      : "bg-secondary text-secondary hover:bg-secondary_hover ring-1 ring-secondary",
                  )}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={onSave}
            disabled={isSaving || !name.trim()}
            className="font-display h-14 w-full rounded-2xl bg-brand-solid text-[18px] font-semibold text-primary_on-brand shadow-[0_8px_24px_rgba(16,185,129,0.2)] transition-all hover:bg-brand-solid_hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
