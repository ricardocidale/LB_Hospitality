import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGlobalAssumptionsSchema, insertPropertySchema, updatePropertySchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // --- GLOBAL ASSUMPTIONS ROUTES ---
  
  app.get("/api/global-assumptions", async (req, res) => {
    try {
      const data = await storage.getGlobalAssumptions();
      
      if (!data) {
        return res.status(404).json({ error: "Global assumptions not initialized" });
      }
      
      res.json(data);
    } catch (error) {
      console.error("Error fetching global assumptions:", error);
      res.status(500).json({ error: "Failed to fetch global assumptions" });
    }
  });

  app.post("/api/global-assumptions", async (req, res) => {
    try {
      const validation = insertGlobalAssumptionsSchema.safeParse(req.body);
      
      if (!validation.success) {
        const error = fromZodError(validation.error);
        return res.status(400).json({ error: error.message });
      }
      
      const data = await storage.upsertGlobalAssumptions(validation.data);
      res.json(data);
    } catch (error) {
      console.error("Error upserting global assumptions:", error);
      res.status(500).json({ error: "Failed to save global assumptions" });
    }
  });

  // --- PROPERTIES ROUTES ---
  
  app.get("/api/properties", async (req, res) => {
    try {
      const data = await storage.getAllProperties();
      res.json(data);
    } catch (error) {
      console.error("Error fetching properties:", error);
      res.status(500).json({ error: "Failed to fetch properties" });
    }
  });

  app.get("/api/properties/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid property ID" });
      }
      
      const property = await storage.getProperty(id);
      
      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }
      
      res.json(property);
    } catch (error) {
      console.error("Error fetching property:", error);
      res.status(500).json({ error: "Failed to fetch property" });
    }
  });

  app.post("/api/properties", async (req, res) => {
    try {
      const validation = insertPropertySchema.safeParse(req.body);
      
      if (!validation.success) {
        const error = fromZodError(validation.error);
        return res.status(400).json({ error: error.message });
      }
      
      const property = await storage.createProperty(validation.data);
      res.status(201).json(property);
    } catch (error) {
      console.error("Error creating property:", error);
      res.status(500).json({ error: "Failed to create property" });
    }
  });

  app.patch("/api/properties/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid property ID" });
      }
      
      const validation = updatePropertySchema.safeParse(req.body);
      
      if (!validation.success) {
        const error = fromZodError(validation.error);
        return res.status(400).json({ error: error.message });
      }
      
      const property = await storage.updateProperty(id, validation.data);
      
      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }
      
      res.json(property);
    } catch (error) {
      console.error("Error updating property:", error);
      res.status(500).json({ error: "Failed to update property" });
    }
  });

  app.delete("/api/properties/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid property ID" });
      }
      
      await storage.deleteProperty(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting property:", error);
      res.status(500).json({ error: "Failed to delete property" });
    }
  });

  // Register object storage routes for file uploads
  registerObjectStorageRoutes(app);

  // --- ONE-TIME SEED ENDPOINT ---
  // Visit /api/seed-production once to populate the database with initial data
  app.post("/api/seed-production", async (req, res) => {
    try {
      // Check if data already exists
      const existingProperties = await storage.getAllProperties();
      if (existingProperties.length > 0) {
        return res.json({ 
          message: "Database already has data", 
          properties: existingProperties.length 
        });
      }

      // Seed Global Assumptions
      await storage.upsertGlobalAssumptions({
        modelStartDate: "2026-04-01",
        inflationRate: 0.03,
        baseManagementFee: 0.05,
        incentiveManagementFee: 0.15,
        partnerSalary: 180000,
        staffSalary: 75000,
        travelCostPerClient: 12000,
        itLicensePerClient: 24000,
        marketingRate: 0.05,
        miscOpsRate: 0.03,
        officeLeaseStart: 36000,
        professionalServicesStart: 24000,
        techInfraStart: 18000,
        businessInsuranceStart: 12000,
        standardAcqPackage: {
          monthsToOps: 6,
          purchasePrice: 2300000,
          preOpeningCosts: 150000,
          operatingReserve: 200000,
          buildingImprovements: 800000
        },
        debtAssumptions: {
          acqLTV: 0.75,
          refiLTV: 0.75,
          interestRate: 0.09,
          amortizationYears: 25,
          acqClosingCostRate: 0.02,
          refiClosingCostRate: 0.03
        },
        commissionRate: 0.06,
        fullCateringFbBoost: 0.5,
        partialCateringFbBoost: 0.25,
        fixedCostEscalationRate: 0.03,
        safeTranche1Amount: 800000,
        safeTranche1Date: "2026-06-01",
        safeTranche2Amount: 800000,
        safeTranche2Date: "2027-04-01",
        safeValuationCap: 2500000,
        safeDiscountRate: 0.2,
        companyTaxRate: 0.3,
        companyOpsStartDate: "2026-06-01",
        fiscalYearStartMonth: 1
      });

      // Seed Properties
      const properties = [
        {
          name: "The Hudson Estate",
          location: "Upstate New York",
          market: "North America",
          imageUrl: "/src/assets/property-ny.png",
          status: "Development",
          acquisitionDate: "2026-06-01",
          operationsStartDate: "2026-12-01",
          purchasePrice: 2300000,
          buildingImprovements: 800000,
          preOpeningCosts: 150000,
          operatingReserve: 200000,
          roomCount: 20,
          startAdr: 330,
          adrGrowthRate: 0.025,
          startOccupancy: 0.6,
          maxOccupancy: 0.9,
          occupancyRampMonths: 6,
          occupancyGrowthStep: 0.05,
          stabilizationMonths: 36,
          type: "Full Equity",
          cateringLevel: "Partial",
          costRateRooms: 0.36,
          costRateFb: 0.15,
          costRateAdmin: 0.08,
          costRateMarketing: 0.05,
          costRatePropertyOps: 0.04,
          costRateUtilities: 0.05,
          costRateInsurance: 0.02,
          costRateTaxes: 0.03,
          costRateIt: 0.02,
          costRateFfe: 0.04,
          revShareEvents: 0.43,
          revShareFb: 0.22,
          revShareOther: 0.07,
          fullCateringPercent: 0.4,
          partialCateringPercent: 0.3,
          costRateOther: 0.05,
          exitCapRate: 0.085,
          taxRate: 0.25
        },
        {
          name: "Eden Summit Lodge",
          location: "Eden, Utah",
          market: "North America",
          imageUrl: "/src/assets/property-utah.png",
          status: "Acquisition",
          acquisitionDate: "2027-01-01",
          operationsStartDate: "2027-07-01",
          purchasePrice: 2300000,
          buildingImprovements: 800000,
          preOpeningCosts: 150000,
          operatingReserve: 200000,
          roomCount: 20,
          startAdr: 390,
          adrGrowthRate: 0.025,
          startOccupancy: 0.6,
          maxOccupancy: 0.9,
          occupancyRampMonths: 6,
          occupancyGrowthStep: 0.05,
          stabilizationMonths: 36,
          type: "Full Equity",
          cateringLevel: "Full",
          costRateRooms: 0.36,
          costRateFb: 0.15,
          costRateAdmin: 0.08,
          costRateMarketing: 0.05,
          costRatePropertyOps: 0.04,
          costRateUtilities: 0.05,
          costRateInsurance: 0.02,
          costRateTaxes: 0.03,
          costRateIt: 0.02,
          costRateFfe: 0.04,
          revShareEvents: 0.43,
          revShareFb: 0.22,
          revShareOther: 0.07,
          fullCateringPercent: 0.4,
          partialCateringPercent: 0.3,
          costRateOther: 0.05,
          exitCapRate: 0.085,
          taxRate: 0.25
        },
        {
          name: "Austin Hillside",
          location: "Austin, Texas",
          market: "North America",
          imageUrl: "/src/assets/property-austin.png",
          status: "Acquisition",
          acquisitionDate: "2027-04-01",
          operationsStartDate: "2028-01-01",
          purchasePrice: 2300000,
          buildingImprovements: 800000,
          preOpeningCosts: 150000,
          operatingReserve: 200000,
          roomCount: 20,
          startAdr: 270,
          adrGrowthRate: 0.025,
          startOccupancy: 0.6,
          maxOccupancy: 0.9,
          occupancyRampMonths: 6,
          occupancyGrowthStep: 0.05,
          stabilizationMonths: 36,
          type: "Full Equity",
          cateringLevel: "Partial",
          costRateRooms: 0.36,
          costRateFb: 0.15,
          costRateAdmin: 0.08,
          costRateMarketing: 0.05,
          costRatePropertyOps: 0.04,
          costRateUtilities: 0.05,
          costRateInsurance: 0.02,
          costRateTaxes: 0.03,
          costRateIt: 0.02,
          costRateFfe: 0.04,
          revShareEvents: 0.43,
          revShareFb: 0.22,
          revShareOther: 0.07,
          fullCateringPercent: 0.4,
          partialCateringPercent: 0.3,
          costRateOther: 0.05,
          exitCapRate: 0.085,
          taxRate: 0.25
        },
        {
          name: "Casa Medellín",
          location: "Medellín, Colombia",
          market: "Latin America",
          imageUrl: "/src/assets/property-medellin.png",
          status: "Acquisition",
          acquisitionDate: "2026-09-01",
          operationsStartDate: "2028-07-01",
          purchasePrice: 3500000,
          buildingImprovements: 800000,
          preOpeningCosts: 150000,
          operatingReserve: 200000,
          roomCount: 30,
          startAdr: 180,
          adrGrowthRate: 0.04,
          startOccupancy: 0.6,
          maxOccupancy: 0.9,
          occupancyRampMonths: 6,
          occupancyGrowthStep: 0.05,
          stabilizationMonths: 36,
          type: "Financed",
          cateringLevel: "Full",
          costRateRooms: 0.36,
          costRateFb: 0.15,
          costRateAdmin: 0.08,
          costRateMarketing: 0.05,
          costRatePropertyOps: 0.04,
          costRateUtilities: 0.05,
          costRateInsurance: 0.02,
          costRateTaxes: 0.03,
          costRateIt: 0.02,
          costRateFfe: 0.04,
          revShareEvents: 0.43,
          revShareFb: 0.22,
          revShareOther: 0.07,
          fullCateringPercent: 0.4,
          partialCateringPercent: 0.3,
          costRateOther: 0.05,
          exitCapRate: 0.085,
          taxRate: 0.25
        },
        {
          name: "Blue Ridge Manor",
          location: "Asheville, North Carolina",
          market: "North America",
          imageUrl: "/src/assets/property-asheville.png",
          status: "Acquisition",
          acquisitionDate: "2027-07-01",
          operationsStartDate: "2028-07-01",
          purchasePrice: 3500000,
          buildingImprovements: 800000,
          preOpeningCosts: 150000,
          operatingReserve: 200000,
          roomCount: 30,
          startAdr: 342,
          adrGrowthRate: 0.025,
          startOccupancy: 0.6,
          maxOccupancy: 0.9,
          occupancyRampMonths: 6,
          occupancyGrowthStep: 0.05,
          stabilizationMonths: 36,
          type: "Financed",
          cateringLevel: "Full",
          costRateRooms: 0.36,
          costRateFb: 0.15,
          costRateAdmin: 0.08,
          costRateMarketing: 0.05,
          costRatePropertyOps: 0.04,
          costRateUtilities: 0.05,
          costRateInsurance: 0.02,
          costRateTaxes: 0.03,
          costRateIt: 0.02,
          costRateFfe: 0.04,
          revShareEvents: 0.43,
          revShareFb: 0.22,
          revShareOther: 0.07,
          fullCateringPercent: 0.4,
          partialCateringPercent: 0.3,
          costRateOther: 0.05,
          exitCapRate: 0.085,
          taxRate: 0.25
        }
      ];

      for (const prop of properties) {
        await storage.createProperty(prop);
      }

      res.json({ 
        success: true, 
        message: "Database seeded successfully",
        globalAssumptions: 1,
        properties: properties.length
      });
    } catch (error) {
      console.error("Error seeding database:", error);
      res.status(500).json({ error: "Failed to seed database" });
    }
  });

  return httpServer;
}
