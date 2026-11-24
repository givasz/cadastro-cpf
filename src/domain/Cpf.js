import { ValidationError } from './errors.js';

const LENGTH = 11;
const ALLOWED_CHARACTERS = /^[\d.\-\s]*$/;

export class Cpf {
  #digits;

  /**
   * @param {string} value CPF com ou sem pontuação (ex.: "529.982.247-25" ou "52998224725")
   */
  constructor(value) {
    this.#digits = Cpf.#parse(value);
  }

  static isValid(value) {
    try {
      Cpf.#parse(value);
      return true;
    } catch (error) {
      if (error instanceof ValidationError) return false;
      throw error;
    }
  }

  get value() {
    return this.#digits;
  }

  get formatted() {
    return this.#digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }

  equals(other) {
    return other instanceof Cpf && other.value === this.value;
  }

  toString() {
    return this.formatted;
  }

  static #parse(value) {
    if (typeof value !== 'string' || value.trim() === '') {
      throw Cpf.#error('Informe o CPF.');
    }
    if (!ALLOWED_CHARACTERS.test(value)) {
      throw Cpf.#error('O CPF deve conter apenas números.');
    }

    const digits = value.replace(/\D/g, '');

    if (digits.length !== LENGTH) {
      throw Cpf.#error(`O CPF deve conter ${LENGTH} dígitos.`);
    }
    if (!Cpf.#hasValidCheckDigits(digits)) {
      throw Cpf.#error('CPF inválido.');
    }
    return digits;
  }

  static #hasValidCheckDigits(digits) {
    // Sequências como 000.000.000-00 passam no cálculo, mas não são CPFs emitidos.
    if (/^(\d)\1+$/.test(digits)) return false;

    const base = digits.slice(0, 9);
    const firstCheckDigit = Cpf.#calculateCheckDigit(base);
    const secondCheckDigit = Cpf.#calculateCheckDigit(base + firstCheckDigit);

    return digits.endsWith(`${firstCheckDigit}${secondCheckDigit}`);
  }

  /**
   * Cada dígito é multiplicado por um peso decrescente que termina em 2.
   * O dígito verificador é o resto de (soma * 10) / 11, sendo 10 tratado como 0.
   */
  static #calculateCheckDigit(partialDigits) {
    const firstWeight = partialDigits.length + 1;
    const sum = [...partialDigits].reduce(
      (total, digit, index) => total + Number(digit) * (firstWeight - index),
      0,
    );
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  }

  static #error(message) {
    return new ValidationError(message, { field: 'cpf' });
  }
}
