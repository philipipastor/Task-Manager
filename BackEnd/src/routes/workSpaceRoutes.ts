import { WorkSpaceMemberController } from "@/controller/workSpaceMemberController";
import { Router } from "express";

import { WorkSpaceController } from "@/controller/workSpaceController";
import { WorkSpaceInviteController } from "@/controller/workSpaceInviteController";

import { ensureAuthenticated } from "@/middleware/ensureAuthenticated";

const workSpaceMemberController = new WorkSpaceMemberController()
const workSpaceRoutes = Router()
const workSpaceController = new WorkSpaceController()
const workSpaceInviteController = new WorkSpaceInviteController()

workSpaceRoutes.use(ensureAuthenticated)
workSpaceRoutes.post("/", workSpaceController.create)
workSpaceRoutes.get("/", workSpaceController.index)

workSpaceRoutes.post("/:workSpaceId/invites", workSpaceInviteController.create)
workSpaceRoutes.post("/invites/accept", workSpaceInviteController.accept)

workSpaceRoutes.get("/:workSpaceId/invites", workSpaceInviteController.index)
workSpaceRoutes.delete("/:workSpaceId/invites/:inviteId", workSpaceInviteController.remove)
workSpaceRoutes.patch("/:workSpaceId/members/:userId", workSpaceMemberController.update)
workSpaceRoutes.delete("/:workSpaceId/members/:userId", workSpaceMemberController.remove)

export { workSpaceRoutes }
