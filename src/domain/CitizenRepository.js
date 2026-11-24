/**
 * Contrato de persistência de cidadãos. As implementações concretas ficam na camada de infraestrutura,
 * o que permite trocar o armazenamento (memória, arquivo, banco de dados) sem alterar as regras de negócio.
 */
export class CitizenRepository {
  constructor() {
    if (new.target === CitizenRepository) {
      throw new TypeError('CitizenRepository é abstrato e não pode ser instanciado diretamente.');
    }
  }

  /**
   * Persiste um novo cidadão.
   * Deve rejeitar com CitizenAlreadyRegisteredError quando o CPF já estiver cadastrado.
   * @param {import('./Citizen.js').Citizen} _citizen
   * @returns {Promise<void>}
   */
  async add(_citizen) {
    throw this.#notImplemented('add');
  }

  /**
   * @param {import('./CitizenSearchQuery.js').CitizenSearchQuery} _query
   * @returns {Promise<import('./Citizen.js').Citizen[]>} resultados ordenados por nome
   */
  async search(_query) {
    throw this.#notImplemented('search');
  }

  #notImplemented(method) {
    return new Error(`${this.constructor.name} deve implementar ${method}().`);
  }
}
