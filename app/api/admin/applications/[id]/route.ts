import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { createInviteToken, getAppUrl, hashInviteToken } from "@/lib/invites";
import { sendInviteEmail } from "@/lib/email";

const bodySchema = z.object({
  action: z.enum(["approve", "reject", "waitlist", "resend"]),
  notes: z.string().trim().max(2000).optional().default(""),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { user } = await requireAdmin();
  const { id } = await context.params;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid review action." }, { status: 400 });

  const admin = createAdminClient();
  const { data: application, error: loadError } = await admin
    .from("beta_applications")
    .select("id,email,full_name,status")
    .eq("id", id)
    .single();

  if (loadError || !application) return NextResponse.json({ error: "Application not found." }, { status: 404 });

  if (parsed.data.action === "reject" || parsed.data.action === "waitlist") {
    const status = parsed.data.action === "reject" ? "rejected" : "waitlisted";
    const { error } = await admin.from("beta_applications").update({
      status,
      admin_notes: parsed.data.notes || null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      invite_token_hash: null,
      invite_expires_at: null,
    }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, status });
  }

  const token = createInviteToken();
  const tokenHash = hashInviteToken(token);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const inviteUrl = `${getAppUrl()}/invite/${token}`;

  const { error: updateError } = await admin.from("beta_applications").update({
    status: "invited",
    admin_notes: parsed.data.notes || null,
    reviewed_at: new Date().toISOString(),
    reviewed_by: user.id,
    invite_token_hash: tokenHash,
    invite_expires_at: expiresAt,
    invite_sent_at: new Date().toISOString(),
    invite_used_at: null,
  }).eq("id", id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  try {
    const email = await sendInviteEmail({ to: application.email, name: application.full_name, inviteUrl });
    return NextResponse.json({ ok: true, status: "invited", inviteUrl, emailSent: email.sent, emailReason: "reason" in email ? email.reason : null });
  } catch (error) {
    console.error("Invite email failed", error);
    return NextResponse.json({ ok: true, status: "invited", inviteUrl, emailSent: false, emailReason: "The invite was created, but email delivery failed." });
  }
}
