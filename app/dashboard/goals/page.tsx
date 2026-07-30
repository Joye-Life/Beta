import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/guards";
import { SectionGuidance } from "@/components/dashboard/SectionGuidance";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FlashMessage } from "@/components/ui/FlashMessage";
import { GoalBuilder } from "@/components/goals/GoalBuilder";
import { buildGoalPlan, type GoalKind, goalTypeLabel } from "@/lib/joye/goals";

async function finish(error: { message: string } | null, message: string) {
  if (error) redirect(`/dashboard/goals?error=${encodeURIComponent(error.message || "That goal update could not be saved.")}`);
  revalidatePath("/dashboard/goals");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/weekly");
  redirect(`/dashboard/goals?saved=${encodeURIComponent(message)}`);
}

async function createAdaptiveGoal(formData: FormData) {
  "use server";
  const user = await requireUser();
  const supabase = await createClient();
  const rawGoal = String(formData.get("raw_goal") || "").trim();
  if (!rawGoal) redirect(`/dashboard/goals?error=${encodeURIComponent("Tell Joye what you want to improve.")}`);
  const kind = String(formData.get("goal_kind") || "personal") as GoalKind;
  const targetValue = formData.get("target_value") ? Number(formData.get("target_value")) : null;
  const frequency = formData.get("frequency") ? Number(formData.get("frequency")) : null;
  const targetDate = String(formData.get("target_date") || "") || null;
  const motivation = String(formData.get("motivation") || "").trim();
  const obstacle = String(formData.get("obstacle") || "").trim();
  const unit = String(formData.get("unit") || "").trim() || null;
  const plan = buildGoalPlan({ rawGoal, kind, motivation, obstacle, frequency, targetValue, unit, targetDate });
  const { data: goal, error } = await supabase.from("goals").insert({
    user_id: user.id,
    title: plan.title,
    summary: plan.summary,
    due_date: targetDate,
    category: kind,
    target_value: targetValue,
    current_value: 0,
    unit,
    priority: Number(formData.get("priority") || 2),
    goal_type: kind,
    tracking_mode: plan.trackingMode,
    weekly_frequency: plan.cadence,
    success_definition: plan.successDefinition,
    original_input: rawGoal,
    obstacle: obstacle || null,
    motivation: motivation || null,
  }).select("id").single();
  if (error || !goal) { await finish(error || { message: "The goal could not be created." }, ""); return; }
  const { error: stepError } = await supabase.from("goal_steps").insert({ user_id: user.id, goal_id: goal.id, title: plan.firstStep, due_date: null });
  await supabase.from("joye_memory").insert({ user_id: user.id, memory_type: "goal_created", content: { title: plan.title, success_definition: plan.successDefinition, source: "goals" }, importance: 4 });
  await finish(stepError, "Joye built your goal and first step.");
}

async function updateGoal(formData: FormData) {
  "use server";
  const user = await requireUser(); const supabase = await createClient();
  const tracking = String(formData.get("tracking_mode") || "milestones");
  const current = Number(formData.get("current_value") || 0); const target = Number(formData.get("target_value") || 0);
  const progress = tracking === "number" && target > 0 ? Math.min(100, Math.round((current / target) * 100)) : Number(formData.get("progress") || 0);
  const status = String(formData.get("status") || "active");
  const { error } = await supabase.from("goals").update({ current_value: current, target_value: target || null, progress, status }).eq("id", String(formData.get("id"))).eq("user_id", user.id);
  await finish(error, status === "completed" ? "Goal completed." : "Goal updated.");
}
async function checkInGoal(formData: FormData) {
  "use server";
  const user = await requireUser(); const supabase = await createClient(); const goalId = String(formData.get("goal_id"));
  const { error } = await supabase.from("goal_checkins").insert({ user_id: user.id, goal_id: goalId, check_in_date: new Date().toISOString().slice(0,10), value: 1 });
  await finish(error, "Check-in recorded.");
}
async function removeGoal(formData: FormData) { "use server"; const user = await requireUser(); const supabase = await createClient(); const { error } = await supabase.from("goals").delete().eq("id", String(formData.get("id"))).eq("user_id", user.id); await finish(error, "Goal removed."); }
async function addStep(formData: FormData) { "use server"; const user = await requireUser(); const supabase = await createClient(); const title=String(formData.get("title")||"").trim(); if(!title) redirect(`/dashboard/goals?error=${encodeURIComponent("Add a name for the next step.")}`); const { error } = await supabase.from("goal_steps").insert({ user_id: user.id, goal_id: String(formData.get("goal_id")), title, due_date: String(formData.get("due_date") || "") || null }); await finish(error, "Goal step added."); }
async function toggleStep(formData: FormData) { "use server"; const user = await requireUser(); const supabase = await createClient(); const complete = String(formData.get("complete")) === "true"; const { error } = await supabase.from("goal_steps").update({ completed_at: complete ? new Date().toISOString() : null }).eq("id", String(formData.get("id"))).eq("user_id", user.id); await finish(error, complete ? "Step completed." : "Step reopened."); }

