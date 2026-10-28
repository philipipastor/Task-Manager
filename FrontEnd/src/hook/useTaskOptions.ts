import { useWorkspace } from "../context/WorkspaceContext";
import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import { api } from "../services/api";
import type { User } from "../types/user";
import type { Teams } from "../types/teams";
import type { TeamMember } from "../types/teamsMember";

export function useTaskOptions(isAdmin: boolean, selectedTeamId: string) {
    const { workspace } = useWorkspace()
    const [userList, setUserList] = useState<User[]>([])
    const [teamList, setTeamList] = useState<Teams[]>([])
    const [loadingOptions, setLoadingOptions] = useState(true)
    const [optionsError, setOptionsError] = useState("")
    const [membersError, setMembersError] = useState("")
    const [teamMembers, setTeamMembers] = useState<{ teamId: string; members: TeamMember[] }>({ teamId: "", members: [] })
    const loadingMembers = isAdmin && !!selectedTeamId && teamMembers.teamId !== selectedTeamId && !membersError
    const availableUsers = userList.filter((item) =>
        teamMembers.teamId === selectedTeamId && teamMembers.members.some((member) => member.userId === item.id)
    )

    function getErrorMessage(error: unknown, fallback: string) {
        if (error instanceof AxiosError && typeof error.response?.data?.message === "string") {
            return error.response.data.message
        }
        return fallback
    }

    useEffect(() => {
        let cancelled = false
        async function loadOptions() {
            try {
                const [usersResponse, teamsResponse] = await Promise.all([
                    api.get<User[]>("/users", { params: { workSpaceId: workspace!.id } }),
                    api.get<Teams[]>("/teams", { params: { workSpaceId: workspace!.id } })
                ])
                if (!cancelled) {
                    setUserList(usersResponse.data)
                    setTeamList(teamsResponse.data)
                }
            } catch (error) {
                if (!cancelled) setOptionsError(getErrorMessage(error, "Não foi possível carregar usuários e equipes. Recarregue a página para tentar novamente."))
            } finally {
                if (!cancelled) setLoadingOptions(false)
            }
        }
        loadOptions()
        return () => { cancelled = true }
    }, [workspace?.id])

    useEffect(() => {
        if (!isAdmin || !selectedTeamId) return
        let cancelled = false
        async function loadMembers() {
            try {
                const response = await api.get<TeamMember[]>(`/members/${selectedTeamId}`)
                if (!cancelled) setTeamMembers({ teamId: selectedTeamId, members: response.data })
            } catch (error) {
                if (!cancelled) setMembersError(getErrorMessage(error, "Não foi possível carregar os membros. Selecione a equipe novamente para tentar."))
            }
        }
        loadMembers()
        return () => { cancelled = true }
    }, [isAdmin, selectedTeamId])

    const userOptions = [
        { label: loadingMembers ? "Carregando membros..." : !selectedTeamId ? "Escolha uma equipe primeiro" : "Selecione um responsável", value: "" },
        ...availableUsers.map((user) => ({
            label: user.name,
            value: user.id
        }))
    ]

    const teamOptions = [
        { label: "Selecione uma equipe", value: "" },
        ...teamList.map((team) => ({
            label: `${team.name} — ${team.active ? "Ativa" : "Inativa"}`,
            value: team.id
        }))
    ]

    function resetMembers() {
        setMembersError("")
        setTeamMembers({ teamId: "", members: [] })
    }

    return {
        teamList, availableUsers, teamOptions, userOptions,
        loadingOptions, loadingMembers, optionsError, membersError, resetMembers
    }
}
