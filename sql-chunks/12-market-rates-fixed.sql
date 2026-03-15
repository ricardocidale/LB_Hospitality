INSERT INTO market_rates (id, rate_key, value, display_value, source, source_url, series_id, published_at, fetched_at, is_manual, manual_note, max_staleness_hours, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES
(1, 'fed_funds', NULL, 'Fed Funds Rate', 'fred', 'https://fred.stlouisfed.org/series/FEDFUNDS', 'FEDFUNDS', NULL, NULL, false, NULL, 24, '2026-03-06T20:15:22.599Z', '2026-03-06T20:15:22.599Z'),
(2, 'sofr', NULL, 'SOFR', 'fred', 'https://fred.stlouisfed.org/series/SOFR', 'SOFR', NULL, NULL, false, NULL, 24, '2026-03-06T20:15:22.603Z', '2026-03-06T20:15:22.603Z'),
(3, 'treasury_10y', NULL, '10-Year Treasury', 'fred', 'https://fred.stlouisfed.org/series/DGS10', 'DGS10', NULL, NULL, false, NULL, 24, '2026-03-06T20:15:22.607Z', '2026-03-06T20:15:22.607Z'),
(4, 'mortgage_30y', NULL, '30-Year Mortgage', 'fred', 'https://fred.stlouisfed.org/series/MORTGAGE30US', 'MORTGAGE30US', NULL, NULL, false, NULL, 168, '2026-03-06T20:15:22.611Z', '2026-03-06T20:15:22.611Z'),
(5, 'cpi_yoy', NULL, 'CPI (YoY)', 'fred', 'https://fred.stlouisfed.org/series/CPIAUCSL', 'CPIAUCSL', NULL, NULL, false, NULL, 168, '2026-03-06T20:15:22.615Z', '2026-03-06T20:15:22.615Z'),
(6, 'cpi_food_bev', NULL, 'CPI Food & Beverages', 'fred', 'https://fred.stlouisfed.org/series/CPIFABSL', 'CPIFABSL', NULL, NULL, false, NULL, 168, '2026-03-06T20:15:22.618Z', '2026-03-06T20:15:22.618Z'),
(7, 'ppi_construction', NULL, 'PPI Construction Materials', 'fred', 'https://fred.stlouisfed.org/series/WPUSI012011', 'WPUSI012011', NULL, NULL, false, NULL, 168, '2026-03-06T20:15:22.621Z', '2026-03-06T20:15:22.621Z'),
(8, 'usd_cop', NULL, 'USD/COP', 'frankfurter', 'https://frankfurter.dev', 'COP', NULL, NULL, false, NULL, 24, '2026-03-06T20:15:22.633Z', '2026-03-06T20:15:22.633Z'),
(9, 'usd_mxn', 17.8215, '17.82', 'frankfurter', 'https://frankfurter.dev', 'MXN', '2026-03-13T00:00:00.000Z', '2026-03-14T21:33:21.388Z', false, NULL, 24, '2026-03-06T20:15:22.637Z', '2026-03-14T21:33:21.389Z'),
(10, 'usd_crc', NULL, 'USD/CRC', 'frankfurter', 'https://frankfurter.dev', 'CRC', NULL, NULL, false, NULL, 24, '2026-03-06T20:15:22.642Z', '2026-03-06T20:15:22.642Z'),
(11, 'hotel_lending_spread', 275, '275 bps', 'admin_manual', '', NULL, NULL, NULL, true, NULL, 2160, '2026-03-06T20:15:22.645Z', '2026-03-06T20:15:22.645Z'),
(12, 'hotel_cap_rate_range', NULL, 'Hotel Cap Rate Range', 'admin_manual', '', NULL, NULL, NULL, true, NULL, 2160, '2026-03-06T20:15:22.649Z', '2026-03-06T20:15:22.649Z')
ON CONFLICT (id) DO NOTHING;