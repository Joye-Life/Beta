import Link from "next/link";
import { ArrowRight, Lightbulb, Sparkles } from "lucide-react";

function sectionFromTitle(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes("money")) return "money";
  if (lower.includes("career")) return "career";
  if (lower.includes("goal")) return "goals";
  if (lower.includes("weekly")) return "weekly";
  return "general";
}

export function SectionGuidance({ title, summary, reasons, nextStep }: { title: string; summary: string; reasons: string[]; nextStep: string }) {
  const usefulReasons = reasons.filter(Boolean).slice(0, 4);
  const section = sectionFromTitle(title);
  return (
    <aside className="card overflow-hidden border-joye-100 bg-gradient-to-br from-joye-50 to-white">
      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl brand-gradient text-white"><Sparkles size={18}/></span>
          <div className="min-w-0"><p className="eyebrow">Personalized guidance</p><h2 className="mt-1 truncate text-xl font-semibold">{title}</h2></div>
        </div>
        <p className="mt-4 break-anywhere leading-7 text-black/60">{summary}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">{usefulReasons.map((reason) => <div key={reason} className="flex min-w-0 gap-3 rounded-2xl bg-white p-3 text-sm leading-6 text-black/60 shadow-sm"><Lightbulb className="mt-1 shrink-0 text-joye-600" size={16}/><span className="break-anywhere">{reason}</span></div>)}</div>
      </div>
      <div className="brand-gradient p-5 text-white sm:px-6"><p className="text-xs font-semibold uppercase tracking-[.16em] text-white/70">Suggested next step</p><p className="mt-2 break-anywhere font-semibold leading-6">{nextStep}</p><Link href={`/dashboard/coach?section=${section}`} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-joye-700">Ask Joye about this <ArrowRight size={15}/></Link></div>
    </aside>
  );
}
