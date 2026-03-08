# Skill: Insurance Costs Research

## Overview
Research hospitality-specific insurance benchmarks, liability coverage, and property insurance premiums for a specific location and property type.

## Key Metrics to Extract
- **insuranceCostRate**: Annual property insurance premium as a percentage of property value (acquisition price + improvements).
- **liabilityCoverage**: Standard coverage levels for boutique hotels in the region.
- **zonePremiums**: Geographic-specific premium adjustments (e.g., flood, hurricane, wildfire zones).

## Research Strategy
1. Search for hospitality insurance market reports (e.g., Gallagher, Marsh McLennan).
2. Look for regional insurance premium averages for commercial real estate.
3. Check geographic risk maps for the specific location.

## Output Format
```json
{
  "insuranceCosts": {
    "insuranceCostRate": "0.15% - 0.25% of property value",
    "liabilityCoverage": "$10M - $25M aggregate",
    "premiumDrivers": ["Flood Zone AE", "Replacement Cost Value increase"],
    "sources": ["Marsh McLennan", "Insurance Information Institute"]
  }
}
```
