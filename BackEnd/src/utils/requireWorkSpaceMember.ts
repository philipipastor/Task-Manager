import { prisma } from "@/database/prisma";
import { appError } from "@/utils/appError";

export async function requireWorkSpaceMember(userId: string | undefined, workSpaceId: string, adminOnly = false) {
    if (!userId) {
        throw new appError("Usuário não autenticado", 401)
    }

    const member = await prisma.workSpaceMember.findUnique({
        where: { userId_workSpaceId: { userId, workSpaceId } }
    })

    if (!member) {
        throw new appError("Usuário não pertence a esse espaço", 403)
    }

    if (adminOnly && member.role !== "Admin") {
        throw new appError("Somente administradores deste espaço podem realizar essa ação", 403)
    }

    return member
}
