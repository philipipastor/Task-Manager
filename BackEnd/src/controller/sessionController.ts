import { Request, Response } from "express";
import { z } from "zod"
import { prisma } from "@/database/prisma"
import { appError } from "@/utils/appError";
import { compare } from "bcrypt";
import { authConfig } from "@/configs/auth";
import { sign } from "jsonwebtoken";

class SessionController {
    async create(request: Request, response: Response) {
        const bodySchema = z.object({
            email: z.string().trim().email().toLowerCase(),
            password: z.string().min(5, "Senha deve conter no mínimo 5 caracteres")
        })

        const { email, password } = bodySchema.parse(request.body)

        const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } })

        if (!user) {
            throw new appError("E-mail ou senha inválidos", 401)
        }

        const isPassword = await compare(password, user.password)

        if (!isPassword) {
            throw new appError("E-mail ou senha inválidos", 401)
        }

        const { secret, expiresIn } = authConfig.jwt

        const token = sign({}, secret, {expiresIn, subject: user.id})

        const {password: _, ...dataUser} = user

        response.json({dataUser, token})

    }
}

export { SessionController }
