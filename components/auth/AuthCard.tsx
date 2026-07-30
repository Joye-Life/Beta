"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AuthCard({ mode }: { mode: "login" | "signup" | "reset" }) {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(formData: FormData) {
    setLoading(true); setError(""); setMessage("");
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const supabase = createClient();

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message); else router.replace(params.get("next") || "/dashboard");
    } else if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/onboarding` } });
      if (error) setError(error.message); else setMessage("Check your email to confirm your account.");
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/dashboard/profile` });
      if (error) setError(error.message); else setMessage("Password reset instructions are on the way.");
    }
    setLoading(false);
  }

  return (
    <form action={submit} className="card space-y-5 p-6 sm:p-8">
      <div><label className="label" htmlFor="email">Email</label><input className="input" id="email" name="email" type="email" required /></div>
      {mode !== "reset" && <div><label className="label" htmlFor="password">Password</label><input className="input" id="password" name="password" type="password" minLength={8} required /></div>}
      {error && <p className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {message && <p className="rounded-2xl bg-green-50 p-4 text-sm text-green-700">{message}</p>}
      <button className="button-primary w-full" disabled={loading}>{loading ? "Please wait…" : mode === "login" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}</button>
    </form>
  );
}
