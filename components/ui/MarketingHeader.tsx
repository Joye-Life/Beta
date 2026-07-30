import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export function MarketingHeader() {
  return (
    <header className="shell flex items-center justify-between py-6">
      <Logo />
      <nav className="flex items-center gap-3">
        <Link href="/login" className="hidden text-sm font-semibold sm:block">Sign in</Link>
        <Link href="/apply" className="button-primary">Apply for beta</Link>
      </nav>
    </header>
  );
}
