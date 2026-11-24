/**
 * Traduz requisições HTTP em chamadas ao CitizenService e o resultado em respostas JSON.
 */
export class CitizenController {
  #service;

  /**
   * @param {import('../application/CitizenService.js').CitizenService} service
   */
  constructor(service) {
    this.#service = service;
  }

  async register(request) {
    const { name, cpf } = (await request.json()) ?? {};
    const citizen = await this.#service.register({ name, cpf });

    return {
      status: 201,
      body: {
        message: 'Cidadão cadastrado com sucesso!',
        citizen: CitizenController.#present(citizen),
      },
    };
  }

  async search(request) {
    const citizens = await this.#service.search(request.query.get('q'));

    return {
      status: 200,
      body: { citizens: citizens.map(CitizenController.#present) },
    };
  }

  static #present(citizen) {
    return {
      name: citizen.name.value,
      cpf: citizen.cpf.formatted,
      registeredAt: citizen.registeredAt.toISOString(),
    };
  }
}
