"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { readRulesField } from "@/lib/forms";
import type { FormState } from "./auth";

const nameSchema = z.string().trim().min(1, "Informe um nome.").max(60);

function parse(formData: FormData) {
  const name = nameSchema.safeParse(formData.get("name") ?? "");
  if (!name.success) return { error: name.error.issues[0].message } as const;
  const rules = readRulesField(formData);
  if ("error" in rules) return rules;
  return { name: name.data, rules: rules.rules } as const;
}

export async function saveTemplate(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const data = parse(formData);
  if ("error" in data) return { error: data.error };
  const id = Number(formData.get("id")) || null;
  try {
    if (id) await db.prizeTemplate.update({ where: { id }, data });
    else await db.prizeTemplate.create({ data });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "Já existe um modelo com esse nome." };
    }
    throw e;
  }
  revalidatePath("/configuracoes/premiacoes");
  redirect("/configuracoes/premiacoes");
}

export async function setDefaultTemplate(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  await db.$transaction([
    db.prizeTemplate.updateMany({ data: { isDefault: false } }),
    db.prizeTemplate.update({ where: { id }, data: { isDefault: true } }),
  ]);
  revalidatePath("/configuracoes/premiacoes");
}

export async function deleteTemplate(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const template = await db.prizeTemplate.findUniqueOrThrow({ where: { id } });
  if (template.isDefault) throw new Error("Não é possível excluir o modelo padrão.");
  await db.prizeTemplate.delete({ where: { id } });
  revalidatePath("/configuracoes/premiacoes");
}
