"use client";

import { useRef, useState } from "react";

const OTP_LENGTH = 6;

export default function OtpForm() {
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));

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

  const handleOTP = () => {
    const otpCode = otp.join("");
    if (otpCode.length !== OTP_LENGTH) return;
    console.log("OTP:", otpCode);
    // TODO: gọi API verify
  };

  const isComplete = otp.every(Boolean);

  return (
    <div className="flex items-center justify-center">
      <div className="flex flex-col items-center gap-7">
        <h3 className="text-lg font-medium text-green-600">
          Nhập mã OTP tại đây
        </h3>

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
              className="
                h-12 w-11 rounded-md border border-[#999]
                text-center text-lg outline-none transition
                focus:border-[#3B71CA]
              "
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleOTP}
          disabled={!isComplete}
          className="
            mx-auto rounded-md bg-blue-600 px-5 py-2
            text-white transition
            disabled:cursor-not-allowed disabled:opacity-50
          "
        >
          Submit
        </button>
      </div>
    </div>
  );
}
