"use client";

import { useFormStatus } from "react-dom";

type Props = {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
  formAction?: (formData: FormData) => void | Promise<void>;
};

export function SubmitButton({ children, pendingText = "Saving...", className = "button-primary", formAction }: Props) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" formAction={formAction} className={className} disabled={pending} aria-disabled={pending}>
      {pending ? pendingText : children}
    </button>
  );
}
