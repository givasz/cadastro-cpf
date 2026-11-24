import { CitizenAlreadyRegisteredError, ValidationError } from '../domain/errors.js';
import { HttpError } from './HttpError.js';

/**
 * Converte exceções em respostas HTTP. Erros conhecidos viram mensagens para o usuário;
 * qualquer outro é registrado no log e respondido de forma genérica, sem expor detalhes internos.
 */
export class ErrorResponder {
  #logger;

  constructor(logger) {
    this.#logger = logger;
  }

  /**
   * @returns {{ status: number, headers: Record<string, string>, body: unknown }}
   */
  toResponse(error) {
    if (error instanceof ValidationError) {
      return ErrorResponder.#build(422, error.message, error.field);
    }
    if (error instanceof CitizenAlreadyRegisteredError) {
      return ErrorResponder.#build(409, error.message, error.field);
    }
    if (error instanceof HttpError) {
      return { ...ErrorResponder.#build(error.status, error.message), headers: error.headers };
    }

    this.#logger.error(error);
    return ErrorResponder.#build(500, 'Ocorreu um erro inesperado. Tente novamente mais tarde.');
  }

  static #build(status, message, field) {
    return { status, headers: {}, body: { error: { message, field } } };
  }
}
