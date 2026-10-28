import { Request, Response } from "express"
import { z } from "zod"
import { prisma } from "@/database/prisma"
import { appError } from "@/utils/appError"

export class WorkSpaceMemberController {
    async update(request: Request, response: Response) {
        const { role } = z.object({ role: z.enum(["Admin", "Member"]) }).parse(request.body)
        await changeMember(request, role)
        return response.status(204).send()
    }

    async remove(request: Request, response: Response) {
        await changeMember(request)
        return response.status(204).send()
    }
}

async function changeMember(request: Request, role?: "Admin" | "Member") {
    const { workSpaceId, userId } = z.object({
        workSpaceId: z.string().uuid(), userId: z.string().uuid()
    }).parse(request.params)
    if (!request.user) throw new appError("Usuário não autenticado", 401)
    const actorId = request.user.id

    await prisma.$transaction(async tx => {
        // Serializa mudanças de membros para dois administradores não removerem o último simultaneamente.
        await tx.$queryRaw`SELECT id FROM "workSpace" WHERE id = ${workSpaceId} FOR UPDATE`
        const actor = await tx.workSpaceMember.findUnique({
            where: { userId_workSpaceId: { userId: actorId, workSpaceId } }
        })
        if (actor?.role !== "Admin") throw new appError("Somente administradores deste espaço podem realizar essa ação", 403)
        const member = await tx.workSpaceMember.findUnique({
            where: { userId_workSpaceId: { userId, workSpaceId } }, include: { user: true }
        })
        if (!member) throw new appError("Membro não encontrado neste espaço", 404)
        if (member.role === "Admin" && role !== "Admin") {
            const admins = await tx.workSpaceMember.count({ where: { workSpaceId, role: "Admin" } })
            if (admins <= 1) throw new appError("O espaço precisa manter pelo menos um administrador", 409)
        }
        if (role) {
            await tx.workSpaceMember.update({ where: { id: member.id }, data: { role } })
            return
        }
        await tx.teamsMembers.deleteMany({ where: { userId, team: { workSpaceId } } })
        await tx.workSpaceInvite.deleteMany({ where: {
            workSpaceId, acceptedAt: null, email: { equals: member.user.email, mode: "insensitive" }
        } })
        await tx.workSpaceMember.delete({ where: { id: member.id } })
    })
}
