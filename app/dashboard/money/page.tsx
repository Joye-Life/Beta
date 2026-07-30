import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/guards";
import { SectionGuidance } from "@/components/dashboard/SectionGuidance";
import { PaycheckAllocator } from "@/components/dashboard/PaycheckAllocator";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FlashMessage } from "@/components/ui/FlashMessage";

const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value || 0);

async function finishMoneyAction(error: { message: string } | null, success: string) {
  if (error) redirect(`/dashboard/money?error=${encodeURIComponent("That change could not be saved. Please try again.")}`);
  revalidatePath("/dashboard/money");
  revalidatePath("/dashboard");
  redirect(`/dashboard/money?saved=${encodeURIComponent(success)}`);
}

async function saveIncome(formData: FormData) {
  "use server";
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("income_profiles").upsert({
    user_id: user.id,
    gross_monthly_income: Number(formData.get("gross_monthly_income") || 0),
    typical_take_home: Number(formData.get("typical_take_home") || 0),
    pay_frequency: String(formData.get("pay_frequency") || "biweekly"),
    next_payday: String(formData.get("next_payday") || "") || null,
    updated_at: new Date().toISOString(),
  });
  await finishMoneyAction(error, "Income details saved.");
}

async function addBill(formData: FormData) {
  "use server";
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("recurring_bills").insert({
    user_id: user.id,
    name: String(formData.get("name") || "").trim(),
    amount: Number(formData.get("amount") || 0),
    due_date: String(formData.get("due_date") || "") || null,
    frequency: String(formData.get("frequency") || "monthly"),
    essential: formData.get("essential") === "on",
    autopay: formData.get("autopay") === "on",
  });
  await finishMoneyAction(error, "Bill added.");
}

async function addDebt(formData: FormData) {
  "use server";
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("debts").insert({
    user_id: user.id,
    name: String(formData.get("name") || "").trim(),
    debt_type: String(formData.get("debt_type") || "credit_card"),
    balance: Number(formData.get("balance") || 0),
    minimum_payment: Number(formData.get("minimum_payment") || 0),
    interest_rate: Number(formData.get("interest_rate") || 0),
    credit_limit: formData.get("credit_limit") ? Number(formData.get("credit_limit")) : null,
    due_date: String(formData.get("due_date") || "") || null,
  });
  await finishMoneyAction(error, "Debt account added.");
}

async function deleteItem(formData: FormData) {
  "use server";
  const user = await requireUser();
  const table = String(formData.get("table"));
  if (!["recurring_bills", "debts", "paycheck_plans"].includes(table)) redirect(`/dashboard/money?error=${encodeURIComponent("That item could not be removed.")}`);
  const supabase = await createClient();
  const { error } = await supabase.from(table).delete().eq("id", String(formData.get("id"))).eq("user_id", user.id);
  await finishMoneyAction(error, "Item removed.");
}

async function markPaid(formData: FormData) {
  "use server";
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("payment_records").upsert({
    user_id: user.id,
    source_type: String(formData.get("source_type")),
    source_id: String(formData.get("source_id")),
    name: String(formData.get("name")),
    amount: Number(formData.get("amount") || 0),
    due_date: String(formData.get("due_date")),
    paid_at: new Date().toISOString(),
  }, { onConflict: "user_id,source_type,source_id,due_date" });
  await finishMoneyAction(error, "Payment marked paid.");
}

async function undoPaid(formData: FormData) {
  "use server";
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("payment_records").delete().eq("id", String(formData.get("payment_id"))).eq("user_id", user.id);
  await finishMoneyAction(error, "Payment reopened.");
}

async function savePaycheckPlan(formData: FormData) {
  "use server";
  const user = await requireUser();
  const supabase = await createClient();
  let allocations: unknown[] = [];
  try { allocations = JSON.parse(String(formData.get("allocations") || "[]")); } catch {
    redirect(`/dashboard/money?error=${encodeURIComponent("The paycheck plan could not be read.")}`);
  }
  const { data, error } = await supabase.from("paycheck_plans").insert({
    user_id: user.id,
    paycheck_date: String(formData.get("paycheck_date")),
    paycheck_amount: Number(formData.get("paycheck_amount") || 0),
    allocations,
  }).select("id").single();
  if (error) redirect(`/dashboard/money?error=${encodeURIComponent("The paycheck plan could not be saved. Please try again.")}`);
  revalidatePath("/dashboard/money");
  revalidatePath("/dashboard");
  redirect(`/dashboard/money?saved=${encodeURIComponent("Paycheck plan saved.")}&plan=${data.id}`);
}

