'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/app/components/ui/chart';

import type {
  IndicatorObservation,
} from '@/app/types/analytics';

interface IndicatorChartProps {
  data: IndicatorObservation[];
  xDimension?: string;
}

const chartConfig = {
  value: {
    label: 'Value',
  },
};

export function IndicatorChart({
  data,
  xDimension = 'Variable Classification',
}: IndicatorChartProps) {
  const chartData = data
    .map((item) => {
      const dimension = Object.values(
        item.dimensions,
      ).find(
        (value) =>
          value.label === xDimension ||
          value.code === xDimension,
      );

      const numericValue =
        typeof item.value === 'string'
          ? Number(item.value)
          : item.value;

      return {
        label: dimension?.label ?? item.period,
        value:
          typeof numericValue === 'number' &&
          Number.isFinite(numericValue)
            ? numericValue
            : null,
      };
    })
    .filter(
      (item) => item.value !== null,
    );

  return (
    <section className="rounded-xl border bg-card p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold">
          Data Trend
        </h2>

        <p className="text-sm text-muted-foreground">
          Visualization of the selected indicator data.
        </p>
      </div>

      {chartData.length === 0 ? (
        <div className="flex min-h-[350px] items-center justify-center text-sm text-muted-foreground">
          No chart data available.
        </div>
      ) : (
        <ChartContainer
          config={chartConfig}
          className="min-h-[350px] w-full"
        >
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
              top: 12,
              bottom: 12,
            }}
          >
            <CartesianGrid vertical={false} />

            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />

            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />

            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent />
              }
            />

            <Line
              dataKey="value"
              type="monotone"
              stroke="var(--chart-1)"
              strokeWidth={2}
              dot
            />
          </LineChart>
        </ChartContainer>
      )}
    </section>
  );
}
