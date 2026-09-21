'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import type {
  IndicatorDimension,
} from '@/types/analytics';

interface IndicatorFiltersProps {
  dimensions: IndicatorDimension[];
}

export function IndicatorFilters({
  dimensions,
}: IndicatorFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateFilter(
    key: 'vervar' | 'turvar' | 'turtahun',
    value: string,
  ) {
    const params = new URLSearchParams(
      searchParams.toString(),
    );

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    router.replace(
      `${pathname}?${params.toString()}`,
      {
        scroll: false,
      },
    );
  }

  function getDimension(type: string) {
    return dimensions.find(
      (dimension) => dimension.type === type,
    );
  }

  const vervar = getDimension(
    'Variable Classification',
  );

  const turvar = getDimension(
    'Sub Variable',
  );

  const turtahun = getDimension(
    'Time Period',
  );

  return (
    <section className="rounded-xl border bg-card p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold">
          Filters
        </h2>

        <p className="text-sm text-muted-foreground">
          Select dimensions to filter the data.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {vervar && (
          <FilterSelect
            label={vervar.type}
            param="vervar"
            values={vervar.values}
            currentValue={
              searchParams.get('vervar') ?? ''
            }
            onChange={updateFilter}
          />
        )}

        {turvar && (
          <FilterSelect
            label={turvar.type}
            param="turvar"
            values={turvar.values}
            currentValue={
              searchParams.get('turvar') ?? ''
            }
            onChange={updateFilter}
          />
        )}

        {turtahun && (
          <FilterSelect
            label={turtahun.type}
            param="turtahun"
            values={turtahun.values}
            currentValue={
              searchParams.get('turtahun') ?? ''
            }
            onChange={updateFilter}
          />
        )}
      </div>
    </section>
  );
}

interface FilterSelectProps {
  label: string;
  param: 'vervar' | 'turvar' | 'turtahun';
  values: {
    code: string;
    label: string;
  }[];
  currentValue: string;
  onChange: (
    key: 'vervar' | 'turvar' | 'turtahun',
    value: string,
  ) => void;
}

function FilterSelect({
  label,
  param,
  values,
  currentValue,
  onChange,
}: FilterSelectProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {label}
      </label>

      <select
        value={currentValue}
        onChange={(event) =>
          onChange(param, event.target.value)
        }
        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
      >
        <option value="">
          All
        </option>

        {values.map((value) => (
          <option
            key={value.code}
            value={value.code}
          >
            {value.label}
          </option>
        ))}
      </select>
    </div>
  );
}
