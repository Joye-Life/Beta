"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

function text(formData: FormData, key: string, max = 500) {
  return String(formData.get(key) || "").trim().slice(0, max);
}

export async function completeOnboarding(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const displayName = text(formData, "display_name", 80);
  const primaryFocus = text(formData, "primary_focus", 160);
  const biggestChallenge = text(formData, "biggest_challenge", 500);
  const desiredOutcome = text(formData, "desired_outcome", 500);
  const currentRole = text(formData, "current_role", 160);
  const targetRole = text(formData, "target_role", 160);
  const goalTitle = text(formData, "goal_title", 180) || desiredOutcome;
  const goalSummary = text(formData, "goal_summary", 500) || biggestChallenge;
  const availableMinutes = Math.min(1440, Math.max(0, Number(formData.get("available_minutes") || 30)));
  const energy = ["low", "medium", "high"].includes(text(formData, "energy", 20))
    ? text(formData, "energy", 20)
    : "medium";
  const planningStyle = ["gentle", "balanced", "direct"].includes(text(formData, "planning_style", 20))
    ? text(formData, "planning_style", 20)
    : "balanced";
  const goalDueDate = text(formData, "goal_due_date", 20) || null;

  if (!displayName || !primaryFocus || !biggestChallenge || !desiredOutcome || !goalTitle) {
    redirect("/onboarding?error=Please%20complete%20all%20required%20fields.");
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      primary_focus: primaryFocus,
      biggest_challenge: biggestChallenge,
      desired_outcome: desiredOutcome,
      available_minutes: availableMinutes,
      energy,
      planning_style: planningStyle,
      onboarding_complete: true,
      onboarding_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (profileError) {
    console.error("Profile onboarding failed:", profileError.message);
    redirect("/onboarding?error=We%20could%20not%20save%20your%20profile.%20Please%20try%20again.");
  }

  if (currentRole || targetRole) {
    const { error: careerError } = await supabase.from("career_plans").upsert({
      user_id: user.id,
      current_role: currentRole || null,
      target_role: targetRole || null,
      next_milestone: targetRole ? `Define the first step toward ${targetRole}` : null,
      updated_at: new Date().toISOString(),
    });
    if (careerError) console.error("Career onboarding failed:", careerError.message);
  }

  const { error: goalError } = await supabase.from("goals").insert({
    user_id: user.id,
    title: goalTitle,
    summary: goalSummary || null,
    due_date: goalDueDate,
    progress: 0,
    status: "active",
  });
  if (goalError && goalError.code !== "23505") {
    console.error("Goal onboarding failed:", goalError.message);
  }

  redirect("/dashboard");
}
