import { Router } from "express";

import { userRoutes } from "./userRoutes";
import { sessionRoutes } from "./sessionRoutes";
import { teamRoutes } from "./teamRoutes";
import { membersTeamRoutes } from "./membersTeamRoutes";
import { taskRoutes } from "./tasksRoutes";
import { taskHistoryRoutes } from "./taskHistoryRoutes";
import { workSpaceRoutes } from "./workSpaceRoutes";

const routes = Router();

routes.use("/users", userRoutes)
routes.use("/session", sessionRoutes)
routes.use("/teams", teamRoutes)
routes.use("/members", membersTeamRoutes)
routes.use("/tasks", taskRoutes)
routes.use("/tasks/history", taskHistoryRoutes)
routes.use("/workspace", workSpaceRoutes)

export { routes }