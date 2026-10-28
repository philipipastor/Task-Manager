import { requireWorkSpaceMember } from "@/utils/requireWorkSpaceMember";
import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "@/database/prisma";
import { appError } from "@/utils/appError";

class TeamsController {
    async create(request: Request, response: Response) {
        const bodySchema = z.object({
            name: z.string().min(3),
            description: z.string().optional(),
            workSpaceId: z.string().uuid()
        })

        const { name, description, workSpaceId } = bodySchema.parse(request.body)

        await requireWorkSpaceMember(request.user?.id, workSpaceId, true)

        const team = await prisma.teams.create({ data: { name, description, workSpaceId } })

        response.status(201).json(team)
    }

    async index(request: Request, response: Response) {
        const querySchema = z.object({
            workSpaceId: z.string().uuid()
        })

        const { workSpaceId } = querySchema.parse(request.query)

        const member = await requireWorkSpaceMember(request.user?.id, workSpaceId)

        const teams = await prisma.teams.findMany({
            where: {
                workSpaceId,
                ...(member.role === "Member" ? {
                    active: true,
                    teamsMembers: { some: { userId: member.userId } }
                } : {})
            },
            include: { _count: { select: { teamsMembers: true } } }
        })
        return response.json(teams)
    }

    async update(request: Request, response: Response) {
        const bodySchema = z.object({
            name: z.string().min(3),
            description: z.string().optional()
        })

        const paramsSchema = z.object({
            id: z.string().uuid()
        })

        const { id } = paramsSchema.parse(request.params)
        const { name, description } = bodySchema.parse(request.body)

        const team = await prisma.teams.findUnique({ where: { id } })

        if (!team) {
            throw new appError("Equipe não encontrada", 404)
        }

        await requireWorkSpaceMember(request.user?.id, team.workSpaceId, true)

        const teams = await prisma.teams.update({ where: { id }, data: { name, description } })

        response.json(teams)
    }

    async desactive(request: Request, response: Response) {
        const paramsSchema = z.object({
            id: z.string().uuid()
        })

        const { id } = paramsSchema.parse(request.params)

        const teams = await prisma.teams.findUnique({ where: { id } })

        if (!teams) {
            throw new appError("Equipe não encontrada", 404)
        }

        await requireWorkSpaceMember(request.user?.id, teams.workSpaceId, true)

        if (!teams.active) {
            throw new appError("Equipe já está inativa", 400)
        }

        await prisma.teams.update({ where: { id }, data: { active: false } })

        response.json()
    }

    async active(request: Request, response: Response) {
        const paramsSchema = z.object({
            id: z.string().uuid()
        })

        const { id } = paramsSchema.parse(request.params)

        const team = await prisma.teams.findUnique({
            where: { id }
        })

        if (!team) {
            throw new appError("Equipe não encontrada", 404)
        }

        await requireWorkSpaceMember(request.user?.id, team.workSpaceId, true)

        if (team.active) {
            throw new appError("Equipe já está ativa", 409)
        }

        await prisma.teams.update({
            where: { id },
            data: {
                active: true
            }
        })

        return response.json()
    }
}

export { TeamsController }
