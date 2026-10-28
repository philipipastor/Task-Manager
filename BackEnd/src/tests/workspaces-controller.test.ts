import { randomUUID } from "node:crypto"
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals"
import request from "supertest"
import { app } from "@/app"
import { prisma } from "@/database/prisma"

describe("Isolamento por workspace", () => {
    const users: { id: string, token: string }[] = []
    const workspaces: string[] = []
    let teamId: string

    beforeAll(async () => {
        for (let index = 0; index < 2; index++) {
            const email = `workspace-${randomUUID()}@example.com`
            const registered = await request(app).post("/users")
                .send({ name: "Workspace User", email, password: "password123" })
            expect(registered.status).toBe(201)
            users.push({ id: registered.body.id, token: "" })
            const session = await request(app).post("/session")
                .send({ email, password: "password123" })
            expect(session.status).toBe(200)
            users[index].token = session.body.token
            const workspace = await request(app).post("/workspace")
                .set("Authorization", `Bearer ${users[index].token}`)
                .send({ name: `Espaço ${index}` })
            expect(workspace.status).toBe(201)
            workspaces.push(workspace.body.id)
        }
        const team = await request(app).post("/teams")
            .set("Authorization", `Bearer ${users[0].token}`)
            .send({ name: "Equipe privada", workSpaceId: workspaces[0] })
        expect(team.status).toBe(201)
        teamId = team.body.id
    })

    afterAll(async () => {
        try {
            await prisma.teamsMembers.deleteMany({ where: { team: { workSpaceId: { in: workspaces } } } })
            await prisma.teams.deleteMany({ where: { workSpaceId: { in: workspaces } } })
            await prisma.workSpaceMember.deleteMany({ where: { workSpaceId: { in: workspaces } } })
            await prisma.workSpace.deleteMany({ where: { id: { in: workspaces } } })
            await prisma.user.deleteMany({ where: { id: { in: users.map(user => user.id) } } })
        } finally {
            await prisma.$disconnect()
        }
    })

    it("lista apenas os espaços do usuário e atribui Admin ao criador", async () => {
        const response = await request(app).get("/workspace")
            .set("Authorization", `Bearer ${users[0].token}`)
        expect(response.status).toBe(200)
        expect(response.body.map((workspace: { id: string }) => workspace.id)).toEqual([workspaces[0]])
        expect(response.body[0].workSpaceMembers).toEqual([{ role: "Admin" }])
    })

    it("impede acesso a equipes, tarefas e usuários de outro espaço", async () => {
        for (const path of ["/teams", "/tasks", "/users"]) {
            const response = await request(app).get(path)
                .query({ workSpaceId: workspaces[0] })
                .set("Authorization", `Bearer ${users[1].token}`)
            expect(response.status).toBe(403)
        }
    })

    it("impede que um administrador de outro espaço altere a equipe", async () => {
        const response = await request(app).put(`/teams/${teamId}`)
            .set("Authorization", `Bearer ${users[1].token}`)
            .send({ name: "Alteração indevida" })
        expect(response.status).toBe(403)
    })

    it("exige participação no workspace para adicionar um membro à equipe", async () => {
        const response = await request(app).post("/members")
            .set("Authorization", `Bearer ${users[0].token}`)
            .send({ user_id: users[1].id, team_id: teamId })
        expect(response.status).toBe(400)
    })

    it("usa o papel no espaço mesmo quando o usuário administra outro espaço", async () => {
        await prisma.workSpaceMember.create({
            data: { userId: users[1].id, workSpaceId: workspaces[0], role: "Member" }
        })
        const response = await request(app).post("/teams")
            .set("Authorization", `Bearer ${users[1].token}`)
            .send({ name: "Equipe sem permissão", workSpaceId: workspaces[0] })
        expect(response.status).toBe(403)
    })

    it("exige autenticação para acessar os espaços", async () => {
        expect((await request(app).get("/workspace")).status).toBe(401)
    })
})
