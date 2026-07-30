import { notFound } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { InviteSignupForm } from "@/components/auth/InviteSignupForm";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashInviteToken } from "@/lib/invites";

export const dynamic = "force-dynamic";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { data } = await createAdminClient().from("beta_applications").select("email,full_name,status,invite_expires_at,invite_used_at").eq("invite_token_hash", hashInviteToken(token)).single();
  const valid = data && data.status === "invited" && !data.invite_used_at && data.invite_expires_at && data.invite_expires_at > new Date().toISOString();
  if (!data) notFound();
  return <main className="shell py-8"><Logo/><section className="mx-auto mt-16 max-w-lg"><p className="eyebrow">Joye Life early access</p><h1 className="mt-3 text-4xl font-semibold tracking-tight">{valid ? "Your invitation is ready." : "This invitation is no longer active."}</h1><p className="mt-3 leading-7 text-black/55">{valid ? "Create your private beta account, then Joye will guide you through a short personal setup." : "The link may have expired or already been used. Contact Joye Life to request another invitation."}</p>{valid && <div className="mt-8"><InviteSignupForm token={token} email={data.email} name={data.full_name}/></div>}</section></main>;
}
