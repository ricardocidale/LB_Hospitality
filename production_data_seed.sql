-- Production Database Seed Script
-- Run these statements in your production database after publishing
-- Go to Database pane > Production database > SQL tab

-- ============================================
-- USERS (passwords will need to be set separately)
-- ============================================
INSERT INTO users (id, email, name, company, title, role, password)
VALUES 
  (1, 'admin', 'Ricardo Cidale', 'Norfolk Group', 'Partner', 'admin', '$2b$10$placeholder'),
  (2, 'rosario@kitcapital.com', 'Rosario David', 'KIT Capital', 'COO', 'user', '$2b$10$placeholder'),
  (3, 'checker', 'Checker User', '', '', 'user', '$2b$10$placeholder')
ON CONFLICT (id) DO NOTHING;

-- NOTE: After inserting users, you'll need to reset their passwords through the app
-- or update the password hash directly

-- ============================================
-- GLOBAL ASSUMPTIONS
-- ============================================
INSERT INTO global_assumptions (
  id, model_start_date, inflation_rate, base_management_fee, incentive_management_fee,
  staff_salary, travel_cost_per_client, it_license_per_client, marketing_rate, misc_ops_rate,
  office_lease_start, professional_services_start, tech_infra_start, business_insurance_start,
  standard_acq_package, debt_assumptions, commission_rate, full_catering_fb_boost, partial_catering_fb_boost,
  fixed_cost_escalation_rate, safe_tranche1_amount, safe_tranche1_date, safe_tranche2_amount, safe_tranche2_date,
  safe_valuation_cap, safe_discount_rate, company_tax_rate, company_ops_start_date, fiscal_year_start_month,
  partner_comp_year1, partner_comp_year2, partner_comp_year3, partner_comp_year4, partner_comp_year5,
  partner_comp_year6, partner_comp_year7, partner_comp_year8, partner_comp_year9, partner_comp_year10,
  partner_count_year1, partner_count_year2, partner_count_year3, partner_count_year4, partner_count_year5,
  partner_count_year6, partner_count_year7, partner_count_year8, partner_count_year9, partner_count_year10,
  company_name, funding_source_label
)
VALUES (
  2, '2026-04-01', 0.03, 0.05, 0.15,
  75000, 12000, 3000, 0.05, 0.03,
  36000, 24000, 18000, 12000,
  '{"monthsToOps": 6, "purchasePrice": 2300000, "preOpeningCosts": 150000, "operatingReserve": 200000, "buildingImprovements": 800000}',
  '{"acqLTV": 0.75, "refiLTV": 0.75, "interestRate": 0.09, "amortizationYears": 25, "acqClosingCostRate": 0.02, "refiClosingCostRate": 0.03}',
  0.06, 0.5, 0.25,
  0.03, 750000, '2026-06-01', 750000, '2027-04-01',
  2500000, 0.2, 0.3, '2026-06-01', 1,
  540000, 540000, 540000, 600000, 600000,
  700000, 700000, 800000, 800000, 900000,
  3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
  'L+B Hospitality Company', 'SAFE'
)
ON CONFLICT (id) DO UPDATE SET
  model_start_date = EXCLUDED.model_start_date,
  inflation_rate = EXCLUDED.inflation_rate,
  base_management_fee = EXCLUDED.base_management_fee,
  incentive_management_fee = EXCLUDED.incentive_management_fee,
  staff_salary = EXCLUDED.staff_salary,
  company_name = EXCLUDED.company_name;

