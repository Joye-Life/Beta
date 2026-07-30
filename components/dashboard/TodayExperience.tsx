import { revalidatePath } from "next/cache";
import { AlertTriangle, ArrowRight, Brain, CalendarDays, CheckCircle2, CreditCard, Lightbulb, TrendingUp } from "lucide-react";
import Link from "next/link";
import { createDailyBrief } from "@/lib/joye/context";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/guards";
import type { UserContext } from "@/types/database";
import { LocalGreeting } from "@/components/dashboard/LocalGreeting";
import { SubmitButton } from "@/components/ui/SubmitButton";

async function markPaid(formData: FormData) {
  "use server";
  const user = await requireUser();
  const supabase = await createClient();
  await supabase.from("payment_records").upsert({
    user_id: user.id,
    source_type: String(formData.get("source_type")),
    source_id: String(formData.get("source_id")),
    name: String(formData.get("name")),
    amount: Number(formData.get("amount") || 0),
    due_date: String(formData.get("due_date")),
    paid_at: new Date().toISOString(),
  }, { onConflict: "user_id,source_type,source_id,due_date" });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/money");
}

async function undoPaid(formData: FormData) {
  "use server";
  const user = await requireUser();
  const supabase = await createClient();
  await supabase.from("payment_records").delete().eq("id", String(formData.get("payment_id"))).eq("user_id", user.id);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/money");
}

