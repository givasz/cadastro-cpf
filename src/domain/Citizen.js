import { Cpf } from './Cpf.js';
import { PersonName } from './PersonName.js';

export class Citizen {
  #name;
  #cpf;
  #registeredAt;

  /**
   * @param {{ name: string, cpf: string, registeredAt?: Date }} data
   */
  constructor({ name, cpf, registeredAt = new Date() }) {
    if (!(registeredAt instanceof Date) || Number.isNaN(registeredAt.getTime())) {
      throw new TypeError('registeredAt deve ser uma data válida.');
    }
    this.#name = new PersonName(name);
    this.#cpf = new Cpf(cpf);
    this.#registeredAt = new Date(registeredAt);
  }

  get name() {
    return this.#name;
  }

  get cpf() {
    return this.#cpf;
  }

  get registeredAt() {
    return new Date(this.#registeredAt);
  }
}
