"use client";

import { useState } from "react";

import { FormInput } from "@/components/forms/form-input";
import { FormPassword } from "@/components/forms/form-password";
import { GoogleIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Select } from "@/components/ui/select";
import { ROUTES } from "@/constants/routes";
import { useRegister } from "@/features/auth/hooks/use-register";
import {
  RegisterFormValues,
  registerSchema,
} from "@/features/auth/schemas/register.schema";
import { RoleUser } from "@/types/role.type";
import { RegisterRequest } from "@/features/auth/types/register-request.type";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export default function RegisterForm() {
  const router = useRouter();
  const registerMutation = useRegister();

  const [error, setError] = useState<string | null>(null);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      fullName: "",
      password: "",
      role: RoleUser.STUDENT,
      confirmPassword: "",
    },
  });

  const onSubmit = (values: RegisterFormValues) => {
    setError(null);

    // Chỉ gửi đúng payload API mong đợi (bỏ confirmPassword chỉ dùng để validate UI)
    const payload: RegisterRequest = {
      email: values.email,
      fullName: values.fullName,
      password: values.password,
      role: values.role,
    };

    registerMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Đăng ký thành công!");
        router.push(
          `${ROUTES.REGISTER_VERIFY}?email=${encodeURIComponent(values.email)}`,
        );
      },

      onError: (err) => {
        const apiError = err as {
          response?: { data?: { message?: string } };
        };
        setError(
          apiError?.response?.data?.message ??
            "Đã có lỗi xảy ra. Vui lòng thử lại.",
        );
      },
    });
  };

  return (
    <>
      <h1 className="mb-8 text-3xl font-bold text-slate-900 dark:text-slate-50">
        Sign up
      </h1>

      {error && (
        <div
          role="alert"
          className="mb-6 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400"
        >
          {error}
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Email */}
        <FormInput
          register={form.register}
          name="email"
          label="Email"
          type="email"
          placeholder="john@readymadeui.com"
          required
          error={form.formState.errors.email?.message}
        />

        {/* Fullname */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_120px]">
          <FormInput
            register={form.register}
            name="fullName"
            label="Full Name"
            type="text"
            placeholder="John Doe"
            required
            error={form.formState.errors.fullName?.message}
          />

          <FormField htmlFor="role" label="Role">
            <Select
              id="role"
              defaultValue={RoleUser.STUDENT}
              {...form.register("role")}
            >
              <option value={RoleUser.STUDENT}>Student</option>
              <option value={RoleUser.TEACHER}>Teacher</option>
            </Select>
          </FormField>
        </div>

        {/* Password */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr]">
          <FormPassword
            register={form.register}
            name="password"
            label="Password"
            placeholder="••••••••"
            required
            error={form.formState.errors.password?.message}
          />

          <FormPassword
            register={form.register}
            name="confirmPassword"
            label="Confirm Password"
            placeholder="••••••••"
            required
            error={form.formState.errors.confirmPassword?.message}
          />
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full"
          disabled={registerMutation.isPending}
        >
          {registerMutation.isPending ? "Signing up..." : "Sign up"}
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
        Already have an account?
        <a
          href={ROUTES.LOGIN}
          className="ml-1 rounded font-medium text-blue-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-500"
        >
          Sign in
        </a>
      </div>
    </>
  );
}
