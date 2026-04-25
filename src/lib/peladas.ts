import { supabase } from "@/lib/supabase";

export interface Pelada {
  id: string;
  admin_id: string;
  name: string;
  description: string | null;
  location: string;
  latitude: number | null;
  longitude: number | null;
  date: string;
  start_time: string;
  end_time: string;
  max_players: number;
  price: number | null;
  image_url: string | null;
  status: "open" | "full" | "closed" | "cancelled";
  invite_code: string;
  recurrence_type: "unique" | "weekly" | null;
  recurrence_days: number[] | null;
  created_at: string;
  updated_at: string;
  confirmed_count?: number;
}

export interface Participant {
  id: string;
  pelada_id: string;
  profile_id: string;
  status: "confirmed" | "declined" | "pending" | "guest";
  team: "a" | "b" | null;
  payment_status: "paid" | "pending" | "exempt";
  payment_type: "monthly" | "session";
  is_admin: boolean;
  created_at: string;
  updated_at: string;
  profile?: {
    name: string | null;
    phone: string;
    avatar_url: string | null;
    positions: string[] | null;
  };
}

export async function getUserPeladas(userId: string): Promise<Pelada[]> {
  const { data, error } = await supabase
    .from("participants")
    .select("pelada_id, peladas(*)")
    .eq("profile_id", userId)
    .in("status", ["confirmed", "pending"])
    .order("created_at", { referencedTable: "peladas", ascending: false });

  if (error) {
    console.error("Error fetching peladas:", error);
    return [];
  }

  const peladas = (data ?? [])
    .map((row: { pelada_id: string; peladas: Pelada | Pelada[] | null }) => {
      if (Array.isArray(row.peladas)) return row.peladas[0];
      return row.peladas;
    })
    .filter(Boolean) as Pelada[];

  const peladasWithCounts = await Promise.all(
    peladas.map(async (pelada) => {
      const { count } = await supabase
        .from("participants")
        .select("*", { count: "exact", head: true })
        .eq("pelada_id", pelada.id)
        .eq("status", "confirmed");
      return { ...pelada, confirmed_count: count ?? 0 };
    }),
  );

  return peladasWithCounts;
}

