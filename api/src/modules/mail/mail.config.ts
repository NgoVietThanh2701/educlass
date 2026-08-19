import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { ConfigService } from '@nestjs/config';
import { resolve4 } from 'node:dns/promises';
import { join } from 'path';

/**
 * Resolves the SMTP host to an IPv4 literal. nodemailer IGNORES the `family`
 * option and resolves BOTH A + AAAA records (dns.resolve4/6), so on hosts
 * without an IPv6 route (e.g. Render) it fails with `ENETUNREACH` against the
 * AAAA address. `servername` keeps the original hostname so TLS SNI /
 * certificate validation still matches (e.g. smtp.gmail.com).
 */
const resolveHostIpv4 = async (host: string): Promise<string> => {
  try {
    const [first] = await resolve4(host);
    return first || host;
  } catch {
    return host; // DNS hiccup → fall back to the hostname
  }
};

export const mailConfig = async (config: ConfigService) => {
  const host = config.getOrThrow<string>('MAIL_HOST');
  const hostIp = await resolveHostIpv4(host);

  return {
    transport: {
      host: hostIp,
      servername: host, // TLS SNI / certificate hostname (host is an IP literal)
      port: Number(config.getOrThrow('MAIL_PORT')),
      secure: config.getOrThrow('MAIL_SECURE') === 'true', // true cho 465
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
  };
};
