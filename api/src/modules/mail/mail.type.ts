export interface OtpMailContext {
  otp: string;
  purpose: string;
  ttl: number;
  supportEmail: string;
}

export interface WelcomeMailContext {
  fullName: string;
  loginUrl: string;
}
