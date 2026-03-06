import { type Express } from "express";
import { registerUserRoutes } from "./users";
import { registerToolRoutes } from "./tools";
import { registerMarcelaRoutes } from "./marcela";

export function register(app: Express) {
  registerUserRoutes(app);
  registerToolRoutes(app);
  registerMarcelaRoutes(app);
}
