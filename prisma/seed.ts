import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { DEFAULT_PRIZE_RULES } from "../src/lib/prize";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  await db.prizeTemplate.upsert({
    where: { name: "Padrão" },
    update: {},
    create: { name: "Padrão", isDefault: true, rules: DEFAULT_PRIZE_RULES },
  });
  console.log("Template de premiação 'Padrão' pronto.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
