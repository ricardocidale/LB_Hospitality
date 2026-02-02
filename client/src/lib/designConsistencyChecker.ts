/**
 * Design Consistency Checker
 * Validates that UI components follow L+B Hospitality design guidelines
 */

export interface DesignCheck {
  category: string;
  rule: string;
  status: "pass" | "fail" | "warning";
  details: string;
  affectedFiles?: string[];
}

export interface DesignCheckResult {
  timestamp: string;
  totalChecks: number;
  passed: number;
  failed: number;
  warnings: number;
  overallStatus: "PASS" | "FAIL" | "WARNING";
  checks: DesignCheck[];
}

// L+B Design Guidelines
export const DESIGN_GUIDELINES = {
  colors: {
    primary: "#257D41",
    sage: "#9FBCA4", 
    cream: "#FFF9F5",
    coral: "#F4795B",
    darkBackground: "#0a0a0f",
    darkCard: ["#2d4a5e", "#3d5a6a", "#3a5a5e"],
  },
  typography: {
    headers: "font-display", // IBM Plex Sans / Playfair Display
    body: "label-text", // Inter
    numbers: "font-mono", // JetBrains Mono
    noItalics: true,
  },
  buttons: {
    primaryClass: "GlassButton",
    darkGlassEffect: true,
    sageGlow: true,
    exportStyle: "neutral gray background (#f5f5f5), dark text, gray border"
  },
  pages: {
    loginBackground: "#0a0a0f",
    lightTheme: ["white", "gray-50", "gray-100"],
    darkTheme: ["#2d4a5e", "#3d5a6a", "#3a5a5e"],
  },
  spacing: {
    pageHeader: "min-h",
    cardPadding: "p-6",
  },
  charts: {
    background: "white", // Always use white/light background
    gradientColors: {
      green: ["#257D41", "#34D399"], // Revenue, NOI
      blue: ["#3B82F6", "#60A5FA"], // GOP, FCF
      coral: ["#F4795B", "#FB923C"], // FCFE, secondary metrics
    },
    dataPoints: true, // Always show dots at data points
    gridLines: "#E5E7EB", // Light gray grid
    strokeWidth: 3,
    dotRadius: 4,
  },
};

// File patterns to check
const PAGE_FILES = [
  "client/src/pages/Dashboard.tsx",
  "client/src/pages/Login.tsx",
  "client/src/pages/Admin.tsx",
  "client/src/pages/Portfolio.tsx",
  "client/src/pages/PropertyDetail.tsx",
  "client/src/pages/PropertyEdit.tsx",
  "client/src/pages/Company.tsx",
  "client/src/pages/CompanyAssumptions.tsx",
  "client/src/pages/Settings.tsx",
  "client/src/pages/Profile.tsx",
  "client/src/pages/Scenarios.tsx",
  "client/src/pages/Methodology.tsx",
  "client/src/pages/Research.tsx",
];

const COMPONENT_FILES = [
  "client/src/components/Layout.tsx",
  "client/src/components/YearlyIncomeStatement.tsx",
  "client/src/components/YearlyCashFlowStatement.tsx",
  "client/src/components/YearlyBalanceSheet.tsx",
  "client/src/components/MonthlyProForma.tsx",
  "client/src/components/ui/glass-button.tsx",
  "client/src/components/ui/page-header.tsx",
];

export function checkColorPalette(fileContents: Map<string, string>): DesignCheck[] {
  const checks: DesignCheck[] = [];
  const offBrandColors: string[] = [];
  const approvedColors = ["#257D41", "#9FBCA4", "#FFF9F5", "#F4795B", "#0a0a0f", "#2d4a5e", "#3d5a6a", "#3a5a5e"];
  const colorRegex = /#[0-9A-Fa-f]{6}\b/g;
  
  fileContents.forEach((content, file) => {
    const matches = content.match(colorRegex) || [];
    matches.forEach(color => {
      const normalized = color.toLowerCase();
      if (!approvedColors.some(c => c.toLowerCase() === normalized) && 
          !normalized.startsWith("#fff") && !normalized.startsWith("#000") &&
          !normalized.startsWith("#f8") && !normalized.startsWith("#e5") &&
          !normalized.startsWith("#d1") && !normalized.startsWith("#9ca") &&
          !normalized.startsWith("#6b7") && !normalized.startsWith("#374") &&
          !normalized.startsWith("#1f2")) {
        if (!offBrandColors.includes(normalized)) {
          offBrandColors.push(normalized);
        }
      }
    });
  });

  checks.push({
    category: "Color Palette",
    rule: "All colors should be from L+B brand palette",
    status: offBrandColors.length === 0 ? "pass" : offBrandColors.length <= 3 ? "warning" : "fail",
    details: offBrandColors.length === 0 
      ? "All colors match brand palette"
      : `Found ${offBrandColors.length} off-brand colors: ${offBrandColors.slice(0, 5).join(", ")}${offBrandColors.length > 5 ? "..." : ""}`,
  });

  // Check for sage green usage
  let sageUsage = 0;
  fileContents.forEach((content) => {
    if (content.includes("#9FBCA4") || content.includes("9FBCA4")) sageUsage++;
  });
  
  checks.push({
    category: "Color Palette",
    rule: "Sage green (#9FBCA4) should be used for accents",
    status: sageUsage > 5 ? "pass" : "warning",
    details: `Sage green found in ${sageUsage} files`,
  });

  return checks;
}

