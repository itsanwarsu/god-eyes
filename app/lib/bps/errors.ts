export class BpsError extends Error {
  status?: number;
  details?: unknown;

  constructor(
    message: string,
    options?: {
      status?: number;
      details?: unknown;
    }
  ) {
    super(message);

    this.name = "BpsError";
    this.status = options?.status;
    this.details = options?.details;
  }
}
