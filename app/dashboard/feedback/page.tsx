import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/guards";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FlashMessage } from "@/components/ui/FlashMessage";

async function submitFeedback(formData: FormData) {
  "use server";
  const user = await requireUser();
  const supabase = await createClient();
  const message = String(formData.get("message") || "").trim();
  if (!message) redirect(`/dashboard/feedback?error=${encodeURIComponent("Add a message before sending feedback.")}`);
  const ratingValue = String(formData.get("rating") || "");
  const { error } = await supabase.from("feedback").insert({
    user_id: user.id,
    email: user.email,
    category: String(formData.get("category") || "general"),
    rating: ratingValue ? Number(ratingValue) : null,
    message,
    can_contact: formData.get("can_contact") === "on",
  });
  if (error) redirect(`/dashboard/feedback?error=${encodeURIComponent("Feedback could not be sent. Please try again.")}`);
  revalidatePath("/dashboard/feedback");
  redirect(`/dashboard/feedback?saved=${encodeURIComponent("Thanks—your feedback was sent.")}`);
}

export default async function Feedback({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const params = await searchParams;
  const user = await requireUser();
  const supabase = await createClient();
  const { data: recent } = await supabase.from("feedback").select("id,category,rating,message,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(3);
  return <section className="mx-auto max-w-4xl">
    <p className="eyebrow">Feedback</p><h1 className="mt-3 text-4xl font-semibold tracking-tight">Help shape Joye Life</h1><p className="mt-3 text-black/55">Tell us what helped, what felt confusing, or what you wish the app did next.</p>
    <FlashMessage saved={params.saved} error={params.error} />
    <form action={submitFeedback} className="card mt-8 grid gap-5 border-blue-100 p-6 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2"><div><label className="label">Feedback type</label><select className="input" name="category"><option value="feature">Feature idea</option><option value="bug">Bug</option><option value="confusing">Confusing experience</option><option value="general">General feedback</option></select></div><div><label className="label">Experience rating</label><select className="input" name="rating"><option value="">No rating</option>{[5,4,3,2,1].map(n => <option key={n} value={n}>{n} / 5</option>)}</select></div></div>
      <div><label className="label">What should we know?</label><textarea required className="input min-h-36" name="message" placeholder="Describe what happened or what would make Joye Life more useful."/></div>
      <label className="flex items-center gap-3 text-sm text-black/60"><input type="checkbox" name="can_contact"/>You may contact me about this feedback.</label>
      <SubmitButton className="button-primary w-fit" pendingText="Sending feedback...">Send feedback</SubmitButton>
    </form>
    {recent?.length ? <div className="mt-8"><h2 className="text-xl font-semibold">Your recent feedback</h2><div className="mt-4 space-y-3">{recent.map(item => <article className="card border-blue-100 p-4" key={item.id}><p className="text-xs font-semibold uppercase tracking-[.14em] text-blue-600">{item.category}</p><p className="mt-2 text-sm text-black/60">{item.message}</p></article>)}</div></div> : null}
  </section>;
}
