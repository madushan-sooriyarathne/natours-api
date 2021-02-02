class AppError extends Error {
  statusCode: number;
  status: string;
  isOpError: boolean;

  constructor(message: string, statusCode: number, status: string = "error") {
    super(message);
    this.statusCode = statusCode;
    this.status = status;
    this.isOpError = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