export default async function MoneyPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string; plan?: string }> }) {
  const params = await searchParams;
  const user = await requireUser();
  const supabase = await createClient();
  const [{ data: income }, { data: bills }, { data: debts }, { data: plans }, { data: payments }] = await Promise.all([
    supabase.from("income_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("recurring_bills").select("*").eq("user_id", user.id).order("due_date", { ascending: true, nullsFirst: false }),
    supabase.from("debts").select("*").eq("user_id", user.id).order("interest_rate", { ascending: false }),
    supabase.from("paycheck_plans").select("*").eq("user_id", user.id).order("paycheck_date", { ascending: false }).limit(6),
    supabase.from("payment_records").select("*").eq("user_id", user.id).order("paid_at", { ascending: false }).limit(12),
  ]);

  const monthlyBills = (bills || []).reduce((sum, bill) => sum + Number(bill.amount || 0) * (bill.frequency === "weekly" ? 4.333 : bill.frequency === "biweekly" ? 2.167 : bill.frequency === "yearly" ? 1 / 12 : 1), 0);
  const totalDebt = (debts || []).reduce((sum, debt) => sum + Number(debt.balance || 0), 0);
  const monthlyMinimums = (debts || []).reduce((sum, debt) => sum + Number(debt.minimum_payment || 0), 0);
  const grossMonthly = Number(income?.gross_monthly_income || 0);
  const dti = grossMonthly > 0 ? (monthlyMinimums / grossMonthly) * 100 : 0;
  const revolvingBalance = (debts || []).filter((d) => Number(d.credit_limit || 0) > 0).reduce((sum, d) => sum + Number(d.balance || 0), 0);
  const revolvingLimit = (debts || []).reduce((sum, d) => sum + Number(d.credit_limit || 0), 0);
  const utilization = revolvingLimit > 0 ? (revolvingBalance / revolvingLimit) * 100 : 0;
  const typicalTakeHome = Number(income?.typical_take_home || 0);
  const payPeriods = income?.pay_frequency === "weekly" ? 4.333 : income?.pay_frequency === "semimonthly" ? 2 : income?.pay_frequency === "monthly" ? 1 : 2.167;
  const billsPerCheck = payPeriods ? monthlyBills / payPeriods : 0;
  const debtPerCheck = payPeriods ? monthlyMinimums / payPeriods : 0;
  const highestApr = (debts || [])[0];
  const today = new Date(); today.setHours(12,0,0,0);
  const paidKeys = new Set((payments || []).map((payment) => `${payment.source_type}:${payment.source_id}:${payment.due_date}`));
  const guidance = totalDebt === 0
    ? "No debts are saved yet. Build your bill reserve and emergency buffer first."
    : dti >= 36
      ? `Your debt-to-income ratio is ${dti.toFixed(1)}%, so minimum payments are taking a meaningful share of gross income.`
      : `Your saved debt-to-income ratio is ${dti.toFixed(1)}%. Your highest-rate debt is ${highestApr?.name || "not yet identified"}.`;

  return <section className="mx-auto max-w-7xl pb-16">
    <p className="eyebrow">Money</p>
    <h1 className="mt-3 text-4xl font-semibold tracking-tight">Plan every paycheck to the dollar</h1>
    <p className="mt-3 max-w-3xl leading-7 text-black/55">See what is coming in, what must be paid, how much debt you carry, and where every paycheck should go.</p>
    <FlashMessage saved={params.saved} error={params.error} />

    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Monthly bills" value={money(monthlyBills)} detail={`${bills?.length || 0} recurring items`} />
      <Metric label="Total debt" value={money(totalDebt)} detail={`${debts?.length || 0} accounts`} />
      <Metric label="Debt-to-income" value={`${dti.toFixed(1)}%`} detail="Monthly debt payments compared with gross income" />
      <Metric label="Credit utilization" value={`${utilization.toFixed(1)}%`} detail={revolvingLimit ? `${money(revolvingBalance)} of ${money(revolvingLimit)}` : "Add credit limits to calculate"} />
    </div>

    <div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
      <div className="space-y-6">
        <form action={saveIncome} className="card border-blue-100 p-6">
          <p className="eyebrow">Income</p><h2 className="mt-2 text-2xl font-semibold">Tell Joye how you get paid</h2><p className="mt-2 text-sm leading-6 text-black/55">This helps Joye estimate how much to reserve from each paycheck.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Gross monthly income"><input className="input" type="number" step="0.01" min="0" name="gross_monthly_income" defaultValue={income?.gross_monthly_income || 0} /></Field>
            <Field label="Typical take-home per check"><input className="input" type="number" step="0.01" min="0" name="typical_take_home" defaultValue={typicalTakeHome} /></Field>
            <Field label="Pay frequency"><select className="input" name="pay_frequency" defaultValue={income?.pay_frequency || "biweekly"}><option value="weekly">Weekly</option><option value="biweekly">Every two weeks</option><option value="semimonthly">Twice monthly</option><option value="monthly">Monthly</option></select></Field>
            <Field label="Next payday"><input className="input" type="date" name="next_payday" defaultValue={income?.next_payday || ""} /></Field>
          </div>
          <SubmitButton className="button-primary mt-5" pendingText="Saving income...">Save income details</SubmitButton>
        </form>

        <PaycheckAllocator saveAction={savePaycheckPlan} typicalTakeHome={typicalTakeHome} nextPayday={income?.next_payday} payFrequency={income?.pay_frequency || "biweekly"} bills={(bills || []).map((bill) => ({ id: bill.id, name: bill.name, amount: Number(bill.amount), due_date: bill.due_date, frequency: bill.frequency }))} debts={(debts || []).map((debt) => ({ id: debt.id, name: debt.name, minimum_payment: Number(debt.minimum_payment), due_date: debt.due_date }))} />

        {params.plan && (() => {
          const plan = (plans || []).find((item) => item.id === params.plan);
          if (!plan) return null;
          const rows = Array.isArray(plan.allocations) ? plan.allocations : [];
          const allocated = rows.reduce((sum: number, row: { amount?: number }) => sum + Number(row.amount || 0), 0);
          return <div className="card border-emerald-200 bg-emerald-50/40 p-5 sm:p-6">
            <p className="eyebrow text-emerald-700">Saved paycheck plan</p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-2xl font-semibold">{new Date(`${plan.paycheck_date}T12:00:00`).toLocaleDateString()}</h2><p className="mt-1 text-sm text-black/55">{money(Number(plan.paycheck_amount))} paycheck · {money(allocated)} assigned</p></div><p className="text-xl font-semibold text-emerald-800">{money(Number(plan.paycheck_amount) - allocated)} left</p></div>
            <div className="mt-5 divide-y divide-black/5 rounded-2xl bg-white px-4">{rows.map((row: { label?: string; amount?: number; dueDate?: string }, index: number) => <div key={index} className="flex items-center justify-between gap-4 py-3"><div><p className="font-medium">{row.label || "Category"}</p>{row.dueDate && <p className="text-xs text-black/40">Due {new Date(`${row.dueDate}T12:00:00`).toLocaleDateString()}</p>}</div><p className="font-semibold">{money(Number(row.amount || 0))}</p></div>)}</div>
          </div>;
        })()}

        <div className="grid gap-6 lg:grid-cols-2">
          <form action={addBill} className="card border-blue-100 p-6">
            <p className="eyebrow">Regular bills</p><h2 className="mt-2 text-xl font-semibold">Add a bill you pay regularly</h2><p className="mt-2 text-sm leading-6 text-black/55">Examples include rent, phone, insurance, subscriptions, and utilities.</p>
            <div className="mt-5 grid gap-4">
              <Field label="Bill name"><input className="input" name="name" required placeholder="Rent, phone, insurance" /></Field>
              <div className="grid gap-4 sm:grid-cols-2"><Field label="Amount due"><input className="input" type="number" step="0.01" min="0" name="amount" required /></Field><Field label="Next due date"><input className="input" type="date" name="due_date" required /></Field></div>
              <Field label="Frequency"><select className="input" name="frequency"><option value="monthly">Monthly</option><option value="weekly">Weekly</option><option value="biweekly">Every two weeks</option><option value="yearly">Yearly</option></select></Field>
              <div className="flex gap-6 text-sm"><label><input type="checkbox" name="essential" defaultChecked /> Essential</label><label><input type="checkbox" name="autopay" /> Autopay</label></div>
            </div><SubmitButton className="button-primary mt-5" pendingText="Adding bill...">Add bill</SubmitButton>
          </form>

          <form action={addDebt} className="card border-blue-100 p-6">
            <p className="eyebrow">Debt</p><h2 className="mt-2 text-xl font-semibold">Add a debt you are paying off</h2><p className="mt-2 text-sm leading-6 text-black/55">Add credit cards, loans, or other balances so Joye can help prioritize them.</p>
            <div className="mt-5 grid gap-4">
              <Field label="Account name"><input className="input" name="name" required placeholder="Visa, student loan, car" /></Field>
              <Field label="Debt type"><select className="input" name="debt_type"><option value="credit_card">Credit card</option><option value="auto">Auto loan</option><option value="student">Student loan</option><option value="personal">Personal loan</option><option value="mortgage">Mortgage</option><option value="other">Other</option></select></Field>
              <div className="grid gap-4 sm:grid-cols-2"><Field label="Balance"><input className="input" type="number" step="0.01" min="0" name="balance" required /></Field><Field label="Minimum payment"><input className="input" type="number" step="0.01" min="0" name="minimum_payment" required /></Field></div>
              <div className="grid gap-4 sm:grid-cols-2"><Field label="Interest rate (APR %)"><input className="input" type="number" step="0.001" min="0" name="interest_rate" /></Field><Field label="Credit limit, if applicable"><input className="input" type="number" step="0.01" min="0" name="credit_limit" /></Field></div><Field label="Next payment due date"><input className="input" type="date" name="due_date" /></Field>
            </div><SubmitButton className="button-primary mt-5" pendingText="Adding debt...">Add debt account</SubmitButton>
          </form>
        </div>
      </div>

      <div className="space-y-6">
        <SectionGuidance title="Money Joye" summary={guidance} reasons={[
          `${money(monthlyBills)} in estimated monthly recurring bills.`,
          `${money(monthlyMinimums)} in monthly debt minimums.`,
          highestApr ? `${highestApr.name} has the highest saved APR at ${Number(highestApr.interest_rate || 0).toFixed(2)}%.` : "Add APRs so Joye can rank debt payoff options.",
        ]} nextStep={totalDebt > 0 ? `Fund all minimums, then direct extra debt money toward ${highestApr?.name || "the highest-rate balance"}.` : "Build a starter emergency buffer inside the next paycheck plan."} />

        <ListCard title="Regular bills" empty="No regular bills added yet.">{(bills || []).map((bill) => { const due = nextOccurrence(bill.due_date, bill.frequency, today); const paid = due ? paidKeys.has(`bill:${bill.id}:${dateISO(due)}`) : false; return <Item key={bill.id} title={bill.name} value={money(Number(bill.amount))} detail={`${formatDueDate(bill.due_date, bill.due_day)} · ${friendlyFrequency(bill.frequency)}${bill.autopay ? " · autopay" : ""}`} id={bill.id} table="recurring_bills" payment={due ? { sourceType: "bill", dueDate: dateISO(due), amount: Number(bill.amount), name: bill.name, paid } : undefined} />; })}</ListCard>
        <ListCard title="Debts" empty="No debts added yet.">{(debts || []).map((debt) => { const due = nextOccurrence(debt.due_date, "monthly", today); const paid = due ? paidKeys.has(`debt:${debt.id}:${dateISO(due)}`) : false; return <Item key={debt.id} title={debt.name} value={money(Number(debt.balance))} detail={`${money(Number(debt.minimum_payment))} minimum payment · ${Number(debt.interest_rate || 0).toFixed(2)}% APR${debt.due_date ? ` · due ${new Date(`${debt.due_date}T12:00:00`).toLocaleDateString()}` : ""}`} id={debt.id} table="debts" payment={due ? { sourceType: "debt", dueDate: dateISO(due), amount: Number(debt.minimum_payment), name: `${debt.name} minimum`, paid } : undefined} />; })}</ListCard>
        <ListCard title="Paid recently" empty="No payments marked paid yet.">{(payments || []).slice(0,6).map((payment) => <div key={payment.id} className="rounded-2xl border border-green-100 bg-green-50/50 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{payment.name}</p><p className="mt-1 text-xs text-black/45">{money(Number(payment.amount))} · paid {new Date(payment.paid_at).toLocaleDateString()}</p></div><form action={undoPaid}><input type="hidden" name="payment_id" value={payment.id}/><button className="text-xs font-semibold text-blue-700">Undo</button></form></div></div>)}</ListCard>
        <ListCard title="Recent paycheck plans" empty="No paycheck plans saved yet.">{(plans || []).map((plan) => { const allocated = Array.isArray(plan.allocations) ? plan.allocations.reduce((sum: number, row: { amount?: number }) => sum + Number(row.amount || 0), 0) : 0; return <Item key={plan.id} title={new Date(`${plan.paycheck_date}T12:00:00`).toLocaleDateString()} value={money(Number(plan.paycheck_amount))} detail={`${money(allocated)} allocated · ${money(Number(plan.paycheck_amount)-allocated)} remaining`} id={plan.id} table="paycheck_plans" />; })}</ListCard>
      </div>
    </div>
  </section>;
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) { return <div className="card border-blue-100 p-5"><p className="text-sm text-black/45">{label}</p><p className="mt-2 text-3xl font-semibold">{value}</p><p className="mt-2 text-xs leading-5 text-black/45">{detail}</p></div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div><label className="label">{label}</label>{children}</div>; }
function ListCard({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) { const list = Array.isArray(children) ? children : [children]; return <div className="card border-blue-100 p-6"><h2 className="text-xl font-semibold">{title}</h2><div className="mt-4 space-y-3">{list.filter(Boolean).length ? children : <p className="text-sm text-black/45">{empty}</p>}</div></div>; }
function Item({ title, value, detail, id, table, payment }: { title: string; value: string; detail: string; id: string; table: string; payment?: { sourceType: "bill" | "debt"; dueDate: string; amount: number; name: string; paid: boolean } }) {
  return <div className="rounded-2xl border border-black/8 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{title}</p><p className="mt-1 text-xs text-black/45">{detail}</p>{payment ? <form action={markPaid} className="mt-3"><input type="hidden" name="source_type" value={payment.sourceType}/><input type="hidden" name="source_id" value={id}/><input type="hidden" name="name" value={payment.name}/><input type="hidden" name="amount" value={payment.amount}/><input type="hidden" name="due_date" value={payment.dueDate}/><SubmitButton className={payment.paid ? "rounded-xl bg-green-50 px-3 py-2 text-xs font-semibold text-green-700" : "button-secondary text-xs"} pendingText="Saving...">{payment.paid ? "Paid" : "Mark next payment paid"}</SubmitButton></form> : null}</div><div className="text-right"><p className="font-semibold">{value}</p><form action={deleteItem} className="mt-2"><input type="hidden" name="id" value={id} /><input type="hidden" name="table" value={table} /><button className="text-xs text-red-600">Remove</button></form></div></div></div>;
}

function formatDueDate(dueDate?: string | null, dueDay?: number | null) { if (dueDate) return `Due ${new Date(`${dueDate}T12:00:00`).toLocaleDateString()}`; if (dueDay) return `Due on day ${dueDay}`; return "Due date not set"; }
function friendlyFrequency(value: string) { return value === "biweekly" ? "Every two weeks" : value.charAt(0).toUpperCase() + value.slice(1); }

function nextOccurrence(rawDate: string | null | undefined, frequency: string, onOrAfter: Date) { if (!rawDate) return null; const due = new Date(`${rawDate}T12:00:00`); while (due < onOrAfter) { if (frequency === "weekly") due.setDate(due.getDate()+7); else if (frequency === "biweekly") due.setDate(due.getDate()+14); else if (frequency === "yearly") due.setFullYear(due.getFullYear()+1); else due.setMonth(due.getMonth()+1); } return due; }
function dateISO(date: Date) { return date.toISOString().slice(0,10); }
