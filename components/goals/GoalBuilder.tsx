"use client";
import { useMemo, useState } from "react";
import { inferGoalKind, goalTypeLabel } from "@/lib/joye/goals";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function GoalBuilder({ action }: { action: (formData: FormData) => void | Promise<void> }) {
  const [rawGoal, setRawGoal] = useState("");
  const kind = useMemo(() => inferGoalKind(rawGoal), [rawGoal]);
  const frequencyGoal = ["habit", "health", "learning"].includes(kind);
  const numberGoal = kind === "financial";

  return <form action={action} className="card border-joye-100 p-6 sm:p-8">
    <p className="eyebrow">Create a goal with Joye</p>
    <h2 className="mt-2 text-2xl font-semibold">What do you want to improve?</h2>
    <p className="mt-2 max-w-2xl text-sm leading-6 text-black/55">Write it naturally. Joye will choose a useful structure instead of forcing every goal into dates, numbers, and units.</p>
    <textarea className="input mt-5 min-h-28" name="raw_goal" required value={rawGoal} onChange={e=>setRawGoal(e.target.value)} placeholder="I want to go to the gym more, save for an emergency fund, or move into a better role..." />
    {rawGoal.trim() ? <div className="mt-3 inline-flex rounded-full bg-joye-50 px-3 py-1.5 text-xs font-semibold text-joye-700">Likely goal style: {goalTypeLabel(kind)}</div> : null}
    <input type="hidden" name="goal_kind" value={kind}/>

    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      <Field label="Why does this matter to you?"><textarea className="input min-h-24" name="motivation" placeholder="What would improve if this became part of your life?"/></Field>
      <Field label="What usually gets in the way?"><textarea className="input min-h-24" name="obstacle" placeholder="Time, energy, money, uncertainty, consistency..."/></Field>
      {frequencyGoal ? <Field label="What feels realistic each week?"><select className="input" name="frequency" defaultValue="3"><option value="1">Once per week</option><option value="2">2 times per week</option><option value="3">3 times per week</option><option value="4">4 times per week</option><option value="5">5 times per week</option><option value="7">Daily</option></select></Field> : null}
      {numberGoal ? <><Field label="Target amount (optional)"><input className="input" name="target_value" type="number" min="0" step="0.01" placeholder="2000"/></Field><input type="hidden" name="unit" value="dollars"/></> : null}
      <Field label="Target date (optional)"><input className="input" type="date" name="target_date"/></Field>
      <Field label="Priority"><select className="input" name="priority" defaultValue="2"><option value="1">High — this needs attention now</option><option value="2">Normal — important, but balanced</option><option value="3">Low — build gradually</option></select></Field>
    </div>
    <SubmitButton className="button-primary mt-6" pendingText="Building your goal...">Build my goal</SubmitButton>
  </form>
}
function Field({label,children}:{label:string;children:React.ReactNode}){return <div><label className="label">{label}</label>{children}</div>}
