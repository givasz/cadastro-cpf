import { ValidationError } from './errors.js';

const MAX_LENGTH = 120;
// Letras de qualquer idioma, permitindo apóstrofo e hífen entre elas (ex.: D'Ávila, Ana-Clara).
const WORD_PATTERN = /^\p{L}+(?:['’-]\p{L}+)*$/u;

export class PersonName {
  #value;

  constructor(value) {
    this.#value = PersonName.#parse(value);
  }

  get value() {
    return this.#value;
  }

  equals(other) {
    return other instanceof PersonName && other.value === this.value;
  }

  toString() {
    return this.#value;
  }

  static #parse(value) {
    if (typeof value !== 'string' || value.trim() === '') {
      throw PersonName.#error('Informe o nome completo.');
    }

    const normalized = value.trim().replace(/\s+/g, ' ');
    const words = normalized.split(' ');

    if (normalized.length > MAX_LENGTH) {
      throw PersonName.#error(`O nome deve ter no máximo ${MAX_LENGTH} caracteres.`);
    }
    if (!words.every((word) => WORD_PATTERN.test(word))) {
      throw PersonName.#error('O nome deve conter apenas letras.');
    }
    if (words.length < 2) {
      throw PersonName.#error('Informe o nome completo, com nome e sobrenome.');
    }
    return normalized;
  }

  static #error(message) {
    return new ValidationError(message, { field: 'name' });
  }
}
