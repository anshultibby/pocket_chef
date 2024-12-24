export interface ApiError {
  status: number;
  message: string;
  details?: unknown;
}

export class ApiException extends Error {
  constructor(public error: ApiError) {
    super(error.message);
    this.name = 'ApiException';
  }
}

export interface ApiResponse<T> {
  data: T;
  metadata?: {
    page?: number;
    total?: number;
    limit?: number;
  };
}
