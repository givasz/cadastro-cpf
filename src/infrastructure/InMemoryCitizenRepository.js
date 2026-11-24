import { CitizenRepository } from '../domain/CitizenRepository.js';
import { CitizenAlreadyRegisteredError } from '../domain/errors.js';

export class InMemoryCitizenRepository extends CitizenRepository {
  #citizensByCpf = new Map();

  constructor(citizens = []) {
    super();
    for (const citizen of citizens) {
      this.#citizensByCpf.set(citizen.cpf.value, citizen);
    }
  }

  async add(citizen) {
    if (this.#citizensByCpf.has(citizen.cpf.value)) {
      throw new CitizenAlreadyRegisteredError(citizen.cpf);
    }
    this.#citizensByCpf.set(citizen.cpf.value, citizen);
  }

  async search(query) {
    return query.apply(this.#citizensByCpf.values());
  }
}
