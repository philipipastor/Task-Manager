import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { api } from "../services/api"
import { useAuth } from "../hook/useAuth"

export type Workspace = { id: string; name: string; workSpaceMembers: { role: "Admin" | "Member" }[] }
type WorkspaceData = {
    spaces: Workspace[]; workspace: Workspace | undefined; isAdmin: boolean
    loading: boolean; error: string
    selectWorkspace: (id: string) => void
    addWorkspace: (space: Workspace) => void
    retry: () => void
}
const Context = createContext<WorkspaceData | null>(null)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth()
    const storageKey = `@TaskManager:workspace:${user!.id}`
    const [spaces, setSpaces] = useState<Workspace[]>([])
    const [selectedId, setSelectedId] = useState("")
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [attempt, setAttempt] = useState(0)

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        setError("")
        api.get<Workspace[]>("/workspace").then(({ data }) => {
            if (cancelled) return
            setSpaces(data)
            const saved = localStorage.getItem(storageKey)
            const id = data.find(space => space.id === saved)?.id || data[0]?.id || ""
            setSelectedId(id)
            localStorage.setItem(storageKey, id)
        }).catch(() => {
            if (!cancelled) setError("Não foi possível carregar seus espaços.")
        }).finally(() => {
            if (!cancelled) setLoading(false)
        })
        return () => { cancelled = true }
    }, [storageKey, attempt])

    function selectWorkspace(id: string) {
        if (!spaces.some(space => space.id === id)) return
        setSelectedId(id)
        localStorage.setItem(storageKey, id)
    }
    function addWorkspace(space: Workspace) {
        setSpaces(previous => [...previous, space])
        setSelectedId(space.id)
        localStorage.setItem(storageKey, space.id)
    }
    const workspace = spaces.find(space => space.id === selectedId)
    return <Context.Provider value={{
        spaces, workspace, loading, error, selectWorkspace, addWorkspace,
        isAdmin: workspace?.workSpaceMembers[0]?.role === "Admin",
        retry: () => setAttempt(value => value + 1)
    }}>{children}</Context.Provider>
}
export function useWorkspace() {
    const context = useContext(Context)
    if (!context) throw new Error("useWorkspace precisa de WorkspaceProvider")
    return context
}