export function checkTypography(fileContents: Map<string, string>): DesignCheck[] {
  const checks: DesignCheck[] = [];
  
  let fontDisplayUsage = 0;
  let labelTextUsage = 0;
  let fontMonoUsage = 0;
  let italicUsage = 0;
  
  fileContents.forEach((content) => {
    if (content.includes("font-display")) fontDisplayUsage++;
    if (content.includes("label-text")) labelTextUsage++;
    if (content.includes("font-mono")) fontMonoUsage++;
    if (content.includes("italic") && !content.includes("no-italic")) italicUsage++;
  });

  checks.push({
    category: "Typography",
    rule: "Headers should use font-display class",
    status: fontDisplayUsage >= 5 ? "pass" : "warning",
    details: `font-display found in ${fontDisplayUsage} files`,
  });

  checks.push({
    category: "Typography",
    rule: "Body text should use label-text class",
    status: labelTextUsage >= 3 ? "pass" : "warning",
    details: `label-text found in ${labelTextUsage} files`,
  });

  checks.push({
    category: "Typography",
    rule: "Numbers/currency should use font-mono class",
    status: fontMonoUsage >= 5 ? "pass" : "warning",
    details: `font-mono found in ${fontMonoUsage} files`,
  });

  checks.push({
    category: "Typography",
    rule: "No italic text allowed",
    status: italicUsage === 0 ? "pass" : "fail",
    details: italicUsage === 0 ? "No italic usage found" : `Italic found in ${italicUsage} files`,
  });

  return checks;
}

export function checkButtonConsistency(fileContents: Map<string, string>): DesignCheck[] {
  const checks: DesignCheck[] = [];
  
  let glassButtonImports = 0;
  let glassButtonUsage = 0;
  let rawButtonUsage = 0;
  
  fileContents.forEach((content, file) => {
    if (content.includes("GlassButton") || content.includes("glass-button")) {
      glassButtonImports++;
    }
    const glassMatches = (content.match(/<GlassButton/g) || []).length;
    glassButtonUsage += glassMatches;
    
    // Count raw Button usage that might need to be GlassButton
    const buttonMatches = (content.match(/<Button[^>]*variant="default"/g) || []).length;
    rawButtonUsage += buttonMatches;
  });

  checks.push({
    category: "Buttons",
    rule: "Primary actions should use GlassButton component",
    status: glassButtonUsage >= 10 ? "pass" : glassButtonUsage >= 5 ? "warning" : "fail",
    details: `GlassButton used ${glassButtonUsage} times across ${glassButtonImports} files`,
  });

  checks.push({
    category: "Buttons",
    rule: "Avoid raw Button with default variant for primary actions",
    status: rawButtonUsage <= 5 ? "pass" : "warning",
    details: `Found ${rawButtonUsage} raw default buttons (may be intentional for secondary actions)`,
  });

  return checks;
}

export function checkPageHeaders(fileContents: Map<string, string>): DesignCheck[] {
  const checks: DesignCheck[] = [];
  
  let pageHeaderUsage = 0;
  let customHeaderUsage = 0;
  
  fileContents.forEach((content, file) => {
    if (file.includes("/pages/") && !file.includes("Login") && !file.includes("not-found")) {
      if (content.includes("PageHeader") || content.includes("page-header")) {
        pageHeaderUsage++;
      } else if (content.includes("<h1") || content.includes("text-3xl")) {
        customHeaderUsage++;
      }
    }
  });

  checks.push({
    category: "Page Structure",
    rule: "Pages should use standardized PageHeader component",
    status: pageHeaderUsage >= 8 ? "pass" : pageHeaderUsage >= 5 ? "warning" : "fail",
    details: `PageHeader used in ${pageHeaderUsage} pages, ${customHeaderUsage} pages use custom headers`,
  });

  return checks;
}

