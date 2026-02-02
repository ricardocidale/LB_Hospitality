-- Step 4: Design Themes
-- Run this LAST in the production database

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

SELECT setval('design_themes_id_seq', (SELECT MAX(id) FROM design_themes));
