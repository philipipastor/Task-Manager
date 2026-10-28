import { randomUUID } from "node:crypto"
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals"
import { prisma } from "@/database/prisma"
import request from "supertest"
import { app } from "@/app"

describe("TaskController", () => {
    let team_id: string
    let token: string
    let user_id: string
    let task_id: string
    let workSpaceId: string

    const email = `test-${randomUUID()}@example.com`

    afterAll(async () => {
        try {
            if (task_id) {
                await prisma.tasks.deleteMany({
                    where: { id: task_id }
                })
            }

            if (user_id && team_id) {
                await prisma.teamsMembers.deleteMany({
                    where: {
                        userId: user_id,
                        teamId: team_id
                    }
                })
            }

            if (team_id) {
                await prisma.teams.deleteMany({
                    where: { id: team_id }
                })
            }

            if (workSpaceId) {
                await prisma.workSpaceMember.deleteMany({ where: { workSpaceId } })
                await prisma.workSpace.delete({ where: { id: workSpaceId } })
            }

            if (user_id) {
                await prisma.user.deleteMany({
                    where: { id: user_id }
                })
            }
        } finally {
            await prisma.$disconnect()
        }
    })

    beforeAll(async () => {
        const register = await request(app)
            .post("/users")
            .send({
                name: "Test User2",
                email,
                password: "password123"
            })

        expect(register.status).toBe(201)

        user_id = register.body.id

        const session = await request(app)
            .post("/session")
            .send({
                email,
                password: "password123"
            })

        expect(session.status).toBe(200)

        token = session.body.token

        const workspace = await request(app).post("/workspace")
            .set("Authorization", `Bearer ${token}`)
            .send({ name: "Espaço de tarefas" })
        expect(workspace.status).toBe(201)
        workSpaceId = workspace.body.id

        const team = await request(app)
            .post("/teams")
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "example",
                description: "testando a description",
                workSpaceId
            })

        expect(team.status).toBe(201)
        expect(team.body).toHaveProperty("id")

        team_id = team.body.id

        const memberTeam = await request(app)
            .post("/members")
            .set("Authorization", `Bearer ${token}`)
            .send({
                user_id,
                team_id
            })

        expect(memberTeam.status).toBe(201)
    })

    it("teste criação da tarefa", async () => {
        const task = await request(app)
            .post("/tasks")
            .set("Authorization", `Bearer ${token}`)
            .send({
                title: "meta",
                description: "vender o sistema para 10 empresas",
                assigned_to: user_id,
                team_id,
                priority: "Alta",
                workSpaceId
            })

        expect(task.status).toBe(201)
        expect(task.body).toHaveProperty("id")

        task_id = task.body.id
    })
})
