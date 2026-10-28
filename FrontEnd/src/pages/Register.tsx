import { useForm } from "react-hook-form"
import { z } from "zod"
import { NavLink } from "react-router"
import { useNavigate } from "react-router"
import { AxiosError } from "axios"

import { useState } from "react"

import { Input } from "../components/input"
import { Button } from "../components/button"
import { zodResolver } from "@hookform/resolvers/zod"

import { api } from "../services/api"

const schema = z.object({
  name: z.string().trim().min(3),
  email: z.string().trim().email("Insira um e-mail válido"),
  password: z.string().min(5, "A senha deve conter no mínimo 5 caracteres")
})

type RegisterData = z.infer<typeof schema>

export function Register() {

  const [error, setError] = useState("")

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterData>({
    resolver: zodResolver(schema)
  })

  const navigate = useNavigate()

  async function onSubmit(data: RegisterData) {
    setError("")
    
    try {
      await api.post<RegisterData>("/users", data)
      if (sessionStorage.getItem("@TaskManager:invite")) {
        navigate("/login")
        return
      }
      if (confirm("Cadastro concluído com sucesso, deseja seguir para a página de login?")) {
        navigate("/login")
      }

    } catch (error) {
      console.log(error)

      if (error instanceof AxiosError) {
        setError(error.response?.data?.message || "Não foi possível cadastrar. Verifique sua conexão e tente novamente.")
        return
      }

      setError("Não foi possível cadastrar!")
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-page px-4 py-10 sm:px-6">
      <section className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-10">
        <p className="mb-3 text-sm font-semibold text-brand">Bem-vindo</p>

        <h1 id="register-title" className="text-3xl font-bold tracking-tight text-content">Crie sua conta.</h1>

        <p className="mt-2 text-sm text-muted">Suas tarefas, um passo de cada vez.</p>
        <form aria-busy={isSubmitting} className="mt-8 flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <Input
              readOnly={isSubmitting}
              label="Nome"
              type="text"
              placeholder="Seu nome"
              autoComplete="name"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
              className="aria-invalid:border-danger aria-invalid:focus:border-danger aria-invalid:focus:ring-danger/20"
              {...register("name")}
            />
            {errors.name && (
              <p id="name-error" role="alert" className="text-sm text-danger">
                {errors.name.message}
              </p>
            )}
          </div>

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

          <Button type="submit" isLoading={isSubmitting}>{isSubmitting ? "Cadastrando..." : "Criar conta"}</Button>
        </form>

        <NavLink to="/login" className="block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
          <p className="mt-6 text-center text-sm text-muted">Já tem conta? <span className="font-semibold text-brand transition-colors hover:text-brand-hover hover:underline">Entrar</span></p>
        </NavLink>

      </section>
    </main>

  )

}
