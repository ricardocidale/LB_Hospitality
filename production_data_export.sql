-- L+B Hospitality Production Data Export
-- Generated: 2026-02-02
-- Run these statements in the production database

-- ============================================
-- USERS (4 users)
-- ============================================
INSERT INTO users (id, email, password_hash, role, name, created_at, updated_at, company, title) VALUES
(1, 'admin', '$2b$12$PvGzZOoeGDfNS1xjuBpcNu.Xgp3.vCX82bW0dU7xdFcoA9/uZHowq', 'admin', 'Ricardo Cidale', '2026-01-27 00:22:53.560822', '2026-02-02 17:01:28.789', 'Norfolk Group', 'Partner'),
(2, 'rosario@kitcapital.com', '$2b$12$2AtbFcvAfiT2mEYMIXPF0uvwZR764dP2HGtGsq1hfZLgFuYmJ7xaq', 'user', 'Rosario David', '2026-01-27 00:41:44.306456', '2026-02-02 17:08:28.796', 'KIT Capital', 'COO'),
(4, 'kit@kitcapital.com', '$2b$12$WO8kXNE7E5VchZfVvUddoOaNZGDagOVGIFxDIForV9bQRSLzF8nYm', 'user', 'Dov Tuzman', '2026-02-02 16:09:26.02703', '2026-02-02 17:08:22.783', 'KIT Capital', 'Principal'),
(5, 'checker@norfolkgroup.io', '$2b$12$xypFNG4Xy9l097nQtuqBSOpYgWvB.QIq786Ni.jxi/C22XXqsdnIm', 'user', 'Checker User', '2026-02-02 16:33:13.844808', '2026-02-02 17:09:16.141', 'Norfolk', 'Verification manager')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  name = EXCLUDED.name,
  company = EXCLUDED.company,
  title = EXCLUDED.title,
  updated_at = EXCLUDED.updated_at;

-- Reset users sequence
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- ============================================
-- GLOBAL ASSUMPTIONS
-- ============================================
INSERT INTO global_assumptions (id, model_start_date, inflation_rate, base_management_fee, incentive_management_fee, staff_salary, travel_cost_per_client, it_license_per_client, marketing_rate, misc_ops_rate, office_lease_start, professional_services_start, tech_infra_start, business_insurance_start, standard_acq_package, debt_assumptions, updated_at, commission_rate, full_catering_fb_boost, partial_catering_fb_boost, fixed_cost_escalation_rate, safe_tranche1_amount, safe_tranche1_date, safe_tranche2_amount, safe_tranche2_date, safe_valuation_cap, safe_discount_rate, company_tax_rate, company_ops_start_date, fiscal_year_start_month, partner_comp_year1, partner_comp_year2, partner_comp_year3, partner_comp_year4, partner_comp_year5, partner_comp_year6, partner_comp_year7, partner_comp_year8, partner_comp_year9, partner_comp_year10, partner_count_year1, partner_count_year2, partner_count_year3, partner_count_year4, partner_count_year5, partner_count_year6, partner_count_year7, partner_count_year8, partner_count_year9, partner_count_year10, user_id, company_name, company_logo, funding_source_label, exit_cap_rate, sales_commission_rate, event_expense_rate, other_expense_rate, utilities_variable_split) VALUES
(2, '2026-04-01', 0.03, 0.05, 0.15, 75000, 12000, 3000, 0.05, 0.03, 36000, 24000, 18000, 12000, 
 '{"monthsToOps": 6, "purchasePrice": 2300000, "preOpeningCosts": 150000, "operatingReserve": 200000, "buildingImprovements": 800000}',
 '{"acqLTV": 0.75, "refiLTV": 0.75, "interestRate": 0.09, "amortizationYears": 25, "acqClosingCostRate": 0.02, "refiClosingCostRate": 0.03}',
 '2026-01-31 20:37:19.645', 0.06, 0.5, 0.25, 0.03, 750000, '2026-06-01', 750000, '2027-04-01', 2500000, 0.2, 0.3, '2026-06-01', 1, 540000, 540000, 540000, 600000, 600000, 700000, 700000, 800000, 800000, 900000, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, NULL, 'L+B Hospitality Company', NULL, 'SAFE', 0.085, 0.05, 0.65, 0.6, 0.6)
