import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/guards";
import { SectionGuidance } from "@/components/dashboard/SectionGuidance";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FlashMessage } from "@/components/ui/FlashMessage";

async function finish(error: { message: string } | null, message: string) {
  if (error) redirect(`/dashboard/career?error=${encodeURIComponent(error.message || "That career update could not be saved.")}`);
  revalidatePath("/dashboard/career");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/weekly");
  redirect(`/dashboard/career?saved=${encodeURIComponent(message)}`);
}

function cleanLines(value: FormDataEntryValue | null) {
  return String(value || "").split(/[,\n]/).map(item => item.trim()).filter(Boolean);
}

function buildCareerPlan(input: {
  currentRole: string;
  targetRole: string;
  currentSkills: string[];
  barrier: string;
  weeklyHours: number;
}) {
  const target = input.targetRole || "your next role";
  const barrier = input.barrier.toLowerCase();
  const role = target.toLowerCase();
  const gaps: string[] = [];

  if (barrier.includes("resume")) gaps.push("A resume that clearly proves your impact");
  if (barrier.includes("interview")) gaps.push("Interview practice and stronger examples");
  if (barrier.includes("experience")) gaps.push("Visible, hands-on proof of the work");
  if (barrier.includes("cert")) gaps.push("The most relevant credential for the target role");
  if (barrier.includes("application")) gaps.push("A consistent, targeted application process");
  if (barrier.includes("network")) gaps.push("More relationships in the target field");
  if (barrier.includes("path") || barrier.includes("unsure")) gaps.push("A clear sequence of skills, proof, and applications");

  if (role.includes("manager") || role.includes("lead")) gaps.push("Leadership examples and measurable team impact");
  if (role.includes("engineer") || role.includes("developer")) gaps.push("Portfolio-quality technical projects");
  if (role.includes("analyst")) gaps.push("Analytical projects with clear business outcomes");
  if (role.includes("sales")) gaps.push("Evidence of pipeline, conversion, and revenue results");
  if (role.includes("health") || role.includes("nurse")) gaps.push("Role-specific credentials and patient-care evidence");
  if (!gaps.length) gaps.push("Proof that your current skills transfer to the target role", "A stronger story for why you are ready now");

  const uniqueGaps = [...new Set(gaps)].slice(0, 4);
  const weeklyActionCount = Math.max(2, Math.min(4, Math.round(input.weeklyHours || 2)));

  return {
    summary: `Move from ${input.currentRole || "your current stage"} toward ${target} by building the missing skills, proving them with real evidence, and then making a focused move.`,
    gaps: uniqueGaps,
    build: [
      `Choose the ${uniqueGaps[0]?.toLowerCase() || "highest-value skill"} to focus on first`,
      `Reserve ${input.weeklyHours || 2} hours each week for focused career work`,
      `Complete one practical learning activity tied directly to ${target}`,
    ],
    prove: [
      "Create one project, example, or accomplishment that demonstrates the skill",
      "Turn the evidence into a measurable resume or portfolio bullet",
      "Collect feedback, praise, or results that strengthen the story",
    ],
    move: [
      `Update your resume and profile for ${target}`,
      `Apply to ${weeklyActionCount} well-matched opportunities each week`,
      "Review results weekly and adjust the plan based on interviews and responses",
    ],
  };
}

