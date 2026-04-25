import { useState } from "react";
import { cx } from "@/utils/cx";

interface FilterChip {
  label: string;
  value: string;
}

interface FilterChipsProps {
  chips: FilterChip[];
  defaultValue?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export const FilterChips = ({ chips, defaultValue, onChange, className }: FilterChipsProps) => {
  const [active, setActive] = useState(defaultValue ?? chips[0]?.value ?? "");

  const handleClick = (value: string) => {
    setActive(value);
    onChange?.(value);
  };

  return (
    <div className={cx("flex gap-2 overflow-x-auto pb-2 scrollbar-hide", className)}>
      {chips.map((chip) => {
        const isActive = chip.value === active;
        return (
          <button
            key={chip.value}
            type="button"
            onClick={() => handleClick(chip.value)}
            className={cx(
              "whitespace-nowrap rounded-full px-6 py-2 font-display text-xs font-bold uppercase tracking-wider transition-colors",
              isActive
                ? "bg-brand-solid text-primary_on-brand shadow-md"
                : "border border-secondary bg-primary text-secondary hover:bg-secondary",
            )}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
};