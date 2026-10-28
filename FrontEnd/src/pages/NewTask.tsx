import { useWorkspace } from "../context/WorkspaceContext";
import { Input } from "../components/input";
import { Button } from "../components/button";
import { Select } from "../components/select";
import { TaskAssignmentFields } from "../components/TaskAssignmentFields";
import { useTaskOptions } from "../hook/useTaskOptions";

import { useAuth } from "../hook/useAuth";

import { api } from "../services/api";


import backArrow from "../assets/seta-esquerda.png"

import { priorityOptions } from "../utils/priorityOptions";

import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, NavLink } from "react-router";
import { useForm, Controller } from "react-hook-form"
import { AxiosError } from "axios";
import { useState, useEffect } from "react";

const schema = z.object({
    title: z.string().trim().min(3, "Informe pelo menos 3 caracteres"),
    description: z.string().trim().min(3, "Informe pelo menos 3 caracteres"),
    priority: z.enum(["Alta", "Média", "Baixa"]),
    assigned_to: z.string().uuid("Selecione um usuário"),
    team_id: z.string().uuid("Selecione um time")
})

export type TaskData = z.infer<typeof schema>

export function NewTask() {
    const { user } = useAuth()
    const { workspace, isAdmin } = useWorkspace()

    const navigate = useNavigate()

    const { register, handleSubmit, control, watch, setValue, formState: { errors, isSubmitting } } = useForm<TaskData>({
        resolver: zodResolver(schema),
        defaultValues: {
            title: "",
            description: "",
            assigned_to: isAdmin ? "" : user?.id ?? "",
            team_id: ""
        }
    })

    const [error, setError] = useState("")
    const selectedTeamId = watch("team_id")
    const options = useTaskOptions(isAdmin, selectedTeamId)
    const { teamList, availableUsers, loadingOptions, loadingMembers, optionsError, membersError } = options

    function getErrorMessage(error: unknown, fallback: string) {
        if (error instanceof AxiosError && typeof error.response?.data?.message === "string") {
            return error.response.data.message
        }
        return fallback
    }

    async function onSubmit(data: TaskData) {
        setError("")

        if (loadingOptions || optionsError || !teamList.some((team) => team.id === data.team_id)) {
            setError("Selecione uma equipe disponível antes de criar a tarefa.")
            return
        }

        if (isAdmin && (membersError || loadingMembers || !availableUsers.some((item) => item.id === data.assigned_to))) {
            setError("Selecione um responsável que pertença à equipe escolhida.")
            return
        }

        try {
            await api.post<TaskData>("/tasks", {
                ...data,
                workSpaceId: workspace!.id,
                assigned_to: isAdmin ? data.assigned_to : user?.id
            })
            navigate("/tasks")
        } catch (error) {
            setError(getErrorMessage(error, "Não foi possível criar sua tarefa. Tente novamente."))
        }

    }

    useEffect(() => {
        if (!isAdmin) setValue("assigned_to", user?.id ?? "")
    }, [isAdmin, user?.id, setValue])

    function handleTeamChange() {
        setError("")
        options.resetMembers()
        if (isAdmin) setValue("assigned_to", "", { shouldDirty: true })
    }

    return (
        <main className="min-h-svh bg-page px-4 py-8 sm:px-6 sm:py-12">
            <section className="mx-auto w-full max-w-2xl rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-10">
                <NavLink to="/tasks" className="inline-block rounded-sm transition-colors hover:text-brand-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
                    <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-brand">
                        <img src={backArrow} alt="" aria-hidden="true" className="size-4 shrink-0 object-contain invert" />
                        Voltar às tarefas
                    </p>
                </NavLink>

                <h1 className="text-3xl font-bold tracking-tight text-content">Nova tarefa</h1>
                <p className="mt-2 text-sm text-muted">Defina o que fazer e quem vai cuidar disso.</p>

                <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
                    <Input
                        readOnly={isSubmitting}
                        label="Título"
                        type="text"
                        placeholder="Ex: Criar tela de login"
                        aria-invalid={!!errors.title}
                        aria-describedby={errors.title ? "title-error" : undefined}
                        className="aria-invalid:border-danger aria-invalid:focus:border-danger aria-invalid:focus:ring-danger/20"
                        {...register("title")}
                    />
                    {errors.title && <p id="title-error" className="text-sm text-danger">{errors.title.message}</p>}

                    <Input
                        readOnly={isSubmitting}
                        label="Descrição"
                        type="text"
                        placeholder="Descreva o que pode ser feito"
                        aria-invalid={!!errors.description}
                        aria-describedby={errors.description ? "description-error" : undefined}
                        className="aria-invalid:border-danger aria-invalid:focus:border-danger aria-invalid:focus:ring-danger/20"
                        {...register("description")}
                    />
                    {errors.description && <p id="description-error" className="text-sm text-danger">{errors.description.message}</p>}

                    <div>
                    <label htmlFor="task-priority" className="mb-2 block text-sm font-medium text-content">Prioridade</label>
                    <Controller
                        name="priority"
                        control={control}
                        render={({ field }) => (
                            <Select
                                id="task-priority"
                                disabled={isSubmitting}
                                options={priorityOptions}
                                value={field.value ?? ""}
                                onChange={field.onChange} />
                        )}
                    />
                    </div>

                    {errors.priority && (
                        <p className="text-sm text-danger">
                            {errors.priority.message}
                        </p>
                    )}

                    <TaskAssignmentFields
                        control={control}
                        register={register}
                        errors={errors}
                        user={user}
                        isAdmin={isAdmin}
                        isSubmitting={isSubmitting}
                        selectedTeamId={selectedTeamId}
                        options={options}
                        onTeamChange={handleTeamChange}
                    />

                    <p className="mt-2 text-xs text-muted">Status inicial: Pendente</p>

                    {(error || optionsError || membersError) && (
                        <p role="alert" className="rounded-lg bg-danger-bg px-4 py-3 text-sm text-danger">{error || optionsError || membersError}</p>
                    )}

                    <div className="flex flex-wrap justify-end gap-3 [&>div:first-child>button]:border [&>div:first-child>button]:border-line [&>div:first-child>button]:bg-surface [&>div:first-child>button]:text-content">
                        <Button type="button" disabled={isSubmitting} onClick={() => navigate("/tasks")}>Cancelar</Button>
                        <Button isLoading={isSubmitting} type="submit" disabled={isSubmitting || loadingOptions || !!optionsError || !selectedTeamId || (isAdmin && (loadingMembers || !!membersError || availableUsers.length === 0))}>
                            {isSubmitting ? "Criando..." : "Criar tarefa"}
                        </Button>
                    </div>
                </form>
            </section>

        </main>
    )
}
