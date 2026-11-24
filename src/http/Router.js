import { HttpError } from './HttpError.js';

/**
 * @typedef {{ status: number, body: unknown }} HandlerResult
 * @typedef {(request: import('./HttpRequest.js').HttpRequest) => Promise<HandlerResult>} Handler
 */

export class Router {
  /** @type {Map<string, Map<string, Handler>>} caminho -> (método -> handler) */
  #routes = new Map();

  get(path, handler) {
    return this.#register('GET', path, handler);
  }

  post(path, handler) {
    return this.#register('POST', path, handler);
  }

  /**
   * @returns {Handler}
   * @throws {HttpError} 404 quando o caminho não existe e 405 quando o método não é suportado
   */
  resolve(method, path) {
    const handlersByMethod = this.#routes.get(path);
    if (!handlersByMethod) {
      throw new HttpError(404, 'Recurso não encontrado.');
    }

    const handler = handlersByMethod.get(method);
    if (!handler) {
      const allowed = [...handlersByMethod.keys()].join(', ');
      throw new HttpError(405, 'Método não permitido para este recurso.', { Allow: allowed });
    }
    return handler;
  }

  #register(method, path, handler) {
    if (!this.#routes.has(path)) {
      this.#routes.set(path, new Map());
    }
    this.#routes.get(path).set(method, handler);
    return this;
  }
}
