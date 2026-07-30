import { requireAdmin } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { ApplicationReviewTable } from "@/components/admin/ApplicationReviewTable";
import type { BetaApplication } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  const { user, role } = await requireAdmin();
  const { data, error } = await createAdminClient().from("beta_applications").select("*").order("created_at", { ascending: false }).limit(100);
  return <section className="shell py-10"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">Admin</p><h1 className="mt-3 text-4xl font-semibold tracking-tight">Beta applications</h1><p className="mt-2 text-sm text-black/50">Signed in as {user.email} · {role}</p></div><a className="button-secondary" href="/dashboard">Back to dashboard</a></div>{error ? <p className="mt-6 rounded-2xl bg-red-50 p-4 text-sm text-red-700">Applications could not be loaded: {error.message}</p> : <ApplicationReviewTable initialApplications={(data ?? []) as BetaApplication[]}/>}</section>;
}
