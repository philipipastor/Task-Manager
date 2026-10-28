import { useEffect, useState } from "react"
import { isAxiosError } from "axios"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useWorkspace } from "../context/WorkspaceContext"
import { useAuth } from "../hook/useAuth"
import { api } from "../services/api"
import { Button } from "../components/button"
import { Input } from "../components/input"

type Person = { id: string; name: string; email: string; role: "Admin" | "Member" }
type PendingInvite = { id: string; email: string; expiresAt: string }
type Invite = { link: string; email: string; expiresAt: string }
const schema = z.object({ email: z.string().trim().email("Informe um e-mail válido.") })
type InviteData = z.infer<typeof schema>

export function People() {
    const { workspace, isAdmin } = useWorkspace()
    return <PeopleContent key={workspace?.id} workSpaceId={workspace?.id} workspaceName={workspace?.name} isAdmin={isAdmin} />
}

function PeopleContent({ workSpaceId, workspaceName, isAdmin }: {
    workSpaceId?: string; workspaceName?: string; isAdmin: boolean
}) {
    const { user } = useAuth()
    const { retry } = useWorkspace()
    const [pending, setPending] = useState<PendingInvite[]>([])
    const [pendingError, setPendingError] = useState("")
    const [pendingLoading, setPendingLoading] = useState(true)
    const [actionBusy, setActionBusy] = useState("")
    const [actionError, setActionError] = useState("")
    const [people, setPeople] = useState<Person[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [attempt, setAttempt] = useState(0)
    const [invite, setInvite] = useState<Invite | null>(null)
    const [inviteError, setInviteError] = useState("")
    const [copyMessage, setCopyMessage] = useState("")
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<InviteData>({
        resolver: zodResolver(schema), defaultValues: { email: "" }
    })

    useEffect(() => {
        if (!workSpaceId || !isAdmin) { setLoading(false); return }
        let cancelled = false
        setLoading(true)
        setError("")
        api.get<Person[]>("/users", { params: { workSpaceId } }).then(({ data }) => {
            if (!cancelled) setPeople(data)
        }).catch(() => {
            if (!cancelled) setError("Não foi possível carregar as pessoas. Tente novamente.")
        }).finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [workSpaceId, isAdmin, attempt])

    useEffect(() => {
        if (!workSpaceId || !isAdmin) return
        let cancelled = false
        setPendingLoading(true)
        setPendingError("")
        api.get<PendingInvite[]>(`/workspace/${workSpaceId}/invites`).then(({ data }) => {
            if (!cancelled) setPending(data)
        }).catch(() => {
            if (!cancelled) setPendingError("Não foi possível carregar os convites.")
        }).finally(() => { if (!cancelled) setPendingLoading(false) })
        return () => { cancelled = true }
    }, [workSpaceId, isAdmin, attempt])

    async function manageMember(person: Person, role?: "Admin" | "Member") {
        if (actionBusy) return
        const message = role ? `Alterar a permissão de ${person.name} para ${role === "Admin" ? "administrador" : "membro"}?`
            : `Remover ${person.name} deste espaço e das equipes? As tarefas e o histórico serão preservados.`
        if (!window.confirm(message)) return
        setActionBusy(person.id)
        setActionError("")
        try {
            const url = `/workspace/${workSpaceId}/members/${person.id}`
            if (role) await api.patch(url, { role })
            else await api.delete(url)
            if (person.id === user?.id) retry()
            else setAttempt(value => value + 1)
        } catch (error) {
            setActionError(isAxiosError(error) ? error.response?.data?.message || "Não foi possível atualizar o membro." : "Não foi possível atualizar o membro.")
        } finally { setActionBusy("") }
    }

    async function cancelInvite(item: PendingInvite) {
        if (actionBusy || !window.confirm(`Cancelar o convite para ${item.email}? O link deixará de funcionar.`)) return
        setActionBusy(item.id)
        setActionError("")
        try {
            await api.delete(`/workspace/${workSpaceId}/invites/${item.id}`)
            setInvite(null)
            setAttempt(value => value + 1)
        } catch (error) {
            setActionError(isAxiosError(error) ? error.response?.data?.message || "Não foi possível cancelar o convite." : "Não foi possível cancelar o convite.")
        } finally { setActionBusy("") }
    }

    async function createInvite(data: InviteData) {
        if (!workSpaceId || !isAdmin) return
        setInviteError("")
        setInvite(null)
        setCopyMessage("")
        try {
            const response = await api.post<{ token: string; expiresAt: string }>(
                `/workspace/${workSpaceId}/invites`, data
            )
            const url = new URL("/invite", window.location.origin)
            url.searchParams.set("token", response.data.token)
            setInvite({ link: url.toString(), email: data.email, expiresAt: response.data.expiresAt })
            setAttempt(value => value + 1)
        } catch (error) {
            const message = isAxiosError(error) ? error.response?.data?.message : undefined
            setInviteError(typeof message === "string" ? message : "Não foi possível gerar o convite. Tente novamente.")
        }
    }

    async function copyLink() {
        if (!invite) return
        try {
            await navigator.clipboard.writeText(invite.link)
            setCopyMessage("Link copiado!")
        } catch {
            setCopyMessage("Não foi possível copiar automaticamente. Selecione o link acima e copie manualmente.")
        }
    }

    if (!workSpaceId) return <p className="p-8 text-sm text-muted">Selecione um espaço para visualizar as pessoas.</p>
    if (!isAdmin) return <p className="p-8 text-sm text-muted">Esta área é exclusiva para administradores do espaço.</p>

    return <main className="mx-auto w-full max-w-6xl px-5 py-9 sm:px-8 sm:py-12">
        <p className="mb-3 text-xs font-medium uppercase tracking-widest text-muted">{workspaceName}</p>
        <h1 className="text-2xl font-semibold tracking-tight text-content sm:text-3xl">Pessoas e convites</h1>
        <p className="mt-2 text-sm leading-6 text-muted">Traga as pessoas certas para trabalhar com você.</p>

        {actionError && <p role="alert" className="mt-5 rounded-lg bg-danger-bg p-3 text-sm text-danger">{actionError}</p>}
        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1.1fr_1fr]">
            <section aria-labelledby="people-title" aria-busy={loading} className="min-w-0 rounded-xl border border-line bg-surface p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-5">
                    <h2 id="people-title" className="text-base font-semibold">Pessoas do espaço
                        {!loading && !error && <span className="ml-2 text-sm font-normal text-muted">({people.length})</span>}
                    </h2>
                    <button type="button" disabled={loading} onClick={() => setAttempt(value => value + 1)} className="rounded px-1 py-1 text-xs font-medium text-brand hover:text-brand-hover focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-50">Atualizar lista</button>
                </div>
                {loading ? <p role="status" className="py-10 text-center text-sm text-muted">Carregando pessoas...</p>
                    : error ? <div className="py-7"><p role="alert" className="text-sm text-danger">{error}</p><button type="button" onClick={() => setAttempt(value => value + 1)} className="mt-3 rounded text-sm font-medium text-brand focus-visible:outline-2 focus-visible:outline-brand">Tentar novamente</button></div>
                    : people.length === 0 ? <p className="py-10 text-center text-sm text-muted">Nenhuma pessoa encontrada neste espaço.</p>
                    : <ul className="divide-y divide-line">{people.map(person => <li key={person.id} className="flex flex-wrap items-center gap-3 py-5">
                        <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full border border-brand/25 bg-brand-light text-sm font-medium text-brand">{person.name.trim().split(/\s+/).slice(0, 2).map(name => name[0]).join("").toUpperCase()}</span>
                        <div className="min-w-0 flex-1">
                            <p className="wrap-break-word text-sm font-medium text-content">{person.name}{person.id === user?.id && <span className="ml-2 text-xs font-normal text-muted">Você</span>}</p>
                            <p className="mt-1 break-all text-xs text-muted">{person.email}</p>
                        </div>
                        <span className={`rounded-md px-2.5 py-1 text-xs ${person.role === "Admin" ? "bg-brand-light text-brand" : "bg-page text-muted"}`}>{person.role === "Admin" ? "Administrador" : "Membro"}</span>
                    <div className="flex w-full flex-wrap justify-end gap-3 text-xs">
                            <button type="button" disabled={!!actionBusy || (person.role === "Admin" && people.filter(item => item.role === "Admin").length === 1)} onClick={() => manageMember(person, person.role === "Admin" ? "Member" : "Admin")} className="rounded border border-line px-3 py-2 text-brand hover:border-brand disabled:opacity-40">{actionBusy === person.id ? "Salvando..." : person.role === "Admin" ? "Tornar membro" : "Tornar administrador"}</button>
                            <button type="button" disabled={!!actionBusy || (person.role === "Admin" && people.filter(item => item.role === "Admin").length === 1)} onClick={() => manageMember(person)} className="rounded border border-line px-3 py-2 text-danger hover:border-danger disabled:opacity-40">Remover do espaço</button>
                        </div>
                    </li>)}</ul>}
                <p className="border-t border-line pt-4 text-xs leading-5 text-muted">As permissões valem apenas para este espaço. O último administrador não pode ser removido ou rebaixado.</p>
            </section>

            <section aria-labelledby="invite-title" className="min-w-0 rounded-xl border border-line bg-surface p-5 sm:p-6">
                <h2 id="invite-title" className="text-base font-semibold">Convide alguém</h2>
                <p className="mt-2 text-sm leading-6 text-muted">A pessoa entra como membro e depois pode ser adicionada a uma equipe.</p>
                <form onSubmit={handleSubmit(createInvite)} noValidate aria-busy={isSubmitting} className="mt-6 space-y-4">
                    <Input label="E-mail" type="email" placeholder="pessoa@email.com" autoComplete="email" readOnly={isSubmitting} aria-invalid={!!errors.email} aria-describedby={errors.email ? "invite-email-error" : undefined} {...register("email")} />
                    {errors.email && <p id="invite-email-error" role="alert" className="text-sm text-danger">{errors.email.message}</p>}
                    {inviteError && <p role="alert" className="rounded-lg bg-danger-bg p-3 text-sm text-danger">{inviteError}</p>}
                    <Button type="submit" isLoading={isSubmitting}>{isSubmitting ? "Gerando convite..." : "Gerar link de convite"}</Button>
                </form>

                {invite ? <div className="mt-6 rounded-lg border border-emerald-400/25 bg-emerald-400/5 p-4">
                    <p role="status" className="flex items-center gap-2 text-sm font-medium text-emerald-300">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></svg>
                        Link pronto para compartilhar
                    </p>
                    <p className="mt-2 break-all text-xs leading-5 text-muted">Convite para <span className="text-content">{invite.email}</span></p>
                    <label htmlFor="invite-link" className="sr-only">Link do convite</label>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                        <input id="invite-link" value={invite.link} readOnly onFocus={e => e.target.select()} className="h-10 min-w-0 flex-1 rounded-md border border-line bg-page px-3 text-xs text-content outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
                        <button type="button" onClick={copyLink} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-line bg-surface px-3 text-xs font-medium text-content transition hover:border-brand focus-visible:outline-2 focus-visible:outline-brand">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="8" y="8" width="12" height="13" rx="2" /><path d="M16 8V3H3v13h5" /></svg>
                            {copyMessage === "Link copiado!" ? "Copiado!" : "Copiar link"}
                        </button>
                    </div>
                    {copyMessage && <p role="status" className="mt-2 text-xs leading-5 text-muted">{copyMessage}</p>}
                    <p className="mt-3 text-xs leading-5 text-muted">Válido até {new Date(invite.expiresAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}.</p>
                </div> : <div className="mt-6 rounded-lg border border-dashed border-line px-4 py-4 text-xs leading-5 text-muted">O link aparecerá aqui após a geração. Copie e compartilhe com a pessoa convidada.</div>}
                <div className="mt-8 border-t border-line pt-5">
                    <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold">Convites pendentes</h3><button type="button" disabled={pendingLoading} onClick={() => setAttempt(value => value + 1)} className="text-xs text-brand disabled:opacity-50">Atualizar</button></div>
                    {pendingLoading ? <p role="status" className="mt-4 text-sm text-muted">Carregando convites...</p> : pendingError ? <p role="alert" className="mt-4 text-sm text-danger">{pendingError}</p> : pending.length === 0 ? <p className="mt-4 text-sm text-muted">Nenhum convite pendente.</p> : <ul className="mt-3 divide-y divide-line">{pending.map(item => <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                        <div className="min-w-0"><p className="break-all text-sm">{item.email}</p><p className="mt-1 text-xs text-muted">Expira em {new Date(item.expiresAt).toLocaleString("pt-BR")}</p></div>
                        <button type="button" disabled={!!actionBusy} onClick={() => cancelInvite(item)} className="rounded border border-line px-3 py-2 text-xs text-danger hover:border-danger disabled:opacity-50">{actionBusy === item.id ? "Cancelando..." : "Cancelar convite"}</button>
                    </li>)}</ul>}
                </div>
                <p className="mt-4 text-xs leading-5 text-muted">Nenhum e-mail é enviado automaticamente. Para aceitar, a pessoa deve entrar com o e-mail informado no convite.</p>
            </section>
        </div>
    </main>
}
