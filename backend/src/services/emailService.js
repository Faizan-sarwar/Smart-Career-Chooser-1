// backend/src/services/emailService.js
//
// Single place that knows how to send emails. Uses nodemailer with Gmail
// via App Password (free, instant setup). If SMTP isn't configured, falls
// back to logging the email to console — so dev still works without setup.

import nodemailer from 'nodemailer';

// ── Build the transporter once at startup ─────────────────────────
let transporter = null;
let transporterReady = false;

function buildTransporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.warn(
      '[emailService] SMTP_USER or SMTP_PASS not set — emails will be logged to console only.'
    );
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

function ensureTransporter() {
  if (transporterReady) return transporter;
  transporter = buildTransporter();
  transporterReady = true;
  return transporter;
}

// ── Public API ────────────────────────────────────────────────────

/**
 * Send a password reset email containing BOTH a reset link AND a 6-digit OTP.
 * The recipient can use either to reset their password.
 */
export async function sendPasswordResetEmail({ to, name, resetLink, otp }) {
  const subject = 'Reset your Smart Career Chooser password';
  const html = buildResetEmailHTML({ name, resetLink, otp });
  const text = buildResetEmailText({ name, resetLink, otp });

  return sendEmail({ to, subject, html, text });
}

/**
 * Low-level sender — logs to console if SMTP isn't configured.
 */
async function sendEmail({ to, subject, html, text }) {
  const t = ensureTransporter();
  const fromName = process.env.SMTP_FROM_NAME || 'Smart Career Chooser';
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@example.com';

  if (!t) {
    // Dev fallback: log to console so you can copy-paste the link/OTP
    console.log('═══════════════════════════════════════════════════');
    console.log('📧 [emailService] SMTP not configured. Email content:');
    console.log('  To:', to);
    console.log('  Subject:', subject);
    console.log('  Text body:\n', text);
    console.log('═══════════════════════════════════════════════════');
    return { mocked: true };
  }

  try {
    const info = await t.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html,
      text,
    });
    console.log(`[emailService] ✉ sent to ${to} (id: ${info.messageId})`);
    return { messageId: info.messageId };
  } catch (err) {
    console.error('[emailService] send failed:', err.message);
    throw err;
  }
}

// ── Templates ─────────────────────────────────────────────────────

function buildResetEmailHTML({ name, resetLink, otp }) {
  const firstName = (name || '').split(' ')[0] || 'there';
  // Brand colors: teal #0d9488 + coral #f97316, cream #fafaf9
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Reset your password</title>
</head>
<body style="margin:0;padding:0;background-color:#fafaf9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1c1917;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafaf9;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="540" cellpadding="0" cellspacing="0" style="max-width:540px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.06);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0d9488 0%,#0f766e 100%);padding:32px 40px;text-align:center;">
              <div style="display:inline-block;width:56px;height:56px;background:rgba(255,255,255,0.15);border-radius:14px;line-height:56px;font-size:28px;margin-bottom:8px;">🎓</div>
              <h1 style="margin:0;color:white;font-size:22px;font-weight:800;letter-spacing:-0.02em;">Smart Career Chooser</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 28px;">
              <h2 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#1c1917;letter-spacing:-0.02em;">Hi ${escapeHtml(firstName)},</h2>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#44403c;">
                We received a request to reset the password on your Smart Career Chooser account. Choose either method below — both work.
              </p>

              <!-- OTP Box -->
              <div style="background:#fafaf9;border:2px dashed #0d9488;border-radius:12px;padding:20px;margin:24px 0;text-align:center;">
                <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.12em;color:#0f766e;margin-bottom:8px;">Your 6-Digit Code</div>
                <div style="font-size:36px;font-weight:800;letter-spacing:0.4em;color:#0d9488;font-family:'Courier New',monospace;">${otp}</div>
                <div style="font-size:12px;color:#78716c;margin-top:8px;">Enter this on the password reset page</div>
              </div>

              <div style="text-align:center;margin:20px 0;color:#a8a29e;font-size:12px;font-weight:600;">— OR —</div>

              <!-- Reset Link Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="background:linear-gradient(135deg,#f97316 0%,#ea580c 100%);border-radius:10px;">
                    <a href="${resetLink}" style="display:inline-block;padding:14px 32px;color:white;font-weight:700;font-size:15px;text-decoration:none;border-radius:10px;">
                      Click to reset password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:28px 0 0;padding:14px 16px;background:#fef3c7;border-left:3px solid #eab308;border-radius:6px;font-size:13px;color:#713f12;">
                <strong>⏱ This expires in 15 minutes.</strong><br>
                If you didn't request a password reset, ignore this email — your password stays the same.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 28px;border-top:1px solid #e7e5e4;text-align:center;">
              <p style="margin:0 0 4px;font-size:12px;color:#78716c;">
                Smart Career Chooser · University of Gujrat
              </p>
              <p style="margin:0;font-size:11px;color:#a8a29e;">
                This is an automated message, please don't reply.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildResetEmailText({ name, resetLink, otp }) {
  const firstName = (name || '').split(' ')[0] || 'there';
  return `Hi ${firstName},

We received a request to reset your Smart Career Chooser password.

Use either of these:

OPTION 1 — Enter this 6-digit code on the reset page:
${otp}

OPTION 2 — Click this link:
${resetLink}

Both expire in 15 minutes.

If you didn't request a password reset, ignore this email — your password stays the same.

— Smart Career Chooser team
University of Gujrat`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}