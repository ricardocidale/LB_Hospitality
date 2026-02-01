import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown } from "lucide-react";

const PRESET_COLORS = [
  // Row 1: Theme colors
  ["#257D41", "#3B82F6", "#F4795B", "#9FBCA4", "#FFF9F5"],
  // Row 2: Standard colors
  ["#C00000", "#FF0000", "#FFC000", "#FFFF00", "#92D050"],
  ["#00B050", "#00B0F0", "#0070C0", "#002060", "#7030A0"],
  // Row 3: Grays
  ["#000000", "#404040", "#808080", "#BFBFBF", "#FFFFFF"],
  // Row 4: Pastels
  ["#F8CECC", "#FFE6CC", "#FFF2CC", "#D5E8D4", "#DAE8FC"],
  // Row 5: More colors
  ["#E1D5E7", "#60A5FA", "#34D399", "#FB923C", "#F472B6"],
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [customColor, setCustomColor] = useState(value);

  const handleColorSelect = (color: string) => {
    onChange(color);
    setOpen(false);
  };

  const handleCustomColorChange = (color: string) => {
    setCustomColor(color);
    onChange(color);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between px-3 h-9"
          data-testid="button-color-picker"
        >
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded border border-gray-300 shadow-sm"
              style={{ backgroundColor: value }}
            />
            <span className="font-mono text-xs uppercase">{value}</span>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-3" align="start">
        <div className="space-y-3">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Theme Colors</div>
          <div className="space-y-1">
            {PRESET_COLORS.map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-1">
                {row.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorSelect(color)}
                    className={`w-10 h-7 rounded border-2 transition-all hover:scale-110 hover:z-10 ${
                      value.toUpperCase() === color.toUpperCase()
                        ? "border-gray-900 ring-2 ring-gray-400"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                    data-testid={`color-${color.replace("#", "")}`}
                  />
                ))}
              </div>
            ))}
          </div>

          <div className="pt-2 border-t">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Custom Color</div>
            <div className="flex gap-2">
              <input
                type="color"
                value={customColor}
                onChange={(e) => handleCustomColorChange(e.target.value)}
                className="w-10 h-9 rounded border cursor-pointer"
              />
              <Input
                value={customColor}
                onChange={(e) => handleCustomColorChange(e.target.value)}
                placeholder="#000000"
                className="flex-1 font-mono text-xs uppercase"
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
