import type { FC } from "react";
import { Link } from "react-router-dom";
import { cx } from "@/utils/cx";

export interface NavItem {
  label: string;
  icon: FC<{ className?: string }>;
  href: string;
  isActive?: boolean;
}

interface BottomNavBarProps {
  items: NavItem[];
  className?: string;
}

export const BottomNavBar = ({ items, className }: BottomNavBarProps) => {
  return (
    <nav
      className={cx(
        "fixed bottom-0 left-0 z-50 flex w-full items-center justify-around border-t border-secondary bg-primary/90 px-2 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] backdrop-blur-md",
        className,
      )}
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.label}
            to={item.href}
            className={cx(
              "flex flex-col items-center justify-center rounded-xl px-3 py-1 font-display text-[10px] font-medium uppercase tracking-wider transition-all duration-150 active:scale-90",
              item.isActive
                ? "bg-brand-primary font-bold text-brand-secondary"
                : "text-quaternary hover:text-brand-secondary",
            )}
          >
            <Icon className="size-5" />
            <span className="mt-1">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};