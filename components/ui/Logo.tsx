import Image from "next/image";
import Link from "next/link";

export function Logo({ href = "/", compact = false }: { href?: string; compact?: boolean }) {
  return (
    <Link href={href} className="inline-flex items-center gap-3 font-semibold tracking-tight" aria-label="Joye Life home">
      <span className="relative block h-10 w-10 shrink-0 overflow-hidden rounded-[14px] shadow-brand ring-1 ring-white/60">
        <Image src="/brand/joye-mark-dark.png" alt="" fill sizes="40px" className="object-cover" priority />
      </span>
      {!compact ? <span className="text-[1.05rem]"><span className="brand-text font-bold">Joye</span> Life</span> : null}
    </Link>
  );
}
