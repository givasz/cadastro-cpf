const NOT_FOUND_MESSAGE = 'Cidadão não encontrado';

export class SearchPanel {
  #form;
  #input;
  #results;
  #itemTemplate;
  #submitButton;
  #clearButton;
  #api;

  /**
   * @param {{
   *   form: HTMLFormElement,
   *   results: HTMLElement,
   *   itemTemplate: HTMLTemplateElement,
   *   api: import('./ApiClient.js').ApiClient,
   * }} elements
   */
  constructor({ form, results, itemTemplate, api }) {
    this.#form = form;
    this.#input = form.elements.namedItem('term');
    this.#results = results;
    this.#itemTemplate = itemTemplate;
    this.#submitButton = form.querySelector('button[type="submit"]');
    this.#clearButton = form.querySelector('.search-clear');
    this.#api = api;
  }

  mount() {
    this.#form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.#search();
    });
    this.#input.addEventListener('input', () => this.#updateClearButton());
    this.#clearButton.addEventListener('click', () => this.#clear());
  }

  #clear() {
    this.#input.value = '';
    this.#results.replaceChildren();
    this.#updateClearButton();
    this.#input.focus();
  }

  #updateClearButton() {
    const isEmpty = this.#input.value === '' && this.#results.childElementCount === 0;
    this.#clearButton.hidden = isEmpty;
  }

  async #search() {
    const term = this.#input.value.trim();
    if (term === '') {
      this.#renderMessage('hint', 'Digite um nome ou CPF para pesquisar.');
      this.#input.focus();
      return;
    }

    this.#setBusy(true);
    try {
      const { citizens } = await this.#api.searchCitizens(term);
      if (citizens.length === 0) {
        this.#renderMessage('empty', NOT_FOUND_MESSAGE, `Nenhum registro corresponde a “${term}”.`);
      } else {
        this.#renderCitizens(citizens);
      }
    } catch (error) {
      this.#renderMessage('error', error.message);
    } finally {
      this.#setBusy(false);
    }
  }

  #renderCitizens(citizens) {
    const summary = document.createElement('p');
    summary.className = 'search-summary';
    summary.textContent =
      citizens.length === 1 ? '1 cidadão encontrado' : `${citizens.length} cidadãos encontrados`;

    const list = document.createElement('ul');
    list.className = 'citizen-list';
    list.append(...citizens.map((citizen) => this.#createItem(citizen)));

    this.#results.replaceChildren(summary, list);
    this.#updateClearButton();
  }

  #createItem(citizen) {
    const item = this.#itemTemplate.content.firstElementChild.cloneNode(true);
    item.querySelector('[data-initials]').textContent = SearchPanel.#initialsOf(citizen.name);
    item.querySelector('[data-name]').textContent = citizen.name;
    item.querySelector('[data-cpf]').textContent = citizen.cpf;
    return item;
  }

  /**
   * @param {'hint' | 'empty' | 'error'} variant
   * @param {string} title
   * @param {string} [detail] texto complementar exibido abaixo do título
   */
  #renderMessage(variant, title, detail) {
    const message = document.createElement('div');
    message.className = `search-message search-message-${variant}`;

    const titleElement = document.createElement('p');
    titleElement.className = 'search-message-title';
    titleElement.textContent = title;
    message.append(titleElement);

    if (detail) {
      const detailElement = document.createElement('p');
      detailElement.className = 'search-message-detail';
      detailElement.textContent = detail;
      message.append(detailElement);
    }

    this.#results.replaceChildren(message);
    this.#updateClearButton();
  }

  #setBusy(busy) {
    this.#submitButton.disabled = busy;
    this.#results.setAttribute('aria-busy', String(busy));
  }

  /**
   * O nome completo sempre tem ao menos duas palavras (regra de PersonName),
   * então as iniciais são a primeira letra do primeiro e do último nome.
   */
  static #initialsOf(name) {
    const words = name.split(' ');
    return `${words[0][0]}${words.at(-1)[0]}`.toUpperCase();
  }
}
