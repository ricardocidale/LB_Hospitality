/**
 * WhatIfPanel.tsx — Scenario analysis sidebar for property-level assumptions.
 *
 * Lets the user adjust key financial levers and instantly see how changes
 * affect the property's projected returns:
 *   • ADR Growth Rate    — annual rate at which Average Daily Rate increases
 *   • Start Occupancy    — day-one occupancy (new hotels ramp up over time)
 *   • Max Occupancy      — stabilized occupancy ceiling (typically 75-90%)
 *   • Purchase Price     — total acquisition cost (land + building + closing)
 *
 * Sliders are bounded around the property's baseline values (±50% for price).
 * Changes are applied in real-time to the global store so the financial
 * engine re-computes projections immediately. A "Reset" button reverts to
 * the original assumptions.
 */
import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";

interface WhatIfPanelProps {
  propertyId: string;
  onClose: () => void;
}

export default function WhatIfPanel({ propertyId, onClose }: WhatIfPanelProps) {
  const property = useStore((s) => s.properties.find((p) => p.id === propertyId));

  const defaults = useMemo(() => {
    if (!property) return null;
    return {
      adrGrowthRate: property.adrGrowthRate,
      startOccupancy: property.startOccupancy,
      maxOccupancy: property.maxOccupancy,
      purchasePrice: property.purchasePrice,
    };
  }, [property]);

  const [adrGrowthRate, setAdrGrowthRate] = useState(property?.adrGrowthRate ?? 0);
  const [startOccupancy, setStartOccupancy] = useState(property?.startOccupancy ?? 0.6);
  const [maxOccupancy, setMaxOccupancy] = useState(property?.maxOccupancy ?? 0.9);
  const [purchasePrice, setPurchasePrice] = useState(property?.purchasePrice ?? 0);

  const priceLow = useMemo(() => Math.round(((defaults?.purchasePrice ?? 0) * 0.5) / 10000) * 10000, [defaults]);
  const priceHigh = useMemo(() => Math.round(((defaults?.purchasePrice ?? 0) * 1.5) / 10000) * 10000, [defaults]);

  const hasChanges = useMemo(() => {
    if (!defaults) return false;
    return (
      adrGrowthRate !== defaults.adrGrowthRate ||
      startOccupancy !== defaults.startOccupancy ||
      maxOccupancy !== defaults.maxOccupancy ||
      purchasePrice !== defaults.purchasePrice
    );
  }, [adrGrowthRate, startOccupancy, maxOccupancy, purchasePrice, defaults]);

  const handleReset = useCallback(() => {
    if (!defaults) return;
    setAdrGrowthRate(defaults.adrGrowthRate);
    setStartOccupancy(defaults.startOccupancy);
    setMaxOccupancy(defaults.maxOccupancy);
    setPurchasePrice(defaults.purchasePrice);
  }, [defaults]);

  const handleApply = useCallback(() => {
    useStore.getState().updateProperty(propertyId, {
      adrGrowthRate,
      startOccupancy,
      maxOccupancy,
      purchasePrice,
    });
    onClose();
  }, [propertyId, adrGrowthRate, startOccupancy, maxOccupancy, purchasePrice, onClose]);

  const changeColor = useCallback(
    (current: number, original: number, higherIsBetter: boolean) => {
      if (current === original) return undefined;
      const favorable = higherIsBetter ? current > original : current < original;
      return favorable ? "#16a34a" : "#d97706";
    },
    [],
  );

  if (!property || !defaults) return null;

  const sliderStyle: React.CSSProperties = { accentColor: "var(--primary)" };

  return (
    <>
      <div
        className="fixed inset-0 bg-foreground/30 z-40"
        onClick={onClose}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClose(); } }}
        data-testid="what-if-overlay"
      />

      <div
        className="fixed top-0 right-0 h-full w-80 z-50 bg-card shadow-xl flex flex-col"
        style={{ backgroundColor: "#FFFDF7" }}
        data-testid="what-if-panel"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground" data-testid="what-if-title">
            What-If Analysis
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            data-testid="what-if-close"
          >
            ✕
          </Button>
        </div>

        <div className="px-4 py-2 border-b border-border">
          <p className="text-sm font-medium text-muted-foreground" data-testid="what-if-property-name">
            {property.name}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-foreground">ADR Growth</label>
              <span className="font-mono tabular-nums text-sm text-foreground" data-testid="slider-value-adr-growth">
                {(adrGrowthRate * 100).toFixed(1)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={0.1}
              step={0.001}
              value={adrGrowthRate}
              onChange={(e) => setAdrGrowthRate(parseFloat(e.target.value))}
              className="w-full h-2 bg-muted rounded-lg cursor-pointer"
              style={sliderStyle}
              data-testid="slider-adr-growth"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
              <span>0%</span>
              <span>10%</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-foreground">Start Occupancy</label>
              <span className="font-mono tabular-nums text-sm text-foreground" data-testid="slider-value-start-occupancy">
                {Math.round(startOccupancy * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0.4}
              max={1}
              step={0.01}
              value={startOccupancy}
              onChange={(e) => setStartOccupancy(parseFloat(e.target.value))}
              className="w-full h-2 bg-muted rounded-lg cursor-pointer"
              style={sliderStyle}
              data-testid="slider-start-occupancy"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
              <span>40%</span>
              <span>100%</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-foreground">Max Occupancy</label>
              <span className="font-mono tabular-nums text-sm text-foreground" data-testid="slider-value-max-occupancy">
                {Math.round(maxOccupancy * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0.6}
              max={1}
              step={0.01}
              value={maxOccupancy}
              onChange={(e) => setMaxOccupancy(parseFloat(e.target.value))}
              className="w-full h-2 bg-muted rounded-lg cursor-pointer"
              style={sliderStyle}
              data-testid="slider-max-occupancy"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
              <span>60%</span>
              <span>100%</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-foreground">Purchase Price</label>
              <span className="font-mono tabular-nums text-sm text-foreground" data-testid="slider-value-purchase-price">
                ${purchasePrice.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min={priceLow}
              max={priceHigh}
              step={10000}
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(parseFloat(e.target.value))}
              className="w-full h-2 bg-muted rounded-lg cursor-pointer"
              style={sliderStyle}
              data-testid="slider-purchase-price"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
              <span>${priceLow.toLocaleString()}</span>
              <span>${priceHigh.toLocaleString()}</span>
            </div>
          </div>

          <div className="border-t border-border pt-4 space-y-2" data-testid="what-if-results">
            <h3 className="text-sm font-semibold text-foreground mb-2">Adjusted Values</h3>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Adjusted ADR Growth:</span>
              <span
                className="font-mono tabular-nums font-medium"
                style={{ color: changeColor(adrGrowthRate, defaults.adrGrowthRate, true) }}
                data-testid="result-adr-growth"
              >
                {(adrGrowthRate * 100).toFixed(1)}%
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Adjusted Start Occupancy:</span>
              <span
                className="font-mono tabular-nums font-medium"
                style={{ color: changeColor(startOccupancy, defaults.startOccupancy, true) }}
                data-testid="result-start-occupancy"
              >
                {Math.round(startOccupancy * 100)}%
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Adjusted Max Occupancy:</span>
              <span
                className="font-mono tabular-nums font-medium"
                style={{ color: changeColor(maxOccupancy, defaults.maxOccupancy, true) }}
                data-testid="result-max-occupancy"
              >
                {Math.round(maxOccupancy * 100)}%
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Adjusted Purchase Price:</span>
              <span
                className="font-mono tabular-nums font-medium"
                style={{ color: changeColor(purchasePrice, defaults.purchasePrice, false) }}
                data-testid="result-purchase-price"
              >
                ${purchasePrice.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-t border-border flex gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!hasChanges}
            className="flex-1"
            data-testid="what-if-reset"
          >
            Reset
          </Button>
          <Button
            onClick={handleApply}
            disabled={!hasChanges}
            className="flex-1"
            data-testid="what-if-apply"
          >
            Apply Changes
          </Button>
        </div>
      </div>
    </>
  );
}
