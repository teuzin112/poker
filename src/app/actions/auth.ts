"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { checkPassword, endAdminSession, startAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { plural } from "@/lib/money";
import { FAILURE_DELAY_MS, loginBlockState, WINDOW_MS } from "@/lib/loginLimit";

export type FormState = { error?: string } | undefined;

async function clientIp() {
  const h = await headers();
  // Na Vercel, x-real-ip / x-forwarded-for são definidos pela plataforma com o IP real do cliente.
  return h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const ip = await clientIp();
  const now = new Date();
  const since = new Date(now.getTime() - WINDOW_MS);
  const failures = await db.loginAttempt.findMany({ where: { ip, createdAt: { gte: since } }, select: { createdAt: true } });
  const before = loginBlockState(
    failures.map((f) => f.createdAt),
    now,
  );
  if (before.blocked) {
    return { error: `Muitas tentativas erradas. Tente de novo em ${before.retryInMinutes} min.` };
  }

  const password = String(formData.get("password") ?? "");
  if (!checkPassword(password)) {
    await db.loginAttempt.create({ data: { ip } });
    // Limpeza oportunista de registros antigos.
    await db.loginAttempt.deleteMany({ where: { createdAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } } });
    await new Promise((resolve) => setTimeout(resolve, FAILURE_DELAY_MS));
    const remaining = before.remaining - 1;
    if (remaining <= 0) return { error: "Muitas tentativas erradas. Tente de novo em 15 min." };
    return { error: remaining <= 2 ? `Senha incorreta. ${remaining === 1 ? "Resta" : "Restam"} ${plural(remaining, "tentativa")}.` : "Senha incorreta." };
  }

  await db.loginAttempt.deleteMany({ where: { ip } });
  await startAdminSession();
  const next = String(formData.get("next") ?? "/");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/");
}

export async function logout() {
  await endAdminSession();
  redirect("/");
}
