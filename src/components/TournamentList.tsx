import Link from "next/link";
import { formatDate } from "@/lib/dates";
import { formatBRL, plural } from "@/lib/money";
import { calcPot } from "@/lib/prize";
import { Badge, Empty } from "./ui";

export type TournamentListItem = {
  id: number;
  name: string;
  date: Date;
  location: string | null;
  status: "OPEN" | "FINISHED";
  buyIn: number;
  rebuyPrice: number;
  entries: { rebuys: number; position: number | null; player: { name: string } }[];
};

export const tournamentListInclude = {
  entries: { select: { rebuys: true, position: true, player: { select: { name: true } } } },
} as const;

export function TournamentList({ items, empty = "Nenhum torneio ainda." }: { items: TournamentListItem[]; empty?: string }) {
  if (items.length === 0) return <Empty>{empty}</Empty>;
  return (
    <ul className="divide-y divide-line">
      {items.map((t) => {
        const winner = t.entries.find((e) => e.position === 1);
        return (
          <li key={t.id}>
            <Link href={`/torneios/${t.id}`} className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-3 hover:bg-surface-2/60">
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{t.name}</div>
                <div className="text-xs text-muted">
                  {formatDate(t.date)} · {plural(t.entries.length, "jogador", "jogadores")} · pote {formatBRL(calcPot(t.buyIn, t.rebuyPrice, t.entries))}
                </div>
              </div>
              {t.status === "OPEN" ? (
                <Badge tone="gold">Em andamento</Badge>
              ) : winner ? (
                <span className="shrink-0 text-right text-sm">
                  <span className="block text-xs text-muted">Campeão</span>🏆 {winner.player.name}
                </span>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
