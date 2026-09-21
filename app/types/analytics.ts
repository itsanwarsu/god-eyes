export interface Indicator {
  id: string;
  bpsVarId: number;
  domain: string;
  title: string;
  description: string | null;
  unit: string | null;
  frequency: string | null;
}

export interface IndicatorListResponse {
  data: Indicator[];

  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DimensionValue {
  code: string;
  label: string;
}

export interface IndicatorDimension {
  type: string;
  values: DimensionValue[];
}

export interface IndicatorDimensionsResponse {
  indicator: {
    bpsVarId: number;
    title: string;
  };

  dimensions: IndicatorDimension[];
}

export interface ObservationDimension {
  [key: string]: {
    code: string;
    label: string;
  };
}

export interface IndicatorObservation {
  period: string;
  dimensions: ObservationDimension;
  value: string | number | null;
}

export interface IndicatorDataResponse {
  indicator: {
    bpsVarId: number;
    title: string;
    unit: string | null;
  };

  total: number;

  data: IndicatorObservation[];
}
