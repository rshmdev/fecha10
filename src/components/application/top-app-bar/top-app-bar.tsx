import type { ReactNode } from "react";
import { cx } from "@/utils/cx";

export interface TopAppBarProps {
  leading?: ReactNode;
  title?: ReactNode;
  trailing?: ReactNode;
  className?: string;
}

export const TopAppBar = ({ leading, title, trailing, className }: TopAppBarProps) => {
  return (
    <header
      className={cx(
        "fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-secondary bg-primary px-4 shadow-sm",
        className,
      )}
    >
      <div className="flex items-center gap-3">{leading}</div>
      {title && <div className="font-display">{title}</div>}
      <div className="flex items-center gap-3">{trailing}</div>
    </header>
  );
};