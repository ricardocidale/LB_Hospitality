/**
 * admin/index.ts
 *
 * Barrel export for the Admin Settings panel tabs.
 * The admin area is only accessible to users with the "admin" role and
 * provides platform-wide configuration:
 *
 *   • UsersTab        – CRUD for user accounts, role assignment, password resets
 *   • CompaniesTab    – manage the management company entity and SPV (Special
 *                       Purpose Vehicle) companies that own individual properties
 *   • ActivityTab     – login audit log, activity feed, and checker usage analytics
 *   • VerificationTab – independent GAAP financial verification with PDF export
 *   • UserGroupsTab   – group users for branded experiences (logo, theme, asset desc)
 *   • CustomizeTab    – consolidated appearance/config (Branding, Themes, Logos, Navigation)
 *   • DatabaseTab     – view database entity counts and populate production with seed data
 */
export { default as UsersTab } from "./UsersTab";
export { default as CompaniesTab } from "./CompaniesTab";
export { default as ActivityTab } from "./ActivityTab";
export { default as VerificationTab } from "./VerificationTab";
export { default as UserGroupsTab } from "./UserGroupsTab";
export { default as CustomizeTab } from "./CustomizeTab";
export { default as DatabaseTab } from "./DatabaseTab";
