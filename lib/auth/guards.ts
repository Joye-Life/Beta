import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type AppRole = "owner" | "admin" | "beta_tester" | "user";

export async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const userEmail = user.email?.trim().toLowerCase();
  const admin = createAdminClient();

  // Bootstrap the project owner from the server-only ADMIN_EMAIL value.
  // This avoids hardcoded credentials while still allowing the first owner account.
  if (adminEmail && userEmail === adminEmail) {
    const { error } = await admin
      .from("profiles")
      .update({ role: "owner", access_status: "active" })
      .eq("id", user.id);

    if (error) {
      console.error("Unable to bootstrap owner role:", error.message);
    }

    return { user, role: "owner" as const };
  }

  const { data: profile, error } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !profile || !["owner", "admin"].includes(profile.role)) {
    redirect("/dashboard");
  }

  return { user, role: profile.role as "owner" | "admin" };
}
