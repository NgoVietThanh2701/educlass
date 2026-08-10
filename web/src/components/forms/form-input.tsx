import type { InputHTMLAttributes } from "react";

import type { UseFormRegister, FieldValues, Path } from "react-hook-form";
import { FormField } from "../ui/form-field";
import { Input } from "../ui/input";

interface FormInputProps<T extends FieldValues> extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "name"
> {
  name: Path<T>;
  label: string;
  register: UseFormRegister<T>;
  error?: string;
  required?: boolean;
}

export function FormInput<T extends FieldValues>({
  name,
  label,
  register,
  error,
  required,
  ...props
}: FormInputProps<T>) {
  return (
    <FormField htmlFor={name} label={label} required={required} error={error}>
      <Input id={name} {...register(name)} {...props} />
    </FormField>
  );
}