ON CONFLICT (id) DO UPDATE SET
  model_start_date = EXCLUDED.model_start_date,
  inflation_rate = EXCLUDED.inflation_rate,
  base_management_fee = EXCLUDED.base_management_fee,
  incentive_management_fee = EXCLUDED.incentive_management_fee,
  staff_salary = EXCLUDED.staff_salary,
  travel_cost_per_client = EXCLUDED.travel_cost_per_client,
  it_license_per_client = EXCLUDED.it_license_per_client,
  marketing_rate = EXCLUDED.marketing_rate,
  misc_ops_rate = EXCLUDED.misc_ops_rate,
  office_lease_start = EXCLUDED.office_lease_start,
  professional_services_start = EXCLUDED.professional_services_start,
  tech_infra_start = EXCLUDED.tech_infra_start,
  business_insurance_start = EXCLUDED.business_insurance_start,
  standard_acq_package = EXCLUDED.standard_acq_package,
  debt_assumptions = EXCLUDED.debt_assumptions,
  updated_at = EXCLUDED.updated_at,
  commission_rate = EXCLUDED.commission_rate,
  full_catering_fb_boost = EXCLUDED.full_catering_fb_boost,
  partial_catering_fb_boost = EXCLUDED.partial_catering_fb_boost,
  fixed_cost_escalation_rate = EXCLUDED.fixed_cost_escalation_rate,
  safe_tranche1_amount = EXCLUDED.safe_tranche1_amount,
  safe_tranche1_date = EXCLUDED.safe_tranche1_date,
  safe_tranche2_amount = EXCLUDED.safe_tranche2_amount,
  safe_tranche2_date = EXCLUDED.safe_tranche2_date,
  safe_valuation_cap = EXCLUDED.safe_valuation_cap,
  safe_discount_rate = EXCLUDED.safe_discount_rate,
  company_tax_rate = EXCLUDED.company_tax_rate,
  company_ops_start_date = EXCLUDED.company_ops_start_date,
  fiscal_year_start_month = EXCLUDED.fiscal_year_start_month,
  partner_comp_year1 = EXCLUDED.partner_comp_year1,
  partner_comp_year2 = EXCLUDED.partner_comp_year2,
  partner_comp_year3 = EXCLUDED.partner_comp_year3,
  partner_comp_year4 = EXCLUDED.partner_comp_year4,
  partner_comp_year5 = EXCLUDED.partner_comp_year5,
  partner_comp_year6 = EXCLUDED.partner_comp_year6,
  partner_comp_year7 = EXCLUDED.partner_comp_year7,
  partner_comp_year8 = EXCLUDED.partner_comp_year8,
  partner_comp_year9 = EXCLUDED.partner_comp_year9,
  partner_comp_year10 = EXCLUDED.partner_comp_year10,
  partner_count_year1 = EXCLUDED.partner_count_year1,
  partner_count_year2 = EXCLUDED.partner_count_year2,
  partner_count_year3 = EXCLUDED.partner_count_year3,
  partner_count_year4 = EXCLUDED.partner_count_year4,
  partner_count_year5 = EXCLUDED.partner_count_year5,
  partner_count_year6 = EXCLUDED.partner_count_year6,
  partner_count_year7 = EXCLUDED.partner_count_year7,
  partner_count_year8 = EXCLUDED.partner_count_year8,
  partner_count_year9 = EXCLUDED.partner_count_year9,
  partner_count_year10 = EXCLUDED.partner_count_year10,
  company_name = EXCLUDED.company_name,
  funding_source_label = EXCLUDED.funding_source_label,
  exit_cap_rate = EXCLUDED.exit_cap_rate,
  sales_commission_rate = EXCLUDED.sales_commission_rate,
  event_expense_rate = EXCLUDED.event_expense_rate,
  other_expense_rate = EXCLUDED.other_expense_rate,
  utilities_variable_split = EXCLUDED.utilities_variable_split;

-- Reset global_assumptions sequence
SELECT setval('global_assumptions_id_seq', (SELECT MAX(id) FROM global_assumptions));

