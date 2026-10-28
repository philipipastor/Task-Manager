/*
  Warnings:

  - You are about to drop the `Tasks` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TeamsMembers` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `workSpace_id` to the `teams` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Tasks" DROP CONSTRAINT "Tasks_assigned_to_fkey";

-- DropForeignKey
ALTER TABLE "Tasks" DROP CONSTRAINT "Tasks_team_id_fkey";

-- DropForeignKey
ALTER TABLE "TeamsMembers" DROP CONSTRAINT "TeamsMembers_team_id_fkey";

-- DropForeignKey
ALTER TABLE "TeamsMembers" DROP CONSTRAINT "TeamsMembers_user_id_fkey";

-- DropForeignKey
ALTER TABLE "tasks_history" DROP CONSTRAINT "tasks_history_task_id_fkey";

-- AlterTable
ALTER TABLE "teams" ADD COLUMN     "workSpace_id" TEXT NOT NULL;

-- DropTable
DROP TABLE "Tasks";

-- DropTable
DROP TABLE "TeamsMembers";

-- CreateTable
CREATE TABLE "workSpace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workSpace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workSpaceMember" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "workSpace_id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'Member',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workSpaceMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workSpaceInvite" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "workSpace_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),

    CONSTRAINT "workSpaceInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams_members" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teams_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'Pendente',
    "priority" "Priority" NOT NULL,
    "assigned_to" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "workSpace_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workSpaceMember_user_id_workSpace_id_key" ON "workSpaceMember"("user_id", "workSpace_id");

-- CreateIndex
CREATE UNIQUE INDEX "workSpaceInvite_tokenHash_key" ON "workSpaceInvite"("tokenHash");

-- AddForeignKey
ALTER TABLE "workSpaceMember" ADD CONSTRAINT "workSpaceMember_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workSpaceMember" ADD CONSTRAINT "workSpaceMember_workSpace_id_fkey" FOREIGN KEY ("workSpace_id") REFERENCES "workSpace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workSpaceInvite" ADD CONSTRAINT "workSpaceInvite_workSpace_id_fkey" FOREIGN KEY ("workSpace_id") REFERENCES "workSpace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_workSpace_id_fkey" FOREIGN KEY ("workSpace_id") REFERENCES "workSpace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams_members" ADD CONSTRAINT "teams_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams_members" ADD CONSTRAINT "teams_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_workSpace_id_fkey" FOREIGN KEY ("workSpace_id") REFERENCES "workSpace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks_history" ADD CONSTRAINT "tasks_history_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
