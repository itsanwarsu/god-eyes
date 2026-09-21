import { IndicatorDataTable } from '@/components/analytics/IndicatorDataTable';
import { IndicatorChart } from '@/components/analytics/IndicatorChart';
import {
  getIndicator,
  getIndicatorDimensions,
  getIndicatorData,
} from '../../../lib/api/analytics';
import { IndicatorFilters } from '@/components/analytics/IndicatorFilters';

interface PageProps {
  params: Promise<{
    bpsVarId: string;
  }>;
  searchParams: Promise<{
    vervar?: string;
    turvar?: string;
    turtahun?: string;
  }>;
}

export default async function IndicatorPage({
  params,
  searchParams,
}: PageProps) {
  const { bpsVarId } = await params;
  const filters = await searchParams;
  
  const id = Number(bpsVarId);

  if (!Number.isInteger(id)) {
    throw new Error('Invalid indicator ID');
  }

  // Memanggil API dengan filter dari searchParams
  const [indicator, dimensions, data] = await Promise.all([
    getIndicator(id),
    getIndicatorDimensions(id),
    getIndicatorData(id, {
      vervar: filters.vervar,
      turvar: filters.turvar,
      turtahun: filters.turtahun,
    }),
  ]);

  return (
    <main className="space-y-6 p-6">
      <section>
        <p className="text-sm text-muted-foreground">
          BPS Indicator {indicator.bpsVarId}
        </p>

        <h1 className="text-2xl font-bold">
          {indicator.title}
        </h1>

        {indicator.description && (
          <p className="mt-2 text-muted-foreground">
            {indicator.description}
          </p>
        )}
      </section>

      {/* Komponen Filter ditambahkan di sini */}
      <IndicatorFilters
        dimensions={dimensions.dimensions}
      />

<IndicatorChart
  data={data.data}
/>

<IndicatorDataTable
  data={data.data}
/>
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">
            Total Observations
          </p>

          <p className="mt-1 text-2xl font-bold">
            {data.total}
          </p>
        </div>

        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">
            Unit
          </p>

          <p className="mt-1 font-medium">
            {indicator.unit || '-'}
          </p>
        </div>

        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">
            Dimensions
          </p>

          <p className="mt-1 text-2xl font-bold">
            {dimensions.dimensions.length}
          </p>
        </div>
      </section>

      <section className="rounded-lg border p-6">
        <h2 className="mb-4 text-lg font-semibold">
          Available Dimensions
        </h2>

        <div className="space-y-4">
          {dimensions.dimensions.map((dimension) => (
            <div key={dimension.type}>
              <p className="mb-2 font-medium">
                {dimension.type}
              </p>

              <div className="flex flex-wrap gap-2">
                {dimension.values.map((value) => (
                  <span
                    key={value.code}
                    className="rounded-md bg-muted px-3 py-1 text-sm"
                  >
                    {value.label}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border p-6">
        <h2 className="mb-4 text-lg font-semibold">
          Data Preview
        </h2>

        <div className="space-y-2">
          {data.data
            .slice(0, 20)
            .map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between border-b py-2"
              >
                <div>
                  <p className="font-medium">
                    {item.period}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    {Object.values(item.dimensions)
                      .map((dimension) => dimension.label)
                      .join(' · ')}
                  </p>
                </div>

                <p className="font-semibold">
                  {item.value ?? '-'}
                </p>
              </div>
            ))}
        </div>
      </section>
    </main>
  );
}
