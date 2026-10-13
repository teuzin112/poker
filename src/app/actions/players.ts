"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import type { FormState } from "./auth";

const playerSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome.").max(60),
  nickname: z
    .string()
    .trim()
    .max(60)
    .transform((v) => v || null),
});

/** Nomes são únicos sem diferenciar maiúsculas ("ana" = "Ana"). */
async function nameTaken(name: string, exceptId?: number) {
  const found = await db.player.findFirst({
    where: { name: { equals: name, mode: "insensitive" }, id: exceptId ? { not: exceptId } : undefined },
  });
  return found != null;
}

function isUniqueError(e: unknown) {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

export async function createPlayer(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = playerSchema.safeParse({
    name: formData.get("name") ?? "",
    nickname: formData.get("nickname") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (await nameTaken(parsed.data.name)) return { error: "Já existe um jogador com esse nome." };
  try {
    await db.player.create({ data: parsed.data });
  } catch (e) {
    if (isUniqueError(e)) return { error: "Já existe um jogador com esse nome." };
    throw e;
  }
  revalidatePath("/", "layout");
  return {};
}

export async function updatePlayer(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const parsed = playerSchema.safeParse({
    name: formData.get("name") ?? "",
    nickname: formData.get("nickname") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (await nameTaken(parsed.data.name, id)) return { error: "Já existe um jogador com esse nome." };
  try {
    await db.player.update({ where: { id }, data: parsed.data });
  } catch (e) {
    if (isUniqueError(e)) return { error: "Já existe um jogador com esse nome." };
    throw e;
  }
  revalidatePath("/", "layout");
  return {};
}

export async function togglePlayerActive(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const player = await db.player.findUniqueOrThrow({ where: { id } });
  await db.player.update({ where: { id }, data: { active: !player.active } });
  revalidatePath("/", "layout");
}

export async function deletePlayer(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const count = await db.entry.count({ where: { playerId: id } });
  if (count > 0) throw new Error("Jogador tem torneios registrados; inative em vez de excluir.");
  await db.player.delete({ where: { id } });
  revalidatePath("/", "layout");
  redirect("/jogadores");
}
