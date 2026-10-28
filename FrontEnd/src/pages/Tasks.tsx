import { useWorkspace } from "../context/WorkspaceContext";
import { useState, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router"

import { TaskCard } from "../components/ticketCard"
import { Select } from "../components/select"
import { Button } from "../components/button"

import { type Task } from "../types/task"
import { statusOptions } from "../utils/statusOptions"

import iconMais from "../assets/mais.png"

import { api } from "../services/api"

export function TaskList() {
    const { workspace } = useWorkspace()
    const navigate = useNavigate()

    const [taskCount, setTaskCount] = useState(0)
    const [tasks, setTasks] = useState<Task[]>([])
    const [searchParams, setSearchParams] = useSearchParams()

    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        let cancelled = false
        async function fetchTasks() {
            setIsLoading(true)
            setError("")
            try {
                const response = await api.get<Task[]>("/tasks", {
                    params: { workSpaceId: workspace!.id, status: searchParams.get("status") || undefined }
                })
                if (!cancelled) {
                    setTasks(response.data)
                    setTaskCount(response.data.length)
                }
            } catch {
                if (!cancelled) setError("Não foi possível carregar as tarefas. Tente novamente.")
            } finally {
                if (!cancelled) setIsLoading(false)
            }
        }
        fetchTasks()
        return () => { cancelled = true }
    }, [searchParams, workspace?.id])

    return (
        <main className="min-h-svh bg-page px-4 py-8 sm:px-8">
            <section className="mx-auto w-full max-w-5xl">
                <div className="relative sm:pr-48 [&>div]:mt-6 sm:[&>div]:absolute sm:[&>div]:right-0 sm:[&>div]:top-8 sm:[&>div]:mt-0 [&_button]:h-11">
                    <p className="mb-3 text-xs font-medium uppercase tracking-widest text-muted">{workspace?.name}</p>

                    <h1 id="task-title" className="text-2xl font-semibold tracking-tight text-content">Minhas tarefas</h1>

                    <p className="mt-2 text-sm text-muted">Um lugar para acompanhar o que precisa ser feito</p>
                    
                    <Button type="button" onClick={() => navigate("/newTask")}>
                        <img alt="" aria-hidden="true" src={iconMais} />
                        Nova tarefa
                    </Button>
                </div>


                <div className="mt-9">
                    <p className="mb-2 text-sm font-medium text-content">Status</p>
                    <div className="flex items-center gap-5 [&>select]:h-11 [&>select]:max-w-48 [&>select]:text-sm [&>select]:font-medium">
                        <Select
                            options={statusOptions}
                            disabled={isLoading}
                            value={searchParams.get("status") ?? ""}
                            onChange={(event) => {
                                setSearchParams((params) => {
                                    const next = new URLSearchParams(params);

                                    if (event) {
                                        next.set("status", event);
                                    } else {
                                        next.delete("status");
                                    }

                                    return next;
                                });
                            }}
                        />
                        <span className="shrink-0 text-sm text-muted after:content-['_tarefas']">{isLoading ? "..." : taskCount}</span>
                    </div>
                </div>


                <div className="mt-5 flex flex-col gap-2.5">
                    {isLoading ? (
                        <p role="status" className="py-6 text-sm text-muted">Carregando tarefas...</p>
                    ) : error ? (
                        <p role="alert" className="py-6 text-sm text-danger">{error}</p>
                    ) : tasks.length === 0 ? (
                        <p className="py-6 text-sm text-muted">Nenhuma tarefa encontrada.</p>
                    ) : tasks.map((task) => (
                        <button key={task.id} onClick={() => navigate(`/tasks/${task.id}`)}>
                            <TaskCard key={task.id} task={task} />
                        </button>
                    ))}
                </div>


            </section>
        </main >
    )
}
