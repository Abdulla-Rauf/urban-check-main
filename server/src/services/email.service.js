import nodemailer from 'nodemailer';
import { config } from '../config/index.js';

export class EmailService {
  /**
   * Initializes nodemailer transporter if credentials exist
   */
  static getTransporter() {
    if (config.email.user && config.email.pass) {
      return nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.port === 465,
        auth: {
          user: config.email.user,
          pass: config.email.pass,
        },
      });
    }
    return null;
  }

  /**
   * Dispatches email verification link
   */
  static async sendVerificationEmail({ email, name, token }) {
    const clientBaseUrl = config.cors.clientUrl;
    const verifyUrl = `${clientBaseUrl}/login?verifyToken=${token}`;

    const subject = 'Activate Your Urban Check Atelier Account';
    const html = `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #F5F5F3; padding: 40px 20px; color: #111111;">
        <div style="max-width: 580px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #E5E5E0; padding: 40px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="font-size: 22px; letter-spacing: 4px; text-transform: uppercase; color: #111111; margin: 0;">URBAN CHECK</h1>
            <p style="font-size: 11px; letter-spacing: 2px; color: #2F6F68; text-transform: uppercase; margin-top: 5px;">Atelier Membership Verification</p>
          </div>
          <p style="font-size: 14px; line-height: 1.6; color: #333333;">Dear ${name || 'Patron'},</p>
          <p style="font-size: 14px; line-height: 1.6; color: #666666;">
            Welcome to Urban Check. To activate your bespoke privileges, order concierge timeline, and secure client profile, please verify your email address.
          </p>
          <div style="text-align: center; margin: 35px 0;">
            <a href="${verifyUrl}" style="background-color: #111111; color: #FFFFFF; padding: 14px 32px; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; text-decoration: none; font-weight: 600; display: inline-block;">
              Activate Atelier Account
            </a>
          </div>
          <p style="font-size: 12px; color: #999999; line-height: 1.5;">
            Or copy and paste this link into your browser:<br/>
            <a href="${verifyUrl}" style="color: #2F6F68; word-break: break-all;">${verifyUrl}</a>
          </p>
          <p style="font-size: 11px; color: #AAAAAA; border-top: 1px solid #EEEEEE; padding-top: 20px; margin-top: 30px;">
            This activation link expires in 24 hours. If you did not initiate this request, you may safely disregard this message.
          </p>
        </div>
      </div>
    `;

    return this.dispatchEmail({ to: email, subject, html, simulationPayload: { type: 'VERIFICATION', verifyUrl, token } });
  }

  /**
   * Dispatches password reset link
   */
  static async sendPasswordResetEmail({ email, name, token }) {
    const clientBaseUrl = config.cors.clientUrl;
    const resetUrl = `${clientBaseUrl}/forgot-password?resetToken=${token}`;

    const subject = 'Password Reset Request — Urban Check';
    const html = `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #F5F5F3; padding: 40px 20px; color: #111111;">
        <div style="max-width: 580px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #E5E5E0; padding: 40px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="font-size: 22px; letter-spacing: 4px; text-transform: uppercase; color: #111111; margin: 0;">URBAN CHECK</h1>
            <p style="font-size: 11px; letter-spacing: 2px; color: #2F6F68; text-transform: uppercase; margin-top: 5px;">Security Credential Reset</p>
          </div>
          <p style="font-size: 14px; line-height: 1.6; color: #333333;">Dear ${name || 'Patron'},</p>
          <p style="font-size: 14px; line-height: 1.6; color: #666666;">
            We received a request to reset your password. Click the link below to establish a new password for your account.
          </p>
          <div style="text-align: center; margin: 35px 0;">
            <a href="${resetUrl}" style="background-color: #2F6F68; color: #FFFFFF; padding: 14px 32px; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; text-decoration: none; font-weight: 600; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="font-size: 12px; color: #999999; line-height: 1.5;">
            Or copy and paste this link into your browser:<br/>
            <a href="${resetUrl}" style="color: #2F6F68; word-break: break-all;">${resetUrl}</a>
          </p>
          <p style="font-size: 11px; color: #AAAAAA; border-top: 1px solid #EEEEEE; padding-top: 20px; margin-top: 30px;">
            This reset link is valid for 1 hour. If you did not request a password change, please disregard this notice.
          </p>
        </div>
      </div>
    `;

    return this.dispatchEmail({ to: email, subject, html, simulationPayload: { type: 'PASSWORD_RESET', resetUrl, token } });
  }

  /**
   * Internal dispatcher handling both live SMTP and dev logging
   */
  static async dispatchEmail({ to, subject, html, simulationPayload }) {
    const transporter = this.getTransporter();

    if (transporter) {
      try {
        const info = await transporter.sendMail({
          from: config.email.from,
          to,
          subject,
          html,
        });
        console.log(`✉️ Email dispatched via SMTP to ${to} [MessageId: ${info.messageId}]`);
        return { success: true, messageId: info.messageId };
      } catch (err) {
        console.warn(`⚠️ SMTP delivery failed to ${to}: ${err.message}. Falling back to dev logger.`);
      }
    }

    // Development Console Simulation
    console.log('----------------------------------------------------');
    console.log(`📬 [DEV EMAIL SERVICE] Simulated dispatch to: ${to}`);
    console.log(`📌 Subject: ${subject}`);
    if (simulationPayload?.verifyUrl) {
      console.log(`🔗 Verification URL: ${simulationPayload.verifyUrl}`);
      console.log(`🔑 Token: ${simulationPayload.token}`);
    }
    if (simulationPayload?.resetUrl) {
      console.log(`🔗 Reset URL: ${simulationPayload.resetUrl}`);
      console.log(`🔑 Token: ${simulationPayload.token}`);
    }
    console.log('----------------------------------------------------');

    return {
      success: true,
      simulated: true,
      token: simulationPayload?.token,
      url: simulationPayload?.verifyUrl || simulationPayload?.resetUrl,
    };
  }
}
