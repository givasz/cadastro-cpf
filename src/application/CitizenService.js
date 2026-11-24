import { Citizen } from '../domain/Citizen.js';
import { CitizenSearchQuery } from '../domain/CitizenSearchQuery.js';

export class CitizenService {
  #repository;
  #clock;

  /**
   * @param {import('../domain/CitizenRepository.js').CitizenRepository} repository
   * @param {{ now: () => Date }} [clock] fonte da data de cadastro, substituível nos testes
   */
  constructor(repository, clock = { now: () => new Date() }) {
    this.#repository = repository;
    this.#clock = clock;
  }

  /**
   * @param {{ name: string, cpf: string }} data
   * @returns {Promise<Citizen>}
   */
  async register({ name, cpf }) {
    const citizen = new Citizen({ name, cpf, registeredAt: this.#clock.now() });
    await this.#repository.add(citizen);
    return citizen;
  }

  /**
   * @param {string} term nome (ou parte dele) ou CPF (completo ou parcial)
   * @returns {Promise<Citizen[]>}
   */
  async search(term) {
    return this.#repository.search(new CitizenSearchQuery(term));
  }
}
