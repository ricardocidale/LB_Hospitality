import { type Express } from "express";
import { registerUserRoutes } from "./users";
import { registerToolRoutes } from "./tools";
import { registerMarcelaRoutes } from "./marcela";
import { registerServiceRoutes } from "./services";

export function register(app: Express) {
  registerUserRoutes(app);
  registerToolRoutes(app);
  registerMarcelaRoutes(app);
  registerServiceRoutes(app);
}
