import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  full_name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254).transform((v) => v.toLowerCase()),
  role: z.string().trim().max(120).optional().default(""),
  primary_focus: z.string().trim().min(2).max(120),
  biggest_challenge: z.string().trim().min(10).max(2000),
  desired_outcome: z.string().trim().min(10).max(2000),
  expected_frequency: z.string().trim().min(2).max(80),
  company: z.string().optional().default(""),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please complete every required field." }, { status: 400 });
  if (parsed.data.company) return NextResponse.json({ ok: true });

  try {
    const supabase = createAdminClient();
    const { company: _, ...record } = parsed.data;
    const { error } = await supabase.from("beta_applications").upsert(record, { onConflict: "email", ignoreDuplicates: false });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Beta application error", error);
    return NextResponse.json({ error: "Applications are temporarily unavailable." }, { status: 500 });
  }
}
