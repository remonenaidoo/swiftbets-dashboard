export interface ErrorEnvelopeShape {
  type: string;
  title: string;
  status: number;
  code: string;
  correlationId: string;
  detail?: string;
  errors?: { field: string; code: string; message: string }[];
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly correlationId: string | undefined;
  readonly envelope: ErrorEnvelopeShape | undefined;

  constructor(status: number, envelope?: ErrorEnvelopeShape) {
    super(envelope?.detail ?? envelope?.title ?? `Request failed with ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.code = envelope?.code ?? `http_${status}`;
    this.correlationId = envelope?.correlationId;
    this.envelope = envelope;
  }
}
