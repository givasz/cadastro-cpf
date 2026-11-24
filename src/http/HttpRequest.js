import { HttpError } from './HttpError.js';

const MAX_BODY_BYTES = 16 * 1024;

/**
 * Encapsula a requisição nativa do Node, expondo apenas o que os controllers precisam.
 */
export class HttpRequest {
  #raw;
  #url;

  /**
   * @param {import('node:http').IncomingMessage} raw
   */
  constructor(raw) {
    this.#raw = raw;
    this.#url = HttpRequest.#parseUrl(raw.url);
  }

  get method() {
    return this.#raw.method;
  }

  get path() {
    return this.#url.pathname;
  }

  get query() {
    return this.#url.searchParams;
  }

  async json() {
    const contentType = this.#raw.headers['content-type'] ?? '';
    if (!contentType.startsWith('application/json')) {
      throw new HttpError(415, 'O corpo da requisição deve estar no formato JSON.');
    }

    const body = await this.#readBody();
    try {
      return JSON.parse(body);
    } catch {
      throw new HttpError(400, 'O corpo da requisição contém um JSON inválido.');
    }
  }

  static #parseUrl(url) {
    try {
      // A base serve apenas para o parser; usamos somente o caminho e a query string.
      return new URL(url, 'http://localhost');
    } catch {
      throw new HttpError(400, 'URL inválida.');
    }
  }

  async #readBody() {
    const tooLarge = () => new HttpError(413, 'O corpo da requisição excede o tamanho permitido.');

    if (Number(this.#raw.headers['content-length']) > MAX_BODY_BYTES) {
      throw tooLarge();
    }

    // Requisições sem Content-Length (ex.: chunked) são verificadas durante a leitura.
    const chunks = [];
    let size = 0;
    for await (const chunk of this.#raw) {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) throw tooLarge();
      chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString('utf8');
  }
}
