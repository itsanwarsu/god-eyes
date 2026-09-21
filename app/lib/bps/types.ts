export interface BpsVariable {
  var_id: number;
  title: string;
  [key: string]: unknown;
}

export interface BpsPeriod {
  th_id?: number | string;
  th?: number | string;
  tahun?: number | string;
  title?: string;
  [key: string]: unknown;
}

export interface BpsApiResponse<T = unknown> {
  status?: string;
  message?: string;
  "data-availability"?: string;
  data?: T;
  [key: string]: unknown;
}

export interface BpsDataItem {
  [key: string]: unknown;
}

export interface GetDataOptions {
  domain?: string;
  varId: number;

  /**
   * Jika diberikan, gunakan periode tertentu.
   * Contoh: "125"
   */
  th?: string | number;

  /**
   * Jika true, client akan mencoba menemukan
   * periode terbaru secara otomatis.
   */
  latest?: boolean;

  /**
   * Jumlah periode yang ingin dicoba.
   */
  periodLimit?: number;
}

export interface BpsDataResult {
  variableId: number;
  domain: string;

  period: string;

  periods: BpsPeriod[];

  raw: BpsApiResponse;

  data: BpsDataItem[];
}
