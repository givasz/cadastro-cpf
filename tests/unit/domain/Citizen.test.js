import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Citizen } from '../../../src/domain/Citizen.js';
import { ValidationError } from '../../../src/domain/errors.js';

describe('Citizen', () => {
  it('cria um cidadão a partir de nome, CPF e data de cadastro', () => {
    const registeredAt = new Date('2026-01-15T10:00:00Z');
    const citizen = new Citizen({ name: 'João da Silva', cpf: '529.982.247-25', registeredAt });

    assert.equal(citizen.name.value, 'João da Silva');
    assert.equal(citizen.cpf.value, '52998224725');
    assert.deepEqual(citizen.registeredAt, registeredAt);
  });

  it('não permite alterar a data de cadastro por referência', () => {
    const citizen = new Citizen({ name: 'João da Silva', cpf: '529.982.247-25' });

    citizen.registeredAt.setFullYear(1990);

    assert.notEqual(citizen.registeredAt.getFullYear(), 1990);
  });

  it('propaga os erros de validação de nome e CPF', () => {
    assert.throws(() => new Citizen({ name: 'João', cpf: '529.982.247-25' }), ValidationError);
    assert.throws(() => new Citizen({ name: 'João da Silva', cpf: '123' }), ValidationError);
  });

  it('rejeita data de cadastro inválida', () => {
    assert.throws(
      () => new Citizen({ name: 'João da Silva', cpf: '529.982.247-25', registeredAt: new Date('x') }),
      TypeError,
    );
  });
});
