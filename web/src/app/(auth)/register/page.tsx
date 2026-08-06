"use client";

import { GoogleIcon } from "@/components/icons";
import { ROUTES } from "@/constants/routes";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { PasswordInput } from "@/components/ui/password-input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  return (
    <>
      <h1 className="mb-8 text-3xl font-bold text-slate-900 dark:text-slate-50">
        Sign up
      </h1>

      <form className="space-y-6">
        {/* Email */}
        <FormField htmlFor="email" label="Email" required>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="john@readymadeui.com"
            required
          />
        </FormField>

        {/* Fullname */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_120px]">
          <FormField htmlFor="fullname" label="Full Name" required>
            <Input
              id="fullname"
              name="fullname"
              type="text"
              placeholder="John Doe"
              required
            />
          </FormField>

          <FormField htmlFor="role" label="Role">
            <Select id="role" defaultValue="student">
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </Select>
          </FormField>
        </div>

        {/* Password */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr]">
          <FormField htmlFor="password" label="Password" required>
            <PasswordInput
              id="password"
              name="password"
              placeholder="••••••••"
              required
            />
          </FormField>

          <FormField
            htmlFor="confirmPassword"
            label="Confirm Password"
            required
          >
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              placeholder="••••••••"
              required
            />
          </FormField>
        </div>

        {/* Submit */}
        <Button type="submit" className="w-full">
          Sign up
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
