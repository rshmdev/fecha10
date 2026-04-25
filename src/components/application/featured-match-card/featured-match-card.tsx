import { MarkerPin01, Calendar } from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { cx } from "@/utils/cx";

interface FeaturedMatchCardProps {
  badge?: string;
  title: string;
  time: string;
  location: string;
  currentPlayers: number;
  maxPlayers: number;
  avatars: { src: string; alt: string }[];
  remainingCount: number;
  isConfirmed?: boolean;
  onCtaClick?: () => void;
  onCardClick?: () => void;
  className?: string;
}

export const FeaturedMatchCard = ({
  badge = "Destaque",
  title,
  time,
  location,
  currentPlayers,
  maxPlayers,
  avatars,
  remainingCount,
  isConfirmed = false,
  onCtaClick,
  onCardClick,
  className,
}: FeaturedMatchCardProps) => {
  const percentage = Math.round((currentPlayers / maxPlayers) * 100);
  const remaining = maxPlayers - currentPlayers;

  const isFull = currentPlayers >= maxPlayers;
  const ctaLabel = isConfirmed
    ? "CONFIRMADO"
    : isFull
      ? "LISTA DE ESPERA"
      : "CONFIRMAR VAGA";

  return (
    <div
      onClick={onCardClick}
      className={cx("cursor-pointer grid grid-cols-1 gap-4 md:grid-cols-3", className)}
    >
      <div className="min-h-[180px] sm:min-h-[220px] relative flex flex-col justify-between overflow-hidden rounded-2xl bg-brand-solid p-5 sm:p-6 text-primary_on-brand shadow-lg md:col-span-2">
        <div className="absolute right-0 top-0 p-4 opacity-10">
          <svg className="size-[120px]" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1" fill="none" />
            <path d="M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10A10 10 0 0 1 2 12 10 10 0 0 1 12 2z" />
          </svg>
        </div>

        <div>
          <span className="mb-4 inline-block rounded-full bg-white/20 px-3 py-1 font-display text-xs font-bold uppercase tracking-widest backdrop-blur-sm">
            {badge}
          </span>
          <h2 className="font-display text-xl sm:text-2xl font-bold">{title}</h2>
          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2 text-sm opacity-90 sm:gap-4">
            <span className="flex shrink-0 items-center gap-1">
              <Calendar className="size-4" />
              {time}
            </span>
            <span className="flex min-w-0 items-center gap-1">
              <MarkerPin01 className="size-4 shrink-0" />
              <span className="truncate">{location}</span>
            </span>
          </div>
        </div>

        <div className="mt-6 flex items-end justify-between">
          <div className="flex -space-x-3">
            {avatars.slice(0, 3).map((a, i) => (
              <div key={i} className="ring-2 ring-brand-solid">
                <Avatar src={a.src} alt={a.alt} size="sm" rounded />
              </div>
            ))}
            <div className="flex size-8 items-center justify-center rounded-full border-2 border-brand-solid bg-white/30 font-display text-[10px] font-bold backdrop-blur-sm">
              +{remainingCount}
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCtaClick?.();
            }}
            className={cx(
              "rounded-lg px-4 py-2 font-display text-xs font-bold uppercase tracking-wider shadow-sm transition-colors",
              isConfirmed
                ? "bg-brand-primary/20 text-primary_on-brand"
                : "bg-primary text-brand-secondary hover:bg-primary_hover",
            )}
          >
            {ctaLabel}
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center rounded-2xl border border-secondary bg-primary p-6 text-center shadow-sm">
        <span className="font-display text-3xl font-extrabold text-primary sm:text-4xl">
          {currentPlayers}/{maxPlayers}
        </span>
        <p className="mt-1 font-display text-xs font-bold uppercase tracking-widest text-secondary">
          Jogadores Confirmados
        </p>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full bg-brand-solid transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
        {remaining <= 2 && remaining > 0 && (
          <p className="mt-2 text-sm font-semibold text-error-primary">
            Apenas {remaining} vaga{remaining > 1 ? "s" : ""} restante{remaining > 1 ? "s" : ""}!
          </p>
        )}
      </div>
    </div>
  );
};