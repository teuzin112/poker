-- CreateEnum
CREATE TYPE "TournamentStatus" AS ENUM ('OPEN', 'FINISHED');

-- CreateTable
CREATE TABLE "Player" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "nickname" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrizeTemplate" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "rules" JSONB NOT NULL,

    CONSTRAINT "PrizeTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tournament" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "buyIn" INTEGER NOT NULL,
    "rebuyPrice" INTEGER NOT NULL,
    "maxRebuys" INTEGER,
    "status" "TournamentStatus" NOT NULL DEFAULT 'OPEN',
    "prizeRules" JSONB NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entry" (
    "id" SERIAL NOT NULL,
    "tournamentId" INTEGER NOT NULL,
    "playerId" INTEGER NOT NULL,
    "rebuys" INTEGER NOT NULL DEFAULT 0,
    "position" INTEGER,
    "prize" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Entry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Player_name_key" ON "Player"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PrizeTemplate_name_key" ON "PrizeTemplate"("name");

-- CreateIndex
CREATE INDEX "Tournament_date_idx" ON "Tournament"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Entry_tournamentId_playerId_key" ON "Entry"("tournamentId", "playerId");

-- AddForeignKey
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
