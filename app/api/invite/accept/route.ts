import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashInviteToken } from "@/lib/invites";

const schema = z.object({
  token: z.string().min(20).max(200),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a password with at least 8 characters." }, { status: 400 });

  const admin = createAdminClient();
  const hash = hashInviteToken(parsed.data.token);
  const now = new Date().toISOString();
  const { data: application, error } = await admin
    .from("beta_applications")
    .select("id,email,full_name,primary_focus,status,invite_expires_at,invite_used_at")
    .eq("invite_token_hash", hash)
    .single();

  if (error || !application || application.status !== "invited" || application.invite_used_at) {
    return NextResponse.json({ error: "This invitation is invalid or has already been used." }, { status: 400 });
  }
  if (!application.invite_expires_at || application.invite_expires_at < now) {
    return NextResponse.json({ error: "This invitation has expired. Ask Joye Life for a new invitation." }, { status: 400 });
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: application.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { display_name: application.full_name },
  });

  if (createError || !created.user) {
    const duplicate = createError?.message.toLowerCase().includes("already") || createError?.message.toLowerCase().includes("registered");
    return NextResponse.json({ error: duplicate ? "An account already exists for this email. Sign in instead." : createError?.message || "Account creation failed." }, { status: 400 });
  }

  const { error: profileError } = await admin.from("profiles").upsert({
    id: created.user.id,
    email: application.email,
    display_name: application.full_name,
    role: "beta_tester",
    access_status: "active",
    primary_focus: application.primary_focus,
    onboarding_complete: false,
  }, { onConflict: "id" });

  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: "The account could not be initialized." }, { status: 500 });
  }

  await admin.from("beta_applications").update({ invite_used_at: now }).eq("id", application.id);
  return NextResponse.json({ ok: true, email: application.email });
}
