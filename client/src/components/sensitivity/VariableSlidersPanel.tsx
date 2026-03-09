import { IconSliders } from "@/components/icons";
import type { SensitivityVariable } from "./types";

interface VariableSlidersPanelProps {
  variables: SensitivityVariable[];
  adjustments: Record<string, number>;
  onAdjustmentChange: (id: string, value: number) => void;
}

export function VariableSlidersPanel({ variables, adjustments, onAdjustmentChange }: VariableSlidersPanelProps) {
  return (
    <div className="bg-card/80 rounded-lg p-6 border border-primary/10 shadow-[0_2px_8px_rgba(var(--primary-rgb,159,188,164),0.08)]">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
          <IconSliders className="w-5 h-5 text-secondary" />
        </div>
        <div>
          <h3 className="text-lg font-display font-bold text-foreground" data-testid="text-adjustments-title">
            Variable Adjustments
          </h3>
          <p className="text-xs text-muted-foreground">Drag sliders to model different scenarios</p>
        </div>
      </div>

      <div className="space-y-6">
        {variables.map((v) => {
          const currentVal = adjustments[v.id] ?? v.defaultValue;
          return (
            <div key={v.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">{v.label}</label>
                <span
                  className={`text-sm font-mono font-bold px-2 py-0.5 rounded-md ${
                    currentVal > 0
                      ? "text-secondary bg-primary/15"
                      : currentVal < 0
                      ? "text-red-600 bg-red-50"
                      : "text-muted-foreground bg-muted"
                  }`}
                  data-testid={`value-${v.id}`}
                >
                  {currentVal > 0 ? "+" : ""}
                  {currentVal.toFixed(v.step < 1 ? 1 : 0)}
                  {v.unit === "%" ? "pp" : v.unit}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-10 text-right font-mono">{v.range[0]}</span>
                <div className="flex-1 relative">
                  <input
                    type="range"
                    min={v.range[0]}
                    max={v.range[1]}
                    step={v.step}
                    value={currentVal}
                    onChange={(e) => onAdjustmentChange(v.id, parseFloat(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer accent-primary bg-muted [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-secondary [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-secondary [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:cursor-grab"
                    data-testid={`slider-${v.id}`}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-10 font-mono">
                  {v.range[1] > 0 ? "+" : ""}{v.range[1]}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{v.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
