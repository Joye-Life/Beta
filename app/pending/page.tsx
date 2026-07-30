import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export default function PendingPage() {
  return <main className="shell py-8"><Logo /><section className="mx-auto grid min-h-[75vh] max-w-xl place-items-center text-center"><div><CheckCircle2 className="mx-auto" size={42}/><p className="eyebrow mt-6">Application received</p><h1 className="mt-4 text-4xl font-semibold tracking-tight">You’re on the review list.</h1><p className="mt-4 leading-7 text-black/60">We’ll review your application and contact you when an early-access spot is available.</p><Link className="button-secondary mt-8" href="/">Back to Joye Life</Link></div></section></main>;
}
