import { Router } from "express";
import { MembersTeamsController } from "@/controller/membersTeamController";
import { ensureAuthenticated } from "@/middleware/ensureAuthenticated";

const membersTeamRoutes = Router()
const membersTeamController = new MembersTeamsController()

membersTeamRoutes.use(ensureAuthenticated)

membersTeamRoutes.post("/", membersTeamController.create)
membersTeamRoutes.delete("/:team_id", membersTeamController.remove)
membersTeamRoutes.get("/:team_id", membersTeamController.index)


export { membersTeamRoutes }