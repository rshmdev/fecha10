import { MarkerPin01, Clock, Users01, ChevronRight, CheckCircle, Hourglass01 } from "@untitledui/icons";
import { cx } from "@/utils/cx";

export type MatchStatus = "open" | "full" | "closed";

interface MatchCardProps {
  title: string;
  date: string;
  month: string;
  time: string;
  location: string;
  currentPlayers: number;
  maxPlayers: number;
status: MatchStatus;
  score?: string;
}

const STATUS_CONFIG: Record<MatchStatus, { label: string; bgClass: string; textClass: string }> = {
  open: { label: "Aberto", bgClass: "bg-brand-primary", textClass: "text-brand-secondary" },
  full: { label: "Lotado", bgClass: "bg-secondary", textClass: "text-secondary" },
  closed: { label: "Encerrado", bgClass: "bg-secondary", textClass: "text-secondary" },
};

export const MatchCard = ({
  title,
  date,
  month,
  time,
  location,
  currentPlayers,
  maxPlayers,
  status,
  score,
}: MatchCardProps) => {
  const config = STATUS_CONFIG[status];
  const isClosed = status === "closed";
  const isFull = status === "full";

  return (
    <div
      className={cx(
        "flex gap-4 rounded-3xl border border-transparent p-4 shadow-sm transition-all active:scale-[0.98]",
        isClosed ? "bg-secondary opacity-60" : "bg-primary hover:border-brand-primary",
      )}
    >
      <div
        className={cx(
          "flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl",
          isClosed ? "bg-quaternary grayscale" : "bg-secondary",
        )}
      >
        <span className={cx("text-lg font-bold", isClosed ? "text-secondary" : "text-primary")}>
          {date}
        </span>
        <span className="text-[10px] font-bold uppercase text-quaternary">{month}</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h4 className={cx("min-w-0 truncate font-display text-lg font-semibold", isClosed ? "text-secondary" : "text-primary")}>
            {title}
          </h4>
          <span
            className={cx(
              "shrink-0 rounded-full px-3 py-1 font-display text-[10px] font-bold uppercase tracking-wider",
              config.bgClass,
              config.textClass,
            )}
          >
            {config.label}
          </span>
        </div>

        <div className={cx("mt-1 flex items-center gap-1 text-sm", isClosed ? "text-quaternary" : "text-tertiary")}>
          {isClosed ? (
            <>
              <CheckCircle className="size-4" />
              <span>Finalizado: {score}</span>
            </>
          ) : (
            <>
              <Clock className="size-4" />
              <span>{time}</span>
            </>
          )}
        </div>

        {!isClosed && (
          <div className="flex min-w-0 items-center gap-1 text-sm text-tertiary">
            <MarkerPin01 className="size-4 shrink-0" />
            <span className="truncate">{location}</span>
          </div>
        )}

        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users01
              className={cx(
                "size-5",
                isClosed || isFull ? "text-fg-quaternary" : "text-fg-brand-primary",
              )}
              style={isClosed || isFull ? undefined : { fill: "currentColor" }}
            />
            <span className={cx("text-sm font-bold", isClosed ? "text-quaternary" : isFull ? "text-secondary" : "text-brand-secondary")}>
              {currentPlayers}/{maxPlayers}
            </span>
          </div>

          {isClosed ? (
            <span className="flex items-center gap-1 text-sm font-bold text-quaternary">
              Ver súmula
            </span>
          ) : isFull ? (
            <span className="flex items-center gap-1 text-sm font-bold text-secondary">
              Lista de espera <Hourglass01 className="size-4" />
            </span>
          ) : (
            <span className="flex items-center gap-1 text-sm font-bold text-brand-secondary">
              Ver detalhes <ChevronRight className="size-4" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
};