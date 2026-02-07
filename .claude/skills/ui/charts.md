# Chart Styling Patterns

## Framework

- **Library:** Recharts
- **Wrapper:** `<ResponsiveContainer>` for responsive sizing
- **Height:** Typically `h-[300px]` on the ResponsiveContainer

## Container Styling

```tsx
<div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6">
  <h3 className="text-lg font-display text-gray-900 mb-4">Chart Title</h3>
  <div className="h-[300px]">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData}>
        {/* ... */}
      </LineChart>
    </ResponsiveContainer>
  </div>
</div>
```

## Color Gradients

Define gradients inside `<defs>` within the chart SVG:

```tsx
<defs>
  {/* Revenue / NOI — Green */}
  <linearGradient id="revenueGradient" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stopColor="#257D41" />
    <stop offset="100%" stopColor="#34D399" />
  </linearGradient>

  {/* GOP / FCF — Blue */}
  <linearGradient id="gopGradient" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stopColor="#3B82F6" />
    <stop offset="100%" stopColor="#60A5FA" />
  </linearGradient>

  {/* FCFE / Secondary — Coral */}
  <linearGradient id="fcfeGradient" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stopColor="#F4795B" />
    <stop offset="100%" stopColor="#FB923C" />
  </linearGradient>
</defs>
```

### Gradient ID Naming
- Revenue/NOI lines: ID pattern `*RevenueGradient` (e.g., `revenueGradient`, `noiRevenueGradient`)
- GOP/FCF lines: blue gradient
- FCFE/secondary lines: coral gradient

## Line Styling

```tsx
<Line
  type="monotone"
  dataKey="revenue"
  stroke="url(#revenueGradient)"
  strokeWidth={3}
  dot={{ fill: '#257D41', stroke: '#fff', strokeWidth: 2, r: 4 }}
  activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
/>
```

## Axis Styling

### XAxis
```tsx
<XAxis
  dataKey="year"
  stroke="#6B7280"
  fontSize={12}
  tickLine={false}
  axisLine={{ stroke: '#E5E7EB' }}
/>
```

### YAxis
```tsx
<YAxis
  stroke="#6B7280"
  fontSize={12}
  tickLine={false}
  axisLine={{ stroke: '#E5E7EB' }}
  tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
/>
```

## Grid

```tsx
<CartesianGrid
  strokeDasharray="3 3"
  stroke="#E5E7EB"
  vertical={false}
/>
```

## Tooltip

```tsx
<Tooltip
  contentStyle={{
    backgroundColor: 'white',
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  }}
  formatter={(value: number) => [`$${(value / 1000000).toFixed(2)}M`, undefined]}
/>
```

## Legend

```tsx
<Legend
  verticalAlign="bottom"
  iconType="line"
/>
```

## Complete Example

```tsx
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from "recharts";

<div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6">
  <h3 className="text-lg font-display text-gray-900 mb-4">
    Portfolio Performance
  </h3>
  <div className="h-[300px]">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#257D41" />
            <stop offset="100%" stopColor="#34D399" />
          </linearGradient>
          <linearGradient id="gopGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#60A5FA" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
        <XAxis
          dataKey="year"
          stroke="#6B7280"
          fontSize={12}
          tickLine={false}
          axisLine={{ stroke: '#E5E7EB' }}
        />
        <YAxis
          stroke="#6B7280"
          fontSize={12}
          tickLine={false}
          axisLine={{ stroke: '#E5E7EB' }}
          tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          }}
          formatter={(value: number) => [`$${(value / 1000000).toFixed(2)}M`, undefined]}
        />
        <Legend verticalAlign="bottom" iconType="line" />
        <Line
          type="monotone"
          dataKey="revenue"
          name="Revenue"
          stroke="url(#revenueGradient)"
          strokeWidth={3}
          dot={{ fill: '#257D41', stroke: '#fff', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
        />
        <Line
          type="monotone"
          dataKey="gop"
          name="GOP"
          stroke="url(#gopGradient)"
          strokeWidth={3}
          dot={{ fill: '#3B82F6', stroke: '#fff', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
</div>
```

## PDF Chart Export

For PDF exports, use `drawLineChart()` from `@/lib/pdfChartDrawer` which renders charts into jsPDF documents with matching styling. The `chartExport.ts` utility handles DOM-to-image conversion for PNG exports using `dom-to-image-more`.
