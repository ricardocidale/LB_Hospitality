import { type Express } from "express";
import { registerUserRoutes } from "./users";
import { registerToolRoutes } from "./tools";
import { registerMarcelaRoutes } from "./marcela";
import { registerServiceRoutes } from "./services";
import { registerResearchConfigRoutes } from "./research";
import { registerExportConfigRoutes } from "./exports";

export function register(app: Express) {
  registerUserRoutes(app);
  registerToolRoutes(app);
  registerMarcelaRoutes(app);
  registerServiceRoutes(app);
  registerResearchConfigRoutes(app);
  registerExportConfigRoutes(app);
}
