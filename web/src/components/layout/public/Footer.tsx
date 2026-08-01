import Container from "@/components/layout/public/Container";
import Logo from "@/components/shared/Logo";
import {
  footerContacts,
  footerQuickLinks,
  footerResources,
} from "@/constants/footer";

export default function Footer() {
  return (
    <footer className="w-full border-t border-border bg-background/50">
      <Container className="py-10 text-sm text-foreground/70 sm:py-12 md:py-14 lg:py-16">
        <div className="grid gap-8 text-center sm:gap-10 md:grid-cols-2 md:text-left md:gap-12 lg:grid-cols-4 lg:gap-16">
          <div className="space-y-4 sm:space-y-5 md:items-start md:text-left">
            <div className="flex justify-center md:justify-start">
              <Logo
                iconClassName="h-7 w-7 text-primary"
                textClassName="text-lg font-semibold font-heading text-foreground"
              />
            </div>
            <p className="mx-auto max-w-xs text-sm leading-6 text-foreground/70 md:mx-0">
              Learning made simple. Helping teachers and students learn more
              effectively.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-start">
            <h3 className="mb-4 font-heading text-base font-semibold text-foreground sm:mb-5">
              Quick Links
            </h3>
            <ul className="grid gap-2 sm:gap-3 md:grid-cols-2 md:gap-x-6 lg:grid-cols-1">
              {footerQuickLinks.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="transition hover:text-primary">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col items-center md:items-start">
            <h3 className="mb-4 font-heading text-base font-semibold text-foreground sm:mb-5">
              Resources
            </h3>
            <ul className="grid gap-2 sm:gap-3 md:grid-cols-2 md:gap-x-6 lg:grid-cols-1">
              {footerResources.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="transition hover:text-primary">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col items-center md:items-start">
            <h3 className="mb-4 font-heading text-base font-semibold text-foreground">
              Contact
            </h3>
            <ul className="grid gap-3 sm:gap-4 md:grid-cols-2 md:gap-x-6 lg:grid-cols-1">
              {footerContacts.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 transition hover:text-primary"
                    >
                      <span className="rounded-full bg-primary/10 p-2 text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span>{item.label}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 text-center text-sm text-foreground/60 sm:mt-10 sm:pt-8 md:text-left">
          © {new Date().getFullYear()} EduClass. All rights reserved.
        </div>
      </Container>
    </footer>
  );
}
