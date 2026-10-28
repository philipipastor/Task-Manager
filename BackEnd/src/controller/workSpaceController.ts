import { Request, Response } from "express";

import { z } from "zod";
import { prisma } from "@/database/prisma"
import { appError } from "@/utils/appError";

class WorkSpaceController {
    async create(request: Request, response: Response) {
        if (!request.user) {
            throw new appError("Usuário não autenticado", 401);
        }

        const bodySchema = z.object({
            name: z.string().trim().min(3)
        })

        const { name } = bodySchema.parse(request.body)

        const workspace = await prisma.workSpace.create({
            data: {
                name,
                workSpaceMembers: {
                    create: { userId: request.user.id, role: "Admin" }
                }
            }
        })

        response.status(201).json(workspace)
    }

    async index(request: Request, response: Response) {
        if (!request.user) {
            throw new appError("Usuário não autenticado", 401)
        }

        const workSpaces = await prisma.workSpace.findMany({
            where: {
                workSpaceMembers: {
                    some: {
                        userId: request.user.id
                    }
                }
            },
            include: {
                workSpaceMembers: {
                    where: {
                        userId: request.user.id
                    },
                    select: {
                        role: true
                    }
                }
            }
        })

        response.json(workSpaces)
    }
}

export { WorkSpaceController }