-- ============================================
-- PROPERTIES
-- ============================================
INSERT INTO properties (
  id, name, location, market, image_url, status, acquisition_date, operations_start_date,
  purchase_price, building_improvements, pre_opening_costs, operating_reserve, room_count,
  start_adr, adr_growth_rate, start_occupancy, max_occupancy, occupancy_ramp_months,
  occupancy_growth_step, stabilization_months, type, catering_level,
  acquisition_ltv, acquisition_interest_rate, acquisition_term_years, acquisition_closing_cost_rate,
  will_refinance, refinance_date,
  cost_rate_rooms, cost_rate_fb, cost_rate_admin, cost_rate_marketing, cost_rate_property_ops,
  cost_rate_utilities, cost_rate_insurance, cost_rate_taxes, cost_rate_it, cost_rate_ffe, cost_rate_other,
  rev_share_events, rev_share_fb, rev_share_other, full_catering_percent, partial_catering_percent,
  exit_cap_rate, tax_rate
)
VALUES 
  (6, 'The Hudson Estate', 'Upstate New York', 'North America', '/images/property-ny.png', 'Development', '2026-06-01', '2026-12-01',
   2300000, 800000, 150000, 200000, 20,
   330, 0.025, 0.6, 0.9, 6, 0.05, 36, 'Full Equity', 'Partial',
   NULL, NULL, NULL, NULL, 'Yes', '2029-12-01',
   0.36, 0.15, 0.08, 0.01, 0.04, 0.05, 0.02, 0.03, 0.005, 0.04, 0.05,
   0.43, 0.22, 0.07, 0.4, 0.3, 0.085, 0.25),
   
  (7, 'Eden Summit Lodge', 'Eden, Utah', 'North America', '/images/property-utah.png', 'Acquisition', '2027-01-01', '2027-07-01',
   2300000, 800000, 150000, 200000, 20,
   390, 0.025, 0.6, 0.9, 6, 0.05, 36, 'Full Equity', 'Full',
   NULL, NULL, NULL, NULL, 'Yes', '2030-07-01',
   0.36, 0.15, 0.08, 0.01, 0.04, 0.05, 0.02, 0.03, 0.005, 0.04, 0.05,
   0.43, 0.22, 0.07, 0.4, 0.3, 0.085, 0.25),
   
  (8, 'Austin Hillside', 'Austin, Texas', 'North America', '/images/property-austin.png', 'Acquisition', '2027-04-01', '2028-01-01',
   2300000, 800000, 150000, 200000, 20,
   270, 0.025, 0.6, 0.9, 6, 0.05, 36, 'Full Equity', 'Partial',
   NULL, NULL, NULL, NULL, 'Yes', '2031-01-01',
   0.36, 0.15, 0.08, 0.01, 0.04, 0.05, 0.02, 0.03, 0.005, 0.04, 0.05,
   0.43, 0.22, 0.07, 0.4, 0.3, 0.085, 0.25),
   
  (9, 'Casa Medellín', 'Medellín, Colombia', 'Latin America', '/images/property-medellin.png', 'Acquisition', '2026-09-01', '2028-07-01',
   3500000, 800000, 150000, 200000, 30,
   180, 0.04, 0.6, 0.9, 6, 0.05, 36, 'Financed', 'Full',
   0.75, 0.09, 25, 0.02, NULL, NULL,
   0.36, 0.15, 0.08, 0.01, 0.04, 0.05, 0.02, 0.03, 0.005, 0.04, 0.05,
   0.43, 0.22, 0.07, 0.4, 0.3, 0.085, 0.25),
   
  (10, 'Blue Ridge Manor', 'Asheville, North Carolina', 'North America', '/images/property-asheville.png', 'Acquisition', '2027-07-01', '2028-07-01',
   3500000, 800000, 150000, 200000, 30,
   342, 0.025, 0.6, 0.9, 6, 0.05, 36, 'Financed', 'Full',
   0.75, 0.09, 25, 0.02, NULL, NULL,
   0.36, 0.15, 0.08, 0.01, 0.04, 0.05, 0.02, 0.03, 0.005, 0.04, 0.05,
   0.43, 0.22, 0.07, 0.4, 0.3, 0.085, 0.25)
ON CONFLICT (id) DO NOTHING;

-- Reset sequence to avoid ID conflicts for future inserts
SELECT setval('properties_id_seq', (SELECT MAX(id) FROM properties));
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('global_assumptions_id_seq', (SELECT MAX(id) FROM global_assumptions));
