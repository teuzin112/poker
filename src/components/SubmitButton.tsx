"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";
import { btnPrimary } from "./ui";

export function SubmitButton({
  children,
  className = btnPrimary,
  confirm,
}: {
  children: ReactNode;
  className?: string;
  confirm?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
