import { createHash, randomUUID } from "node:crypto"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals"
import request from "supertest"
import { app } from "@/app"
import { prisma } from "@/database/prisma"

describe("Convites para workspace", () => {
    const users: { id: string, email: string, token: string }[] = []
    let workSpaceId: string

    beforeAll(async () => {
        for (let index = 0; index < 3; index++) {
            const email = `invite-${randomUUID()}@example.com`
            const registered = await request(app).post("/users")
                .send({ name: "Invite User", email, password: "password123" })
            expect(registered.status).toBe(201)
            users.push({ id: registered.body.id, email, token: "" })
            const session = await request(app).post("/session")
                .send({ email, password: "password123" })
            expect(session.status).toBe(200)
            users[index].token = session.body.token
        }
        const workspace = await request(app).post("/workspace")
            .set("Authorization", `Bearer ${users[0].token}`)
            .send({ name: "Espaço de convites" })
        expect(workspace.status).toBe(201)
        workSpaceId = workspace.body.id
    })

    beforeEach(async () => {
        await prisma.workSpaceInvite.deleteMany({ where: { workSpaceId } })
        await prisma.workSpaceMember.deleteMany({ where: { workSpaceId, userId: { not: users[0].id } } })
    })

    afterAll(async () => {
        try {
            if (workSpaceId) {
                await prisma.workSpaceInvite.deleteMany({ where: { workSpaceId } })
                await prisma.workSpaceMember.deleteMany({ where: { workSpaceId } })
                await prisma.workSpace.delete({ where: { id: workSpaceId } })
            }
            await prisma.user.deleteMany({ where: { id: { in: users.map(user => user.id) } } })
        } finally {
            await prisma.$disconnect()
        }
    })

    async function createInvite() {
        const response = await request(app).post(`/workspace/${workSpaceId}/invites`)
            .set("Authorization", `Bearer ${users[0].token}`)
            .send({ email: users[1].email })
        expect(response.status).toBe(201)
        return response.body.token as string
    }

    function acceptInvite(token: string, userIndex = 1) {
        return request(app).post("/workspace/invites/accept")
            .set("Authorization", `Bearer ${users[userIndex].token}`)
            .send({ token })
    }

    it("armazena somente o hash do token com validade de 48 horas", async () => {
        const token = await createInvite()
        expect(token).toMatch(/^[a-f0-9]{64}$/)
        const invite = await prisma.workSpaceInvite.findUniqueOrThrow({
            where: { tokenHash: createHash("sha256").update(token).digest("hex") }
        })
        expect(invite.tokenHash).not.toBe(token)
        expect(invite.email).toBe(users[1].email)
        expect(invite.expiresAt.getTime() - invite.createdAt.getTime()).toBeGreaterThan(47 * 60 * 60 * 1000)
        expect(invite.expiresAt.getTime() - invite.createdAt.getTime()).toBeLessThanOrEqual(48 * 60 * 60 * 1000)
    })

    it("exige papel Admin no workspace para criar convites", async () => {
        await prisma.workSpaceMember.create({
            data: { userId: users[1].id, workSpaceId, role: "Member" }
        })
        for (const index of [1, 2]) {
            const response = await request(app).post(`/workspace/${workSpaceId}/invites`)
                .set("Authorization", `Bearer ${users[index].token}`)
                .send({ email: "another@example.com" })
            expect(response.status).toBe(403)
        }
    })

    it("adiciona o destinatário como Member e impede reutilização", async () => {
        const token = await createInvite()
        const accepted = await acceptInvite(token)
        expect(accepted.status).toBe(200)
        expect(accepted.body.workSpaceId).toBe(workSpaceId)
        const member = await prisma.workSpaceMember.findUniqueOrThrow({
            where: { userId_workSpaceId: { userId: users[1].id, workSpaceId } }
        })
        expect(member.role).toBe("Member")
        expect((await acceptInvite(token)).status).toBe(409)
    })

    it("recusa convite aceito com outra conta sem consumi-lo", async () => {
        const token = await createInvite()
        expect((await acceptInvite(token, 2)).status).toBe(403)
        expect((await acceptInvite(token)).status).toBe(200)
    })

    it("recusa convites expirados", async () => {
        const token = await createInvite()
        await prisma.workSpaceInvite.updateMany({
            where: { workSpaceId }, data: { expiresAt: new Date(Date.now() - 1000) }
        })
        expect((await acceptInvite(token)).status).toBe(410)
        expect(await prisma.workSpaceMember.count({ where: { userId: users[1].id, workSpaceId } })).toBe(0)
    })

    it("consome o convite apenas uma vez em aceitações concorrentes", async () => {
        const token = await createInvite()
        const responses = await Promise.all([acceptInvite(token), acceptInvite(token)])
        expect(responses.map(response => response.status).sort()).toEqual([200, 409])
        expect(await prisma.workSpaceMember.count({ where: { userId: users[1].id, workSpaceId } })).toBe(1)
    })

    it("recusa tokens inválidos e desconhecidos", async () => {
        expect((await acceptInvite("invalid")).status).toBe(400)
        expect((await acceptInvite("0".repeat(64))).status).toBe(404)
    })
})