async function completeCareerSetup(formData: FormData) {
  "use server";
  const user = await requireUser();
  const supabase = await createClient();
  const currentRole = String(formData.get("current_role") || "").trim();
  const targetRole = String(formData.get("target_role") || "").trim();
  const currentSkills = cleanLines(formData.get("current_skills"));
  const barrier = String(formData.get("biggest_barrier") || "").trim();
  const weeklyHours = Number(formData.get("weekly_hours") || 2);
  const generated = buildCareerPlan({ currentRole, targetRole, currentSkills, barrier, weeklyHours });

  const { error } = await supabase.from("career_plans").upsert({
    user_id: user.id,
    current_role: currentRole,
    target_role: targetRole,
    years_experience: formData.get("years_experience") ? Number(formData.get("years_experience")) : null,
    responsibilities: String(formData.get("responsibilities") || "").trim(),
    current_skills: currentSkills.join(", "),
    target_date: String(formData.get("target_date") || "") || null,
    desired_salary_min: formData.get("desired_salary_min") ? Number(formData.get("desired_salary_min")) : null,
    desired_salary_max: formData.get("desired_salary_max") ? Number(formData.get("desired_salary_max")) : null,
    work_preference: String(formData.get("work_preference") || "flexible"),
    biggest_barrier: barrier,
    weekly_hours: weeklyHours,
    plan_summary: generated.summary,
    skill_gaps: generated.gaps,
    build_phase: generated.build,
    prove_phase: generated.prove,
    move_phase: generated.move,
    next_milestone: generated.build[0],
    career_setup_complete: true,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  if (!error) {
    const initialMilestones = [
      { user_id: user.id, title: generated.build[0], milestone_type: "skill", status: "planned", notes: "Generated from your guided career setup." },
      { user_id: user.id, title: generated.prove[0], milestone_type: "project", status: "planned", notes: "Generated from your guided career setup." },
      { user_id: user.id, title: generated.move[0], milestone_type: "application", status: "planned", notes: "Generated from your guided career setup." },
    ];
    await supabase.from("career_milestones").insert(initialMilestones);
  }
  await finish(error, "Your personalized career path is ready.");
}

async function resetCareerSetup() {
  "use server";
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("career_plans").update({ career_setup_complete: false }).eq("user_id", user.id);
  await finish(error, "Career setup reopened.");
}

async function addMilestone(formData: FormData) {
  "use server";
  const user = await requireUser(); const supabase = await createClient();
  const title = String(formData.get("title") || "").trim();
  if (!title) redirect(`/dashboard/career?error=${encodeURIComponent("Add an action first.")}`);
  const { error } = await supabase.from("career_milestones").insert({
    user_id: user.id,
    title,
    milestone_type: String(formData.get("milestone_type") || "skill"),
    target_date: String(formData.get("target_date") || "") || null,
    notes: String(formData.get("notes") || "").trim(),
  });
  await finish(error, "Career action added.");
}

async function changeMilestone(formData: FormData) {
  "use server";
  const user = await requireUser(); const supabase = await createClient();
  const status = String(formData.get("status"));
  const { error } = await supabase.from("career_milestones").update({ status, completed_at: status === "completed" ? new Date().toISOString() : null }).eq("id", String(formData.get("id"))).eq("user_id", user.id);
  await finish(error, status === "completed" ? "Career action completed." : "Career action updated.");
}

async function addToWeek(formData: FormData) {
  "use server";
  const user = await requireUser(); const supabase = await createClient();
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + diff)).toISOString().slice(0, 10);
  const { error } = await supabase.from("weekly_actions").insert({
    user_id: user.id,
    week_start: monday,
    title: String(formData.get("title") || "Career action"),
    day_of_week: Number(formData.get("day_of_week") || 1),
    minutes: Number(formData.get("minutes") || 30),
    source_type: "career",
    source_id: String(formData.get("source_id") || "") || null,
  });
  await finish(error, "Added to this week.");
}

async function addEvidence(formData: FormData) {
  "use server";
  const user = await requireUser(); const supabase = await createClient();
  const title = String(formData.get("title") || "").trim();
  if (!title) redirect(`/dashboard/career?error=${encodeURIComponent("Add a title for the evidence.")}`);
  const { error } = await supabase.from("career_evidence").insert({
    user_id: user.id,
    title,
    evidence_type: String(formData.get("evidence_type") || "achievement"),
    description: String(formData.get("description") || "").trim(),
    result: String(formData.get("result") || "").trim(),
    happened_on: String(formData.get("happened_on") || "") || null,
  });
  await finish(error, "Career evidence saved.");
}

