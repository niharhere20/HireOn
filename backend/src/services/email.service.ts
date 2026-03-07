import nodemailer from 'nodemailer';
import { config } from '../config';

function createTransport() {
    if (!config.smtpUser || !config.smtpPass) return null;
    return nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpPort === 465,
        auth: { user: config.smtpUser, pass: config.smtpPass },
    });
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

    return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0eeff; margin: 0; padding: 32px 0; }
  .wrap { max-width: 560px; margin: 0 auto; }
  .header { background: linear-gradient(135deg, #6c47ff, #ff6bc6); border-radius: 14px 14px 0 0; padding: 28px 32px; color: #fff; }
  .logo { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 4px; }
  .title { font-size: 18px; font-weight: 700; opacity: 0.95; }
  .body { background: #ffffff; padding: 32px; border-radius: 0 0 14px 14px; border: 1px solid rgba(108,71,255,0.1); border-top: none; }
  .greeting { font-size: 15px; color: #1a1040; margin-bottom: 16px; }
  .detail-box { background: #f8f5ff; border-radius: 10px; padding: 20px 24px; margin: 20px 0; border: 1px solid rgba(108,71,255,0.1); }
  .detail-row { display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid rgba(108,71,255,0.06); font-size: 13px; }
  .detail-row:last-child { border-bottom: none; }
  .detail-label { color: #9689bb; font-weight: 600; }
  .detail-value { color: #1a1040; font-weight: 600; text-align: right; }
  .meet-btn { display: block; text-align: center; background: linear-gradient(135deg, #6c47ff, #ff6bc6); color: #fff !important; text-decoration: none; border-radius: 10px; padding: 14px 28px; font-weight: 700; font-size: 15px; margin: 24px 0; }
  .footer { font-size: 12px; color: #9689bb; text-align: center; margin-top: 20px; }
</style></head>
<body>
<div class="wrap">
  <div class="header">
    <div class="logo">HireOn</div>
    <div class="title">Interview Scheduled</div>
  </div>
  <div class="body">
    <div class="greeting">Hi <strong>${recipientName}</strong>,</div>
    <p style="font-size:14px;color:#5a4e7a;line-height:1.6;margin-bottom:0">
      An interview has been scheduled on the HireOn platform. Here are the details:
    </p>
    <div class="detail-box">
      <div class="detail-row">
        <span class="detail-label">Candidate</span>
        <span class="detail-value">${data.candidateName}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Interviewer</span>
        <span class="detail-value">${data.interviewerName}</span>
      </div>
      ${data.requirementTitle ? `<div class="detail-row">
        <span class="detail-label">Position</span>
        <span class="detail-value">${data.requirementTitle}</span>
      </div>` : ''}
      <div class="detail-row">
        <span class="detail-label">Date & Time</span>
        <span class="detail-value">${dateStr}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Duration</span>
        <span class="detail-value">${durationMins} minutes</span>
      </div>
    </div>
    <a href="${data.meetLink}" class="meet-btn">Join Google Meet</a>
    <p style="font-size:13px;color:#9689bb;word-break:break-all">
      Or copy the link: <a href="${data.meetLink}" style="color:#6c47ff">${data.meetLink}</a>
    </p>
    <div class="footer">
      This email was sent by HireOn — Intelligent Hiring Platform<br>
      Please do not reply to this email.
    </div>
  </div>
</div>
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
        'An interview has been scheduled on HireOn.',
        '',
        `Candidate:   ${data.candidateName}`,
        `Interviewer: ${data.interviewerName}`,
        data.requirementTitle ? `Position:    ${data.requirementTitle}` : '',
        `Date & Time: ${dateStr}`,
        `Duration:    ${durationMins} minutes`,
        `Google Meet: ${data.meetLink}`,
        '',
        '— HireOn Team',
    ].filter((l) => l !== null).join('\n');
}

export async function sendInterviewScheduledEmails(data: InterviewEmailData) {
    const transport = createTransport();
    if (!transport) {
        console.warn('[email] SMTP not configured — skipping interview notifications');
        return;
    }

    const recipients = [
        { name: data.candidateName, email: data.candidateEmail, role: 'Candidate' },
        { name: data.interviewerName, email: data.interviewerEmail, role: 'Interviewer' },
        { name: data.hrName, email: data.hrEmail, role: 'HR' },
    ];

    for (const r of recipients) {
        try {
            await transport.sendMail({
                from: config.smtpFrom,
                to: r.email,
                subject: `Interview Scheduled — ${data.candidateName} on ${formatDate(data.startTime)}`,
                text: textEmail(r.name, data),
                html: htmlEmail(r.name, data),
            });
            console.log(`[email] Sent to ${r.role}: ${r.email}`);
        } catch (err) {
            console.error(`[email] Failed to send to ${r.email}:`, err);
        }
    }
}
