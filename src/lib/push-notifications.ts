import { supabase } from "@/lib/supabase";

export async function saveFcmToken(userId: string, fcmToken: string) {
  const { error } = await supabase
    .from("user_devices")
    .upsert(
      { user_id: userId, fcm_token: fcmToken, updated_at: new Date().toISOString() },
      { onConflict: "fcm_token" }
    );

  if (error) {
    console.error("[PUSH] saveFcmToken error:", error.message);
  }
}

export async function removeFcmToken(fcmToken: string) {
  const { error } = await supabase
    .from("user_devices")
    .delete()
    .eq("fcm_token", fcmToken);

  if (error) {
    console.error("[PUSH] removeFcmToken error:", error.message);
  }
}