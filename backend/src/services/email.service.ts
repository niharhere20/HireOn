import { config } from '../config';

async function sendBrevo(opts: {
    to: string;
    toName: string;
    subject: string;
    html: string;
    text?: string;
}) {
    if (!config.brevoApiKey) {
        console.warn('[email] BREVO_API_KEY not set — skipping email');
        return;
    }
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'api-key': config.brevoApiKey,
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            sender: { name: config.emailFromName, email: config.emailFrom },
            to: [{ email: opts.to, name: opts.toName }],
            subject: opts.subject,
            htmlContent: opts.html,
            textContent: opts.text,
        }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`Brevo error ${res.status}: ${(err as any).message ?? res.statusText}`);
    }
    const result = await res.json();
    console.log(`[email] Sent to ${opts.to} — messageId: ${(result as any).messageId}`);
}

export interface InterviewEmailData {
    candidateName: string;
    candidateEmail: string;
    interviewerName: string;
    interviewerEmail: string;
    hrName: string;
    hrEmail: string;
    startTime: Date;
    endTime: Date;
    meetLink: string;
    requirementTitle?: string;
}

function formatDate(d: Date) {
    return d.toLocaleString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long',
        day: 'numeric', hour: '2-digit', minute: '2-digit',
        timeZoneName: 'short',
    });
}

function htmlEmail(recipientName: string, data: InterviewEmailData) {
    const dateStr = formatDate(data.startTime);
    const durationMins = Math.round(
        (data.endTime.getTime() - data.startTime.getTime()) / 60000
    );

    const detailRow = (label: string, value: string) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid rgba(108,71,255,0.07);width:38%;vertical-align:middle;">
          <span style="font-size:12px;font-weight:700;color:#9689bb;text-transform:uppercase;letter-spacing:0.6px;">${label}</span>
        </td>
        <td style="padding:10px 0 10px 16px;border-bottom:1px solid rgba(108,71,255,0.07);vertical-align:middle;">
          <span style="font-size:13px;font-weight:600;color:#1a1040;">${value}</span>
        </td>
      </tr>`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Interview Scheduled — Hireon</title>
</head>
<body style="margin:0;padding:0;background:#f0eeff;font-family:'Segoe UI',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- HEADER -->
        <tr>
          <td style="background:linear-gradient(135deg,#6c47ff,#ff6bc6);border-radius:16px 16px 0 0;padding:28px 36px;">
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td>
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="width:36px;height:36px;background:rgba(255,255,255,0.22);border-radius:10px;text-align:center;vertical-align:middle;">
                        <span style="font-size:18px;font-weight:900;color:#fff;line-height:36px;display:block;">H</span>
                      </td>
                      <td style="padding-left:10px;vertical-align:middle;">
                        <span style="font-size:22px;font-weight:900;color:#fff;letter-spacing:-0.5px;">Hireon</span>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:12px 0 0;font-size:15px;font-weight:600;color:rgba(255,255,255,0.92);">Interview Scheduled</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="background:#ffffff;padding:36px 36px 28px;border:1px solid rgba(108,71,255,0.10);border-top:none;border-radius:0 0 16px 16px;">

            <p style="margin:0 0 6px;font-size:15px;color:#1a1040;">Hi <strong>${recipientName}</strong>,</p>
            <p style="margin:0 0 24px;font-size:14px;color:#5a4e7a;line-height:1.65;">
              An interview has been scheduled on the Hireon platform. Here are the details:
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f5ff;border-radius:12px;border:1px solid rgba(108,71,255,0.10);padding:4px 20px;border-spacing:0;">
              <tr><td style="padding:0 4px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  ${detailRow('Candidate', data.candidateName)}
                  ${detailRow('Interviewer', data.interviewerName)}
                  ${data.requirementTitle ? detailRow('Position', data.requirementTitle) : ''}
                  ${detailRow('Date &amp; Time', dateStr)}
                  <tr>
                    <td style="padding:10px 0;width:38%;vertical-align:middle;">
                      <span style="font-size:12px;font-weight:700;color:#9689bb;text-transform:uppercase;letter-spacing:0.6px;">Duration</span>
                    </td>
                    <td style="padding:10px 0 10px 16px;vertical-align:middle;">
                      <span style="font-size:13px;font-weight:600;color:#1a1040;">${durationMins} minutes</span>
                    </td>
                  </tr>
                </table>
              </td></tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 18px;">
              <tr>
                <td align="center">
                  <a href="${data.meetLink}" style="display:inline-block;background:linear-gradient(135deg,#6c47ff,#ff6bc6);color:#fff;text-decoration:none;border-radius:10px;padding:14px 40px;font-size:15px;font-weight:700;letter-spacing:0.2px;">
                    Join Google Meet ↗
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 24px;font-size:12px;color:#9689bb;word-break:break-all;text-align:center;">
              Or copy the link: <a href="${data.meetLink}" style="color:#6c47ff;text-decoration:none;">${data.meetLink}</a>
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid rgba(108,71,255,0.08);padding-top:20px;">
              <tr>
                <td align="center">
                  <p style="margin:0;font-size:12px;color:#b0a4cc;">
                    This email was sent by <strong style="color:#6c47ff;">Hireon</strong> — AI-powered hiring platform<br>
                    Please do not reply to this email.
                  </p>
                </td>
              </tr>
            </table>

          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body></html>`;
}

