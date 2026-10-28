import { requireWorkSpaceMember } from "@/utils/requireWorkSpaceMember";
import { appError } from "@/utils/appError";
import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "@/database/prisma";

class MembersTeamsController {
    async create(request: Request, response: Response) {
        const bodySchema = z.object({
            user_id: z.string().uuid(),
            team_id: z.string().uuid()
        })

        const { user_id, team_id } = bodySchema.parse(request.body)

        const team = await prisma.teams.findUnique({ where: { id: team_id } })
        if (!team) {
            throw new appError("Equipe não encontrada", 404)
        }

        await requireWorkSpaceMember(request.user?.id, team.workSpaceId, true)

        const invitedMember = await prisma.workSpaceMember.findUnique({
            where: { userId_workSpaceId: { userId: user_id, workSpaceId: team.workSpaceId } }
        })
        if (!invitedMember) {
            throw new appError("O usuário precisa pertencer ao espaço antes de entrar na equipe", 400)
        }

        const user = await prisma.user.findUnique({ where: { id: user_id } })
        if (!user) {
            throw new appError("Usuário não encontrado", 404)
        }

        const memberExist = await prisma.teamsMembers.findFirst({
            where: { userId: user_id, teamId: team_id }
        })

        if (memberExist) {
            throw new appError("Usuário já pertence a equipe", 400)
        }

        const membersTeams = await prisma.teamsMembers.create({ data: { userId: user_id, teamId: team_id } })

        response.status(201).json({
            message: "Membro adicionado a equipe",
            membersTeams,
            user: { id: user.id, name: user.name, email: user.email },
            team: { team_id: team.id, name: team.name }
        })
    }

    async remove(request: Request, response: Response) {
        const paramsSchema = z.object({
            team_id: z.string().uuid()
        })

        const bodySchema = z.object({
            user_id: z.string().uuid()
        })

        const { user_id } = bodySchema.parse(request.body)
        const { team_id } = paramsSchema.parse(request.params)

        const team = await prisma.teams.findUnique({ where: { id: team_id } })
        if (!team) {
            throw new appError("Equipe não encontrada", 404)
        }
        await requireWorkSpaceMember(request.user?.id, team.workSpaceId, true)

        const sameEquip = await prisma.teamsMembers.findFirst({ where: { userId: user_id, teamId: team_id } })

        if(!sameEquip){
            throw new appError("Esse usuário não pertence a essa equipe", 400)
        }

        await prisma.teamsMembers.deleteMany({ where: { userId: user_id, teamId: team_id } })

        response.json("Usuário removido do time")
    }

    async index(request: Request, response: Response) {
        const paramsSchema = z.object({
            team_id: z.string().uuid()
        })

        const { team_id } = paramsSchema.parse(request.params)

        const team = await prisma.teams.findUnique({ where: { id: team_id } })
        if (!team) {
            throw new appError("Equipe não encontrada", 404)
        }

        const member = await requireWorkSpaceMember(request.user?.id, team.workSpaceId)

        if (member.role === "Member") {
            const teamMember = await prisma.teamsMembers.findFirst({
                where: { userId: member.userId, teamId: team_id }
            })
            if (!teamMember) {
                throw new appError("Você não pertence a essa equipe", 403)
            }
        }

        const members = await prisma.teamsMembers.findMany({
            where:
                { teamId: team_id },
            include:
                { user: { select: { id: true, name: true, email: true } } }
        })

        response.json(members)
    }
}

export { MembersTeamsController }