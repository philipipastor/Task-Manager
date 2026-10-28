import { requireWorkSpaceMember } from "@/utils/requireWorkSpaceMember";
import { Request, Response } from "express";
import { z } from "zod"
import { prisma } from "@/database/prisma"
import { hash } from "bcrypt";
import { appError } from "@/utils/appError";

class UsersController {
    async create(request: Request, response: Response) {
        const bodySchema = z.object({
            name: z.string().min(3),
            email: z.string().trim().email().toLowerCase(),
            password: z.string().min(5),
        })

        const { name, email, password } = bodySchema.parse(request.body)

        const usedEmail = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } })

        if (usedEmail) {
            throw new appError("E-mail já foi cadastrado", 400)
        }

        const hashPassword = await hash(password, 8)

        const user = await prisma.user.create({
            data: { name, email, password: hashPassword }
        })

        const { password: _, ...userWith } = user

        response.status(201).json(userWith)
    }

    async index(request: Request, response: Response) {
        const querySchema = z.object({
            workSpaceId: z.string().uuid()
        })

        const { workSpaceId } = querySchema.parse(request.query)

        const member = await requireWorkSpaceMember(request.user?.id, workSpaceId)

        const user = await prisma.user.findMany({
            where: {
                workSpaceMembers: { some: { workSpaceId } },
                id: member.role === "Member" ? member.userId : undefined
            },
            select: {
                id: true,
                name: true,
                email: true,
                workSpaceMembers: {
                    where: { workSpaceId },
                    select: { role: true }
                },
                createdAt: true,
                updateAt: true,
            }
        })


        response.json(user.map(({ workSpaceMembers, ...userData }) => ({
            ...userData,
            role: workSpaceMembers[0].role
        })))
    }
}

export { UsersController }



