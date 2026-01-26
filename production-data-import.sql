-- L+B Hospitality - Production Data Import
-- Run these statements in your production database via the Database pane

-- First, clear any existing data (optional - only if you want a fresh start)
-- DELETE FROM properties;
-- DELETE FROM global_assumptions;

-- Import Global Assumptions
INSERT INTO global_assumptions (
  id, model_start_date, inflation_rate, base_management_fee, incentive_management_fee,
  partner_salary, staff_salary, travel_cost_per_client, it_license_per_client,
  marketing_rate, misc_ops_rate, office_lease_start, professional_services_start,
  tech_infra_start, business_insurance_start, standard_acq_package, debt_assumptions,
  commission_rate, full_catering_fb_boost, partial_catering_fb_boost,
  fixed_cost_escalation_rate, safe_tranche1_amount, safe_tranche1_date,
  safe_tranche2_amount, safe_tranche2_date, safe_valuation_cap, safe_discount_rate,
  company_tax_rate, company_ops_start_date, fiscal_year_start_month
) VALUES (
  1, '2026-04-01', 0.03, 0.05, 0.15,
  180000, 75000, 12000, 24000,
  0.05, 0.03, 36000, 24000,
  18000, 12000,
  '{"monthsToOps": 6, "purchasePrice": 2300000, "preOpeningCosts": 150000, "operatingReserve": 200000, "buildingImprovements": 800000}',
  '{"acqLTV": 0.75, "refiLTV": 0.75, "interestRate": 0.09, "amortizationYears": 25, "acqClosingCostRate": 0.02, "refiClosingCostRate": 0.03}',
  0.06, 0.5, 0.25,
  0.03, 800000, '2026-06-01',
  800000, '2027-04-01', 2500000, 0.2,
  0.3, '2026-06-01', 1
) ON CONFLICT (id) DO UPDATE SET
  model_start_date = EXCLUDED.model_start_date,
  inflation_rate = EXCLUDED.inflation_rate,
  base_management_fee = EXCLUDED.base_management_fee,
  incentive_management_fee = EXCLUDED.incentive_management_fee,
  partner_salary = EXCLUDED.partner_salary,
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
  fiscal_year_start_month = EXCLUDED.fiscal_year_start_month;

-- Import Properties
INSERT INTO properties (
  id, name, location, market, image_url, status, acquisition_date, operations_start_date,
  purchase_price, building_improvements, pre_opening_costs, operating_reserve,
  room_count, start_adr, adr_growth_rate, start_occupancy, max_occupancy,
  occupancy_ramp_months, occupancy_growth_step, stabilization_months, type, catering_level,
  cost_rate_rooms, cost_rate_fb, cost_rate_admin, cost_rate_marketing, cost_rate_property_ops,
  cost_rate_utilities, cost_rate_insurance, cost_rate_taxes, cost_rate_it, cost_rate_ffe,
  rev_share_events, rev_share_fb, rev_share_other, full_catering_percent, partial_catering_percent,
  cost_rate_other, exit_cap_rate, tax_rate
) VALUES
(1, 'The Hudson Estate', 'Upstate New York', 'North America', '/src/assets/property-ny.png', 'Development', '2026-06-01', '2026-12-01',
  2300000, 800000, 150000, 200000, 20, 330, 0.025, 0.6, 0.9, 6, 0.05, 36, 'Full Equity', 'Partial',
  0.36, 0.15, 0.08, 0.05, 0.04, 0.05, 0.02, 0.03, 0.02, 0.04, 0.43, 0.22, 0.07, 0.4, 0.3, 0.05, 0.085, 0.25),

(2, 'Eden Summit Lodge', 'Eden, Utah', 'North America', '/src/assets/property-utah.png', 'Acquisition', '2027-01-01', '2027-07-01',
  2300000, 800000, 150000, 200000, 20, 390, 0.025, 0.6, 0.9, 6, 0.05, 36, 'Full Equity', 'Full',
  0.36, 0.15, 0.08, 0.05, 0.04, 0.05, 0.02, 0.03, 0.02, 0.04, 0.43, 0.22, 0.07, 0.4, 0.3, 0.05, 0.085, 0.25),

(3, 'Austin Hillside', 'Austin, Texas', 'North America', '/src/assets/property-austin.png', 'Acquisition', '2027-04-01', '2028-01-01',
  2300000, 800000, 150000, 200000, 20, 270, 0.025, 0.6, 0.9, 6, 0.05, 36, 'Full Equity', 'Partial',
  0.36, 0.15, 0.08, 0.05, 0.04, 0.05, 0.02, 0.03, 0.02, 0.04, 0.43, 0.22, 0.07, 0.4, 0.3, 0.05, 0.085, 0.25),

(4, 'Casa Medellín', 'Medellín, Colombia', 'Latin America', '/src/assets/property-medellin.png', 'Acquisition', '2026-09-01', '2028-07-01',
  3500000, 800000, 150000, 200000, 30, 180, 0.04, 0.6, 0.9, 6, 0.05, 36, 'Financed', 'Full',
  0.36, 0.15, 0.08, 0.05, 0.04, 0.05, 0.02, 0.03, 0.02, 0.04, 0.43, 0.22, 0.07, 0.4, 0.3, 0.05, 0.085, 0.25),

(5, 'Blue Ridge Manor', 'Asheville, North Carolina', 'North America', '/src/assets/property-asheville.png', 'Acquisition', '2027-07-01', '2028-07-01',
  3500000, 800000, 150000, 200000, 30, 342, 0.025, 0.6, 0.9, 6, 0.05, 36, 'Financed', 'Full',
  0.36, 0.15, 0.08, 0.05, 0.04, 0.05, 0.02, 0.03, 0.02, 0.04, 0.43, 0.22, 0.07, 0.4, 0.3, 0.05, 0.085, 0.25)

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

-- Reset the sequence for properties table to avoid ID conflicts on new inserts
SELECT setval('properties_id_seq', (SELECT MAX(id) FROM properties));
