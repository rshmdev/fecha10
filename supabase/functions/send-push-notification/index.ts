import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

interface ServiceAccount {
  client_email: string;
  private_key: string;
  project_id: string;
}

function base64url(source: Uint8Array): string {
  let binary = "";
  source.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function createJwt(serviceAccount: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const encodedHeader = base64url(new TextEncoder().encode(JSON.stringify(header)));
  const encodedPayload = base64url(new TextEncoder().encode(JSON.stringify(payload)));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const pemKey = serviceAccount.private_key
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\n/g, "")
    .trim();

  const keyBuffer = Uint8Array.from(atob(pemKey), (c) => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    "pkcs8",
    keyBuffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signatureInput),
  );

  const encodedSignature = base64url(new Uint8Array(signature));
  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

async function getAccessToken(jwt: string): Promise<string> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const data = await response.json();
  if (!data.access_token) {
    throw new Error(`Failed to get access token: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

async function sendFcmMessage(
  accessToken: string,
  projectId: string,
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>,
) {
  const message = {
    message: {
      token,
      notification: { title, body },
      data: data ?? {},
      android: { notification: { sound: "default" } },
      apns: { payload: { aps: { sound: "default" } } },
    },
  };

  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    },
  );

  return response;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { userIds, title, body, type, peladaId, data } = await req.json();

    if (!userIds?.length || !title) {
      return new Response(JSON.stringify({ error: "userIds and title are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const notifications = userIds.map((userId: string) => ({
      user_id: userId,
      title,
      body: body ?? "",
      type: type ?? "general",
      pelada_id: peladaId ?? null,
      data: data ?? {},
    }));

    const { error: dbError } = await supabase
      .from("notifications")
      .insert(notifications);

    if (dbError) {
      console.error("[PUSH] DB insert error:", dbError.message);
    }

    const { data: devices } = await supabase
      .from("user_devices")
      .select("fcm_token")
      .in("user_id", userIds);

    if (!devices?.length) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, reason: "no_devices" }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    const serviceAccountStr = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
    if (!serviceAccountStr) {
      console.error("[PUSH] FIREBASE_SERVICE_ACCOUNT not set");
      return new Response(
        JSON.stringify({ success: true, sent: 0, reason: "no_service_account" }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    const serviceAccount: ServiceAccount = JSON.parse(serviceAccountStr);
    const jwt = await createJwt(serviceAccount);
    const accessToken = await getAccessToken(jwt);
    const tokens = devices.map((d: { fcm_token: string }) => d.fcm_token);

    let successCount = 0;
    const invalidTokens: string[] = [];

    const sendPromises = tokens.map(async (token: string) => {
      try {
        const response = await sendFcmMessage(accessToken, serviceAccount.project_id, token, title, body ?? "", data);
        if (response.ok) {
          successCount++;
        } else {
          const errorBody = await response.text();
          console.error(`[PUSH] Failed for token ${token.slice(0, 10)}...:`, errorBody);
          if (response.status === 404 || response.status === 410) {
            invalidTokens.push(token);
          }
        }
      } catch (err) {
        console.error(`[PUSH] Error sending to token ${token.slice(0, 10)}...:`, err);
      }
    });

    await Promise.allSettled(sendPromises);

    if (invalidTokens.length > 0) {
      await supabase
        .from("user_devices")
        .delete()
        .in("fcm_token", invalidTokens);
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        total: tokens.length,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  } catch (err) {
    console.error("[PUSH] Error:", err);
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});