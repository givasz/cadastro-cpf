import { ValidationError } from '/domain/errors.js';

/**
 * Agrupa um campo do formulário com sua mensagem de feedback e o objeto de valor que o valida.
 */
export class FormField {
  #input;
  #message;
  #ValueObject;
  #validMessage;

  /**
   * @param {HTMLInputElement} input campo com aria-describedby apontando para o elemento de mensagem
   * @param {new (value: string) => unknown} ValueObject classe de domínio que valida o valor
   * @param {{ validMessage?: string }} [options] mensagem exibida quando o valor é válido
   */
  constructor(input, ValueObject, { validMessage = '' } = {}) {
    this.#input = input;
    this.#message = document.getElementById(input.getAttribute('aria-describedby'));
    this.#ValueObject = ValueObject;
    this.#validMessage = validMessage;
  }

  get name() {
    return this.#input.name;
  }

  get value() {
    return this.#input.value;
  }

  set value(value) {
    this.#input.value = value;
  }

  onInput(listener) {
    this.#input.addEventListener('input', listener);
  }

  /**
   * Valida o valor atual e exibe o resultado no campo.
   * @returns {boolean}
   */
  validate() {
    try {
      new this.#ValueObject(this.value);
      this.showValid();
      return true;
    } catch (error) {
      if (!(error instanceof ValidationError)) throw error;
      this.showError(error.message);
      return false;
    }
  }

  showError(message) {
    this.#setState('invalid', message);
    this.#input.setAttribute('aria-invalid', 'true');
  }

  showValid() {
    this.#setState('valid', this.#validMessage);
    this.#input.removeAttribute('aria-invalid');
  }

  reset() {
    this.#setState(null, '');
    this.#input.removeAttribute('aria-invalid');
  }

  focus() {
    this.#input.focus();
  }

  #setState(state, message) {
    this.#input.classList.toggle('is-invalid', state === 'invalid');
    this.#input.classList.toggle('is-valid', state === 'valid');
    this.#message.dataset.state = state ?? '';
    this.#message.textContent = message;
  }
}
