import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';

export const mailConfig = (config: ConfigService) => ({
  transport: {
    host: config.getOrThrow('MAIL_HOST'),
    port: Number(config.getOrThrow('MAIL_PORT')),
    secure: config.getOrThrow('MAIL_SECURE') === 'true', // true cho 465
    family: 4, // force IPv4 DNS resolution (cloud hosts often lack an IPv6 route)
    // Disable Happy Eyeballs so IPv6 is never attempted (Node 20+ defaults to
    // trying both families; on Render IPv6 → ENETUNREACH and SMTP fails).
    connection: { autoSelectFamily: false },
    pool: true,
    maxConnections: 5,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
    auth: {
      user: config.getOrThrow('MAIL_USER'),
      pass: config.getOrThrow('MAIL_PASSWORD'),
    },
  },
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
