import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { CheckInReminder } from "@/components/dashboard/CheckInReminder";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("display_name,onboarding_complete,check_in_interval_hours,last_check_in_at,primary_focus,notifications_enabled,beta_member_number").eq("id", user.id).maybeSingle();
  if (!profile?.onboarding_complete) redirect("/onboarding");
  const fallback = user.user_metadata?.display_name || user.email?.split("@")[0] || "Member";
  return <DashboardShell displayName={profile?.display_name?.trim() || fallback} betaMemberNumber={profile?.beta_member_number}>{profile?.notifications_enabled !== false ? <CheckInReminder intervalHours={profile?.check_in_interval_hours ?? 6} lastCheckInAt={profile?.last_check_in_at ?? null} primaryFocus={profile?.primary_focus ?? "your current plan"}/> : null}{children}</DashboardShell>;
}
