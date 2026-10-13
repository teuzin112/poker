import type { Metadata } from "next";
import Link from "next/link";
import { deleteTemplate, setDefaultTemplate } from "@/app/actions/templates";
import { SubmitButton } from "@/components/SubmitButton";
import { Badge, btnDanger, btnSecondary, Card, PageHeader } from "@/components/ui";
import { isAdmin } from "@/lib/auth";
import { describeRule } from "@/lib/prize";
import { getTemplates } from "@/lib/templates";
import { TemplateForm } from "./TemplateForm";

export const metadata: Metadata = { title: "Premiações" };

export default async function PrizeTemplatesPage({ searchParams }: PageProps<"/configuracoes/premiacoes">) {
  const { editar } = await searchParams;
  const [templates, admin] = await Promise.all([getTemplates(), isAdmin()]);
  const editing = admin ? templates.find((t) => String(t.id) === editar) : undefined;
  const small = `${btnSecondary} px-2.5 py-1.5 text-xs`;

  return (
    <>
      <PageHeader
        title="Modelos de premiação"
        subtitle="Cada torneio copia um modelo ao ser criado, e pode ajustar a divisão depois."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          {templates.map((t) => (
            <Card key={t.id} className={editing?.id === t.id ? "border-gold/60" : ""}>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="font-semibold">{t.name}</h2>
                {t.isDefault && <Badge tone="gold">Padrão</Badge>}
              </div>
              <ul className="space-y-1 text-sm">
                {t.rules.map((r) => (
                  <li key={r.position} className="flex justify-between">
                    <span className="text-muted">{r.position}º lugar</span>
                    <span>{describeRule(r)}</span>
                  </li>
                ))}
              </ul>
              {admin && (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-3">
                  <Link href={`/configuracoes/premiacoes?editar=${t.id}`} className={small}>
                    Editar
                  </Link>
                  {!t.isDefault && (
                    <>
                      <form action={setDefaultTemplate}>
                        <input type="hidden" name="id" value={t.id} />
                        <SubmitButton className={small}>Tornar padrão</SubmitButton>
                      </form>
                      <form action={deleteTemplate}>
                        <input type="hidden" name="id" value={t.id} />
                        <SubmitButton className={`${btnDanger} px-2.5 py-1.5 text-xs`} confirm={`Excluir o modelo "${t.name}"?`}>
                          Excluir
                        </SubmitButton>
                      </form>
                    </>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
        {admin && (
          <Card title={editing ? `Editar "${editing.name}"` : "Novo modelo"} className="self-start">
            <TemplateForm
              key={editing?.id ?? "new"}
              template={editing ?? { name: "", rules: [{ position: 1, type: "percent", value: 100 }] }}
            />
          </Card>
        )}
      </div>
    </>
  );
}
