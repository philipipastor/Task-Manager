import { Navigate, Route, Routes } from "react-router"

import { Login } from "../pages/Login"
import { Register } from "../pages/Register"
import { NotFound } from "../pages/NotFound"

export function AuthRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Register />} />
            <Route path="/tasks" element={<Navigate to="/login" replace />} />
            <Route path="/tasks/:id" element={<Navigate to="/login" replace />} />
            <Route path="/newTask" element={<Navigate to="/login" replace />} />
            <Route path="/team" element={<Navigate to="/login" replace />} />

            <Route path="/workspaces" element={<Navigate to="/login" replace />} />
            <Route path="/people" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<NotFound />} />
        </Routes>
    )
}
