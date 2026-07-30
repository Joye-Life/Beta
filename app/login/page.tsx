import Link from "next/link";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { Logo } from "@/components/ui/Logo";
export default function LoginPage(){return <main className="shell py-8"><Logo/><section className="mx-auto mt-20 max-w-md"><p className="eyebrow">Welcome back</p><h1 className="mt-3 text-4xl font-semibold tracking-tight">Sign in to Joye Life.</h1><div className="mt-8"><Suspense><AuthCard mode="login"/></Suspense></div><div className="mt-5 flex justify-between text-sm"><Link href="/forgot-password">Forgot password?</Link><Link href="/apply" className="font-semibold">Need access?</Link></div></section></main>}