-- ============================================
-- PROPERTIES (5 properties)
-- ============================================
INSERT INTO properties (id, name, location, market, image_url, status, acquisition_date, operations_start_date, purchase_price, building_improvements, pre_opening_costs, operating_reserve, room_count, start_adr, adr_growth_rate, start_occupancy, max_occupancy, occupancy_ramp_months, occupancy_growth_step, stabilization_months, type, catering_level, created_at, updated_at, acquisition_ltv, acquisition_interest_rate, acquisition_term_years, acquisition_closing_cost_rate, will_refinance, refinance_date, refinance_ltv, refinance_interest_rate, refinance_term_years, refinance_closing_cost_rate, cost_rate_rooms, cost_rate_fb, cost_rate_admin, cost_rate_marketing, cost_rate_property_ops, cost_rate_utilities, cost_rate_insurance, cost_rate_taxes, cost_rate_it, cost_rate_ffe, rev_share_events, rev_share_fb, rev_share_other, full_catering_percent, partial_catering_percent, cost_rate_other, exit_cap_rate, tax_rate, user_id) VALUES
(6, 'The Hudson Estate', 'Upstate New York', 'North America', '/images/property-ny.png', 'Development', '2026-06-01', '2026-12-01', 2300000, 800000, 150000, 200000, 20, 330, 0.025, 0.6, 0.9, 6, 0.05, 36, 'Full Equity', 'Partial', '2026-01-27 15:48:26.455715', '2026-01-27 15:48:26.455715', NULL, NULL, NULL, NULL, 'Yes', '2029-12-01', NULL, NULL, NULL, NULL, 0.36, 0.15, 0.08, 0.01, 0.04, 0.05, 0.02, 0.03, 0.005, 0.04, 0.43, 0.22, 0.07, 0.4, 0.3, 0.05, 0.085, 0.25, NULL),
(7, 'Eden Summit Lodge', 'Eden, Utah', 'North America', '/images/property-utah.png', 'Acquisition', '2027-01-01', '2027-07-01', 2300000, 800000, 150000, 200000, 20, 390, 0.025, 0.6, 0.9, 6, 0.05, 36, 'Full Equity', 'Full', '2026-01-27 15:48:26.455715', '2026-01-27 15:48:26.455715', NULL, NULL, NULL, NULL, 'Yes', '2030-07-01', NULL, NULL, NULL, NULL, 0.36, 0.15, 0.08, 0.01, 0.04, 0.05, 0.02, 0.03, 0.005, 0.04, 0.43, 0.22, 0.07, 0.4, 0.3, 0.05, 0.085, 0.25, NULL),
(8, 'Austin Hillside', 'Austin, Texas', 'North America', '/images/property-austin.png', 'Acquisition', '2027-04-01', '2028-01-01', 2300000, 800000, 150000, 200000, 20, 270, 0.025, 0.6, 0.9, 6, 0.05, 36, 'Full Equity', 'Partial', '2026-01-27 15:48:26.455715', '2026-01-27 15:48:26.455715', NULL, NULL, NULL, NULL, 'Yes', '2031-01-01', NULL, NULL, NULL, NULL, 0.36, 0.15, 0.08, 0.01, 0.04, 0.05, 0.02, 0.03, 0.005, 0.04, 0.43, 0.22, 0.07, 0.4, 0.3, 0.05, 0.085, 0.25, NULL),
(9, 'Casa Medellín', 'Medellín, Colombia', 'Latin America', '/images/property-medellin.png', 'Acquisition', '2026-09-01', '2028-07-01', 3500000, 800000, 150000, 200000, 30, 180, 0.04, 0.6, 0.9, 6, 0.05, 36, 'Financed', 'Full', '2026-01-27 15:48:26.455715', '2026-01-27 15:48:26.455715', 0.75, 0.09, 25, 0.02, NULL, NULL, NULL, NULL, NULL, NULL, 0.36, 0.15, 0.08, 0.01, 0.04, 0.05, 0.02, 0.03, 0.005, 0.04, 0.43, 0.22, 0.07, 0.4, 0.3, 0.05, 0.085, 0.25, NULL),
(10, 'Blue Ridge Manor', 'Asheville, North Carolina', 'North America', '/images/property-asheville.png', 'Acquisition', '2027-07-01', '2028-07-01', 3500000, 800000, 150000, 200000, 30, 342, 0.025, 0.6, 0.9, 6, 0.05, 36, 'Financed', 'Full', '2026-01-27 15:48:26.455715', '2026-01-27 15:48:26.455715', 0.75, 0.09, 25, 0.02, NULL, NULL, NULL, NULL, NULL, NULL, 0.36, 0.15, 0.08, 0.01, 0.04, 0.05, 0.02, 0.03, 0.005, 0.04, 0.43, 0.22, 0.07, 0.4, 0.3, 0.05, 0.085, 0.25, NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  location = EXCLUDED.location,
  market = EXCLUDED.market,
  image_url = EXCLUDED.image_url,
  status = EXCLUDED.status,
  acquisition_date = EXCLUDED.acquisition_date,
  operations_start_date = EXCLUDED.operations_start_date,
  purchase_price = EXCLUDED.purchase_price,
  building_improvements = EXCLUDED.building_improvements,
  pre_opening_costs = EXCLUDED.pre_opening_costs,
  operating_reserve = EXCLUDED.operating_reserve,
  room_count = EXCLUDED.room_count,
  start_adr = EXCLUDED.start_adr,
  adr_growth_rate = EXCLUDED.adr_growth_rate,
  start_occupancy = EXCLUDED.start_occupancy,
  max_occupancy = EXCLUDED.max_occupancy,
  occupancy_ramp_months = EXCLUDED.occupancy_ramp_months,
  occupancy_growth_step = EXCLUDED.occupancy_growth_step,
  stabilization_months = EXCLUDED.stabilization_months,
  type = EXCLUDED.type,
  catering_level = EXCLUDED.catering_level,
  updated_at = EXCLUDED.updated_at,
  acquisition_ltv = EXCLUDED.acquisition_ltv,
  acquisition_interest_rate = EXCLUDED.acquisition_interest_rate,
  acquisition_term_years = EXCLUDED.acquisition_term_years,
  acquisition_closing_cost_rate = EXCLUDED.acquisition_closing_cost_rate,
  will_refinance = EXCLUDED.will_refinance,
  refinance_date = EXCLUDED.refinance_date,
  refinance_ltv = EXCLUDED.refinance_ltv,
  refinance_interest_rate = EXCLUDED.refinance_interest_rate,
  refinance_term_years = EXCLUDED.refinance_term_years,
  refinance_closing_cost_rate = EXCLUDED.refinance_closing_cost_rate,
  cost_rate_rooms = EXCLUDED.cost_rate_rooms,
  cost_rate_fb = EXCLUDED.cost_rate_fb,
  cost_rate_admin = EXCLUDED.cost_rate_admin,
  cost_rate_marketing = EXCLUDED.cost_rate_marketing,
  cost_rate_property_ops = EXCLUDED.cost_rate_property_ops,
  cost_rate_utilities = EXCLUDED.cost_rate_utilities,
  cost_rate_insurance = EXCLUDED.cost_rate_insurance,
  cost_rate_taxes = EXCLUDED.cost_rate_taxes,
  cost_rate_it = EXCLUDED.cost_rate_it,
  cost_rate_ffe = EXCLUDED.cost_rate_ffe,
  rev_share_events = EXCLUDED.rev_share_events,
  rev_share_fb = EXCLUDED.rev_share_fb,
  rev_share_other = EXCLUDED.rev_share_other,
  full_catering_percent = EXCLUDED.full_catering_percent,
  partial_catering_percent = EXCLUDED.partial_catering_percent,
  cost_rate_other = EXCLUDED.cost_rate_other,
  exit_cap_rate = EXCLUDED.exit_cap_rate,
  tax_rate = EXCLUDED.tax_rate;

-- Reset properties sequence
SELECT setval('properties_id_seq', (SELECT MAX(id) FROM properties));

-- ============================================
-- DESIGN THEMES (1 theme)
-- ============================================
INSERT INTO design_themes (id, name, description, is_active, colors, created_at, updated_at) VALUES
(1, 'Fluid Glass', 'Inspired by Apple''s iOS design language, Fluid Glass creates a sense of depth and dimension through translucent layers, subtle gradients, and smooth animations. The design emphasizes content while maintaining visual hierarchy through careful use of blur effects and glass-like surfaces.', true, 
'[{"name": "Sage Green", "rank": 1, "hexCode": "#9FBCA4", "description": "PALETTE: Secondary accent for subtle highlights, card borders, and supporting visual elements."}, {"name": "Deep Green", "rank": 2, "hexCode": "#257D41", "description": "PALETTE: Primary brand color for main action buttons, active navigation items, and key highlights."}, {"name": "Warm Cream", "rank": 3, "hexCode": "#FFF9F5", "description": "PALETTE: Light background for page backgrounds, card surfaces, and warm accents."}, {"name": "Deep Black", "rank": 4, "hexCode": "#0a0a0f", "description": "PALETTE: Dark theme background for navigation sidebars, dark glass panels, and login screens."}, {"name": "Salmon", "rank": 5, "hexCode": "#F4795B", "description": "PALETTE: Accent color for warnings, notifications, and emphasis highlights."}, {"name": "Yellow Gold", "rank": 6, "hexCode": "#F59E0B", "description": "PALETTE: Accent color for highlights, badges, and attention-drawing elements."}, {"name": "Chart Blue", "rank": 1, "hexCode": "#3B82F6", "description": "CHART: Primary chart line color for revenue and key financial metrics."}, {"name": "Chart Red", "rank": 2, "hexCode": "#EF4444", "description": "CHART: Secondary chart line color for expenses and cost-related metrics."}, {"name": "Chart Purple", "rank": 3, "hexCode": "#8B5CF6", "description": "CHART: Tertiary chart line color for cash flow and profitability metrics."}]',
'2026-01-31 23:18:22.995853', '2026-02-01 18:25:02.364433')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  colors = EXCLUDED.colors,
  updated_at = EXCLUDED.updated_at;

-- Reset design_themes sequence
SELECT setval('design_themes_id_seq', (SELECT MAX(id) FROM design_themes));

-- ============================================
-- Note: Scenarios contain large JSONB data and 
-- reference user_id foreign keys. Import users first.
-- Scenarios will be recreated by users as needed.
-- ============================================

-- Verify data was imported
SELECT 'Users:' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Global Assumptions:', COUNT(*) FROM global_assumptions
UNION ALL
SELECT 'Properties:', COUNT(*) FROM properties
UNION ALL
SELECT 'Design Themes:', COUNT(*) FROM design_themes;
