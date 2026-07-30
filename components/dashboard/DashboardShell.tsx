"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenText, Brain, BriefcaseBusiness, CalendarDays, CircleDollarSign, Home, LogOut, Menu, MessageSquareText, Target, UserRound, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import clsx from "clsx";
import { useEffect, useState } from "react";

const items = [
  { href: "/dashboard", label: "Today", icon: Home },
  { href: "/dashboard/money", label: "Money", icon: CircleDollarSign },
  { href: "/dashboard/career", label: "Career", icon: BriefcaseBusiness },
  { href: "/dashboard/goals", label: "Goals", icon: Target },
  { href: "/dashboard/weekly", label: "Weekly", icon: CalendarDays },
  { href: "/dashboard/coach", label: "Ask Joye", icon: Brain },
  { href: "/dashboard/memory", label: "Memory", icon: BookOpenText },
  { href: "/dashboard/feedback", label: "Feedback", icon: MessageSquareText },
  { href: "/dashboard/profile", label: "About You", icon: UserRound },
];
const primaryMobileItems = items.slice(0, 4);
const secondaryMobileItems = items.slice(4);

export function DashboardShell({ children, displayName, betaMemberNumber }: { children: React.ReactNode; displayName: string; betaMemberNumber?: number | null }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  useEffect(() => setMoreOpen(false), [pathname]);
  const activeFor = (href: string) => pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
  return <div className="min-h-screen lg:grid lg:grid-cols-[264px_1fr]">
    <aside className="hidden border-r border-blue-100 bg-white p-6 lg:flex lg:flex-col"><Logo href="/dashboard"/><div className="mt-8 rounded-2xl bg-blue-50 p-4"><p className="text-xs font-semibold uppercase tracking-[.16em] text-blue-600">Your space</p><p className="mt-2 truncate font-semibold text-ink">{displayName}</p><p className="mt-2 text-xs font-semibold text-blue-700">Founding Beta{betaMemberNumber ? ` · #${betaMemberNumber}` : ""}</p></div><nav className="mt-6 space-y-1" aria-label="Dashboard navigation">{items.map(({href,label,icon:Icon})=><Link key={href} href={href} className={clsx("flex min-h-10 items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold transition",activeFor(href)?"bg-blue-600 text-white shadow-sm":"text-black/55 hover:bg-blue-50 hover:text-blue-700")}><Icon size={18}/>{label}</Link>)}</nav><form action="/auth/signout" method="post" className="mt-auto"><button className="flex min-h-11 w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-black/55 transition hover:bg-red-50 hover:text-red-700"><LogOut size={18}/>Sign out</button></form><p className="mt-4 text-xs leading-5 text-black/40">Joye Life early access<br/>Personal guidance, one step at a time.</p></aside>
    <div className="min-w-0"><header className="sticky top-0 z-30 flex items-center justify-between border-b border-blue-100 bg-white/95 px-4 py-3 backdrop-blur lg:hidden"><Logo href="/dashboard"/><Link href="/dashboard/profile" className="max-w-[170px] truncate rounded-xl bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">{displayName}</Link></header><main className="min-w-0 p-4 pb-[calc(6.75rem+env(safe-area-inset-bottom))] sm:p-6 lg:p-10 lg:pb-10">{children}</main>
    {moreOpen?<div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] lg:hidden" onClick={()=>setMoreOpen(false)}><div className="absolute inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] max-h-[70vh] overflow-y-auto rounded-3xl border border-blue-100 bg-white p-3 shadow-2xl" onClick={e=>e.stopPropagation()}><div className="flex items-center justify-between px-2 py-2"><div><p className="text-sm font-semibold">More</p><p className="text-xs text-black/45">Coach, planning, memory, and settings</p></div><button type="button" aria-label="Close menu" className="grid h-11 w-11 place-items-center rounded-2xl bg-black/[.04]" onClick={()=>setMoreOpen(false)}><X size={18}/></button></div><div className="mt-1 grid gap-2">{secondaryMobileItems.map(({href,label,icon:Icon})=><Link key={href} href={href} className={clsx("flex min-h-12 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold",activeFor(href)?"bg-blue-600 text-white":"bg-blue-50/70 text-blue-900")}><Icon size={18}/>{label}</Link>)}<form action="/auth/signout" method="post"><button className="flex min-h-12 w-full items-center gap-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"><LogOut size={18}/>Sign out</button></form></div></div></div>:null}
    <nav className="fixed inset-x-3 bottom-[calc(.75rem+env(safe-area-inset-bottom))] z-50 grid grid-cols-5 rounded-3xl border border-blue-100 bg-white/95 p-2 shadow-soft backdrop-blur lg:hidden" aria-label="Mobile navigation">{primaryMobileItems.map(({href,label,icon:Icon})=><Link key={href} href={href} className={clsx("flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-semibold",activeFor(href)?"bg-blue-600 text-white":"text-black/50")}><Icon size={18}/>{label}</Link>)}<button type="button" onClick={()=>setMoreOpen(v=>!v)} className={clsx("flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-semibold",secondaryMobileItems.some(i=>activeFor(i.href))||moreOpen?"bg-blue-600 text-white":"text-black/50")} aria-expanded={moreOpen} aria-label="Open more navigation options"><Menu size={18}/>More</button></nav></div>
  </div>;
}
