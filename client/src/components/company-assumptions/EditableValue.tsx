import { useState } from "react";
import { formatPercent, formatMoney } from "@/lib/financialEngine";

export default function EditableValue({
  value,
  onChange,
  format,
  min,
  max,
  step,
}: {
  value: number;
  onChange: (v: number) => void;
  format: "percent" | "dollar" | "number";
  min: number;
  max: number;
  step: number;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const displayValue = () => {
    if (format === "percent") return formatPercent(value);
    if (format === "dollar") return formatMoney(value);
    return value.toLocaleString();
  };

  const handleEdit = () => {
    if (format === "percent") {
      setInputValue((value * 100).toFixed(1));
    } else {
      setInputValue(value.toString());
    }
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    let numValue = parseFloat(inputValue);
    if (isNaN(numValue)) return;
    if (format === "percent") numValue = numValue / 100;
    numValue = Math.max(min, Math.min(max, numValue));
    onChange(numValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBlur();
    } else if (e.key === "Escape") {
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoFocus
        className="w-24 px-1 py-0.5 text-right font-mono font-semibold border rounded bg-white border-primary/40 text-gray-900"
      />
    );
  }

  return (
    <span
      onClick={handleEdit}
      className="cursor-pointer hover:text-secondary text-secondary font-mono font-semibold"
      title="Click to edit"
    >
      {displayValue()}
    </span>
  );
}
