import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Citizen } from '../../../src/domain/Citizen.js';
import { CitizenSearchQuery } from '../../../src/domain/CitizenSearchQuery.js';
import { ValidationError } from '../../../src/domain/errors.js';

const joao = new Citizen({ name: 'João da Silva', cpf: '529.982.247-25' });
const ana = new Citizen({ name: 'Ana Souza', cpf: '111.444.777-35' });
const marcos = new Citizen({ name: 'Marcos Silveira', cpf: '935.411.347-80' });
const citizens = [joao, ana, marcos];

const namesFound = (term) => new CitizenSearchQuery(term).apply(citizens).map(({ name }) => name.value);

describe('CitizenSearchQuery', () => {
  describe('pesquisa por nome', () => {
    it('encontra por parte do nome, ignorando acentos e maiúsculas', () => {
      assert.deepEqual(namesFound('joao'), ['João da Silva']);
      assert.deepEqual(namesFound('SOUZA'), ['Ana Souza']);
    });

    it('retorna os resultados ordenados por nome', () => {
      assert.deepEqual(namesFound('silv'), ['João da Silva', 'Marcos Silveira']);
    });

    it('retorna lista vazia quando ninguém corresponde', () => {
      assert.deepEqual(namesFound('Pedro'), []);
    });

    it('exige ao menos 2 caracteres', () => {
      assert.throws(() => new CitizenSearchQuery('a'), ValidationError);
    });
  });

  describe('pesquisa por CPF', () => {
    it('encontra pelo CPF completo, com ou sem pontuação', () => {
      assert.deepEqual(namesFound('529.982.247-25'), ['João da Silva']);
      assert.deepEqual(namesFound('52998224725'), ['João da Silva']);
    });

    it('encontra por parte do CPF', () => {
      assert.deepEqual(namesFound('111.444'), ['Ana Souza']);
    });

    it('não confunde CPF com nome', () => {
      assert.deepEqual(namesFound('000.000.000-00'), []);
    });
  });

  it('rejeita termo vazio', () => {
    for (const term of ['', '   ', undefined, null]) {
      assert.throws(() => new CitizenSearchQuery(term), ValidationError);
    }
  });
});
