import { z } from "zod"
import { errorHandling } from "../middleware/errorHandling"
import { appError } from "../utils/appError"

const response = () => { const res: any = {}; res.status = jest.fn().mockReturnValue(res); res.json = jest.fn(); return res }

function handle(error: unknown) {
    const res = response()
    errorHandling(error, {} as any, res, jest.fn())
    return res
}

afterEach(() => jest.restoreAllMocks())

test("erro inesperado registra o detalhe no log e não o expõe ao cliente", () => {
    const logError = jest.spyOn(console, "error").mockImplementation(() => {})
    const error = new Error("The column `users.role` does not exist in the current database.")

    const res = handle(error)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ message: "Erro interno do servidor" })
    expect(logError).toHaveBeenCalledWith(error)
})

test("appError mantém o status e a mensagem", () => {
    const res = handle(new appError("E-mail ou senha inválidos", 401))

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ message: "E-mail ou senha inválidos" })
})

test("ZodError continua respondendo 400", () => {
    const result = z.object({ email: z.string() }).safeParse({})

    const res = handle(result.error)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Validation error" }))
})