export async function TodayExperience() {
  const user = await requireUser();
  const supabase = await createClient();
  const [{ data: profile }, { data: goals }, { data: tasks }, { data: money }, { data: career }, { data: bills }, { data: debts }, { data: payments }] = await Promise.all([
    supabase.from("profiles").select("display_name,timezone,available_minutes,energy,primary_focus").eq("id", user.id).maybeSingle(),
    supabase.from("goals").select("id,title,progress").eq("user_id", user.id).eq("status", "active").order("created_at", { ascending: false }).limit(5),
    supabase.from("tasks").select("id,title,minutes,priority,due_date,completed_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(12),
    supabase.from("financial_profiles").select("available_margin,upcoming_bills").eq("user_id", user.id).maybeSingle(),
    supabase.from("career_plans").select("current_role,target_role,next_milestone").eq("user_id", user.id).maybeSingle(),
    supabase.from("recurring_bills").select("id,name,amount,due_date,frequency,autopay").eq("user_id", user.id),
    supabase.from("debts").select("id,name,minimum_payment,due_date").eq("user_id", user.id),
    supabase.from("payment_records").select("id,source_type,source_id,name,amount,due_date,paid_at").eq("user_id", user.id).order("paid_at", { ascending: false }).limit(12),
  ]);

  const displayName = profile?.display_name?.trim() || user.user_metadata?.display_name || user.email?.split("@")[0] || "there";
  const context: UserContext = {
    displayName,
    timezone: profile?.timezone || "America/New_York",
    availableMinutes: profile?.available_minutes ?? 30,
    energy: (profile?.energy || "medium") as "low" | "medium" | "high",
    primaryFocus: profile?.primary_focus || "Build steady progress",
    goals: (goals || []).map(g => ({ id: g.id, title: g.title, progress: g.progress })),
    tasks: (tasks || []).map(t => ({ id: t.id, title: t.title, minutes: t.minutes, priority: t.priority, completed: Boolean(t.completed_at), dueDate: t.due_date || undefined })),
    money: { availableMargin: money?.available_margin ?? 0, upcomingBills: money?.upcoming_bills ?? 0 },
    career: { currentRole: career?.current_role || "Not added yet", targetRole: career?.target_role || "Not added yet", nextMilestone: career?.next_milestone || "Add your next career milestone." },
  };

  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + 30);
  const paidKeys = new Set((payments || []).map(p => `${p.source_type}:${p.source_id}:${p.due_date}`));
  type UpcomingItem = { sourceId: string; name: string; amount: number; dueDate: Date; kind: "Bill" | "Debt"; autopay: boolean };
  const upcoming = [
    ...(bills || []).map((bill) => ({ sourceId: bill.id, name: bill.name, amount: Number(bill.amount || 0), dueDate: nextOccurrence(bill.due_date, bill.frequency, today), kind: "Bill" as const, autopay: Boolean(bill.autopay) })),
    ...(debts || []).map((debt) => ({ sourceId: debt.id, name: `${debt.name} minimum`, amount: Number(debt.minimum_payment || 0), dueDate: nextOccurrence(debt.due_date, "monthly", today), kind: "Debt" as const, autopay: false })),
  ].filter((item): item is UpcomingItem => Boolean(item.dueDate && item.dueDate <= horizon))
    .filter(item => !paidKeys.has(`${item.kind.toLowerCase()}:${item.sourceId}:${dateISO(item.dueDate)}`))
    .sort((a, b) => Number(a.dueDate) - Number(b.dueDate)).slice(0, 8);

  const recentPaid = (payments || []).slice(0, 4);
  const brief = createDailyBrief(context);
  const icons = { attention: AlertTriangle, opportunity: Lightbulb, progress: TrendingUp };

  return <div className="mx-auto max-w-6xl space-y-6">
    <section className="card overflow-hidden border-joye-100">
      <div className="brand-gradient p-6 text-white sm:p-9">
        <p className="text-sm text-white/70">Today</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl"><LocalGreeting name={displayName} /></h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-white/80">{brief.summary}</p>
      </div>
      <div className="grid gap-6 p-6 sm:p-9 lg:grid-cols-[1.2fr_.8fr]">
        <div><p className="eyebrow">Your next move</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">{brief.recommendation.title}</h2><p className="mt-3 max-w-xl leading-7 text-black/55">{brief.recommendation.reason}</p><Link href="/dashboard/weekly" className="button-primary mt-6 gap-2">{brief.recommendation.actionLabel}<ArrowRight size={16}/></Link></div>
        <div className="rounded-3xl bg-joye-50 p-5"><p className="text-xs font-semibold uppercase tracking-[.16em] text-joye-700/60">Today’s capacity</p><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-white p-4"><p className="text-2xl font-semibold">{context.availableMinutes}</p><p className="mt-1 text-xs text-black/45">minutes available</p></div><div className="rounded-2xl bg-white p-4"><p className="text-2xl font-semibold capitalize">{context.energy}</p><p className="mt-1 text-xs text-black/45">current energy</p></div></div><Link href="/dashboard/profile" className="mt-4 inline-block text-sm font-semibold text-joye-700">Update today’s capacity →</Link></div>
      </div>
    </section>

    <section className="card border-joye-100 p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">Upcoming bills</p><h2 className="mt-2 text-2xl font-semibold">What is due in the next 30 days</h2><p className="mt-2 text-sm text-black/50">Mark a payment paid without removing the recurring schedule.</p></div><Link href="/dashboard/money" className="text-sm font-semibold text-joye-700">Open Money planner →</Link></div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {upcoming.length ? upcoming.map((item) => <article key={`${item.kind}-${item.sourceId}-${dateISO(item.dueDate)}`} className="rounded-2xl border border-black/8 bg-white p-4"><div className="flex items-start justify-between gap-4"><div className="flex gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-joye-50 text-joye-700">{item.kind === "Debt" ? <CreditCard size={17}/> : <CalendarDays size={17}/>}</span><div><p className="font-semibold">{item.name}</p><p className="mt-1 text-xs text-black/45">Due {item.dueDate.toLocaleDateString()}{item.autopay ? " · autopay" : ""}</p></div></div><p className="font-semibold">{currency(item.amount)}</p></div><form action={markPaid} className="mt-4"><input type="hidden" name="source_type" value={item.kind.toLowerCase()} /><input type="hidden" name="source_id" value={item.sourceId} /><input type="hidden" name="name" value={item.name} /><input type="hidden" name="amount" value={item.amount} /><input type="hidden" name="due_date" value={dateISO(item.dueDate)} /><SubmitButton className="button-secondary w-full sm:w-auto" pendingText="Marking paid...">Mark paid</SubmitButton></form></article>) : <div className="rounded-2xl border border-dashed border-joye-200 bg-joye-50/40 p-5 text-sm text-joye-900/65 md:col-span-2">Nothing unpaid is due in the next 30 days.</div>}
      </div>
      {recentPaid.length ? <details className="mt-5 rounded-2xl bg-green-50 p-4"><summary className="cursor-pointer font-semibold text-green-900">Paid recently ({recentPaid.length})</summary><div className="mt-3 space-y-2">{recentPaid.map(payment => <div key={payment.id} className="flex flex-col gap-2 rounded-xl bg-white p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold">{payment.name}</p><p className="text-xs text-black/45">{currency(Number(payment.amount))} · marked paid {new Date(payment.paid_at).toLocaleDateString()}</p></div><form action={undoPaid}><input type="hidden" name="payment_id" value={payment.id}/><button className="text-xs font-semibold text-joye-700">Undo</button></form></div>)}</div></details> : null}
    </section>

    <section className="card flex flex-col gap-5 border-joye-100 bg-gradient-to-br from-joye-50 to-white p-6 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl brand-gradient text-white"><Brain size={20}/></span><div><p className="eyebrow">Ask Joye</p><h2 className="mt-1 text-2xl font-semibold">Talk through your next decision.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-black/55">Joye already has your saved goals, money, career, weekly plan, and memory. You do not need to explain everything again.</p></div></div><Link href="/dashboard/coach?section=today" className="button-primary shrink-0 gap-2">Ask about today <ArrowRight size={16}/></Link></section>

    <section><div className="mb-4"><p className="eyebrow">Joye signals</p><h2 className="mt-2 text-2xl font-semibold">What matters right now</h2></div><div className="grid gap-4 md:grid-cols-2">{brief.signals.map(signal=>{const Icon=icons[signal.kind];return <article key={signal.id} className="card border-joye-100 p-5"><div className="flex gap-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-joye-50 text-joye-700"><Icon size={18}/></span><div><p className="font-semibold">{signal.title}</p><p className="mt-2 text-sm leading-6 text-black/55">{signal.detail}</p></div></div></article>})}<article className="card border-joye-100 p-5"><div className="flex gap-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-green-50 text-green-700"><CheckCircle2 size={18}/></span><div><p className="font-semibold">Built from your account</p><p className="mt-2 text-sm leading-6 text-black/55">Joye uses your saved profile, tasks, goals, payments, money, and career information.</p></div></div></article></div></section>
  </div>;
}

function nextOccurrence(rawDate: string | null | undefined, frequency: string, onOrAfter: Date) {
  if (!rawDate) return null;
  const due = new Date(`${rawDate}T12:00:00`);
  while (due < onOrAfter) {
    if (frequency === "weekly") due.setDate(due.getDate() + 7);
    else if (frequency === "biweekly") due.setDate(due.getDate() + 14);
    else if (frequency === "yearly") due.setFullYear(due.getFullYear() + 1);
    else due.setMonth(due.getMonth() + 1);
  }
  return due;
}
function dateISO(date: Date) { return date.toISOString().slice(0, 10); }
function currency(value: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value || 0); }
