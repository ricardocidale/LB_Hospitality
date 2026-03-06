import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildClientTools, buildServerTools, getBaseUrl } from "../../server/marcela-agent-config";

describe("Marcela Agent Config", () => {
  describe("getBaseUrl()", () => {
    const originalEnv = { ...process.env };

    afterAll(() => {
      process.env = originalEnv;
    });

    it("returns REPLIT_DEV_DOMAIN URL when set", () => {
      delete process.env.REPL_SLUG;
      delete process.env.REPL_OWNER;
      process.env.REPLIT_DEV_DOMAIN = "my-app.replit.dev";
      expect(getBaseUrl()).toBe("https://my-app.replit.dev");
    });

    it("returns REPL_SLUG/OWNER URL when both set", () => {
      process.env.REPL_SLUG = "myapp";
      process.env.REPL_OWNER = "myuser";
      delete process.env.REPLIT_DEV_DOMAIN;
      expect(getBaseUrl()).toBe("https://myapp.myuser.repl.co");
    });

    it("falls back to localhost with PORT", () => {
      delete process.env.REPL_SLUG;
      delete process.env.REPL_OWNER;
      delete process.env.REPLIT_DEV_DOMAIN;
      process.env.PORT = "3000";
      expect(getBaseUrl()).toBe("http://localhost:3000");
    });

    it("falls back to localhost:5000 when no PORT", () => {
      delete process.env.REPL_SLUG;
      delete process.env.REPL_OWNER;
      delete process.env.REPLIT_DEV_DOMAIN;
      delete process.env.PORT;
      expect(getBaseUrl()).toBe("http://localhost:5000");
    });
  });

  describe("buildClientTools()", () => {
    const tools = buildClientTools();

    it("returns an array of client tools", () => {
      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThan(0);
    });

    it("all tools have type 'client'", () => {
      for (const tool of tools) {
        expect(tool.type).toBe("client");
      }
    });

    it("all tools have name, description, parameters", () => {
      for (const tool of tools) {
        expect(typeof tool.name).toBe("string");
        expect(tool.name.length).toBeGreaterThan(0);
        expect(typeof tool.description).toBe("string");
        expect(tool.parameters).toBeDefined();
        expect(tool.expects_response).toBe(true);
      }
    });

    it("includes navigateToPage with page parameter", () => {
      const nav = tools.find(t => t.name === "navigateToPage");
      expect(nav).toBeDefined();
      expect(nav!.parameters.properties.page).toBeDefined();
      expect(nav!.parameters.required).toContain("page");
    });

    it("includes showPropertyDetails with propertyId parameter", () => {
      const tool = tools.find(t => t.name === "showPropertyDetails");
      expect(tool).toBeDefined();
      expect(tool!.parameters.properties.propertyId).toBeDefined();
      expect(tool!.parameters.required).toContain("propertyId");
    });

    it("includes expected navigation tools", () => {
      const names = tools.map(t => t.name);
      expect(names).toContain("navigateToPage");
      expect(names).toContain("showPropertyDetails");
      expect(names).toContain("openPropertyEditor");
      expect(names).toContain("showPortfolio");
      expect(names).toContain("showAnalysis");
      expect(names).toContain("showDashboard");
      expect(names).toContain("startGuidedTour");
      expect(names).toContain("openHelp");
      expect(names).toContain("showScenarios");
      expect(names).toContain("openPropertyFinder");
      expect(names).toContain("showCompanyPage");
      expect(names).toContain("getCurrentContext");
    });
  });

  describe("buildServerTools()", () => {
    const baseUrl = "https://example.replit.dev";
    const tools = buildServerTools(baseUrl);

    it("returns an array of webhook tools", () => {
      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThan(0);
    });

    it("all tools have type 'webhook'", () => {
      for (const tool of tools) {
        expect(tool.type).toBe("webhook");
      }
    });

    it("all tools have api_schema with URL containing base URL", () => {
      for (const tool of tools) {
        expect(tool.api_schema.url).toContain(baseUrl);
        expect(tool.api_schema.method).toBe("GET");
        expect(tool.api_schema.headers["x-marcela-tools-secret"]).toBeDefined();
      }
    });

    it("includes expected server tools", () => {
      const names = tools.map(t => t.name);
      expect(names).toContain("getProperties");
      expect(names).toContain("getPropertyDetails");
      expect(names).toContain("getPortfolioSummary");
      expect(names).toContain("getScenarios");
      expect(names).toContain("getGlobalAssumptions");
      expect(names).toContain("getNavigation");
    });

    it("getPropertyDetails has path_params_schema for property_id", () => {
      const tool = tools.find(t => t.name === "getPropertyDetails");
      expect(tool).toBeDefined();
      expect(tool!.api_schema.path_params_schema).toBeDefined();
      expect(tool!.api_schema.path_params_schema!.property_id).toBeDefined();
    });

    it("uses the baseUrl in all tool URLs", () => {
      const customBase = "https://custom.example.com";
      const customTools = buildServerTools(customBase);
      for (const tool of customTools) {
        expect(tool.api_schema.url.startsWith(customBase)).toBe(true);
      }
    });
  });
});
