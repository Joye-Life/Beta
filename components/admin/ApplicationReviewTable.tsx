"use client";

import { useState } from "react";
import { Check, Clock3, Copy, Mail, X } from "lucide-react";
import type { BetaApplication } from "@/types/database";

type Application = BetaApplication & { reviewed_at?: string | null; invite_sent_at?: string | null };

export function ApplicationReviewTable({ initialApplications }: { initialApplications: Application[] }) {
  const [applications, setApplications] = useState(initialApplications);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [latestInvite, setLatestInvite] = useState("");

  async function review(id: string, action: "approve" | "reject" | "waitlist" | "resend") {
    setBusyId(id); setNotice(""); setLatestInvite("");
    const response = await fetch(`/api/admin/applications/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const result = await response.json();
    setBusyId(null);
    if (!response.ok) { setNotice(result.error || "The application could not be updated."); return; }
    setApplications((items) => items.map((item) => item.id === id ? { ...item, status: result.status } : item));
    if (result.inviteUrl) setLatestInvite(result.inviteUrl);
    setNotice(result.emailSent === false ? `${action === "resend" ? "New invite" : "Application approved"}. ${result.emailReason} Copy the secure link below.` : action === "reject" ? "Application rejected." : action === "waitlist" ? "Application moved to the waitlist." : "Invitation sent successfully.");
  }

  return <>
    {notice && <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">{notice}</div>}
    {latestInvite && <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-black/10 bg-white p-4 sm:flex-row sm:items-center"><code className="min-w-0 flex-1 break-all text-xs">{latestInvite}</code><button className="button-secondary" onClick={() => navigator.clipboard.writeText(latestInvite)}><Copy size={15}/> Copy invite</button></div>}
    <div className="card mt-8 overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-left text-sm">
      <thead className="bg-mist text-black/50"><tr><th className="p-4">Applicant</th><th className="p-4">What they need</th><th className="p-4">Usage</th><th className="p-4">Status</th><th className="p-4">Actions</th></tr></thead>
      <tbody>{applications.length ? applications.map((application) => <tr key={application.id} className="border-t border-black/5 align-top">
        <td className="p-4"><p className="font-semibold">{application.full_name}</p><a className="text-black/45 hover:text-black" href={`mailto:${application.email}`}>{application.email}</a><p className="mt-2 text-xs text-black/40">Applied {new Date(application.created_at).toLocaleDateString()}</p></td>
        <td className="max-w-sm p-4"><p className="font-medium">{application.primary_focus}</p><p className="mt-1 line-clamp-3 text-black/50">{application.biggest_challenge}</p></td>
        <td className="p-4">{application.expected_frequency}</td>
        <td className="p-4 capitalize"><span className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold">{application.status}</span></td>
        <td className="p-4"><div className="flex min-w-52 flex-wrap gap-2">
          {(application.status === "pending" || application.status === "approved" || application.status === "waitlisted") && <button disabled={busyId === application.id} className="button-primary !px-3 !py-2 text-xs" onClick={() => review(application.id,"approve")}><Check size={14}/> Approve</button>}
          {application.status === "invited" && <button disabled={busyId === application.id} className="button-secondary !px-3 !py-2 text-xs" onClick={() => review(application.id,"resend")}><Mail size={14}/> New invite</button>}
          {application.status !== "rejected" && <button disabled={busyId === application.id} className="button-secondary !px-3 !py-2 text-xs" onClick={() => review(application.id,"waitlist")}><Clock3 size={14}/> Waitlist</button>}
          {application.status !== "rejected" && <button disabled={busyId === application.id} className="button-secondary !px-3 !py-2 text-xs" onClick={() => review(application.id,"reject")}><X size={14}/> Reject</button>}
        </div></td>
      </tr>) : <tr><td className="p-8 text-center text-black/45" colSpan={5}>No beta applications have been submitted yet.</td></tr>}</tbody>
    </table></div></div>
  </>;
}
