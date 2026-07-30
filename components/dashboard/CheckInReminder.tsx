"use client";
import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";

export function CheckInReminder({ intervalHours, lastCheckInAt, primaryFocus }: { intervalHours: number; lastCheckInAt: string | null; primaryFocus: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const last = lastCheckInAt ? new Date(lastCheckInAt).getTime() : 0;
    const due = Date.now() - last >= intervalHours * 3600000;
    if (!due) return;
    setShow(true);
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification("Joye Life check-in", { body: `Take a minute to review your focus: ${primaryFocus || "your current plan"}.` });
    }
  }, [intervalHours, lastCheckInAt, primaryFocus]);

  async function completeCheckIn() {
    await fetch("/api/check-in", { method: "POST" });
    setShow(false);
  }
  async function enableNotifications() {
    if (typeof Notification !== "undefined") await Notification.requestPermission();
  }
  if (!show) return null;
  return <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-blue-200 bg-blue-50 p-5 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-blue-600 text-white"><Bell size={18}/></span><div><p className="font-semibold">Time for a quick check-in</p><p className="mt-1 text-sm text-black/55">Review what changed and make sure today’s next move still fits.</p></div></div>
    <div className="flex gap-2"><button onClick={enableNotifications} className="button-secondary px-4 py-2">Enable alerts</button><button onClick={completeCheckIn} className="button-primary px-4 py-2">Check in now</button><button aria-label="Dismiss" onClick={()=>setShow(false)} className="rounded-xl p-2 text-black/40 hover:bg-white"><X size={18}/></button></div>
  </div>
}
