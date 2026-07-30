import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export default function SignupPage() {
  return <main className="shell py-8"><Logo/><section className="mx-auto mt-20 max-w-lg"><p className="eyebrow">Private beta</p><h1 className="mt-3 text-4xl font-semibold tracking-tight">Accounts are invitation-only.</h1><p className="mt-4 leading-7 text-black/55">Approved applicants receive a secure, one-time link to create their account. This keeps the beta focused and ensures every tester receives a deliberate onboarding experience.</p><div className="mt-8 flex flex-wrap gap-3"><Link className="button-primary" href="/apply">Apply for early access</Link><Link className="button-secondary" href="/login">I already have an account</Link></div></section></main>;
}
