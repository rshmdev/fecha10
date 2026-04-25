import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Users01,
  Wallet01,
  MarkerPin01,
  PlusCircle,
  Clock,
} from "@untitledui/icons";
import { usePlacesWidget } from "react-google-autocomplete";
import { Input } from "@/components/base/input/input";
import { TextArea } from "@/components/base/textarea/textarea";
import { Button } from "@/components/base/buttons/button";
import { AppLayout } from "@/components/application/app-layout/app-layout";
import { MapPreview } from "@/components/application/map-preview/map-preview";
import { useAuth } from "@/providers/auth-provider";
import { createPelada } from "@/lib/peladas";
import { GOOGLE_MAPS_API_KEY } from "@/lib/google-maps";
import { cx } from "@/utils/cx";

function formatCurrency(value: string): string {
  const digits = value.replace(/\D/g, "");
  const num = parseInt(digits || "0", 10) / 100;
  return num.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const hasGoogleMapsKey =
  !!GOOGLE_MAPS_API_KEY &&
  GOOGLE_MAPS_API_KEY !== "YOUR_GOOGLE_MAPS_API_KEY_HERE";

function CreateMatchPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [maxPlayers, setMaxPlayers] = useState("14");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recurrenceType, setRecurrenceType] = useState<"unique" | "weekly">(
    "unique",
  );
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  const getNextWeekday = useCallback((days: number[]) => {
    const today = new Date();
    const todayDay = today.getDay();
    let nextDay = days.find((d) => d > todayDay);
    if (nextDay === undefined) {
      nextDay = days[0];
    }
    if (nextDay === undefined) return "";

    const result = new Date(today);
    if (nextDay !== todayDay) {
      const diff = nextDay - todayDay;
      result.setDate(today.getDate() + diff);
    } else {
      result.setDate(today.getDate() + 7);
    }
    return result.toISOString().split("T")[0];
  }, []);

  useEffect(() => {
    if (recurrenceType === "weekly" && selectedDays.length > 0) {
      const nextDate = getNextWeekday(selectedDays);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (nextDate) setDate(nextDate);
    }
  }, [recurrenceType, selectedDays, getNextWeekday]);

  const { ref } = usePlacesWidget({
    apiKey: GOOGLE_MAPS_API_KEY,
    options: {
      types: ["establishment", "geocode"],
      componentRestrictions: { country: "br" },
      fields: ["formatted_address", "name", "geometry"],
    },
    onPlaceSelected: (place) => {
      if (place.formatted_address) {
        setLocation(place.formatted_address);
      } else if (place.name) {
        setLocation(place.name);
      }
      if (place.geometry?.location) {
        setLatitude(place.geometry.location.lat());
        setLongitude(place.geometry.location.lng());
      }
    },
  });

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
  }, []);

  const handlePriceChange = useCallback((value: string) => {
    setPrice(formatCurrency(value));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (!name.trim()) {
        setError("Informe o nome da pelada.");
        return;
      }
      if (!date) {
        setError("Informe a data.");
        return;
      }
      if (!startTime || !endTime) {
        setError("Informe o horário de início e fim.");
        return;
      }
      if (!location.trim()) {
        setError("Informe o local.");
        return;
      }
      if (recurrenceType === "weekly" && selectedDays.length === 0) {
        setError("Selecione pelo menos um dia da semana.");
        return;
      }
      if (!profile?.id) {
        setError("Você precisa estar logado.");
        return;
      }

      setIsSubmitting(true);

      const result = await createPelada({
        admin_id: profile.id,
        name: name.trim(),
        description: description.trim() || null,
        location: location.trim(),
        latitude,
        longitude,
        date,
        start_time: startTime,
        end_time: endTime,
        max_players: parseInt(maxPlayers, 10) || 14,
        price: price ? parseFloat(price.replace(",", ".")) : null,
        image_url: null,
        recurrence_type: recurrenceType,
        recurrence_days: recurrenceType === "weekly" ? selectedDays : null,
      });

      setIsSubmitting(false);

      if (result.error) {
        setError(result.error);
        return;
      }

      navigate("/home", { replace: true });
    },
    [
      name,
      date,
      startTime,
      endTime,
      location,
      latitude,
      longitude,
      maxPlayers,
      price,
      description,
      profile,
      navigate,
      recurrenceType,
      selectedDays,
    ],
  );

  return (
    <AppLayout
      topAppBarProps={{
        leading: (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-full p-2 text-fg-quaternary transition-colors hover:bg-primary_hover active:scale-95"
          >
            <ArrowLeft className="size-5" />
          </button>
        ),
      }}
    >
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-20 pb-48">
        <div className="mb-8">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">
            Criar nova pelada
          </h2>
          <p className="mt-2 text-sm text-secondary">
            Preencha os detalhes para convocar a galera.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col gap-2">
            <label className="ml-1 font-display text-xs font-bold uppercase tracking-wider text-secondary">
              NOME DA PELADA
            </label>
            <Input
              placeholder="Ex: Pelada de Sexta"
              size="lg"
              value={name}
              onChange={setName}
              isRequired
              wrapperClassName="h-14 rounded-2xl"
              inputClassName="font-medium text-tertiary placeholder:text-quaternary"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="ml-1 font-display text-xs font-bold uppercase tracking-wider text-secondary">
              TIPO DE PELADA
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setRecurrenceType("unique");
                  setSelectedDays([]);
                }}
                className={cx(
                  "flex-1 rounded-2xl border-2 py-3 font-display text-sm font-semibold transition-all",
                  recurrenceType === "unique"
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-secondary bg-primary text-secondary hover:border-brand/50",
                )}
              >
                Única
              </button>
              <button
                type="button"
                onClick={() => setRecurrenceType("weekly")}
                className={cx(
                  "flex-1 rounded-2xl border-2 py-3 font-display text-sm font-semibold transition-all",
                  recurrenceType === "weekly"
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-secondary bg-primary text-secondary hover:border-brand/50",
                )}
              >
                Recorrente
              </button>
            </div>
          </div>

          {recurrenceType === "weekly" && (
            <div className="flex flex-col gap-2">
              <label className="ml-1 font-display text-xs font-bold uppercase tracking-wider text-secondary">
                DIAS DA SEMANA
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { day: 0, label: "Dom" },
                  { day: 1, label: "Seg" },
                  { day: 2, label: "Ter" },
                  { day: 3, label: "Qua" },
                  { day: 4, label: "Qui" },
                  { day: 5, label: "Sex" },
                  { day: 6, label: "Sáb" },
                ].map(({ day, label }) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      setSelectedDays((prev) =>
                        prev.includes(day)
                          ? prev.filter((d) => d !== day)
                          : [...prev, day],
                      );
                    }}
                    className={cx(
                      "h-11 min-w-11 rounded-full px-4 font-display text-sm font-semibold transition-all duration-200",
                      selectedDays.includes(day)
                        ? "bg-brand text-primary shadow-lg shadow-brand/40 ring-2 ring-brand ring-offset-2 ring-offset-secondary"
                        : "bg-primary text-secondary border border-secondary hover:border-brand hover:text-brand",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="ml-1 font-display text-xs font-bold uppercase tracking-wider text-secondary">
                DATA
              </label>
              <Input
                type="date"
                size="lg"
                value={date}
                onChange={setDate}
                isRequired
                wrapperClassName="h-14 rounded-2xl"
                inputClassName="font-medium text-tertiary"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="ml-1 font-display text-xs font-bold uppercase tracking-wider text-secondary">
                HORÁRIO
              </label>
              <div className="flex h-14 items-center gap-2">
                <Input
                  type="time"
                  size="lg"
                  value={startTime}
                  onChange={setStartTime}
                  isRequired
                  wrapperClassName="h-full flex-1 rounded-2xl"
                  inputClassName="font-medium text-tertiary"
                />
                <Clock className="size-4 shrink-0 text-fg-quaternary" />
                <Input
                  type="time"
                  size="lg"
                  value={endTime}
                  onChange={setEndTime}
                  isRequired
                  wrapperClassName="h-full flex-1 rounded-2xl"
                  inputClassName="font-medium text-tertiary"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="ml-1 font-display text-xs font-bold uppercase tracking-wider text-secondary">
              LOCAL
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-quaternary">
                <MarkerPin01 className="size-5" />
              </div>
              <Input
                ref={ref}
                placeholder="Nome do campo ou endereço"
                size="lg"
                value={location}
                onChange={(v) =>
                  setLocation(typeof v === "string" ? v : String(v))
                }
                wrapperClassName={cx(
                  "h-14 rounded-2xl",
                  !hasGoogleMapsKey && "pointer-events-none opacity-50",
                )}
                inputClassName="font-medium text-tertiary placeholder:text-quaternary"
              />
            </div>

            <div className="mt-2 h-40 overflow-hidden rounded-2xl shadow-sm">
              <MapPreview
                latitude={latitude}
                longitude={longitude}
                onMapClick={handleMapClick}
                className="h-full w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="ml-1 font-display text-xs font-bold uppercase tracking-wider text-secondary">
                LIMITE DE JOGADORES
              </label>
              <Input
                type="number"
                placeholder="Ex: 14"
                icon={Users01}
                size="lg"
                value={maxPlayers}
                onChange={setMaxPlayers}
                wrapperClassName="h-14 rounded-2xl"
                inputClassName="font-medium text-tertiary placeholder:text-quaternary"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="ml-1 font-display text-xs font-bold uppercase tracking-wider text-secondary">
                VALOR (R$)
              </label>
              <Input
                type="text"
                placeholder="0,00"
                icon={Wallet01}
                size="lg"
                value={price}
                onChange={handlePriceChange}
                wrapperClassName="h-14 rounded-2xl"
                inputClassName="font-medium text-tertiary placeholder:text-quaternary"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="ml-1 font-display text-xs font-bold uppercase tracking-wider text-secondary">
              OBSERVAÇÕES
            </label>
            <TextArea
              placeholder="Ex: Trazer colete reserva, campo society, levar chuteira de trava..."
              rows={4}
              value={description}
              onChange={setDescription}
              size="md"
              className="rounded-2xl font-medium text-tertiary placeholder:text-quaternary"
            />
          </div>

          {error && (
            <p className="text-center text-sm text-error-primary">{error}</p>
          )}
        </form>
      </main>

      <div className="fixed bottom-0 left-0 z-40 w-full bg-gradient-to-t from-secondary via-secondary to-transparent p-6 pb-28">
        <div className="mx-auto max-w-2xl">
          <Button
            type="submit"
            size="xl"
            color="primary"
            iconLeading={PlusCircle}
            isLoading={isSubmitting}
            onClick={handleSubmit}
            className="h-16 w-full rounded-2xl font-display text-lg shadow-lg"
          >
            Criar pelada
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}

export default CreateMatchPage;
