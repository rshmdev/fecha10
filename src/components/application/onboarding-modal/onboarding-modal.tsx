import { useState, useCallback } from "react";
import { ArrowRight, UsersPlus } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { useAuth } from "@/providers/auth-provider";
import { cx } from "@/utils/cx";

const POSITIONS = [
  { id: "goleiro", label: "Goleiro" },
  { id: "zagueiro", label: "Zagueiro" },
  { id: "lateral", label: "Lateral" },
  { id: "volante", label: "Volante" },
  { id: "meia", label: "Meia" },
  { id: "atacante", label: "Atacante" },
];

function PositionChip({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cx(
        "rounded-full px-4 py-2 font-display text-sm font-semibold transition-all active:scale-95",
        selected
          ? "bg-brand-solid text-primary_on-brand shadow-md shadow-brand-solid/20"
          : "bg-secondary text-secondary hover:bg-secondary_hover ring-1 ring-secondary",
      )}
    >
      {label}
    </button>
  );
}

export function OnboardingModal() {
  const { completeOnboarding, user, profile, needsOnboarding } = useAuth();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [positions, setPositions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  console.log("[ONBOARDING] render:", { userId: user?.id, hasProfile: !!profile, needsOnboarding });

  const togglePosition = useCallback((id: string) => {
    setPositions((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      const trimmedName = name.trim();
      if (!trimmedName) {
        setError("Informe seu nome.");
        return;
      }
      if (!age || Number(age) < 10 || Number(age) > 99) {
        setError("Informe uma idade válida (10-99).");
        return;
      }
      if (positions.length === 0) {
        setError("Selecione pelo menos uma posição.");
        return;
      }

      console.log("[ONBOARDING] submitting:", { name: trimmedName, age: Number(age), positions });
      setIsLoading(true);
      try {
        const result = await completeOnboarding(trimmedName, Number(age), positions);
        console.log("[ONBOARDING] result:", result);
        if (result.error) {
          console.error("[ONBOARDING] error:", result.error);
          setError(result.error);
        }
      } catch (err) {
        console.error("[ONBOARDING] unexpected error:", err);
        setError("Erro inesperado. Tente novamente.");
      } finally {
        setIsLoading(false);
      }
    },
    [name, age, positions, completeOnboarding],
  );

  const isValid = name.trim() && age && Number(age) >= 10 && positions.length > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-overlay/80 px-4 backdrop-blur-[6px]">
      <div className="w-full max-w-md animate-in zoom-in-95 fade-in overflow-hidden rounded-2xl border border-secondary bg-primary shadow-2xl duration-300">
        <div className="bg-brand-solid flex flex-col items-center px-6 pb-6 pt-8">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-white/20">
            <UsersPlus className="size-7 text-primary_on-brand" />
          </div>
          <h2 className="mt-4 font-display text-2xl font-bold text-primary_on-brand">
            Complete seu perfil
          </h2>
          <p className="mt-1 text-center text-sm text-primary_on-brand/80">
            Precisamos de alguns dados para personalizar sua experiência.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-6">
          <Input
            label="Nome"
            placeholder="Seu nome completo"
            type="text"
            value={name}
            onChange={setName}
            size="lg"
            isRequired
            className="label:ml-1 label:text-[12px] label:font-bold label:uppercase label:tracking-[0.05em] label:text-quaternary"
            inputClassName="text-[15px] font-medium"
          />

          <Input
            label="Idade"
            placeholder="Ex: 25"
            type="number"
            value={age}
            onChange={setAge}
            size="lg"
            isRequired
            className="label:ml-1 label:text-[12px] label:font-bold label:uppercase label:tracking-[0.05em] label:text-quaternary"
            inputClassName="text-[15px] font-medium"
          />

          <div>
            <label className="mb-3 block text-[12px] font-bold uppercase tracking-[0.05em] text-quaternary">
              Posições que joga <span className="text-error-primary">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {POSITIONS.map((pos) => (
                <PositionChip
                  key={pos.id}
                  label={pos.label}
                  selected={positions.includes(pos.id)}
                  onToggle={() => togglePosition(pos.id)}
                />
              ))}
            </div>
          </div>

          {error && (
            <p className="text-center text-sm text-error-primary">{error}</p>
          )}

          <Button
            type="submit"
            size="xl"
            color="primary"
            iconTrailing={ArrowRight}
            isLoading={isLoading}
            isDisabled={!isValid}
            className="font-display h-14 w-full rounded-2xl text-[18px] shadow-[0_8px_24px_rgba(16,185,129,0.2)]"
          >
            Começar
          </Button>
        </form>
      </div>
    </div>
  );
}