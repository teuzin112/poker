import type { Metadata } from "next";
import Link from "next/link";
import { RankingTable } from "@/components/RankingTable";
import { Card, PageHeader } from "@/components/ui";
import { getRanking, getYears } from "@/lib/queries";

export const metadata: Metadata = { title: "Ranking" };

export default async function RankingPage({ searchParams }: PageProps<"/ranking">) {
  const { ano } = await searchParams;
  const year = typeof ano === "string" && /^\d{4}$/.test(ano) ? Number(ano) : undefined;
  const [stats, years] = await Promise.all([getRanking({ year }), getYears()]);

  const chip = (active: boolean) =>
    `shrink-0 rounded-full border px-3 py-1 text-sm ${active ? "border-gold text-gold" : "border-line text-muted hover:text-text"}`;

  return (
    <>
      <PageHeader title="Ranking" subtitle="Ordenado por lucro líquido: prêmios − buy-ins − rebuys." />
      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Link href="/ranking" className={chip(!year)}>
          Geral
        </Link>
        {years.map((y) => (
          <Link key={y} href={`/ranking?ano=${y}`} className={chip(year === y)}>
            {y}
          </Link>
        ))}
      </div>
      <Card>
        <RankingTable stats={stats} />
      </Card>
    </>
  );
}
