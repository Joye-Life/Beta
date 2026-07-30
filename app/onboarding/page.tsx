import { redirect } from "next/navigation";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { Logo } from "@/components/ui/Logo";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("display_name,onboarding_complete").eq("id", user.id).maybeSingle();
  if (profile?.onboarding_complete) redirect("/dashboard");
  const params = await searchParams;
  const fallback = profile?.display_name || user.user_metadata?.display_name || user.email?.split("@")[0] || "";

  return <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe_0,transparent_32%),#f8fbff] px-4 py-7 sm:px-6"><div className="mx-auto max-w-3xl"><Logo href="/"/><div className="mt-10"><OnboardingFlow defaultName={fallback} error={params.error}/></div><p className="mt-5 text-center text-xs leading-5 text-black/40">Your answers stay private and can be changed later from Profile.</p></div></main>;
}
