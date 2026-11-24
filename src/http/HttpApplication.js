import { once } from 'node:events';
import { createServer } from 'node:http';
import { HttpError } from './HttpError.js';
import { HttpRequest } from './HttpRequest.js';

const API_PREFIX = '/api/';

/**
 * Ponto de entrada das requisições: rotas sob /api/ vão para o Router,
 * as demais são tratadas como arquivos estáticos da interface.
 */
export class HttpApplication {
  #router;
  #staticFiles;
  #errorResponder;
  #server = null;

  /**
   * @param {{
   *   router: import('./Router.js').Router,
   *   staticFiles: import('./StaticFileServer.js').StaticFileServer,
   *   errorResponder: import('./ErrorResponder.js').ErrorResponder,
   * }} dependencies
   */
  constructor({ router, staticFiles, errorResponder }) {
    this.#router = router;
    this.#staticFiles = staticFiles;
    this.#errorResponder = errorResponder;
  }

  /**
   * @returns {Promise<import('node:net').AddressInfo>}
   */
  async listen(port, host) {
    this.#server = createServer((request, response) => this.#handle(request, response));
    this.#server.listen(port, host);
    await once(this.#server, 'listening');
    return this.#server.address();
  }

  async close() {
    if (!this.#server) return;

    const closed = once(this.#server, 'close');
    this.#server.close();
    this.#server.closeAllConnections();
    await closed;
    this.#server = null;
  }

  async #handle(rawRequest, response) {
    response.setHeader('X-Content-Type-Options', 'nosniff');

    try {
      await this.#dispatch(new HttpRequest(rawRequest), response);
    } catch (error) {
      this.#respondWithError(error, response);
    }
  }

  async #dispatch(request, response) {
    if (request.path.startsWith(API_PREFIX)) {
      const handler = this.#router.resolve(request.method, request.path);
      const { status, body } = await handler(request);
      HttpApplication.#sendJson(response, status, body);
      return;
    }

    if (request.method !== 'GET') {
      throw new HttpError(405, 'Método não permitido.', { Allow: 'GET' });
    }
    const served = await this.#staticFiles.serve(request.path, response);
    if (!served) {
      throw new HttpError(404, 'Página não encontrada.');
    }
  }

  #respondWithError(error, response) {
    const { status, headers, body } = this.#errorResponder.toResponse(error);

    // Se a resposta já começou a ser enviada (ex.: falha no meio de um arquivo), só resta encerrá-la.
    if (response.headersSent) {
      response.destroy();
      return;
    }
    HttpApplication.#sendJson(response, status, body, headers);
  }

  static #sendJson(response, status, body, headers = {}) {
    const payload = JSON.stringify(body);
    response.writeHead(status, {
      ...headers,
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': Buffer.byteLength(payload),
    });
    response.end(payload);
  }
}
