import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ValidationError } from '../../../src/domain/errors.js';
import { PersonName } from '../../../src/domain/PersonName.js';

const assertInvalid = (value, message) =>
  assert.throws(() => new PersonName(value), (error) => {
    assert.ok(error instanceof ValidationError);
    assert.equal(error.field, 'name');
    assert.equal(error.message, message);
    return true;
  });

describe('PersonName', () => {
  it('aceita nomes com acentos, apóstrofos e hífens', () => {
    for (const value of ['João da Silva', "Ana D'Ávila", 'Maria-Clara Souza', 'Zoë Müller']) {
      assert.equal(new PersonName(value).value, value);
    }
  });

  it('remove espaços extras sem alterar a grafia do nome', () => {
    assert.equal(new PersonName('  maria   DA  silva ').value, 'maria DA silva');
  });

  it('exige nome e sobrenome', () => {
    assertInvalid('Maria', 'Informe o nome completo, com nome e sobrenome.');
  });

  it('rejeita nome vazio ou ausente', () => {
    assertInvalid('', 'Informe o nome completo.');
    assertInvalid('   ', 'Informe o nome completo.');
    assertInvalid(null, 'Informe o nome completo.');
  });

  it('rejeita números e símbolos', () => {
    assertInvalid('Maria 2 Silva', 'O nome deve conter apenas letras.');
    assertInvalid('Maria <script>', 'O nome deve conter apenas letras.');
    assertInvalid("Maria D'", 'O nome deve conter apenas letras.');
  });

  it('limita o tamanho do nome a 120 caracteres', () => {
    const longName = `${'a'.repeat(60)} ${'b'.repeat(60)}`;
    assertInvalid(longName, 'O nome deve ter no máximo 120 caracteres.');
  });
});
