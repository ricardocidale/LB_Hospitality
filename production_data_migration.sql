-- Production Data Migration Script
-- Run these SQL statements in the Production database to copy development data

-- ============================================
-- 1. USERS (3 records)
-- ============================================
INSERT INTO users (id, email, password_hash, role, name, company, title, created_at, updated_at) VALUES
(1, 'admin', '$2b$12$Pn7FR96mt7FWlXE4CVfCZ.J4amO5fnhrVpXa.fw6R.FpR.EJCYR.O', 'admin', 'Ricardo Cidale', 'Norfolk Group', 'Partner', '2026-01-27 00:22:53.560822', '2026-02-02 13:08:31.709'),
(2, 'rosario@kitcapital.com', '$2b$12$2AtbFcvAfiT2mEYMIXPF0uvwZR764dP2HGtGsq1hfZLgFuYmJ7xaq', 'user', 'Rosario David', 'KIT Capital', 'COO', '2026-01-27 00:41:44.306456', '2026-01-27 19:16:40.707'),
(3, 'checker', '$2b$12$2nybBrwP6J7IkfAhoyneDev.bO5U2KQIoRsM2txsp2gk7ofVQATMG', 'user', 'Checker User', NULL, NULL, '2026-01-30 13:40:43.219108', '2026-02-02 13:08:32.105');

-- Reset sequence for users
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- ============================================
-- 2. GLOBAL ASSUMPTIONS (1 record)
-- ============================================
INSERT INTO global_assumptions (id, model_start_date, inflation_rate, base_management_fee, incentive_management_fee, staff_salary, travel_cost_per_client, it_license_per_client, marketing_rate, misc_ops_rate, office_lease_start, professional_services_start, tech_infra_start, business_insurance_start, standard_acq_package, debt_assumptions, commission_rate, full_catering_fb_boost, partial_catering_fb_boost, fixed_cost_escalation_rate, safe_tranche1_amount, safe_tranche1_date, safe_tranche2_amount, safe_tranche2_date, safe_valuation_cap, safe_discount_rate, company_tax_rate, company_ops_start_date, fiscal_year_start_month, partner_comp_year1, partner_comp_year2, partner_comp_year3, partner_comp_year4, partner_comp_year5, partner_comp_year6, partner_comp_year7, partner_comp_year8, partner_comp_year9, partner_comp_year10, partner_count_year1, partner_count_year2, partner_count_year3, partner_count_year4, partner_count_year5, partner_count_year6, partner_count_year7, partner_count_year8, partner_count_year9, partner_count_year10, company_name, exit_cap_rate, sales_commission_rate, event_expense_rate, other_expense_rate, utilities_variable_split, funding_source_label) VALUES
(2, '2026-04-01', 0.03, 0.05, 0.15, 75000, 12000, 3000, 0.05, 0.03, 36000, 24000, 18000, 12000, 
'{"monthsToOps": 6, "purchasePrice": 2300000, "preOpeningCosts": 150000, "operatingReserve": 200000, "buildingImprovements": 800000}',
'{"acqLTV": 0.75, "refiLTV": 0.75, "interestRate": 0.09, "amortizationYears": 25, "acqClosingCostRate": 0.02, "refiClosingCostRate": 0.03}',
0.06, 0.5, 0.25, 0.03, 750000, '2026-06-01', 750000, '2027-04-01', 2500000, 0.2, 0.3, '2026-06-01', 1, 540000, 540000, 540000, 600000, 600000, 700000, 700000, 800000, 800000, 900000, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 'L+B Hospitality Company', 0.085, 0.05, 0.65, 0.6, 0.6, 'SAFE');

-- Reset sequence for global_assumptions
SELECT setval('global_assumptions_id_seq', (SELECT MAX(id) FROM global_assumptions));

