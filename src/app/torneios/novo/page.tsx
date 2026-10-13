import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TournamentForm } from "@/components/TournamentForm";
import { PageHeader } from "@/components/ui";
import { isAdmin } from "@/lib/auth";
import { todayInput } from "@/lib/dates";
import { db } from "@/lib/db";
import { centsToInput } from "@/lib/money";
import { getDefaultRules, getTemplates } from "@/lib/templates";

export const metadata: Metadata = { title: "Novo torneio" };

export default async function NewTournamentPage() {
  if (!(await isAdmin())) redirect("/login?next=/torneios/novo");
  const [templates, rules, count, last] = await Promise.all([
    getTemplates(),
    getDefaultRules(),
    db.tournament.count(),
    db.tournament.findFirst({ orderBy: { date: "desc" } }),
  ]);
  // Reaproveita valores do último torneio para agilizar.
  return (
    <>
      <PageHeader title="Novo torneio" />
      <TournamentForm
        templates={templates}
        defaults={{
          name: `TCLÃ Poker #${count + 1}`,
          date: todayInput(),
          location: last?.location ?? "",
          buyIn: last ? centsToInput(last.buyIn) : "50",
          rebuyPrice: last ? centsToInput(last.rebuyPrice) : "",
          maxRebuys: last?.maxRebuys != null ? String(last.maxRebuys) : "",
          notes: "",
          prizeRules: rules,
        }}
      />
    </>
  );
}
