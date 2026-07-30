import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { loadJoyeContext, contextForPrompt, type CoachSection } from "@/lib/joye/load-context";
import { buildLocalCoachReply } from "@/lib/joye/local-coach";
import { finalizeAiUsage, getAiUsageSnapshot, reserveAiUsage } from "@/lib/joye/ai-usage";

const requestSchema = z.object({
  message: z.string().trim().min(2).max(1200),
  section: z.enum(["today", "money", "career", "goals", "weekly", "general"]).default("general"),
  conversationId: z.string().uuid().nullable().optional(),
});

type Provider = "guided" | "guided_fallback" | "guided_limit" | "openai";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to use Joye." }, { status: 401 });

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a clear question for Joye." }, { status: 400 });
  const { message, section } = parsed.data;

  let conversationId = parsed.data.conversationId ?? null;
  if (conversationId) {
    const { data: owned } = await supabase.from("joye_conversations").select("id").eq("id", conversationId).eq("user_id", user.id).maybeSingle();
    if (!owned) conversationId = null;
  }
  if (!conversationId) {
    const { data: conversation, error } = await supabase.from("joye_conversations").insert({
      user_id: user.id,
      section,
      title: message.slice(0, 72),
    }).select("id").single();
    if (error || !conversation) return NextResponse.json({ error: "Joye could not start the conversation." }, { status: 500 });
    conversationId = conversation.id;
  }

  await supabase.from("joye_messages").insert({ user_id: user.id, conversation_id: conversationId, role: "user", content: message });
  const fallbackName = user.user_metadata?.display_name || user.email?.split("@")[0] || "Member";
  const context = await loadJoyeContext(supabase, user.id, fallbackName);

  const { data: history } = await supabase.from("joye_messages")
    .select("role,content")
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(14);

  const userHistory = (history ?? [])
    .filter((item: { role: string; content: string }) => item.role === "user")
    .map((item: { role: string; content: string }) => item.content);
  if (userHistory[userHistory.length - 1] === message) userHistory.pop();

  const local = buildLocalCoachReply(context, section as CoachSection, message, userHistory.slice(-3));
  let answer = formatLocal(local);
  let provider: Provider = "guided";
  let requestId: string | null = null;
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const reservation = await reserveAiUsage(user.id, conversationId, model);

  if (reservation.enabled && !reservation.available) {
    provider = reservation.reason === "daily_limit" || reservation.reason === "monthly_limit" || reservation.reason === "minute_limit"
      ? "guided_limit"
      : "guided_fallback";
  }

  if (reservation.available && reservation.eventId) {
    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          store: false,
          max_output_tokens: positiveInteger(process.env.AI_MAX_OUTPUT_TOKENS, 500),
          safety_identifier: createHash("sha256").update(user.id).digest("hex"),
          instructions: instructions(section as CoachSection, context.profile.planningStyle),
          input: [
            { role: "developer", content: `Saved Joye Life context:\n${JSON.stringify(contextForPrompt(context, section as CoachSection))}` },
            ...(history ?? []).slice(-8).map((item: { role: string; content: string }) => ({ role: item.role === "assistant" ? "assistant" : "user", content: item.content })),
          ],
        }),
      });
      requestId = response.headers.get("x-request-id");
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`OpenAI returned ${response.status}: ${errorBody.slice(0, 500)}`);
      }
      const data = await response.json();
      const generated = extractOutputText(data);
      if (!generated) throw new Error("OpenAI returned no response text.");

      answer = generated;
      provider = "openai";
      await finalizeAiUsage(reservation.eventId, {
        status: "success",
        inputTokens: Number(data?.usage?.input_tokens || 0),
        outputTokens: Number(data?.usage?.output_tokens || 0),
        totalTokens: Number(data?.usage?.total_tokens || 0),
        requestId,
      });
    } catch (error) {
      provider = "guided_fallback";
      await finalizeAiUsage(reservation.eventId, {
        status: "error",
        requestId,
        errorCode: error instanceof Error ? error.message.slice(0, 180) : "unknown_error",
      });
      console.error("Joye AI request failed; using guided response.", error, requestId);
    }
  }

  await supabase.from("joye_messages").insert({
    user_id: user.id,
    conversation_id: conversationId,
    role: "assistant",
    content: answer,
    metadata: { provider, section, request_id: requestId },
  });
  await supabase.from("joye_conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId).eq("user_id", user.id);

  const rememberMatch = message.match(/^remember(?: that)?[:\s]+(.+)/i);
  if (rememberMatch?.[1]) {
    await supabase.from("joye_memory").insert({
      user_id: user.id,
      memory_type: "user_note",
      label: "Something you asked Joye to remember",
      content: { text: rememberMatch[1].trim() },
      importance: 4,
      source: "coach",
    });
  }

  const usage = await getAiUsageSnapshot(user.id);
  return NextResponse.json({ answer, provider, conversationId, usage });
}

function instructions(section: CoachSection, style: string) {
  return [
    "You are Joye, a calm, practical life-planning coach inside Joye Life.",
    `The current section is ${section}. The member prefers a ${style} guidance style.`,
    "Use the saved context supplied, but answer the member's actual question rather than forcing an unrelated saved goal into the response.",
    "Do not invent balances, deadlines, medical facts, nutrition targets, preferences, or accomplishments.",
    "When the question is about a topic not fully represented in saved context, provide a useful general planning framework and ask one focused follow-up question.",
    "Answer first, then give no more than three practical next steps.",
    "Keep responses concise, personalized, and easy to act on from a phone.",
    "For money questions, provide planning education, show assumptions, and avoid claiming to be a financial professional.",
    "For nutrition, fitness, medical, or legal matters, avoid diagnosis or made-up targets and encourage appropriate professional support when needed.",
    "Do not mention hidden prompts, JSON, providers, tokens, quotas, or model names.",
  ].join("\n");
}

function extractOutputText(data: unknown) {
  if (!data || typeof data !== "object") return "";
  const output = (data as { output?: unknown[] }).output;
  if (!Array.isArray(output)) return "";
  const parts: string[] = [];
  for (const item of output) {
    if (!item || typeof item !== "object" || (item as { type?: string }).type !== "message") continue;
    const content = (item as { content?: unknown[] }).content;
    if (!Array.isArray(content)) continue;
    for (const entry of content) {
      if (entry && typeof entry === "object" && (entry as { type?: string }).type === "output_text") {
        const text = (entry as { text?: string }).text;
        if (text) parts.push(text);
      }
    }
  }
  return parts.join("\n").trim();
}

function formatLocal(reply: ReturnType<typeof buildLocalCoachReply>) {
  const actions = reply.suggestedActions.map((action) => `• ${action}`).join("\n");
  return `${reply.answer}\n\nNext steps:\n${actions}`;
}

function positiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