export function checkDarkGlassTheme(fileContents: Map<string, string>): DesignCheck[] {
  const checks: DesignCheck[] = [];
  
  let darkGradientUsage = 0;
  let backdropBlurUsage = 0;
  
  fileContents.forEach((content) => {
    if (content.includes("from-[#2d4a5e]") || content.includes("via-[#3d5a6a]") || content.includes("to-[#3a5a5e]")) {
      darkGradientUsage++;
    }
    if (content.includes("backdrop-blur")) {
      backdropBlurUsage++;
    }
  });

  checks.push({
    category: "Theme",
    rule: "Dark glass gradient should be consistent",
    status: darkGradientUsage >= 3 ? "pass" : "warning",
    details: `Dark glass gradient found in ${darkGradientUsage} files`,
  });

  checks.push({
    category: "Theme",
    rule: "Backdrop blur should be used for glass effects",
    status: backdropBlurUsage >= 5 ? "pass" : "warning",
    details: `backdrop-blur found in ${backdropBlurUsage} files`,
  });

  return checks;
}

export function checkDataTestIds(fileContents: Map<string, string>): DesignCheck[] {
  const checks: DesignCheck[] = [];
  
  let filesWithTestIds = 0;
  let filesWithInteractiveElements = 0;
  
  fileContents.forEach((content, file) => {
    if (file.includes("/pages/") || file.includes("/components/")) {
      const hasInteractive = content.includes("<Button") || content.includes("<Input") || content.includes("<GlassButton");
      const hasTestIds = content.includes("data-testid");
      
      if (hasInteractive) {
        filesWithInteractiveElements++;
        if (hasTestIds) filesWithTestIds++;
      }
    }
  });

  checks.push({
    category: "Testing",
    rule: "Interactive elements should have data-testid attributes",
    status: filesWithTestIds >= filesWithInteractiveElements * 0.8 ? "pass" : 
            filesWithTestIds >= filesWithInteractiveElements * 0.5 ? "warning" : "fail",
    details: `${filesWithTestIds}/${filesWithInteractiveElements} files with interactive elements have data-testid`,
  });

  return checks;
}

export function checkFinancialFormatting(fileContents: Map<string, string>): DesignCheck[] {
  const checks: DesignCheck[] = [];
  
  let currencyFormatUsage = 0;
  let toLocaleStringUsage = 0;
  
  fileContents.forEach((content) => {
    if (content.includes("formatCurrency") || content.includes("toLocaleString")) {
      currencyFormatUsage++;
    }
    if (content.includes(".toLocaleString(")) {
      toLocaleStringUsage++;
    }
  });

  checks.push({
    category: "Formatting",
    rule: "Currency values should use consistent formatting",
    status: currencyFormatUsage >= 5 ? "pass" : "warning",
    details: `Currency formatting found in ${currencyFormatUsage} files`,
  });

  return checks;
}

export function checkChartStyling(fileContents: Map<string, string>): DesignCheck[] {
  const checks: DesignCheck[] = [];
  
  let chartsWithWhiteBg = 0;
  let chartsWithGradients = 0;
  let chartsWithDots = 0;
  let totalChartFiles = 0;
  const filesWithIssues: string[] = [];
  
  fileContents.forEach((content, file) => {
    // Check files that contain Recharts components
    if (content.includes("<LineChart") || content.includes("<AreaChart") || content.includes("<BarChart")) {
      totalChartFiles++;
      
      // Check for white/light background on chart container
      const hasWhiteBg = content.includes("bg-white") || 
                         content.includes("backgroundColor: 'white'") ||
                         content.includes("backgroundColor: '#fff");
      if (hasWhiteBg) chartsWithWhiteBg++;
      
      // Check for gradient definitions in charts
      const hasGradients = content.includes("<linearGradient") && 
                          (content.includes("Gradient") || content.includes("gradient"));
      if (hasGradients) chartsWithGradients++;
      
      // Check for data point dots on lines
      const hasDots = content.includes("dot={{") || content.includes("dot={true}");
      if (hasDots) chartsWithDots++;
      
      // Track files with missing requirements
      if (!hasWhiteBg || !hasDots) {
        const fileName = file.split("/").pop() || file;
        if (!filesWithIssues.includes(fileName)) {
          filesWithIssues.push(fileName);
        }
      }
    }
  });

  // Only run checks if there are chart files
  if (totalChartFiles > 0) {
    checks.push({
      category: "Charts",
      rule: "Charts should have white/light background for readability",
      status: chartsWithWhiteBg >= totalChartFiles ? "pass" : 
              chartsWithWhiteBg >= totalChartFiles * 0.5 ? "warning" : "fail",
      details: `${chartsWithWhiteBg}/${totalChartFiles} chart files use white background`,
      affectedFiles: filesWithIssues.length > 0 ? filesWithIssues : undefined,
    });

    checks.push({
      category: "Charts",
      rule: "Chart lines should use colorful gradients (green, blue, coral)",
      status: chartsWithGradients >= totalChartFiles * 0.5 ? "pass" : "warning",
      details: `${chartsWithGradients}/${totalChartFiles} chart files use gradient colors`,
    });

    checks.push({
      category: "Charts",
      rule: "Chart lines must have visible data point dots",
      status: chartsWithDots >= totalChartFiles ? "pass" : 
              chartsWithDots >= totalChartFiles * 0.5 ? "warning" : "fail",
      details: `${chartsWithDots}/${totalChartFiles} chart files have data point dots`,
      affectedFiles: filesWithIssues.length > 0 ? filesWithIssues : undefined,
    });
  }

  return checks;
}

