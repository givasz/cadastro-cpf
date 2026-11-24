export class HttpError extends Error {
  /**
   * @param {number} status código de status HTTP
   * @param {string} message
   * @param {Record<string, string>} [headers] cabeçalhos adicionais da resposta (ex.: Allow)
   */
  constructor(status, message, headers = {}) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.headers = headers;
  }
}
