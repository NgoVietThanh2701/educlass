"use client";

import { CheckIcon, GoogleIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { useLogin } from "@/features/auth/hooks/use-login";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  LoginFormValues,
  loginSchema,
} from "@/features/auth/schemas/login.schema";
import { FormInput } from "@/components/forms/form-input";
import { FormPassword } from "@/components/forms/form-password";
import { getErrorMessage } from "@/lib/error-message";

export default function LoginForm() {
  const router = useRouter();
  const loginMutation = useLogin();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  const onSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values, {
      onSuccess: (response) => {
        console.log(response.message);

        toast.success("Đăng nhập thành công!");

        router.push(ROUTES.HOME);
      },

      onError: (error) => {
        toast.error(getErrorMessage(error));
      },
    });
  };

  return (
    <>
      <h1 className="mb-8 text-3xl font-bold text-slate-900 dark:text-slate-50">
        Sign in
      </h1>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* identifier */}
        <FormInput
          register={form.register}
          name="identifier"
          label="Email or Username"
          type="text"
          placeholder="john@readymadeui.com"
          required
          error={form.formState.errors.identifier?.message}
        />

        <FormPassword
          register={form.register}
          name="password"
          label="Password"
          placeholder="••••••••"
          required
          error={form.formState.errors.password?.message}
        />

        {/* Remember */}
        <div className="flex flex-wrap items-start gap-2">
          <label className="group flex items-center has-[input:checked]:text-slate-900">
            <input
              id="remember"
              name="remember"
              type="checkbox"
              className="sr-only"
            />

            <span
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-white outline-1 outline-slate-300 group-focus-within:outline-2 group-focus-within:outline-blue-600 group-has-[input:checked]:bg-blue-600 group-has-[input:checked]:outline-blue-600 dark:bg-neutral-700 dark:outline-neutral-600"
              aria-hidden="true"
            >
              <CheckIcon className="text-white opacity-0 group-has-[input:checked]:opacity-100" />
            </span>

            <span className="ml-3 text-sm text-slate-700 dark:text-slate-300">
              Remember me
            </span>
          </label>

          <a
            href="#"
            className="ml-auto rounded text-sm font-medium text-blue-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-500"
          >
            Forgot password?
          </a>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      {/* Divider */}
      <div className="my-8 flex items-center gap-4">
        <hr className="w-full border-slate-300 dark:border-neutral-700" />
        <p className="text-center text-sm text-slate-700 dark:text-slate-300">
          or
        </p>
        <hr className="w-full border-slate-300 dark:border-neutral-700" />
      </div>

      {/* Google */}
      <a
        href="#"
        className="flex w-full items-center justify-center gap-2.5 rounded-md border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-900 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-slate-50 dark:hover:bg-neutral-600"
      >
        {/* SVG Google giữ nguyên như code của bạn */}
        <GoogleIcon />
        Continue with Google
      </a>

      {/* Footer */}
      <div className="mt-6 text-center text-sm text-slate-900 dark:text-slate-50">
        Dont have an account?
        <a
          href={ROUTES.REGISTER}
          className="ml-1 rounded font-medium text-blue-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-500"
        >
          Sign up
        </a>
      </div>
    </>
  );
}
