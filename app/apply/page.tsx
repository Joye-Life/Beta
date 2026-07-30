import Link from "next/link";
import { BetaApplicationForm } from "@/components/forms/BetaApplicationForm";
import { Logo } from "@/components/ui/Logo";

export default function ApplyPage() {
  return (
    <main className="shell py-8 sm:py-12">
      <Logo />
      <div className="mx-auto mt-14 max-w-3xl">
        <p className="eyebrow">Private beta</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">Apply to help shape Joye Life.</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-black/60">We are selecting a small group of early testers who want clearer guidance—not another place to collect tasks.</p>
        <div className="mt-10"><BetaApplicationForm /></div>
        <p className="mt-6 text-center text-sm text-black/50">Already approved? <Link href="/signup" className="font-semibold text-ink">Create your account</Link></p>
      </div>
    </main>
  );
}
