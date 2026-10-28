import { requireWorkSpaceMember } from "@/utils/requireWorkSpaceMember";
import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "@/database/prisma";
import { appError } from "@/utils/appError";

import { UpdateTaskService } from "@/services/updateTaskService";

class TaskController {
    async create(request: Request, response: Response) {
        const bodySchema = z.object({
            title: z.string().min(3),
            description: z.string().min(3),
            priority: z.enum(["Alta", "Média", "Baixa"]),
            assigned_to: z.string().uuid(),
            team_id: z.string().uuid(),
            workSpaceId: z.string().uuid()
        })

        const { title, description, priority, assigned_to, team_id, workSpaceId } = bodySchema.parse(request.body)

        if (!request.user) {
            throw new appError("Usuário não autenticado", 401)
        }

        const member = await requireWorkSpaceMember(request.user.id, workSpaceId)

        if (member.role === "Member" && assigned_to !== request.user.id) {
            throw new appError("Você só pode criar tarefas para si mesmo", 403)
        }

        const team = await prisma.teams.findUnique({ where: { id: team_id } })

        if (!team || team.workSpaceId !== workSpaceId) {
            throw new appError("Equipe não encontrada neste espaço", 404)
        }
        if (!team.active) {
            throw new appError("Não é possível criar tarefas em uma equipe inativa", 409)
        }

        const assignedMember = await prisma.workSpaceMember.findUnique({
            where: { userId_workSpaceId: { userId: assigned_to, workSpaceId } }
        })
        if (!assignedMember) {
            throw new appError("O responsável não pertence a esse espaço", 400)
        }

        const sameEquip = await prisma.teamsMembers.findFirst({
            where: { userId: assigned_to, teamId: team_id }
        })
        if (!sameEquip) {
            throw new appError("O responsável não pertence à equipe informada", 400)
        }

        const task = await prisma.tasks.create({
            data: { title, description, priority, assignedTo: assigned_to, teamId: team_id, workSpaceId },
            include: { team: { select: { name: true } }, user: { select: { name: true } } }
        })

        response.status(201).json(task)
    }

    async index(request: Request, response: Response) {
        const querySchema = z.object({
            workSpaceId: z.string().uuid(),
            status: z.enum(["Pendente", "Em_progresso", "Concluído"]).optional()
        })

        const { workSpaceId, status } = querySchema.parse(request.query)

        const member = await requireWorkSpaceMember(request.user?.id, workSpaceId)

        const tasks = await prisma.tasks.findMany({
            where: {
                workSpaceId, status,
                assignedTo: member.role === "Member" ? member.userId : undefined
            },
            include: { team: { select: { name: true } }, user: { select: { name: true } } }
        })
        return response.json(tasks)
    }

    async update(request: Request, response: Response) {
        const paramsSchema = z.object({
            id: z.string().uuid()
        })

        const bodySchema = z.object({
            status: z.enum(["Pendente", "Em_progresso", "Concluído"])
        })

        const { id } = paramsSchema.parse(request.params)
        const { status } = bodySchema.parse(request.body)

        const task = await prisma.tasks.findUnique({ where: { id } })

        if (!task) {
            throw new appError("Tarefa não existe", 404)
        }

        if (!request.user) {
            throw new appError("Usuário não autenticado", 401)
        }

        const member = await requireWorkSpaceMember(request.user.id, task.workSpaceId)

        if (member.role === "Member" && task.assignedTo !== request.user.id) {
            throw new appError("Essa tarefa não pertence a você", 403)
        }

        const updateTaskService = new UpdateTaskService()

        const updatedTask = await updateTaskService.execute({
            taskId: id,
            oldStatus: task.status,
            newStatus: status,
            changedBy: request.user.id
        })

        return response.json({
            message: "Tarefa atualizada com sucesso",
            task: updatedTask
        })
    }

    async remove(request: Request, response: Response) {
        const paramsSchema = z.object({
            id: z.string().uuid()
        })

        const { id } = paramsSchema.parse(request.params)

        const task = await prisma.tasks.findUnique({ where: { id } })

        if (!task) {
            throw new appError("Tarefa não existe!", 404)
        }

        if (!request.user) {
            throw new appError("Usuário não autenticado", 401)
        }

        const member = await requireWorkSpaceMember(request.user.id, task.workSpaceId)

        if (member.role === "Member" && task.assignedTo !== request.user.id) {
            throw new appError("Essa tarefa não pertence a você", 403)
        }

        await prisma.tasks.delete({ where: { id } })

        response.json("task deletada")
    }

    async show(request: Request, response: Response) {
        const bodySchema = z.object({
            id: z.string().uuid()
        })

        const { id } = bodySchema.parse(request.params)

        const task = await prisma.tasks.findUnique({
            where: { id },
            include: { team: { select: { name: true } }, user: { select: { name: true } } }
        })

        if (!task) {
            throw new appError("Tarefa não existe", 404)
        }

        const member = await requireWorkSpaceMember(request.user?.id, task.workSpaceId)

        if (member.role === "Member" && member.userId !== task.assignedTo) {
            throw new appError("Essa tarefa não pertence a você", 403)
        }

        return response.json(task)
    }
}

export { TaskController }
