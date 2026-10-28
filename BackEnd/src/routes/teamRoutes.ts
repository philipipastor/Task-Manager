import { Router } from "express";
import { TeamsController } from "@/controller/teamsController";
import { ensureAuthenticated } from "@/middleware/ensureAuthenticated";

const teamRoutes = Router()
const teamsController = new TeamsController()

teamRoutes.use(ensureAuthenticated)
teamRoutes.get("/", teamsController.index)

teamRoutes.post("/", teamsController.create)
teamRoutes.put("/:id", teamsController.update)
teamRoutes.patch("/:id/desactive", teamsController.desactive)
teamRoutes.patch("/:id/active", teamsController.active)

export { teamRoutes }
