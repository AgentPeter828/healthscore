// Email digest stub - generates HTML content for email digests
// Actual email sending would be handled by a cron job + email provider (e.g. Resend, SendGrid)

interface DigestData {
  orgName: string;
  totalAccounts: number;
  avgHealthScore: number;
  scoreChange: number; // vs previous period
  criticalAlerts: number;
  highAlerts: number;
  upcomingRenewals: number;
  atRiskMrr: number;
  topDrops: Array<{ name: string; score: number; change: number }>;
  topImprovements: Array<{ name: string; score: number; change: number }>;
}

export function generateDigest(data: DigestData): string {
  const scoreChangeText =
    data.scoreChange > 0
      ? `+${data.scoreChange} pts`
      : data.scoreChange < 0
      ? `${data.scoreChange} pts`
      : "no change";

  const scoreColor =
    data.avgHealthScore >= 70
      ? "#16a34a"
      : data.avgHealthScore >= 40
      ? "#ca8a04"
      : "#dc2626";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HealthScore Weekly Digest</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: white; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0;">
      <h1 style="font-size: 24px; margin: 0 0 4px 0; color: #0f172a;">
        Weekly Health Digest
      </h1>
      <p style="color: #64748b; font-size: 14px; margin: 0 0 24px 0;">
        ${data.orgName} &middot; ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
      </p>

      <!-- Score summary -->
      <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px; text-align: center;">
        <div style="font-size: 48px; font-weight: 700; color: ${scoreColor};">
          ${data.avgHealthScore}
        </div>
        <div style="font-size: 14px; color: #64748b;">
          Portfolio Health Score (${scoreChangeText})
        </div>
      </div>

      <!-- Key metrics -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
            <span style="color: #64748b; font-size: 13px;">Total Accounts</span><br>
            <strong style="font-size: 18px; color: #0f172a;">${data.totalAccounts}</strong>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
            <span style="color: #64748b; font-size: 13px;">Critical Alerts</span><br>
            <strong style="font-size: 18px; color: ${data.criticalAlerts > 0 ? "#dc2626" : "#0f172a"};">${data.criticalAlerts}</strong>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
            <span style="color: #64748b; font-size: 13px;">Upcoming Renewals</span><br>
            <strong style="font-size: 18px; color: #0f172a;">${data.upcomingRenewals}</strong>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
            <span style="color: #64748b; font-size: 13px;">At-Risk MRR</span><br>
            <strong style="font-size: 18px; color: ${data.atRiskMrr > 0 ? "#dc2626" : "#0f172a"};">$${data.atRiskMrr.toLocaleString()}</strong>
          </td>
        </tr>
      </table>

      ${
        data.topDrops.length > 0
          ? `
      <h3 style="font-size: 14px; color: #0f172a; margin: 0 0 8px 0;">Biggest Score Drops</h3>
      <ul style="margin: 0 0 24px 0; padding: 0; list-style: none;">
        ${data.topDrops
          .map(
            (d) =>
              `<li style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px;">
                <strong>${d.name}</strong>
                <span style="color: #dc2626; float: right;">${d.change} pts (now ${d.score})</span>
              </li>`
          )
          .join("")}
      </ul>`
          : ""
      }

      ${
        data.topImprovements.length > 0
          ? `
      <h3 style="font-size: 14px; color: #0f172a; margin: 0 0 8px 0;">Biggest Improvements</h3>
      <ul style="margin: 0 0 24px 0; padding: 0; list-style: none;">
        ${data.topImprovements
          .map(
            (d) =>
              `<li style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px;">
                <strong>${d.name}</strong>
                <span style="color: #16a34a; float: right;">+${d.change} pts (now ${d.score})</span>
              </li>`
          )
          .join("")}
      </ul>`
          : ""
      }

      <div style="text-align: center; margin-top: 24px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://app.healthscore.io"}/dashboard"
           style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 14px;">
          View Dashboard
        </a>
      </div>
    </div>

    <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 16px;">
      You're receiving this because you enabled weekly digests in HealthScore settings.
    </p>
  </div>
</body>
</html>`;
}
