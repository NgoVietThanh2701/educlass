import type { InputHTMLAttributes } from "react";
import type { FieldValues, Path, UseFormRegister } from "react-hook-form";
import { FormField } from "../ui/form-field";
import { PasswordInput } from "../ui/password-input";

interface FormPasswordProps<T extends FieldValues> extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "name" | "type"
> {
  name: Path<T>;
  label: string;
  register: UseFormRegister<T>;
  error?: string;
  required?: boolean;
}

export function FormPassword<T extends FieldValues>({
  name,
  label,
  register,
  error,
  required,
  ...props
}: FormPasswordProps<T>) {
  return (
    <FormField htmlFor={name} label={label} required={required} error={error}>
      <PasswordInput {...register(name)} {...props} id={name} />
    </FormField>
  );
}
