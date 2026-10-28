import { useLocation } from "react-router";
import { Invite } from "../pages/Invite";
import { useAuth } from "../hook/useAuth";

import { AuthRoutes } from "./AuthRoutes";
import { TaskRoutes } from "./TaskRoutes";
import { WorkspaceProvider } from "../context/WorkspaceContext";

export function AppRoutes() {
    const { user, isLoading } = useAuth()
    const { pathname } = useLocation()

    if(isLoading){
        return(
            <div className="flex min-h-svh items-center justify-center">
                <p>Carregando...</p>
            </div>
        )
    }

    if (pathname === "/invite" || pathname === "/convite") return <Invite />

    return user ? <WorkspaceProvider key={user.id}><TaskRoutes/></WorkspaceProvider> : <AuthRoutes/>

} 


