type InviteEmail = {
  to: string;
  name: string;
  inviteUrl: string;
};

export async function sendInviteEmail({ to, name, inviteUrl }: InviteEmail) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    return { sent: false, reason: "Email delivery is not configured." } as const;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "You’re invited to Joye Life",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#111827;line-height:1.6">
          <p style="font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#2563eb">Joye Life Early Access</p>
          <h1 style="font-size:30px;line-height:1.2">You’re in, ${escapeHtml(name)}.</h1>
          <p>Your application was approved. Use the secure button below to create your Joye Life account and begin your personal setup.</p>
          <p style="margin:28px 0"><a href="${inviteUrl}" style="display:inline-block;background:#2563eb;color:white;text-decoration:none;padding:14px 20px;border-radius:12px;font-weight:700">Create my account</a></p>
          <p style="font-size:13px;color:#6b7280">This invitation expires in 7 days and can only be used once.</p>
        </div>`,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Resend error ${response.status}: ${detail}`);
  }

  return { sent: true } as const;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#039;",
    '"': "&quot;",
  })[character] || character);
}
