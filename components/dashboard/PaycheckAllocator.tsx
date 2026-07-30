"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Plus, Sparkles, Trash2 } from "lucide-react";
import { SubmitButton } from "@/components/ui/SubmitButton";

type Allocation = { label: string; amount: number; source?: string; dueDate?: string };
type Bill = { id: string; name: string; amount: number; due_date?: string | null; frequency: string };
type Debt = { id: string; name: string; minimum_payment: number; due_date?: string | null };

type Props = {
  saveAction: (formData: FormData) => void | Promise<void>;
  typicalTakeHome: number;
  nextPayday?: string | null;
  payFrequency: string;
  bills: Bill[];
  debts: Debt[];
};

const formatMoney = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value || 0);
const iso = (date: Date) => date.toISOString().slice(0, 10);
const localDate = (value: string) => new Date(`${value}T12:00:00`);

function nextCheckDate(start: Date, frequency: string) {
  const next = new Date(start);
  if (frequency === "weekly") next.setDate(next.getDate() + 7);
  else if (frequency === "semimonthly") next.setDate(next.getDate() + 15);
  else if (frequency === "monthly") next.setMonth(next.getMonth() + 1);
  else next.setDate(next.getDate() + 14);
  return next;
}

function nextOccurrence(rawDate: string | null | undefined, frequency: string, onOrAfter: Date) {
  if (!rawDate) return null;
  const due = localDate(rawDate);
  while (due < onOrAfter) {
    if (frequency === "weekly") due.setDate(due.getDate() + 7);
    else if (frequency === "biweekly") due.setDate(due.getDate() + 14);
    else if (frequency === "yearly") due.setFullYear(due.getFullYear() + 1);
    else due.setMonth(due.getMonth() + 1);
  }
  return due;
}

export function PaycheckAllocator({ saveAction, typicalTakeHome, nextPayday, payFrequency, bills, debts }: Props) {
  const defaultDate = nextPayday || iso(new Date());
  const [paycheckDate, setPaycheckDate] = useState(defaultDate);
  const [amount, setAmount] = useState(typicalTakeHome || 0);
  const [rows, setRows] = useState<Allocation[]>([]);

  const allocated = useMemo(() => rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0), [rows]);
  const remaining = amount - allocated;

  function update(index: number, patch: Partial<Allocation>) {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function buildFromSavedItems() {
    const start = localDate(paycheckDate || iso(new Date()));
    const end = nextCheckDate(start, payFrequency);
    const generated: Allocation[] = [];

    bills.forEach((bill) => {
      const due = nextOccurrence(bill.due_date, bill.frequency, start);
      if (due && due < end) generated.push({ label: bill.name, amount: Number(bill.amount || 0), source: "bill", dueDate: iso(due) });
    });
    debts.forEach((debt) => {
      const due = nextOccurrence(debt.due_date, "monthly", start);
      if (due && due < end) generated.push({ label: `${debt.name} minimum`, amount: Number(debt.minimum_payment || 0), source: "debt", dueDate: iso(due) });
    });

    // Only add actual obligations to the plan. Any unassigned money stays
    // visible in the “Still available” total until the user chooses a job for it.
    setRows(generated);
  }

  return (
    <form action={saveAction} className="card border-blue-100 p-4 sm:p-6">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
        <div>
          <p className="eyebrow">Paycheck plan</p>
          <h2 className="mt-2 text-2xl font-semibold">Give this paycheck a job</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-black/55">Joye can pull in bills and minimum debt payments due before your next paycheck. Then you can decide what to do with the rest.</p>
        </div>
        <div className={`rounded-2xl px-4 py-3 ${Math.abs(remaining) < 0.01 ? "bg-emerald-50 text-emerald-800" : remaining < 0 ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-800"}`}>
          <p className="text-xs font-semibold uppercase tracking-[.14em] opacity-70">Still available</p>
          <p className="mt-1 text-2xl font-semibold">{formatMoney(remaining)}</p>
          <p className="mt-1 text-xs opacity-70">{remaining < 0 ? "This plan is over the paycheck amount." : Math.abs(remaining) < 0.01 ? "Every dollar is accounted for." : "Available for savings, spending, or another goal."}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div><label className="label">Paycheck date</label><input className="input" type="date" name="paycheck_date" value={paycheckDate} onChange={(e) => setPaycheckDate(e.target.value)} required /></div>
        <div><label className="label">Amount deposited</label><input className="input" type="number" step="0.01" min="0" name="paycheck_amount" value={amount} onChange={(e) => setAmount(Number(e.target.value))} required /></div>
      </div>

      <button type="button" onClick={buildFromSavedItems} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800 hover:bg-blue-100 sm:w-auto">
        <Sparkles size={16} /> Build from upcoming bills and debt
      </button>

      <input type="hidden" name="allocations" value={JSON.stringify(rows)} />
      <div className="mt-6 space-y-3">
        {!rows.length && <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/40 p-5 text-sm leading-6 text-blue-900/70">No bills or debt payments are due before the next paycheck. The full deposit remains under Still available until you add savings, spending, or another category.</div>}
        {rows.map((row, index) => (
          <div key={`${row.label}-${index}`} className="rounded-2xl border border-black/8 bg-white p-3 sm:grid sm:grid-cols-[1fr_180px_44px] sm:items-end sm:gap-3 sm:border-0 sm:p-0">
            <div>
              <label className="mb-1 block text-xs font-semibold text-black/45 sm:hidden">Category</label>
              <input className="input" value={row.label} onChange={(e) => update(index, { label: e.target.value })} aria-label="Budget category" />
              {row.dueDate && <p className="mt-1 flex items-center gap-1 text-xs text-black/40"><CalendarDays size={12}/> Due {localDate(row.dueDate).toLocaleDateString()}</p>}
            </div>
            <div className="mt-3 sm:mt-0"><label className="mb-1 block text-xs font-semibold text-black/45 sm:hidden">Amount</label><input className="input" type="number" step="0.01" min="0" value={row.amount} onChange={(e) => update(index, { amount: Number(e.target.value) })} aria-label={`${row.label} amount`} /></div>
            <button type="button" className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-red-100 px-3 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 sm:mt-0 sm:h-[46px] sm:w-11 sm:px-0" onClick={() => setRows((current) => current.filter((_, i) => i !== index))}><Trash2 size={16}/><span className="sm:hidden">Remove</span></button>
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-3 sm:flex sm:flex-wrap">
        <button type="button" className="button-secondary flex items-center justify-center gap-2" onClick={() => setRows((current) => [...current, { label: "New category", amount: 0 }])}><Plus size={16}/> Add category</button>
        <SubmitButton pendingText="Saving paycheck plan...">Save and show this plan</SubmitButton>
      </div>
    </form>
  );
}
