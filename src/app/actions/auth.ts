"use server";

import { redirect } from "next/navigation";
import { checkPassword, endAdminSession, startAdminSession } from "@/lib/auth";

export type FormState = { error?: string } | undefined;

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const password = String(formData.get("password") ?? "");
  if (!checkPassword(password)) return { error: "Senha incorreta." };
  await startAdminSession();
  const next = String(formData.get("next") ?? "/");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/");
}

export async function logout() {
  await endAdminSession();
  redirect("/");
}
