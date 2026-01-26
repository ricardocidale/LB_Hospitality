import { formatMoney } from "@/lib/financialEngine";
import { cn } from "@/lib/utils";

interface MoneyProps {
  amount: number;
  className?: string;
}

export function Money({ amount, className }: MoneyProps) {
  const isNegative = amount < 0;
  return (
    <span className={cn(isNegative && "text-red-500", className)}>
      {formatMoney(amount)}
    </span>
  );
}
