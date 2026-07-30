"use client";

import { useMemo, useRef, useState } from "react";
import { ArrowUp, Brain, CircleDollarSign, BriefcaseBusiness, CalendarDays, RotateCcw, Sparkles, Target } from "lucide-react";
import clsx from "clsx";
import type { CoachSection } from "@/lib/joye/load-context";

type Message = { id: string; role: "user" | "assistant"; content: string; provider?: string };

type AiUsage = {
  enabled: boolean;
  dailyLimit: number;
  monthlyLimit: number;
  dailyUsed: number;
  monthlyUsed: number;
  remainingDaily: number;
  remainingMonthly: number;
  available: boolean;
  reason: string;
};

const sections: Array<{ value: CoachSection; label: string; icon: typeof Brain }> = [
  { value: "general", label: "Life", icon: Brain },
  { value: "money", label: "Money", icon: CircleDollarSign },
  { value: "career", label: "Career", icon: BriefcaseBusiness },
  { value: "goals", label: "Goals", icon: Target },
  { value: "weekly", label: "Weekly", icon: CalendarDays },
];

const prompts: Record<CoachSection, string[]> = {
  today: ["What should I focus on today?", "What am I overlooking?"],
  general: ["Help me be more consistent with the gym", "How can I hit my protein goal?", "Help me plan a simple meal prep"],
  money: ["What should I do with my next paycheck?", "Can I afford a nonessential purchase?", "Which debt deserves extra money first?"],
  career: ["What is my best next career move?", "What proof am I missing?", "Turn my progress into a resume bullet"],
  goals: ["Which goal should get my attention?", "Help me make this goal easier to maintain", "What is the next step?"],
  weekly: ["Rearrange my week around my available time", "What should I remove from this week?", "Build a realistic focus plan"],
};

