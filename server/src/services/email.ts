import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

// Email configuration
interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// Get email configuration from environment
const getEmailConfig = (): EmailConfig | null => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return {
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  };
};

// Create transporter
const createTransporter = () => {
  const config = getEmailConfig();

  if (config) {
    return nodemailer.createTransport(config as SMTPTransport.Options);
  }

  // For development: use ethereal.email or console output
  return nodemailer.createTransport({
    streamTransport: true,
    newline: 'unix',
  } as SMTPTransport.Options);
};

// Email templates
export interface PasswordResetEmailData {
  email: string;
  resetUrl: string;
  userName?: string;
}

export const sendPasswordResetEmail = async (data: PasswordResetEmailData): Promise<boolean> => {
  const { email, resetUrl, userName } = data;
  const config = getEmailConfig();

  const emailContent = {
    from: process.env.SMTP_FROM || 'noreply@noteflow.app',
    to: email,
    subject: 'NoteFlow - 重置您的密码',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">重置您的 NoteFlow 密码</h2>
        <p>您好 ${userName || '用户'}，</p>
        <p>我们收到了重置您密码的请求。请点击下方按钮来重置您的密码：</p>
        <div style="margin: 30px 0;">
          <a href="${resetUrl}"
             style="background-color: #4F46E5; color: white; padding: 12px 24px;
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            重置密码
          </a>
        </div>
        <p>或者复制以下链接到浏览器：</p>
        <p style="background-color: #f3f4f6; padding: 12px; border-radius: 6px; word-break: break-all;">
          ${resetUrl}
        </p>
        <p style="color: #6b7280; font-size: 14px;">
          此链接将在 1 小时后失效。如果您没有请求重置密码，请忽略此邮件。
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">
          此邮件由 NoteFlow 系统自动发送，请勿回复。
        </p>
      </div>
    `,
    text: `
重置您的 NoteFlow 密码

您好 ${userName || '用户'}，

我们收到了重置您密码的请求。请点击以下链接来重置您的密码：

${resetUrl}

此链接将在 1 小时后失效。如果您没有请求重置密码，请忽略此邮件。

此邮件由 NoteFlow 系统自动发送，请勿回复。
    `,
  };

  try {
    if (!config) {
      // Development mode: log email to console
      console.log('\n========================================');
      console.log('📧 [DEV MODE] Password Reset Email');
      console.log('========================================');
      console.log(`To: ${email}`);
      console.log(`Subject: ${emailContent.subject}`);
      console.log(`Reset URL: ${resetUrl}`);
      console.log('========================================\n');
      return true;
    }

    const transporter = createTransporter();
    await transporter.sendMail(emailContent);
    return true;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return false;
  }
};

export default {
  sendPasswordResetEmail,
};
