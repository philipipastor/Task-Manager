import { Request, Response, NextFunction } from "express";
import { appError } from "@/utils/appError";
import { verify } from "jsonwebtoken";
import { authConfig } from "@/configs/auth";

export function ensureAuthenticated(request: Request, response: Response, next: NextFunction) {

    const header = request.headers.authorization

    if (!header) {
        throw new appError("Token não informado", 401)
    }
    try {
        const [bearer, token] = header.split(" ")

        if (bearer !== "Bearer" || !token) {
            throw new appError("Token inválido", 401)
        }

        const payload = verify(token, authConfig.jwt.secret)

        if (typeof payload === "string" || !payload.sub) {
            throw new appError("Token inválido", 401);
        }

        request.user = { id: payload.sub }

        return next()

    } catch (error) {
        throw new appError("Token inválido", 401)
    }

}