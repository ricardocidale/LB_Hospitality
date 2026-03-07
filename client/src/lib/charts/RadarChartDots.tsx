import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { RadarChartDotsProps } from "./types";

export function RadarChartDots({
  data,
  config,
  dataKey = "value",
  axisKey = "axis",
  color,
  fillOpacity = 0.6,
  gridType = "polygon",
  className,
}: RadarChartDotsProps) {
  const resolvedColor = color ?? `var(--color-${dataKey})`;

  return (
    <ChartContainer
      config={config}
      className={className ?? "mx-auto aspect-square max-h-[250px]"}
    >
      <RadarChart data={data}>
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <PolarAngleAxis dataKey={axisKey} />
        <PolarGrid gridType={gridType} />
        <Radar
          dataKey={dataKey}
          fill={resolvedColor}
          fillOpacity={fillOpacity}
          dot={{ r: 4, fillOpacity: 1 }}
        />
      </RadarChart>
    </ChartContainer>
  );
}
