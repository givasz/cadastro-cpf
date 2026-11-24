import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { createApp } from '../../src/app.js';
import { CitizenService } from '../../src/application/CitizenService.js';
import { InMemoryCitizenRepository } from '../../src/infrastructure/InMemoryCitizenRepository.js';

describe('API HTTP', () => {
  let app;
  let baseUrl;
  let loggedErrors;

  const post = (path, body, headers = { 'Content-Type': 'application/json' }) =>
    fetch(`${baseUrl}${path}`, { method: 'POST', headers, body });

  const register = (citizen) => post('/api/citizens', JSON.stringify(citizen));

  const search = (term) => fetch(`${baseUrl}/api/citizens?${new URLSearchParams({ q: term })}`);

  beforeEach(async () => {
    loggedErrors = [];
    app = createApp({
      citizenService: new CitizenService(new InMemoryCitizenRepository()),
      logger: { error: (error) => loggedErrors.push(error) },
    });
    const { port } = await app.listen(0, '127.0.0.1');
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /api/citizens', () => {
    it('cadastra o cidadão e retorna os dados com mensagem de sucesso', async () => {
      const response = await register({ name: 'Maria Oliveira', cpf: '52998224725' });
      const body = await response.json();

      assert.equal(response.status, 201);
      assert.equal(body.message, 'Cidadão cadastrado com sucesso!');
      assert.equal(body.citizen.name, 'Maria Oliveira');
      assert.equal(body.citizen.cpf, '529.982.247-25');
      assert.ok(!Number.isNaN(Date.parse(body.citizen.registeredAt)));
    });

    it('responde 422 indicando o campo quando o CPF é inválido', async () => {
      const response = await register({ name: 'Maria Oliveira', cpf: '529.982.247-24' });

      assert.equal(response.status, 422);
      assert.deepEqual(await response.json(), { error: { message: 'CPF inválido.', field: 'cpf' } });
    });

    it('responde 422 indicando o campo quando o nome é inválido', async () => {
      const response = await register({ name: '', cpf: '529.982.247-25' });

      assert.equal(response.status, 422);
      assert.equal((await response.json()).error.field, 'name');
    });

    it('responde 409 quando o CPF já está cadastrado', async () => {
      await register({ name: 'Maria Oliveira', cpf: '529.982.247-25' });
      const response = await register({ name: 'Outra Pessoa', cpf: '529.982.247-25' });

      assert.equal(response.status, 409);
      assert.equal((await response.json()).error.field, 'cpf');
    });

    it('responde 415 quando o corpo não é JSON', async () => {
      const response = await post('/api/citizens', 'name=Maria', { 'Content-Type': 'text/plain' });
      assert.equal(response.status, 415);
    });

    it('responde 400 quando o JSON é malformado', async () => {
      const response = await post('/api/citizens', '{"name":');
      assert.equal(response.status, 400);
    });

    it('responde 422 quando o corpo JSON é nulo', async () => {
      const response = await post('/api/citizens', 'null');
      assert.equal(response.status, 422);
    });

    it('responde 413 quando o corpo é grande demais', async () => {
      const response = await register({ name: 'a'.repeat(20_000), cpf: '529.982.247-25' });
      assert.equal(response.status, 413);
    });
  });

  describe('GET /api/citizens', () => {
    beforeEach(async () => {
      await register({ name: 'Maria Oliveira', cpf: '529.982.247-25' });
      await register({ name: 'José Pereira', cpf: '111.444.777-35' });
    });

    it('encontra cidadão pelo nome', async () => {
      const response = await search('josé');

      assert.equal(response.status, 200);
      const { citizens } = await response.json();
      assert.deepEqual(
        citizens.map(({ name, cpf }) => ({ name, cpf })),
        [{ name: 'José Pereira', cpf: '111.444.777-35' }],
      );
    });

    it('encontra cidadão pelo CPF', async () => {
      const { citizens } = await (await search('52998224725')).json();
      assert.equal(citizens[0].name, 'Maria Oliveira');
    });

    it('retorna lista vazia quando o cidadão não está cadastrado', async () => {
      const response = await search('935.411.347-80');

      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { citizens: [] });
    });

    it('responde 422 quando o termo de pesquisa não é informado', async () => {
      const response = await fetch(`${baseUrl}/api/citizens`);
      assert.equal(response.status, 422);
    });
  });

  describe('roteamento', () => {
    it('responde 404 para rotas de API inexistentes', async () => {
      const response = await fetch(`${baseUrl}/api/unknown`);
      assert.equal(response.status, 404);
    });

    it('responde 405 informando os métodos permitidos', async () => {
      const response = await fetch(`${baseUrl}/api/citizens`, { method: 'DELETE' });

      assert.equal(response.status, 405);
      assert.equal(response.headers.get('allow'), 'GET, POST');
    });

    it('não expõe detalhes de erros inesperados', async () => {
      await app.close();
      const failingService = { search: async () => Promise.reject(new Error('falha no banco')) };
      app = createApp({
        citizenService: failingService,
        logger: { error: (error) => loggedErrors.push(error) },
      });
      const { port } = await app.listen(0, '127.0.0.1');

      const response = await fetch(`http://127.0.0.1:${port}/api/citizens?q=maria`);
      const body = await response.json();

      assert.equal(response.status, 500);
      assert.doesNotMatch(body.error.message, /banco/);
      assert.equal(loggedErrors.length, 1);
    });
  });

  describe('arquivos estáticos', () => {
    it('serve a página inicial', async () => {
      const response = await fetch(`${baseUrl}/`);

      assert.equal(response.status, 200);
      assert.match(response.headers.get('content-type'), /text\/html/);
      assert.match(await response.text(), /Cadastro de Cidadãos/);
    });

    it('serve os módulos de domínio usados pela interface', async () => {
      const response = await fetch(`${baseUrl}/domain/Cpf.js`);

      assert.equal(response.status, 200);
      assert.match(response.headers.get('content-type'), /text\/javascript/);
    });

    it('não permite acessar arquivos fora dos diretórios publicados', async () => {
      for (const path of ['/..%2fpackage.json', '/domain/..%2f..%2fpackage.json', '/%2e%2e/src/server.js']) {
        const response = await fetch(`${baseUrl}${path}`);
        assert.equal(response.status, 404, path);
      }
    });

    it('responde 404 para arquivos inexistentes', async () => {
      const response = await fetch(`${baseUrl}/nao-existe.html`);
      assert.equal(response.status, 404);
    });
  });
});
