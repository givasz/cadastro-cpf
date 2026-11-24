import { Cpf } from '/domain/Cpf.js';
import { PersonName } from '/domain/PersonName.js';
import { CpfMask } from './CpfMask.js';
import { FormField } from './FormField.js';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

export class RegistrationForm {
  #form;
  #api;
  #alert;
  #result;
  #submitButton;
  #nameField;
  #cpfField;

  /**
   * @param {{
   *   form: HTMLFormElement,
   *   alert: HTMLElement,
   *   result: HTMLElement,
   *   api: import('./ApiClient.js').ApiClient,
   * }} elements
   */
  constructor({ form, alert, result, api }) {
    this.#form = form;
    this.#alert = alert;
    this.#result = result;
    this.#api = api;
    this.#submitButton = form.querySelector('button[type="submit"]');
    this.#nameField = new FormField(form.elements.namedItem('name'), PersonName);
    this.#cpfField = new FormField(form.elements.namedItem('cpf'), Cpf, { validMessage: 'CPF válido' });
  }

  mount() {
    this.#cpfField.onInput(() => this.#handleCpfInput());
    this.#nameField.onInput(() => this.#nameField.reset());
    this.#form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.#submit();
    });
  }

  /**
   * Aplica a máscara e valida o CPF automaticamente assim que os 11 dígitos são informados.
   */
  #handleCpfInput() {
    this.#cpfField.value = CpfMask.apply(this.#cpfField.value);

    if (CpfMask.isComplete(this.#cpfField.value)) {
      this.#cpfField.validate();
    } else {
      this.#cpfField.reset();
    }
  }

  async #submit() {
    this.#hideAlert();

    // Todos os campos são validados para que o usuário veja todos os erros de uma só vez.
    const invalidFields = [this.#nameField, this.#cpfField].filter((field) => !field.validate());
    if (invalidFields.length > 0) {
      invalidFields[0].focus();
      return;
    }

    this.#setBusy(true);
    try {
      const { message, citizen } = await this.#api.registerCitizen({
        name: this.#nameField.value,
        cpf: this.#cpfField.value,
      });
      this.#showSuccess(message, citizen);
      this.#clear();
    } catch (error) {
      this.#showFailure(error);
    } finally {
      this.#setBusy(false);
    }
  }

  #showSuccess(message, citizen) {
    this.#result.querySelector('[data-message]').textContent = message;
    this.#result.querySelector('[data-name]').textContent = citizen.name;
    this.#result.querySelector('[data-cpf]').textContent = citizen.cpf;
    this.#result.querySelector('[data-registered-at]').textContent = dateFormatter.format(
      new Date(citizen.registeredAt),
    );
    this.#result.hidden = false;
  }

  #showFailure(error) {
    this.#result.hidden = true;

    const field = [this.#nameField, this.#cpfField].find(({ name }) => name === error.field);
    if (field) {
      field.showError(error.message);
      field.focus();
      return;
    }
    this.#alert.textContent = error.message;
    this.#alert.hidden = false;
  }

  #clear() {
    this.#form.reset();
    this.#nameField.reset();
    this.#cpfField.reset();
  }

  #hideAlert() {
    this.#alert.hidden = true;
    this.#alert.textContent = '';
  }

  #setBusy(busy) {
    this.#submitButton.disabled = busy;
    this.#submitButton.textContent = busy ? 'Cadastrando...' : 'Cadastrar';
  }
}
