"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function InviteSignupForm({ token, email, name }: { token: string; email: string; name: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(formData: FormData) {
    setLoading(true); setError("");
    const password = String(formData.get("password") || "");
    const confirmation = String(formData.get("confirmation") || "");
    if (password !== confirmation) { setError("The passwords do not match."); setLoading(false); return; }
    const response = await fetch("/api/invite/accept", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) });
    const result = await response.json();
    if (!response.ok) { setError(result.error || "Your account could not be created."); setLoading(false); return; }
    const supabase = createClient();
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) { router.replace("/login?message=Account created. Please sign in."); return; }
    router.replace("/onboarding"); router.refresh();
  }

  return <form action={submit} className="card space-y-5 p-6 sm:p-8"><div><p className="text-sm text-black/50">Creating an account for</p><p className="mt-1 font-semibold">{name} · {email}</p></div><div><label className="label" htmlFor="password">Create password</label><input className="input" id="password" name="password" type="password" minLength={8} required/></div><div><label className="label" htmlFor="confirmation">Confirm password</label><input className="input" id="confirmation" name="confirmation" type="password" minLength={8} required/></div>{error && <p className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}<button className="button-primary w-full" disabled={loading}>{loading ? "Creating your account…" : "Create account and begin setup"}</button></form>;
}
