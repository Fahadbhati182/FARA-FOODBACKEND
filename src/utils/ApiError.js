class ApiError extends Error {
  status;
  message;

  constructor(status, message) {
    super(message);
    this.status = status;
  }

  static BadRequest(message) {
    return new ApiError(400, message);
  }
}
