import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Cpf } from '../../../src/domain/Cpf.js';
import { ValidationError } from '../../../src/domain/errors.js';

const assertInvalid = (value, message) =>
  assert.throws(() => new Cpf(value), (error) => {
    assert.ok(error instanceof ValidationError);
    assert.equal(error.field, 'cpf');
    assert.equal(error.message, message);
    return true;
  });

describe('Cpf', () => {
  it('aceita CPFs válidos com ou sem pontuação', () => {
    for (const value of ['529.982.247-25', '52998224725', '111.444.777-35', ' 935 411 347 80 ']) {
      assert.ok(Cpf.isValid(value), `${value} deveria ser válido`);
    }
  });

  it('aceita CPF cujo dígito verificador calculado como 10 é convertido em 0', () => {
    assert.equal(new Cpf('123.456.789-09').value, '12345678909');
  });

  it('armazena somente os dígitos e formata para exibição', () => {
    const cpf = new Cpf('529.982.247-25');

    assert.equal(cpf.value, '52998224725');
    assert.equal(cpf.formatted, '529.982.247-25');
    assert.equal(String(cpf), '529.982.247-25');
  });

  it('rejeita CPF vazio ou ausente', () => {
    assertInvalid('', 'Informe o CPF.');
    assertInvalid('   ', 'Informe o CPF.');
    assertInvalid(undefined, 'Informe o CPF.');
    assertInvalid(52998224725, 'Informe o CPF.');
  });

  it('rejeita CPF com letras ou outros caracteres', () => {
    assertInvalid('529.982.247-2a', 'O CPF deve conter apenas números.');
    assertInvalid('529/982/247-25', 'O CPF deve conter apenas números.');
  });

  it('rejeita CPF com quantidade de dígitos diferente de 11', () => {
    assertInvalid('529.982.247-2', 'O CPF deve conter 11 dígitos.');
    assertInvalid('529.982.247-255', 'O CPF deve conter 11 dígitos.');
  });

  it('rejeita CPF com dígitos verificadores incorretos', () => {
    assertInvalid('529.982.247-24', 'CPF inválido.');
    assertInvalid('529.982.247-15', 'CPF inválido.');
  });

  it('rejeita CPFs formados por um único dígito repetido', () => {
    for (let digit = 0; digit <= 9; digit++) {
      assertInvalid(String(digit).repeat(11), 'CPF inválido.');
    }
  });

  it('isValid retorna false em vez de lançar erro', () => {
    assert.equal(Cpf.isValid('123'), false);
    assert.equal(Cpf.isValid(null), false);
  });

  it('compara CPFs pelo valor', () => {
    assert.ok(new Cpf('529.982.247-25').equals(new Cpf('52998224725')));
    assert.ok(!new Cpf('529.982.247-25').equals(new Cpf('111.444.777-35')));
  });
});