-- ============================================
-- 3. PROPERTIES (5 records)
-- ============================================
INSERT INTO properties (id, name, location, market, image_url, status, acquisition_date, operations_start_date, purchase_price, building_improvements, pre_opening_costs, operating_reserve, room_count, start_adr, adr_growth_rate, start_occupancy, max_occupancy, occupancy_ramp_months, occupancy_growth_step, stabilization_months, type, catering_level, cost_rate_rooms, cost_rate_fb, cost_rate_admin, cost_rate_marketing, cost_rate_property_ops, cost_rate_utilities, cost_rate_insurance, cost_rate_taxes, cost_rate_it, cost_rate_ffe, rev_share_events, rev_share_fb, rev_share_other, full_catering_percent, partial_catering_percent, cost_rate_other, exit_cap_rate, tax_rate, will_refinance, refinance_date, acquisition_ltv, acquisition_interest_rate, acquisition_term_years, acquisition_closing_cost_rate) VALUES
(6, 'The Hudson Estate', 'Upstate New York', 'North America', '/images/property-ny.png', 'Development', '2026-06-01', '2026-12-01', 2300000, 800000, 150000, 200000, 20, 330, 0.025, 0.6, 0.9, 6, 0.05, 36, 'Full Equity', 'Partial', 0.36, 0.15, 0.08, 0.01, 0.04, 0.05, 0.02, 0.03, 0.005, 0.04, 0.43, 0.22, 0.07, 0.4, 0.3, 0.05, 0.085, 0.25, 'Yes', '2029-12-01', NULL, NULL, NULL, NULL),
(7, 'Eden Summit Lodge', 'Eden, Utah', 'North America', '/images/property-utah.png', 'Acquisition', '2027-01-01', '2027-07-01', 2300000, 800000, 150000, 200000, 20, 390, 0.025, 0.6, 0.9, 6, 0.05, 36, 'Full Equity', 'Full', 0.36, 0.15, 0.08, 0.01, 0.04, 0.05, 0.02, 0.03, 0.005, 0.04, 0.43, 0.22, 0.07, 0.4, 0.3, 0.05, 0.085, 0.25, 'Yes', '2030-07-01', NULL, NULL, NULL, NULL),
(8, 'Austin Hillside', 'Austin, Texas', 'North America', '/images/property-austin.png', 'Acquisition', '2027-04-01', '2028-01-01', 2300000, 800000, 150000, 200000, 20, 270, 0.025, 0.6, 0.9, 6, 0.05, 36, 'Full Equity', 'Partial', 0.36, 0.15, 0.08, 0.01, 0.04, 0.05, 0.02, 0.03, 0.005, 0.04, 0.43, 0.22, 0.07, 0.4, 0.3, 0.05, 0.085, 0.25, 'Yes', '2031-01-01', NULL, NULL, NULL, NULL),
(9, 'Casa Medellín', 'Medellín, Colombia', 'Latin America', '/images/property-medellin.png', 'Acquisition', '2026-09-01', '2028-07-01', 3500000, 800000, 150000, 200000, 30, 180, 0.04, 0.6, 0.9, 6, 0.05, 36, 'Financed', 'Full', 0.36, 0.15, 0.08, 0.01, 0.04, 0.05, 0.02, 0.03, 0.005, 0.04, 0.43, 0.22, 0.07, 0.4, 0.3, 0.05, 0.085, 0.25, NULL, NULL, 0.75, 0.09, 25, 0.02),
(10, 'Blue Ridge Manor', 'Asheville, North Carolina', 'North America', '/images/property-asheville.png', 'Acquisition', '2027-07-01', '2028-07-01', 3500000, 800000, 150000, 200000, 30, 342, 0.025, 0.6, 0.9, 6, 0.05, 36, 'Financed', 'Full', 0.36, 0.15, 0.08, 0.01, 0.04, 0.05, 0.02, 0.03, 0.005, 0.04, 0.43, 0.22, 0.07, 0.4, 0.3, 0.05, 0.085, 0.25, NULL, NULL, 0.75, 0.09, 25, 0.02);

-- Reset sequence for properties
SELECT setval('properties_id_seq', (SELECT MAX(id) FROM properties));

-- ============================================
-- 4. DESIGN THEMES (1 record)
-- ============================================
INSERT INTO design_themes (id, name, description, is_active, colors, created_at, updated_at) VALUES
(1, 'Fluid Glass', 'Inspired by Apple''s iOS design language, Fluid Glass creates a sense of depth and dimension through translucent layers, subtle gradients, and smooth animations. The design emphasizes content while maintaining visual hierarchy through careful use of blur effects and glass-like surfaces.', true,
'[{"name": "Sage Green", "rank": 1, "hexCode": "#9FBCA4", "description": "PALETTE: Secondary accent for subtle highlights, card borders, and supporting visual elements."}, {"name": "Deep Green", "rank": 2, "hexCode": "#257D41", "description": "PALETTE: Primary brand color for main action buttons, active navigation items, and key highlights."}, {"name": "Warm Cream", "rank": 3, "hexCode": "#FFF9F5", "description": "PALETTE: Light background for page backgrounds, card surfaces, and warm accents."}, {"name": "Deep Black", "rank": 4, "hexCode": "#0a0a0f", "description": "PALETTE: Dark theme background for navigation sidebars, dark glass panels, and login screens."}, {"name": "Salmon", "rank": 5, "hexCode": "#F4795B", "description": "PALETTE: Accent color for warnings, notifications, and emphasis highlights."}, {"name": "Yellow Gold", "rank": 6, "hexCode": "#F59E0B", "description": "PALETTE: Accent color for highlights, badges, and attention-drawing elements."}, {"name": "Chart Blue", "rank": 1, "hexCode": "#3B82F6", "description": "CHART: Primary chart line color for revenue and key financial metrics."}, {"name": "Chart Red", "rank": 2, "hexCode": "#EF4444", "description": "CHART: Secondary chart line color for expenses and cost-related metrics."}, {"name": "Chart Purple", "rank": 3, "hexCode": "#8B5CF6", "description": "CHART: Tertiary chart line color for cash flow and profitability metrics."}]',
'2026-01-31 23:18:22.995853', '2026-02-01 18:25:02.364433');

-- Reset sequence for design_themes
SELECT setval('design_themes_id_seq', (SELECT MAX(id) FROM design_themes));

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these after migration to verify data was inserted correctly:
-- SELECT COUNT(*) as user_count FROM users;
-- SELECT COUNT(*) as property_count FROM properties;
-- SELECT COUNT(*) as global_assumptions_count FROM global_assumptions;
-- SELECT COUNT(*) as design_themes_count FROM design_themes;
