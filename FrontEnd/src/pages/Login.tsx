import { useForm } from "react-hook-form"
import { z } from "zod"
import { NavLink, useNavigate } from "react-router"
import { AxiosError } from "axios"
import { useState, useEffect } from "react"

import { Input } from "../components/input"
import { Button } from "../components/button"
import { zodResolver } from "@hookform/resolvers/zod"

import { useAuth } from "../hook/useAuth"

import { api } from "../services/api"
import type { User } from "../types/user"

const schema = z.object({
    email: z.string().trim().email("Insira um e-mail válido"),
    password: z.string().min(5, "A senha deve conter no mínimo 5 caracteres")
})

type LoginData = z.infer<typeof schema>

export function Login() {
    const navigate = useNavigate()

    const auth = useAuth()

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginData>({
        resolver: zodResolver(schema)
    })

    const [error, setError] = useState("")

    const [sessionExpired, setSessionExpired] = useState(false)

    async function onSubmit(data: LoginData) {
        setError("")

        try {
            const response = await api.post<{ dataUser: User; token: string }>("/session", data)
            auth.signIn({ user: response.data.dataUser, token: response.data.token })
            const pendingInvite = sessionStorage.getItem("@TaskManager:invite")
            const destination = pendingInvite && /^[a-f0-9]{64}$/.test(pendingInvite)
                ? `/invite?token=${pendingInvite}`
                : "/tasks"
            navigate(destination, { replace: true })

        } catch (error) {
            console.log(error)

            if (error instanceof AxiosError) {
                setError(error.response?.data.message)
                return
            }

            setError("Não foi possível fazer login")
        }
    }

    useEffect(() => {
        const expired = sessionStorage.getItem(
            "@TaskManager:sessionExpired"
        )

        if (expired === "true") {
            setSessionExpired(true)

            sessionStorage.removeItem(
                "@TaskManager:sessionExpired"
            )
        }
    }, [])

    return (
        <main className="flex min-h-svh items-center justify-center bg-page px-4 py-10 sm:px-6">
            <section className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-10">
                <p className="mb-3 text-sm font-semibold text-brand">Bem-vindo de volta</p>

                <h1 id="login-title" className="text-3xl font-bold tracking-tight text-content">Organize seu dia.</h1>

                <p className="mt-2 text-sm text-muted">Suas tarefas, um passo de cada vez.</p>

                {sessionExpired && (
                    <p
                        role="alert"
                        className="mt-6 rounded-lg border border-danger/15 bg-danger-bg px-4 py-3 text-center text-sm text-danger"
                    >
                        Sua sessão expirou. Faça login novamente para continuar.
                    </p>
                )}

                <form aria-busy={isSubmitting} className="mt-8 flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
                    <div className="flex flex-col gap-2">
                        <Input
                          readOnly={isSubmitting}
                            label="E-mail"
                            type="email"
                            placeholder="seu@email.com"
                            autoComplete="email"
                            aria-invalid={!!errors.email}
                            aria-describedby={errors.email ? "email-error" : undefined}
                            className="aria-invalid:border-danger aria-invalid:focus:border-danger aria-invalid:focus:ring-danger/20"
                            {...register("email")}
                        />
                        {errors.email && (
                            <p id="email-error" role="alert" className="text-sm text-danger">
                                {errors.email.message}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        <Input
                          readOnly={isSubmitting}
                            label="Senha"
                            type="password"
                            placeholder="Digite sua senha"
                            autoComplete="current-password"
                            aria-invalid={!!errors.password}
                            aria-describedby={errors.password ? "password-error" : undefined}
                            className="aria-invalid:border-danger aria-invalid:focus:border-danger aria-invalid:focus:ring-danger/20"
                            {...register("password")}
                        />
                        {errors.password && (
                            <p id="password-error" role="alert" className="text-sm text-danger">
                                {errors.password.message}
                            </p>
                        )}
                    </div>

                    {error && (
                        <p role="alert" className="rounded-lg border border-danger/15 bg-danger-bg px-4 py-3 text-center text-sm text-danger">{error}</p>
                    )}

                    <Button type="submit" isLoading={isSubmitting}>{isSubmitting ? "Entrando..." : "Entrar"}</Button>
                </form>

                <NavLink to="/cadastro" className="block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
                    <p className="mt-6 text-center text-sm text-muted">Ainda não tem conta? <span className="font-semibold text-brand transition-colors hover:text-brand-hover hover:underline">Criar conta</span></p>
                </NavLink>

            </section>
        </main>

    )

}
