import {
  useRef,
  useEffect,
  type FC,
  type KeyboardEvent,
  type ClipboardEvent,
} from "react";
import { cx } from "@/utils/cx";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  isInvalid?: boolean;
  isDisabled?: boolean;
}

export const OtpInput: FC<OtpInputProps> = ({
  length = 6,
  value,
  onChange,
  isInvalid,
  isDisabled,
}) => {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, digit: string) => {
    if (!/^\d*$/.test(digit)) return;
    const chars = value.split("");
    chars[index] = digit;
    const nextValue = chars.join("").slice(0, length);
    onChange(nextValue);
    if (digit && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);
    onChange(pasted);
  };

  useEffect(() => {
    const firstEmpty = value.split("").findIndex((d) => !d);
    const idx = firstEmpty === -1 ? Math.max(0, length - 1) : firstEmpty;
    inputsRef.current[idx]?.focus();
  }, []);

  return (
    <div className="flex justify-center gap-2 sm:gap-3">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            inputsRef.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ""}
          disabled={isDisabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className={cx(
            "size-11 rounded-lg border text-center text-2xl font-semibold transition duration-100 ease-linear focus:border-border-brand focus:outline-none focus:ring-2 focus:ring-ring-brand disabled:cursor-not-allowed disabled:opacity-50 sm:size-12",
            isInvalid
              ? "border-border-error bg-bg-error-primary text-text-error-primary"
              : "border-border-primary bg-bg-primary text-text-primary",
          )}
        />
      ))}
    </div>
  );
};
