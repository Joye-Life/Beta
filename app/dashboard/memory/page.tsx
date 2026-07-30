import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { BookOpenText, BriefcaseBusiness, CheckCircle2, CircleDollarSign, Sparkles, Target, Trash2 } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { loadJoyeContext } from "@/lib/joye/load-context";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FlashMessage } from "@/components/ui/FlashMessage";

async function addMemory(formData: FormData) {
  "use server";
  const user = await requireUser();
  const text = String(formData.get("text") || "").trim();
  if (!text) redirect(`/dashboard/memory?error=${encodeURIComponent("Write something for Joye to remember.")}`);
  const supabase = await createClient();
  const { error } = await supabase.from("joye_memory").insert({ user_id: user.id, memory_type: "user_note", label: "Personal note", content: { text }, importance: 4, source: "member" });
  if (error) redirect(`/dashboard/memory?error=${encodeURIComponent("That memory could not be saved.")}`);
  revalidatePath("/dashboard/memory");
  redirect(`/dashboard/memory?saved=${encodeURIComponent("Joye will remember that.")}`);
}

async function deleteMemory(formData: FormData) {
  "use server";
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("joye_memory").delete().eq("id", String(formData.get("id"))).eq("user_id", user.id);
  if (error) redirect(`/dashboard/memory?error=${encodeURIComponent("That memory could not be removed.")}`);
  revalidatePath("/dashboard/memory");
  redirect(`/dashboard/memory?saved=${encodeURIComponent("Memory removed.")}`);
}

