import type { Express } from "express";
import type { Server } from "http";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { registerChatRoutes } from "./replit_integrations/chat";
import * as authRoutes from "./routes/auth";
import * as propertyRoutes from "./routes/properties";
import * as adminRoutes from "./routes/admin";
import * as assumptionRoutes from "./routes/global-assumptions";
import * as brandingRoutes from "./routes/branding";
import * as scenarioRoutes from "./routes/scenarios";
import * as researchRoutes from "./routes/research";
import * as finderRoutes from "./routes/property-finder";
import * as calculationRoutes from "./routes/calculations";
import * as uploadRoutes from "./routes/uploads";
import * as twilioRoutes from "./routes/twilio";
import { registerTwilioWebSocket } from "./routes/twilio";
import * as marcelaToolRoutes from "./routes/marcela-tools";
import * as marketRateRoutes from "./routes/market-rates";
import * as tileRoutes from "./routes/tiles";
import * as photoRoutes from "./routes/property-photos";
import * as chatRoutes from "./routes/chat";
import * as aiRoutes from "./routes/ai";
import * as premiumExportRoutes from "./routes/premium-exports";
import * as adminIntegrationRoutes from "./routes/admin-integrations";
import * as geospatialRoutes from "./routes/geospatial";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  registerObjectStorageRoutes(app);
  registerChatRoutes(app);

  authRoutes.register(app);
  propertyRoutes.register(app);
  adminRoutes.register(app);
  assumptionRoutes.register(app);
  brandingRoutes.register(app);
  scenarioRoutes.register(app);
  researchRoutes.register(app);
  finderRoutes.register(app);
  calculationRoutes.register(app);
  uploadRoutes.register(app);
  twilioRoutes.register(app);
  marcelaToolRoutes.register(app);
  marketRateRoutes.register(app);
  tileRoutes.register(app);
  photoRoutes.register(app);
  chatRoutes.register(app);
  aiRoutes.register(app);
  premiumExportRoutes.register(app);
  adminIntegrationRoutes.register(app);
  geospatialRoutes.register(app);

  registerTwilioWebSocket(httpServer);

  return httpServer;
}