export async function getNextPelada(
  userId: string,
): Promise<(Pelada & { confirmed_count: number }) | null> {
  const peladas = await getUserPeladas(userId);
  const upcoming = peladas
    .filter(
      (p) =>
        p.date >= new Date().toISOString().split("T")[0] &&
        p.status !== "cancelled",
    )
    .sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.start_time}`);
      const dateB = new Date(`${b.date}T${b.start_time}`);
      return dateA.getTime() - dateB.getTime();
    });
  return (upcoming[0] as Pelada & { confirmed_count: number }) ?? null;
}

export async function getParticipants(
  peladaId: string,
): Promise<Participant[]> {
  const { data, error } = await supabase
    .from("participants")
    .select("*, profile:profiles(name, phone, avatar_url, positions)")
    .eq("pelada_id", peladaId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching participants:", error);
    return [];
  }

  return (data ?? []) as unknown as Participant[];
}

export async function getUserRole(
  peladaId: string,
  userId: string,
): Promise<{ isAdmin: boolean; isParticipant: boolean }> {
  const { data, error } = await supabase
    .from("participants")
    .select("is_admin")
    .eq("pelada_id", peladaId)
    .eq("profile_id", userId)
    .single();

  if (error || !data) {
    return { isAdmin: false, isParticipant: false };
  }

  return { isAdmin: data.is_admin, isParticipant: true };
}

export async function getConfirmedParticipants(
  peladaId: string,
): Promise<Participant[]> {
  const { data, error } = await supabase
    .from("participants")
    .select("*, profile:profiles(name, phone, avatar_url, positions)")
    .eq("pelada_id", peladaId)
    .eq("status", "confirmed")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching confirmed participants:", error);
    return [];
  }

  return (data ?? []) as unknown as Participant[];
}

export async function joinPelada(
  peladaId: string,
  userId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("participants")
    .insert({ pelada_id: peladaId, profile_id: userId, status: "confirmed" });
  if (error) return { error: error.message };
  return { error: null };
}

export async function removeParticipation(
  peladaId: string,
  userId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("participants")
    .delete()
    .eq("pelada_id", peladaId)
    .eq("profile_id", userId);
  if (error) return { error: error.message };
  return { error: null };
}

export async function declinePelada(
  peladaId: string,
  userId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("participants")
    .update({ status: "declined" })
    .eq("pelada_id", peladaId)
    .eq("profile_id", userId);
  if (error) return { error: error.message };
  return { error: null };
}

export async function getPeladaByInviteCode(
  inviteCode: string,
): Promise<Pelada | null> {
  const { data, error } = await supabase
    .from("peladas")
    .select("*")
    .eq("invite_code", inviteCode)
    .single();

  if (error || !data) return null;
  return data as Pelada;
}

export async function getPeladaById(peladaId: string): Promise<Pelada | null> {
  const { data, error } = await supabase
    .from("peladas")
    .select("*")
    .eq("id", peladaId)
    .single();

  if (error || !data) return null;
  return data as Pelada;
}

export async function createPelada(
  pelada: Omit<
    Pelada,
    | "id"
    | "invite_code"
    | "created_at"
    | "updated_at"
    | "status"
    | "confirmed_count"
  >,
): Promise<{ data: Pelada | null; error: string | null }> {
  const { data: peladaData, error } = await supabase
    .from("peladas")
    .insert({
      ...pelada,
      status: "open",
      recurrence_type: pelada.recurrence_type ?? "unique",
      recurrence_days: pelada.recurrence_days ?? null,
    })
    .select()
    .single();

  if (error) return { data: null, error: error.message };

  const peladaId = peladaData.id;
  const adminId = pelada.admin_id;

  const { error: participantError } = await supabase
    .from("participants")
    .insert({
      pelada_id: peladaId,
      profile_id: adminId,
      status: "confirmed",
      is_admin: true,
      payment_status: "exempt",
      payment_type: "monthly",
    });

  if (participantError) {
    console.error("Error adding admin participant:", participantError);
  }

  return { data: peladaData as Pelada, error: null };
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const days = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
  const months = [
    "JAN",
    "FEV",
    "MAR",
    "ABR",
    "MAI",
    "JUN",
    "JUL",
    "AGO",
    "SET",
    "OUT",
    "NOV",
    "DEZ",
  ];
  return `${days[date.getDay()]}, ${date.getDate().toString().padStart(2, "0")} ${months[date.getMonth()]}`;
}

export function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(":");
  return `${h}:${m}`;
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export interface ProfileStats {
  totalGames: number;
  attendanceRate: number;
}

export async function getProfileStats(userId: string): Promise<ProfileStats> {
  const { count: totalGames, error: totalError } = await supabase
    .from("participants")
    .select("*", { count: "exact", head: true })
    .eq("profile_id", userId);

  if (totalError) {
    console.error("Error fetching total games:", totalError);
    return { totalGames: 0, attendanceRate: 0 };
  }

  const { count: confirmedGames, error: confirmedError } = await supabase
    .from("participants")
    .select("*", { count: "exact", head: true })
    .eq("profile_id", userId)
    .eq("status", "confirmed");

  if (confirmedError) {
    console.error("Error fetching confirmed games:", confirmedError);
    return { totalGames: totalGames ?? 0, attendanceRate: 0 };
  }

  const total = totalGames ?? 0;
  const confirmed = confirmedGames ?? 0;
  const attendanceRate = total > 0 ? Math.round((confirmed / total) * 100) : 0;

  return { totalGames: total, attendanceRate };
}

export interface PeladaHistory {
  id: string;
  name: string;
  location: string;
  date: string;
  start_time: string;
  status: "confirmed" | "declined" | "pending" | "guest";
}

export async function getPeladaHistory(
  userId: string,
): Promise<PeladaHistory[]> {
  const { data, error } = await supabase
    .from("participants")
    .select("status, peladas(id, name, location, date, start_time)")
    .eq("profile_id", userId)
    .order("created_at", { referencedTable: "peladas", ascending: false });

  if (error || !data) {
    console.error("Error fetching pelada history:", error);
    return [];
  }

  return data
    .map(
      (row: {
        status: string;
        peladas:
          | {
              id: string;
              name: string;
              location: string;
              date: string;
              start_time: string;
            }[]
          | null;
      }) => {
        if (!row.peladas) return null;
        const p = Array.isArray(row.peladas) ? row.peladas[0] : row.peladas;
        return {
          id: p.id,
          name: p.name,
          location: p.location,
          date: p.date,
          start_time: p.start_time,
          status: row.status as PeladaHistory["status"],
        };
      },
    )
    .filter((item): item is PeladaHistory => item !== null);
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 13 && digits.startsWith("55")) {
    const ddd = digits.slice(2, 4);
    const prefix = digits.slice(4, 9);
    const suffix = digits.slice(9);
    return `(${ddd}) ${prefix}-${suffix}`;
  }
  if (digits.length === 11) {
    const ddd = digits.slice(0, 2);
    const prefix = digits.slice(2, 7);
    const suffix = digits.slice(7);
    return `(${ddd}) ${prefix}-${suffix}`;
  }
  return phone;
}

export function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatMonthLabel(month: string): string {
  const [year, monthStr] = month.split("-");
  const months = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  return `${months[parseInt(monthStr, 10) - 1]} ${year}`;
}

export interface Payment {
  id: string;
  pelada_id: string;
  profile_id: string;
  amount: number;
  payment_type: "monthly" | "session";
  reference_month: string | null;
  status: "paid" | "pending";
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinanceParticipant {
  profile: unknown;
  id: string;
  profile_id: string;
  pelada_id: string;
  status: "confirmed" | "declined" | "pending" | "guest";
  payment_type: "monthly" | "session";
  is_admin: boolean;
  name: string | null;
  avatar_url: string | null;
  phone: string;
  payment_status: "paid" | "pending" | "exempt";
  payments: Payment[];
}

export interface FinanceSummary {
  totalExpected: number;
  totalCollected: number;
  totalPending: number;
  participantCount: number;
  paidCount: number;
}

export async function getAdminPeladas(userId: string): Promise<Pelada[]> {
  const { data, error } = await supabase
    .from("peladas")
    .select("*")
    .eq("admin_id", userId)
    .order("date", { ascending: false });

  if (error) {
    console.error("Error fetching admin peladas:", error);
    return [];
  }
  return (data ?? []) as Pelada[];
}

export async function getFinanceParticipants(
  peladaId: string,
  currentMonth: string,
): Promise<FinanceParticipant[]> {
  console.log(
    "Fetching finance participants for peladaId:",
    peladaId,
    "and month:",
    currentMonth,
  );
  const { data: participants, error: pError } = await supabase
    .from("participants")
    .select(
      "id, profile_id, pelada_id, status, payment_type, is_admin, payment_status, profile:profiles(name, phone, avatar_url)",
    )
    .eq("pelada_id", peladaId)
    .in("status", ["confirmed", "pending"]);

  if (pError || !participants) {
    console.error("Error fetching finance participants:", pError);
    return [];
  }

  const { data: payments, error: payError } = await supabase
    .from("payments")
    .select("*")
    .eq("pelada_id", peladaId);

  if (payError) {
    console.error("Error fetching payments:", payError);
  }

  const paymentsByProfile = new Map<string, Payment[]>();
  for (const p of (payments ?? []) as Payment[]) {
    const existing = paymentsByProfile.get(p.profile_id) ?? [];
    existing.push(p);
    paymentsByProfile.set(p.profile_id, existing);
  }

  return (participants as unknown as FinanceParticipant[]).map((p) => {
    const profile = p.profile as unknown as {
      name: string | null;
      phone: string;
      avatar_url: string | null;
    } | null;
    return {
      ...p,
      name: profile?.name ?? null,
      phone: profile?.phone ?? "",
      avatar_url: profile?.avatar_url ?? null,
      payments: paymentsByProfile.get(p.profile_id) ?? [],
    };
  });
}

export function computeFinanceSummary(
  participants: FinanceParticipant[],
  peladaPrice: number,
  currentMonth: string,
): FinanceSummary {
  let totalCollected = 0;
  let totalPending = 0;
  let paidCount = 0;

  for (const p of participants) {
    if (p.is_admin) continue;

    const relevantPayment = p.payments.find((pay) =>
      pay.payment_type === "monthly"
        ? pay.reference_month === currentMonth
        : pay.payment_type === "session",
    );

    if (relevantPayment?.status === "paid" || p.payment_status === "exempt") {
      totalCollected +=
        p.payment_type === "monthly" ? peladaPrice : peladaPrice;
      paidCount++;
    } else {
      totalPending += p.payment_type === "monthly" ? peladaPrice : peladaPrice;
    }
  }

  const totalExpected = totalCollected + totalPending;
  const participantCount = participants.filter((p) => !p.is_admin).length;

  return {
    totalExpected,
    totalCollected,
    totalPending,
    participantCount,
    paidCount,
  };
}

export async function markAsPaid(
  peladaId: string,
  profileId: string,
  paymentType: "monthly" | "session",
  amount: number,
  currentMonth: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("payments").upsert(
    {
      pelada_id: peladaId,
      profile_id: profileId,
      amount,
      payment_type: paymentType,
      reference_month: paymentType === "monthly" ? currentMonth : null,
      status: "paid",
      paid_at: new Date().toISOString(),
    },
    { onConflict: "pelada_id,profile_id,payment_type,reference_month" },
  );

  if (error) return { error: error.message };
  return { error: null };
}

export async function markAsUnpaid(
  peladaId: string,
  profileId: string,
  paymentType: "monthly" | "session",
  currentMonth: string,
): Promise<{ error: string | null }> {
  if (paymentType === "monthly") {
    const { error } = await supabase
      .from("payments")
      .delete()
      .eq("pelada_id", peladaId)
      .eq("profile_id", profileId)
      .eq("payment_type", "monthly")
      .eq("reference_month", currentMonth);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("payments")
      .delete()
      .eq("pelada_id", peladaId)
      .eq("profile_id", profileId)
      .eq("payment_type", "session")
      .is("reference_month", null);
    if (error) return { error: error.message };
  }
  return { error: null };
}

export async function removeParticipant(
  peladaId: string,
  profileId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("participants")
    .delete()
    .eq("pelada_id", peladaId)
    .eq("profile_id", profileId);
  if (error) return { error: error.message };
  return { error: null };
}

export async function setParticipantPaymentType(
  peladaId: string,
  profileId: string,
  paymentType: "monthly" | "session",
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("participants")
    .update({ payment_type: paymentType })
    .eq("pelada_id", peladaId)
    .eq("profile_id", profileId);
  if (error) return { error: error.message };
  return { error: null };
}

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export interface PeladaNote {
  id: string;
  pelada_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: {
    name: string | null;
    avatar_url: string | null;
  };
}

export async function getPeladaNotes(peladaId: string): Promise<PeladaNote[]> {
  const { data, error } = await supabase
    .from("pelada_notes")
    .select("*, author:profiles(name, avatar_url)")
    .eq("pelada_id", peladaId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching notes:", error);
    return [];
  }

  return (data ?? []) as unknown as PeladaNote[];
}

export async function createPeladaNote(
  peladaId: string,
  authorId: string,
  content: string,
): Promise<{ data: PeladaNote | null; error: string | null }> {
  const { data, error } = await supabase
    .from("pelada_notes")
    .insert({ pelada_id: peladaId, author_id: authorId, content })
    .select("*, author:profiles(name, avatar_url)")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as unknown as PeladaNote, error: null };
}

export async function deletePeladaNote(
  noteId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("pelada_notes")
    .delete()
    .eq("id", noteId);
  if (error) return { error: error.message };
  return { error: null };
}
