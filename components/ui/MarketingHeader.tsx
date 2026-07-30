import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export function MarketingHeader() {
  return (
    <header className="shell relative z-20 flex items-center justify-between py-6">
      <Logo />
      <nav className="flex items-center gap-3">
        <Link href="/login" className="hidden text-sm font-semibold text-ink transition hover:text-joye-600 sm:block">Sign in</Link>
        <Link href="/apply" className="button-primary">Apply for beta</Link>
      </nav>
    </header>
  );
}
