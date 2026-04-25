import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Phone01, ArrowLeft } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { useAuth } from "@/providers/auth-provider";

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

function toE164(formatted: string): string {
  const digits = formatted.replace(/\D/g, "");
  if (digits.length === 0) return "";
  if (digits.startsWith("55")) return `+${digits}`;
  return `+55${digits}`;
}

function LoginPage() {
  const navigate = useNavigate();
  const { sendOtp, verifyOtp } = useAuth();
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleSubmitPhone = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      const e164 = toE164(phone);
      if (e164.length < 13) {
        setError("Digite um número de celular válido.");
        return;
      }
      setIsLoading(true);
      const { error: otpError } = await sendOtp(e164);
      setIsLoading(false);
      if (otpError) {
        setError(otpError);
        return;
      }
      setStep("otp");
      setResendCooldown(60);
    },
    [phone, sendOtp],
  );

  const handleVerifyOtp = useCallback(async () => {
    const code = otp.join("");
    if (code.length < 6) return;
    setError(null);
    setIsLoading(true);
    const e164 = toE164(phone);
    const { error: verifyError } = await verifyOtp(e164, code);
    setIsLoading(false);
    if (verifyError) {
      setError("Código inválido. Tente novamente.");
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
      return;
    }
    navigate("/home", { replace: true });
  }, [otp, phone, verifyOtp, navigate]);

  const handleOtpChange = useCallback(
    (index: number, value: string) => {
      if (!/^\d*$/.test(value)) return;
      const newOtp = [...otp];
      newOtp[index] = value.slice(-1);
      setOtp(newOtp);
      if (value && index < 5) {
        otpRefs.current[index + 1]?.focus();
      }
      if (newOtp.every((d) => d !== "") && newOtp.join("").length === 6) {
        setTimeout(() => handleVerifyOtp(), 100);
      }
    },
    [otp, handleVerifyOtp],
  );

  const handleOtpKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent) => {
      if (e.key === "Backspace" && !otp[index] && index > 0) {
        otpRefs.current[index - 1]?.focus();
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
      }
    },
    [otp],
  );

  const handleResend = useCallback(async () => {
    if (resendCooldown > 0) return;
    setError(null);
    const e164 = toE164(phone);
    await sendOtp(e164);
    setResendCooldown(60);
  }, [resendCooldown, phone, sendOtp]);

  const handlePhoneChange = useCallback((value: string) => {
    const raw = value.replace(/\D/g, "");
    if (raw.length <= 11) {
      setPhone(formatPhone(raw));
    }
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-primary text-primary">
      <main className="bg-pitch-modern relative flex flex-1 items-center justify-center overflow-hidden px-4 py-6">
        <div className="relative z-10 w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="font-login-display mb-2 text-3xl leading-none font-black italic tracking-tight text-primary_on-brand drop-shadow-xl sm:text-[44px]">
              FECHA10
            </h1>
            <p className="font-login-display text-base leading-snug font-semibold text-primary_on-brand/90 sm:text-[18px]">
              O seu jogo começa aqui.
            </p>
          </div>

          <section
            aria-label="Acesso"
            className="glass-effect w-full rounded-2xl border border-secondary bg-secondary p-6 shadow-[0_20px_50px_rgba(0,0,0,0.2)] sm:p-8"
          >
            {step === "phone" ? (
              <>
                <div className="mb-8">
                  <h2 className="font-login-display mb-2 text-2xl leading-tight font-bold text-primary">
                    Acesse sua conta
                  </h2>
                  <p className="text-sm leading-6 text-quaternary">
                    Enviaremos um código SMS para confirmar seu acesso.
                  </p>
                </div>

                <form onSubmit={handleSubmitPhone} className="space-y-6">
                  <Input
                    label="Celular"
                    placeholder="(00) 00000-0000"
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    size="lg"
                    icon={Phone01}
                    isInvalid={!!error}
                    hint={error ?? undefined}
                    className="gap-2 label:ml-1 label:text-[12px] label:font-bold label:uppercase label:tracking-[0.05em] label:text-quaternary"
                    iconClassName="text-fg-quaternary"
                    wrapperClassName="h-14 rounded-2xl ring-1 ring-primary shadow-none"
                    inputClassName="text-[15px] font-medium text-tertiary placeholder:text-quaternary"
                  />

                  <Button
                    type="submit"
                    size="xl"
                    color="primary"
                    iconTrailing={ArrowRight}
                    isLoading={isLoading}
                    className="font-login-display h-14 w-full rounded-2xl text-[18px] shadow-[0_8px_24px_rgba(16,185,129,0.2)]"
                  >
                    Entrar
                  </Button>
                </form>

                <div className="mt-8 space-y-4 border-t border-primary pt-8 text-center">
                  <Button
                    type="button"
                    size="xl"
                    color="tertiary"
                    className="h-12 w-full rounded-2xl bg-primary-solid text-secondary_on-brand ring-1 ring-primary hover:bg-primary-solid"
                  >
                    Entrar como visitante
                  </Button>

                  <p className="pt-2 text-sm text-quaternary">
                    Ao continuar, você concorda com nossos{" "}
                    <Button
                      href="#"
                      color="link-color"
                      size="sm"
                      className="inline p-0 align-baseline font-semibold text-quaternary hover:text-quaternary"
                    >
                      Termos de Uso
                    </Button>
                    .
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="mb-8">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("phone");
                      setOtp(["", "", "", "", "", ""]);
                      setError(null);
                    }}
                    className="mb-4 flex items-center gap-1 text-sm font-medium text-quaternary transition-colors hover:text-primary"
                  >
                    <ArrowLeft className="size-4" />
                    Alterar número
                  </button>
                  <h2 className="font-login-display mb-2 text-2xl leading-tight font-bold text-primary">
                    Verifique o código
                  </h2>
                  <p className="text-sm leading-6 text-quaternary">
                    Enviamos um código para{" "}
                    <span className="font-semibold text-primary">{phone}</span>
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="mb-2 block text-[12px] font-bold uppercase tracking-[0.05em] text-quaternary">
                      Código de verificação
                    </label>
                    <div className="flex justify-center gap-2 sm:gap-3">
                      {otp.map((digit, i) => (
                        <input
                          key={i}
                          ref={(el) => {
                            otpRefs.current[i] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(i, e)}
                          className="size-12 rounded-2xl border border-secondary bg-primary text-center font-display text-lg font-bold text-primary outline-hidden ring-1 ring-primary transition-shadow focus:border-brand focus:ring-2 focus:ring-brand sm:size-14 sm:text-xl"
                          autoFocus={i === 0}
                        />
                      ))}
                    </div>
                    {error && (
                      <p className="mt-3 text-center text-sm text-error-primary">{error}</p>
                    )}
                  </div>

                  <Button
                    type="button"
                    size="xl"
                    color="primary"
                    isLoading={isLoading}
                    onClick={handleVerifyOtp}
                    className="font-login-display h-14 w-full rounded-2xl text-[18px] shadow-[0_8px_24px_rgba(16,185,129,0.2)]"
                  >
                    Verificar
                  </Button>

                  <div className="text-center">
                    {resendCooldown > 0 ? (
                      <p className="text-sm text-quaternary">
                        Reenviar em{" "}
                        <span className="font-semibold text-primary">{resendCooldown}s</span>
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResend}
                        className="text-sm font-semibold text-brand-secondary hover:text-brand-secondary_hover"
                      >
                        Reenviar código
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </main>

      <footer className="border-t border-secondary bg-primary px-4 py-4 text-center text-sm text-tertiary">
        © 2026 FECHA10 App. Todos os direitos reservados.
      </footer>
    </div>
  );
}

export default LoginPage;