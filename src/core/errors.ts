export class UniFiPayError extends Error {
  readonly code: string;
  readonly status?: number;

  constructor(message: string, options: { code: string; status?: number }) {
    super(message);
    this.name = "UniFiPayError";
    this.code = options.code;
    this.status = options.status;
  }
}
