# 11 — My Profile

## Overview

The My Profile page (`/profile`) allows authenticated users to manage their account information and credentials. It serves as the central identity management interface for all user roles.

---

## Profile Fields

| Field | Type | Editable | Notes |
|-------|------|----------|-------|
| **Email** | Text (read-only for admin) | Yes (non-admin users) | Serves as the User ID; admin accounts display "Admin" |
| **Name** | Text | Yes | Display name used throughout the application |
| **Company** | Text | Yes | Organization or firm affiliation |
| **Title** | Text | Yes | Professional title (e.g., Asset Manager, VP Acquisitions) |
| **Role** | Badge (read-only) | No | Displayed beneath the user avatar; values: `admin`, `checker`, `user` |

---

## Saving Profile Changes

Profile edits are persisted via the **SaveButton** component located in the page header (top-right of the section). The save action issues a `PATCH /api/profile` request with the updated fields.

| Action | Endpoint | Method | Payload |
|--------|----------|--------|---------|
| Update profile | `/api/profile` | `PATCH` | `{ name, email, company, title }` |

- Admin users submit all fields **except** email (email is locked to "Admin").
- A success toast confirms the save; errors surface via a destructive toast notification.

---

## Changing Password

Password changes are handled via a **separate form section** (not the profile save action). The flow requires three inputs:

| Input | Purpose | Validation |
|-------|---------|------------|
| **Current Password** | Authenticate the change request | Must match stored hash |
| **New Password** | Desired replacement credential | Minimum 8 characters |
| **Confirm Password** | Prevent typographic errors | Must match New Password exactly |

Each password field includes a visibility toggle (eye icon) for user convenience.

| Action | Endpoint | Method | Payload |
|--------|----------|--------|---------|
| Change password | `/api/profile/password` | `PATCH` | `{ currentPassword, newPassword }` |

On success, all password fields are cleared and a confirmation toast is displayed.

---

## Checker Manual Access

Users with the **checker** or **admin** role see an additional action button in the profile page:

| Element | Label | Route | Visibility |
|---------|-------|-------|------------|
| GlassButton | Checker Manual | `/checker-manual` | `checker` and `admin` roles only |

This button provides direct access to the in-app verification manual (this document set). Standard `user` role accounts do not see this button.

---

## Verification Notes for Checkers

| Check | What to Verify |
|-------|---------------|
| Field persistence | Edit name/company/title → save → refresh page → confirm values persist |
| Email lock (admin) | Admin accounts should not be able to modify their email field |
| Password validation | Confirm that passwords shorter than 8 characters are rejected |
| Password mismatch | Confirm that mismatched new/confirm passwords produce an error toast |
| Role-based visibility | Log in as a `user` role → confirm Checker Manual button is **not** visible |
| Role-based visibility | Log in as `checker` or `admin` → confirm Checker Manual button **is** visible and navigates to `/checker-manual` |
