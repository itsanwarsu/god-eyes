'use client';

import type {
  IndicatorObservation,
} from '@/app/types/analytics';

interface IndicatorDataTableProps {
  data: IndicatorObservation[];
}

export function IndicatorDataTable({
  data,
}: IndicatorDataTableProps) {
  return (
    <section className="rounded-xl border bg-card">
      <div className="border-b p-6">
        <h2 className="text-lg font-semibold">
          Data Table
        </h2>

        <p className="text-sm text-muted-foreground">
          Detailed observations for the selected filters.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="px-6 py-3 text-left font-medium">
                Period
              </th>

              <th className="px-6 py-3 text-left font-medium">
                Dimensions
              </th>

              <th className="px-6 py-3 text-right font-medium">
                Value
              </th>
            </tr>
          </thead>

          <tbody>
            {data.map((item, index) => (
              <tr
                key={`${item.period}-${index}`}
                className="border-b last:border-0"
              >
                <td className="px-6 py-4 font-medium">
                  {item.period}
                </td>

                <td className="px-6 py-4 text-muted-foreground">
                  {Object.values(item.dimensions)
                    .map(
                      (dimension) =>
                        dimension.label,
                    )
                    .join(' · ')}
                </td>

                <td className="px-6 py-4 text-right font-medium">
                  {item.value ?? '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.length === 0 && (
        <div className="p-10 text-center text-sm text-muted-foreground">
          No observations found.
        </div>
      )}
    </section>
  );
}
