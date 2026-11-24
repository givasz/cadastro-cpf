import { ValidationError } from './errors.js';
import { normalizeText } from './normalizeText.js';

// Termos compostos apenas por dígitos e pontuação de CPF são tratados como busca por CPF.
const CPF_TERM_PATTERN = /^(?=.*\d)[\d.\-\s]+$/;
const MIN_NAME_TERM_LENGTH = 2;

const compareByName = (a, b) => a.name.value.localeCompare(b.name.value, 'pt-BR');

/**
 * Representa uma pesquisa de cidadãos a partir do termo digitado pelo usuário.
 * Pesquisas por CPF aceitam números parciais; pesquisas por nome ignoram acentos e maiúsculas.
 */
export class CitizenSearchQuery {
  #matcher;

  constructor(rawTerm) {
    const term = typeof rawTerm === 'string' ? rawTerm.trim() : '';

    if (term === '') {
      throw new ValidationError('Informe um nome ou CPF para pesquisar.', { field: 'term' });
    }

    this.#matcher = CPF_TERM_PATTERN.test(term)
      ? CitizenSearchQuery.#cpfMatcher(term)
      : CitizenSearchQuery.#nameMatcher(term);
  }

  matches(citizen) {
    return this.#matcher(citizen);
  }

  /**
   * Filtra os cidadãos que atendem à pesquisa, ordenados por nome.
   * @param {Iterable<import('./Citizen.js').Citizen>} citizens
   */
  apply(citizens) {
    return [...citizens].filter((citizen) => this.matches(citizen)).sort(compareByName);
  }

  static #cpfMatcher(term) {
    const digits = term.replace(/\D/g, '');
    return (citizen) => citizen.cpf.value.includes(digits);
  }

  static #nameMatcher(term) {
    const normalizedTerm = normalizeText(term);
    if (normalizedTerm.length < MIN_NAME_TERM_LENGTH) {
      throw new ValidationError(
        `Digite ao menos ${MIN_NAME_TERM_LENGTH} caracteres para pesquisar por nome.`,
        { field: 'term' },
      );
    }
    return (citizen) => normalizeText(citizen.name.value).includes(normalizedTerm);
  }
}
