import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/guards";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FlashMessage } from "@/components/ui/FlashMessage";

async function saveProfile(formData: FormData) {
  "use server";
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({
    display_name: String(formData.get("display_name") || "").trim(),
    primary_focus: String(formData.get("primary_focus") || "").trim(),
    biggest_challenge: String(formData.get("biggest_challenge") || "").trim(),
    desired_outcome: String(formData.get("desired_outcome") || "").trim(),
    available_minutes: Number(formData.get("available_minutes") || 30),
    energy: String(formData.get("energy") || "medium"),
    planning_style: String(formData.get("planning_style") || "balanced"),
    check_in_interval_hours: Number(formData.get("check_in_interval_hours") || 6),
    notifications_enabled: formData.get("notifications_enabled") === "on",
    updated_at: new Date().toISOString(),
  }).eq("id", user.id);

  if (error) redirect(`/dashboard/profile?error=${encodeURIComponent("Profile could not be saved. Please try again.")}`);
  revalidatePath("/dashboard", "layout");
  redirect(`/dashboard/profile?saved=${encodeURIComponent("Profile saved.")}`);
}

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const params = await searchParams;
  const user = await requireUser();
  const supabase = await createClient();
  const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return <section className="mx-auto max-w-4xl">
    <p className="eyebrow">Profile</p>
    <h1 className="mt-3 text-4xl font-semibold tracking-tight">What Joye knows about you</h1>
    <p className="mt-3 text-black/55">Update the context that shapes Today, your recommendations, and your plan.</p>
    <FlashMessage saved={params.saved} error={params.error} />
    <div className="card mt-8 flex flex-col gap-5 border-joye-100 bg-gradient-to-br from-joye-50 to-white p-6 sm:flex-row sm:items-center sm:justify-between"><div><p className="eyebrow">Your plan</p><h2 className="mt-2 text-2xl font-semibold">Founding Beta{p?.beta_member_number ? ` · Member #${p.beta_member_number}` : ""}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-black/55">Everything is included during the closed beta. You will keep access to founding-member pricing when paid plans launch.</p></div><div className="flex flex-wrap gap-2"><a className="button-secondary" href="/dashboard/memory">View Memory</a><a className="button-primary" href="/dashboard/coach">Ask Joye</a></div></div>
    <form action={saveProfile} className="card mt-8 grid gap-6 border-joye-100 p-6 sm:p-8">
      <div><label className="label">What should Joye call you?</label><input className="input" name="display_name" defaultValue={p?.display_name || user.user_metadata?.display_name || ""} placeholder="Your first name" /></div>
      <div><label className="label">Main focus right now</label><input className="input" name="primary_focus" defaultValue={p?.primary_focus || ""} placeholder="What deserves the most attention?" /></div>
      <div><label className="label">Biggest challenge</label><textarea className="input min-h-24" name="biggest_challenge" defaultValue={p?.biggest_challenge || ""} placeholder="What is making progress difficult?" /></div>
      <div><label className="label">Desired 90-day outcome</label><textarea className="input min-h-24" name="desired_outcome" defaultValue={p?.desired_outcome || ""} placeholder="What would you like to be different?" /></div>
      <div className="grid gap-5 sm:grid-cols-3">
        <div><label className="label">Daily minutes</label><input className="input" type="number" min="0" max="1440" name="available_minutes" defaultValue={p?.available_minutes ?? 30} /></div>
        <div><label className="label">Typical energy</label><select className="input" name="energy" defaultValue={p?.energy || "medium"}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
        <div><label className="label">Guidance style</label><select className="input" name="planning_style" defaultValue={p?.planning_style || "balanced"}><option value="gentle">Encouraging</option><option value="balanced">Balanced</option><option value="direct">Direct</option></select></div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div><label className="label">Check-in frequency</label><select className="input" name="check_in_interval_hours" defaultValue={p?.check_in_interval_hours ?? 6}><option value="4">Every 4 hours</option><option value="6">Every 6 hours</option><option value="8">Every 8 hours</option><option value="12">Every 12 hours</option><option value="24">Once a day</option></select></div>
        <label className="flex items-center gap-3 rounded-2xl bg-joye-50 p-4 text-sm text-joye-900"><input type="checkbox" name="notifications_enabled" defaultChecked={p?.notifications_enabled ?? true}/>Show Joye check-in reminders</label>
      </div>
      <div className="rounded-2xl bg-joye-50 p-4 text-sm text-joye-900"><strong>Account email:</strong> {user.email}</div>
      <SubmitButton className="button-primary w-fit" pendingText="Saving profile...">Save profile</SubmitButton>
    </form>
  </section>;
}
