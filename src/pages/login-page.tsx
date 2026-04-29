import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { useAuth } from "@/providers/auth-provider";
import logoFecha10 from "@/assets/logo-fecha10.png";

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      const trimmedName = name.trim();
      if (!trimmedName) {
        setError("Informe seu nome.");
        return;
      }
      if (trimmedName.length < 2) {
        setError("Nome muito curto.");
        return;
      }

      setIsLoading(true);
      const { error: loginError } = await login(trimmedName);
      setIsLoading(false);

      if (loginError) {
        setError(loginError);
        return;
      }

      navigate("/home", { replace: true });
    },
    [name, login, navigate],
  );

  return (
    <div className="flex min-h-screen flex-col bg-primary text-primary">
      <main className="bg-pitch-modern relative flex flex-1 items-center justify-center overflow-hidden px-4 py-6">
        <div className="relative z-10 w-full max-w-md">
          <div className="mb-8 text-center">
            <img
              src={logoFecha10}
              alt="Fecha10"
              className="mx-auto h-32 w-auto object-contain drop-shadow-xl"
            />
            <p className="font-login-display text-base leading-snug font-semibold text-primary_on-brand/90 sm:text-[18px]">
              O seu jogo começa aqui.
            </p>
          </div>

          <section
            aria-label="Acesso"
            className="glass-effect w-full rounded-2xl border border-secondary bg-secondary p-6 shadow-[0_20px_50px_rgba(0,0,0,0.2)] sm:p-8"
          >
            <div className="mb-8">
              <h2 className="font-login-display mb-2 text-2xl leading-tight font-bold text-primary">
                Como você se chama?
              </h2>
              <p className="text-sm leading-6 text-quaternary">
                É só colocar seu nome e entrar. Sem cadastro, sem senha.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Seu nome"
                placeholder="Ex: João Silva"
                type="text"
                value={name}
                onChange={setName}
                size="lg"
                isInvalid={!!error}
                hint={error ?? undefined}
                className="gap-2 label:ml-1 label:text-[12px] label:font-bold label:uppercase label:tracking-[0.05em] label:text-quaternary"
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
              <p className="pt-2 text-sm text-quaternary">
                Ao continuar, você concorda com nossos{" "}
                <Button
                  href="/terms"
                  color="link-color"
                  size="sm"
                  className="inline p-0 align-baseline font-semibold text-quaternary hover:text-quaternary"
                >
                  Termos de Uso
                </Button>
                .
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default LoginPage;
