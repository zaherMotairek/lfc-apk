import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type Transporter from 'nodemailer/lib/mailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly configService: ConfigService) {}

  isConfigured(): boolean {
    const host = this.configService.get<string>('SMTP_HOST');
    const user = this.configService.get<string>('SMTP_USER');
    return Boolean(host && user);
  }

  private getTransporter(): Transporter {
    if (this.transporter) {
      return this.transporter;
    }

    const host = this.configService.get<string>('SMTP_HOST');
    const port = Number(this.configService.get<string>('SMTP_PORT') ?? 587);
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (!host || !user) {
      throw new Error('SMTP is not configured');
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: this.configService.get<string>('SMTP_SECURE') === 'true',
      auth: pass ? { user, pass } : { user, pass: '' },
    });

    return this.transporter;
  }

  private getFromAddress(): string {
    return (
      this.configService.get<string>('SMTP_FROM') ??
      'OLSC Lebanon <noreply@olsclebanon.com>'
    );
  }

  async sendMail(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<void> {
    if (!this.isConfigured()) {
      this.logger.warn(`Email skipped (SMTP not configured): ${options.subject} → ${options.to}`);
      return;
    }

    await this.getTransporter().sendMail({
      from: this.getFromAddress(),
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    this.logger.log(`Email sent: ${options.subject} → ${options.to}`);
  }

  async sendInvitationEmail(
    to: string,
    firstName: string,
    invitationLink: string,
  ): Promise<void> {
    const subject = 'Activate your OLSC Lebanon RedLeb Hub account';
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h1 style="color:#c8102e">OLSC Lebanon</h1>
        <p>Hello ${firstName},</p>
        <p>You have been invited to join the official OLSC Lebanon digital platform.</p>
        <p>Click the button below to activate your account and set your password:</p>
        <p><a href="${invitationLink}" style="display:inline-block;background:#101418;color:#fff;padding:12px 20px;text-decoration:none;border-radius:8px">Activate account</a></p>
        <p style="color:#666;font-size:13px">If the button does not work, copy this link:<br>${invitationLink}</p>
        <p style="color:#666;font-size:13px">This invitation link expires automatically.</p>
      </div>
    `;

    await this.sendMail({
      to,
      subject,
      html,
      text: `Hello ${firstName}, activate your OLSC Lebanon account: ${invitationLink}`,
    });
  }

  async sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
    const subject = 'Reset your OLSC Lebanon password';
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h1 style="color:#c8102e">OLSC Lebanon</h1>
        <p>We received a request to reset your password.</p>
        <p><a href="${resetLink}" style="display:inline-block;background:#101418;color:#fff;padding:12px 20px;text-decoration:none;border-radius:8px">Reset password</a></p>
        <p style="color:#666;font-size:13px">If you did not request this, you can ignore this email.</p>
        <p style="color:#666;font-size:13px">Link: ${resetLink}</p>
      </div>
    `;

    await this.sendMail({
      to,
      subject,
      html,
      text: `Reset your password: ${resetLink}`,
    });
  }

  async sendNewsletterIssueEmail(
    to: string,
    firstName: string,
    input: { title: string; monthLabel: string; excerpt?: string | null; readUrl: string },
  ): Promise<void> {
    const subject = `New RedLeb Dispatch — ${input.title}`;
    const excerptBlock = input.excerpt
      ? `<p style="color:#444">${input.excerpt}</p>`
      : '';
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h1 style="color:#c8102e">OLSC Lebanon</h1>
        <p>Hello ${firstName || 'Supporter'},</p>
        <p>The committee published <strong>${input.title}</strong> (${input.monthLabel}).</p>
        ${excerptBlock}
        <p><a href="${input.readUrl}" style="display:inline-block;background:#101418;color:#fff;padding:12px 20px;text-decoration:none;border-radius:8px">Read the dispatch</a></p>
        <p style="color:#666;font-size:13px">Or open: ${input.readUrl}</p>
      </div>
    `;

    await this.sendMail({
      to,
      subject,
      html,
      text: `New RedLeb Dispatch: ${input.title}. Read: ${input.readUrl}`,
    });
  }

  async sendSignupCodeEmail(to: string, code: string): Promise<void> {
    const subject = 'Your OLSC Lebanon signup code';
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h1 style="color:#c8102e">OLSC Lebanon</h1>
        <p>Use this code to complete your RedLeb Hub signup:</p>
        <p style="font-size:32px;font-weight:700;letter-spacing:8px;color:#101418">${code}</p>
        <p style="color:#666;font-size:13px">This code expires in 15 minutes.</p>
      </div>
    `;

    await this.sendMail({
      to,
      subject,
      html,
      text: `Your OLSC Lebanon signup code is ${code}`,
    });
  }
}
