"use client";

import { btnSecondary } from "@/components/ui";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="py-16 text-center">
      <h1 className="text-xl font-semibold">Algo deu errado</h1>
      <p className="mt-2 text-sm text-muted">{error.message}</p>
      <button onClick={reset} className={`${btnSecondary} mt-6`}>
        Tentar de novo
      </button>
    </div>
  );
}
