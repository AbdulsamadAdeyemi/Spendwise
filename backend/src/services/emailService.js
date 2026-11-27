/**
 * Email delivery service supporting Resend, standard API providers, or development fallback.
 */

export const emailService = {
  async sendPasswordResetEmail({ to, firstName, resetUrl }) {
    const apiKey = process.env.RESEND_API_KEY || process.env.EMAIL_API_KEY;
    const from = process.env.EMAIL_FROM || "SpendWise <onboarding@resend.dev>";
    const name = firstName || "there";

    const subject = "Reset your SpendWise password";
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #efe6d8; margin: 0; padding: 40px 20px; color: #241c16; }
            .card { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid rgba(36,28,22,0.1); padding: 36px 32px; box-shadow: 0 8px 30px rgba(36,28,22,0.06); }
            .brand { font-size: 26px; font-weight: 800; color: #241c16; margin-bottom: 24px; }
            .brand span { color: #c56a2d; }
            h1 { font-size: 20px; font-weight: 700; margin: 0 0 16px; color: #241c16; }
            p { font-size: 15px; line-height: 1.6; color: rgba(36,28,22,0.8); margin: 0 0 20px; }
            .btn { display: inline-block; background-color: #c56a2d; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 28px; border-radius: 10px; margin: 12px 0 24px; }
            .footer { font-size: 13px; color: rgba(36,28,22,0.55); border-top: 1px solid rgba(36,28,22,0.1); padding-top: 20px; margin-top: 20px; }
            .url { word-break: break-all; font-size: 13px; color: #c56a2d; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="brand">Spend<span>Wise</span></div>
            <h1>Password Reset Request</h1>
            <p>Hi ${name},</p>
            <p>We received a request to reset the password for your SpendWise account. Click the button below to choose a new password:</p>
            <a href="${resetUrl}" class="btn" target="_blank">Reset Password</a>
            <p>This password reset link is valid for <strong>15 minutes</strong> and can only be used once.</p>
            <p>If you did not make this request, you can safely ignore this email. Your password will remain unchanged.</p>
            <div class="footer">
              <p>Button not working? Copy and paste this URL into your browser:</p>
              <p class="url">${resetUrl}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `Hi ${name},\n\nWe received a request to reset your SpendWise password.\nClick the link below to choose a new password:\n${resetUrl}\n\nThis link is valid for 15 minutes and can only be used once.\nIf you did not request this, please ignore this email.\n`;

    // 1. If an email API key is configured (Resend / API Provider), send live email
    if (apiKey) {
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            from,
            to: [to],
            subject,
            html,
            text,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          console.error("[Email Service] Resend API error:", data);
          throw new Error(data.message || "Email delivery failed");
        }

        return { success: true, id: data.id };
      } catch (err) {
        console.error("[Email Service] Failed to send email via Resend:", err.message);
        throw err;
      }
    }

    // Never expose password-reset tokens in production logs.
    if (process.env.NODE_ENV === "production") {
      const error = new Error("Password reset email delivery is not configured.");
      error.status = 503;
      throw error;
    }

    // 2. Development-only fallback: log reset links locally for testing.
    console.log("\n=======================================================");
    console.log("[Email Service] DEV FALLBACK (No EMAIL_API_KEY configured)");
    console.log(`To: ${to}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log("=======================================================\n");

    return { success: true, devMode: true };
  },
};
