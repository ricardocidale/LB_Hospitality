---
name: export-system
description: Shared formatting, styling, and generation patterns for all document exports (PDF, PPTX, Excel, CSV, PNG) used across the hospitality business portal. Covers brand palette, row data model, number formatting, PDF/PPTX/Excel/CSV/PNG helpers, and dashboard export orchestrators. Use this skill when working on any document export feature.
---

# Export System

Shared export formatting and generation patterns for PDF (jsPDF), PPTX (pptxgenjs), Excel (SheetJS), CSV, and PNG (dom-to-image-more). Consistent brand palette (SAGE_GREEN, DARK_GREEN, NAVY), row data model (ExportRowMeta), normalizeCaps(), alternating row tint, and branded footers across all formats. Dashboard comprehensive PDF and single-statement exports.

Key files: `client/src/lib/exports/` (exportStyles, pdfHelpers, pptxExport, csvExport, pngExport, excel/).

**Canonical reference:** `.claude/skills/exports/SKILL.md`

See also: `.claude/skills/design-system/SKILL.md` (brand identity), `.claude/skills/finance/SKILL.md` (data sources)
