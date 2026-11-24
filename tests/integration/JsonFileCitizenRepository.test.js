import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { Citizen } from '../../src/domain/Citizen.js';
import { CitizenSearchQuery } from '../../src/domain/CitizenSearchQuery.js';
import { CitizenAlreadyRegisteredError } from '../../src/domain/errors.js';
import { JsonFileCitizenRepository } from '../../src/infrastructure/JsonFileCitizenRepository.js';

const maria = () =>
  new Citizen({
    name: 'Maria Oliveira',
    cpf: '529.982.247-25',
    registeredAt: new Date('2026-03-10T12:30:00Z'),
  });

describe('JsonFileCitizenRepository', () => {
  let directory;
  let filePath;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'citizens-'));
    filePath = join(directory, 'nested', 'citizens.json');
  });

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  it('inicia vazio quando o arquivo ainda não existe', async () => {
    const repository = await JsonFileCitizenRepository.open(filePath);

    assert.deepEqual(await repository.search(new CitizenSearchQuery('Maria')), []);
  });

  it('grava os cidadãos no arquivo e os recupera ao reabrir', async () => {
    const repository = await JsonFileCitizenRepository.open(filePath);
    await repository.add(maria());

    const stored = JSON.parse(await readFile(filePath, 'utf8'));
    assert.deepEqual(stored, [
      { name: 'Maria Oliveira', cpf: '52998224725', registeredAt: '2026-03-10T12:30:00.000Z' },
    ]);

    const reopened = await JsonFileCitizenRepository.open(filePath);
    const [found] = await reopened.search(new CitizenSearchQuery('52998224725'));
    assert.equal(found.name.value, 'Maria Oliveira');
    assert.deepEqual(found.registeredAt, new Date('2026-03-10T12:30:00Z'));
  });

  it('rejeita CPF duplicado sem alterar o arquivo', async () => {
    const repository = await JsonFileCitizenRepository.open(filePath);
    await repository.add(maria());
    const contentBefore = await readFile(filePath, 'utf8');

    await assert.rejects(repository.add(maria()), CitizenAlreadyRegisteredError);
    assert.equal(await readFile(filePath, 'utf8'), contentBefore);
  });

  it('aceita apenas um entre cadastros simultâneos do mesmo CPF', async () => {
    const repository = await JsonFileCitizenRepository.open(filePath);

    const results = await Promise.allSettled([repository.add(maria()), repository.add(maria())]);

    assert.deepEqual(results.map(({ status }) => status).sort(), ['fulfilled', 'rejected']);
    assert.equal(JSON.parse(await readFile(filePath, 'utf8')).length, 1);
  });

  it('mantém todos os registros em cadastros simultâneos de CPFs diferentes', async () => {
    const repository = await JsonFileCitizenRepository.open(filePath);
    const citizens = [
      new Citizen({ name: 'Maria Oliveira', cpf: '529.982.247-25' }),
      new Citizen({ name: 'José Pereira', cpf: '111.444.777-35' }),
      new Citizen({ name: 'Ana Souza', cpf: '935.411.347-80' }),
      new Citizen({ name: 'Paulo Lima', cpf: '123.456.789-09' }),
    ];

    await Promise.all(citizens.map((citizen) => repository.add(citizen)));

    assert.equal(JSON.parse(await readFile(filePath, 'utf8')).length, citizens.length);
  });

  it('falha com mensagem clara quando o arquivo está corrompido', async () => {
    await writeFile(join(directory, 'broken.json'), '{ isto não é json');

    await assert.rejects(JsonFileCitizenRepository.open(join(directory, 'broken.json')), /Arquivo de dados inválido/);
  });
});