export function checkExportButtonStyling(fileContents: Map<string, string>): DesignCheck[] {
  const checks: DesignCheck[] = [];
  
  let correctExportButtons = 0;
  let incorrectExportButtons = 0;
  const filesWithIssues: string[] = [];
  
  fileContents.forEach((content, file) => {
    // Check for export buttons (PDF, CSV, Chart exports)
    const hasExportButtons = content.includes("Export PDF") || 
                             content.includes("Export CSV") || 
                             content.includes("Export Chart");
    
    if (hasExportButtons) {
      // Correct styling: Button variant="outline" OR GlassButton variant="export"
      const hasCorrectStyle = content.includes('variant="outline"') || 
                              content.includes('variant="export"');
      
      // Incorrect: using ghost/default variants for export buttons
      const hasIncorrectGhost = content.includes('variant="ghost"') && 
                                (content.includes("Export PDF") || content.includes("Export CSV"));
      
      if (hasCorrectStyle && !hasIncorrectGhost) {
        correctExportButtons++;
      } else {
        incorrectExportButtons++;
        const fileName = file.split("/").pop() || file;
        if (!filesWithIssues.includes(fileName)) {
          filesWithIssues.push(fileName);
        }
      }
    }
  });

  const totalExportFiles = correctExportButtons + incorrectExportButtons;
  
  if (totalExportFiles > 0) {
    checks.push({
      category: "Export Buttons",
      rule: "Export buttons must use light style (white bg, dark text, gray border)",
      status: incorrectExportButtons === 0 ? "pass" : "fail",
      details: incorrectExportButtons === 0 
        ? `All ${totalExportFiles} files use correct export button styling`
        : `${incorrectExportButtons}/${totalExportFiles} files have incorrect export button styling. Use Button variant="outline" or GlassButton variant="export"`,
      affectedFiles: filesWithIssues.length > 0 ? filesWithIssues : undefined,
    });
  }

  return checks;
}

export function runDesignConsistencyCheck(fileContents: Map<string, string>): DesignCheckResult {
  const allChecks: DesignCheck[] = [
    ...checkColorPalette(fileContents),
    ...checkTypography(fileContents),
    ...checkButtonConsistency(fileContents),
    ...checkPageHeaders(fileContents),
    ...checkDarkGlassTheme(fileContents),
    ...checkDataTestIds(fileContents),
    ...checkFinancialFormatting(fileContents),
    ...checkChartStyling(fileContents),
    ...checkExportButtonStyling(fileContents),
  ];

  const passed = allChecks.filter(c => c.status === "pass").length;
  const failed = allChecks.filter(c => c.status === "fail").length;
  const warnings = allChecks.filter(c => c.status === "warning").length;

  let overallStatus: "PASS" | "FAIL" | "WARNING" = "PASS";
  if (failed > 0) overallStatus = "FAIL";
  else if (warnings > 2) overallStatus = "WARNING";

  return {
    timestamp: new Date().toISOString(),
    totalChecks: allChecks.length,
    passed,
    failed,
    warnings,
    overallStatus,
    checks: allChecks,
  };
}

export const FILES_TO_CHECK = [...PAGE_FILES, ...COMPONENT_FILES];
