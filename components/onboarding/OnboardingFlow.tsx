"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import { completeOnboarding } from "@/app/onboarding/actions";

const steps = ["About you", "What matters", "Your reality", "First goal"];

export function OnboardingFlow({ defaultName = "", error }: { defaultName?: string; error?: string }) {
  const [step, setStep] = useState(0);
  const progress = useMemo(() => ((step + 1) / steps.length) * 100, [step]);

  function next() {
    const panel = document.querySelector<HTMLElement>(`[data-onboarding-step="${step}"]`);
    const inputs = panel?.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("[required]");
    const valid = Array.from(inputs || []).every((input) => input.reportValidity());
    if (valid) setStep((value) => Math.min(steps.length - 1, value + 1));
  }

  return (
    <form action={completeOnboarding} className="card overflow-hidden border-joye-100">
      <div className="border-b border-joye-100 bg-joye-50/70 p-5 sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Step {step + 1} of {steps.length}</p>
            <p className="mt-1 font-semibold text-ink">{steps[step]}</p>
          </div>
          <div className="rounded-2xl bg-white p-3 text-joye-600 shadow-sm"><Sparkles size={20} /></div>
        </div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-white">
          <div className="h-full rounded-full brand-gradient transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {error && <p className="mx-6 mt-6 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      <div className="p-6 sm:p-8">
        <section data-onboarding-step="0" className={step === 0 ? "grid gap-6" : "hidden"}>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Let’s make Joye Life yours.</h1>
            <p className="mt-3 max-w-xl leading-7 text-black/55">Start with the basics so your dashboard speaks to you—not a generic user.</p>
          </div>
          <div><label className="label">What should Joye call you?</label><input className="input" name="display_name" defaultValue={defaultName} placeholder="Your first name" required /></div>
          <div><label className="label">What area of life matters most right now?</label><select className="input" name="primary_focus" required defaultValue=""><option value="" disabled>Choose your main focus</option><option>Getting organized</option><option>Money and stability</option><option>Career growth</option><option>Health and routines</option><option>Building something of my own</option><option>Finding more balance</option></select></div>
          <div><label className="label">How should Joye guide you?</label><div className="grid gap-3 sm:grid-cols-3">{[["gentle","Encouraging","Supportive nudges"],["balanced","Balanced","Clear and supportive"],["direct","Direct","Straight to the point"]].map(([value,title,copy])=><label key={value} className="cursor-pointer rounded-2xl border border-joye-100 p-4 has-[:checked]:border-joye-500 has-[:checked]:bg-joye-50"><input className="sr-only" type="radio" name="planning_style" value={value} defaultChecked={value==="balanced"}/><span className="block font-semibold">{title}</span><span className="mt-1 block text-sm text-black/50">{copy}</span></label>)}</div></div>
        </section>

        <section data-onboarding-step="1" className={step === 1 ? "grid gap-6" : "hidden"}>
          <div><h2 className="text-3xl font-semibold tracking-tight">What would make life feel better?</h2><p className="mt-3 max-w-xl leading-7 text-black/55">Joye uses this to identify what deserves attention first.</p></div>
          <div><label className="label">What is your biggest challenge right now?</label><textarea className="input min-h-28" name="biggest_challenge" placeholder="Example: I have several priorities and I’m not sure which one deserves my attention first." required /></div>
          <div><label className="label">What would you like to be different in the next 90 days?</label><textarea className="input min-h-28" name="desired_outcome" placeholder="Example: I want a clear weekly routine and visible progress toward one important goal." required /></div>
        </section>

        <section data-onboarding-step="2" className={step === 2 ? "grid gap-6" : "hidden"}>
          <div><h2 className="text-3xl font-semibold tracking-tight">Build around your real life.</h2><p className="mt-3 max-w-xl leading-7 text-black/55">A useful plan should fit your time, energy, and current season.</p></div>
          <div className="grid gap-5 sm:grid-cols-2"><div><label className="label">Minutes you can usually give yourself each day</label><input className="input" name="available_minutes" type="number" min="0" max="1440" defaultValue="30" required /></div><div><label className="label">Your usual energy when you have free time</label><select className="input" name="energy" defaultValue="medium" required><option value="low">Usually low</option><option value="medium">Usually moderate</option><option value="high">Usually high</option></select></div></div>
          <div className="grid gap-5 sm:grid-cols-2"><div><label className="label">Current role or life stage <span className="font-normal text-black/35">(optional)</span></label><input className="input" name="current_role" placeholder="Example: Student, team lead, caregiver" /></div><div><label className="label">Where would you like to move next? <span className="font-normal text-black/35">(optional)</span></label><input className="input" name="target_role" placeholder="Example: A new role, certification, or responsibility" /></div></div>
        </section>

        <section data-onboarding-step="3" className={step === 3 ? "grid gap-6" : "hidden"}>
          <div><h2 className="text-3xl font-semibold tracking-tight">Choose the first win.</h2><p className="mt-3 max-w-xl leading-7 text-black/55">This becomes your first tracked goal and gives Today something meaningful to guide.</p></div>
          <div><label className="label">What is the first goal you want Joye to help with?</label><input className="input" name="goal_title" placeholder="Example: Create a consistent weekly routine" required /></div>
          <div><label className="label">What would progress look like?</label><textarea className="input min-h-24" name="goal_summary" placeholder="Describe what success would look or feel like." /></div>
          <div><label className="label">Target date <span className="font-normal text-black/35">(optional)</span></label><input className="input max-w-xs" type="date" name="goal_due_date" /></div>
          <div className="rounded-2xl border border-joye-100 bg-joye-50 p-5"><p className="font-semibold text-joye-900">Joye will use this setup to:</p><ul className="mt-3 grid gap-2 text-sm text-joye-900/75"><li className="flex gap-2"><Check size={17}/>Personalize your Today briefing</li><li className="flex gap-2"><Check size={17}/>Recommend realistic next steps</li><li className="flex gap-2"><Check size={17}/>Connect your goals, career, and weekly plan</li></ul></div>
        </section>

        <div className="mt-8 flex items-center justify-between border-t border-joye-100 pt-6">
          {step > 0 ? <button type="button" onClick={() => setStep((value) => value - 1)} className="button-secondary inline-flex items-center gap-2"><ArrowLeft size={17}/>Back</button> : <span />}
          {step < steps.length - 1 ? <button type="button" onClick={next} className="button-primary inline-flex items-center gap-2">Continue<ArrowRight size={17}/></button> : <button type="submit" className="button-primary inline-flex items-center gap-2">Build my plan<Sparkles size={17}/></button>}
        </div>
      </div>
    </form>
  );
}
