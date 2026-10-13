import Link from "next/link";
import { btnSecondary } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <div className="text-5xl">🃏</div>
      <h1 className="mt-4 text-xl font-semibold">Página não encontrada</h1>
      <Link href="/" className={`${btnSecondary} mt-6`}>
        Voltar ao início
      </Link>
    </div>
  );
}