export default async function Career({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const params = await searchParams;
  const user = await requireUser();
  const supabase = await createClient();
  const [{ data: plan }, { data: milestones }, { data: evidence }] = await Promise.all([
    supabase.from("career_plans").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("career_milestones").select("*").eq("user_id", user.id).order("status").order("target_date", { ascending: true, nullsFirst: false }),
    supabase.from("career_evidence").select("*").eq("user_id", user.id).order("happened_on", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }).limit(12),
  ]);

  if (!plan?.career_setup_complete) {
    return <GuidedSetup plan={plan} params={params} />;
  }

  const open = (milestones || []).filter(item => item.status !== "completed");
  const completed = (milestones || []).filter(item => item.status === "completed");
  const next = open[0];
  const total = milestones?.length || 0;
  const progress = total ? Math.round((completed.length / total) * 100) : 0;
  const gaps = Array.isArray(plan.skill_gaps) ? plan.skill_gaps : [];
  const phases = [
    { name: "1. Build the skills", items: plan.build_phase || [], detail: "Learn only what directly supports the next role." },
    { name: "2. Prove the skills", items: plan.prove_phase || [], detail: "Create evidence that another person can see and trust." },
    { name: "3. Make the move", items: plan.move_phase || [], detail: "Position yourself, apply strategically, and learn from results." },
  ];

  return <section className="mx-auto max-w-7xl pb-16">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="eyebrow">Career</p><h1 className="mt-3 text-4xl font-semibold tracking-tight">Your path to {plan.target_role || "the next step"}</h1><p className="mt-3 max-w-3xl leading-7 text-black/55">A focused path from where you are now to the result you want next.</p></div>
      <form action={resetCareerSetup}><button className="button-secondary">Update career direction</button></form>
    </div>
    <FlashMessage saved={params.saved} error={params.error} />

    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Direction" value={`${plan.current_role || "Current stage"} → ${plan.target_role || "Next role"}`} detail={plan.target_date ? `Target ${formatDate(plan.target_date)}` : "No target date set"} />
      <Metric label="Roadmap progress" value={`${progress}%`} detail={`${completed.length} of ${total} actions complete`} />
      <Metric label="Weekly time" value={`${Number(plan.weekly_hours || 0)} hrs`} detail="Reserved for career progress" />
      <Metric label="Evidence saved" value={`${evidence?.length || 0}`} detail="Wins, projects, praise, and measurable results" />
    </div>

    <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
      <div className="space-y-6">
        <div className="card border-joye-100 p-6 sm:p-8">
          <p className="eyebrow">Your next move</p>
          <h2 className="mt-2 text-2xl font-semibold">{next?.title || "Add the next meaningful action"}</h2>
          <p className="mt-3 leading-7 text-black/55">{plan.plan_summary}</p>
          {next ? <form action={addToWeek} className="mt-5 flex flex-col gap-3 rounded-2xl bg-joye-50/70 p-4 sm:flex-row sm:items-end">
            <input type="hidden" name="title" value={next.title} /><input type="hidden" name="source_id" value={next.id} />
            <Field label="Schedule for"><select className="input" name="day_of_week"><option value="1">Monday</option><option value="2">Tuesday</option><option value="3">Wednesday</option><option value="4">Thursday</option><option value="5">Friday</option><option value="6">Saturday</option><option value="7">Sunday</option></select></Field>
            <Field label="Time"><select className="input" name="minutes"><option value="20">20 minutes</option><option value="30">30 minutes</option><option value="45">45 minutes</option><option value="60">1 hour</option><option value="90">90 minutes</option></select></Field>
            <SubmitButton className="button-primary" pendingText="Adding...">Add to this week</SubmitButton>
          </form> : null}
        </div>

        <div className="card border-joye-100 p-6 sm:p-8">
          <p className="eyebrow">Personalized gaps</p><h2 className="mt-2 text-2xl font-semibold">What stands between you and the next role</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">{gaps.map((gap: string, index: number) => <div key={gap} className="rounded-2xl border border-joye-100 bg-joye-50/45 p-4"><span className="text-xs font-bold text-joye-600">GAP {index + 1}</span><p className="mt-2 font-semibold leading-6">{gap}</p></div>)}</div>
        </div>

        <div className="card border-joye-100 p-6 sm:p-8">
          <p className="eyebrow">Your career path</p><h2 className="mt-2 text-2xl font-semibold">Three phases, in the right order</h2>
          <div className="mt-6 space-y-4">{phases.map((phase, index) => <article key={phase.name} className="rounded-2xl border border-black/8 p-5"><div className="flex items-start gap-4"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full brand-gradient font-bold text-white">{index + 1}</div><div><h3 className="text-lg font-semibold">{phase.name.replace(/^\d\. /, "")}</h3><p className="mt-1 text-sm text-black/45">{phase.detail}</p><ul className="mt-4 space-y-2">{phase.items.map((item: string) => <li key={item} className="flex gap-2 text-sm leading-6 text-black/65"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-joye-500" />{item}</li>)}</ul></div></div></article>)}</div>
        </div>

        <div className="card border-joye-100 p-6 sm:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">This path</p><h2 className="mt-2 text-2xl font-semibold">Actions and progress</h2></div><p className="text-sm text-black/45">Keep it small and visible</p></div>
          <div className="mt-5 space-y-3">{(milestones || []).map(item => <article key={item.id} className="rounded-2xl border border-black/8 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className={`font-semibold ${item.status === "completed" ? "text-black/40 line-through" : ""}`}>{item.title}</p><p className="mt-1 text-xs text-black/40">{friendly(item.milestone_type)}{item.target_date ? ` · ${formatDate(item.target_date)}` : ""}</p></div><form action={changeMilestone}><input type="hidden" name="id" value={item.id}/><input type="hidden" name="status" value={item.status === "planned" ? "in_progress" : item.status === "in_progress" ? "completed" : "planned"}/><button className="button-secondary text-xs">{item.status === "planned" ? "Start" : item.status === "in_progress" ? "Mark complete" : "Reopen"}</button></form></div></article>)}{!milestones?.length ? <p className="text-sm text-black/45">No actions yet.</p> : null}</div>
          <details className="mt-5 rounded-2xl bg-black/[.025] p-4"><summary className="cursor-pointer font-semibold">Add a custom action</summary><form action={addMilestone} className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Action"><input className="input" name="title" required placeholder="Practice two interview stories" /></Field><Field label="Type"><select className="input" name="milestone_type"><option value="skill">Build skill</option><option value="project">Create proof</option><option value="certification">Credential</option><option value="application">Application</option><option value="networking">Networking</option><option value="interview">Interview</option></select></Field><Field label="Target date"><input className="input" type="date" name="target_date" /></Field><Field label="Optional note"><input className="input" name="notes" placeholder="What does done look like?" /></Field><SubmitButton className="button-primary sm:col-span-2 sm:w-fit" pendingText="Adding...">Add action</SubmitButton></form></details>
        </div>

        <div className="card border-joye-100 p-6 sm:p-8">
          <p className="eyebrow">Wins and evidence</p><h2 className="mt-2 text-2xl font-semibold">Save proof while it is fresh</h2><p className="mt-2 text-sm leading-6 text-black/50">Projects, measurable results, praise, certifications, and resume bullets become your career story.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">{(evidence || []).map(item => <article key={item.id} className="rounded-2xl border border-black/8 p-4"><span className="rounded-full bg-joye-50 px-2.5 py-1 text-xs font-semibold text-joye-700">{friendly(item.evidence_type)}</span><p className="mt-3 font-semibold">{item.title}</p>{item.description ? <p className="mt-2 text-sm leading-6 text-black/55">{item.description}</p> : null}{item.result ? <p className="mt-2 text-sm font-medium text-green-700">Result: {item.result}</p> : null}</article>)}{!evidence?.length ? <div className="rounded-2xl border border-dashed border-joye-200 p-5 text-sm text-black/45 sm:col-span-2">No evidence saved yet. Add a recent win, project, compliment, or measurable result.</div> : null}</div>
          <details className="mt-5 rounded-2xl bg-joye-50/55 p-4"><summary className="cursor-pointer font-semibold">Add career evidence</summary><form action={addEvidence} className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="What happened?"><input className="input" name="title" required placeholder="Resolved a difficult customer issue" /></Field><Field label="Evidence type"><select className="input" name="evidence_type"><option value="achievement">Achievement</option><option value="project">Project</option><option value="certification">Certification</option><option value="praise">Praise</option><option value="metric">Measurable result</option><option value="resume_bullet">Resume bullet</option></select></Field><Field label="What did you do?"><textarea className="input min-h-24" name="description" placeholder="Describe the situation and your action" /></Field><Field label="What was the result?"><textarea className="input min-h-24" name="result" placeholder="Time saved, issue resolved, revenue, praise, or another outcome" /></Field><Field label="Date"><input className="input" type="date" name="happened_on" /></Field><SubmitButton className="button-primary sm:self-end" pendingText="Saving evidence...">Save evidence</SubmitButton></form></details>
        </div>
      </div>

      <SectionGuidance title="Career Joye" summary={plan.plan_summary || `You are moving toward ${plan.target_role}.`} reasons={[`${gaps.length} personalized skill or proof gaps are in your plan.`, next ? `Your next open action is ${next.title}.` : "Your current roadmap is complete.", `${evidence?.length || 0} pieces of career evidence are saved.`]} nextStep={next?.title || "Review your target and build the next phase."}/>
    </div>
  </section>;
}

function GuidedSetup({ plan, params }: { plan: any; params: { saved?: string; error?: string } }) {
  return <section className="mx-auto max-w-4xl pb-16">
    <p className="eyebrow">Career setup</p><h1 className="mt-3 text-4xl font-semibold tracking-tight">Let’s build a path that fits you</h1><p className="mt-3 max-w-2xl leading-7 text-black/55">Answer a few straightforward questions. Joye will turn them into a simple three-phase career plan.</p>
    <FlashMessage saved={params.saved} error={params.error} />
    <form action={completeCareerSetup} className="card mt-8 border-joye-100 p-6 sm:p-9">
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="What is your current role or life stage?"><input className="input" name="current_role" required defaultValue={plan?.current_role || ""} placeholder="Customer support specialist, student, team lead" /></Field>
        <Field label="What role or outcome do you want next?"><input className="input" name="target_role" required defaultValue={plan?.target_role || ""} placeholder="Project coordinator, senior technician, business owner" /></Field>
        <Field label="Years of relevant experience"><input className="input" type="number" min="0" step="0.5" name="years_experience" defaultValue={plan?.years_experience || ""} placeholder="2" /></Field>
        <Field label="When would you like to make the move?"><input className="input" type="date" name="target_date" defaultValue={plan?.target_date || ""} /></Field>
      </div>
      <Field label="What do you do in your current role?" hint="A few responsibilities are enough."><textarea className="input mt-2 min-h-28" name="responsibilities" defaultValue={plan?.responsibilities || ""} placeholder="Help customers, solve technical issues, train new employees, manage reports..." /></Field>
      <Field label="What skills do you already have?" hint="Separate them with commas or new lines."><textarea className="input mt-2 min-h-28" name="current_skills" defaultValue={plan?.current_skills || ""} placeholder="Customer communication, Excel, troubleshooting, scheduling..." /></Field>
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <Field label="Desired salary range (optional)"><div className="grid grid-cols-2 gap-3"><input className="input" type="number" min="0" name="desired_salary_min" defaultValue={plan?.desired_salary_min || ""} placeholder="Minimum" /><input className="input" type="number" min="0" name="desired_salary_max" defaultValue={plan?.desired_salary_max || ""} placeholder="Ideal" /></div></Field>
        <Field label="Preferred work arrangement"><select className="input" name="work_preference" defaultValue={plan?.work_preference || "flexible"}><option value="flexible">Flexible / no preference</option><option value="remote">Remote</option><option value="hybrid">Hybrid</option><option value="onsite">Onsite</option></select></Field>
        <Field label="What is holding you back most?"><select className="input" name="biggest_barrier" defaultValue={plan?.biggest_barrier || "unsure path"}><option value="unsure path">I am unsure what path to follow</option><option value="missing experience">I need more experience</option><option value="resume">My resume does not show my value</option><option value="interview confidence">Interview confidence</option><option value="certification">I may need a certification</option><option value="applications">I am not applying consistently</option><option value="networking">I need a stronger network</option></select></Field>
        <Field label="Realistic career time each week"><select className="input" name="weekly_hours" defaultValue={plan?.weekly_hours || 2}><option value="1">1 hour</option><option value="2">2 hours</option><option value="3">3 hours</option><option value="4">4 hours</option><option value="5">5 hours</option><option value="7">7+ hours</option></select></Field>
      </div>
      <div className="mt-8 rounded-2xl bg-joye-50/70 p-5"><p className="font-semibold text-joye-950">What Joye will build</p><p className="mt-2 text-sm leading-6 text-joye-900/65">A clear direction, personalized gaps, a three-phase path, the first actions to take, and a place to save career wins and proof.</p></div>
      <SubmitButton className="button-primary mt-6 w-full sm:w-auto" pendingText="Building your career path...">Build my career path</SubmitButton>
    </form>
  </section>;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) { return <div className="mt-4 first:mt-0"><label className="label">{label}</label>{hint ? <p className="mb-2 text-xs text-black/40">{hint}</p> : null}{children}</div>; }
function Metric({ label, value, detail }: { label: string; value: string; detail: string }) { return <div className="card border-joye-100 p-5"><p className="text-sm text-black/45">{label}</p><p className="mt-2 text-xl font-semibold leading-7">{value}</p><p className="mt-2 text-xs leading-5 text-black/45">{detail}</p></div>; }
function friendly(value: string) { return value.replaceAll("_", " ").replace(/^./, c => c.toUpperCase()); }
function formatDate(value: string) { return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); }
