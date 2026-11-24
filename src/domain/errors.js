export class DomainError extends Error {
  /**
   * @param {string} message mensagem pronta para ser exibida ao usuário
   * @param {{ field?: string }} [options] atributo relacionado ao erro, quando houver
   */
  constructor(message, { field } = {}) {
    super(message);
    this.name = new.target.name;
    this.field = field;
  }
}

export class ValidationError extends DomainError {}

export class CitizenAlreadyRegisteredError extends DomainError {
  constructor(cpf) {
    super(`Já existe um cidadão cadastrado com o CPF ${cpf.formatted}.`, { field: 'cpf' });
  }
}
