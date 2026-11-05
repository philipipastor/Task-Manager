import { NextFunction, Request, Response} from "express"
import { appError } from "@/utils/appError"
import { ZodError } from "zod"

export function errorHandling(error: any, request: Request, response: Response, next: NextFunction){
    if(error instanceof appError){
        return response.status(error.statusCode).json({message: error.message})
    }

    if(error instanceof ZodError){
        return response.status(400).json({message: "Validation error", issues: error.format()})
    }

    console.error(error)

    return response.status(500).json({message: "Erro interno do servidor"})
}
