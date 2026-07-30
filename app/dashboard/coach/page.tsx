import { CoachExperience } from "@/components/coach/CoachExperience";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import type { CoachSection } from "@/lib/joye/load-context";
import { getAiUsageSnapshot } from "@/lib/joye/ai-usage";

const validSections = new Set(["today", "money", "career", "goals", "weekly", "general"]);

export default async function CoachPage({ searchParams }: { searchParams: Promise<{ section?: string }> }) {
  const params = await searchParams;
  const user = await requireUser();
  const supabase = await createClient();
  const initialSection = validSections.has(params.section || "") ? params.section as CoachSection : "general";
  const { data: conversation } = await supabase.from("joye_conversations").select("id").eq("user_id", user.id).eq("section", initialSection).order("updated_at", { ascending: false }).limit(1).maybeSingle();
  const { data: messages } = conversation
    ? await supabase.from("joye_messages").select("id,role,content,metadata").eq("user_id", user.id).eq("conversation_id", conversation.id).order("created_at", { ascending: true }).limit(30)
    : { data: [] };
  const initialUsage = await getAiUsageSnapshot(user.id);
  return <CoachExperience
    initialSection={initialSection}
    initialConversationId={conversation?.id || null}
    initialMessages={(messages || []).map((message: { id: string; role: string; content: string; metadata?: { provider?: string } | null }) => ({ id: message.id, role: message.role as "user" | "assistant", content: message.content, provider: message.metadata?.provider }))}
    initialUsage={initialUsage}
  />;
}