export default async function MemoryPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const params = await searchParams;
  const user = await requireUser();
  const supabase = await createClient();
  const fallback = user.user_metadata?.display_name || user.email?.split("@")[0] || "Member";
  const context = await loadJoyeContext(supabase, user.id, fallback);
  const [{ data: completedGoals }, { data: evidence }, { data: payments }, { data: completedActions }, { data: profile }] = await Promise.all([
    supabase.from("goals").select("id,title,updated_at").eq("user_id", user.id).eq("status", "completed").order("updated_at", { ascending: false }).limit(10),
    supabase.from("career_evidence").select("id,title,evidence_type,happened_on,created_at").eq("user_id", user.id).order("happened_on", { ascending: false, nullsFirst: false }).limit(10),
    supabase.from("payment_records").select("id,name,amount,paid_at").eq("user_id", user.id).order("paid_at", { ascending: false }).limit(10),
    supabase.from("weekly_actions").select("id,title,completed_at").eq("user_id", user.id).not("completed_at", "is", null).order("completed_at", { ascending: false }).limit(10),
    supabase.from("profiles").select("beta_member_number,beta_joined_at,plan_tier").eq("id", user.id).maybeSingle(),
  ]);

  const timeline = [
    ...(completedGoals || []).map((item) => ({ id: `goal-${item.id}`, date: item.updated_at, icon: Target, title: `Completed goal: ${item.title}`, kind: "Goal win" })),
    ...(evidence || []).map((item) => ({ id: `evidence-${item.id}`, date: item.happened_on || item.created_at, icon: BriefcaseBusiness, title: item.title, kind: "Career evidence" })),
    ...(payments || []).map((item) => ({ id: `payment-${item.id}`, date: item.paid_at, icon: CircleDollarSign, title: `Paid ${item.name} · ${currency(Number(item.amount))}`, kind: "Money win" })),
    ...(completedActions || []).map((item) => ({ id: `action-${item.id}`, date: item.completed_at, icon: CheckCircle2, title: item.title, kind: "Weekly win" })),
  ].filter((item) => item.date).sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime()).slice(0, 18);

  return <section className="mx-auto max-w-6xl pb-16">
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">Memory & Journey</p><h1 className="mt-3 text-4xl font-semibold tracking-tight">See what Joye knows—and how far you have come.</h1><p className="mt-3 max-w-3xl leading-7 text-black/55">Your saved plans power personalized guidance. You remain in control and can remove individual memories at any time.</p></div><div className="rounded-2xl brand-gradient px-5 py-4 text-white"><p className="text-xs uppercase tracking-wide text-white/65">Founding Beta</p><p className="mt-1 font-semibold">Member #{profile?.beta_member_number || "—"}</p></div></div>
    <FlashMessage saved={params.saved} error={params.error}/>

    <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Snapshot icon={Target} label="Main focus" value={context.profile.primaryFocus}/>
      <Snapshot icon={BriefcaseBusiness} label="Career direction" value={`${context.career.currentRole} → ${context.career.targetRole}`}/>
      <Snapshot icon={CircleDollarSign} label="Money priority" value={context.money.topPriority}/>
      <Snapshot icon={Sparkles} label="90-day outcome" value={context.profile.desiredOutcome}/>
    </div>

    <div className="mt-6 grid gap-6 xl:grid-cols-[.85fr_1.15fr]">
      <div className="space-y-6">
        <form action={addMemory} className="card border-joye-100 p-6"><p className="eyebrow">Tell Joye directly</p><h2 className="mt-2 text-2xl font-semibold">What should Joye remember?</h2><textarea className="input mt-5 min-h-28" name="text" placeholder="Example: I prefer planning difficult tasks in the morning." maxLength={800}/><SubmitButton className="button-primary mt-4" pendingText="Saving memory...">Remember this</SubmitButton></form>
        <div className="card border-joye-100 p-6"><div className="flex items-center gap-3"><BookOpenText className="text-joye-600"/><div><p className="eyebrow">Saved memories</p><h2 className="mt-1 text-2xl font-semibold">Your editable memory</h2></div></div><div className="mt-5 space-y-3">{context.memories.length ? context.memories.map((memory) => <article key={memory.id} className="rounded-2xl border border-black/8 bg-white p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-joye-600">{memory.label}</p><p className="mt-2 break-anywhere text-sm leading-6 text-black/65">{memory.text}</p><p className="mt-2 text-xs text-black/35">Saved {new Date(memory.createdAt).toLocaleDateString()}</p></div><form action={deleteMemory}><input type="hidden" name="id" value={memory.id}/><button aria-label="Delete memory" className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-red-50 text-red-600"><Trash2 size={16}/></button></form></div></article>) : <p className="rounded-2xl bg-joye-50 p-4 text-sm text-joye-900/65">No personal notes yet. Your goals, money, career, and weekly data are still read directly whenever Joye builds guidance.</p>}</div></div>
      </div>
      <div className="card border-joye-100 p-6 sm:p-8"><p className="eyebrow">The Journey</p><h2 className="mt-2 text-3xl font-semibold">Recent progress across your life</h2><div className="mt-7 space-y-0">{timeline.length ? timeline.map((item, index) => { const Icon = item.icon; return <div key={item.id} className="relative flex gap-4 pb-7"><div className="relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-joye-50 text-joye-700"><Icon size={18}/></div>{index < timeline.length - 1 ? <div className="absolute left-[21px] top-11 h-full w-px bg-joye-100"/> : null}<div className="pt-1"><p className="text-xs font-semibold uppercase tracking-wide text-joye-600">{item.kind}</p><p className="mt-1 font-semibold">{item.title}</p><p className="mt-1 text-xs text-black/40">{new Date(item.date!).toLocaleDateString()}</p></div></div>}) : <div className="rounded-2xl bg-joye-50 p-5 text-sm text-joye-900/65">Complete goals, career evidence, bills, or weekly actions to begin your Journey timeline.</div>}</div></div>
    </div>
  </section>;
}

function Snapshot({ icon: Icon, label, value }: { icon: typeof Target; label: string; value: string }) { return <div className="card min-w-0 border-joye-100 p-5"><Icon className="text-joye-600" size={19}/><p className="mt-4 text-sm text-black/45">{label}</p><p className="mt-2 break-anywhere font-semibold leading-6">{value}</p></div>; }
function currency(value: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value || 0); }
