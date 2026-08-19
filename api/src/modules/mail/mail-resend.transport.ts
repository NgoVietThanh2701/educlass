import { ConfigService } from '@nestjs/config';

export interface ResendMailData {
  from?: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
}

type SendCallback = (err: Error | null, info?: unknown) => void;
type VerifyCallback = (err: Error | null, ok?: boolean) => void;

/**
 * Custom nodemailer transport that sends through the Resend HTTP API
 * (`https://api.resend.com/emails`) instead of SMTP.
 *
 * Deployed hosts (e.g. Render) frequently block outbound SMTP ports (587/465),
 * which shows up as `Connection timeout` / ETIMEDOUT, while HTTPS (443) stays
 * open — so an HTTP API transport is the reliable path for email delivery.
 * Implements nodemailer's custom-transport contract (`send` + optional
 * `verify`), so `@nestjs-modules/mailer` (templates, `sendMail`) keeps working.
 */
export function createResendTransport(config: ConfigService) {
  const apiKey = config.getOrThrow<string>('RESEND_API_KEY');
  const defaultFrom = `"${config.getOrThrow<string>('MAIL_FROM_NAME')}" <${config.getOrThrow<string>('MAIL_FROM')}>`;

  const request = (path: string, body?: unknown) =>
    fetch(`https://api.resend.com${path}`, {
      method: body ? 'POST' : 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

  return {
    name: 'resend-http',
    version: '1.0.0',

    send(mail: { data: ResendMailData }, callback: SendCallback) {
      const { to, from, subject, html, text } = mail.data;

      request('/emails', {
        from: from || defaultFrom,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text,
      })
        .then(async (res) => {
          const body = (await res.json()) as { message?: string; id?: string };
          if (!res.ok) {
            callback(new Error(body?.message || `Resend error ${res.status}`));
            return;
          }
          callback(null, body);
        })
        .catch((err: Error) => callback(err));
    },

    verify(callback: VerifyCallback) {
      request('/domains')
        .then((res) =>
          res.ok ? callback(null, true) : callback(new Error(`Resend API error ${res.status}`)),
        )
        .catch((err: Error) => callback(err));
    },
  };
}