export default async function Goals({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const params = await searchParams; const user = await requireUser(); const supabase = await createClient();
  const [{ data: goals }, { data: steps }, { data: checkins }] = await Promise.all([
    supabase.from("goals").select("*").eq("user_id", user.id).order("priority").order("created_at", { ascending: false }),
    supabase.from("goal_steps").select("*").eq("user_id", user.id).order("due_date", { ascending: true, nullsFirst: false }),
    supabase.from("goal_checkins").select("*").eq("user_id", user.id).gte("check_in_date", startOfWeek()).order("check_in_date", { ascending: false }),
  ]);
  const active=(goals||[]).filter(g=>g.status==="active"); const completed=(goals||[]).filter(g=>g.status==="completed");
  const closest=[...active].sort((a,b)=>Number(b.progress||0)-Number(a.progress||0))[0];
  return <section className="mx-auto max-w-7xl pb-16">
    <p className="eyebrow">Goals</p><h1 className="mt-3 text-4xl font-semibold tracking-tight">Tell Joye what you want. Build the right kind of plan.</h1>
    <p className="mt-3 max-w-3xl leading-7 text-black/55">A routine does not need a deadline. A savings goal may need a number. A project needs milestones. Joye now adapts the plan to the goal instead of forcing every goal into the same form.</p>
    <FlashMessage saved={params.saved} error={params.error}/>
    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Active goals" value={`${active.length}`} detail={`${completed.length} completed`}/><Metric label="This week’s check-ins" value={`${(checkins||[]).length}`} detail="Habit and routine activity"/><Metric label="Leading goal" value={closest?.title||"Not set"} detail={closest?`${closest.progress||0}% complete`:"Create your first goal"}/><Metric label="Open next steps" value={`${(steps||[]).filter(s=>!s.completed_at).length}`} detail="Available for weekly planning"/></div>
    <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
      <div className="space-y-5">
        <GoalBuilder action={createAdaptiveGoal}/>
        {(goals||[]).map(goal => {
          const goalSteps=(steps||[]).filter(s=>s.goal_id===goal.id); const completedSteps=goalSteps.filter(s=>s.completed_at).length; const mode=goal.tracking_mode||"milestones"; const weeklyCount=(checkins||[]).filter(c=>c.goal_id===goal.id).length;
          return <article key={goal.id} className="card border-joye-100 p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><p className="text-xl font-semibold">{goal.title}</p><Badge>{goalTypeLabel((goal.goal_type||goal.category||"personal") as GoalKind)}</Badge><Badge neutral>{mode==="frequency"?"Routine":mode==="number"?"Measured target":"Milestone plan"}</Badge></div><p className="mt-3 max-w-2xl text-sm leading-6 text-black/55">{goal.summary}</p><p className="mt-3 text-sm font-medium text-joye-800">Success looks like: {goal.success_definition||"Meaningful progress you can review each week."}</p></div><span className="text-2xl font-semibold text-joye-700">{goal.progress||0}%</span></div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-joye-50"><div className="h-full rounded-full brand-gradient" style={{width:`${goal.progress||0}%`}}/></div>
            {mode==="frequency" ? <div className="mt-5 rounded-2xl bg-joye-50/60 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">This week: {weeklyCount} of {goal.weekly_frequency||3} check-ins</p><p className="mt-1 text-sm text-black/50">Use a check-in whenever you complete the routine. No artificial finish date required.</p></div><form action={checkInGoal}><input type="hidden" name="goal_id" value={goal.id}/><SubmitButton className="button-primary" pendingText="Recording...">I did this today</SubmitButton></form></div></div> : null}
            {mode==="number" ? <form action={updateGoal} className="mt-5 grid gap-3 rounded-2xl bg-joye-50/50 p-4 sm:grid-cols-3"><input type="hidden" name="id" value={goal.id}/><input type="hidden" name="tracking_mode" value={mode}/><Field label={`Current ${goal.unit||"amount"}`}><input className="input" type="number" step="0.01" name="current_value" defaultValue={goal.current_value||0}/></Field><Field label={`Target ${goal.unit||"amount"}`}><input className="input" type="number" step="0.01" name="target_value" defaultValue={goal.target_value||0}/></Field><Field label="Status"><select className="input" name="status" defaultValue={goal.status}><option value="active">Active</option><option value="completed">Completed</option><option value="paused">Paused</option></select></Field><SubmitButton className="button-primary sm:col-span-3 sm:w-fit" pendingText="Updating...">Update goal</SubmitButton></form> : <form action={updateGoal} className="mt-5 flex flex-col gap-3 rounded-2xl bg-joye-50/50 p-4 sm:flex-row sm:items-end"><input type="hidden" name="id" value={goal.id}/><input type="hidden" name="tracking_mode" value={mode}/><input type="hidden" name="current_value" value="0"/><input type="hidden" name="target_value" value="0"/><Field label="Overall progress"><input className="input" type="number" min="0" max="100" name="progress" defaultValue={goal.progress||0}/></Field><Field label="Status"><select className="input" name="status" defaultValue={goal.status}><option value="active">Active</option><option value="completed">Completed</option><option value="paused">Paused</option></select></Field><SubmitButton className="button-primary" pendingText="Updating...">Update goal</SubmitButton></form>}
            <div className="mt-5 space-y-2">{goalSteps.map(step=><div key={step.id} className="flex items-center justify-between gap-3 rounded-xl border border-black/8 p-3"><div><p className={`text-sm font-medium ${step.completed_at?"line-through text-black/35":""}`}>{step.title}</p>{step.due_date?<p className="text-xs text-black/40">Due {formatDate(step.due_date)}</p>:null}</div><form action={toggleStep}><input type="hidden" name="id" value={step.id}/><input type="hidden" name="complete" value={step.completed_at?"false":"true"}/><button className="text-xs font-semibold text-joye-700">{step.completed_at?"Reopen":"Complete"}</button></form></div>)}</div>
            <form action={addStep} className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]"><input type="hidden" name="goal_id" value={goal.id}/><input className="input" name="title" required placeholder="Add a practical next step"/><input className="input" type="date" name="due_date"/><SubmitButton className="button-secondary" pendingText="Adding...">Add step</SubmitButton></form>
            <div className="mt-4 flex items-center justify-between text-xs"><span className="text-black/40">{completedSteps}/{goalSteps.length} steps complete{goal.due_date?` · Optional target ${formatDate(goal.due_date)}`:""}</span><form action={removeGoal}><input type="hidden" name="id" value={goal.id}/><button className="font-semibold text-red-600">Remove goal</button></form></div>
          </article>})}
      </div>
      <SectionGuidance title="Goals Joye" summary={closest?`${closest.title} currently has the strongest momentum.`:"Describe one change you want in plain language. Joye will build the structure."} reasons={[`${active.length} active goals are saved.`,`${(checkins||[]).length} routine check-ins were recorded this week.`,`${(steps||[]).filter(s=>!s.completed_at).length} practical next steps can feed the Weekly page.`]} nextStep={closest?`Complete or schedule the next step for ${closest.title}.`:"Create one goal using natural language."}/>
    </div>
  </section>
}
function Field({label,children}:{label:string;children:React.ReactNode}){return <div className="min-w-0 flex-1"><label className="label">{label}</label>{children}</div>}
function Metric({label,value,detail}:{label:string;value:string;detail:string}){return <div className="card border-joye-100 p-5"><p className="text-sm text-black/45">{label}</p><p className="mt-2 truncate text-2xl font-semibold">{value}</p><p className="mt-2 text-xs text-black/45">{detail}</p></div>}
function Badge({children,neutral=false}:{children:React.ReactNode;neutral?:boolean}){return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${neutral?"bg-black/5 text-black/55":"bg-joye-50 text-joye-700"}`}>{children}</span>}
function formatDate(value:string){return new Date(`${value}T12:00:00`).toLocaleDateString()}
function startOfWeek(){const d=new Date();const day=d.getUTCDay()||7;d.setUTCDate(d.getUTCDate()-day+1);return d.toISOString().slice(0,10)}
