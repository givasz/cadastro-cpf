import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { CitizenService } from '../../../src/application/CitizenService.js';
import { CitizenAlreadyRegisteredError, ValidationError } from '../../../src/domain/errors.js';
import { InMemoryCitizenRepository } from '../../../src/infrastructure/InMemoryCitizenRepository.js';

const NOW = new Date('2026-03-10T12:30:00Z');

describe('CitizenService', () => {
  let service;

  beforeEach(() => {
    service = new CitizenService(new InMemoryCitizenRepository(), { now: () => NOW });
  });

  describe('register', () => {
    it('cadastra o cidadão e retorna os dados registrados', async () => {
      const citizen = await service.register({ name: ' Maria  Oliveira ', cpf: '529.982.247-25' });

      assert.equal(citizen.name.value, 'Maria Oliveira');
      assert.equal(citizen.cpf.formatted, '529.982.247-25');
      assert.deepEqual(citizen.registeredAt, NOW);
      assert.equal((await service.search('Maria')).length, 1);
    });

    it('não permite cadastrar o mesmo CPF duas vezes, mesmo com formatação diferente', async () => {
      await service.register({ name: 'Maria Oliveira', cpf: '529.982.247-25' });

      await assert.rejects(
        service.register({ name: 'Outra Pessoa', cpf: '52998224725' }),
        CitizenAlreadyRegisteredError,
      );
    });

    it('rejeita dados inválidos sem cadastrar nada', async () => {
      await assert.rejects(service.register({ name: 'Maria Oliveira', cpf: '529.982.247-24' }), ValidationError);
      await assert.rejects(service.register({ name: 'Maria', cpf: '529.982.247-25' }), ValidationError);

      assert.deepEqual(await service.search('529'), []);
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      await service.register({ name: 'Maria Oliveira', cpf: '529.982.247-25' });
      await service.register({ name: 'José Pereira', cpf: '111.444.777-35' });
    });

    it('pesquisa por nome', async () => {
      const [citizen] = await service.search('jose');
      assert.equal(citizen.name.value, 'José Pereira');
    });

    it('pesquisa por CPF', async () => {
      const [citizen] = await service.search('111.444.777-35');
      assert.equal(citizen.name.value, 'José Pereira');
    });

    it('retorna lista vazia quando o cidadão não está cadastrado', async () => {
      assert.deepEqual(await service.search('935.411.347-80'), []);
    });

    it('rejeita pesquisa sem termo', async () => {
      await assert.rejects(service.search(''), ValidationError);
    });
  });
});
