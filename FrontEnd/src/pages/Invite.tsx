import { useEffect, useRef, useState } from "react"
import { Link, useSearchParams } from "react-router"
import { isAxiosError } from "axios"
import { useAuth } from "../hook/useAuth"
import { api } from "../services/api"
import { Button } from "../components/button"
import logo from "../assets/verificar.png"

export function Invite() {
    const [params] = useSearchParams()
    const token = params.get("token") || ""
    return <InviteContent key={token} token={token} />
}

function InviteContent({ token }: { token: string }) {
    const { user, signOut } = useAuth()
    const valid = /^[a-f0-9]{64}$/.test(token)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState("")
    const [accepted, setAccepted] = useState(false)
    const submitting = useRef(false)

    useEffect(() => {
        if (valid) sessionStorage.setItem("@TaskManager:invite", token)
        else sessionStorage.removeItem("@TaskManager:invite")
    }, [token, valid])

    async function accept() {
        if (!valid || !user || submitting.current) return
        submitting.current = true
        setBusy(true)
        setError("")
        try {
            const { data } = await api.post<{ workSpaceId: string }>("/workspace/invites/accept", { token })
            localStorage.setItem(`@TaskManager:workspace:${user.id}`, data.workSpaceId)
            sessionStorage.removeItem("@TaskManager:invite")
            setAccepted(true)
        } catch (error) {
            const status = isAxiosError(error) ? error.response?.status : undefined
            const messages: Record<number, string> = {
                403: "Este convite é para outro e-mail. Entre com a conta que recebeu o convite.",
                404: "Convite não encontrado. Peça um novo link ao administrador.",
                409: "Este convite já foi utilizado ou não está mais disponível. Consulte seus espaços ou peça um novo link.",
                410: "Este convite expirou. Peça um novo link ao administrador.",
                400: "O convite é inválido. Confira se você abriu o link completo."
            }
            setError(status && messages[status] ? messages[status] : "Não foi possível aceitar o convite. Verifique sua conexão e tente novamente.")
        } finally {
            submitting.current = false
            setBusy(false)
        }
    }

    function leave() { sessionStorage.removeItem("@TaskManager:invite") }

    return <main className="relative flex min-h-svh items-center justify-center bg-page px-5 py-24">
        <Link to={user ? "/tasks" : "/login"} onClick={leave} className="absolute top-6 left-6 flex items-center gap-3 rounded text-sm font-semibold focus-visible:outline-2 focus-visible:outline-brand">
            <span className="flex size-8 items-center justify-center rounded-lg bg-brand"><img src={logo} alt="" className="size-5" /></span>Task Manager
        </Link>
        <section className="w-full max-w-md rounded-xl border border-line bg-surface p-7 text-center sm:p-10">
            <div className="mx-auto flex size-14 items-center justify-center rounded-xl bg-brand-light text-brand">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    {accepted ? <path d="m5 12 4 4L19 6" /> : <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 5 10 8L22 5" /></>}
                </svg>
            </div>
            <h1 className="mt-6 text-2xl font-semibold tracking-tight">{accepted ? "Você entrou no espaço!" : valid ? "Você foi convidado." : "Este link não é válido."}</h1>
            <p className="mt-3 text-sm leading-6 text-muted">{accepted ? "Agora você faz parte do espaço. O administrador pode adicionar você às equipes." : valid ? "Participe de um espaço e trabalhe em equipe." : "Confira se o link está completo ou peça um novo convite ao administrador."}</p>

            {valid && !accepted && (user ? <>
                <div className="mt-6 flex items-center gap-3 rounded-lg border border-line bg-page p-4 text-left">
                    <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-light text-sm text-brand">{user.name[0]?.toUpperCase()}</span>
                    <div className="min-w-0"><p className="text-xs text-muted">Conectado como</p><p className="mt-1 break-all text-sm font-medium">{user.email}</p></div>
                </div>
                <p className="mt-3 text-xs leading-5 text-muted">Use o mesmo e-mail que recebeu o convite.</p>
                {error && <p role="alert" className="mt-5 rounded-lg bg-danger-bg p-3 text-left text-sm leading-6 text-danger">{error}</p>}
                <div className="mt-6"><Button type="button" onClick={accept} isLoading={busy}>{busy ? "Aceitando convite..." : "Aceitar convite"}</Button></div>
                <button type="button" onClick={signOut} disabled={busy} className="mt-5 rounded text-sm text-brand hover:text-brand-hover focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-50">Entrar com outra conta</button>
            </> : <div className="mt-6 space-y-4">
                <p className="text-sm leading-6 text-muted">Entre ou crie uma conta com o e-mail convidado. Depois, você volta aqui para confirmar o aceite.</p>
                <Link to="/login" className="flex min-h-11 items-center justify-center rounded-md bg-brand px-4 text-sm font-medium text-on-brand hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-brand">Entrar para aceitar</Link>
                <Link to="/cadastro" className="block rounded text-sm text-brand hover:text-brand-hover focus-visible:outline-2 focus-visible:outline-brand">Ainda não tenho conta</Link>
            </div>)}
            {accepted && <Link to="/tasks" className="mt-6 flex min-h-11 items-center justify-center rounded-md bg-brand px-4 text-sm font-medium text-on-brand hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-brand">Ir para o espaço</Link>}
            {!accepted && <Link to={user ? "/workspaces" : "/login"} onClick={leave} className={`mt-6 inline-block rounded text-xs text-muted hover:text-content focus-visible:outline-2 focus-visible:outline-brand ${busy ? "pointer-events-none" : ""}`}>Voltar {user ? "aos meus espaços" : "ao login"}</Link>}
        </section>
    </main>
}
