import { Suspense } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { Logo } from "@/components/ui/Logo";
export default function ForgotPasswordPage(){return <main className="shell py-8"><Logo/><section className="mx-auto mt-20 max-w-md"><p className="eyebrow">Account recovery</p><h1 className="mt-3 text-4xl font-semibold tracking-tight">Reset your password.</h1><div className="mt-8"><Suspense><AuthCard mode="reset"/></Suspense></div></section></main>}
