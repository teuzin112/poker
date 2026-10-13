import type { Metadata } from "next";
import { Card } from "@/components/ui";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  return (
    <div className="mx-auto max-w-sm pt-8">
      <Card>
        <h1 className="mb-1 text-lg font-semibold">Entrar como admin</h1>
        <p className="mb-5 text-sm text-muted">Necessário para criar torneios, registrar rebuys e resultados.</p>
        <LoginForm next={typeof next === "string" ? next : "/"} />
      </Card>
    </div>
  );
}
