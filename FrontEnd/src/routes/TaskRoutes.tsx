import { Navigate, Outlet, Route, Routes } from "react-router"
import { LayoutHeader } from "../components/layoutHeader"
import { TaskList } from "../pages/Tasks"
import { NewTask } from "../pages/NewTask"
import { TaskDetails } from "../pages/TaskDetails"
import { Teams } from "../pages/teams"
import { NotFound } from "../pages/NotFound"
import { Workspaces } from "../pages/Workspaces"
import { People } from "../pages/People"
import { useWorkspace } from "../context/WorkspaceContext"

function RequireWorkspace({ adminOnly = false }: { adminOnly?: boolean }) {
    const { workspace, isAdmin } = useWorkspace()
    if (!workspace) return <Navigate to="/workspaces" replace />
    if (adminOnly && !isAdmin) return <Navigate to="/tasks" replace />
    return <Outlet />
}
export function TaskRoutes() {
    const pendingInvite = sessionStorage.getItem("@TaskManager:invite")
    const loginDestination = pendingInvite && /^[a-f0-9]{64}$/.test(pendingInvite)
        ? `/invite?token=${pendingInvite}`
        : "/tasks"

    return <Routes>
        <Route path="/" element={<Navigate to="/tasks" replace />} />
        <Route path="/login" element={<Navigate to={loginDestination} replace />} />
        <Route path="/cadastro" element={<Navigate to={loginDestination} replace />} />
        <Route element={<LayoutHeader />}>
            <Route path="/workspaces" element={<Workspaces />} />
            <Route element={<RequireWorkspace />}>
                <Route path="/tasks" element={<TaskList />} />
                <Route path="/newTask" element={<NewTask />} />
                <Route path="/tasks/:id" element={<TaskDetails />} />
            </Route>
            <Route element={<RequireWorkspace adminOnly />}>
                <Route path="/team" element={<Teams />} />
                <Route path="/people" element={<People />} />
            </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
    </Routes>
}
