import logo_check from "../assets/verificar.png"
import icon_logout from "../assets/sair-do-usuario.png"
import { useAuth } from "../hook/useAuth"
import { useWorkspace } from "../context/WorkspaceContext"
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router"
import { Select } from "./select"

const icons = {
    tasks: "M9 5h11M9 12h11M9 19h11M3 5l1 1 2-2M3 12l1 1 2-2M3 19l1 1 2-2",
    teams: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 3a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-3.87M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
    people: "M3 5h18v14H3zM3 5l9 7 9-7",
    spaces: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"
}

export function LayoutHeader() {
    const { user, signOut } = useAuth()
    const { spaces, workspace, isAdmin, loading, error, selectWorkspace, retry } = useWorkspace()
    const navigate = useNavigate()
    const { pathname } = useLocation()
    const showNavigation = !loading && !error && !!workspace
    const links = [
        { to: "/tasks", label: "Tarefas", icon: icons.tasks },
        ...(isAdmin ? [
            { to: "/team", label: "Equipes", icon: icons.teams },
            { to: "/people", label: "Pessoas e convites", icon: icons.people }
        ] : []),
        { to: "/workspaces", label: "Seus espaços", icon: icons.spaces }
    ]
    const initials = user?.name.trim().split(/\s+/).slice(0, 2).map(name => name[0]).join("").toUpperCase()

    return (
        <div className="min-h-svh md:grid md:grid-cols-[248px_minmax(0,1fr)]">
            <aside aria-label="Barra lateral" className="flex flex-col border-b border-line bg-surface p-5 md:sticky md:top-0 md:h-svh md:overflow-y-auto md:border-r md:border-b-0 md:p-6">
                {showNavigation && <>
                    <Link to="/tasks" className="mb-8 inline-flex items-center gap-3 rounded-lg text-sm font-semibold text-content focus-visible:outline-2 focus-visible:outline-brand">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand"><img src={logo_check} alt="" className="size-5 object-contain" /></span>
                        Task Manager
                    </Link>
                    <div className="mb-6">
                        <label htmlFor="current-workspace" className="mb-2 block text-[10px] font-semibold tracking-widest text-muted">ESPAÇO ATUAL</label>
                        <Select id="current-workspace" value={workspace.id} options={spaces.map(space => ({ value: space.id, label: space.name }))} className="bg-page! px-3! font-medium!"
                            onChange={id => {
                                if (id === workspace.id) return
                                selectWorkspace(id)
                                navigate("/tasks")
                            }} />
                        <p className="mt-3 flex items-center gap-2 text-xs text-muted"><span className="size-1.5 rounded-full bg-brand" aria-hidden="true" />{isAdmin ? "Administrador" : "Membro"}</p>
                    </div>
                    <nav aria-label="Navegação principal" className="grid grid-cols-2 gap-1 sm:grid-cols-4 md:grid-cols-1">
                        {links.map(link => {
                            const active = pathname === link.to || (link.to === "/tasks" && (pathname.startsWith("/tasks/") || pathname === "/newTask"))
                            return <NavLink key={link.to} to={link.to} className={`relative flex min-h-11 items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-brand ${active ? "bg-brand-light font-medium text-brand before:absolute before:inset-y-3 before:left-0 before:w-0.5 before:rounded-full before:bg-brand" : "text-muted hover:bg-page hover:text-content"}`}>
                                <svg className="size-4.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={link.icon} /></svg>
                                <span>{link.label}</span>
                            </NavLink>
                        })}
                    </nav>
                </>}
                <div className={`md:mt-auto ${showNavigation ? "mt-6 border-t border-line pt-5 md:mt-auto" : ""}`}>
                    <div className="flex items-center gap-3">
                        <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full border border-brand/30 bg-brand-light text-xs font-semibold text-brand">{initials}</span>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-content" title={user?.name}>{user?.name}</p>
                            <p className="mt-0.5 truncate text-xs text-muted" title={user?.email}>{user?.email}</p>
                        </div>
                    </div>
                    <button type="button" onClick={signOut} className="mt-3 flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-lg px-3 text-sm text-muted transition-colors hover:bg-page hover:text-content focus-visible:outline-2 focus-visible:outline-brand">
                        <img src={icon_logout} alt="" className="size-4 object-contain invert" />Sair
                    </button>
                </div>
            </aside>
            <div className="min-w-0">
                {loading ? <p role="status" className="p-8 text-sm text-muted">Carregando seus espaços...</p>
                    : error ? <div className="p-8"><p role="alert" className="text-danger">{error}</p><button type="button" onClick={retry} className="mt-4 rounded-lg border border-line px-4 py-3 text-sm text-brand">Tentar novamente</button></div>
                    : <Outlet key={workspace?.id || "first-access"} />}
            </div>
        </div>
    )
}
