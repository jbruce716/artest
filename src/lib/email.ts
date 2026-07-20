import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST || "mail.privateemail.com";
const smtpPort = parseInt(process.env.SMTP_PORT || "465");
const smtpUser = process.env.SMTP_USER || "";
const smtpPass = process.env.SMTP_PASS || "";
const fromName = process.env.SMTP_FROM_NAME || "ARTest";
const fromEmail = process.env.SMTP_FROM_EMAIL || smtpUser;

function getTransporter() {
  if (!smtpUser || !smtpPass) {
    throw new Error("SMTP credentials not configured");
  }
  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  });
}

export async function sendTestResultEmail(params: {
  studentName: string;
  bookTitle: string;
  score: number;
  total: number;
  percentage: number;
  completedAt: Date;
}) {
  const { studentName, bookTitle, score, total, percentage, completedAt } = params;
  const parentEmails = process.env.PARENT_EMAILS || "";
  if (!parentEmails) return;

  const dateStr = completedAt.toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const emoji = percentage >= 80 ? "🎉" : percentage >= 60 ? "👍" : percentage >= 40 ? "📚" : "💪";
  const message =
    percentage >= 80 ? "Excellent reading!" :
    percentage >= 60 ? "Good job!" :
    percentage >= 40 ? "Keep reading!" :
    "Try again — you've got this!";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0f; color: #e8e6e3; margin: 0; padding: 40px 20px; }
    .container { max-width: 500px; margin: 0 auto; background: #121218; border: 1px solid #2a2a35; border-radius: 16px; padding: 40px; }
    .logo { font-size: 24px; font-weight: 700; margin-bottom: 30px; }
    .logo span { color: #f97316; }
    h1 { font-size: 22px; margin: 0 0 16px; }
    p { color: #8a8580; line-height: 1.6; font-size: 15px; }
    .score-box { background: #1a1a22; border: 1px solid #2a2a35; border-radius: 12px; padding: 24px; margin: 20px 0; text-align: center; }
    .score-big { font-size: 48px; font-weight: 700; color: #f97316; }
    .score-sub { color: #8a8580; margin-top: 8px; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #2a2a35; }
    .detail-label { color: #6a6560; font-size: 14px; }
    .detail-value { color: #e8e6e3; font-size: 14px; }
    .footer { margin-top: 30px; font-size: 13px; color: #6a6560; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">AR<span>Test</span></div>
    <p>${emoji} ${studentName} just completed a reading test.</p>
    <div class="score-box">
      <div class="score-big">${score}/${total}</div>
      <div class="score-sub">${percentage}% — ${message}</div>
    </div>
    <div class="detail-row">
      <span class="detail-label">Book</span>
      <span class="detail-value">${bookTitle}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Student</span>
      <span class="detail-value">${studentName}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Score</span>
      <span class="detail-value">${score}/${total} (${percentage}%)</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Completed</span>
      <span class="detail-value">${dateStr}</span>
    </div>
    <div class="footer">
      ARTest — Reading comprehension for kids<br>
      <a href="https://artest.brucehome.dev" style="color: #f97316;">View results</a>
    </div>
  </div>
</body>
</html>`;

  const text = `${studentName} just completed a reading test.\n\nBook: ${bookTitle}\nScore: ${score}/${total} (${percentage}%)\nDate: ${dateStr}\n\nView results: https://artest.brucehome.dev/admin`;

  const transporter = getTransporter();
  const result = await transporter.sendMail({
    from: `${fromName} <${fromEmail}>`,
    to: parentEmails,
    subject: `[ARTest] ${studentName}: ${score}/${total} on "${bookTitle}"`,
    html,
    text,
  });

  console.log("[ARTest] Email sent:", result.messageId);
  return result;
}