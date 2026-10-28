import { requireWorkSpaceMember } from "@/utils/requireWorkSpaceMember";
import { Request, Response } from "express"
import { z } from "zod"
import { prisma } from "@/database/prisma"
import { appError } from "@/utils/appError"

class TaskHistoryController {
    async index(request: Request, response: Response) {
        const paramsSchema = z.object({
            id: z.string().uuid()
        })

        const { id } = paramsSchema.parse(request.params)

        if (!request.user) {
            throw new appError("Usuário não autenticado", 401)
        }

        const task = await prisma.tasks.findUnique({
            where: { id }
        })

        if (!task) {
            throw new appError("Tarefa não encontrada", 404)
        }

        const member = await requireWorkSpaceMember(request.user.id, task.workSpaceId)

        if (
            member.role === "Member" &&
            task.assignedTo !== request.user.id
        ) {
            throw new appError("Essa tarefa não pertence a você", 403)
        }

        const history = await prisma.taskHistory.findMany({
            where: {
                taskId: id
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                changed_at: "desc"
            }
        })

        return response.json(history)
    }
}

export { TaskHistoryController }