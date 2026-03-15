// Email integration via Resend
// Falls back to console.log when RESEND_API_KEY is not configured

const FROM_EMAIL = process.env.EMAIL_FROM || "HealthScore <noreply@healthscore.io>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://app.healthscore.io";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail(options: EmailOptions): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn(`[Email] RESEND_API_KEY not configured. Would send to ${options.to}: ${options.subject}`);
    return false;
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);

    await resend.emails.send({
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    return true;
  } catch (err) {
    console.error("[Email] Failed to send:", err);
    return false;
  }
}

function wrapHtml(body: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: white; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0;">
      ${body}
    </div>
    <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 16px;">
      Sent by <a href="${APP_URL}" style="color: #94a3b8;">HealthScore</a>
    </p>
  </div>
</body>
</html>`;
}

export async function sendAlertEmail(
  to: string,
  alertTitle: string,
  alertMessage: string,
  severity: string,
  accountName?: string
): Promise<boolean> {
  const severityColor =
    severity === "critical" ? "#dc2626" :
    severity === "high" ? "#f59e0b" :
    severity === "medium" ? "#3b82f6" : "#6b7280";

  return sendEmail({
    to,
    subject: `[${severity.toUpperCase()}] ${alertTitle}`,
    html: wrapHtml(`
      <div style="display: inline-block; background: ${severityColor}; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 16px;">
        ${severity}
      </div>
      <h2 style="margin: 0 0 8px 0; color: #0f172a; font-size: 20px;">${alertTitle}</h2>
      ${accountName ? `<p style="color: #64748b; margin: 0 0 16px 0;">Account: <strong>${accountName}</strong></p>` : ""}
      <p style="color: #334155; font-size: 14px; line-height: 1.6;">${alertMessage}</p>
      <div style="text-align: center; margin-top: 24px;">
        <a href="${APP_URL}/dashboard/alerts" style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 14px;">View Alerts</a>
      </div>
    `),
  });
}

export async function sendPlaybookNotification(
  to: string,
  playbookName: string,
  accountName: string,
  actionsSummary: string
): Promise<boolean> {
  return sendEmail({
    to,
    subject: `Playbook triggered: ${playbookName}`,
    html: wrapHtml(`
      <h2 style="margin: 0 0 8px 0; color: #0f172a; font-size: 20px;">Playbook Executed</h2>
      <p style="color: #64748b; margin: 0 0 16px 0;"><strong>${playbookName}</strong> was triggered for <strong>${accountName}</strong></p>
      <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
        <p style="margin: 0; color: #334155; font-size: 14px;">${actionsSummary}</p>
      </div>
      <div style="text-align: center; margin-top: 24px;">
        <a href="${APP_URL}/dashboard/playbooks" style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 14px;">View Playbooks</a>
      </div>
    `),
  });
}

export async function sendChurnWarningEmail(
  to: string,
  accountName: string,
  riskLevel: string,
  probability: number,
  factors: string[],
  recommendation: string
): Promise<boolean> {
  const riskColor = riskLevel === "critical" ? "#dc2626" : "#f59e0b";
  const factorsList = factors.map((f) => `<li style="margin-bottom: 4px;">${f}</li>`).join("");

  return sendEmail({
    to,
    subject: `Churn risk: ${accountName} (${riskLevel})`,
    html: wrapHtml(`
      <div style="display: inline-block; background: ${riskColor}; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 16px;">
        ${riskLevel} risk
      </div>
      <h2 style="margin: 0 0 8px 0; color: #0f172a; font-size: 20px;">${accountName}</h2>
      <p style="color: #64748b; margin: 0 0 16px 0;">Churn probability: <strong>${Math.round(probability * 100)}%</strong></p>
      <h3 style="font-size: 14px; margin: 0 0 8px 0; color: #0f172a;">Risk Factors</h3>
      <ul style="color: #334155; font-size: 14px; line-height: 1.6; padding-left: 20px; margin: 0 0 16px 0;">
        ${factorsList}
      </ul>
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
        <p style="margin: 0; color: #166534; font-size: 14px;"><strong>Recommendation:</strong> ${recommendation}</p>
      </div>
      <div style="text-align: center; margin-top: 24px;">
        <a href="${APP_URL}/dashboard" style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 14px;">View Dashboard</a>
      </div>
    `),
  });
}

export async function sendWelcomeEmail(
  to: string,
  userName: string,
  orgName: string
): Promise<boolean> {
  return sendEmail({
    to,
    subject: `Welcome to HealthScore, ${userName}!`,
    html: wrapHtml(`
      <h2 style="margin: 0 0 8px 0; color: #0f172a; font-size: 20px;">Welcome to HealthScore!</h2>
      <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
        Hi ${userName}, your organization <strong>${orgName}</strong> is all set up. Here's what to do next:
      </p>
      <ol style="color: #334155; font-size: 14px; line-height: 1.8; padding-left: 20px; margin: 0 0 16px 0;">
        <li>Connect your first integration (Stripe, Intercom, etc.)</li>
        <li>Import your customer accounts</li>
        <li>Configure your health score formula</li>
        <li>Set up automated playbooks</li>
      </ol>
      <div style="text-align: center; margin-top: 24px;">
        <a href="${APP_URL}/dashboard" style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 14px;">Go to Dashboard</a>
      </div>
    `),
  });
}

export async function sendUsageWarningEmail(
  to: string,
  orgName: string,
  resource: string,
  currentUsage: number,
  limit: number,
  planName: string
): Promise<boolean> {
  const percentage = Math.round((currentUsage / limit) * 100);

  return sendEmail({
    to,
    subject: `Usage alert: ${percentage}% of ${resource} limit reached`,
    html: wrapHtml(`
      <h2 style="margin: 0 0 8px 0; color: #0f172a; font-size: 20px;">Usage Limit Warning</h2>
      <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
        <strong>${orgName}</strong> has reached <strong>${percentage}%</strong> of its ${resource} limit on the ${planName} plan.
      </p>
      <div style="background: #fefce8; border: 1px solid #fde047; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
        <p style="margin: 0; color: #854d0e; font-size: 14px;">
          <strong>${currentUsage}</strong> of <strong>${limit}</strong> ${resource} used
        </p>
        <div style="background: #e2e8f0; border-radius: 4px; height: 8px; margin-top: 8px; overflow: hidden;">
          <div style="background: ${percentage >= 90 ? "#dc2626" : "#f59e0b"}; height: 100%; width: ${percentage}%; border-radius: 4px;"></div>
        </div>
      </div>
      <div style="text-align: center; margin-top: 24px;">
        <a href="${APP_URL}/dashboard/settings/billing" style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 14px;">Upgrade Plan</a>
      </div>
    `),
  });
}
