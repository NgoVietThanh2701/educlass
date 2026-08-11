"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import {
  useResendOtp,
  useVerifyOtp,
} from "@/features/auth/hooks/use-verify-otp";

const OTP_LENGTH = 6;

interface OtpFormProps {
  email?: string;
}

function getErrorMessage(error: unknown): string {
  const apiError = error as {
    response?: { data?: { message?: string } };
  };
  return (
    apiError?.response?.data?.message ?? "Đã có lỗi xảy ra. Vui lòng thử lại."
  );
}

export default function OtpForm({ email }: OtpFormProps) {
  const router = useRouter();

  const verifyMutation = useVerifyOtp();
  const resendMutation = useResendOtp();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const focusInput = (index: number) => {
    if (index >= 0 && index < OTP_LENGTH) {
      inputRefs.current[index]?.focus();
      inputRefs.current[index]?.select();
    }
  };

  const handleInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const value = e.target.value;

    // Chỉ chấp nhận 1 chữ số hoặc rỗng
    if (!/^\d?$/.test(value)) {
      return;
    }

    // ✅ Functional update – luôn dùng prev state
    setOtp((prev) => {
      const newOtp = [...prev];
      newOtp[index] = value;
      return newOtp;
    });

    // Sau khi nhập số, tự động chuyển sang ô tiếp theo
    if (value && index < OTP_LENGTH - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Backspace") {
      // Nếu ô hiện tại đang có số -> để onChange xoá bình thường
      if (otp[index]) {
        return;
      }

      // Ô hiện tại trống -> xoá ô trước đó và nhảy về
      if (index > 0) {
        setOtp((prev) => {
          const newOtp = [...prev];
          newOtp[index - 1] = "";
          return newOtp;
        });
        focusInput(index - 1);
      }

      e.preventDefault(); // tránh hành vi mặc định điều hướng trang
    } else if (e.key === "Delete") {
      setOtp((prev) => {
        const newOtp = [...prev];
        newOtp[index] = "";
        return newOtp;
      });
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (index > 0) focusInput(index - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      if (index < OTP_LENGTH - 1) focusInput(index + 1);
    }
  };

  const handlePaste = (
    e: React.ClipboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    e.preventDefault();

    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "") // chỉ lấy chữ số
      .slice(0, OTP_LENGTH - index);

    if (!pastedData) return;

    setOtp((prev) => {
      const newOtp = [...prev];
      pastedData.split("").forEach((char, offset) => {
        newOtp[index + offset] = char;
      });
      return newOtp;
    });

    const lastIndex = Math.min(index + pastedData.length, OTP_LENGTH - 1);
    focusInput(lastIndex);
  };

  const handleVerify = () => {
    if (!email) {
      setError("Vui lòng đăng ký trước khi xác thực.");
      return;
    }

    setError(null);
    setNotice(null);

    const code = otp.join("");
    if (code.length !== OTP_LENGTH) return;

    verifyMutation.mutate(
      { email, code },
      {
        onSuccess: () => {
          router.push(ROUTES.HOME);
        },
        onError: (err) => {
          setError(getErrorMessage(err));
        },
      },
    );
  };

  const handleResend = () => {
    if (!email) {
      setError("Vui lòng đăng ký trước khi xác thực.");
      return;
    }

    setError(null);
    setNotice(null);

    resendMutation.mutate(
      { email },
      {
        onSuccess: () => {
          setNotice("Mã OTP mới đã được gửi về email của bạn.");
        },
        onError: (err) => {
          setError(getErrorMessage(err));
        },
      },
    );
  };

  const isComplete = otp.every(Boolean);
  const isPending = verifyMutation.isPending || resendMutation.isPending;

  return (
    <div className="flex items-center justify-center">
      <div className="flex w-full max-w-sm flex-col items-center gap-7">
        <div className="text-center">
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-50">
            Nhập mã OTP
          </h3>

          {email ? (
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Chúng tôi đã gửi mã xác thực tới <strong>{email}</strong>
            </p>
          ) : (
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Vui lòng đăng ký trước để xác thực email.
            </p>
          )}
        </div>

        {error && (
          <div
            role="alert"
            className="w-full rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400"
          >
            {error}
          </div>
        )}

        {notice && (
          <p
            role="status"
            className="text-sm text-green-600 dark:text-green-400"
          >
            {notice}
          </p>
        )}

        <div className="flex gap-3">
          {otp.map((value, index) => (
            <input
              key={index}
              ref={(element) => {
                inputRefs.current[index] = element;
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              maxLength={1}
              value={value}
              onChange={(e) => handleInput(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={(e) => handlePaste(e, index)}
              aria-label={`Mã OTP vị trí ${index + 1}`}
              className="
                h-12 w-11 rounded-md border border-[#999]
                text-center text-lg outline-none transition
                focus:border-primary dark:bg-neutral-800 dark:text-slate-50
              "
            />
          ))}
        </div>

        <div className="flex w-full flex-col items-center gap-3">
          <Button
            type="button"
            className="w-full"
            disabled={!isComplete || isPending}
            onClick={handleVerify}
          >
            {verifyMutation.isPending ? "Đang xác thực..." : "Submit"}
          </Button>

          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <span>Không nhận được mã?</span>
            <button
              type="button"
              onClick={handleResend}
              disabled={isPending}
              className="font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
            >
              {resendMutation.isPending ? "Đang gửi..." : "Gửi lại"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
