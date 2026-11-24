export class ApiError extends Error {
  /**
   * @param {string} message mensagem pronta para exibição
   * @param {{ status?: number, field?: string }} [details]
   */
  constructor(message, { status, field } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.field = field;
  }
}

export class ApiClient {
  #baseUrl;

  constructor(baseUrl = '/api') {
    this.#baseUrl = baseUrl;
  }

  /**
   * @param {{ name: string, cpf: string }} citizen
   */
  registerCitizen(citizen) {
    return this.#request('/citizens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(citizen),
    });
  }

  searchCitizens(term) {
    const query = new URLSearchParams({ q: term });
    return this.#request(`/citizens?${query}`);
  }

  async #request(path, options) {
    let response;
    try {
      response = await fetch(`${this.#baseUrl}${path}`, options);
    } catch {
      throw new ApiError('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.');
    }

    const body = await response.json().catch(() => null);
    if (!response.ok) {
      throw new ApiError(body?.error?.message ?? 'Ocorreu um erro inesperado. Tente novamente.', {
        status: response.status,
        field: body?.error?.field,
      });
    }
    return body;
  }
}
