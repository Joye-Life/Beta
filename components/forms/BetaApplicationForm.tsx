"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const focusOptions = ["Career growth", "Money and debt", "Planning and consistency", "Goals and personal growth", "A mix of everything"];

export function BetaApplicationForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(formData: FormData) {
    setLoading(true); setError("");
    const payload = Object.fromEntries(formData.entries());
    const response = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) return setError(data.error || "Unable to submit your application.");
    router.push("/pending");
  }

  return (
    <form action={submit} className="card space-y-6 p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div><label className="label" htmlFor="full_name">Full name</label><input className="input" id="full_name" name="full_name" required placeholder="Your name" /></div>
        <div><label className="label" htmlFor="email">Email</label><input className="input" id="email" name="email" type="email" required placeholder="you@example.com" /></div>
      </div>
      <div><label className="label" htmlFor="role">What best describes you?</label><input className="input" id="role" name="role" placeholder="Professional, student, business owner…" /></div>
      <fieldset>
        <legend className="label">What do you most want help with?</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {focusOptions.map((option) => <label key={option} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-black/10 p-4 text-sm font-medium hover:border-black/20"><input type="radio" name="primary_focus" value={option} required />{option}</label>)}
        </div>
      </fieldset>
      <div><label className="label" htmlFor="biggest_challenge">What feels hardest right now?</label><textarea className="input min-h-28 resize-y" id="biggest_challenge" name="biggest_challenge" required placeholder="Describe the friction, confusion, or decision you keep getting stuck on." /></div>
      <div><label className="label" htmlFor="desired_outcome">What would make Joye Life genuinely valuable to you?</label><textarea className="input min-h-28 resize-y" id="desired_outcome" name="desired_outcome" required placeholder="Tell us what a useful result would look like." /></div>
      <div><label className="label" htmlFor="expected_frequency">How often would you realistically use it?</label><select className="input" id="expected_frequency" name="expected_frequency" required defaultValue=""><option value="" disabled>Select one</option><option>Daily</option><option>A few times each week</option><option>Weekly</option><option>Only when I need guidance</option></select></div>
      <input className="hidden" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      {error && <p className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      <button className="button-primary w-full" disabled={loading}>{loading ? "Submitting…" : "Submit application"}</button>
    </form>
  );
}