export function CoachExperience({
  initialSection,
  initialConversationId,
  initialMessages,
  initialUsage,
}: {
  initialSection: CoachSection;
  initialConversationId: string | null;
  initialMessages: Message[];
  initialUsage: AiUsage;
}) {
  const [section, setSection] = useState<CoachSection>(initialSection);
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [usage, setUsage] = useState(initialUsage);
  const formRef = useRef<HTMLFormElement>(null);
  const suggestions = useMemo(() => prompts[section] || prompts.general, [section]);

  function startFresh(nextSection: CoachSection = section) {
    setSection(nextSection);
    setConversationId(null);
    setMessages([]);
    setInput("");
    setError("");
    setNotice("");
  }

  async function submit(question?: string) {
    const message = (question ?? input).trim();
    if (!message || sending) return;
    setError("");
    setNotice("");
    setInput("");
    setSending(true);
    const optimistic: Message = { id: `user-${Date.now()}`, role: "user", content: message };
    setMessages((current) => [...current, optimistic]);
    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, section, conversationId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Joye could not answer right now.");
      setConversationId(result.conversationId);
      if (result.usage) setUsage(result.usage);
      if (result.provider === "guided_fallback") {
        setNotice("AI enhancement was unavailable, so Joye used the safer guided planner instead.");
      } else if (result.provider === "guided_limit") {
        setNotice("Your AI-enhanced allowance is currently used up, so Joye answered with guided planning.");
      }
      setMessages((current) => [...current, {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: result.answer,
        provider: result.provider,
      }]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Joye could not answer right now.");
    } finally {
      setSending(false);
    }
  }

  const statusTitle = usage.enabled ? "AI-enhanced beta" : "Guided beta mode";
  const statusDetail = usage.enabled
    ? `${usage.remainingDaily} of ${usage.dailyLimit} AI replies left today`
    : "No paid AI requests";

  return <div className="mx-auto max-w-5xl space-y-5">
    <section className="card overflow-hidden border-blue-100">
      <div className="bg-gradient-to-br from-blue-700 to-blue-500 p-6 text-white sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-white/65">Ask Joye</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Guidance that uses the plan you already built.</h1>
            <p className="mt-3 max-w-2xl leading-7 text-white/75">
              Joye uses your saved goals, money, career, weekly plan, and memory. Guided mode handles supported planning topics honestly; AI enhancement answers broader natural-language questions when enabled.
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm">
            <span className="font-semibold">{statusTitle}</span><br/>
            <span className="text-white/65">{statusDetail}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto border-b border-blue-100 bg-white p-3 sm:px-6">
        {sections.map(({ value, label, icon: Icon }) => <button
          key={value}
          type="button"
          onClick={() => startFresh(value)}
          className={clsx("flex min-h-11 shrink-0 items-center gap-2 rounded-2xl px-4 text-sm font-semibold", section === value ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-800")}
        ><Icon size={16}/>{label}</button>)}
        <button type="button" onClick={() => startFresh()} className="ml-auto flex min-h-11 shrink-0 items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 text-sm font-semibold text-black/55"><RotateCcw size={15}/>Start fresh</button>
      </div>
      <div className="min-h-[360px] space-y-4 bg-[#f7f8fb] p-4 sm:p-6">
        {!messages.length ? <div className="grid min-h-[270px] place-items-center text-center">
          <div>
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-3xl bg-blue-600 text-white"><Sparkles size={22}/></span>
            <h2 className="mt-5 text-2xl font-semibold">What should we work through?</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-black/50">
              Guided mode is strongest for money, career, goals, weekly planning, fitness routines, nutrition structure, meal prep, home preparation, sleep routines, and today’s priorities. It will ask for missing details instead of attaching an unrelated goal.
            </p>
            <div className="mx-auto mt-5 flex max-w-2xl flex-wrap justify-center gap-2">
              {suggestions.map((suggestion) => <button key={suggestion} onClick={() => submit(suggestion)} className="rounded-2xl border border-blue-100 bg-white px-4 py-3 text-left text-sm font-semibold text-blue-800 shadow-sm">{suggestion}</button>)}
            </div>
          </div>
        </div> : messages.map((message) => <article
          key={message.id}
          className={clsx("max-w-[94%] whitespace-pre-wrap rounded-3xl px-4 py-3 text-sm leading-6 sm:max-w-[78%]", message.role === "user" ? "ml-auto bg-blue-600 text-white" : "bg-white text-black/70 shadow-sm")}
        >
          <p>{message.content}</p>
          {message.role === "assistant" && message.provider ? <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-black/35">
            {message.provider === "openai" ? "AI-enhanced" : message.provider === "guided_limit" ? "Guided after limit" : message.provider === "guided_fallback" ? "Guided fallback" : "Guided plan"}
          </p> : null}
        </article>)}
        {sending ? <div className="w-fit rounded-3xl bg-white px-4 py-3 text-sm text-black/45 shadow-sm">Joye is reviewing your plan…</div> : null}
      </div>
      <form ref={formRef} onSubmit={(event) => { event.preventDefault(); void submit(); }} className="border-t border-blue-100 bg-white p-3 sm:p-5">
        {error ? <p className="mb-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
        {notice ? <p className="mb-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{notice}</p> : null}
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void submit(); } }}
            className="input min-h-[52px] resize-none"
            rows={1}
            placeholder={`Ask Joye about ${section === "general" ? "your plan or routine" : section}…`}
            maxLength={1200}
          />
          <button type="submit" disabled={!input.trim() || sending} aria-label="Send question" className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-600 text-white disabled:opacity-40"><ArrowUp size={19}/></button>
        </div>
        <div className="mt-2 flex flex-col gap-1 text-xs text-black/35 sm:flex-row sm:items-center sm:justify-between">
          <p>Joye provides planning guidance. Review important financial, medical, nutrition, or legal decisions with an appropriate professional.</p>
          {usage.enabled ? <p className="shrink-0">{usage.monthlyUsed}/{usage.monthlyLimit} AI replies this month</p> : null}
        </div>
      </form>
    </section>
  </div>;
}
