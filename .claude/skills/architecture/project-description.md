# Project Description — Hospitality Business Group Financial Modeling App

## Overview

This is a financial modeling app that computes and exports a series of reports like income statement, cash flow statement, balance sheet and IRR analysis among others. There are two distinct groups of businesses:

1. **Management Company (OpCo)** — A single hospitality management company
2. **Portfolio of Property SPVs** — A number of properties which relate to the management company on a one-to-one basis

## Entity Relationships

- The management company provides services to each property
- The management company is modeled using assumptions defined mostly at the company level, but some at the property level (service fee percentages are examples)
- Each entity (management company and each property) uses its own rate of inflation
- The management company is an **expense** for each property; each property is a **revenue stream** for the management company
- The management company receives an **incentive fee** based on NOI of each property
- After incentive fees and the "management" service fee are paid, the NOI is adjusted (not marketing, IT, and the rest — just management) to produce an **Adjusted NOI (ANOI)** for the property

## Financial Reports

- Reports are generated for the management company and each property according to GAAP and other official sources
- Properties are also viewed in aggregate as a portfolio
- Portfolio results generate reports viewable in the main dashboard including statements and IRR analysis

## Assumptions & Recalculation

- Many assumptions are associated with each entity (management company and each property)
- These assumptions have default values but can be adjusted by the user
- When users adjust assumptions, **all calculations must recalculate**
- Users can save a set of assumptions and configuration variables in **Scenarios** and should be able to read them back and get the same result

## Research vs Calculations

- The app provides guidance to the user via information helpers and research displayed throughout the app
- **Research numbers are only informational and not deterministic**
- **All financial calculations are deterministic**
- It is very important to verify these calculations and the tools that calculate them

## Data Integrity

- While there are seeding fallbacks, there shall be **no magic numbers or hardcoded numbers** in the codebase
- The production database **cannot be overwritten** if the user entered data into it
- The production database **can be supplemented** if something is missing with seed values

## Quality Standards

- PPTX and graphical format reports must be worthy of being included in PowerPoint presentations
- Reports must be correct in their short and extended versions
- All support functionalities (data entry, photos, logos, users, groups, companies) must work correctly
- Administrative functionality must ensure edited values are saved and save buttons work
