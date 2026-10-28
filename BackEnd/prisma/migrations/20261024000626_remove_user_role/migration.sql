/*
  Warnings:

  - You are about to drop the column `role` on the `users` table. All the data in the column will be lost.
  - The `role` column on the `workSpaceMember` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "workSpaceRole" AS ENUM ('Admin', 'Member');

-- AlterTable
ALTER TABLE "users" DROP COLUMN "role";

-- AlterTable
ALTER TABLE "workSpaceMember" DROP COLUMN "role",
ADD COLUMN     "role" "workSpaceRole" NOT NULL DEFAULT 'Member';

-- DropEnum
DROP TYPE "UserRole";
