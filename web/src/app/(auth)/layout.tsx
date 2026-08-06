import Image from "next/image";
import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex items-center justify-center px-4 py-4 md:min-h-screen md:px-8">
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl bg-white [box-shadow:0_2px_10px_-3px_rgba(14,14,14,0.3)] dark:bg-neutral-800">
        <div className="grid w-full items-center gap-4 md:grid-cols-2">
          {/* Left */}
          <div className="relative h-full w-full overflow-hidden bg-gray-50 md:aspect-8/10 before:absolute before:inset-0 before:bg-black/40">
            <Image
              src="/images/auth.png"
              alt="Authentication"
              fill
              priority
              object-fit="cover"
              sizes="(max-width: 768px) 0px, 512px"
            />

            <div className="absolute inset-0 flex items-end">
              <div className="absolute bottom-0 w-full bg-linear-to-t from-black/70 via-black/40 to-transparent p-6 max-md:hidden">
                <h2 className="text-2xl font-semibold text-white">
                  Welcome Back
                </h2>

                <p className="mt-4 text-base leading-relaxed text-slate-300">
                  Join our private network to discover job opportunities and
                  connect with professionals.
                </p>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="order-first px-6 py-6 lg:px-8 md:order-last">
            <div className="mx-auto w-full max-w-md">{children}</div>
          </div>
        </div>
      </div>
    </main>
  );
}
