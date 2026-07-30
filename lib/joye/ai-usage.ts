import { createAdminClient } from "@/lib/supabase/admin";

export type AiUsageSnapshot = {
  enabled: boolean;
  dailyLimit: number;
  monthlyLimit: number;
  minuteLimit: number;
  dailyUsed: number;
  monthlyUsed: number;
  minuteUsed: number;
  remainingDaily: number;
  remainingMonthly: number;
  available: boolean;
  reason: "available" | "disabled" | "daily_limit" | "monthly_limit" | "minute_limit" | "usage_unavailable";
};

type Reservation = AiUsageSnapshot & { eventId: string | null };

function positiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function aiLimits() {
  return {
    dailyLimit: positiveInteger(process.env.AI_DAILY_LIMIT, 10),
    monthlyLimit: positiveInteger(process.env.AI_MONTHLY_LIMIT, 100),
    minuteLimit: positiveInteger(process.env.AI_MINUTE_LIMIT, 4),
  };
}

export function liveAiConfigured() {
  return process.env.AI_ENABLED === "true"
    && Boolean(process.env.OPENAI_API_KEY)
    && Boolean(process.env.SUPABASE_SECRET_KEY);
}

function disabledSnapshot(reason: AiUsageSnapshot["reason"] = "disabled"): AiUsageSnapshot {
  const limits = aiLimits();
  return {
    enabled: false,
    ...limits,
    dailyUsed: 0,
    monthlyUsed: 0,
    minuteUsed: 0,
    remainingDaily: limits.dailyLimit,
    remainingMonthly: limits.monthlyLimit,
    available: false,
    reason,
  };
}

function startOfUtcDay() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
}

function startOfUtcMonth() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

async function countUsage(userId: string, since: string) {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from("ai_usage_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("status", ["reserved", "success"])
    .gte("created_at", since);
  if (error) throw error;
  return count || 0;
}

export async function getAiUsageSnapshot(userId: string): Promise<AiUsageSnapshot> {
  if (!liveAiConfigured()) return disabledSnapshot();
  const limits = aiLimits();
  try {
    const [dailyUsed, monthlyUsed, minuteUsed] = await Promise.all([
      countUsage(userId, startOfUtcDay()),
      countUsage(userId, startOfUtcMonth()),
      countUsage(userId, new Date(Date.now() - 60_000).toISOString()),
    ]);
    const reason: AiUsageSnapshot["reason"] = minuteUsed >= limits.minuteLimit
      ? "minute_limit"
      : dailyUsed >= limits.dailyLimit
        ? "daily_limit"
        : monthlyUsed >= limits.monthlyLimit
          ? "monthly_limit"
          : "available";
    return {
      enabled: true,
      ...limits,
      dailyUsed,
      monthlyUsed,
      minuteUsed,
      remainingDaily: Math.max(0, limits.dailyLimit - dailyUsed),
      remainingMonthly: Math.max(0, limits.monthlyLimit - monthlyUsed),
      available: reason === "available",
      reason,
    };
  } catch (error) {
    console.error("Could not read Joye AI usage. Live AI will stay off for this request.", error);
    return disabledSnapshot("usage_unavailable");
  }
}

export async function reserveAiUsage(userId: string, conversationId: string, model: string): Promise<Reservation> {
  if (!liveAiConfigured()) return { ...disabledSnapshot(), eventId: null };
  const limits = aiLimits();
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("reserve_ai_usage", {
      p_user_id: userId,
      p_conversation_id: conversationId,
      p_model: model,
      p_daily_limit: limits.dailyLimit,
      p_monthly_limit: limits.monthlyLimit,
      p_minute_limit: limits.minuteLimit,
    });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    const dailyUsed = Number(row?.daily_used || 0);
    const monthlyUsed = Number(row?.monthly_used || 0);
    const minuteUsed = Number(row?.minute_used || 0);
    const reason = (row?.reason || "usage_unavailable") as AiUsageSnapshot["reason"];
    return {
      enabled: true,
      ...limits,
      dailyUsed,
      monthlyUsed,
      minuteUsed,
      remainingDaily: Math.max(0, limits.dailyLimit - dailyUsed),
      remainingMonthly: Math.max(0, limits.monthlyLimit - monthlyUsed),
      available: Boolean(row?.allowed),
      reason,
      eventId: row?.event_id || null,
    };
  } catch (error) {
    console.error("Could not reserve Joye AI usage. Live AI will stay off for this request.", error);
    return { ...disabledSnapshot("usage_unavailable"), eventId: null };
  }
}

export async function finalizeAiUsage(eventId: string, details: {
  status: "success" | "error";
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  requestId?: string | null;
  errorCode?: string | null;
}) {
  try {
    const admin = createAdminClient();
    const { error } = await admin.rpc("finalize_ai_usage", {
      p_event_id: eventId,
      p_status: details.status,
      p_input_tokens: details.inputTokens || 0,
      p_output_tokens: details.outputTokens || 0,
      p_total_tokens: details.totalTokens || 0,
      p_request_id: details.requestId || null,
      p_error_code: details.errorCode || null,
    });
    if (error) throw error;
  } catch (error) {
    console.error("Could not finalize Joye AI usage record.", error);
  }
}
