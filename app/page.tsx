import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Dumbbell,
  Flag,
  ListChecks,
  Sparkles,
  Target,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { MarketingHeader } from "@/components/ui/MarketingHeader";

const features = [
  {
    icon: Sparkles,
    title: "A daily brief that knows your priorities",
    text: "Joye Life pulls together your goals, upcoming bills, career plans, and available time so you know what deserves attention today.",
  },
  {
    icon: WalletCards,
    title: "Plan every paycheck with confidence",
    text: "See what is due before your next check, assign money intentionally, track debt, and keep unassigned money visible.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Turn career goals into a clear path",
    text: "Start with a guided interview, then build a practical path around your target role, skill gaps, and weekly capacity.",
  },
  {
    icon: Target,
    title: "Goals that fit the person—not a template",
    text: "A savings goal, gym routine, career move, and personal project should not all use the same structure. Joye adapts the plan to the goal.",
  },
];

const steps = [
  "Apply for early access",
  "Tell Joye what you want to improve",
  "Get a personalized starting plan",
  "Check in, adjust, and keep moving",
];

function DashboardPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[720px]">
      <div className="absolute -left-10 top-20 h-48 w-48 rounded-full bg-joye-300/30 blur-3xl" />
      <div className="absolute -right-8 bottom-14 h-56 w-56 rounded-full bg-blue-200/40 blur-3xl" />

      <div className="relative overflow-hidden rounded-[2rem] border border-black/10 bg-[#f7f8fb] shadow-[0_35px_90px_rgba(30,64,175,.18)]">
        <div className="flex items-center justify-between border-b border-black/5 bg-white px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-red-300" />
            <div className="h-2.5 w-2.5 rounded-full bg-amber-300" />
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
          </div>
          <div className="rounded-full bg-mist px-4 py-1.5 text-[11px] font-medium text-black/45">app.joyelife</div>
          <div className="w-10" />
        </div>

        <div className="grid min-h-[500px] grid-cols-[68px_1fr] sm:grid-cols-[170px_1fr]">
          <aside className="border-r border-black/5 bg-white p-3 sm:p-4">
            <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-2xl bg-joye-600 font-bold text-white">J</div>
            <div className="space-y-2">
              {[
                [Sparkles, "Today"],
                [CircleDollarSign, "Money"],
                [BriefcaseBusiness, "Career"],
                [Target, "Goals"],
                [CalendarDays, "Weekly"],
              ].map(([Icon, label], index) => {
                const ItemIcon = Icon as typeof Sparkles;
                return (
                  <div
                    key={label as string}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold ${
                      index === 0 ? "bg-joye-50 text-joye-700" : "text-black/45"
                    }`}
                  >
                    <ItemIcon size={16} />
                    <span className="hidden sm:inline">{label as string}</span>
                  </div>
                );
              })}
            </div>
          </aside>

          <div className="p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-joye-600">Thursday, July 30</p>
                <h3 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">Good morning, Jordan.</h3>
                <p className="mt-1 text-xs text-black/45 sm:text-sm">Here is what needs your attention today.</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm">
                <BellRing size={15} />
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-gradient-to-br from-joye-600 to-blue-700 p-5 text-white shadow-lg shadow-blue-200/60">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[.2em] text-white/65">Your next move</span>
                <Sparkles size={16} />
              </div>
              <p className="mt-3 text-lg font-semibold sm:text-xl">Finish the 30-minute step toward your highest-priority goal.</p>
              <p className="mt-2 text-xs leading-5 text-white/70 sm:text-sm">It fits your available time and keeps your weekly plan moving without overloading your day.</p>
              <button className="mt-4 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-joye-700">Start focus session</button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold"><CreditCard size={15} /> Upcoming bills</div>
                  <span className="text-[10px] text-black/35">Next 7 days</span>
                </div>
                <div className="mt-3 space-y-2">
                  {[
                    ["Phone", "$92", "Tomorrow"],
                    ["Car insurance", "$148", "Aug 3"],
                  ].map(([name, amount, date]) => (
                    <div key={name} className="flex items-center justify-between rounded-xl bg-mist px-3 py-2.5">
                      <div>
                        <p className="text-xs font-semibold">{name}</p>
                        <p className="mt-0.5 text-[10px] text-black/40">{date}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold">{amount}</span>
                        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-black/10"><Check size={11} /></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold"><TrendingUp size={15} /> Weekly progress</div>
                  <span className="text-xs font-semibold text-joye-600">68%</span>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-mist">
                  <div className="h-full w-[68%] rounded-full bg-joye-600" />
                </div>
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><Check size={11} /></span>Review this paycheck</div>
                  <div className="flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-joye-50 text-joye-600"><Clock3 size={11} /></span>Complete one career action</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-8 -left-2 hidden w-52 rounded-2xl border border-black/5 bg-white p-4 shadow-xl sm:block">
        <div className="flex items-center gap-2 text-xs font-semibold"><Dumbbell size={15} className="text-joye-600" /> Goal check-in</div>
        <p className="mt-2 text-sm font-semibold">Gym routine</p>
        <p className="mt-1 text-xs text-black/45">2 of 3 visits this week</p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-mist"><div className="h-full w-2/3 rounded-full bg-joye-600" /></div>
      </div>

      <div className="absolute -right-4 top-16 hidden w-48 rounded-2xl border border-black/5 bg-white p-4 shadow-xl lg:block">
        <div className="flex items-center gap-2 text-xs font-semibold"><WalletCards size={15} className="text-joye-600" /> Paycheck plan</div>
        <p className="mt-3 text-2xl font-semibold">$346</p>
        <p className="text-xs text-black/40">Still available</p>
        <div className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">Bills due are covered</div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="overflow-hidden">
      <MarketingHeader />

      <section className="shell grid min-h-[78vh] items-center gap-14 pb-24 pt-10 lg:grid-cols-[.9fr_1.1fr] lg:pt-16">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-joye-200 bg-white px-3 py-1.5 text-xs font-semibold text-joye-700 shadow-sm">
            <Sparkles size={13} /> Built around your actual life
          </div>
          <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-[1.01] tracking-[-0.055em] sm:text-7xl">
            Know what to do next—without juggling five different apps.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-black/60">
            Joye Life brings your money, career, goals, and weekly priorities into one personalized daily plan that changes as your life changes.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/apply" className="button-primary gap-2">Apply for early access <ArrowRight size={16} /></Link>
            <a href="#preview" className="button-secondary">See how it works</a>
          </div>
          <div className="mt-7 grid max-w-xl gap-3 text-sm text-black/55 sm:grid-cols-2">
            {["Personalized setup", "Paycheck-by-paycheck planning", "Adaptive goals", "Guided career path"].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-joye-100 text-joye-700"><Check size={12} /></span>
                {item}
              </div>
            ))}
          </div>
        </div>

        <DashboardPreview />
      </section>

      <section id="preview" className="border-y border-black/5 bg-white py-24">
        <div className="shell">
          <div className="mx-auto max-w-3xl text-center">
            <p className="eyebrow">One place to run your life</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">A clearer view of what matters now.</h2>
            <p className="mt-5 text-lg leading-8 text-black/55">Every section works together. Update a bill, goal, or career plan and your Today page becomes more useful automatically.</p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-2">
            {features.map(({ icon: Icon, title, text }, index) => (
              <article key={title} className="card group overflow-hidden p-6 sm:p-8">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-joye-50 text-joye-700 transition group-hover:-translate-y-1">
                  <Icon size={20} />
                </div>
                <h3 className="mt-6 text-2xl font-semibold tracking-tight">{title}</h3>
                <p className="mt-3 max-w-xl leading-7 text-black/55">{text}</p>
                <div className="mt-7 rounded-2xl bg-mist p-4">
                  {index === 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-semibold"><ListChecks size={15} /> Today’s focus</div>
                      <div className="rounded-xl bg-white p-3 text-sm">Finish one meaningful step before adding anything else.</div>
                    </div>
                  )}
                  {index === 1 && (
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-xl bg-white p-3"><p className="text-xs text-black/40">Paycheck</p><p className="mt-1 font-semibold">$1,850</p></div>
                      <div className="rounded-xl bg-white p-3"><p className="text-xs text-black/40">Assigned</p><p className="mt-1 font-semibold">$1,504</p></div>
                      <div className="rounded-xl bg-joye-600 p-3 text-white"><p className="text-xs text-white/65">Available</p><p className="mt-1 font-semibold">$346</p></div>
                    </div>
                  )}
                  {index === 2 && (
                    <div className="flex items-center gap-3">
                      {["Build", "Prove", "Move"].map((phase, phaseIndex) => (
                        <div key={phase} className="flex flex-1 items-center gap-2">
                          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${phaseIndex === 0 ? "bg-joye-600 text-white" : "bg-white text-black/45"}`}>{phaseIndex + 1}</span>
                          <span className="text-xs font-semibold">{phase}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {index === 3 && (
                    <div className="flex items-center justify-between rounded-xl bg-white p-3">
                      <div><p className="text-sm font-semibold">Build a consistent gym routine</p><p className="mt-1 text-xs text-black/40">Track weekly consistency—not an arbitrary finish date.</p></div>
                      <Flag size={18} className="text-joye-600" />
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="shell py-24">
        <div className="grid gap-12 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
          <div>
            <p className="eyebrow">Designed to learn you first</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">You should not have to build your own system from scratch.</h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-black/55">Joye starts with a guided setup, asks questions that fit your situation, and creates a starting plan you can refine over time.</p>
            <Link href="/apply" className="button-primary mt-8 gap-2">Apply for the beta <ArrowRight size={16} /></Link>
          </div>

          <div className="card p-5 sm:p-8">
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div key={step} className="flex items-center gap-4 rounded-2xl border border-black/5 bg-mist p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-sm font-semibold text-joye-700 shadow-sm">{index + 1}</span>
                  <div>
                    <p className="font-semibold">{step}</p>
                    <p className="mt-1 text-sm text-black/45">
                      {index === 0 && "Tell us what you want help organizing."}
                      {index === 1 && "Complete a short, personalized setup."}
                      {index === 2 && "Joye turns your inputs into a practical starting point."}
                      {index === 3 && "Your plan improves as you use the app."}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="shell pb-24">
        <div className="overflow-hidden rounded-[2rem] bg-ink px-6 py-12 text-white sm:px-12 sm:py-16">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.2em] text-blue-300">Private beta</p>
              <h2 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Help shape a more useful way to plan your life.</h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-white/60">We are inviting a small group of early users who want clearer guidance around money, career, goals, and weekly planning.</p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link href="/apply" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:-translate-y-0.5">Apply for access <ArrowRight size={16} /></Link>
              <Link href="/login" className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">Member sign in</Link>
            </div>
          </div>
        </div>
      </section>
      <footer className="shell flex flex-col gap-4 border-t border-black/5 py-8 text-sm text-black/45 sm:flex-row sm:items-center sm:justify-between"><p>© 2026 Joye Life · Private beta</p><div className="flex gap-5"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/login">Member sign in</Link></div></footer>
    </main>
  );
}
