import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router"
import { isAxiosError } from "axios"
import { useWorkspace } from "../context/WorkspaceContext"
import { api } from "../services/api"
import { Input } from "../components/input"
import { Button } from "../components/button"

export function Workspaces() {
    const { spaces, workspace, addWorkspace, selectWorkspace } = useWorkspace()
    const [name, setName] = useState("")
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState("")
    const navigate = useNavigate()
    async function create(event: FormEvent) {
        event.preventDefault()
        if (busy) return
        setBusy(true)
        setError("")
        try {
            const { data } = await api.post<{ id: string; name: string }>("/workspace", { name: name.trim() })
            addWorkspace({ ...data, workSpaceMembers: [{ role: "Admin" }] })
            navigate("/tasks")
        } catch (error) {
            setError(isAxiosError(error) ? error.response?.data?.message || "Não foi possível criar o espaço." : "Não foi possível criar o espaço.")
        } finally { setBusy(false) }
    }
    return <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
        <p className="mb-3 text-xs font-medium tracking-widest text-brand">SEU ESPAÇO DE TRABALHO</p>
        <h1 className="text-3xl font-semibold tracking-tight">{spaces.length ? "Seus espaços" : "Tudo começa com um espaço."}</h1>
        <p className="mt-3 text-sm leading-6 text-muted">Reúna suas equipes, pessoas e tarefas em um só lugar.</p>
        <div className="mt-8 grid items-start gap-6 lg:grid-cols-2">
            <section className="rounded-xl border border-line bg-surface p-6">
                <h2 className="text-lg font-semibold">{spaces.length ? "Criar outro espaço" : "Criar meu primeiro espaço"}</h2>
                <p className="mt-2 text-sm leading-6 text-muted">Dê um nome ao seu espaço. Você poderá convidar pessoas e criar equipes depois.</p>
                <form onSubmit={create} className="mt-6 space-y-5">
                    <Input label="Nome do espaço" placeholder="Ex.: Estúdio Aurora" value={name} onChange={e => setName(e.target.value)} minLength={3} required readOnly={busy} />
                    {error && <p role="alert" className="text-sm text-danger">{error}</p>}
                    <Button isLoading={busy} disabled={name.trim().length < 3}>{busy ? "Criando..." : "Criar espaço"}</Button>
                </form>
            </section>
            <section className="space-y-3">
                {spaces.length ? spaces.map(space => <button key={space.id} onClick={() => { selectWorkspace(space.id); navigate("/tasks") }} className="flex w-full items-center gap-4 rounded-xl border border-line bg-surface p-5 text-left transition hover:border-brand focus-visible:outline-2 focus-visible:outline-brand">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-light font-semibold text-brand">{space.name[0]?.toUpperCase()}</span>
                    <span className="min-w-0"><strong className="block truncate">{space.name}</strong><span className="text-xs text-muted">{space.workSpaceMembers[0]?.role === "Admin" ? "Administrador" : "Membro"}{workspace?.id === space.id ? " · Espaço atual" : ""}</span></span>
                </button>) : <>
                    {["Crie um espaço", "Monte sua equipe", "Comece suas tarefas"].map((title, i) => <div key={title} className="flex items-center gap-4 p-3"><span className="flex size-8 items-center justify-center rounded-full bg-brand-light text-sm text-brand">{i + 1}</span><p className="text-sm">{title}</p></div>)}
                    <p className="rounded-xl border border-line p-5 text-sm leading-6 text-muted"><strong className="block text-content">Recebeu um convite?</strong>Use o convite compartilhado pelo administrador para entrar no espaço da sua equipe.</p>
                </>}
            </section>
        </div>
    </main>
}
