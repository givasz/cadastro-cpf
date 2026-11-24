const CPF_LENGTH = 11;

export class CpfMask {
  /**
   * Formata progressivamente o CPF enquanto ele é digitado: "5299822" -> "529.982.2".
   */
  static apply(value) {
    return CpfMask.#digitsOf(value)
      .slice(0, CPF_LENGTH)
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
  }

  static isComplete(value) {
    return CpfMask.#digitsOf(value).length === CPF_LENGTH;
  }

  static #digitsOf(value) {
    return value.replace(/\D/g, '');
  }
}
