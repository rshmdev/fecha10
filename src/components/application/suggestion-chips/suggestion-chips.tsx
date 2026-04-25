import { useState } from "react";
import { cx } from "@/utils/cx";

interface SuggestionChipsProps {
  suggestions: string[];
  onToggle?: (suggestion: string, selected: boolean) => void;
  className?: string;
}

export const SuggestionChips = ({ suggestions, onToggle, className }: SuggestionChipsProps) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const handleToggle = (suggestion: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(suggestion)) {
        next.delete(suggestion);
      } else {
        next.add(suggestion);
      }
      onToggle?.(suggestion, next.has(suggestion));
      return next;
    });
  };

  return (
    <div className={cx("flex flex-wrap gap-2 py-2", className)}>
      {suggestions.map((suggestion) => {
        const isActive = selected.has(suggestion);
        return (
          <button
            key={suggestion}
            type="button"
            onClick={() => handleToggle(suggestion)}
            className={cx(
              "rounded-full px-3 py-1.5 font-display text-xs font-bold uppercase tracking-wider transition-colors",
              isActive
                ? "bg-brand-solid text-primary_on-brand"
                : "border border-secondary bg-primary text-secondary hover:bg-secondary",
            )}
          >
            {suggestion}
          </button>
        );
      })}
    </div>
  );
};