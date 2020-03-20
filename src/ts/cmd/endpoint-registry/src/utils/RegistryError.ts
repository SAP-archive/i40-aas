class RegistryError extends Error {
  r_statusCode: number;
  constructor(msg: string, statusCode: number) {
    super(msg);
    this.r_statusCode = statusCode;
  }
}
export { RegistryError };
