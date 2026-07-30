import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 font-semibold tracking-tight">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink text-white">J</span>
      <span>Joye Life</span>
    </Link>
  );
}
