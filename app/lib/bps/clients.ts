import { BpsError } from "./errors";
import type {
  BpsApiResponse,
  BpsDataItem,
  BpsDataResult,
  BpsPeriod,
  BpsVariable,
  GetDataOptions,
} from "./types";

const BPS_BASE_URL =
  process.env.BPS_BASE_URL ??
  "https://webapi.bps.go.id/v1/api";

const BPS_API_KEY = process.env.BPS_API_KEY;

const DEFAULT_LANG = "ind";
const DEFAULT_DOMAIN = "0000";

if (!BPS_API_KEY) {
  throw new Error(
    "BPS_API_KEY belum diset di environment variables"
  );
}

export class BpsClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly lang: string;

  constructor(options?: {
    baseUrl?: string;
    apiKey?: string;
    lang?: string;
  }) {
    this.baseUrl =
      options?.baseUrl ?? BPS_BASE_URL;

    this.apiKey =
      options?.apiKey ?? BPS_API_KEY!;

    this.lang =
      options?.lang ?? DEFAULT_LANG;
  }

  /**
   * --------------------------------------------------
   * LOW LEVEL REQUEST
   * --------------------------------------------------
   */

  private async request<T>(
    path: string
  ): Promise<BpsApiResponse<T>> {

    const cleanPath = path.startsWith("/")
      ? path.slice(1)
      : path;

    const url =
      `${this.baseUrl}/${cleanPath}/key/${this.apiKey}`;

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },

      next: {
        revalidate: 300,
      },
    });

    const contentType =
      response.headers.get("content-type") ?? "";

    const text = await response.text();

    if (!response.ok) {
      throw new BpsError(
        `BPS API request failed: ${response.status}`,
        {
          status: response.status,
          details: text,
        }
      );
    }

    if (
      !contentType.includes("application/json")
    ) {
      throw new BpsError(
        "BPS API mengembalikan response bukan JSON",
        {
          status: response.status,
          details: text.slice(0, 500),
        }
      );
    }

    try {
      return JSON.parse(text);
    } catch {
      throw new BpsError(
        "Response BPS bukan JSON yang valid",
        {
          details: text.slice(0, 500),
        }
      );
    }
  }

  /**
   * --------------------------------------------------
   * VARIABLES
   * --------------------------------------------------
   */

  async getVariables(
    domain = DEFAULT_DOMAIN
  ): Promise<BpsVariable[]> {

    const response =
      await this.request<BpsVariable[]>(
        `/list/model/var/lang/${this.lang}/domain/${domain}`
      );

    return this.extractArray(
      response.data
    ) as BpsVariable[];
  }

  /**
   * Cari variable berdasarkan keyword
   */
  async searchVariables(
    keyword: string,
    domain = DEFAULT_DOMAIN
  ): Promise<BpsVariable[]> {

    const variables =
      await this.getVariables(domain);

    const query =
      keyword.trim().toLowerCase();

    return variables.filter((variable) => {
      const title =
        String(variable.title ?? "")
          .toLowerCase();

      return title.includes(query);
    });
  }

  /**
   * Ambil variable berdasarkan ID
   */
  async getVariable(
    varId: number,
    domain = DEFAULT_DOMAIN
  ): Promise<BpsVariable | undefined> {

    const variables =
      await this.getVariables(domain);

    return variables.find(
      (variable) =>
        Number(variable.var_id) === varId
    );
  }

  /**
   * --------------------------------------------------
   * PERIODS
   * --------------------------------------------------
   *
   * Kita mencoba endpoint period terlebih dahulu.
   */

  async getPeriods(
    varId: number,
    domain = DEFAULT_DOMAIN
  ): Promise<BpsPeriod[]> {

    /**
     * Endpoint period dapat berbeda pada deployment/API
     * BPS yang digunakan.
     *
     * Kita coba beberapa bentuk endpoint.
     */

    const candidates = [
      `/list/model/period/lang/${this.lang}/domain/${domain}/var/${varId}`,

      `/list/model/th/lang/${this.lang}/domain/${domain}/var/${varId}`,
    ];

    let lastError: unknown;

    for (const path of candidates) {
      try {
        const response =
          await this.request<BpsPeriod[]>(
            path
          );

        const periods =
          this.extractArray(
            response.data
          ) as BpsPeriod[];

        if (periods.length > 0) {
          return this.normalizePeriods(
            periods
          );
        }
      } catch (error) {
        lastError = error;
      }
    }

    /**
     * Fallback:
     *
     * Kalau endpoint period tidak tersedia,
     * kita discovery periode dengan mencoba
     * kode tahun secara otomatis.
     */

    return this.discoverPeriods(
      varId,
      domain,
      lastError
    );
  }

  /**
   * --------------------------------------------------
   * AUTOMATIC PERIOD DISCOVERY
   * --------------------------------------------------
   */

  private async discoverPeriods(
    varId: number,
    domain: string,
    previousError?: unknown
  ): Promise<BpsPeriod[]> {

    const currentYear =
      new Date().getFullYear();

    const periods: BpsPeriod[] = [];

    /**
     * Kita coba beberapa tahun terakhir.
     *
     * Untuk dataset tahunan:
     *
     * 2026 -> 126
     * 2025 -> 125
     * 2024 -> 124
     *
     * berdasarkan pola periode yang umum digunakan
     * oleh WebAPI BPS.
     */

    for (
      let year = currentYear;
      year >= currentYear - 15;
      year--
    ) {

      const th =
        String(year - 1900);

      try {
        const response =
          await this.request(
            `/list/model/data/lang/${this.lang}` +
            `/domain/${domain}` +
            `/var/${varId}` +
            `/th/${th}`
          );

        if (
          this.hasUsableData(
            response
          )
        ) {
          periods.push({
            th_id: th,
            tahun: year,
            title: String(year),
          });
        }

      } catch {
        // Periode tidak tersedia.
        continue;
      }
    }

    if (periods.length === 0) {
      throw new BpsError(
        `Tidak menemukan periode untuk var=${varId}`,
        {
          details: previousError,
        }
      );
    }

    return periods;
  }

  /**
   * --------------------------------------------------
   * LATEST PERIOD
   * --------------------------------------------------
   */

  async getLatestPeriod(
    varId: number,
    domain = DEFAULT_DOMAIN
  ): Promise<BpsPeriod> {

    const periods =
      await this.getPeriods(
        varId,
        domain
      );

    if (!periods.length) {
      throw new BpsError(
        `Tidak ada periode untuk var=${varId}`
      );
    }

    return this.sortPeriods(
      periods
    )[0];
  }

  /**
   * --------------------------------------------------
   * DATA
   * --------------------------------------------------
   */

  async getData(
    options: GetDataOptions
  ): Promise<BpsDataResult> {

    const {
      varId,
      domain = DEFAULT_DOMAIN,
      th,
      latest = true,
    } = options;

    let period: string;

    let periods: BpsPeriod[] = [];

    /**
     * User memberikan th secara manual.
     */
    if (th !== undefined) {

      period = String(th);

    } else {

      /**
       * Tidak ada th.
       *
       * Cari otomatis.
       */

      periods =
        await this.getPeriods(
          varId,
          domain
        );

      const latestPeriod =
        this.sortPeriods(
          periods
        )[0];

      if (!latestPeriod) {
        throw new BpsError(
          `Tidak menemukan periode terbaru untuk var=${varId}`
        );
      }

      period =
        this.getPeriodId(
          latestPeriod
        );
    }

    const response =
      await this.request(
        `/list/model/data/lang/${this.lang}` +
        `/domain/${domain}` +
        `/var/${varId}` +
        `/th/${period}`
      );

    const data =
      this.extractData(
        response
      );

    return {
      variableId: varId,
      domain,

      period,

      periods,

      raw: response,

      data,
    };
  }

  /**
   * --------------------------------------------------
   * GET LATEST DATA
   * --------------------------------------------------
   */

  async getLatestData(
    varId: number,
    domain = DEFAULT_DOMAIN
  ) {

    return this.getData({
      varId,
      domain,
      latest: true,
    });
  }

  /**
   * --------------------------------------------------
   * MULTIPLE PERIODS
   * --------------------------------------------------
   */

  async getDataForPeriods(
    varId: number,
    periods: Array<string | number>,
    domain = DEFAULT_DOMAIN
  ) {

    const results = [];

    for (const th of periods) {

      try {

        const result =
          await this.getData({
            varId,
            domain,
            th,
          });

        results.push(result);

      } catch (error) {

        results.push({
          variableId: varId,
          domain,
          period: String(th),
          error,
        });
      }
    }

    return results;
  }

  /**
   * --------------------------------------------------
   * GET DATA BY YEAR
   * --------------------------------------------------
   */

  async getDataByYear(
    varId: number,
    year: number,
    domain = DEFAULT_DOMAIN
  ) {

    /**
     * Untuk annual dataset.
     *
     * Contoh:
     * 2025 -> 125
     */

    const th =
      String(year - 1900);

    return this.getData({
      varId,
      domain,
      th,
    });
  }

  /**
   * --------------------------------------------------
   * HELPERS
   * --------------------------------------------------
   */

  private extractArray(
    data: unknown
  ): unknown[] {

    if (Array.isArray(data)) {
      return data;
    }

    if (
      data &&
      typeof data === "object"
    ) {

      const object =
        data as Record<string, unknown>;

      for (const value of Object.values(
        object
      )) {

        if (Array.isArray(value)) {
          return value;
        }
      }
    }

    return [];
  }

  private extractData(
    response: BpsApiResponse
  ): BpsDataItem[] {

    const data =
      response.data;

    if (Array.isArray(data)) {

      /**
       * Beberapa response BPS mempunyai:
       *
       * data: [
       *   metadata,
       *   data[]
       * ]
       */

      const nested =
        data.find(
          (item) =>
            Array.isArray(item)
        );

      if (Array.isArray(nested)) {
        return nested as BpsDataItem[];
      }

      return data as BpsDataItem[];
    }

    if (
      data &&
      typeof data === "object"
    ) {

      const object =
        data as Record<string, unknown>;

      for (
        const value of Object.values(
          object
        )
      ) {

        if (Array.isArray(value)) {
          return value as BpsDataItem[];
        }
      }
    }

    return [];
  }

  private hasUsableData(
    response: BpsApiResponse
  ): boolean {

    const data =
      response.data;

    if (!data) {
      return false;
    }

    if (Array.isArray(data)) {
      return data.length > 0;
    }

    if (
      typeof data === "object"
    ) {

      return Object.keys(
        data
      ).length > 0;
    }

    return false;
  }

  private normalizePeriods(
    periods: BpsPeriod[]
  ): BpsPeriod[] {

    return periods.map(
      (period) => {

        const id =
          period.th_id ??
          period.th ??
          period.tahun;

        return {
          ...period,

          th_id:
            id !== undefined
              ? String(id)
              : undefined,
        };
      }
    );
  }

  private sortPeriods(
    periods: BpsPeriod[]
  ): BpsPeriod[] {

    return [...periods].sort(
      (a, b) => {

        const aId =
          Number(
            this.getPeriodId(a)
          );

        const bId =
          Number(
            this.getPeriodId(b)
          );

        return bId - aId;
      }
    );
  }

  private getPeriodId(
    period: BpsPeriod
  ): string {

    const id =
      period.th_id ??
      period.th ??
      period.tahun;

    if (id === undefined) {
      throw new BpsError(
        "Period tidak memiliki th_id"
      );
    }

    return String(id);
  }
}
