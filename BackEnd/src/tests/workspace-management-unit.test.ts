import { WorkSpaceMemberController } from "../controller/workSpaceMemberController"
import { WorkSpaceInviteController } from "../controller/workSpaceInviteController"
import { prisma } from "../database/prisma"
import { requireWorkSpaceMember } from "../utils/requireWorkSpaceMember"

jest.mock("../database/prisma", () => ({ prisma: {
    $transaction: jest.fn(), workSpaceInvite: { findMany: jest.fn(), deleteMany: jest.fn() }
} }))
jest.mock("../utils/requireWorkSpaceMember", () => ({ requireWorkSpaceMember: jest.fn() }))

const workSpaceId = "11111111-1111-4111-8111-111111111111"
const userId = "22222222-2222-4222-8222-222222222222"
const inviteId = "33333333-3333-4333-8333-333333333333"
const tx = {
    $queryRaw: jest.fn(),
    workSpaceMember: { findUnique: jest.fn(), count: jest.fn(), update: jest.fn(), delete: jest.fn() },
    teamsMembers: { deleteMany: jest.fn() }, workSpaceInvite: { deleteMany: jest.fn() }
}
const request = (body = {}) => ({ params: { workSpaceId, userId, inviteId }, user: { id: "actor" }, body }) as any
const response = () => { const res: any = {}; res.status = jest.fn().mockReturnValue(res); res.send = jest.fn(); res.json = jest.fn(); return res }

beforeEach(() => {
    jest.resetAllMocks()
    ;(prisma.$transaction as jest.Mock).mockImplementation(fn => fn(tx))
    tx.workSpaceMember.findUnique.mockResolvedValueOnce({ role: "Admin" }).mockResolvedValueOnce({ id: "member", role: "Admin", user: { email: "person@example.com" } })
})

test.each(["update", "remove"] as const)("bloqueia %s do último administrador", async action => {
    tx.workSpaceMember.count.mockResolvedValue(1)
    await expect(new WorkSpaceMemberController()[action](request({ role: "Member" }), response())).rejects.toMatchObject({ statusCode: 409 })
    expect(tx.workSpaceMember.delete).not.toHaveBeenCalled()
    expect(tx.workSpaceMember.update).not.toHaveBeenCalled()
    expect(tx.$queryRaw).toHaveBeenCalledTimes(1)
})

test("membro comum não administra pessoas", async () => {
    tx.workSpaceMember.findUnique.mockReset().mockResolvedValue({ role: "Member" })
    await expect(new WorkSpaceMemberController().remove(request(), response())).rejects.toMatchObject({ statusCode: 403 })
    expect(tx.workSpaceMember.delete).not.toHaveBeenCalled()
})

test("remove vínculo e equipes somente do espaço e revoga convites pendentes", async () => {
    tx.workSpaceMember.count.mockResolvedValue(2)
    const res = response()
    await new WorkSpaceMemberController().remove(request(), res)
    expect(tx.teamsMembers.deleteMany).toHaveBeenCalledWith({ where: { userId, team: { workSpaceId } } })
    expect(tx.workSpaceInvite.deleteMany).toHaveBeenCalledWith({ where: { workSpaceId, acceptedAt: null, email: { equals: "person@example.com", mode: "insensitive" } } })
    expect(tx.workSpaceMember.delete).toHaveBeenCalledWith({ where: { id: "member" } })
    expect(res.status).toHaveBeenCalledWith(204)
})

test("altera permissão quando há outro administrador", async () => {
    tx.workSpaceMember.count.mockResolvedValue(2)
    await new WorkSpaceMemberController().update(request({ role: "Member" }), response())
    expect(tx.workSpaceMember.update).toHaveBeenCalledWith({ where: { id: "member" }, data: { role: "Member" } })
})

test("lista somente convites pendentes sem expor tokenHash", async () => {
    ;(prisma.workSpaceInvite.findMany as jest.Mock).mockResolvedValue([])
    await new WorkSpaceInviteController().index(request(), response())
    expect(requireWorkSpaceMember).toHaveBeenCalledWith("actor", workSpaceId, true)
    expect(prisma.workSpaceInvite.findMany).toHaveBeenCalledWith({
        where: { workSpaceId, acceptedAt: null, expiresAt: { gt: expect.any(Date) } },
        select: { id: true, email: true, createdAt: true, expiresAt: true }, orderBy: { createdAt: "desc" }
    })
})

test("cancelamento é restrito ao espaço e a convites não aceitos", async () => {
    ;(prisma.workSpaceInvite.deleteMany as jest.Mock).mockResolvedValue({ count: 1 })
    await new WorkSpaceInviteController().remove(request(), response())
    expect(prisma.workSpaceInvite.deleteMany).toHaveBeenCalledWith({ where: { id: inviteId, workSpaceId, acceptedAt: null } })
})
