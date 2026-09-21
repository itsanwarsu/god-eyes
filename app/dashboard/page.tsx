import Link from 'next/link';
import { getIndicators } from '../lib/api/analytics';

export default async function DashboardPage() {
  try {
    const response = await getIndicators({
      page: 1,
      limit: 20,
    });

    return (
      <main className="p-6">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>

        <p className="mt-2 text-muted-foreground">
          Total indicators: {response.pagination.total}
        </p>

        {response.data.length === 0 ? (
          <p className="mt-6 text-muted-foreground">
            Belum ada indicator.
          </p>
        ) : (
          <div className="mt-6 space-y-3">
            {response.data.map((indicator) => (
              <Link
                key={indicator.id}
                href={`/dashboard/indicators/${indicator.bpsVarId}`}
                className="block rounded-lg border p-4 transition hover:bg-muted"
              >
                <p className="font-medium">
                  {indicator.title}
                </p>

                <p className="text-sm text-muted-foreground">
                  BPS Variable ID: {indicator.bpsVarId}
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
    );
  } catch {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <p className="mt-4 text-red-500">
          Gagal memuat data indicators.
        </p>
      </main>
    );
  }
}
