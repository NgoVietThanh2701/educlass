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
 * `verify`) and ALSO supports promise-style calls (`await transporter.verify()`).
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

  /** Resolves a promise and also notifies a callback when one is supplied. */
  const settle = <T>(
    promise: Promise<T>,
    callback?: (err: Error | null, value?: T) => void,
  ): Promise<T> => {
    if (typeof callback === 'function') {
      promise.then(
        (value) => callback(null, value),
        (err: Error) => callback(err),
      );
    }
    return promise;
  };

  return {
    name: 'resend-http',
    version: '1.0.0',

    send(mail: { data: ResendMailData }, callback?: SendCallback) {
      const { to, from, subject, html, text } = mail.data;

      const promise = request('/emails', {
        from: from || defaultFrom,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text,
      }).then(async (res) => {
        const body = (await res.json()) as { message?: string; id?: string };
        if (!res.ok) {
          throw new Error(body?.message || `Resend error ${res.status}`);
        }
        return body;
      });

      return settle(promise, callback);
    },

    verify(callback?: VerifyCallback) {
      const promise = request('/domains').then((res) => {
        if (!res.ok) {
          throw new Error(`Resend API error ${res.status}`);
        }
        return true;
      });

      return settle(promise, callback);
    },
  };
}