function textEmail(recipientName: string, data: InterviewEmailData) {
    const dateStr = formatDate(data.startTime);
    const durationMins = Math.round(
        (data.endTime.getTime() - data.startTime.getTime()) / 60000
    );
    return [
        `Hi ${recipientName},`,
        '',
        'An interview has been scheduled on Hireon.',
        '',
        `Candidate:   ${data.candidateName}`,
        `Interviewer: ${data.interviewerName}`,
        data.requirementTitle ? `Position:    ${data.requirementTitle}` : null,
        `Date & Time: ${dateStr}`,
        `Duration:    ${durationMins} minutes`,
        `Google Meet: ${data.meetLink}`,
        '',
        '— Hireon Team',
    ].filter(Boolean).join('\n');
}

export async function sendPasswordResetCode(toEmail: string, code: string, userName: string) {
    await sendBrevo({
        to: toEmail,
        toName: userName,
        subject: 'Your Hireon Password Reset Code',
        html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Password Reset — Hireon</title>
</head>
<body style="margin:0;padding:0;background:#0f0e1a;font-family:'Segoe UI',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#1a1930;border-radius:16px;border:1px solid rgba(108,71,255,0.2);">

        <!-- HEADER -->
        <tr>
          <td style="background:linear-gradient(135deg,#6c47ff,#ff6bc6);border-radius:16px 16px 0 0;padding:28px 32px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:36px;height:36px;background:rgba(255,255,255,0.22);border-radius:10px;text-align:center;vertical-align:middle;">
                  <span style="font-size:18px;font-weight:900;color:#fff;line-height:36px;display:block;">H</span>
                </td>
                <td style="padding-left:10px;vertical-align:middle;">
                  <span style="font-size:22px;font-weight:900;color:#fff;letter-spacing:-0.5px;">Hireon</span>
                </td>
              </tr>
            </table>
            <p style="margin:10px 0 0;font-size:14px;font-weight:600;color:rgba(255,255,255,0.85);">Password Reset</p>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="padding:36px 32px;">
            <p style="color:#c9c6e0;font-size:15px;margin:0 0 16px;">Hi <strong style="color:#fff;">${userName}</strong>,</p>
            <p style="color:#c9c6e0;font-size:14px;margin:0 0 28px;line-height:1.65;">
              We received a request to reset your Hireon password. Use the verification code below — it expires in <strong style="color:#fff;">15 minutes</strong>.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(108,71,255,0.12);border:2px solid rgba(108,71,255,0.35);border-radius:14px;margin:0 0 28px;">
              <tr>
                <td style="padding:28px;text-align:center;">
                  <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#9490c0;text-transform:uppercase;letter-spacing:2px;">Your Reset Code</p>
                  <p style="margin:0;font-size:44px;font-weight:900;letter-spacing:14px;color:#fff;font-family:'Courier New',monospace;">${code}</p>
                </td>
              </tr>
            </table>

            <p style="color:#9490c0;font-size:12px;margin:0;line-height:1.65;">
              If you didn't request this, you can safely ignore this email — your password won't change.
            </p>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="padding:18px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
            <p style="color:#4a4860;font-size:12px;margin:0;">© 2026 <strong style="color:#7c5cff;">Hireon</strong> · AI-powered hiring platform</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body></html>`,
    });
}

export async function sendInterviewScheduledEmails(data: InterviewEmailData) {
    const recipients = [
        { name: data.candidateName, email: data.candidateEmail, role: 'Candidate' },
        { name: data.interviewerName, email: data.interviewerEmail, role: 'Interviewer' },
        { name: data.hrName, email: data.hrEmail, role: 'HR' },
    ];

    for (const r of recipients) {
        try {
            await sendBrevo({
                to: r.email,
                toName: r.name,
                subject: `Interview Scheduled — ${data.candidateName} on ${formatDate(data.startTime)}`,
                text: textEmail(r.name, data),
                html: htmlEmail(r.name, data),
            });
        } catch (err) {
            console.error(`[email] Failed to send to ${r.role} (${r.email}):`, err);
        }
    }
}
