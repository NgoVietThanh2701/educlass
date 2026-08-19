import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { createResendTransport } from './mail-resend.transport';

/**
 * Email is delivered exclusively through the Resend HTTP API
 * (`https://api.resend.com/emails`). SMTP is intentionally NOT supported:
 * many cloud hosts (e.g. Render) block outbound SMTP ports (587/465), while
 * HTTPS (443) is always available.
 */
export const mailConfig = (config: ConfigService) => ({
  transport: createResendTransport(config),
  defaults: {
    from: `"${config.getOrThrow('MAIL_FROM_NAME')}" <${config.getOrThrow('MAIL_FROM')}>`,
  },
  template: {
    dir: join(process.cwd(), 'templates'),
    adapter: new HandlebarsAdapter(),
    options: {
      strict: true,
    },
  },
});
