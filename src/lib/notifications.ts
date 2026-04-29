import { supabase } from "@/lib/supabase";

export type NotificationType =
  | "player_joined"
  | "player_declined"
  | "player_left"
  | "player_removed"
  | "payment_confirmed"
  | "payment_reverted"
  | "new_note"
  | "reminder_24h"
  | "reminder_today"
  | "pelada_cancelled"
  | "general";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: NotificationType;
  pelada_id: string | null;
  data: Record<string, string>;
  is_read: boolean;
  created_at: string;
}

async function callEdgeFunction(
  userIds: string[],
  title: string,
  body: string,
  type: NotificationType,
  peladaId?: string,
  data?: Record<string, string>,
) {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) return;

    await supabase.functions.invoke("send-push-notification", {
      body: { userIds, title, body, type, peladaId, data },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error("[NOTIFICATION] Failed to send:", error);
  }
}

export async function notifyAdminPlayerJoined(
  adminId: string,
  playerName: string,
  peladaName: string,
  peladaId: string,
) {
  return callEdgeFunction(
    [adminId],
    "Novo jogador confirmado!",
    `${playerName} confirmou presença em ${peladaName}`,
    "player_joined",
    peladaId,
  );
}

export async function notifyAdminPlayerDeclined(
  adminId: string,
  playerName: string,
  peladaName: string,
  peladaId: string,
) {
  return callEdgeFunction(
    [adminId],
    "Jogador cancelou",
    `${playerName} não vai mais em ${peladaName}`,
    "player_declined",
    peladaId,
  );
}

export async function notifyPlayerRemoved(
  playerId: string,
  peladaName: string,
  peladaId: string,
) {
  return callEdgeFunction(
    [playerId],
    "Você foi removido",
    `Você foi removido da pelada ${peladaName}`,
    "player_removed",
    peladaId,
  );
}

export async function notifyPaymentConfirmed(
  playerId: string,
  peladaName: string,
  peladaId: string,
) {
  return callEdgeFunction(
    [playerId],
    "Pagamento confirmado!",
    `Seu pagamento de ${peladaName} foi confirmado`,
    "payment_confirmed",
    peladaId,
  );
}

export async function notifyPaymentReverted(
  playerId: string,
  peladaName: string,
  peladaId: string,
) {
  return callEdgeFunction(
    [playerId],
    "Pagamento revertido",
    `O status do seu pagamento de ${peladaName} foi alterado para pendente`,
    "payment_reverted",
    peladaId,
  );
}

export async function notifyNewNote(
  participantIds: string[],
  authorName: string,
  peladaName: string,
  peladaId: string,
) {
  return callEdgeFunction(
    participantIds,
    "Nova nota",
    `${authorName} adicionou uma nota em ${peladaName}`,
    "new_note",
    peladaId,
  );
}

export async function notifyParticipants(
  userIds: string[],
  title: string,
  body: string,
  type: NotificationType,
  peladaId: string,
) {
  return callEdgeFunction(userIds, title, body, type, peladaId);
}

export async function fetchNotifications(): Promise<Notification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[NOTIFICATION] Fetch error:", error);
    return [];
  }
  return (data ?? []) as Notification[];
}

export async function markNotificationAsRead(id: string) {
  await supabase.from("notifications").update({ is_read: true }).eq("id", id);
}

export async function markAllNotificationsAsRead(deviceId: string) {
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", deviceId)
    .eq("is_read", false);
}

export async function getUnreadNotificationCount(deviceId: string): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", deviceId)
    .eq("is_read", false);

  if (error) return 0;
  return count ?? 0;
}

export async function sendReminderToPending(
  pendingPlayerIds: string[],
  peladaName: string,
  peladaId: string,
  peladaDate: string,
  peladaTime: string,
) {
  const timeStr = peladaTime.slice(0, 5);
  return callEdgeFunction(
    pendingPlayerIds,
    "⏰ Lembrete de Pelada!",
    `Você ainda não confirmou presença em ${peladaName} (${peladaDate} às ${timeStr}). Confirme agora!`,
    "reminder_24h",
    peladaId,
  );
}