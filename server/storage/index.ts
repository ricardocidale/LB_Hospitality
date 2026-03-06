import { db } from "../db";
import { users, sessions, marketResearch, prospectiveProperties, savedSearches, properties, globalAssumptions, loginLogs, activityLogs, verificationRuns, scenarios, type User, type Session, type GlobalAssumptions, type Property, type Scenario, type Logo, type AssetDescription, type UserGroup, type Company, type FeeCategory, type ResearchQuestion, type DesignTheme } from "@shared/schema";
import { eq } from "drizzle-orm";
import { UserStorage } from "./users";
import { PropertyStorage } from "./properties";
import { FinancialStorage } from "./financial";
import { AdminStorage } from "./admin";
import { ActivityStorage, type ActivityLogFilters } from "./activity";
import { ResearchStorage } from "./research";

export interface IStorage extends 
  UserStorage, 
  PropertyStorage, 
  FinancialStorage, 
  AdminStorage, 
  ActivityStorage, 
  ResearchStorage {
  deleteUser(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  private users = new UserStorage();
  private properties = new PropertyStorage();
  private financial = new FinancialStorage();
  private admin = new AdminStorage();
  private activity = new ActivityStorage();
  private research = new ResearchStorage();

  // Users
  getUserById = this.users.getUserById.bind(this.users);
  getUserByEmail = this.users.getUserByEmail.bind(this.users);
  getUserByPhoneNumber = this.users.getUserByPhoneNumber.bind(this.users);
  createUser = this.users.createUser.bind(this.users);
  getAllUsers = this.users.getAllUsers.bind(this.users);
  updateUserPassword = this.users.updateUserPassword.bind(this.users);
  updateUserProfile = this.users.updateUserProfile.bind(this.users);
  updateUserSelectedTheme = this.users.updateUserSelectedTheme.bind(this.users);
  updateUserRole = this.users.updateUserRole.bind(this.users);

  // Sessions
  createSession = this.users.createSession.bind(this.users);
  getSession = this.users.getSession.bind(this.users);
  deleteSession = this.users.deleteSession.bind(this.users);
  deleteUserSessions = this.users.deleteUserSessions.bind(this.users);
  deleteExpiredSessions = this.users.deleteExpiredSessions.bind(this.users);

  // Global Assumptions
  getGlobalAssumptions = this.financial.getGlobalAssumptions.bind(this.financial);
  upsertGlobalAssumptions = this.financial.upsertGlobalAssumptions.bind(this.financial);

  // Properties
  getAllProperties = this.properties.getAllProperties.bind(this.properties);
  getProperty = this.properties.getProperty.bind(this.properties);
  createProperty = this.properties.createProperty.bind(this.properties);
  updateProperty = this.properties.updateProperty.bind(this.properties);
  deleteProperty = this.properties.deleteProperty.bind(this.properties);

  // Scenarios
  getScenariosByUser = this.financial.getScenariosByUser.bind(this.financial);
  getScenario = this.financial.getScenario.bind(this.financial);
  createScenario = this.financial.createScenario.bind(this.financial);
  updateScenario = this.financial.updateScenario.bind(this.financial);
  deleteScenario = this.financial.deleteScenario.bind(this.financial);
  loadScenario = this.financial.loadScenario.bind(this.financial);

  // Fee Categories
  getFeeCategoriesByProperty = this.financial.getFeeCategoriesByProperty.bind(this.financial);
  getAllFeeCategories = this.financial.getAllFeeCategories.bind(this.financial);
  createFeeCategory = this.financial.createFeeCategory.bind(this.financial);
  updateFeeCategory = this.financial.updateFeeCategory.bind(this.financial);
  deleteFeeCategory = this.financial.deleteFeeCategory.bind(this.financial);
  seedDefaultFeeCategories = this.financial.seedDefaultFeeCategories.bind(this.financial);

  // Admin / Branding
  getAllDesignThemes = this.admin.getAllDesignThemes.bind(this.admin);
  getDesignTheme = this.admin.getDesignTheme.bind(this.admin);
  getDefaultDesignTheme = this.admin.getDefaultDesignTheme.bind(this.admin);
  createDesignTheme = this.admin.createDesignTheme.bind(this.admin);
  updateDesignTheme = this.admin.updateDesignTheme.bind(this.admin);
  deleteDesignTheme = this.admin.deleteDesignTheme.bind(this.admin);
  
  getAllLogos = this.admin.getAllLogos.bind(this.admin);
  getLogo = this.admin.getLogo.bind(this.admin);
  getDefaultLogo = this.admin.getDefaultLogo.bind(this.admin);
  createLogo = this.admin.createLogo.bind(this.admin);
  deleteLogo = this.admin.deleteLogo.bind(this.admin);

  getAllAssetDescriptions = this.admin.getAllAssetDescriptions.bind(this.admin);
  getAssetDescription = this.admin.getAssetDescription.bind(this.admin);
  getDefaultAssetDescription = this.admin.getDefaultAssetDescription.bind(this.admin);
  createAssetDescription = this.admin.createAssetDescription.bind(this.admin);
  deleteAssetDescription = this.admin.deleteAssetDescription.bind(this.admin);

  getAllUserGroups = this.admin.getAllUserGroups.bind(this.admin);
  getUserGroup = this.admin.getUserGroup.bind(this.admin);
  createUserGroup = this.admin.createUserGroup.bind(this.admin);
  updateUserGroup = this.admin.updateUserGroup.bind(this.admin);
  deleteUserGroup = this.admin.deleteUserGroup.bind(this.admin);
  assignUserToGroup = this.admin.assignUserToGroup.bind(this.admin);
  getDefaultUserGroup = this.admin.getDefaultUserGroup.bind(this.admin);

  getAllCompanies = this.admin.getAllCompanies.bind(this.admin);
  getCompany = this.admin.getCompany.bind(this.admin);
  createCompany = this.admin.createCompany.bind(this.admin);
  updateCompany = this.admin.updateCompany.bind(this.admin);
  deleteCompany = this.admin.deleteCompany.bind(this.admin);

  getAllResearchQuestions = this.admin.getAllResearchQuestions.bind(this.admin);
  createResearchQuestion = this.admin.createResearchQuestion.bind(this.admin);
  updateResearchQuestion = this.admin.updateResearchQuestion.bind(this.admin);
  deleteResearchQuestion = this.admin.deleteResearchQuestion.bind(this.admin);

  // Activity / Logs
  createActivityLog = this.activity.createActivityLog.bind(this.activity);
  getActivityLogs = this.activity.getActivityLogs.bind(this.activity);
  getUserActivityLogs = this.activity.getUserActivityLogs.bind(this.activity);
  createVerificationRun = this.activity.createVerificationRun.bind(this.activity);
  getVerificationRuns = this.activity.getVerificationRuns.bind(this.activity);
  getVerificationRun = this.activity.getVerificationRun.bind(this.activity);
  createLoginLog = this.activity.createLoginLog.bind(this.activity);
  updateLogoutTime = this.activity.updateLogoutTime.bind(this.activity);
  getLoginLogs = this.activity.getLoginLogs.bind(this.activity);
  getActiveSessions = this.activity.getActiveSessions.bind(this.activity);
  forceDeleteSession = this.activity.forceDeleteSession.bind(this.activity);

  // Research
  getMarketResearch = this.research.getMarketResearch.bind(this.research);
  getAllMarketResearch = this.research.getAllMarketResearch.bind(this.research);
  upsertMarketResearch = this.research.upsertMarketResearch.bind(this.research);
  deleteMarketResearch = this.research.deleteMarketResearch.bind(this.research);
  getProspectiveProperties = this.research.getProspectiveProperties.bind(this.research);
  addProspectiveProperty = this.research.addProspectiveProperty.bind(this.research);
  deleteProspectiveProperty = this.research.deleteProspectiveProperty.bind(this.research);
  updateProspectivePropertyNotes = this.research.updateProspectivePropertyNotes.bind(this.research);
  getSavedSearches = this.research.getSavedSearches.bind(this.research);
  addSavedSearch = this.research.addSavedSearch.bind(this.research);
  deleteSavedSearch = this.research.deleteSavedSearch.bind(this.research);

  /**
   * Delete a user and ALL related data in a single transaction.
   * Cascading deletes remove sessions, scenarios, research, properties,
   * assumptions, login logs, activity logs, and verification runs.
   */
  async deleteUser(id: number): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(sessions).where(eq(sessions.userId, id));
      await tx.delete(scenarios).where(eq(scenarios.userId, id));
      await tx.delete(marketResearch).where(eq(marketResearch.userId, id));
      await tx.delete(prospectiveProperties).where(eq(prospectiveProperties.userId, id));
      await tx.delete(savedSearches).where(eq(savedSearches.userId, id));
      await tx.delete(properties).where(eq(properties.userId, id));
      await tx.delete(globalAssumptions).where(eq(globalAssumptions.userId, id));
      await tx.delete(loginLogs).where(eq(loginLogs.userId, id));
      await tx.delete(activityLogs).where(eq(activityLogs.userId, id));
      await tx.delete(verificationRuns).where(eq(verificationRuns.userId, id));
      await tx.delete(users).where(eq(users.id, id));
    });
  }
}
