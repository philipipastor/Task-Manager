import { randomUUID } from "node:crypto"
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { prisma } from "@/database/prisma"
import request from "supertest"
import { app } from "@/app";

describe("teamsController", () => {
    let team_id: string
    let token: string
    let user_id: string
    let workSpaceId: string

    const email = `test-${randomUUID()}@example.com`

    afterAll(async () => {
        try {
            if (team_id) await prisma.teams.deleteMany({ where: { id: team_id } })
            if (workSpaceId) {
                await prisma.workSpaceMember.deleteMany({ where: { workSpaceId } })
                await prisma.workSpace.delete({ where: { id: workSpaceId } })
            }
            if (user_id) await prisma.user.deleteMany({ where: { id: user_id } })
        } finally {
            await prisma.$disconnect()
        }
    })

    beforeAll(async () => {
        const register = await request(app).post("/users").send({
            name: "Test User2",
            email,
            password: "password123"
        })

        expect(register.status).toBe(201)
        user_id = register.body.id

        const session = await request(app).post("/session").send({
            email,
            password: "password123"
        })

        expect(session.status).toBe(200)

        token = session.body.token

        const workspace = await request(app).post("/workspace")
            .set("Authorization", `Bearer ${token}`)
            .send({ name: "Espaço de equipes" })
        expect(workspace.status).toBe(201)
        workSpaceId = workspace.body.id
    })

    it("testa criação da equipe", async () => {
        const response = await request(app).post("/teams")
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "example",
                description: "testando a description",
                workSpaceId
            })

        expect(response.status).toBe(201)
        expect(response.body).toHaveProperty("id")

        team_id = response.body.id
    })
})
